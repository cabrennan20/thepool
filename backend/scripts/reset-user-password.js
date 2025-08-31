const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function resetUserPassword() {
  try {
    const username = 'cabrennan20';
    const newPassword = 'testing123'; // Temporary password for testing
    
    console.log(`🔐 Resetting password for user: ${username}`);
    
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT user_id, username, alias FROM users WHERE username = $1',
      [username]
    );
    
    if (userCheck.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userCheck.rows[0];
    console.log(`👤 Found user: ${user.username} (${user.alias})`);
    
    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [passwordHash, username]
    );
    
    console.log('✅ Password reset successfully:');
    console.log(`   Username: ${username}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   Alias: ${user.alias}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
resetUserPassword();