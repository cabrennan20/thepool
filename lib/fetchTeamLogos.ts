// Only if needed for server-side: import fetch from 'node-fetch';


// lib/fetchTeamLogos.ts

export async function fetchTeamLogos(): Promise<Record<string, string>> {
  try {
    const response = await fetch(
      'https://www.thesportsdb.com/api/v1/json/1/search_all_teams.php?l=NFL'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch logos: ${response.status}`);
    }

    const data = await response.json();

    if (!data.teams) {
      throw new Error('No teams found in API response');
    }

    const logoMap: Record<string, string> = {};
    for (const team of data.teams) {
      if (team.strTeam && team.strTeamBadge) {
        logoMap[team.strTeam] = team.strTeamBadge;
      }
    }

    return logoMap;
  } catch (error) {
    console.error('Error fetching team logos:', error);
    return {};
  }
}

