// ============================================================
// Multi-Sports Management System — Express Server
// ============================================================
// Entry point for the backend. Serves the API and static frontend files.
// Uses raw SQL queries only — no ORM.
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Async startup ----
(async () => {
    // Initialize Database (async because sql.js needs to load WASM)
    const db = await initializeDatabase();

    // Make db accessible to routes
    app.locals.db = db;

    // ---- API Routes ----
    app.use('/api/sports',    require('./routes/sports'));
    app.use('/api/coaches',   require('./routes/coaches'));
    app.use('/api/venues',    require('./routes/venues'));
    app.use('/api/teams',     require('./routes/teams'));
    app.use('/api/players',   require('./routes/players'));
    app.use('/api/events',    require('./routes/events'));
    app.use('/api/matches',   require('./routes/matches'));
    app.use('/api/dashboard', require('./routes/dashboard'));

    // ---- Serve Frontend (static files) ----
    app.use(express.static(path.join(__dirname, '..', 'frontend2', 'dist')));

    // SPA fallback: serve index.html for any unmatched route
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'frontend2', 'dist', 'index.html'));
    });

    // ---- Global Error Handler ----
    app.use((err, req, res, next) => {
        console.error('[ERROR]', err.message);
        console.error(err.stack);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    });

    // ---- Auto-save database periodically (every 30 seconds) ----
    setInterval(() => {
        try { db.save(); } catch (e) {}
    }, 30000);

    // ---- Start Server ----
    app.listen(PORT, () => {
        console.log(`\n===========================================`);
        console.log(`  Multi-Sports Management System`);
        console.log(`  Server running on http://localhost:${PORT}`);
        console.log(`===========================================\n`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n[SERVER] Shutting down...');
        db.close();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n[SERVER] Shutting down...');
        db.close();
        process.exit(0);
    });
})();
