// frontend/pages/api/odds.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.ODDS_API_KEY;
  const sport = 'americanfootball_nfl';
  const region = 'us'; // us, uk, eu, au
  const market = 'spreads'; // spreads, h2h, totals

  try {
    const response = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=${region}&markets=${market}&apiKey=${apiKey}`);
    if (!response.ok) throw new Error('Failed to fetch from Odds API');
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
