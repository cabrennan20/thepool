import { useEffect, useState } from "react";
import { fetchNFLGames } from "../lib/oddsApi";

type Game = {
  id: string;
  home_team: string;
  away_team: string;
  bookmakers: any[];
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const data = await fetchNFLGames();
        setGames(data);
      } catch (err: any) {
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  if (loading) return <p>Loading NFL games...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <main style={{ padding: "2rem" }}>
      <h1>NFL Game Odds</h1>
      <ul>
        {games.map((game) => (
          <li key={game.id} style={{ marginBottom: "1rem" }}>
            {game.away_team} @ {game.home_team}
          </li>
        ))}
      </ul>
    </main>
  );
}

