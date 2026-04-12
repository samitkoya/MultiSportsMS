// ============================================================
// Coaches Routes — Full CRUD
// ============================================================
// SQL Concepts: INSERT, UPDATE, DELETE, SELECT with LEFT JOIN,
//               COUNT, GROUP BY, ON DELETE SET NULL observed
// ============================================================

const express = require('express');
const router = express.Router();

// GET /api/coaches — List all coaches with team count
// SQL: SELECT with LEFT JOIN to count managed teams
router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const coaches = db.prepare(`
            SELECT 
                c.coach_id, c.first_name, c.last_name, c.email, c.phone,
                c.specialization, c.experience_years, c.coach_image_url, c.created_at,
                COUNT(t.team_id) AS team_count,
                GROUP_CONCAT(t.name, ', ') AS team_names
            FROM coaches c
            LEFT JOIN teams t ON c.coach_id = t.coach_id
            GROUP BY c.coach_id
            ORDER BY c.last_name, c.first_name
        `).all();

        res.json(coaches);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/coaches/:id — Coach detail
router.get('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const coach = db.prepare(`
            SELECT coach_id, first_name, last_name, email, phone,
                   specialization, experience_years, coach_image_url, created_at
            FROM coaches WHERE coach_id = ?
        `).get(req.params.id);

        if (!coach) return res.status(404).json({ error: 'Coach not found' });

        // Get teams managed by this coach
        const teams = db.prepare(`
            SELECT t.team_id, t.name, s.name AS sport_name
            FROM teams t
            JOIN sports s ON t.sport_id = s.sport_id
            WHERE t.coach_id = ?
        `).all(req.params.id);

        res.json({ ...coach, teams });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/coaches — Create coach
// SQL: INSERT into coaches
router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { first_name, last_name, email, phone, specialization, experience_years, coach_image_url } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        const result = db.prepare(`
            INSERT INTO coaches (first_name, last_name, email, phone, specialization, experience_years, coach_image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(first_name, last_name, email || null, phone || null, specialization || null, experience_years || 0, coach_image_url || null);

        const coach = db.prepare('SELECT * FROM coaches WHERE coach_id = ?').get(result.lastInsertRowid);
        res.status(201).json(coach);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A coach with this email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/coaches/:id — Update coach
// SQL: UPDATE coaches SET ... WHERE
router.put('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { first_name, last_name, email, phone, specialization, experience_years, coach_image_url } = req.body;

        const existing = db.prepare('SELECT * FROM coaches WHERE coach_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Coach not found' });

        db.prepare(`
            UPDATE coaches 
            SET first_name = ?, last_name = ?, email = ?, phone = ?, 
                specialization = ?, experience_years = ?, coach_image_url = ?
            WHERE coach_id = ?
        `).run(
            first_name || existing.first_name,
            last_name || existing.last_name,
            email !== undefined ? email : existing.email,
            phone !== undefined ? phone : existing.phone,
            specialization !== undefined ? specialization : existing.specialization,
            experience_years !== undefined ? experience_years : existing.experience_years,
            coach_image_url !== undefined ? coach_image_url : existing.coach_image_url,
            req.params.id
        );

        const coach = db.prepare('SELECT * FROM coaches WHERE coach_id = ?').get(req.params.id);
        res.json(coach);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A coach with this email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/coaches/:id — Delete coach
// SQL: DELETE + ON DELETE SET NULL observed (teams.coach_id becomes NULL)
router.delete('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const existing = db.prepare('SELECT * FROM coaches WHERE coach_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Coach not found' });

        // Check how many teams will lose their coach (SET NULL cascade)
        const affectedTeams = db.prepare(
            'SELECT COUNT(*) AS count FROM teams WHERE coach_id = ?'
        ).get(req.params.id).count;

        db.prepare('DELETE FROM coaches WHERE coach_id = ?').run(req.params.id);

        res.json({ 
            message: 'Coach deleted successfully',
            affected_teams: affectedTeams,
            note: affectedTeams > 0 ? `${affectedTeams} team(s) now have no coach (SET NULL cascade)` : undefined
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
