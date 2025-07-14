-- Migration: Add Recap Feature Support
-- Adds alias field, removes confidence points, adds tiebreaker system

-- 1. Add alias field to users table
ALTER TABLE users ADD COLUMN alias VARCHAR(50);

-- 2. Update users table to make alias unique where not null
CREATE UNIQUE INDEX idx_users_alias ON users(alias) WHERE alias IS NOT NULL;

-- 3. Remove confidence points constraints and column from picks table
ALTER TABLE picks DROP CONSTRAINT IF EXISTS picks_confidence_points_check;
ALTER TABLE picks DROP CONSTRAINT IF EXISTS picks_user_id_confidence_points_game_id_key;
ALTER TABLE picks DROP COLUMN IF EXISTS confidence_points;
ALTER TABLE picks DROP COLUMN IF EXISTS points_earned;

-- 4. Add tiebreaker points for final game predictions
ALTER TABLE picks ADD COLUMN tiebreaker_points INTEGER;

-- 5. Update weekly_scores to remove confidence point references
ALTER TABLE weekly_scores DROP COLUMN IF EXISTS total_points;
ALTER TABLE weekly_scores DROP COLUMN IF EXISTS possible_points;

-- 6. Update season_standings to remove confidence point references  
ALTER TABLE season_standings DROP COLUMN IF EXISTS total_points;
ALTER TABLE season_standings DROP COLUMN IF EXISTS total_possible;

-- 7. Drop and recreate the update_weekly_scores function without confidence points
DROP FUNCTION IF EXISTS update_weekly_scores(INTEGER, INTEGER, INTEGER);

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

-- 8. Update system settings to remove confidence point reference
UPDATE system_settings 
SET setting_value = '1' 
WHERE setting_key = 'max_confidence_points';

DELETE FROM system_settings WHERE setting_key = 'max_confidence_points';

-- 9. Add new system setting for tiebreaker
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('tiebreaker_enabled', 'true', 'Whether tiebreaker points are used')
ON CONFLICT (setting_key) DO NOTHING;

-- 10. Create function to get final game of week for tiebreaker
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

-- 11. Create view for recap data
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

COMMENT ON VIEW recap_data IS 'Provides structured data for weekly recap display';