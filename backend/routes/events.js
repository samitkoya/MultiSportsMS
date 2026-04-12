// ============================================================
// Events (Tournaments) Routes — Full CRUD + Team Registration
// ============================================================
// SQL Concepts: INSERT, UPDATE, DELETE, SELECT + JOIN,
//               VIEW usage, aggregation, GROUP BY, CASCADE
// ============================================================

const express = require('express');
const router = express.Router();

// GET /api/events — List all tournaments
// SQL: SELECT + JOIN with sports
router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { sport_id, status } = req.query;

        let sql = `
            SELECT 
                e.event_id, e.name, e.event_type, e.format,
                e.start_date, e.end_date, e.status, e.description, e.created_at, e.event_image_url,
                s.sport_id, s.name AS sport_name,
                COUNT(et.team_id) AS team_count
            FROM events e
            JOIN sports s ON e.sport_id = s.sport_id
            LEFT JOIN event_teams et ON e.event_id = et.event_id
        `;

        const conditions = [];
        const params = [];

        if (sport_id) {
            conditions.push('e.sport_id = ?');
            params.push(sport_id);
        }
        if (status) {
            conditions.push('e.status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY e.event_id ORDER BY e.start_date DESC';

        const events = db.prepare(sql).all(...params);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/events/:id — Tournament detail + registered teams + matches
// SQL: VIEW + JOIN
router.get('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;

        const event = db.prepare(`
            SELECT e.*, s.name AS sport_name, s.sport_id
            FROM events e
            JOIN sports s ON e.sport_id = s.sport_id
            WHERE e.event_id = ?
        `).get(req.params.id);

        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Registered teams
        const teams = db.prepare(`
            SELECT t.team_id, t.name, t.status, et.seed_rank, et.registered_at
            FROM event_teams et
            JOIN teams t ON et.team_id = t.team_id
            WHERE et.event_id = ?
            ORDER BY et.seed_rank
        `).all(req.params.id);

        // Matches in this event
        const matches = db.prepare(`
            SELECT 
                m.match_id, m.match_date, m.status, m.round_name, m.result_summary,
                v.name AS venue_name,
                GROUP_CONCAT(t.name, ' vs ') AS team_names
            FROM matches m
            LEFT JOIN venues v ON m.venue_id = v.venue_id
            LEFT JOIN match_teams mt ON m.match_id = mt.match_id
            LEFT JOIN teams t ON mt.team_id = t.team_id
            WHERE m.event_id = ?
            GROUP BY m.match_id
            ORDER BY m.match_date
        `).all(req.params.id);

        res.json({ ...event, teams, matches });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/events — Create tournament
// SQL: INSERT
router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { name, sport_id, event_type, format, start_date, end_date, description, event_image_url } = req.body;

        if (!name || !sport_id || !start_date) {
            return res.status(400).json({ error: 'Name, sport, and start date are required' });
        }

        const result = db.prepare(`
            INSERT INTO events (name, sport_id, event_type, format, start_date, end_date, description, event_image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, sport_id, event_type || 'tournament', format || null, start_date, end_date || null, description || null, event_image_url || null);

        const event = db.prepare('SELECT * FROM events WHERE event_id = ?').get(result.lastInsertRowid);
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/events/:id — Edit tournament
// SQL: UPDATE
router.put('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { name, event_type, format, start_date, end_date, status, description, event_image_url } = req.body;

        const existing = db.prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Event not found' });

        db.prepare(`
            UPDATE events 
            SET name = ?, event_type = ?, format = ?, start_date = ?, 
                end_date = ?, status = ?, description = ?, event_image_url = ?
            WHERE event_id = ?
        `).run(
            name || existing.name,
            event_type || existing.event_type,
            format !== undefined ? format : existing.format,
            start_date || existing.start_date,
            end_date !== undefined ? end_date : existing.end_date,
            status || existing.status,
            description !== undefined ? description : existing.description,
            event_image_url !== undefined ? event_image_url : existing.event_image_url,
            req.params.id
        );

        const event = db.prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id);
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/events/:id — Delete tournament
// SQL: DELETE + CASCADE (matches, match_teams, etc.)
router.delete('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const existing = db.prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Event not found' });

        db.prepare('DELETE FROM events WHERE event_id = ?').run(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/events/:id/teams — Register team to tournament
// SQL: INSERT into event_teams (junction table)
router.post('/:id/teams', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { team_id, seed_rank } = req.body;

        if (!team_id) return res.status(400).json({ error: 'team_id is required' });

        // Validate event exists
        const event = db.prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Validate team exists and is in the same sport
        const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(team_id);
        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (team.sport_id !== event.sport_id) {
            return res.status(400).json({ error: 'Team sport does not match event sport' });
        }

        db.prepare(`
            INSERT INTO event_teams (event_id, team_id, seed_rank) VALUES (?, ?, ?)
        `).run(req.params.id, team_id, seed_rank || null);

        res.status(201).json({ message: 'Team registered to event', event_id: req.params.id, team_id });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint') || err.message.includes('PRIMARY KEY')) {
            return res.status(409).json({ error: 'Team is already registered in this event' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/events/:id/teams/:tid — Remove team from tournament
// SQL: DELETE from event_teams
router.delete('/:id/teams/:tid', (req, res) => {
    try {
        const db = req.app.locals.db;
        db.prepare('DELETE FROM event_teams WHERE event_id = ? AND team_id = ?')
            .run(req.params.id, req.params.tid);

        res.json({ message: 'Team removed from event' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/events/:id/standings — Team standings table
// SQL: Aggregation + GROUP BY (uses the v_team_standings view concept)
router.get('/:id/standings', (req, res) => {
    try {
        const db = req.app.locals.db;

        const standings = db.prepare(`
            SELECT * FROM v_team_standings
            WHERE event_id = ?
            ORDER BY points DESC, wins DESC
        `).all(req.params.id);

        res.json(standings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
