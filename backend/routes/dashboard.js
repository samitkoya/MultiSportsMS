// ============================================================
// Dashboard Routes — Aggregation queries, views, stats
// ============================================================
// SQL Concepts: COUNT subqueries, VIEWs, JOIN + ORDER BY + LIMIT,
//               GROUP BY, SUM, CASE WHEN
// ============================================================

const express = require('express');
const router = express.Router();

// GET /api/dashboard/summary — Counts of all entities
// SQL: COUNT subqueries
router.get('/summary', (req, res) => {
    try {
        const db = req.app.locals.db;

        const summary = {
            total_sports:   db.prepare('SELECT COUNT(*) AS c FROM sports').get().c,
            total_teams:    db.prepare('SELECT COUNT(*) AS c FROM teams WHERE status = "active"').get().c,
            total_players:  db.prepare('SELECT COUNT(*) AS c FROM players WHERE is_deleted = 0').get().c,
            total_coaches:  db.prepare('SELECT COUNT(*) AS c FROM coaches').get().c,
            total_events:   db.prepare('SELECT COUNT(*) AS c FROM events').get().c,
            total_matches:  db.prepare('SELECT COUNT(*) AS c FROM matches').get().c,
            total_venues:   db.prepare('SELECT COUNT(*) AS c FROM venues').get().c,
            upcoming_matches: db.prepare("SELECT COUNT(*) AS c FROM matches WHERE status = 'scheduled'").get().c,
            completed_matches: db.prepare("SELECT COUNT(*) AS c FROM matches WHERE status = 'completed'").get().c,
            matches_completed: db.prepare("SELECT COUNT(*) AS c FROM matches WHERE status = 'completed'").get().c,
            ongoing_events: db.prepare("SELECT COUNT(*) AS c FROM events WHERE status = 'ongoing'").get().c,
        };

        // Sport breakdown (subquery for each)
        summary.sport_breakdown = db.prepare(`
            SELECT 
                s.sport_id, s.name,
                (SELECT COUNT(*) FROM teams t WHERE t.sport_id = s.sport_id AND t.status = 'active') AS team_count,
                (SELECT COUNT(*) FROM players p 
                 JOIN teams t2 ON p.team_id = t2.team_id 
                 WHERE t2.sport_id = s.sport_id AND p.is_deleted = 0) AS player_count,
                (SELECT COUNT(*) FROM events e WHERE e.sport_id = s.sport_id) AS event_count
            FROM sports s
            ORDER BY s.sport_id
        `).all();

        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/upcoming — Next 5 upcoming matches
// SQL: VIEW v_upcoming_matches
router.get('/upcoming', (req, res) => {
    try {
        const db = req.app.locals.db;

        // Use the v_upcoming_matches view
        let upcoming = db.prepare(`
            SELECT * FROM v_upcoming_matches LIMIT 5
        `).all();

        // If view returns no results (all matches may be in the past),
        // fall back to showing next scheduled matches regardless of date
        if (upcoming.length === 0) {
            upcoming = db.prepare(`
                SELECT 
                    m.match_id, m.match_date, m.status, m.round_name,
                    e.name AS event_name, e.event_id,
                    s.name AS sport_name, s.sport_id,
                    v.name AS venue_name, v.location AS venue_location,
                    GROUP_CONCAT(t.name, ' vs ') AS team_names
                FROM matches m
                JOIN events e      ON m.event_id = e.event_id
                JOIN sports s      ON e.sport_id = s.sport_id
                LEFT JOIN venues v ON m.venue_id = v.venue_id
                LEFT JOIN match_teams mt ON m.match_id = mt.match_id
                LEFT JOIN teams t       ON mt.team_id = t.team_id
                WHERE m.status = 'scheduled'
                GROUP BY m.match_id
                ORDER BY m.match_date ASC
                LIMIT 5
            `).all();
        }

        res.json(upcoming);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/top-players — Top rated players
router.get('/top-players', (req, res) => {
    try {
        const db = req.app.locals.db;
        const limit = Math.max(1, Math.min(Number(req.query.limit) || 5, 50));

        const players = db.prepare(`
            SELECT
                p.player_id,
                p.first_name,
                p.last_name,
                vps.team_name,
                vps.sport_name,
                vps.matches_played,
                COALESCE(vps.avg_rating, 0) AS avg_rating
            FROM v_player_statistics vps
            JOIN players p ON p.player_id = vps.player_id
            WHERE p.is_deleted = 0
            ORDER BY avg_rating DESC, matches_played DESC, p.last_name, p.first_name
            LIMIT ?
        `).all(limit);

        res.json({ players });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/top-scorers — Top performers per sport
// SQL: VIEW v_top_scorers
router.get('/top-scorers', (req, res) => {
    try {
        const db = req.app.locals.db;

        const scorers = db.prepare(`
            SELECT * FROM v_top_scorers
        `).all();

        // Group by sport for easier frontend consumption
        const grouped = {};
        for (const row of scorers) {
            if (!grouped[row.sport_name]) {
                grouped[row.sport_name] = [];
            }
            grouped[row.sport_name].push(row);
        }

        res.json({ scorers, grouped });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/recent-results — Last 5 completed matches
// SQL: JOIN + ORDER BY + LIMIT
router.get('/recent-results', (req, res) => {
    try {
        const db = req.app.locals.db;

        const results = db.prepare(`
            SELECT 
                m.match_id, m.match_date, m.result_summary, m.round_name,
                e.name AS event_name,
                s.name AS sport_name, s.sport_id
            FROM matches m
            JOIN events e ON m.event_id = e.event_id
            JOIN sports s ON e.sport_id = s.sport_id
            WHERE m.status = 'completed'
            ORDER BY m.match_date DESC
            LIMIT 5
        `).all();

        const matchIds = results.map((match) => match.match_id);
        if (matchIds.length > 0) {
            const placeholders = matchIds.map(() => '?').join(', ');
            const teams = db.prepare(`
                SELECT mt.match_id, mt.team_id, t.name AS team_name, mt.score, mt.is_winner
                FROM match_teams mt
                JOIN teams t ON mt.team_id = t.team_id
                WHERE mt.match_id IN (${placeholders})
                ORDER BY mt.match_id, mt.team_id
            `).all(...matchIds);

            const teamsByMatch = teams.reduce((acc, team) => {
                if (!acc[team.match_id]) acc[team.match_id] = [];
                acc[team.match_id].push(team);
                return acc;
            }, {});

            for (const match of results) {
                match.teams = teamsByMatch[match.match_id] || [];
            }
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/standings/:event_id — Full standings for one event
// SQL: VIEW v_team_standings
router.get('/standings/:event_id', (req, res) => {
    try {
        const db = req.app.locals.db;

        const standings = db.prepare(`
            SELECT * FROM v_team_standings
            WHERE event_id = ?
            ORDER BY points DESC, wins DESC
        `).all(req.params.event_id);

        res.json(standings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
