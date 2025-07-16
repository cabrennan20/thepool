// pages/api/games.js

export default async function handler(req, res) {
  const apiKey = process.env.ODDS_API_KEY;
  const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?regions=us&markets=spreads,totals,h2h&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data from Odds API' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

