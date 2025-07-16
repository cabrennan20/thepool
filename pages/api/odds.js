// pages/api/odds.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ODDS_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'ODDS_API_KEY environment variable is not set' });
  }

  const sport = 'americanfootball_nfl';
  const region = 'us'; // us, uk, eu, au
  const market = 'spreads'; // spreads, h2h, totals

  try {
    const response = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=${region}&markets=${market}&apiKey=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Odds API returned status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Add CORS headers for potential cross-origin requests
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // Cache for 5 minutes
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NFL odds',
      message: error.message || 'Internal server error' 
    });
  }
}
