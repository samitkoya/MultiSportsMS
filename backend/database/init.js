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

    db.run(`
        CREATE TABLE IF NOT EXISTS player_team_memberships (
            membership_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id        INTEGER NOT NULL,
            team_id          INTEGER NOT NULL,
            jersey_number    INTEGER,
            position         TEXT,
            membership_type  TEXT    NOT NULL DEFAULT 'club' CHECK (membership_type IN ('club', 'country', 'loan', 'academy', 'other')),
            is_active        BOOLEAN DEFAULT 1,
            start_date       DATE    DEFAULT CURRENT_DATE,
            end_date         DATE,
            notes            TEXT,
            created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (player_id, team_id, membership_type, is_active),
            FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
            FOREIGN KEY (team_id)   REFERENCES teams(team_id)   ON DELETE CASCADE
        )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_memberships_player ON player_team_memberships(player_id, is_active)');
    db.run('CREATE INDEX IF NOT EXISTS idx_memberships_team ON player_team_memberships(team_id, is_active)');

    db.run(`
        INSERT OR IGNORE INTO player_team_memberships
            (player_id, team_id, jersey_number, position, membership_type, is_active, start_date)
        SELECT
            player_id,
            team_id,
            jersey_number,
            position,
            'club',
            CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END,
            joined_date
        FROM players
        WHERE team_id IS NOT NULL
    `);

    // Recreate views that depend on player/team relationships.
    db.run('DROP VIEW IF EXISTS v_player_statistics');
    db.run('DROP VIEW IF EXISTS v_top_scorers');
    db.run('DROP VIEW IF EXISTS v_team_roster');
    db.run(`
        CREATE VIEW IF NOT EXISTS v_player_statistics AS
        SELECT
            p.player_id,
            p.first_name || ' ' || p.last_name AS player_name,
            t.name AS team_name,
            s.name AS sport_name,
            s.sport_id,
            COUNT(pms.match_id) AS matches_played,
            COALESCE(SUM(pms.runs_scored), 0) AS total_runs,
            COALESCE(SUM(pms.balls_faced), 0) AS total_balls_faced,
            COALESCE(SUM(pms.wickets_taken), 0) AS total_wickets,
            COALESCE(SUM(pms.goals_scored), 0) AS total_goals,
            COALESCE(SUM(pms.assists), 0) AS total_assists,
            COALESCE(SUM(pms.yellow_cards), 0) AS total_yellow_cards,
            COALESCE(SUM(pms.red_cards), 0) AS total_red_cards,
            COALESCE(SUM(pms.points_won), 0) AS total_points_won,
            COALESCE(SUM(pms.sets_won), 0) AS total_sets_won,
            COALESCE(SUM(pms.games_won), 0) AS total_games_won,
            ROUND(AVG(pms.rating), 2) AS avg_rating
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.team_id
        LEFT JOIN sports s ON t.sport_id = s.sport_id
        LEFT JOIN player_match_stats pms ON p.player_id = pms.player_id
        WHERE p.is_deleted = 0
        GROUP BY p.player_id
    `);
    db.run(`
        CREATE VIEW IF NOT EXISTS v_top_scorers AS
        SELECT
            p.player_id,
            p.first_name || ' ' || p.last_name AS player_name,
            t.name AS team_name,
            s.name AS sport_name,
            s.sport_id,
            CASE
                WHEN s.name = 'Cricket'   THEN COALESCE(SUM(pms.runs_scored), 0)
                WHEN s.name = 'Football'  THEN COALESCE(SUM(pms.goals_scored), 0)
                WHEN s.name = 'Tennis'    THEN COALESCE(SUM(pms.points_won), 0)
                WHEN s.name = 'Badminton' THEN COALESCE(SUM(pms.points_won), 0)
                ELSE 0
            END AS score_total,
            COUNT(pms.match_id) AS matches_played
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.team_id
        LEFT JOIN sports s ON t.sport_id = s.sport_id
        LEFT JOIN player_match_stats pms ON p.player_id = pms.player_id
        WHERE p.is_deleted = 0
        GROUP BY p.player_id
        HAVING score_total > 0
        ORDER BY sport_name, score_total DESC
    `);
    db.run(`
        CREATE VIEW IF NOT EXISTS v_team_roster AS
        SELECT
            t.team_id,
            t.name AS team_name,
            t.status AS team_status,
            t.founded_year,
            s.name AS sport_name,
            s.sport_id,
            COALESCE(c.first_name || ' ' || c.last_name, 'No Coach') AS coach_name,
            c.coach_id,
            COALESCE(v.name, 'No Home Venue') AS home_venue,
            v.venue_id,
            COUNT(DISTINCT ptm.player_id) AS player_count
        FROM teams t
        JOIN sports s ON t.sport_id = s.sport_id
        LEFT JOIN coaches c ON t.coach_id = c.coach_id
        LEFT JOIN venues v ON t.home_venue_id = v.venue_id
        LEFT JOIN player_team_memberships ptm ON t.team_id = ptm.team_id AND ptm.is_active = 1
        GROUP BY t.team_id
    `);
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
        this.save();
    }

    /**
     * Prepare a statement and return an object with .get(), .all(), .run() methods.
     * Mimics better-sqlite3's prepared statement API.
     */
    prepare(sql) {
        const db = this._db;
        const self = this;

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

                self.save();

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
                self.save();
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
