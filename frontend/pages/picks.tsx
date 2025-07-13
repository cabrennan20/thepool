import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
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

interface Pick {
  gameId: string;
  team: string;
  confidence: number;
}

const PicksPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/odds');
        if (!response.ok) throw new Error('Failed to fetch games');
        const data = await response.json();
        setGames(data);
        
        // Load saved picks from localStorage
        const savedPicks = localStorage.getItem(`picks_${user?.id}`);
        if (savedPicks) {
          setPicks(JSON.parse(savedPicks));
        }
        
        // Fetch team logos for all teams
        const allTeams = new Set<string>();
        data.forEach((game: Game) => {
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

    if (user) {
      fetchGames();
    }
  }, [user]);

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

  const updatePick = (gameId: string, team: string, confidence: number) => {
    const newPicks = picks.filter(p => p.gameId !== gameId);
    if (team && confidence > 0) {
      newPicks.push({ gameId, team, confidence });
    }
    setPicks(newPicks);
    setSaved(false);
  };

  const getPick = (gameId: string) => {
    return picks.find(p => p.gameId === gameId);
  };

  const savePicks = () => {
    if (user) {
      localStorage.setItem(`picks_${user.id}`, JSON.stringify(picks));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const getAvailableConfidences = (gameId: string) => {
    const usedConfidences = picks
      .filter(p => p.gameId !== gameId)
      .map(p => p.confidence);
    
    return Array.from({ length: games.length }, (_, i) => i + 1)
      .filter(conf => !usedConfidences.includes(conf));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading games...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Make Your Weekly Picks</h1>
          <p className="mt-2 text-gray-600">
            Select your pick for each game and assign confidence points (1 = least confident, {games.length} = most confident)
          </p>
        </div>

        {error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : (
          <div className="space-y-6">
            {games.map((game) => {
              const currentPick = getPick(game.id);
              const spread = getSpread(game);
              const availableConfidences = getAvailableConfidences(game.id);

              return (
                <div key={game.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-6">
                      {/* Away Team */}
                      <div className="flex items-center space-x-3">
                        {teamLogos[game.away_team] && (
                          <img 
                            src={teamLogos[game.away_team]} 
                            alt={game.away_team}
                            className="w-12 h-12 object-contain"
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
                            className="w-12 h-12 object-contain"
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
                        {game.home_team} {spread && spread > 0 ? '+' : ''}{spread || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Team Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pick Winner
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`game_${game.id}`}
                            value={game.away_team}
                            checked={currentPick?.team === game.away_team}
                            onChange={(e) => updatePick(game.id, e.target.value, currentPick?.confidence || 1)}
                            className="mr-3"
                          />
                          {teamLogos[game.away_team] && (
                            <img 
                              src={teamLogos[game.away_team]} 
                              alt={game.away_team}
                              className="w-6 h-6 object-contain mr-2"
                            />
                          )}
                          <span className="font-medium">{game.away_team}</span>
                        </label>
                        <label className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`game_${game.id}`}
                            value={game.home_team}
                            checked={currentPick?.team === game.home_team}
                            onChange={(e) => updatePick(game.id, e.target.value, currentPick?.confidence || 1)}
                            className="mr-3"
                          />
                          {teamLogos[game.home_team] && (
                            <img 
                              src={teamLogos[game.home_team]} 
                              alt={game.home_team}
                              className="w-6 h-6 object-contain mr-2"
                            />
                          )}
                          <span className="font-medium">{game.home_team}</span>
                        </label>
                      </div>
                    </div>

                    {/* Confidence Points */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confidence Points
                      </label>
                      <select
                        value={currentPick?.confidence || ''}
                        onChange={(e) => {
                          const confidence = parseInt(e.target.value);
                          if (currentPick?.team && confidence) {
                            updatePick(game.id, currentPick.team, confidence);
                          }
                        }}
                        disabled={!currentPick?.team}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select confidence</option>
                        {currentPick?.confidence && !availableConfidences.includes(currentPick.confidence) && (
                          <option value={currentPick.confidence}>{currentPick.confidence}</option>
                        )}
                        {availableConfidences.map(conf => (
                          <option key={conf} value={conf}>{conf}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pick Summary */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Pick
                      </label>
                      <div className="text-sm">
                        {currentPick ? (
                          <div className="p-2 bg-green-100 rounded">
                            <div className="font-medium">{currentPick.team}</div>
                            <div className="text-gray-600">Confidence: {currentPick.confidence}</div>
                          </div>
                        ) : (
                          <div className="p-2 bg-gray-100 rounded text-gray-500">
                            No pick made
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Save Button */}
            <div className="text-center">
              <button
                onClick={savePicks}
                disabled={picks.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-md font-medium"
              >
                {saved ? 'Picks Saved!' : `Save Picks (${picks.length}/${games.length})`}
              </button>
            </div>

            {/* Picks Summary */}
            {picks.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Picks Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {picks
                    .sort((a, b) => b.confidence - a.confidence)
                    .map((pick) => {
                      const game = games.find(g => g.id === pick.gameId);
                      return (
                        <div key={pick.gameId} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <span className="font-medium">{pick.team}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              vs {game?.home_team === pick.team ? game.away_team : game?.home_team}
                            </span>
                          </div>
                          <div className="font-medium text-indigo-600">
                            {pick.confidence} pts
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PicksPage;