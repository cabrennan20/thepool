const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Setup endpoint to create admin user
router.get('/create-admin', async (req, res) => {
  try {
    console.log('🔐 Creating admin user via API endpoint...');
    
    const adminPassword = 'password123';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    
    // Delete existing admin user if exists
    await req.db.query('DELETE FROM users WHERE username = $1 OR email = $2', ['admin', 'admin@thepool.com']);
    
    // Create new admin user
    const result = await req.db.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING user_id, username, email, is_admin
    `, ['admin', 'admin@thepool.com', passwordHash, 'Admin', 'User', true, true]);
    
    const admin = result.rows[0];
    
    res.json({
      success: true,
      message: 'Admin user created successfully!',
      admin: {
        user_id: admin.user_id,
        username: admin.username,
        email: admin.email,
        is_admin: admin.is_admin
      },
      credentials: {
        username: 'admin',
        password: adminPassword
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;