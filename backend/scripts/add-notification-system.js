const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function addNotificationSystem() {
  try {
    console.log('🔧 Adding notification system to database...');

    // Create notification_log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_log (
        log_id SERIAL PRIMARY KEY,
        notification_type VARCHAR(50) NOT NULL,
        week INTEGER,
        season INTEGER,
        recipients_successful INTEGER DEFAULT 0,
        recipients_failed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details JSONB
      );
    `);

    console.log('✅ notification_log table created');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_log_type_week 
      ON notification_log(notification_type, week, season);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_log_created_at 
      ON notification_log(created_at);
    `);

    console.log('✅ Notification system indexes created');

    // Add user preferences table for future use
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        email_pick_reminders BOOLEAN DEFAULT true,
        email_weekly_recap BOOLEAN DEFAULT true,
        email_urgent_reminders BOOLEAN DEFAULT true,
        sms_pick_reminders BOOLEAN DEFAULT false,
        reminder_hours_before INTEGER DEFAULT 24,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id)
      );
    `);

    console.log('✅ user_notification_preferences table created');

    // Insert default preferences for existing users
    await pool.query(`
      INSERT INTO user_notification_preferences (user_id)
      SELECT user_id FROM users
      WHERE user_id NOT IN (SELECT user_id FROM user_notification_preferences)
      ON CONFLICT (user_id) DO NOTHING;
    `);

    console.log('✅ Default notification preferences added for existing users');

    console.log('🎉 Notification system setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up notification system:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  addNotificationSystem()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addNotificationSystem };