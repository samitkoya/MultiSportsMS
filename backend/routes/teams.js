// ============================================================
// Teams Routes — Full CRUD + Roster Management
// ============================================================
// SQL Concepts: INSERT with FK validation, UPDATE, DELETE + CASCADE,
//               JOIN, GROUP BY, LEFT JOIN, subquery
// ============================================================

const express = require('express');
const router = express.Router();

// GET /api/teams — List all teams with sport, coach, player count
// SQL: JOIN teams with sports, LEFT JOIN coaches and players, GROUP BY
router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { sport_id, status } = req.query;

        let sql = `
            SELECT 
                t.team_id, t.name, t.status, t.founded_year, t.created_at,
                t.team_image_url,
                s.sport_id, s.name AS sport_name,
                COALESCE(c.first_name || ' ' || c.last_name, 'No Coach') AS coach_name,
                c.coach_id,
                COALESCE(v.name, 'No Home Venue') AS home_venue,
                COALESCE(v.name, 'No Home Venue') AS venue_name,
                v.venue_id AS home_venue_id,
                COUNT(p.player_id) AS player_count
            FROM teams t
            JOIN sports s       ON t.sport_id      = s.sport_id
            LEFT JOIN coaches c ON t.coach_id      = c.coach_id
            LEFT JOIN venues v  ON t.home_venue_id = v.venue_id
            LEFT JOIN players p ON t.team_id       = p.team_id AND p.is_deleted = 0
        `;

        const conditions = [];
        const params = [];

        if (sport_id) {
            conditions.push('t.sport_id = ?');
            params.push(sport_id);
        }
        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY t.team_id ORDER BY s.name, t.name';

        const teams = db.prepare(sql).all(...params);
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/teams/:id — Team detail with full roster
// SQL: LEFT JOIN, subquery for match count
router.get('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const team = db.prepare(`
            SELECT 
                t.team_id, t.name, t.status, t.founded_year, t.created_at,
                t.team_image_url,
                s.sport_id, s.name AS sport_name, s.max_players_per_team,
                COALESCE(c.first_name || ' ' || c.last_name, 'No Coach') AS coach_name,
                c.coach_id,
                COALESCE(v.name, 'No Home Venue') AS home_venue,
                v.venue_id AS home_venue_id
            FROM teams t
            JOIN sports s       ON t.sport_id      = s.sport_id
            LEFT JOIN coaches c ON t.coach_id      = c.coach_id
            LEFT JOIN venues v  ON t.home_venue_id = v.venue_id
            WHERE t.team_id = ?
        `).get(req.params.id);

        if (!team) return res.status(404).json({ error: 'Team not found' });

        // Get full roster
        const players = db.prepare(`
            SELECT player_id, first_name, last_name, email, date_of_birth,
                   gender, jersey_number, position, status, joined_date
            FROM players 
            WHERE team_id = ? AND is_deleted = 0
            ORDER BY jersey_number
        `).all(req.params.id);

        // Get match count (subquery)
        const matchCount = db.prepare(`
            SELECT COUNT(*) AS count 
            FROM match_teams 
            WHERE team_id = ?
        `).get(req.params.id).count;

        res.json({ ...team, players, match_count: matchCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/teams — Create team
// SQL: INSERT with FK validation
router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { name, sport_id, coach_id, founded_year, home_venue_id, team_image_url } = req.body;

        if (!name || !sport_id) {
            return res.status(400).json({ error: 'Team name and sport are required' });
        }

        // FK validation: check sport exists
        const sport = db.prepare('SELECT sport_id FROM sports WHERE sport_id = ?').get(sport_id);
        if (!sport) return res.status(400).json({ error: 'Invalid sport_id' });

        // FK validation: check coach exists (if provided)
        if (coach_id) {
            const coach = db.prepare('SELECT coach_id FROM coaches WHERE coach_id = ?').get(coach_id);
            if (!coach) return res.status(400).json({ error: 'Invalid coach_id' });
        }

        // FK validation: check venue exists (if provided)
        if (home_venue_id) {
            const venue = db.prepare('SELECT venue_id FROM venues WHERE venue_id = ?').get(home_venue_id);
            if (!venue) return res.status(400).json({ error: 'Invalid home_venue_id' });
        }

        const result = db.prepare(`
            INSERT INTO teams (name, sport_id, coach_id, founded_year, home_venue_id, team_image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, sport_id, coach_id || null, founded_year || null, home_venue_id || null, team_image_url || null);

        const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(result.lastInsertRowid);
        res.status(201).json(team);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A team with this name already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/teams/:id — Edit team
// SQL: UPDATE
router.put('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { name, coach_id, status, home_venue_id, founded_year, team_image_url } = req.body;

        const existing = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Team not found' });

        db.prepare(`
            UPDATE teams 
            SET name = ?, coach_id = ?, status = ?, home_venue_id = ?, founded_year = ?, team_image_url = ?
            WHERE team_id = ?
        `).run(
            name || existing.name,
            coach_id !== undefined ? (coach_id || null) : existing.coach_id,
            status || existing.status,
            home_venue_id !== undefined ? (home_venue_id || null) : existing.home_venue_id,
            founded_year !== undefined ? founded_year : existing.founded_year,
            team_image_url !== undefined ? (team_image_url || null) : existing.team_image_url,
            req.params.id
        );

        const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(req.params.id);
        res.json(team);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A team with this name already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/teams/:id — Delete team (cascades players)
// SQL: DELETE + CASCADE
router.delete('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const existing = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Team not found' });

        // Count players that will be cascade-deleted
        const playerCount = db.prepare(
            'SELECT COUNT(*) AS count FROM players WHERE team_id = ? AND is_deleted = 0'
        ).get(req.params.id).count;

        db.prepare('DELETE FROM teams WHERE team_id = ?').run(req.params.id);

        res.json({ 
            message: 'Team deleted successfully',
            cascade_deleted_players: playerCount,
            note: `${playerCount} player(s) were cascade-deleted along with the team`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/teams/:id/players — Get team roster
// SQL: SELECT with WHERE
router.get('/:id/players', (req, res) => {
    try {
        const db = req.app.locals.db;
        const players = db.prepare(`
            SELECT player_id, first_name, last_name, email, date_of_birth,
                   gender, jersey_number, position, status, joined_date
            FROM players 
            WHERE team_id = ? AND is_deleted = 0
            ORDER BY jersey_number
        `).all(req.params.id);

        res.json(players);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/teams/:id/players — Add existing player to team
// SQL: UPDATE player.team_id
router.post('/:id/players', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { player_id } = req.body;

        if (!player_id) return res.status(400).json({ error: 'player_id is required' });

        const team = db.prepare('SELECT team_id, sport_id FROM teams WHERE team_id = ?').get(req.params.id);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const player = db.prepare('SELECT * FROM players WHERE player_id = ? AND is_deleted = 0').get(player_id);
        if (!player) return res.status(404).json({ error: 'Player not found' });

        if (player.team_id === team.team_id) {
            return res.status(409).json({ error: 'Player is already assigned to this team' });
        }

        if (player.team_id) {
            const playerTeam = db.prepare('SELECT sport_id FROM teams WHERE team_id = ?').get(player.team_id);
            if (playerTeam && playerTeam.sport_id !== team.sport_id) {
                return res.status(400).json({ error: 'Cannot move a player across sports through team assignment' });
            }
        }

        db.prepare('UPDATE players SET team_id = ? WHERE player_id = ?').run(req.params.id, player_id);

        res.json({ message: 'Player added to team', player_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/teams/:id/players/:pid — Remove player from team
// SQL: UPDATE player.team_id = NULL
router.delete('/:id/players/:pid', (req, res) => {
    try {
        const db = req.app.locals.db;
        db.prepare('UPDATE players SET team_id = NULL WHERE player_id = ? AND team_id = ?')
            .run(req.params.pid, req.params.id);

        res.json({ message: 'Player removed from team' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
