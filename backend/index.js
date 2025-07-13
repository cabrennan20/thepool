const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use('/api/', limiter);

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('🗄️  Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Import route handlers
const { router: authRoutes } = require('./routes/auth');
const gameRoutes = require('./routes/games');
const pickRoutes = require('./routes/picks');
const scoreRoutes = require('./routes/scores');
const adminRoutes = require('./routes/admin');
const systemRoutes = require('./routes/system');

// Add database pool to request object
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/picks', pickRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// GET /api/users/:userId/stats - Get user stats for dashboard
app.get("/api/users/:userId/stats", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const season = parseInt(req.query.season) || new Date().getFullYear();
    
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(ws.correct_picks), 0) as total_correct,
        COALESCE(SUM(ws.total_picks), 0) as total_games,
        COALESCE(AVG(ws.win_percentage), 0) as win_percentage,
        COUNT(ws.week) as weeks_played,
        0 as season_rank
      FROM weekly_scores ws
      WHERE ws.user_id = $1 AND ws.season = $2
    `, [userId, season]);
    
    const stats = result.rows[0] || {
      total_correct: 0,
      total_games: 0, 
      win_percentage: 0,
      weeks_played: 0,
      season_rank: 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Backward compatibility for existing frontend API calls
app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.username,
        u.first_name,
        u.last_name,
        COALESCE(SUM(ws.correct_picks), 0) as total_wins,
        COALESCE(SUM(ws.total_picks), 0) as total_games,
        COALESCE(AVG(ws.win_percentage), 0) as win_percentage
      FROM users u 
      LEFT JOIN weekly_scores ws ON u.user_id = ws.user_id
      WHERE u.is_active = true
      GROUP BY u.user_id, u.username, u.first_name, u.last_name
      ORDER BY total_wins DESC, win_percentage DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 NFL Picks API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Development mode - CORS enabled for ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  }
});