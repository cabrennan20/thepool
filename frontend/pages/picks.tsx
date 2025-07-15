import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { getTeamHelmetLogo } from '../lib/teamHelmetLogos';
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
  const [tiebreakerPoints, setTiebreakerPoints] = useState<number | ''>('');
  const [quickPickMode, setQuickPickMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch games from backend
        const gamesData = await api.getCurrentWeekGames();
        
        // Add team helmet logos
        const gamesWithLogos = gamesData.map((game) => {
          return {
            ...game,
            home_logo: getTeamHelmetLogo(game.home_team),
            away_logo: getTeamHelmetLogo(game.away_team)
          };
        });
        
        setGames(gamesWithLogos);
        
        // Load existing picks for current week
        try {
          const currentDate = new Date();
          const currentWeek = 1; // TODO: Get from system settings
          const currentSeason = currentDate.getFullYear();
          
          const existingPicks = await api.getUserPicks(user.user_id, currentWeek, currentSeason);
          setPicks(existingPicks);
          
          // Load existing tiebreaker points from final game pick
          const finalGame = gamesWithLogos[gamesWithLogos.length - 1];
          const finalGamePick = existingPicks.find(p => p.game_id === finalGame?.game_id);
          if (finalGamePick?.tiebreaker_points) {
            setTiebreakerPoints(finalGamePick.tiebreaker_points);
          }
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
      
      const finalGame = games[games.length - 1];
      const pickData = picks.map(pick => ({
        game_id: pick.game_id,
        selected_team: pick.selected_team,
        tiebreaker_points: pick.game_id === finalGame?.game_id ? Number(tiebreakerPoints) || undefined : undefined
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Make Your Weekly Picks</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Select your pick for each game. Pick the team you think will win!
          </p>
          
          {/* Progress indicator on mobile */}
          {games.length > 0 && (
            <div className="mt-4 sm:hidden">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Progress</span>
                <span>{picks.length}/{games.length} picks</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(picks.length / games.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Pick Mode Toggle (Mobile Only) */}
        <div className="sm:hidden mb-4">
          <div className="flex items-center justify-center space-x-4 bg-white rounded-lg p-3 shadow">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                onChange={(e) => setQuickPickMode(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">Quick Pick Mode</span>
            </label>
            <div className="text-xs text-gray-500">Tap teams to pick quickly</div>
          </div>
        </div>

        {error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : (
          <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
            {games.map((game, index) => {
              const currentPick = getPick(game.game_id);
              const isQuickMode = quickPickMode && isMobile;

              if (isQuickMode) {
                return (
                  <div key={game.game_id} className="bg-white shadow rounded-lg p-3 border-l-4 ${
                    currentPick ? 'border-green-500' : 'border-gray-300'
                  }">                    
                    {/* Quick Pick Card - Mobile Only */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="text-xs font-medium text-gray-500">Game {index + 1}</div>
                        <div className="text-xs text-gray-400">{formatDate(game.game_date).split(',')[0]}</div>
                      </div>
                      {currentPick && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <span className="text-xs">✓</span>
                          <span className="text-xs font-medium">Picked</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Large Tap Targets */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updatePick(game.game_id, game.away_team)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          currentPick?.selected_team === game.away_team
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 active:scale-95'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          {game.away_logo && (
                            <img 
                              src={game.away_logo} 
                              alt={game.away_team}
                              className="w-12 h-12 object-contain"
                            />
                          )}
                          <div className="text-sm font-medium text-center">{game.away_team}</div>
                          <div className="text-xs text-gray-500">@</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => updatePick(game.game_id, game.home_team)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          currentPick?.selected_team === game.home_team
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 active:scale-95'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          {game.home_logo && (
                            <img 
                              src={game.home_logo} 
                              alt={game.home_team}
                              className="w-12 h-12 object-contain"
                            />
                          )}
                          <div className="text-sm font-medium text-center">{game.home_team}</div>
                          <div className="text-xs text-gray-500">HOME</div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Show picked team prominently */}
                    {currentPick && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-green-600 text-sm">✓</span>
                          <span className="text-sm font-medium text-green-800">Picked: {currentPick.selected_team}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Regular desktop/tablet view
              return (
                <div key={game.game_id} className="bg-white shadow rounded-lg p-4 sm:p-6">
                  {/* Mobile-first Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
                    {/* Teams Section */}
                    <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-6">
                      {/* Away Team */}
                      <div className="flex items-center space-x-2">
                        {game.away_logo && (
                          <img 
                            src={game.away_logo} 
                            alt={game.away_team}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                          />
                        )}
                        <div className="font-medium text-gray-900 text-sm sm:text-base">{game.away_team}</div>
                      </div>
                      
                      <div className="text-sm text-gray-500 font-medium">@</div>
                      
                      {/* Home Team */}
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 text-sm sm:text-base">{game.home_team}</div>
                        {game.home_logo && (
                          <img 
                            src={game.home_logo} 
                            alt={game.home_team}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Game Info */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end text-center sm:text-right">
                      <div className="text-xs sm:text-sm text-gray-500">
                        {formatDate(game.game_date)}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Spread</div>
                        <div className="font-medium text-sm">
                          {game.home_team} {game.spread ? (game.spread > 0 ? '+' : '') + game.spread : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Team Selection */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Pick Winner
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          currentPick?.selected_team === game.away_team 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            name={`game_${game.game_id}`}
                            value={game.away_team}
                            checked={currentPick?.selected_team === game.away_team}
                            onChange={(e) => updatePick(game.game_id, e.target.value)}
                            className="mr-3 h-4 w-4"
                          />
                          {game.away_logo && (
                            <img 
                              src={game.away_logo} 
                              alt={game.away_team}
                              className="w-6 h-6 sm:w-8 sm:h-8 object-contain mr-3"
                            />
                          )}
                          <span className="font-medium text-sm sm:text-base">{game.away_team}</span>
                        </label>
                        
                        <label className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          currentPick?.selected_team === game.home_team 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            name={`game_${game.game_id}`}
                            value={game.home_team}
                            checked={currentPick?.selected_team === game.home_team}
                            onChange={(e) => updatePick(game.game_id, e.target.value)}
                            className="mr-3 h-4 w-4"
                          />
                          {game.home_logo && (
                            <img 
                              src={game.home_logo} 
                              alt={game.home_team}
                              className="w-6 h-6 sm:w-8 sm:h-8 object-contain mr-3"
                            />
                          )}
                          <span className="font-medium text-sm sm:text-base">{game.home_team}</span>
                        </label>
                      </div>
                    </div>

                    {/* Pick Summary */}
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Your Pick
                      </label>
                      <div className="space-y-3">
                        {currentPick ? (
                          <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600 font-medium">✓</span>
                              <span className="font-medium text-sm sm:text-base">{currentPick.selected_team}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500">
                            <div className="text-sm">No pick made</div>
                          </div>
                        )}
                        
                        <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded">
                          <div className="font-medium">Game Time:</div>
                          <div>{formatDate(game.game_date)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Tiebreaker Section */}
            {games.length > 0 && (
              <div className="bg-white shadow rounded-lg p-4 sm:p-6 border-2 border-indigo-200">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tiebreaker</h3>
                  <p className="text-sm text-gray-600">
                    Enter the total points you think will be scored by both teams in the final game: 
                    <span className="font-medium"> {games[games.length - 1]?.away_team} @ {games[games.length - 1]?.home_team}</span>
                  </p>
                </div>
                
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Points Prediction
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={tiebreakerPoints}
                    onChange={(e) => setTiebreakerPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 45"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Combined score of both teams (used to break ties)
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button - Enhanced for Quick Pick Mode */}
            <div className="sticky bottom-4 sm:static sm:bottom-auto bg-white sm:bg-transparent p-4 sm:p-0 border-t sm:border-t-0 border-gray-200 sm:border-gray-200 -mx-4 sm:mx-0 sm:text-center">
              {/* Quick Pick Floating Action Button (Mobile) */}
              {quickPickMode && isMobile && (
                <div className="fixed bottom-6 right-6 z-50">
                  <button
                    onClick={submitPicks}
                    disabled={picks.length === 0 || submitting}
                    className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white font-bold transition-all duration-200 ${
                      picks.length === games.length 
                        ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                        : picks.length > 0 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'bg-gray-400'
                    }`}
                  >
                    {submitting ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : saved ? (
                      <span className="text-2xl">✓</span>
                    ) : (
                      <div className="flex flex-col items-center text-xs">
                        <span>{picks.length}</span>
                        <span>/</span>
                        <span>{games.length}</span>
                      </div>
                    )}
                  </button>
                  
                  {/* Completion Badge */}
                  {picks.length === games.length && !saved && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                      !
                    </div>
                  )}
                </div>
              )}
              
              {/* Regular Submit Button */}
              <button
                onClick={submitPicks}
                disabled={picks.length === 0 || submitting}
                className={`w-full sm:w-auto text-white px-6 sm:px-8 py-3 rounded-md font-medium text-sm sm:text-base transition-colors ${
                  quickPickMode && isMobile 
                    ? 'hidden' 
                    : picks.length === games.length 
                    ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400'
                }`}
              >
                {submitting ? 'Submitting...' : saved ? 'Picks Saved!' : `Submit Picks (${picks.length}/${games.length})`}
              </button>
              
              {picks.length > 0 && !(quickPickMode && isMobile) && (
                <div className="mt-2 text-xs sm:text-sm text-gray-500 text-center">
                  {picks.length} of {games.length} games picked
                  {picks.length === games.length && (
                    <span className="ml-2 text-green-600 font-medium">- All picks complete! 🎉</span>
                  )}
                </div>
              )}
            </div>

            {/* Picks Summary */}
            {picks.length > 0 && (
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Picks Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {picks
                    .sort((a, b) => a.game_id - b.game_id)
                    .map((pick) => {
                      const game = games.find(g => g.game_id === pick.game_id);
                      return (
                        <div key={pick.game_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <div className="font-medium text-sm sm:text-base">{pick.selected_team}</div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              vs {game?.home_team === pick.selected_team ? game.away_team : game?.home_team}
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                            ✓ Pick made
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