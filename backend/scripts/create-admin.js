const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user with proper password...');
    
    const adminPassword = 'password123'; // Default admin password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    
    // Delete existing admin user if exists
    await pool.query('DELETE FROM users WHERE username = $1 OR email = $2', ['admin', 'admin@thepool.com']);
    
    // Create new admin user
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING user_id, username, email, is_admin
    `, ['admin', 'admin@thepool.com', passwordHash, 'Admin', 'User', true, true]);
    
    const admin = result.rows[0];
    console.log('✅ Admin user created successfully:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   User ID: ${admin.user_id}`);
    console.log(`   Admin: ${admin.is_admin}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
createAdminUser();