import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { getTeamHelmetLogo, getFullTeamName } from '../lib/teamHelmetLogos';
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
          // No existing picks found, start with empty picks
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Weekly Picks</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Select the team you think will win each game.</p>
            </div>

            {/* Quick Pick Mode Toggle (Mobile Only) */}
            <div className="sm:hidden mb-4">
              <div className="flex items-center justify-center space-x-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    onChange={(e) => setQuickPickMode(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Pick Mode</span>
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tap teams to pick quickly</div>
              </div>
            </div>

            {error ? (
              <div className="text-red-600 text-center py-4">{error}</div>
            ) : (
              <div className="space-y-2 pb-20 sm:pb-0">
            {games.map((game, index) => {
              const currentPick = getPick(game.game_id);
              const isQuickMode = quickPickMode && isMobile;

              if (isQuickMode) {
                return (
                  <div key={game.game_id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 border-l-4 ${
                    currentPick ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                  }">                    
                    {/* Quick Pick Card - Mobile Only */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-400">{formatDate(game.game_date)}</div>
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

              // New Horizontal Compact Design - Fit all games on screen
              const isFinalGame = index === games.length - 1;
              const spread = game.spread || 0;
              const favoredTeam = spread < 0 ? game.home_team : game.away_team;
              const underdogTeam = spread < 0 ? game.away_team : game.home_team;
              const isAwayFavored = spread > 0;
              
              return (
                <div key={game.game_id} className={`bg-white dark:bg-gray-800 shadow rounded-lg border-2 transition-all duration-200 ${
                  currentPick ? 'border-green-500' : 'border-gray-200 dark:border-gray-600'
                } ${isFinalGame ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''}`}>
                  {/* Game Header */}
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {formatDate(game.game_date)}
                      </div>
                      {isFinalGame && (
                        <div className="text-xs font-medium text-orange-600 dark:text-orange-400">
                          Tiebreaker Game
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Main Game Content - Horizontal Layout */}
                  <div className="p-3">
                    <div className="flex items-center">
                      {/* Away Team (Left Side) */}
                      <button
                        onClick={() => updatePick(game.game_id, game.away_team)}
                        className={`flex-1 flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                          currentPick?.selected_team === game.away_team
                            ? 'border-green-500 bg-green-50 dark:bg-green-900 shadow-md transform scale-105'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {game.away_logo && (
                          <img 
                            src={game.away_logo} 
                            alt={game.away_team}
                            className="w-8 h-8 object-contain flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            {getFullTeamName(game.away_team)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @ {isAwayFavored ? `(${Math.abs(spread)})` : `(+${Math.abs(spread)})`}
                          </div>
                        </div>
                        {currentPick?.selected_team === game.away_team && (
                          <div className="text-green-600 text-lg font-bold">✓</div>
                        )}
                      </button>
                      
                      {/* Center - Spread Info */}
                      <div className="px-4 text-center">
                        <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                          vs
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {game.spread ? `${Math.abs(spread)}` : 'PK'}
                        </div>
                      </div>
                      
                      {/* Home Team (Right Side) */}
                      <button
                        onClick={() => updatePick(game.game_id, game.home_team)}
                        className={`flex-1 flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                          currentPick?.selected_team === game.home_team
                            ? 'border-green-500 bg-green-50 dark:bg-green-900 shadow-md transform scale-105'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {currentPick?.selected_team === game.home_team && (
                          <div className="text-green-600 text-lg font-bold">✓</div>
                        )}
                        <div className="flex-1 text-right">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            {getFullTeamName(game.home_team)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            HOME {!isAwayFavored ? `(${Math.abs(spread)})` : `(+${Math.abs(spread)})`}
                          </div>
                        </div>
                        {game.home_logo && (
                          <img 
                            src={game.home_logo} 
                            alt={game.home_team}
                            className="w-8 h-8 object-contain flex-shrink-0"
                          />
                        )}
                      </button>
                    </div>
                    
                    {/* Tiebreaker Section for Final Game */}
                    {isFinalGame && (
                      <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Tiebreaker: Total Points
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={tiebreakerPoints}
                              onChange={(e) => setTiebreakerPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                              placeholder="e.g., 45"
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Enter your prediction for the total combined score of this game
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}


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

          {/* Side Panel with Progress */}
          <div className="hidden lg:block w-80">
            <div className="sticky top-8">
              {/* Progress Section */}
              {games.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Progress</h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>Picks Made</span>
                      <span>{picks.length}/{games.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-indigo-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${(picks.length / games.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {picks.length === games.length ? (
                    <div className="text-green-600 text-sm font-medium flex items-center">
                      <span className="mr-2">✓</span>
                      All picks complete!
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      {games.length - picks.length} picks remaining
                    </div>
                  )}
                </div>
              )}

              {/* Picks Summary */}
              {picks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Picks</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {picks
                      .sort((a, b) => a.game_id - b.game_id)
                      .map((pick) => {
                        const game = games.find(g => g.game_id === pick.game_id);
                        const isSelected = pick.selected_team;
                        const logo = isSelected === game?.home_team ? game?.home_logo : game?.away_logo;
                        
                        return (
                          <div key={pick.game_id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                            {logo && (
                              <img 
                                src={logo} 
                                alt={pick.selected_team}
                                className="w-8 h-8 object-contain"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-white">{pick.selected_team}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                vs {game?.home_team === pick.selected_team ? game.away_team : game?.home_team}
                              </div>
                            </div>
                            <div className="text-green-600 text-sm">
                              ✓
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PicksPage;