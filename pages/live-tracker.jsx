import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { api } from '../lib/api';

const LiveTrackerPage = () => {
  const { user, isLoading } = useAuth();
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState([]);
  const [worksheetScores, setWorksheetScores] = useState({});
  const [forecastResults, setForecastResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isAccessible, setIsAccessible] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentSeason] = useState(2025);

  // Check if tracker should be accessible (first game of week has started)
  const checkAccessibility = useCallback((gamesList) => {
    if (!gamesList.length) return false;
    
    const now = new Date();
    const firstGame = gamesList.reduce((earliest, game) => 
      new Date(game.game_date) < new Date(earliest.game_date) ? game : earliest
    );
    
    return new Date(firstGame.game_date) <= now;
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError('');
        setLoading(true);

        // Get current week games
        const gamesData = await api.getCurrentWeekGames();
        setGames(gamesData);

        // Check accessibility
        const accessible = checkAccessibility(gamesData);
        setIsAccessible(accessible);

        if (!accessible) {
          setLoading(false);
          return;
        }

        // Get user's picks for the week
        const userPicks = await api.getUserPicks(user.user_id, currentWeek, currentSeason);
        setPicks(userPicks);

        // Initialize worksheet with current game scores
        const initialScores = {};
        gamesData.forEach(game => {
          initialScores[game.game_id] = {
            home_score: game.home_score || 0,
            away_score: game.away_score || 0,
            game_status: game.game_status || 'scheduled',
            editable: game.game_status !== 'final'
          };
        });
        setWorksheetScores(initialScores);

      } catch (err) {
        setError(err.message || 'Failed to load data');
        console.error('Live tracker load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, currentWeek, currentSeason, checkAccessibility]);

  // Auto-refresh live scores every minute
  useEffect(() => {
    if (!isAccessible || !user) return;

    const interval = setInterval(async () => {
      try {
        setRefreshing(true);
        const gamesData = await api.getCurrentWeekGames();
        setGames(gamesData);

        // Update worksheet scores with latest live data (only for non-editable games)
        setWorksheetScores(prev => {
          const updated = { ...prev };
          gamesData.forEach(game => {
            if (updated[game.game_id] && !updated[game.game_id].editable) {
              updated[game.game_id] = {
                ...updated[game.game_id],
                home_score: game.home_score || 0,
                away_score: game.away_score || 0,
                game_status: game.game_status || 'scheduled'
              };
            }
          });
          return updated;
        });
      } catch (err) {
        console.error('Auto-refresh error:', err);
      } finally {
        setRefreshing(false);
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [isAccessible, user]);

  // Calculate forecast based on worksheet scores
  const calculateForecast = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use the new API endpoint for forecast calculation
      const forecast = await api.calculateForecast(worksheetScores, currentWeek, currentSeason);
      setForecastResults(forecast);
      
    } catch (err) {
      setError('Failed to calculate forecast: ' + err.message);
      console.error('Forecast calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [worksheetScores, currentWeek, currentSeason]);

  // Handle score input changes
  const handleScoreChange = (gameId, team, value) => {
    const numValue = parseInt(value) || 0;
    setWorksheetScores(prev => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        [`${team}_score`]: numValue
      }
    }));
  };

  // Handle win-out scenario
  const handleWinOut = () => {
    if (!user) return;
    
    const updatedScores = { ...worksheetScores };
    picks.forEach(pick => {
      if (updatedScores[pick.game_id]?.editable) {
        // Set scores to make user's pick win
        if (pick.selected_team === pick.home_team) {
          updatedScores[pick.game_id].home_score = 21;
          updatedScores[pick.game_id].away_score = 14;
        } else {
          updatedScores[pick.game_id].away_score = 21;
          updatedScores[pick.game_id].home_score = 14;
        }
      }
    });
    setWorksheetScores(updatedScores);
  };

  // Handle lose-out scenario
  const handleLoseOut = () => {
    if (!user) return;
    
    const updatedScores = { ...worksheetScores };
    picks.forEach(pick => {
      if (updatedScores[pick.game_id]?.editable) {
        // Set scores to make user's pick lose
        if (pick.selected_team === pick.home_team) {
          updatedScores[pick.game_id].home_score = 14;
          updatedScores[pick.game_id].away_score = 21;
        } else {
          updatedScores[pick.game_id].away_score = 14;
          updatedScores[pick.game_id].home_score = 21;
        }
      }
    });
    setWorksheetScores(updatedScores);
  };

  const formatGameTime = (gameDate, gameStatus, statusDetail, clock) => {
    if (gameStatus === 'final') return 'Final';
    if (gameStatus === 'in_progress') {
      return clock ? `${clock}` : 'Live';
    }
    
    const date = new Date(gameDate);
    const now = new Date();
    const gameDay = date.toLocaleDateString('en-US', { weekday: 'short' });
    const gameTime = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // If it's the same day, just show the time
    if (date.toDateString() === now.toDateString()) {
      return gameTime;
    }
    
    // Otherwise show day and time
    return `${gameDay} ${gameTime}`;
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

  if (!isAccessible) {
    const firstGame = games.length > 0 ? games.reduce((earliest, game) => 
      new Date(game.game_date) < new Date(earliest.game_date) ? game : earliest
    ) : null;

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Live Tracker</h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Not Available Yet</h2>
              <p className="text-yellow-700">
                The Live Tracker will be available once the first game of Week {currentWeek} begins.
              </p>
              {firstGame && (
                <p className="text-sm text-yellow-600 mt-2">
                  First game: {firstGame.away_team} @ {firstGame.home_team} on {formatGameTime(firstGame.game_date, firstGame.game_status, firstGame.game_status_detail, firstGame.clock)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Tracker</h1>
              <p className="mt-1 text-sm text-gray-600">
                Week {currentWeek} • Monitor live scores and forecast your performance
              </p>
            </div>
            {refreshing && (
              <div className="text-sm text-blue-600 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Updating...
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Score Worksheet and Forecast */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Score Worksheet Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">Score Worksheet</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleWinOut}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Win Out
                  </button>
                  <button
                    onClick={handleLoseOut}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Lose Out
                  </button>
                  <button
                    onClick={calculateForecast}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Calculating...' : 'Run Tracker'}
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Game
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Away Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Home Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {games.map(game => {
                          const gameScore = worksheetScores[game.game_id];
                          if (!gameScore) return null;
                          
                          return (
                            <tr key={game.game_id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {game.away_team} @ {game.home_team}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatGameTime(game.game_date, game.game_status, game.game_status_detail, game.clock)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {gameScore.editable ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={gameScore.away_score}
                                    onChange={(e) => handleScoreChange(game.game_id, 'away', e.target.value)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                  />
                                ) : (
                                  <span className="text-lg font-bold">{gameScore.away_score}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {gameScore.editable ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={gameScore.home_score}
                                    onChange={(e) => handleScoreChange(game.game_id, 'home', e.target.value)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                  />
                                ) : (
                                  <span className="text-lg font-bold">{gameScore.home_score}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  gameScore.editable 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {gameScore.editable ? 'Editable' : 'Final'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Forecast Results Section */}
              {forecastResults.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Forecasted Results</h2>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Player
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weekly Record
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weekly Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Yearly Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Change
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {forecastResults.map((result) => {
                            const isCurrentUser = result.user_id === user.user_id;
                            
                            return (
                              <tr 
                                key={result.user_id}
                                className={isCurrentUser ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {result.alias}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs text-indigo-600 font-medium">(You)</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {result.weekly_record}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                                    {result.weekly_rank}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                                    {result.yearly_rank}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {result.yearly_rank_change !== 0 && (
                                    <div className="flex items-center">
                                      {result.yearly_rank_change > 0 ? (
                                        <span className="text-green-600 flex items-center">
                                          ↑ {result.yearly_rank_change}
                                        </span>
                                      ) : (
                                        <span className="text-red-600 flex items-center">
                                          ↓ {Math.abs(result.yearly_rank_change)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

          {/* Right Panel - Live Scores */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Scores - Week {currentWeek}</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="space-y-3 p-4">
                  {games.map(game => (
                    <div key={game.game_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-600">
                          {formatGameTime(game.game_date, game.game_status, game.game_status_detail, game.clock)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          game.game_status === 'final' ? 'bg-gray-100 text-gray-800' :
                          game.game_status === 'in_progress' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {game.game_status === 'final' ? 'Final' :
                           game.game_status === 'in_progress' ? 'Live' : 'Scheduled'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            {game.away_team_logo && (
                              <img src={game.away_team_logo} alt={game.away_team_abbr} className="w-4 h-4" />
                            )}
                            <span className="font-medium text-sm">{game.away_team_abbr || game.away_team}</span>
                          </div>
                          <span className="text-lg font-bold">{game.away_score || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            {game.home_team_logo && (
                              <img src={game.home_team_logo} alt={game.home_team_abbr} className="w-4 h-4" />
                            )}
                            <span className="font-medium text-sm">{game.home_team_abbr || game.home_team}</span>
                          </div>
                          <span className="text-lg font-bold">{game.home_score || 0}</span>
                        </div>
                      </div>
                      
                      {game.spread && (
                        <div className="mt-2 text-xs text-gray-500">
                          Spread: {game.home_team_abbr || game.home_team} {game.spread > 0 ? '+' : ''}{game.spread}
                        </div>
                      )}
                      
                      {game.venue && (
                        <div className="mt-1 text-xs text-gray-400">
                          {game.venue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveTrackerPage;