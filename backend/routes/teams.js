// ============================================================
// Teams Routes - Full CRUD + Roster Management
// ============================================================

const express = require('express');
const router = express.Router();
const { syncPlayerPrimaryMembership } = require('../utils/playerMemberships');

const MEMBERSHIP_TYPES = new Set(['club', 'country', 'loan', 'academy', 'other']);

function getTeamRoster(db, teamId) {
    return db.prepare(`
        SELECT
            p.player_id,
            p.first_name,
            p.last_name,
            p.email,
            p.date_of_birth,
            p.gender,
            p.status,
            p.joined_date,
            ptm.membership_id,
            ptm.membership_type,
            ptm.jersey_number,
            ptm.position,
            ptm.start_date,
            ptm.end_date,
            ptm.notes
        FROM player_team_memberships ptm
        JOIN players p ON ptm.player_id = p.player_id
        WHERE ptm.team_id = ? AND ptm.is_active = 1 AND p.is_deleted = 0
        ORDER BY
            CASE ptm.membership_type
                WHEN 'club' THEN 1
                WHEN 'country' THEN 2
                WHEN 'loan' THEN 3
                WHEN 'academy' THEN 4
                ELSE 5
            END,
            ptm.jersey_number,
            p.last_name,
            p.first_name
    `).all(teamId);
}

// GET /api/teams - List all teams with sport, coach, player count
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
                COUNT(DISTINCT p.player_id) AS player_count
            FROM teams t
            JOIN sports s ON t.sport_id = s.sport_id
            LEFT JOIN coaches c ON t.coach_id = c.coach_id
            LEFT JOIN venues v ON t.home_venue_id = v.venue_id
            LEFT JOIN player_team_memberships ptm ON t.team_id = ptm.team_id AND ptm.is_active = 1
            LEFT JOIN players p ON ptm.player_id = p.player_id AND p.is_deleted = 0
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

// GET /api/teams/:id - Team detail with full roster
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
            JOIN sports s ON t.sport_id = s.sport_id
            LEFT JOIN coaches c ON t.coach_id = c.coach_id
            LEFT JOIN venues v ON t.home_venue_id = v.venue_id
            WHERE t.team_id = ?
        `).get(req.params.id);

        if (!team) return res.status(404).json({ error: 'Team not found' });

        const players = getTeamRoster(db, req.params.id);

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

// POST /api/teams - Create team
router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { name, sport_id, coach_id, founded_year, home_venue_id, team_image_url } = req.body;

        if (!name || !sport_id) {
            return res.status(400).json({ error: 'Team name and sport are required' });
        }

        const sport = db.prepare('SELECT sport_id FROM sports WHERE sport_id = ?').get(sport_id);
        if (!sport) return res.status(400).json({ error: 'Invalid sport_id' });

        if (coach_id) {
            const coach = db.prepare('SELECT coach_id FROM coaches WHERE coach_id = ?').get(coach_id);
            if (!coach) return res.status(400).json({ error: 'Invalid coach_id' });
        }

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

// PUT /api/teams/:id - Edit team
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
            req.params.id,
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

// DELETE /api/teams/:id - Delete team while preserving player identities
router.delete('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const existing = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Team not found' });

        const affectedPlayers = db.prepare(`
            SELECT DISTINCT player_id
            FROM player_team_memberships
            WHERE team_id = ? AND is_active = 1
        `).all(req.params.id);

        const runDelete = db.transaction(() => {
            db.prepare('UPDATE players SET team_id = NULL, jersey_number = NULL, position = NULL WHERE team_id = ?')
                .run(req.params.id);

            db.prepare(`
                UPDATE player_team_memberships
                SET is_active = 0, end_date = COALESCE(end_date, CURRENT_DATE)
                WHERE team_id = ? AND is_active = 1
            `).run(req.params.id);

            for (const player of affectedPlayers) {
                syncPlayerPrimaryMembership(db, player.player_id);
            }

            db.prepare('DELETE FROM teams WHERE team_id = ?').run(req.params.id);
        });

        runDelete();

        res.json({
            message: 'Team deleted successfully',
            affected_players: affectedPlayers.length,
            note: 'Player records were preserved and any active memberships for this team were closed.',
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/teams/:id/players - Get active roster
router.get('/:id/players', (req, res) => {
    try {
        const db = req.app.locals.db;
        const players = getTeamRoster(db, req.params.id);
        res.json(players);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/teams/:id/players - Add an active membership for an existing player
router.post('/:id/players', (req, res) => {
    try {
        const db = req.app.locals.db;
        const {
            player_id,
            jersey_number,
            position,
            membership_type = 'club',
            start_date,
            end_date,
            notes,
        } = req.body;

        if (!player_id) return res.status(400).json({ error: 'player_id is required' });
        if (!MEMBERSHIP_TYPES.has(membership_type)) {
            return res.status(400).json({ error: 'Invalid membership_type' });
        }

        const team = db.prepare('SELECT team_id, sport_id FROM teams WHERE team_id = ?').get(req.params.id);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const player = db.prepare('SELECT * FROM players WHERE player_id = ? AND is_deleted = 0').get(player_id);
        if (!player) return res.status(404).json({ error: 'Player not found' });

        const existingMembership = db.prepare(`
            SELECT membership_id
            FROM player_team_memberships
            WHERE player_id = ? AND team_id = ? AND membership_type = ? AND is_active = 1
        `).get(player_id, req.params.id, membership_type);

        if (existingMembership) {
            return res.status(409).json({ error: 'Player already has this active membership for the selected team' });
        }
        const activeSports = db.prepare(`
            SELECT DISTINCT t.sport_id
            FROM player_team_memberships ptm
            JOIN teams t ON ptm.team_id = t.team_id
            WHERE ptm.player_id = ? AND ptm.is_active = 1
        `).all(player_id);

        if (activeSports[0] && activeSports[0].sport_id !== team.sport_id) {
            return res.status(400).json({ error: 'Cannot assign a player to teams across different sports' });
        }

        const runAssign = db.transaction(() => {
            db.prepare(`
                INSERT INTO player_team_memberships
                    (player_id, team_id, jersey_number, position, membership_type, is_active, start_date, end_date, notes)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
            `).run(
                player_id,
                req.params.id,
                jersey_number || null,
                position || null,
                membership_type,
                start_date || null,
                end_date || null,
                notes || null,
            );

            syncPlayerPrimaryMembership(db, Number(player_id));
        });

        runAssign();

        res.json({ message: 'Player added to team', player_id, membership_type });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Player already has an active membership like this' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/teams/:id/players/:pid - Remove active memberships between a player and team
router.delete('/:id/players/:pid', (req, res) => {
    try {
        const db = req.app.locals.db;

        const runRemove = db.transaction(() => {
            db.prepare(`
                UPDATE player_team_memberships
                SET is_active = 0, end_date = COALESCE(end_date, CURRENT_DATE)
                WHERE player_id = ? AND team_id = ? AND is_active = 1
            `).run(req.params.pid, req.params.id);

            syncPlayerPrimaryMembership(db, Number(req.params.pid));
        });

        runRemove();

        res.json({ message: 'Player removed from team' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
