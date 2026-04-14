-- ============================================================
-- Multi-Sports Management System — Database Schema
-- ============================================================
-- This file contains all DDL statements for the MSMS database.
-- 13 tables (3NF normalized), 5 views, 4 triggers, 7 indexes.
--
-- SQL Concepts Demonstrated:
--   CREATE TABLE, PRIMARY KEY (simple + composite), FOREIGN KEY,
--   ON DELETE CASCADE, ON DELETE SET NULL, NOT NULL, UNIQUE,
--   CHECK constraints, DEFAULT values, CREATE VIEW, CREATE TRIGGER,
--   CREATE INDEX, JOIN, LEFT JOIN, GROUP BY, HAVING, CASE WHEN,
--   SUM, COUNT, AVG, ORDER BY, LIMIT, Subqueries, COALESCE
-- ============================================================

PRAGMA foreign_keys = ON;     -- Enable FK enforcement in SQLite
PRAGMA journal_mode = WAL;    -- Write-Ahead Logging for concurrent reads

-- ============================================================
-- TABLE 1: sports
-- Stores the four supported sports with their rules metadata.
-- Seeded once and treated as read-only after that.
-- ============================================================
CREATE TABLE IF NOT EXISTS sports (
    sport_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name                  TEXT    NOT NULL UNIQUE,
    category              TEXT    NOT NULL CHECK (category IN ('Indoor', 'Outdoor')),
    max_players_per_team  INTEGER NOT NULL CHECK (max_players_per_team > 0),
    min_players_per_team  INTEGER NOT NULL CHECK (min_players_per_team > 0),
    scoring_unit          TEXT    NOT NULL,                          -- 'runs', 'goals', 'points'
    description           TEXT    DEFAULT '',
    rules_json            TEXT,                                     -- JSON blob with sport-specific rule metadata
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: venues
-- Physical locations where matches are played.
-- ============================================================
CREATE TABLE IF NOT EXISTS venues (
    venue_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    location     TEXT    NOT NULL,
    capacity     INTEGER CHECK (capacity > 0),
    surface_type TEXT    DEFAULT 'Standard',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 3: coaches
-- Coaching staff. A coach can manage one or more teams.
-- ============================================================
CREATE TABLE IF NOT EXISTS coaches (
    coach_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name       TEXT    NOT NULL,
    last_name        TEXT    NOT NULL,
    email            TEXT    UNIQUE,
    phone            TEXT,
    specialization   TEXT,
    coach_image_url  TEXT,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 4: teams
-- Each team belongs to exactly one sport.
-- Demonstrates both ON DELETE CASCADE (sport) and ON DELETE SET NULL (coach, venue).
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
    team_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL UNIQUE,
    sport_id      INTEGER NOT NULL,
    coach_id      INTEGER,
    founded_year  INTEGER,
    home_venue_id INTEGER,
    team_image_url TEXT,
    status        TEXT    DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disbanded')),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sport_id)      REFERENCES sports(sport_id)  ON DELETE CASCADE,
    FOREIGN KEY (coach_id)      REFERENCES coaches(coach_id) ON DELETE SET NULL,
    FOREIGN KEY (home_venue_id) REFERENCES venues(venue_id)  ON DELETE SET NULL
);

-- ============================================================
-- TABLE 5: players
-- Players belong to a team. Supports soft deletion via is_deleted flag.
-- Deleting a team cascades and removes all its players.
-- batting_order intentionally NOT here — lives in match_rosters (2NF fix).
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
    player_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT    NOT NULL,
    last_name     TEXT    NOT NULL,
    email         TEXT,
    date_of_birth DATE,
    gender        TEXT    CHECK (gender IN ('Male', 'Female', 'Other')),
    team_id       INTEGER,
    jersey_number INTEGER,
    position      TEXT,                                              -- sport-specific position label
    player_image_url TEXT,
    status        TEXT    DEFAULT 'active' CHECK (status IN ('active', 'injured', 'retired', 'suspended')),
    is_deleted    BOOLEAN DEFAULT 0,                                 -- soft delete flag
    joined_date   DATE    DEFAULT CURRENT_DATE,

    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 5B: player_team_memberships
-- A player may belong to multiple teams simultaneously (club/country/etc).
-- Team-specific attributes such as jersey number and position live here.
-- ============================================================
CREATE TABLE IF NOT EXISTS player_team_memberships (
    membership_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id        INTEGER NOT NULL,
    team_id          INTEGER NOT NULL,
    jersey_number    INTEGER,
    position         TEXT,
    membership_type  TEXT    NOT NULL DEFAULT 'club' CHECK (membership_type IN ('club', 'country', 'loan', 'academy', 'other')),
    is_active        BOOLEAN DEFAULT 1,
    start_date       DATE    DEFAULT CURRENT_DATE,
    end_date         DATE,
    notes            TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id)   REFERENCES teams(team_id)   ON DELETE CASCADE
);

-- ============================================================
-- TABLE 5C: player_sports (Junction — M:N between players and sports)
-- Allows a player to play multiple sports.
-- ============================================================
CREATE TABLE IF NOT EXISTS player_sports (
    player_id INTEGER NOT NULL,
    sport_id  INTEGER NOT NULL,
    PRIMARY KEY (player_id, sport_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id)  REFERENCES sports(sport_id)  ON DELETE CASCADE
);

-- ============================================================
-- TABLE 6: events (Tournaments / Leagues)
-- Each event is linked to one sport.
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    event_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    sport_id    INTEGER NOT NULL,
    event_type  TEXT    CHECK (event_type IN ('tournament', 'league', 'friendly', 'championship')),
    format      TEXT,                                               -- 'knockout', 'round-robin', 'group+knockout'
    start_date  DATE    NOT NULL,
    end_date    DATE,
    status      TEXT    DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    description TEXT,
    event_image_url TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sport_id) REFERENCES sports(sport_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 7: event_teams (Junction table — M:N between events and teams)
-- Composite primary key demonstrated.
-- ============================================================
CREATE TABLE IF NOT EXISTS event_teams (
    event_id      INTEGER NOT NULL,
    team_id       INTEGER NOT NULL,
    seed_rank     INTEGER,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (event_id, team_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id)  REFERENCES teams(team_id)   ON DELETE CASCADE
);

-- ============================================================
-- TABLE 8: matches
-- Each match belongs to an event and optionally has a venue.
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
    match_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id       INTEGER,
    sport_id       INTEGER,
    venue_id       INTEGER,
    match_date     DATETIME NOT NULL,
    status         TEXT    DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed')),
    round_name     TEXT,                                            -- 'Group Stage', 'Semifinal', 'Final'
    result_summary TEXT,                                            -- human-readable result string
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(sport_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 9: match_teams (Junction — M:N between matches and teams)
-- Carries score data. Composite primary key demonstrated.
-- Score is a denormalized convenience cache — see note in plan.
-- ============================================================
CREATE TABLE IF NOT EXISTS match_teams (
    match_id        INTEGER NOT NULL,
    team_id         INTEGER NOT NULL,
    score           INTEGER DEFAULT 0,
    is_winner       BOOLEAN DEFAULT 0,
    innings_1_score INTEGER,                                        -- cricket only
    innings_2_score INTEGER,                                        -- cricket only
    wickets         INTEGER DEFAULT 0,                              -- cricket only (wickets lost)
    sets_won        INTEGER,                                        -- tennis/badminton only

    PRIMARY KEY (match_id, team_id),
    FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id)  REFERENCES teams(team_id)    ON DELETE CASCADE
);

-- ============================================================
-- TABLE 10: match_events (Sport-specific event log)
-- Core event log table — triggers fire on INSERT to update stats.
-- ============================================================
CREATE TABLE IF NOT EXISTS match_events (
    event_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id             INTEGER NOT NULL,
    team_id              INTEGER,
    player_id            INTEGER,
    secondary_player_id  INTEGER,                                   -- assists, sub-in, partnership
    event_type           TEXT    NOT NULL,
    minute_or_over       INTEGER,                                   -- football minute / cricket over
    ball_in_over         INTEGER,                                   -- cricket only
    set_number           INTEGER,                                   -- tennis/badminton
    runs_scored          INTEGER,                                   -- cricket
    point_winner         INTEGER,                                   -- tennis/badminton
    detail               TEXT,                                      -- extra context (wicket type, card color, etc.)
    recorded_at          DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id)            REFERENCES matches(match_id)  ON DELETE CASCADE,
    FOREIGN KEY (team_id)             REFERENCES teams(team_id)     ON DELETE CASCADE,
    FOREIGN KEY (player_id)           REFERENCES players(player_id) ON DELETE SET NULL,
    FOREIGN KEY (secondary_player_id) REFERENCES players(player_id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 11: player_match_stats (Aggregated per-player per-match)
-- player_id uses ON DELETE SET NULL for data retention.
-- ============================================================
CREATE TABLE IF NOT EXISTS player_match_stats (
    record_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id      INTEGER,                                         -- nullable for data retention
    match_id       INTEGER NOT NULL,
    runs_scored    INTEGER DEFAULT 0,                                -- cricket
    balls_faced    INTEGER DEFAULT 0,                                -- cricket
    wickets_taken  INTEGER DEFAULT 0,                                -- cricket
    runs_conceded  INTEGER DEFAULT 0,                                -- cricket
    overs_bowled   REAL    DEFAULT 0,                                -- cricket
    goals_scored   INTEGER DEFAULT 0,                                -- football
    assists        INTEGER DEFAULT 0,                                -- football
    yellow_cards   INTEGER DEFAULT 0,                                -- football
    red_cards      INTEGER DEFAULT 0,                                -- football
    minutes_played INTEGER DEFAULT 0,                                -- football
    points_won     INTEGER DEFAULT 0,                                -- tennis/badminton
    sets_won       INTEGER DEFAULT 0,                                -- tennis/badminton
    games_won      INTEGER DEFAULT 0,                                -- tennis only
    rating         REAL    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
    notes          TEXT,

    UNIQUE (player_id, match_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE SET NULL,
    FOREIGN KEY (match_id)  REFERENCES matches(match_id)  ON DELETE CASCADE
);

-- ============================================================
-- TABLE 12: schedules
-- One-to-one extension of matches for scheduling metadata.
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id       INTEGER  PRIMARY KEY AUTOINCREMENT,
    match_id          INTEGER  NOT NULL UNIQUE,
    scheduled_time    DATETIME NOT NULL,
    actual_start_time DATETIME,
    actual_end_time   DATETIME,
    notes             TEXT,

    FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 13: match_rosters (Per-match lineup and batting order)
-- Composite primary key. Correct home for batting_order (2NF fix).
-- ============================================================
CREATE TABLE IF NOT EXISTS match_rosters (
    match_id        INTEGER NOT NULL,
    player_id       INTEGER NOT NULL,
    team_id         INTEGER NOT NULL,
    lineup_position INTEGER NOT NULL,                               -- batting order (cricket) / jersey slot (football)
    is_starting     BOOLEAN DEFAULT 1,                              -- 0 for substitutes / reserve batsmen

    PRIMARY KEY (match_id, player_id),
    FOREIGN KEY (match_id)  REFERENCES matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id)   REFERENCES teams(team_id)    ON DELETE CASCADE
);


-- ============================================================
-- INDEXES (7 performance indexes on frequently queried columns)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_players_team       ON players(team_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email_active ON players(email) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_memberships_player ON player_team_memberships(player_id, is_active);
CREATE INDEX IF NOT EXISTS idx_memberships_team   ON player_team_memberships(team_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_active ON player_team_memberships(player_id, team_id, membership_type) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_matches_event      ON matches(event_id);
CREATE INDEX IF NOT EXISTS idx_matches_date       ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_stats_player       ON player_match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_teams_sport        ON teams(sport_id);
CREATE INDEX IF NOT EXISTS idx_rosters_match      ON match_rosters(match_id, team_id);


-- ============================================================
-- TRIGGERS (4 triggers — auto-update stats on match_events INSERT)
-- ============================================================

-- Trigger 1: When a football goal is logged, increment the scorer's goal count.
CREATE TRIGGER IF NOT EXISTS trg_football_goal
AFTER INSERT ON match_events
WHEN NEW.event_type = 'goal'
BEGIN
    INSERT INTO player_match_stats (player_id, match_id, goals_scored)
    VALUES (NEW.player_id, NEW.match_id, 1)
    ON CONFLICT(player_id, match_id)
    DO UPDATE SET goals_scored = goals_scored + 1;
END;

-- Trigger 2: When a goal with an assister is logged, increment the assister's assist count.
CREATE TRIGGER IF NOT EXISTS trg_football_assist
AFTER INSERT ON match_events
WHEN NEW.event_type = 'goal' AND NEW.secondary_player_id IS NOT NULL
BEGIN
    INSERT INTO player_match_stats (player_id, match_id, assists)
    VALUES (NEW.secondary_player_id, NEW.match_id, 1)
    ON CONFLICT(player_id, match_id)
    DO UPDATE SET assists = assists + 1;
END;

-- Trigger 3: When a cricket wicket is logged, increment the bowler's wicket count.
CREATE TRIGGER IF NOT EXISTS trg_cricket_wicket
AFTER INSERT ON match_events
WHEN NEW.event_type = 'wicket'
BEGIN
    INSERT INTO player_match_stats (player_id, match_id, wickets_taken)
    VALUES (NEW.player_id, NEW.match_id, 1)
    ON CONFLICT(player_id, match_id)
    DO UPDATE SET wickets_taken = wickets_taken + 1;
END;

-- Trigger 4: When cricket runs are logged, add to the batsman's run total.
CREATE TRIGGER IF NOT EXISTS trg_cricket_runs
AFTER INSERT ON match_events
WHEN NEW.event_type = 'run'
BEGIN
    INSERT INTO player_match_stats (player_id, match_id, runs_scored)
    VALUES (NEW.player_id, NEW.match_id, NEW.runs_scored)
    ON CONFLICT(player_id, match_id)
    DO UPDATE SET runs_scored = runs_scored + COALESCE(NEW.runs_scored, 0);
END;


-- ============================================================
-- VIEWS (5 pre-built views for dashboards and reports)
-- ============================================================

-- VIEW 1: v_team_standings
-- Aggregates wins/losses/draws per team per event.
-- Demonstrates GROUP BY, COUNT, CASE WHEN inside SUM, JOIN
CREATE VIEW IF NOT EXISTS v_team_standings AS
SELECT
    et.event_id,
    e.name        AS event_name,
    e.sport_id,
    s.name        AS sport_name,
    t.team_id,
    t.name        AS team_name,
    COUNT(mt.match_id)                                       AS matches_played,
    SUM(CASE WHEN mt.is_winner = 1 THEN 1 ELSE 0 END)       AS wins,
    SUM(CASE WHEN mt.is_winner = 0
              AND m.status = 'completed'
              AND EXISTS (
                  SELECT 1 FROM match_teams mt2
                  WHERE mt2.match_id = mt.match_id AND mt2.is_winner = 1
              ) THEN 1 ELSE 0 END)                           AS losses,
    SUM(CASE WHEN m.status = 'completed'
              AND NOT EXISTS (
                  SELECT 1 FROM match_teams mt2
                  WHERE mt2.match_id = mt.match_id AND mt2.is_winner = 1
              ) THEN 1 ELSE 0 END)                           AS draws,
    SUM(CASE WHEN mt.is_winner = 1 THEN 3 ELSE 0 END)
    + SUM(CASE WHEN m.status = 'completed'
               AND NOT EXISTS (
                   SELECT 1 FROM match_teams mt2
                   WHERE mt2.match_id = mt.match_id AND mt2.is_winner = 1
               ) THEN 1 ELSE 0 END)                         AS points
FROM event_teams et
JOIN teams t        ON et.team_id  = t.team_id
JOIN events e       ON et.event_id = e.event_id
JOIN sports s       ON e.sport_id  = s.sport_id
LEFT JOIN match_teams mt ON mt.team_id = t.team_id
LEFT JOIN matches m      ON mt.match_id = m.match_id AND m.event_id = et.event_id
GROUP BY et.event_id, t.team_id
ORDER BY et.event_id, points DESC, wins DESC;

-- VIEW 2: v_player_statistics
-- Aggregates all performance stats per player across all matches.
-- Demonstrates SUM, AVG, COUNT, multi-table JOIN, LEFT JOIN
CREATE VIEW IF NOT EXISTS v_player_statistics AS
SELECT
    p.player_id,
    p.first_name || ' ' || p.last_name AS player_name,
    t.name          AS team_name,
    s.name          AS sport_name,
    s.sport_id,
    COUNT(pms.match_id)                AS matches_played,
    -- Cricket stats
    COALESCE(SUM(pms.runs_scored), 0)    AS total_runs,
    COALESCE(SUM(pms.balls_faced), 0)    AS total_balls_faced,
    COALESCE(SUM(pms.wickets_taken), 0)  AS total_wickets,
    -- Football stats
    COALESCE(SUM(pms.goals_scored), 0)   AS total_goals,
    COALESCE(SUM(pms.assists), 0)        AS total_assists,
    COALESCE(SUM(pms.yellow_cards), 0)   AS total_yellow_cards,
    COALESCE(SUM(pms.red_cards), 0)      AS total_red_cards,
    -- Tennis/Badminton stats
    COALESCE(SUM(pms.points_won), 0)     AS total_points_won,
    COALESCE(SUM(pms.sets_won), 0)       AS total_sets_won,
    COALESCE(SUM(pms.games_won), 0)      AS total_games_won,
    -- Dynamic Rating Calculation
    ROUND(AVG(
        COALESCE(pms.rating, 
            CASE 
                WHEN s.name = 'Football' THEN 
                    MIN(10, MAX(1, 6.0 + (COALESCE(pms.goals_scored, 0) * 1.5) + (COALESCE(pms.assists, 0) * 1.0) - (COALESCE(pms.yellow_cards, 0) * 0.5) - (COALESCE(pms.red_cards, 0) * 2.0)))
                WHEN s.name = 'Cricket' THEN
                    MIN(10, MAX(1, 5.0 + (COALESCE(pms.runs_scored, 0) / 10.0) + (COALESCE(pms.wickets_taken, 0) * 1.5) - (COALESCE(pms.runs_conceded, 0) / 20.0)))
                WHEN s.name IN ('Tennis', 'Badminton') THEN
                    MIN(10, MAX(1, 5.0 + (COALESCE(pms.sets_won, 0) * 1.5) + (COALESCE(pms.points_won, 0) * 0.1)))
                ELSE 6.0
            END
        )
    ), 2) AS avg_rating
FROM players p
JOIN player_sports ps    ON p.player_id = ps.player_id
JOIN sports s            ON ps.sport_id = s.sport_id
LEFT JOIN teams t        ON p.team_id = t.team_id AND t.sport_id = ps.sport_id
LEFT JOIN player_match_stats pms ON p.player_id = pms.player_id AND (
    EXISTS (SELECT 1 FROM matches m WHERE m.match_id = pms.match_id AND (m.sport_id = ps.sport_id OR EXISTS (SELECT 1 FROM events e WHERE e.event_id = m.event_id AND e.sport_id = ps.sport_id)))
)
WHERE p.is_deleted = 0
GROUP BY p.player_id, ps.sport_id;

-- VIEW 3: v_upcoming_matches
-- Returns all scheduled matches with full context.
-- Demonstrates INNER JOIN, LEFT JOIN, WHERE with date comparison, ORDER BY
CREATE VIEW IF NOT EXISTS v_upcoming_matches AS
SELECT
    m.match_id,
    m.match_date,
    m.status,
    m.round_name,
    e.name         AS event_name,
    e.event_id,
    s.name         AS sport_name,
    COALESCE(e.sport_id, m.sport_id) AS sport_id,
    v.name         AS venue_name,
    v.location     AS venue_location,
    GROUP_CONCAT(t.name, ' vs ')  AS team_names
FROM matches m
LEFT JOIN events e  ON m.event_id = e.event_id
LEFT JOIN sports s  ON COALESCE(e.sport_id, m.sport_id) = s.sport_id
LEFT JOIN venues v  ON m.venue_id = v.venue_id
LEFT JOIN match_teams mt ON m.match_id = mt.match_id
LEFT JOIN teams t        ON mt.team_id = t.team_id
WHERE m.match_date >= DATE('now') AND m.status = 'scheduled'
GROUP BY m.match_id
ORDER BY m.match_date ASC;

-- VIEW 4: v_top_scorers
-- Returns top scorers per sport. Demonstrates subquery, ORDER BY, LIMIT, HAVING
CREATE VIEW IF NOT EXISTS v_top_scorers AS
SELECT
    p.player_id,
    p.first_name || ' ' || p.last_name AS player_name,
    t.name          AS team_name,
    s.name          AS sport_name,
    s.sport_id,
    -- Use sport-specific scoring metric
    CASE
        WHEN s.name = 'Cricket'   THEN COALESCE(SUM(pms.runs_scored), 0)
        WHEN s.name = 'Football'  THEN COALESCE(SUM(pms.goals_scored), 0)
        WHEN s.name = 'Tennis'    THEN COALESCE(SUM(pms.points_won), 0)
        WHEN s.name = 'Badminton' THEN COALESCE(SUM(pms.points_won), 0)
        ELSE 0
    END AS score_total,
    COUNT(pms.match_id) AS matches_played
FROM players p
LEFT JOIN teams t        ON p.team_id   = t.team_id
LEFT JOIN sports s       ON t.sport_id  = s.sport_id
LEFT JOIN player_match_stats pms ON p.player_id = pms.player_id
WHERE p.is_deleted = 0
GROUP BY p.player_id
HAVING score_total > 0
ORDER BY sport_name, score_total DESC;

-- VIEW 5: v_team_roster
-- Returns complete team info including player count, sport, coach, venue.
-- Demonstrates LEFT JOIN, GROUP BY, COUNT, COALESCE
CREATE VIEW IF NOT EXISTS v_team_roster AS
SELECT
    t.team_id,
    t.name          AS team_name,
    t.status        AS team_status,
    t.founded_year,
    s.name          AS sport_name,
    s.sport_id,
    COALESCE(c.first_name || ' ' || c.last_name, 'No Coach') AS coach_name,
    c.coach_id,
    COALESCE(v.name, 'No Home Venue')                         AS home_venue,
    v.venue_id,
    COUNT(DISTINCT ptm.player_id)                              AS player_count
FROM teams t
JOIN sports s         ON t.sport_id      = s.sport_id
LEFT JOIN coaches c   ON t.coach_id      = c.coach_id
LEFT JOIN venues v    ON t.home_venue_id  = v.venue_id
LEFT JOIN player_team_memberships ptm ON t.team_id = ptm.team_id AND ptm.is_active = 1
GROUP BY t.team_id;
