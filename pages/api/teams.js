// Cache for 1 hour
let cachedTeams = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedTeams && (now - cacheTimestamp) < CACHE_DURATION) {
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200'); // Cache for 1 hour
      return res.status(200).json({ teams: cachedTeams });
    }

    // Fetch fresh data from TheSportsDB
    const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=NFL');
    
    if (!response.ok) {
      throw new Error(`TheSportsDB API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update cache
    cachedTeams = data.teams || [];
    cacheTimestamp = now;
    
    // Add cache headers
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200'); // Cache for 1 hour
    res.status(200).json({ teams: cachedTeams });
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NFL teams',
      message: error.message || 'Internal server error'
    });
  }
}