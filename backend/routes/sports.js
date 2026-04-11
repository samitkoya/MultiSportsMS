// ============================================================
// Sports Routes - GET only (read-only reference data)
// ============================================================

const express = require('express');
const router = express.Router();

// GET /api/sports - List all sports with rules
router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const sports = db.prepare(`
            SELECT
                sport_id, name, category,
                max_players_per_team, min_players_per_team,
                scoring_unit, description, rules_json, created_at
            FROM sports
            ORDER BY sport_id
        `).all();

        const result = sports.map((sport) => ({
            ...sport,
            rules: sport.rules_json ? JSON.parse(sport.rules_json) : null,
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/sports/:id - Sport detail with teams
router.get('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;

        const sport = db.prepare(`
            SELECT
                sport_id, name, category,
                max_players_per_team, min_players_per_team,
                scoring_unit, description, rules_json, created_at
            FROM sports
            WHERE sport_id = ?
        `).get(id);

        if (!sport) {
            return res.status(404).json({ error: 'Sport not found' });
        }

        sport.rules = sport.rules_json ? JSON.parse(sport.rules_json) : null;

        const teams = db.prepare(`
            SELECT
                t.team_id, t.name, t.status, t.founded_year,
                COUNT(DISTINCT p.player_id) AS player_count,
                COALESCE(c.first_name || ' ' || c.last_name, 'No Coach') AS coach_name
            FROM teams t
            LEFT JOIN player_team_memberships ptm ON t.team_id = ptm.team_id AND ptm.is_active = 1
            LEFT JOIN players p ON ptm.player_id = p.player_id AND p.is_deleted = 0
            LEFT JOIN coaches c ON t.coach_id = c.coach_id
            WHERE t.sport_id = ?
            GROUP BY t.team_id
            ORDER BY t.name
        `).all(id);

        res.json({ ...sport, teams });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
