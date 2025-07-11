CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  week INT,
  home_team TEXT,
  away_team TEXT,
  kickoff TIMESTAMP,
  winner TEXT
);

CREATE TABLE picks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  game_id INT REFERENCES games(id),
  selected_team TEXT,
  correct BOOLEAN DEFAULT NULL,
  UNIQUE(user_id, game_id)
);

-- Seed a couple of games
INSERT INTO games (week, home_team, away_team, kickoff) VALUES
(1, 'Patriots', 'Jets', '2025-09-07 13:00:00'),
(1, 'Bills', 'Dolphins', '2025-09-07 13:00:00');

-- Seed a user
INSERT INTO users (name, email) VALUES ('Dad', 'dad@example.com');
