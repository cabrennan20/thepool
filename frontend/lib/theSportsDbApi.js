export async function fetchNFLTeams() {
  try {
    // Use our local API endpoint for better caching and error handling
    const response = await fetch('/api/teams');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status}`);
    }
    
    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    return [];
  }
}

// Map our team abbreviations to TheSportsDB team names
const teamAbbreviationMap = {
  'ARI': 'Arizona Cardinals',
  'ATL': 'Atlanta Falcons', 
  'BAL': 'Baltimore Ravens',
  'BUF': 'Buffalo Bills',
  'CAR': 'Carolina Panthers',
  'CHI': 'Chicago Bears',
  'CIN': 'Cincinnati Bengals',
  'CLE': 'Cleveland Browns',
  'DAL': 'Dallas Cowboys',
  'DEN': 'Denver Broncos',
  'DET': 'Detroit Lions',
  'GB': 'Green Bay Packers',
  'HOU': 'Houston Texans',
  'IND': 'Indianapolis Colts',
  'JAX': 'Jacksonville Jaguars',
  'KC': 'Kansas City Chiefs',
  'LV': 'Las Vegas Raiders',
  'LAC': 'Los Angeles Chargers',
  'LAR': 'Los Angeles Rams',
  'MIA': 'Miami Dolphins',
  'MIN': 'Minnesota Vikings',
  'NE': 'New England Patriots',
  'NO': 'New Orleans Saints',
  'NYG': 'New York Giants',
  'NYJ': 'New York Jets',
  'PHI': 'Philadelphia Eagles',
  'PIT': 'Pittsburgh Steelers',
  'SF': 'San Francisco 49ers',
  'SEA': 'Seattle Seahawks',
  'TB': 'Tampa Bay Buccaneers',
  'TEN': 'Tennessee Titans',
  'WAS': 'Washington Commanders'
};

export async function getTeamByName(teamName) {
  const teams = await fetchNFLTeams();
  
  // If it's an abbreviation, use our mapping first
  const fullName = teamAbbreviationMap[teamName];
  if (fullName) {
    const team = teams.find(t => t.strTeam === fullName);
    if (team) return team;
  }
  
  // Try exact match
  let team = teams.find(t => 
    t.strTeam === teamName || 
    t.strTeamShort === teamName ||
    t.strTeamAlternate === teamName
  );
  
  // If no exact match, try partial match
  if (!team) {
    team = teams.find(t => 
      t.strTeam.includes(teamName) ||
      teamName.includes(t.strTeam) ||
      teamName.includes(t.strTeamAlternate || '')
    );
  }
  
  return team || null;
}

export async function getTeamLogo(teamName) {
  const team = await getTeamByName(teamName);
  return team?.strLogo || team?.strBadge || null;
}

export async function getTeamColors(teamName) {
  const team = await getTeamByName(teamName);
  if (!team) return null;
  
  return {
    primary: team.strColour1 || '#000000',
    secondary: team.strColour2 || '#FFFFFF', 
    tertiary: team.strColour3 || '#808080'
  };
}

export async function getTeamInfo(teamName) {
  const team = await getTeamByName(teamName);
  if (!team) return null;
  
  return {
    name: team.strTeam,
    shortName: team.strTeamShort,
    logo: team.strLogo || team.strBadge,
    stadium: team.strStadium,
    location: team.strLocation,
    founded: team.intFormedYear,
    colors: {
      primary: team.strColour1 || '#000000',
      secondary: team.strColour2 || '#FFFFFF',
      tertiary: team.strColour3 || '#808080'
    }
  };
}

// Cache for team data to avoid repeated API calls
let teamCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedNFLTeams() {
  const now = Date.now();
  
  if (teamCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return teamCache;
  }
  
  teamCache = await fetchNFLTeams();
  cacheTimestamp = now;
  return teamCache;
}