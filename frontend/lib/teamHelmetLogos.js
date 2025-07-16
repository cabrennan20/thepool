// Team helmet logos using ESPN CDN
// Format: https://a.espncdn.com/i/teamlogos/nfl/500/{team}.png

// Mapping from team abbreviations to ESPN team codes
const teamAbbreviationToESPN = {
  'ARI': 'ari',
  'ATL': 'atl',
  'BAL': 'bal',
  'BUF': 'buf',
  'CAR': 'car',
  'CHI': 'chi',
  'CIN': 'cin',
  'CLE': 'cle',
  'DAL': 'dal',
  'DEN': 'den',
  'DET': 'det',
  'GB': 'gb',
  'HOU': 'hou',
  'IND': 'ind',
  'JAX': 'jax',
  'KC': 'kc',
  'LV': 'lv',
  'LAC': 'lac',
  'LAR': 'lar',
  'MIA': 'mia',
  'MIN': 'min',
  'NE': 'ne',
  'NO': 'no',
  'NYG': 'nyg',
  'NYJ': 'nyj',
  'PHI': 'phi',
  'PIT': 'pit',
  'SF': 'sf',
  'SEA': 'sea',
  'TB': 'tb',
  'TEN': 'ten',
  'WAS': 'was'
};

// Mapping from full team names to ESPN team codes
const teamNameToESPN = {
  'Arizona Cardinals': 'ari',
  'Atlanta Falcons': 'atl',
  'Baltimore Ravens': 'bal',
  'Buffalo Bills': 'buf',
  'Carolina Panthers': 'car',
  'Chicago Bears': 'chi',
  'Cincinnati Bengals': 'cin',
  'Cleveland Browns': 'cle',
  'Dallas Cowboys': 'dal',
  'Denver Broncos': 'den',
  'Detroit Lions': 'det',
  'Green Bay Packers': 'gb',
  'Houston Texans': 'hou',
  'Indianapolis Colts': 'ind',
  'Jacksonville Jaguars': 'jax',
  'Kansas City Chiefs': 'kc',
  'Las Vegas Raiders': 'lv',
  'Los Angeles Chargers': 'lac',
  'Los Angeles Rams': 'lar',
  'Miami Dolphins': 'mia',
  'Minnesota Vikings': 'min',
  'New England Patriots': 'ne',
  'New Orleans Saints': 'no',
  'New York Giants': 'nyg',
  'New York Jets': 'nyj',
  'Philadelphia Eagles': 'phi',
  'Pittsburgh Steelers': 'pit',
  'San Francisco 49ers': 'sf',
  'Seattle Seahawks': 'sea',
  'Tampa Bay Buccaneers': 'tb',
  'Tennessee Titans': 'ten',
  'Washington Commanders': 'was'
};

/**
 * Get helmet logo URL for a team
 * @param teamIdentifier - Can be team abbreviation (e.g., 'KC') or full name (e.g., 'Kansas City Chiefs')
 * @param size - Logo size (default: 500) - also available: 50, 100, 200, 300
 * @returns URL to team helmet logo
 */
export function getTeamHelmetLogo(teamIdentifier, size = 500) {
  // First try abbreviation mapping
  let espnCode = teamAbbreviationToESPN[teamIdentifier.toUpperCase()];
  
  // If not found, try full name mapping
  if (!espnCode) {
    espnCode = teamNameToESPN[teamIdentifier];
  }
  
  // If still not found, try to extract abbreviation from common patterns
  if (!espnCode) {
    // Handle cases like "Los Angeles Rams" -> "LAR"
    const abbreviations = Object.keys(teamAbbreviationToESPN);
    const found = abbreviations.find(abbr => {
      const fullName = Object.keys(teamNameToESPN).find(name => 
        teamNameToESPN[name] === teamAbbreviationToESPN[abbr]
      );
      return fullName && (
        teamIdentifier.includes(fullName) || 
        fullName.includes(teamIdentifier)
      );
    });
    
    if (found) {
      espnCode = teamAbbreviationToESPN[found];
    }
  }
  
  // Fallback to 'nfl' logo if team not found
  if (!espnCode) {
    console.warn(`Team not found: ${teamIdentifier}, using NFL logo`);
    espnCode = 'nfl';
  }
  
  return `https://a.espncdn.com/i/teamlogos/nfl/${size}/${espnCode}.png`;
}

/**
 * Get multiple helmet logos at once
 * @param teamIdentifiers - Array of team identifiers
 * @param size - Logo size (default: 500)
 * @returns Object mapping team identifiers to their helmet logo URLs
 */
export function getMultipleTeamHelmetLogos(
  teamIdentifiers, 
  size = 500
) {
  const logos = {};
  
  teamIdentifiers.forEach(team => {
    logos[team] = getTeamHelmetLogo(team, size);
  });
  
  return logos;
}

/**
 * Check if a team identifier is valid
 * @param teamIdentifier - Team abbreviation or full name
 * @returns boolean indicating if team is recognized
 */
export function isValidTeam(teamIdentifier) {
  const upperCase = teamIdentifier.toUpperCase();
  return !!(teamAbbreviationToESPN[upperCase] || teamNameToESPN[teamIdentifier]);
}

/**
 * Get all available team data
 * @returns Array of team objects with abbreviation, name, and helmet logo URL
 */
export function getAllTeams(size = 500) {
  return Object.entries(teamAbbreviationToESPN).map(([abbr, espnCode]) => {
    const name = Object.keys(teamNameToESPN).find(
      teamName => teamNameToESPN[teamName] === espnCode
    ) || abbr;
    
    return {
      abbreviation: abbr,
      name,
      helmetsLogo: `https://a.espncdn.com/i/teamlogos/nfl/${size}/${espnCode}.png`
    };
  });
}

/**
 * Get full team name from abbreviation
 * @param abbreviation - Team abbreviation (e.g., 'KC')
 * @returns Full team name (e.g., 'Kansas City Chiefs') or abbreviation if not found
 */
export function getFullTeamName(abbreviation) {
  const upperAbbr = abbreviation.toUpperCase();
  const espnCode = teamAbbreviationToESPN[upperAbbr];
  
  if (espnCode) {
    const fullName = Object.keys(teamNameToESPN).find(
      name => teamNameToESPN[name] === espnCode
    );
    return fullName || abbreviation;
  }
  
  return abbreviation;
}

/**
 * Fallback function to handle logo loading errors
 * @param teamIdentifier - Team identifier
 * @returns Fallback logo URL (NFL shield)
 */
export function getFallbackLogo(): string {
  return 'https://a.espncdn.com/i/teamlogos/nfl/500/nfl.png';
}