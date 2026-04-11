// ============================================================
// Matches Routes — Full CRUD + scoring + event logging
// ============================================================
// SQL Concepts: INSERT (transaction), UPDATE, DELETE + CASCADE,
//               multi-table JOIN, TRANSACTION (BEGIN/COMMIT/ROLLBACK),
//               complex pre-condition queries, triggers
// ============================================================

const express = require('express');
const router = express.Router();

// GET /api/matches — List all matches
// SQL: JOIN, ORDER BY date
router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { sport_id, event_id, status } = req.query;

        let sql = `
            SELECT 
                m.match_id, m.match_date, m.status, m.round_name, m.result_summary,
                m.created_at, m.venue_id,
                e.event_id, e.name AS event_name,
                s.sport_id, s.name AS sport_name,
                v.name AS venue_name, v.location AS venue_location
            FROM matches m
            LEFT JOIN events e ON m.event_id = e.event_id
            LEFT JOIN sports s ON e.sport_id = s.sport_id
            LEFT JOIN venues v ON m.venue_id = v.venue_id
        `;

        const conditions = [];
        const params = [];

        if (sport_id) {
            conditions.push('s.sport_id = ?');
            params.push(sport_id);
        }
        if (event_id) {
            conditions.push('m.event_id = ?');
            params.push(event_id);
        }
        if (status) {
            conditions.push('m.status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY m.match_date DESC';

        const matches = db.prepare(sql).all(...params);

        const matchIds = matches.map((match) => match.match_id);
        if (matchIds.length > 0) {
            const placeholders = matchIds.map(() => '?').join(', ');
            const teams = db.prepare(`
                SELECT mt.match_id, mt.team_id, t.name AS team_name, mt.score, mt.is_winner,
                       mt.innings_1_score, mt.innings_2_score, mt.sets_won
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

            for (const match of matches) {
                match.teams = teamsByMatch[match.match_id] || [];
            }
        }

        res.json(matches);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/matches/:id — Match detail + events + stats
// SQL: Multi-table JOIN
router.get('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;

        const match = db.prepare(`
            SELECT 
                m.match_id, m.match_date, m.status, m.round_name, m.result_summary,
                m.created_at,
                e.event_id, e.name AS event_name,
                s.sport_id, s.name AS sport_name,
                v.venue_id, v.name AS venue_name, v.location AS venue_location
            FROM matches m
            LEFT JOIN events e ON m.event_id = e.event_id
            LEFT JOIN sports s ON e.sport_id = s.sport_id
            LEFT JOIN venues v ON m.venue_id = v.venue_id
            WHERE m.match_id = ?
        `).get(req.params.id);

        if (!match) return res.status(404).json({ error: 'Match not found' });

        // Teams in this match
        match.teams = db.prepare(`
            SELECT mt.team_id, t.name AS team_name, mt.score, mt.is_winner,
                   mt.innings_1_score, mt.innings_2_score, mt.sets_won
            FROM match_teams mt
            JOIN teams t ON mt.team_id = t.team_id
            WHERE mt.match_id = ?
        `).all(req.params.id);

        // Match events
        match.events = db.prepare(`
            SELECT 
                me.event_id, me.event_type, me.minute_or_over, me.ball_in_over,
                me.set_number, me.runs_scored, me.point_winner, me.detail,
                me.recorded_at,
                me.team_id,
                t.name AS team_name,
                p1.first_name || ' ' || p1.last_name AS player_name,
                p2.first_name || ' ' || p2.last_name AS secondary_player_name
            FROM match_events me
            LEFT JOIN teams t    ON me.team_id = t.team_id
            LEFT JOIN players p1 ON me.player_id = p1.player_id
            LEFT JOIN players p2 ON me.secondary_player_id = p2.player_id
            WHERE me.match_id = ?
            ORDER BY me.recorded_at, me.event_id
        `).all(req.params.id);

        // Player stats for this match
        match.player_stats = db.prepare(`
            SELECT 
                pms.*,
                p.first_name || ' ' || p.last_name AS player_name,
                p.jersey_number, p.position,
                t.name AS team_name, t.team_id
            FROM player_match_stats pms
            LEFT JOIN players p ON pms.player_id = p.player_id
            LEFT JOIN teams t ON p.team_id = t.team_id
            WHERE pms.match_id = ?
            ORDER BY t.team_id, p.jersey_number
        `).all(req.params.id);

        res.json(match);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/matches — Schedule new match
// SQL: INSERT (transaction — inserts into matches, match_teams, schedules)
router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { event_id, venue_id, match_date, round_name, team_ids } = req.body;

        if (!match_date || !team_ids || team_ids.length < 2) {
            return res.status(400).json({ error: 'match_date and at least 2 team_ids are required' });
        }

        const uniqueTeamIds = [...new Set(team_ids)];
        if (uniqueTeamIds.length !== team_ids.length) {
            return res.status(400).json({ error: 'A match cannot include the same team more than once' });
        }

        // Use a TRANSACTION to insert match + match_teams + schedule atomically
        const insertMatch = db.transaction(() => {
            // INSERT into matches
            const result = db.prepare(`
                INSERT INTO matches (event_id, venue_id, match_date, round_name)
                VALUES (?, ?, ?, ?)
            `).run(event_id || null, venue_id || null, match_date, round_name || null);

            const matchId = result.lastInsertRowid;

            // INSERT into match_teams for each team
            const insertTeam = db.prepare(`
                INSERT INTO match_teams (match_id, team_id) VALUES (?, ?)
            `);
            for (const tid of uniqueTeamIds) {
                insertTeam.run(matchId, tid);
            }

            // INSERT into schedules
            db.prepare(`
                INSERT INTO schedules (match_id, scheduled_time) VALUES (?, ?)
            `).run(matchId, match_date);

            return matchId;
        });

        const matchId = insertMatch();
        const match = db.prepare('SELECT * FROM matches WHERE match_id = ?').get(matchId);
        res.status(201).json(match);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/matches/:id — Edit match (date, venue, status, and teams)
// SQL: UPDATE
router.put('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { match_date, venue_id, status, round_name, team_ids } = req.body;

        const existing = db.prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Match not found' });

        const updateTx = db.transaction(() => {
            db.prepare(`
                UPDATE matches 
                SET match_date = ?, venue_id = ?, status = ?, round_name = ?
                WHERE match_id = ?
            `).run(
                match_date || existing.match_date,
                venue_id !== undefined ? venue_id : existing.venue_id,
                status || existing.status,
                round_name !== undefined ? round_name : existing.round_name,
                req.params.id
            );

            if (team_ids && Array.isArray(team_ids) && team_ids.length >= 2) {
                const uniqueTeamIds = [...new Set(team_ids)];
                if (uniqueTeamIds.length !== team_ids.length) {
                    throw new Error('A match cannot include the same team more than once');
                }

                db.prepare('DELETE FROM match_teams WHERE match_id = ?').run(req.params.id);
                const insertTeam = db.prepare('INSERT INTO match_teams (match_id, team_id) VALUES (?, ?)');
                for (const tid of uniqueTeamIds) {
                    insertTeam.run(req.params.id, tid);
                }
            }
        });

        updateTx();
        
        const match = db.prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
        res.json(match);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/matches/:id — Delete match
// SQL: DELETE + CASCADE (match_teams, match_events, schedules all cascade)
router.delete('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const existing = db.prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Match not found' });

        db.prepare('DELETE FROM matches WHERE match_id = ?').run(req.params.id);
        res.json({ message: 'Match deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/matches/:id/score — Update team score
// SQL: UPDATE match_teams — transaction
router.put('/:id/score', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { team_id, score, innings_1_score, innings_2_score, sets_won } = req.body;

        if (!team_id || score === undefined) {
            return res.status(400).json({ error: 'team_id and score are required' });
        }

        db.prepare(`
            UPDATE match_teams 
            SET score = ?, innings_1_score = ?, innings_2_score = ?, sets_won = ?
            WHERE match_id = ? AND team_id = ?
        `).run(
            score,
            innings_1_score !== undefined ? innings_1_score : null,
            innings_2_score !== undefined ? innings_2_score : null,
            sets_won !== undefined ? sets_won : null,
            req.params.id, team_id
        );

        res.json({ message: 'Score updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/matches/:id/result — Record final result + winner
// SQL: TRANSACTION (BEGIN / COMMIT / ROLLBACK)
router.put('/:id/result', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { winner_team_id, result_summary } = req.body;

        if (!winner_team_id) {
            return res.status(400).json({ error: 'winner_team_id is required' });
        }

        // Use explicit TRANSACTION
        const recordResult = db.transaction(() => {
            // Step 1: Update match status to completed
            db.prepare(`
                UPDATE matches SET status = 'completed', result_summary = ?
                WHERE match_id = ?
            `).run(result_summary || null, req.params.id);

            // Step 2: Set winner
            db.prepare(`
                UPDATE match_teams SET is_winner = 1 
                WHERE match_id = ? AND team_id = ?
            `).run(req.params.id, winner_team_id);

            // Step 3: Set loser(s)
            db.prepare(`
                UPDATE match_teams SET is_winner = 0 
                WHERE match_id = ? AND team_id != ?
            `).run(req.params.id, winner_team_id);

            // Step 4: Update schedule actual end time
            db.prepare(`
                UPDATE schedules SET actual_end_time = CURRENT_TIMESTAMP
                WHERE match_id = ?
            `).run(req.params.id);
        });

        recordResult();

        const match = db.prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
        res.json({ message: 'Match result recorded', match });
    } catch (err) {
        // ROLLBACK happens automatically if transaction throws
        res.status(500).json({ error: err.message });
    }
});

// POST /api/matches/:id/events — Log a match event
// SQL: INSERT match_events + triggers handle stats automatically
// Also includes pre-condition query for football substitution validation
router.post('/:id/events', (req, res) => {
    try {
        const db = req.app.locals.db;
        const {
            team_id, player_id, secondary_player_id, event_type,
            minute_or_over, ball_in_over, set_number, runs_scored,
            point_winner, detail
        } = req.body;

        if (!event_type) {
            return res.status(400).json({ error: 'event_type is required' });
        }

        // ---- Pre-condition query for football goals/cards ----
        // Before inserting, check if the player was substituted off
        if (['goal', 'yellow_card', 'red_card'].includes(event_type) && player_id && minute_or_over) {
            const subCount = db.prepare(`
                SELECT COUNT(*) AS count FROM match_events 
                WHERE match_id = ? AND event_type = 'substitution' 
                AND player_id = ? AND minute_or_over < ?
            `).get(req.params.id, player_id, minute_or_over).count;

            if (subCount > 0) {
                return res.status(400).json({ 
                    error: 'Player was already substituted off before this minute. Cannot log event.' 
                });
            }
        }

        // ---- Cricket wicket transaction ----
        if (event_type === 'wicket') {
            const logWicket = db.transaction(() => {
                // Validate batsman is not already out
                const alreadyOut = db.prepare(`
                    SELECT COUNT(*) AS count FROM match_events 
                    WHERE match_id = ? AND event_type = 'wicket' 
                    AND secondary_player_id = ?
                `).get(req.params.id, secondary_player_id || player_id).count;

                if (alreadyOut > 0) {
                    throw new Error('This batsman is already out');
                }

                // Insert the wicket event
                const result = db.prepare(`
                    INSERT INTO match_events 
                    (match_id, team_id, player_id, secondary_player_id, event_type,
                     minute_or_over, ball_in_over, runs_scored, detail)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    req.params.id, team_id, player_id, secondary_player_id,
                    event_type, minute_or_over || null, ball_in_over || null,
                    runs_scored || 0, detail || null
                );

                return result.lastInsertRowid;
            });

            try {
                const eventId = logWicket();
                return res.status(201).json({ message: 'Wicket logged', event_id: eventId });
            } catch (txErr) {
                return res.status(400).json({ error: txErr.message });
            }
        }

        // ---- General event insert ----
        const result = db.prepare(`
            INSERT INTO match_events 
            (match_id, team_id, player_id, secondary_player_id, event_type,
             minute_or_over, ball_in_over, set_number, runs_scored, point_winner, detail)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            req.params.id,
            team_id || null,
            player_id || null,
            secondary_player_id || null,
            event_type,
            minute_or_over || null,
            ball_in_over || null,
            set_number || null,
            runs_scored || null,
            point_winner || null,
            detail || null
        );

        res.status(201).json({ message: 'Event logged', event_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/matches/:id/events — Get all events for a match
// SQL: SELECT + ORDER BY
router.get('/:id/events', (req, res) => {
    try {
        const db = req.app.locals.db;

        const events = db.prepare(`
            SELECT 
                me.event_id, me.event_type, me.minute_or_over, me.ball_in_over,
                me.set_number, me.runs_scored, me.point_winner, me.detail,
                me.recorded_at,
                me.team_id, t.name AS team_name,
                p1.first_name || ' ' || p1.last_name AS player_name,
                p2.first_name || ' ' || p2.last_name AS secondary_player_name
            FROM match_events me
            LEFT JOIN teams t    ON me.team_id = t.team_id
            LEFT JOIN players p1 ON me.player_id = p1.player_id
            LEFT JOIN players p2 ON me.secondary_player_id = p2.player_id
            WHERE me.match_id = ?
            ORDER BY me.event_id
        `).all(req.params.id);

        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/matches/:id/stats — Save player stats for match
// SQL: INSERT/REPLACE (UPSERT) into player_match_stats
router.post('/:id/stats', (req, res) => {
    try {
        const db = req.app.locals.db;
        const {
            player_id, runs_scored, balls_faced, wickets_taken, runs_conceded,
            overs_bowled, goals_scored, assists, yellow_cards, red_cards,
            minutes_played, points_won, sets_won, games_won, rating, notes
        } = req.body;

        if (!player_id) return res.status(400).json({ error: 'player_id is required' });

        db.prepare(`
            INSERT INTO player_match_stats 
            (player_id, match_id, runs_scored, balls_faced, wickets_taken, runs_conceded,
             overs_bowled, goals_scored, assists, yellow_cards, red_cards,
             minutes_played, points_won, sets_won, games_won, rating, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(player_id, match_id) DO UPDATE SET
                runs_scored = ?, balls_faced = ?, wickets_taken = ?, runs_conceded = ?,
                overs_bowled = ?, goals_scored = ?, assists = ?, yellow_cards = ?, red_cards = ?,
                minutes_played = ?, points_won = ?, sets_won = ?, games_won = ?, rating = ?, notes = ?
        `).run(
            player_id, req.params.id,
            runs_scored || 0, balls_faced || 0, wickets_taken || 0, runs_conceded || 0,
            overs_bowled || 0, goals_scored || 0, assists || 0, yellow_cards || 0, red_cards || 0,
            minutes_played || 0, points_won || 0, sets_won || 0, games_won || 0, rating || null, notes || null,
            // ON CONFLICT values
            runs_scored || 0, balls_faced || 0, wickets_taken || 0, runs_conceded || 0,
            overs_bowled || 0, goals_scored || 0, assists || 0, yellow_cards || 0, red_cards || 0,
            minutes_played || 0, points_won || 0, sets_won || 0, games_won || 0, rating || null, notes || null
        );

        res.json({ message: 'Player stats saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/matches/:id/stats — Get player stats for match
// SQL: JOIN players + player_match_stats
router.get('/:id/stats', (req, res) => {
    try {
        const db = req.app.locals.db;

        const stats = db.prepare(`
            SELECT 
                pms.*,
                p.first_name || ' ' || p.last_name AS player_name,
                p.jersey_number, p.position,
                t.name AS team_name, t.team_id
            FROM player_match_stats pms
            LEFT JOIN players p ON pms.player_id = p.player_id
            LEFT JOIN teams t ON p.team_id = t.team_id
            WHERE pms.match_id = ?
            ORDER BY t.team_id, p.jersey_number
        `).all(req.params.id);

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
