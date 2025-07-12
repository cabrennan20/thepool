// frontend/lib/fetchOdds.ts
export async function fetchNFLGameLines() {
  const apiKey = process.env.ODDS_API_KEY;

  const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?regions=us&markets=spreads,totals,h2h&oddsFormat=american&apiKey=${apiKey}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch odds: ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}

