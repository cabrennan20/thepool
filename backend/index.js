const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.post("/api/picks", async (req, res) => {
  const userId = 1; // stub
  const picks = req.body;
  for (let gameId in picks) {
    await pool.query(
      "INSERT INTO picks (user_id, game_id, selected_team) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [userId, gameId, picks[gameId]]
    );
  }
  res.json({ success: true });
});

app.get("/api/leaderboard", async (req, res) => {
  const result = await pool.query(
    `SELECT u.name, COUNT(p.correct) as wins
     FROM picks p JOIN users u ON p.user_id = u.id
     WHERE p.correct = true
     GROUP BY u.name ORDER BY wins DESC`
  );
  res.json(result.rows);
});

app.listen(3001, () => console.log("API running on http://localhost:3001"));
