const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4).max(100)
});

const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_\s]+$/, 'Username can only contain letters, numbers, spaces, and underscores'),
  email: z.string().email().max(100),
  password: z.string().min(8).max(100),
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  alias: z.string().min(2).max(50).regex(/^[a-zA-Z0-9\s&'-]+$/, 'Alias can only contain letters, numbers, spaces, and common symbols'),
  phone: z.string().min(10).max(20).regex(/^[\d\s\-+().\s]+$/, 'Phone number can only contain digits, spaces, and common symbols'),
  venmo_paypal_handle: z.string().min(1).max(100).regex(/^(@?[a-zA-Z0-9_-]+|[^\s@]+@[^\s@]+\.[^\s@]+)$/, 'Handle must be a valid username or email format')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8).max(100, 'Password must be between 8 and 100 characters')
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.user_id, 
      username: user.username,
      isAdmin: user.is_admin 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to check admin status
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { username, email, password, first_name, last_name, alias, phone, venmo_paypal_handle } = validatedData;

    // Check if user already exists (username, email, or alias)
    const existingUser = await req.db.query(
      'SELECT user_id FROM users WHERE username = $1 OR email = $2 OR alias = $3',
      [username, email, alias]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Username, email, or alias already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await req.db.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, alias, phone, venmo_paypal_handle) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING user_id, username, email, first_name, last_name, alias, is_admin, created_at`,
      [username, email, password_hash, first_name, last_name, alias, phone, venmo_paypal_handle]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    // Update last login
    await req.db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        alias: user.alias,
        is_admin: user.is_admin
      },
      token
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { username, password } = validatedData;

    // Find user
    const result = await req.db.query(
      `SELECT user_id, username, email, password_hash, first_name, last_name, is_admin, is_active 
       FROM users WHERE username = $1 OR email = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    await req.db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin
      },
      token
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT user_id, username, email, first_name, last_name, alias, is_admin, created_at, last_login
       FROM users WHERE user_id = $1 AND is_active = true`,
      [req.user.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// POST /api/auth/logout - Logout (client-side token deletion)
router.post('/logout', authenticateToken, (req, res) => {
  // In a more complex system, you might blacklist the token
  // For now, client will just delete the token
  res.json({ message: 'Logout successful' });
});

// POST /api/auth/forgot-password - Send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    // Find user by email
    const result = await req.db.query(
      'SELECT user_id, email, alias FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        message: 'If that email address is in our system, we have sent a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await req.db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3',
      [resetToken, resetTokenExpiry, user.user_id]
    );

    // Send reset email
    const emailResult = await emailService.sendPasswordReset(user, resetToken);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    res.json({ 
      message: 'If that email address is in our system, we have sent a password reset link.' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const { token, password } = validatedData;

    // Find user with valid reset token
    const result = await req.db.query(
      'SELECT user_id, email, alias FROM users WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP AND is_active = true',
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await req.db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2',
      [password_hash, user.user_id]
    );

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// PUT /api/auth/change-password - Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get current password hash
    const result = await req.db.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await req.db.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [newPasswordHash, req.user.userId]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = { 
  router, 
  authenticateToken, 
  requireAdmin 
};