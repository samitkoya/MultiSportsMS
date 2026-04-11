// ============================================================
// Multi-Sports Management System — Database Initialization
// ============================================================
// Uses sql.js (pure WebAssembly SQLite) — no native compilation needed.
// Provides a wrapper that mimics better-sqlite3's synchronous API
// so route files can use the same familiar patterns.
// ============================================================

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Use /data/msms.db if on Hugging Face (Persistent Storage mount point)
// Otherwise use the local project directory.
// We check for writability to /data to avoid EACCES errors on HF.
const getDbPath = () => {
    const localPath = path.join(__dirname, 'msms.db');
    if (process.env.SPACE_ID) {
        try {
            // Check if /data exists and is writable
            const testFile = '/data/.write_test';
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            return '/data/msms.db';
        } catch (e) {
            console.warn('[DB] /data is not writable or missing. Falling back to local storage in /app.');
            return localPath;
        }
    }
    return localPath;
};

const DB_PATH = getDbPath();

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

function columnExists(db, tableName, columnName) {
    try {
        const result = db.exec(`PRAGMA table_info(${tableName})`);
        const rows = result[0]?.values || [];
        return rows.some((row) => row[1] === columnName);
    } catch (e) {
        return false;
    }
}

function applyMigrations(db) {
    if (!columnExists(db, 'teams', 'team_image_url')) {
        console.log('[DB] Applying migration: add teams.team_image_url');
        db.run('ALTER TABLE teams ADD COLUMN team_image_url TEXT');
    }
}

/**
 * Wrapper class that provides a better-sqlite3-like synchronous API
 * on top of sql.js's Database object.
 */
class DatabaseWrapper {
    constructor(sqlDb) {
        this._db = sqlDb;
    }

    /**
     * Execute raw SQL (multiple statements). Like better-sqlite3's db.exec()
     */
    exec(sql) {
        this._db.run(sql);
    }

    /**
     * Prepare a statement and return an object with .get(), .all(), .run() methods.
     * Mimics better-sqlite3's prepared statement API.
     */
    prepare(sql) {
        const db = this._db;

        return {
            /**
             * Run a query and return the first row as an object, or undefined.
             */
            get(...params) {
                const stmt = db.prepare(sql);
                if (params.length > 0) stmt.bind(params);

                const result = stmt.step();
                if (!result) {
                    stmt.free();
                    return undefined;
                }

                const columns = stmt.getColumnNames();
                const values = stmt.get();
                stmt.free();

                const row = {};
                for (let i = 0; i < columns.length; i++) {
                    row[columns[i]] = values[i];
                }
                return row;
            },

            /**
             * Run a query and return all rows as an array of objects.
             */
            all(...params) {
                const stmt = db.prepare(sql);
                if (params.length > 0) stmt.bind(params);

                const rows = [];
                const columns = stmt.getColumnNames();

                while (stmt.step()) {
                    const values = stmt.get();
                    const row = {};
                    for (let i = 0; i < columns.length; i++) {
                        row[columns[i]] = values[i];
                    }
                    rows.push(row);
                }

                stmt.free();
                return rows;
            },

            /**
             * Execute a statement (INSERT/UPDATE/DELETE) and return info.
             */
            run(...params) {
                const stmt = db.prepare(sql);
                if (params.length > 0) stmt.bind(params);
                stmt.step();
                stmt.free();

                // Get last insert rowid and changes count
                const lastInsertRowid = db.exec("SELECT last_insert_rowid() AS id")[0]?.values[0]?.[0] || 0;
                const changes = db.exec("SELECT changes() AS c")[0]?.values[0]?.[0] || 0;

                return { lastInsertRowid, changes };
            }
        };
    }

    /**
     * Set a pragma value.
     */
    pragma(pragmaStr) {
        try {
            this._db.run(`PRAGMA ${pragmaStr}`);
        } catch (e) {
            // Some pragmas may not work in sql.js, silently ignore
        }
    }

    /**
     * Execute a transaction function. Wraps in BEGIN/COMMIT/ROLLBACK.
     */
    transaction(fn) {
        const self = this;
        return function (...args) {
            self._db.run('BEGIN TRANSACTION');
            try {
                const result = fn.apply(null, args);
                self._db.run('COMMIT');
                return result;
            } catch (err) {
                self._db.run('ROLLBACK');
                throw err;
            }
        };
    }

    /**
     * Save the database to disk.
     */
    save() {
        const data = this._db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    }

    /**
     * Close and save the database.
     */
    close() {
        this.save();
        this._db.close();
    }
}

/**
 * Initialize the database: create tables, views, triggers, indexes, and seed data.
 * @param {Object} options
 * @param {boolean} options.force - Drop and recreate everything
 * @returns {Promise<DatabaseWrapper>} The initialized database wrapper
 */
async function initializeDatabase(options = {}) {
    const { force = false } = options;

    // Initialize sql.js
    const SQL = await initSqlJs();

    let db;

    // Check if database file exists and load it
    if (fs.existsSync(DB_PATH) && !force) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    const wrapper = new DatabaseWrapper(db);

    // Enable foreign keys
    wrapper.pragma('foreign_keys = ON');

    // Check if tables exist
    let tableCount = 0;
    try {
        const result = db.exec("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        tableCount = result[0]?.values[0]?.[0] || 0;
    } catch (e) {
        tableCount = 0;
    }

    if (tableCount > 0 && !force) {
        applyMigrations(db);
        wrapper.save();
        console.log('[DB] Database already initialized. Skipping schema + seed.');
        return wrapper;
    }

    if (force && tableCount > 0) {
        console.log('[DB] Force reset requested. Dropping all objects...');

        // Drop triggers first
        try {
            const triggers = db.exec("SELECT name FROM sqlite_master WHERE type='trigger'");
            if (triggers.length > 0) {
                for (const row of triggers[0].values) {
                    db.run(`DROP TRIGGER IF EXISTS "${row[0]}"`);
                }
            }
        } catch (e) {}

        // Drop views
        try {
            const views = db.exec("SELECT name FROM sqlite_master WHERE type='view'");
            if (views.length > 0) {
                for (const row of views[0].values) {
                    db.run(`DROP VIEW IF EXISTS "${row[0]}"`);
                }
            }
        } catch (e) {}

        // Drop tables
        try {
            db.run('PRAGMA foreign_keys = OFF');
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            if (tables.length > 0) {
                for (const row of tables[0].values) {
                    db.run(`DROP TABLE IF EXISTS "${row[0]}"`);
                }
            }
            db.run('PRAGMA foreign_keys = ON');
        } catch (e) {}

        console.log('[DB] All objects dropped.');
    }

    // Execute schema
    console.log('[DB] Executing schema.sql...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.run(schema);
    console.log('[DB] Schema created: 13 tables, 5 views, 4 triggers, 7 indexes.');

    // Execute seed data
    console.log('[DB] Executing seed.sql...');
    const seed = fs.readFileSync(SEED_PATH, 'utf-8');
    db.run(seed);

    applyMigrations(db);

    // Verify seed counts
    const getCnt = (table) => {
        try {
            return db.exec(`SELECT COUNT(*) FROM ${table}`)[0]?.values[0]?.[0] || 0;
        } catch (e) { return 0; }
    };

    console.log('[DB] Seed data loaded:', {
        sports: getCnt('sports'),
        venues: getCnt('venues'),
        coaches: getCnt('coaches'),
        teams: getCnt('teams'),
        players: getCnt('players'),
        events: getCnt('events'),
        matches: getCnt('matches'),
        match_events: getCnt('match_events'),
    });

    // Save to disk
    wrapper.save();

    return wrapper;
}

// If called directly, run reset
if (require.main === module) {
    (async () => {
        console.log('[DB] Running database reset...');
        const db = await initializeDatabase({ force: true });
        db.close();
        console.log('[DB] Database reset complete.');
    })();
}

module.exports = { initializeDatabase, DB_PATH };
