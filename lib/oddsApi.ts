const API_KEY = process.env.ODDS_API_KEY;

export async function fetchNFLGames() {
  const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&markets=spreads,totals,h2h&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching odds:', error);
    return [];
  }
}

