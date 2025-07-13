import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { getTeamLogo } from '../lib/theSportsDbApi';
import { api, type Game, type Pick } from '../lib/api';

interface GameWithLogos extends Game {
  home_logo?: string;
  away_logo?: string;
}

interface PickFormData {
  game_id: number;
  selected_team: string;
}

const PicksPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [games, setGames] = useState<GameWithLogos[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch games from backend
        const gamesData = await api.getCurrentWeekGames();
        
        // Fetch team logos
        const gamesWithLogos = await Promise.all(
          gamesData.map(async (game) => {
            const [homeLogo, awayLogo] = await Promise.all([
              getTeamLogo(game.home_team),
              getTeamLogo(game.away_team)
            ]);
            return {
              ...game,
              home_logo: homeLogo || undefined,
              away_logo: awayLogo || undefined
            };
          })
        );
        
        setGames(gamesWithLogos);
        
        // Load existing picks for current week
        try {
          const currentDate = new Date();
          const currentWeek = 1; // TODO: Get from system settings
          const currentSeason = currentDate.getFullYear();
          
          const existingPicks = await api.getUserPicks(user.user_id, currentWeek, currentSeason);
          setPicks(existingPicks);
        } catch (pickError) {
          console.log('No existing picks found');
          setPicks([]);
        }
        
      } catch (err) {
        setError('Failed to load data');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const updatePick = (gameId: number, team: string) => {
    const newPicks = picks.filter(p => p.game_id !== gameId);
    if (team) {
      newPicks.push({ 
        game_id: gameId, 
        selected_team: team,
        user_id: user!.user_id
      });
    }
    setPicks(newPicks);
    setSaved(false);
  };

  const getPick = (gameId: number) => {
    return picks.find(p => p.game_id === gameId);
  };

  const submitPicks = async () => {
    if (!user || picks.length === 0) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const pickData = picks.map(pick => ({
        game_id: pick.game_id,
        selected_team: pick.selected_team
      }));
      
      await api.submitPicks(pickData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit picks';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // No confidence points needed anymore

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
            Select your pick for each game. Pick the team you think will win!
          </p>
        </div>

        {error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : (
          <div className="space-y-6">
            {games.map((game) => {
              const currentPick = getPick(game.game_id);

              return (
                <div key={game.game_id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-6">
                      {/* Away Team */}
                      <div className="flex items-center space-x-3">
                        {game.away_logo && (
                          <img 
                            src={game.away_logo} 
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
                        {game.home_logo && (
                          <img 
                            src={game.home_logo} 
                            alt={game.home_team}
                            className="w-12 h-12 object-contain"
                          />
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {formatDate(game.game_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Spread</div>
                      <div className="font-medium">
                        {game.home_team} {game.spread ? (game.spread > 0 ? '+' : '') + game.spread : 'N/A'}
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
                            name={`game_${game.game_id}`}
                            value={game.away_team}
                            checked={currentPick?.selected_team === game.away_team}
                            onChange={(e) => updatePick(game.game_id, e.target.value)}
                            className="mr-3"
                          />
                          {game.away_logo && (
                            <img 
                              src={game.away_logo} 
                              alt={game.away_team}
                              className="w-6 h-6 object-contain mr-2"
                            />
                          )}
                          <span className="font-medium">{game.away_team}</span>
                        </label>
                        <label className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`game_${game.game_id}`}
                            value={game.home_team}
                            checked={currentPick?.selected_team === game.home_team}
                            onChange={(e) => updatePick(game.game_id, e.target.value)}
                            className="mr-3"
                          />
                          {game.home_logo && (
                            <img 
                              src={game.home_logo} 
                              alt={game.home_team}
                              className="w-6 h-6 object-contain mr-2"
                            />
                          )}
                          <span className="font-medium">{game.home_team}</span>
                        </label>
                      </div>
                    </div>

                    {/* Game Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Game Time
                      </label>
                      <div className="text-sm text-gray-600">
                        {formatDate(game.game_date)}
                      </div>
                    </div>

                    {/* Pick Summary */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Pick
                      </label>
                      <div className="text-sm">
                        {currentPick ? (
                          <div className="p-2 bg-green-100 rounded">
                            <div className="font-medium">✓ {currentPick.selected_team}</div>
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

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={submitPicks}
                disabled={picks.length === 0 || submitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-md font-medium"
              >
                {submitting ? 'Submitting...' : saved ? 'Picks Saved!' : `Submit Picks (${picks.length}/${games.length})`}
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