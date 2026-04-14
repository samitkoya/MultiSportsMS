// ============================================================
// Players Routes - Full CRUD + Transfer + Stats
// ============================================================

const express = require('express');
const router = express.Router();
const { syncPlayerPrimaryMembership } = require('../utils/playerMemberships');

const MEMBERSHIP_TYPES = new Set(['club', 'country', 'loan', 'academy', 'other']);

function isMembershipValidationError(message) {
    return [
        'Invalid membership_type',
        'membership',
        'sport',
        'Each membership',
        'Team ',
        'Duplicate active memberships',
        'registered for the sport',
    ].some((fragment) => message.includes(fragment));
}

function loadSports(db, playerIds) {
    if (!playerIds.length) return new Map();

    const placeholders = playerIds.map(() => '?').join(', ');
    const rows = db.prepare(`
        SELECT ps.player_id, ps.sport_id, s.name AS sport_name
        FROM player_sports ps
        JOIN sports s ON ps.sport_id = s.sport_id
        WHERE ps.player_id IN (${placeholders})
    `).all(...playerIds);

    const sportsByPlayer = new Map();
    for (const row of rows) {
        if (!sportsByPlayer.has(row.player_id)) {
            sportsByPlayer.set(row.player_id, []);
        }
        sportsByPlayer.get(row.player_id).push({
            sport_id: row.sport_id,
            sport_name: row.sport_name,
        });
    }
    return sportsByPlayer;
}

function loadMemberships(db, playerIds) {
    if (!playerIds.length) return new Map();

    const placeholders = playerIds.map(() => '?').join(', ');
    const rows = db.prepare(`
        SELECT
            ptm.membership_id,
            ptm.player_id,
            ptm.team_id,
            ptm.jersey_number,
            ptm.position,
            ptm.membership_type,
            ptm.is_active,
            ptm.start_date,
            ptm.end_date,
            ptm.notes,
            t.name AS team_name,
            t.sport_id,
            s.name AS sport_name
        FROM player_team_memberships ptm
        JOIN teams t ON ptm.team_id = t.team_id
        JOIN sports s ON t.sport_id = s.sport_id
        WHERE ptm.player_id IN (${placeholders})
        ORDER BY ptm.player_id, ptm.is_active DESC, ptm.membership_type, t.name
    `).all(...playerIds);

    const membershipsByPlayer = new Map();
    for (const row of rows) {
        if (!membershipsByPlayer.has(row.player_id)) {
            membershipsByPlayer.set(row.player_id, []);
        }
        membershipsByPlayer.get(row.player_id).push({
            membership_id: row.membership_id,
            team_id: row.team_id,
            team_name: row.team_name,
            sport_id: row.sport_id,
            sport_name: row.sport_name,
            jersey_number: row.jersey_number,
            position: row.position,
            membership_type: row.membership_type,
            is_active: Boolean(row.is_active),
            start_date: row.start_date,
            end_date: row.end_date,
            notes: row.notes,
        });
    }

    return membershipsByPlayer;
}

function normalizeMemberships(rawMemberships, fallbackMembership) {
    const sourceMemberships = Array.isArray(rawMemberships)
        ? rawMemberships
        : fallbackMembership
            ? [fallbackMembership]
            : [];

    return sourceMemberships
        .filter((membership) => membership && membership.team_id)
        .map((membership) => {
            const membershipType = membership.membership_type || 'club';
            if (!MEMBERSHIP_TYPES.has(membershipType)) {
                throw new Error(`Invalid membership_type: ${membershipType}`);
            }

            return {
                team_id: Number(membership.team_id),
                jersey_number:
                    membership.jersey_number === '' || membership.jersey_number === undefined || membership.jersey_number === null
                        ? null
                        : Number(membership.jersey_number),
                position: membership.position ? String(membership.position).trim() : null,
                membership_type: membershipType,
                start_date: membership.start_date || null,
                end_date: membership.end_date || null,
                notes: membership.notes ? String(membership.notes).trim() : null,
            };
        });
}

function validateMemberships(db, memberships, playerId = null, allowedSportIds = null) {
    const teamsById = new Map();
    const validatedSportIds = new Set();

    // If playerId is provided but allowedSportIds is not, load from DB
    let effectiveSportIds = allowedSportIds;
    if (playerId && !effectiveSportIds) {
        const sports = db.prepare('SELECT sport_id FROM player_sports WHERE player_id = ?').all(playerId);
        effectiveSportIds = sports.map(s => s.sport_id);
    }

    for (const membership of memberships) {
        if (!membership.team_id || Number.isNaN(membership.team_id)) {
            throw new Error('Each membership must include a valid team_id');
        }

        const team = db.prepare(`
            SELECT t.team_id, t.name, t.sport_id, s.name AS sport_name
            FROM teams t
            JOIN sports s ON t.sport_id = s.sport_id
            WHERE t.team_id = ?
        `).get(membership.team_id);

        if (!team) {
            throw new Error(`Team ${membership.team_id} not found`);
        }

        if (effectiveSportIds && !effectiveSportIds.includes(team.sport_id)) {
            throw new Error(`Player is not registered for the sport (${team.sport_name}) of team "${team.name}"`);
        }

        validatedSportIds.add(team.sport_id);

        const uniqueKey = `${membership.team_id}:${membership.membership_type}`;
        if (teamsById.has(uniqueKey)) {
            throw new Error('Duplicate active memberships for the same team and membership type are not allowed');
        }

        teamsById.set(uniqueKey, true);
    }
}

function syncPlayerSports(db, playerId, sportIds) {
    if (!Array.isArray(sportIds)) return;

    db.prepare('DELETE FROM player_sports WHERE player_id = ?').run(playerId);
    const insert = db.prepare('INSERT INTO player_sports (player_id, sport_id) VALUES (?, ?)');
    for (const sportId of sportIds) {
        insert.run(playerId, sportId);
    }
}

function replaceMemberships(db, playerId, memberships) {
    db.prepare(`
        UPDATE player_team_memberships
        SET is_active = 0, end_date = COALESCE(end_date, CURRENT_DATE)
        WHERE player_id = ? AND is_active = 1
    `).run(playerId);

    const insertMembership = db.prepare(`
        INSERT INTO player_team_memberships
            (player_id, team_id, jersey_number, position, membership_type, is_active, start_date, end_date, notes)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);

    for (const membership of memberships) {
        insertMembership.run(
            playerId,
            membership.team_id,
            membership.jersey_number,
            membership.position,
            membership.membership_type,
            membership.start_date,
            membership.end_date,
            membership.notes,
        );
    }

    syncPlayerPrimaryMembership(db, playerId);
}

function attachMembershipsAndSports(db, players) {
    const playerIds = players.map((player) => player.player_id);
    const membershipsByPlayer = loadMemberships(db, playerIds);
    const sportsByPlayer = loadSports(db, playerIds);

    return players.map((player) => {
        const memberships = membershipsByPlayer.get(player.player_id) || [];
        const sports = sportsByPlayer.get(player.player_id) || [];
        const activeMemberships = memberships.filter((membership) => membership.is_active);
        const teamNames = [...new Set(activeMemberships.map((membership) => membership.team_name))];

        return {
            ...player,
            memberships,
            sports,
            sport_ids: sports.map(s => s.sport_id),
            membership_count: activeMemberships.length,
            team_names: teamNames.join(', '),
        };
    });
}

// GET /api/players - List all players with filters
router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { sport_id, team_id, status, position, search } = req.query;

        let sql = `
            SELECT
                p.player_id, p.first_name, p.last_name, p.email,
                p.date_of_birth, p.gender, p.jersey_number, p.position,
                p.status, p.joined_date, p.player_image_url,
                t.team_id, t.name AS team_name,
                s.sport_id, s.name AS sport_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.team_id
            LEFT JOIN sports s ON t.sport_id = s.sport_id
            WHERE p.is_deleted = 0
        `;

        const params = [];

        if (sport_id) {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM player_team_memberships ptm
                    JOIN teams team_filter ON ptm.team_id = team_filter.team_id
                    WHERE ptm.player_id = p.player_id
                      AND ptm.is_active = 1
                      AND team_filter.sport_id = ?
                )
            `;
            params.push(sport_id);
        }

        if (team_id) {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM player_team_memberships ptm
                    WHERE ptm.player_id = p.player_id
                      AND ptm.is_active = 1
                      AND ptm.team_id = ?
                )
            `;
            params.push(team_id);
        }

        if (status) {
            sql += ' AND p.status = ?';
            params.push(status);
        }

        if (position) {
            sql += `
                AND (
                    p.position = ?
                    OR EXISTS (
                        SELECT 1
                        FROM player_team_memberships ptm
                        WHERE ptm.player_id = p.player_id
                          AND ptm.is_active = 1
                          AND ptm.position = ?
                    )
                )
            `;
            params.push(position, position);
        }

        if (search) {
            sql += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        sql += ' ORDER BY p.last_name, p.first_name';

        const players = db.prepare(sql).all(...params);
        res.json(attachMembershipsAndSports(db, players));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/players/:id - Player detail + match history
router.get('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;

        const player = db.prepare(`
            SELECT
                p.player_id, p.first_name, p.last_name, p.email,
                p.date_of_birth, p.gender, p.jersey_number, p.position,
                p.status, p.joined_date, p.player_image_url,
                t.team_id, t.name AS team_name,
                s.sport_id, s.name AS sport_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.team_id
            LEFT JOIN sports s ON t.sport_id = s.sport_id
            WHERE p.player_id = ? AND p.is_deleted = 0
        `).get(req.params.id);

        if (!player) return res.status(404).json({ error: 'Player not found' });

        return res.json(attachMembershipsAndSports(db, [player])[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/players - Create player
router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const {
            first_name,
            last_name,
            email,
            date_of_birth,
            gender,
            memberships,
            sport_ids,
            team_id,
            jersey_number,
            position,
            player_image_url,
        } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        const fallbackMembership = team_id ? { team_id, jersey_number, position, membership_type: 'club' } : null;
        const normalizedMemberships = normalizeMemberships(memberships, fallbackMembership);
        validateMemberships(db, normalizedMemberships, null, sport_ids);

        const runCreate = db.transaction(() => {
            const result = db.prepare(`
                INSERT INTO players (first_name, last_name, email, date_of_birth, gender, player_image_url)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                first_name,
                last_name,
                email || null,
                date_of_birth || null,
                gender || null,
                player_image_url || null,
            );

            if (normalizedMemberships.length) {
                replaceMemberships(db, result.lastInsertRowid, normalizedMemberships);
            }

            if (sport_ids) {
                syncPlayerSports(db, result.lastInsertRowid, sport_ids);
            }

            return result.lastInsertRowid;
        });

        const playerId = runCreate();
        const player = db.prepare('SELECT * FROM players WHERE player_id = ?').get(playerId);

        res.status(201).json(attachMembershipsAndSports(db, [player])[0]);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            if (err.message.includes('players.email')) {
                return res.status(409).json({ error: 'A player with this email already exists' });
            }
            if (err.message.includes('player_team_memberships')) {
                return res.status(409).json({ error: 'This player already has an active membership for that team and type' });
            }
            return res.status(409).json({ error: `Database conflict: ${err.message}` });
        }
        if (isMembershipValidationError(err.message)) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/players/:id - Edit player
router.put('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const {
            first_name,
            last_name,
            email,
            date_of_birth,
            gender,
            status,
            memberships,
            team_id,
            jersey_number,
            position,
            player_image_url,
        } = req.body;

        const existing = db.prepare('SELECT * FROM players WHERE player_id = ? AND is_deleted = 0').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Player not found' });

        const hasMembershipPayload = Array.isArray(memberships)
            || Object.prototype.hasOwnProperty.call(req.body, 'team_id')
            || Object.prototype.hasOwnProperty.call(req.body, 'jersey_number')
            || Object.prototype.hasOwnProperty.call(req.body, 'position');

        const fallbackMembership = team_id ? { team_id, jersey_number, position, membership_type: 'club' } : null;
        const normalizedMemberships = hasMembershipPayload ? normalizeMemberships(memberships, fallbackMembership) : null;

        if (normalizedMemberships) {
            validateMemberships(db, normalizedMemberships, Number(req.params.id), req.body.sport_ids);
        }

        const runUpdate = db.transaction(() => {
            db.prepare(`
                UPDATE players
                SET first_name = ?, last_name = ?, email = ?, date_of_birth = ?,
                    gender = ?, status = ?, player_image_url = ?
                WHERE player_id = ?
            `).run(
                first_name || existing.first_name,
                last_name || existing.last_name,
                email !== undefined ? email : existing.email,
                date_of_birth !== undefined ? date_of_birth : existing.date_of_birth,
                gender !== undefined ? gender : existing.gender,
                status || existing.status,
                player_image_url !== undefined ? player_image_url : existing.player_image_url,
                req.params.id,
            );

            if (req.body.sport_ids) {
                syncPlayerSports(db, Number(req.params.id), req.body.sport_ids);
            }

            if (normalizedMemberships) {
                replaceMemberships(db, Number(req.params.id), normalizedMemberships);
            }
        });

        runUpdate();

        const player = db.prepare('SELECT * FROM players WHERE player_id = ?').get(req.params.id);
        res.json(attachMembershipsAndSports(db, [player])[0]);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            if (err.message.includes('players.email')) {
                return res.status(409).json({ error: 'A player with this email already exists' });
            }
            if (err.message.includes('player_team_memberships')) {
                return res.status(409).json({ error: 'This player already has an active membership for that team and type' });
            }
            return res.status(409).json({ error: `Database conflict: ${err.message}` });
        }
        if (isMembershipValidationError(err.message)) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/players/:id - Soft-delete player
router.delete('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const existing = db.prepare('SELECT * FROM players WHERE player_id = ? AND is_deleted = 0').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Player not found' });

        const playerId = Number(req.params.id);
        const runDelete = db.transaction(() => {
            db.prepare(`
                UPDATE player_team_memberships
                SET is_active = 0, end_date = COALESCE(end_date, CURRENT_DATE)
                WHERE player_id = ? AND is_active = 1
            `).run(playerId);

            db.prepare('UPDATE players SET is_deleted = 1 WHERE player_id = ?').run(playerId);
            syncPlayerPrimaryMembership(db, playerId);
        });

        runDelete();

        res.json({
            message: 'Player soft-deleted successfully',
            note: 'Historical stats and membership history are preserved. Player will no longer appear in active lists.',
        });
    } catch (err) {
        console.error(`[API] Error deleting player ${req.params.id}:`, err);
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `Database conflict during deletion: ${err.message}. This is usually caused by overlapping membership history.` });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/players/:id/transfer - Transfer player membership to a different team
router.put('/:id/transfer', (req, res) => {
    try {
        const db = req.app.locals.db;
        const {
            team_id,
            jersey_number,
            position,
            membership_type = 'club',
            start_date,
            end_date,
            notes,
        } = req.body;

        if (!team_id) {
            return res.status(400).json({ error: 'team_id is required for transfer' });
        }
        if (!MEMBERSHIP_TYPES.has(membership_type)) {
            return res.status(400).json({ error: 'Invalid membership_type' });
        }

        const player = db.prepare(`
            SELECT player_id
            FROM players
            WHERE player_id = ? AND is_deleted = 0
        `).get(req.params.id);

        if (!player) return res.status(404).json({ error: 'Player not found' });

        const membership = normalizeMemberships([{
            team_id,
            jersey_number,
            position,
            membership_type,
            start_date,
            end_date,
            notes,
        }])[0];

        const otherActiveSports = db.prepare(`
            SELECT DISTINCT t.sport_id
            FROM player_team_memberships ptm
            JOIN teams t ON ptm.team_id = t.team_id
            WHERE ptm.player_id = ?
              AND ptm.is_active = 1
              AND ptm.membership_type != ?
        `).all(req.params.id, membership_type);

        validateMemberships(db, [membership]);
        const targetTeam = db.prepare('SELECT sport_id FROM teams WHERE team_id = ?').get(team_id);
        if (otherActiveSports[0] && otherActiveSports[0].sport_id !== targetTeam.sport_id) {
            return res.status(400).json({ error: 'Cannot transfer a player into a different sport' });
        }

        const runTransfer = db.transaction(() => {
            db.prepare(`
                UPDATE player_team_memberships
                SET is_active = 0, end_date = COALESCE(end_date, CURRENT_DATE)
                WHERE player_id = ? AND membership_type = ? AND is_active = 1
            `).run(req.params.id, membership_type);

            db.prepare(`
                INSERT INTO player_team_memberships
                    (player_id, team_id, jersey_number, position, membership_type, is_active, start_date, end_date, notes)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
            `).run(
                req.params.id,
                membership.team_id,
                membership.jersey_number,
                membership.position,
                membership.membership_type,
                membership.start_date,
                membership.end_date,
                membership.notes,
            );

            syncPlayerPrimaryMembership(db, Number(req.params.id));
        });

        runTransfer();

        res.json({
            message: 'Player membership transferred successfully',
            to_team: team_id,
            membership_type,
        });
    } catch (err) {
        if (isMembershipValidationError(err.message)) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
});

// GET /api/players/:id/stats - Career stats aggregated by sport
router.get('/:id/stats', (req, res) => {
    try {
        const db = req.app.locals.db;

        const stats = db.prepare(`
            SELECT
                ps.sport_id,
                s.name AS sport_name,
                COUNT(DISTINCT pms.match_id) AS matches_played,
                COALESCE(SUM(pms.runs_scored), 0) AS total_runs,
                COALESCE(SUM(pms.balls_faced), 0) AS total_balls,
                COALESCE(SUM(pms.wickets_taken), 0) AS total_wickets,
                COALESCE(SUM(pms.goals_scored), 0) AS total_goals,
                COALESCE(SUM(pms.assists), 0) AS total_assists,
                COALESCE(SUM(pms.yellow_cards), 0) AS total_yellows,
                COALESCE(SUM(pms.red_cards), 0) AS total_reds,
                COALESCE(SUM(pms.points_won), 0) AS total_points,
                COALESCE(SUM(pms.sets_won), 0) AS total_sets,
                COALESCE(SUM(pms.games_won), 0) AS total_games,
                ROUND(AVG(pms.rating), 2) AS avg_rating
            FROM player_sports ps
            JOIN sports s ON ps.sport_id = s.sport_id
            LEFT JOIN player_match_stats pms ON ps.player_id = pms.player_id
            LEFT JOIN matches m ON pms.match_id = m.match_id AND (m.sport_id = ps.sport_id OR EXISTS (SELECT 1 FROM events e WHERE e.event_id = m.event_id AND e.sport_id = ps.sport_id))
            WHERE ps.player_id = ?
            GROUP BY ps.sport_id
        `).all(req.params.id);

        if (!stats.length) {
            // Check if player exists but has no sports
            const player = db.prepare('SELECT 1 FROM players WHERE player_id = ?').get(req.params.id);
            if (!player) return res.status(404).json({ error: 'Player not found' });
            return res.json([]); 
        }

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
