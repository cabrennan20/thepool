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

export async function fetchNFLTeams(): Promise<NFLTeam[]> {
  try {
    // Use our local API endpoint for better caching and error handling
    const response = await fetch('/api/teams');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status}`);
    }
    
    const data: TeamsResponse = await response.json();
    return data.teams || [];
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    return [];
  }
}

export async function getTeamByName(teamName: string): Promise<NFLTeam | null> {
  const teams = await fetchNFLTeams();
  
  // Try exact match first
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

export async function getTeamLogo(teamName: string): Promise<string | null> {
  const team = await getTeamByName(teamName);
  return team?.strLogo || team?.strBadge || null;
}

export async function getTeamColors(teamName: string): Promise<{ primary: string; secondary: string; tertiary: string } | null> {
  const team = await getTeamByName(teamName);
  if (!team) return null;
  
  return {
    primary: team.strColour1 || '#000000',
    secondary: team.strColour2 || '#FFFFFF', 
    tertiary: team.strColour3 || '#808080'
  };
}

export async function getTeamInfo(teamName: string): Promise<{
  name: string;
  shortName: string;
  logo: string;
  stadium: string;
  location: string;
  founded: string;
  colors: { primary: string; secondary: string; tertiary: string };
} | null> {
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
let teamCache: NFLTeam[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedNFLTeams(): Promise<NFLTeam[]> {
  const now = Date.now();
  
  if (teamCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return teamCache;
  }
  
  teamCache = await fetchNFLTeams();
  cacheTimestamp = now;
  return teamCache;
}