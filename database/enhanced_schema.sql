-- Enhanced NFL Picks Database Schema
-- Based on PRD requirements for 100-person league

-- Drop existing tables if they exist
DROP TABLE IF EXISTS picks CASCADE;
DROP TABLE IF EXISTS weekly_scores CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with authentication and profile info
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    alias VARCHAR(50) UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    timezone VARCHAR(50) DEFAULT 'America/New_York'
);

-- Games table with comprehensive game data
CREATE TABLE games (
    game_id SERIAL PRIMARY KEY,
    season INTEGER NOT NULL DEFAULT 2025,
    week INTEGER NOT NULL,
    game_date TIMESTAMP NOT NULL,
    home_team VARCHAR(10) NOT NULL,
    away_team VARCHAR(10) NOT NULL,
    home_score INTEGER DEFAULT NULL,
    away_score INTEGER DEFAULT NULL,
    spread DECIMAL(4,1) DEFAULT NULL, -- Positive means home team favored
    game_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, final
    odds_api_id VARCHAR(50), -- Reference to The Odds API
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(season, week, home_team, away_team)
);

-- Simplified picks table for team selection and tiebreaker
CREATE TABLE picks (
    pick_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
    selected_team VARCHAR(10) NOT NULL, -- Team abbreviation
    tiebreaker_points INTEGER, -- Total points prediction for final game
    pick_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_correct BOOLEAN DEFAULT NULL, -- NULL until game complete
    UNIQUE(user_id, game_id)
);

-- Weekly scores aggregation
CREATE TABLE weekly_scores (
    score_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season INTEGER NOT NULL DEFAULT 2025,
    correct_picks INTEGER DEFAULT 0,
    total_picks INTEGER DEFAULT 0,
    win_percentage DECIMAL(5,2) DEFAULT 0.00,
    weekly_rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, season, week)
);

-- Season standings
CREATE TABLE season_standings (
    standing_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    season INTEGER NOT NULL DEFAULT 2025,
    total_correct INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    win_percentage DECIMAL(5,2) DEFAULT 0.00,
    season_rank INTEGER,
    weeks_played INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, season)
);

-- User sessions for authentication
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT
);

-- System settings
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_games_season_week ON games(season, week);
CREATE INDEX idx_games_status ON games(game_status);
CREATE INDEX idx_picks_user_week ON picks(user_id, game_id);
CREATE INDEX idx_weekly_scores_season_week ON weekly_scores(season, week);
CREATE INDEX idx_weekly_scores_user ON weekly_scores(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_weekly_scores(p_user_id INTEGER, p_week INTEGER, p_season INTEGER DEFAULT 2025)
RETURNS VOID AS $$
BEGIN
    INSERT INTO weekly_scores (user_id, week, season, correct_picks, total_picks, win_percentage)
    SELECT 
        p_user_id,
        p_week,
        p_season,
        COALESCE(SUM(CASE WHEN p.is_correct = TRUE THEN 1 ELSE 0 END), 0) as correct_picks,
        COUNT(p.pick_id) as total_picks,
        CASE 
            WHEN COUNT(p.pick_id) > 0 THEN 
                ROUND((SUM(CASE WHEN p.is_correct = TRUE THEN 1 ELSE 0 END)::DECIMAL / COUNT(p.pick_id)) * 100, 2)
            ELSE 0 
        END as win_percentage
    FROM picks p
    JOIN games g ON p.game_id = g.game_id
    WHERE p.user_id = p_user_id 
      AND g.week = p_week 
      AND g.season = p_season
      AND g.game_status = 'final'
    ON CONFLICT (user_id, season, week) 
    DO UPDATE SET
        correct_picks = EXCLUDED.correct_picks,
        total_picks = EXCLUDED.total_picks,
        win_percentage = EXCLUDED.win_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to get final game of week for tiebreaker
CREATE OR REPLACE FUNCTION get_final_game_of_week(p_week INTEGER, p_season INTEGER DEFAULT 2025)
RETURNS INTEGER AS $$
DECLARE
    final_game_id INTEGER;
BEGIN
    SELECT game_id INTO final_game_id
    FROM games 
    WHERE week = p_week AND season = p_season
    ORDER BY game_date DESC, game_id DESC
    LIMIT 1;
    
    RETURN final_game_id;
END;
$$ LANGUAGE plpgsql;

-- View for recap data
CREATE OR REPLACE VIEW recap_data AS
SELECT 
    u.user_id,
    u.alias,
    u.username,
    p.game_id,
    p.selected_team,
    p.tiebreaker_points,
    g.week,
    g.season,
    g.home_team,
    g.away_team,
    g.game_date,
    g.game_status,
    (g.game_id = get_final_game_of_week(g.week, g.season)) as is_final_game
FROM users u
LEFT JOIN picks p ON u.user_id = p.user_id
LEFT JOIN games g ON p.game_id = g.game_id
WHERE u.is_active = true
ORDER BY u.alias, g.game_date;

-- Sample data for testing
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('current_season', '2025', 'Current NFL season'),
('current_week', '1', 'Current NFL week'),
('pick_deadline_hours', '1', 'Hours before game start that picks lock'),
('tiebreaker_enabled', 'true', 'Whether tiebreaker points are used'),
('league_name', 'The Pool', 'Name of the league'),
('league_size', '100', 'Maximum number of users');

-- Create admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin) VALUES
('admin', 'admin@thepool.com', '$2b$10$example_hash_here', 'Admin', 'User', TRUE);

-- Sample games for Week 1 2025 (these would be populated from The Odds API)
INSERT INTO games (season, week, game_date, home_team, away_team, spread, odds_api_id) VALUES
(2025, 1, '2025-09-07 13:00:00', 'BUF', 'NYJ', -3.5, 'odds_api_game_1'),
(2025, 1, '2025-09-07 13:00:00', 'MIA', 'NE', -7.0, 'odds_api_game_2'),
(2025, 1, '2025-09-07 16:25:00', 'KC', 'LV', -6.5, 'odds_api_game_3'),
(2025, 1, '2025-09-07 20:20:00', 'LAR', 'DAL', -1.5, 'odds_api_game_4');