import type { NextApiRequest, NextApiResponse } from 'next';

interface NFLTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string;
  strTeamAlternate: string;
  strStadium: string;
  strLocation: string;
  intStadiumCapacity: string;
  strWebsite: string;
  strBadge: string;
  strLogo: string;
  strColour1: string;
  strColour2: string;
  strColour3: string;
  strDescriptionEN: string;
  intFormedYear: string;
}

interface TeamsResponse {
  teams: NFLTeam[];
}

// Cache for 1 hour
let cachedTeams: NFLTeam[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedTeams && (now - cacheTimestamp) < CACHE_DURATION) {
      return res.status(200).json({ teams: cachedTeams });
    }

    // Fetch fresh data from TheSportsDB
    const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=NFL');
    
    if (!response.ok) {
      throw new Error(`TheSportsDB API returned status ${response.status}`);
    }
    
    const data: TeamsResponse = await response.json();
    
    // Update cache
    cachedTeams = data.teams || [];
    cacheTimestamp = now;
    
    res.status(200).json({ teams: cachedTeams });
  } catch (error: any) {
    console.error('Error fetching NFL teams:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NFL teams',
      message: error.message || 'Internal server error'
    });
  }
}