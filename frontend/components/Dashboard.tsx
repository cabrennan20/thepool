import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTeamLogo } from '../lib/theSportsDbApi';

interface Game {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Array<{
    markets: Array<{
      outcomes: Array<{
        name: string;
        point: number;
      }>;
    }>;
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/odds');
        if (!response.ok) throw new Error('Failed to fetch games');
        const data = await response.json();
        const gameData = data.slice(0, 8); // Show first 8 games
        setGames(gameData);
        
        // Fetch team logos for all teams
        const allTeams = new Set<string>();
        gameData.forEach((game: Game) => {
          allTeams.add(game.home_team);
          allTeams.add(game.away_team);
        });
        
        const logoPromises = Array.from(allTeams).map(async (teamName) => {
          const logo = await getTeamLogo(teamName);
          return { teamName, logo };
        });
        
        const logoResults = await Promise.all(logoPromises);
        const logoMap: Record<string, string> = {};
        logoResults.forEach(({ teamName, logo }) => {
          if (logo) logoMap[teamName] = logo;
        });
        
        setTeamLogos(logoMap);
      } catch (err) {
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getSpread = (game: Game) => {
    const market = game.bookmakers?.[0]?.markets?.[0];
    if (!market) return null;
    
    const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
    return homeOutcome?.point || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading games...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
        <p className="mt-2 text-gray-600">Here are this week's NFL games available for picks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">W</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Wins</dt>
                  <dd className="text-lg font-medium text-gray-900">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">L</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Losses</dt>
                  <dd className="text-lg font-medium text-gray-900">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">0%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">This Week's Games</h2>
          
          {error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <div key={game.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Away Team */}
                      <div className="flex items-center space-x-3">
                        {teamLogos[game.away_team] && (
                          <img 
                            src={teamLogos[game.away_team]} 
                            alt={game.away_team}
                            className="w-10 h-10 object-contain"
                          />
                        )}
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{game.away_team}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 font-medium">@</div>
                      
                      {/* Home Team */}
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{game.home_team}</div>
                        </div>
                        {teamLogos[game.home_team] && (
                          <img 
                            src={teamLogos[game.home_team]} 
                            alt={game.home_team}
                            className="w-10 h-10 object-contain"
                          />
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {formatDate(game.commence_time)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Spread</div>
                      <div className="font-medium">
                        {game.home_team} {getSpread(game) && getSpread(game)! > 0 ? '+' : ''}{getSpread(game) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {games.length > 0 && (
            <div className="mt-6 text-center">
              <a 
                href="/picks"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium inline-block"
              >
                Make Your Picks
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;