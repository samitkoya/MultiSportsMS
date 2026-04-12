const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const venues = db.prepare(`
            SELECT
                v.venue_id,
                v.name,
                v.location,
                v.capacity,
                v.surface_type,
                v.created_at,
                COUNT(DISTINCT t.team_id) AS home_team_count,
                COUNT(DISTINCT m.match_id) AS scheduled_match_count
            FROM venues v
            LEFT JOIN teams t ON t.home_venue_id = v.venue_id
            LEFT JOIN matches m ON m.venue_id = v.venue_id
            GROUP BY v.venue_id
            ORDER BY v.name
        `).all();

        res.json(venues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const venue = db.prepare(`
            SELECT venue_id, name, location, capacity, surface_type, created_at
            FROM venues
            WHERE venue_id = ?
        `).get(req.params.id);

        if (!venue) return res.status(404).json({ error: 'Venue not found' });

        const homeTeams = db.prepare(`
            SELECT team_id, name, status
            FROM teams
            WHERE home_venue_id = ?
            ORDER BY name
        `).all(req.params.id);

        const matches = db.prepare(`
            SELECT match_id, match_date, status, round_name
            FROM matches
            WHERE venue_id = ?
            ORDER BY match_date DESC
            LIMIT 10
        `).all(req.params.id);

        res.json({ ...venue, home_teams: homeTeams, recent_matches: matches });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { name, location, capacity, surface_type } = req.body;

        if (!name || !location) {
            return res.status(400).json({ error: 'Venue name and location are required' });
        }

        const result = db.prepare(`
            INSERT INTO venues (name, location, capacity, surface_type)
            VALUES (?, ?, ?, ?)
        `).run(name, location, capacity || null, surface_type || 'Standard');

        const venue = db.prepare('SELECT * FROM venues WHERE venue_id = ?').get(result.lastInsertRowid);
        res.status(201).json(venue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { name, location, capacity, surface_type } = req.body;

        const existing = db.prepare('SELECT * FROM venues WHERE venue_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Venue not found' });

        db.prepare(`
            UPDATE venues
            SET name = ?, location = ?, capacity = ?, surface_type = ?
            WHERE venue_id = ?
        `).run(
            name || existing.name,
            location || existing.location,
            capacity !== undefined ? capacity : existing.capacity,
            surface_type !== undefined ? surface_type : existing.surface_type,
            req.params.id,
        );

        const venue = db.prepare('SELECT * FROM venues WHERE venue_id = ?').get(req.params.id);
        res.json(venue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const existing = db.prepare('SELECT * FROM venues WHERE venue_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Venue not found' });

        const affectedTeams = db.prepare('SELECT COUNT(*) AS count FROM teams WHERE home_venue_id = ?').get(req.params.id).count;
        const affectedMatches = db.prepare('SELECT COUNT(*) AS count FROM matches WHERE venue_id = ?').get(req.params.id).count;

        db.prepare('DELETE FROM venues WHERE venue_id = ?').run(req.params.id);

        res.json({
            message: 'Venue deleted successfully',
            affected_teams: affectedTeams,
            affected_matches: affectedMatches,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
