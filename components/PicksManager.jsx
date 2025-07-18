import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTeamHelmetLogo } from '../lib/teamHelmetLogos';
import { api } from '../lib/api';


const PicksManager = () => {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tiebreakerPoints, setTiebreakerPoints] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError('');
        
        // Fetch current week games
        const gamesData = await api.getCurrentWeekGames();
        
        // Add team helmet logos
        const gamesWithLogos = gamesData.map((game) => ({
          ...game,
          home_logo: getTeamHelmetLogo(game.home_team),
          away_logo: getTeamHelmetLogo(game.away_team)
        }));

        // Sort games by date
        gamesWithLogos.sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());
        
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
        setError('Failed to load games data');
        console.error('Picks Manager fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getPick = (gameId) => {
    return picks.find(p => p.game_id === gameId);
  };

  const updatePick = async (gameId, selectedTeam) => {
    const existingPick = getPick(gameId);
    const newPicks = [...picks];
    
    if (existingPick) {
      // Update existing pick
      existingPick.selected_team = selectedTeam;
    } else {
      // Add new pick
      newPicks.push({
        pick_id: Date.now(), // Temporary ID
        game_id: gameId,
        user_id: user.user_id,
        selected_team: selectedTeam,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    setPicks(newPicks);
  };

  const submitPicks = async () => {
    if (!user) return;

    setSubmitting(true);
    setSaved(false);

    try {
      const picksToSubmit = picks.map(pick => ({
        game_id: pick.game_id,
        selected_team: pick.selected_team,
        tiebreaker_points: pick.game_id === games[games.length - 1]?.game_id && tiebreakerPoints !== '' ? tiebreakerPoints : undefined
      }));

      await api.submitPicks(picksToSubmit);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to submit picks');
      console.error('Submit picks error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-900 dark:text-white">Loading games...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🏈 Weekly Picks
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Make your picks for this week's games. Select the team you think will win.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-800 dark:text-red-400">{error}</div>
        </div>
      )}

      {/* Main Layout: Side Panel + Games */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Side Panel with Progress */}
        <div className="lg:w-80 flex-shrink-0">
          {games.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Progress
              </h3>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Games Picked</span>
                  <span>{picks.length}/{games.length}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${games.length > 0 ? (picks.length / games.length) * 100 : 0}%` }}
                  />
                </div>
                {picks.length === games.length && (
                  <div className="mt-2 text-green-600 font-medium text-sm">
                    🎉 All picks complete!
                  </div>
                )}
              </div>
              
              {/* Tiebreaker in Side Panel */}
              {games.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                    🎯 Tiebreaker
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Total points: {games[games.length - 1]?.away_team} @ {games[games.length - 1]?.home_team}
                  </p>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={tiebreakerPoints}
                    onChange={(e) => setTiebreakerPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter total points"
                  />
                </div>
              )}
              
              {/* Submit Button in Side Panel */}
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={submitPicks}
                  disabled={submitting || picks.length === 0}
                  className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${submitting || picks.length === 0 ? 'bg-gray-400 cursor-not-allowed' : picks.length === games.length ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'}`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : saved ? (
                    <span className="flex items-center justify-center">
                      ✅ Picks Saved!
                    </span>
                  ) : (
                    `Submit ${picks.length} Pick${picks.length !== 1 ? 's' : ''}`
                  )}
                </button>
                
                {picks.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                    {picks.length} of {games.length} games selected
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Games List - Horizontal Cards Stacked Vertically */}
        <div className="flex-1">

          {/* Games List - Horizontal Cards Stacked Vertically */}
          <div className="space-y-2">
            {games.map((game, index) => {
              const currentPick = getPick(game.game_id);
              const gameDate = new Date(game.game_date);
              const now = new Date();
              const isGameStarted = gameDate <= now;

              return (
                <div
                  key={game.game_id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all duration-200 ${
                    currentPick ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'
                  } ${isGameStarted ? 'opacity-60' : ''}`}
                >
                  <div className="p-2">
                    {/* Horizontal Team Layout with Date */}
                    <div className="flex items-center space-x-2">
                      {/* Away Team */}
                      <button
                        onClick={() => !isGameStarted && updatePick(game.game_id, game.away_team)}
                        disabled={isGameStarted}
                        className={`flex-1 max-w-[280px] p-2 rounded-lg border-2 transition-all duration-200 ${
                          currentPick?.selected_team === game.away_team
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        } ${isGameStarted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center space-x-2">
                          {game.away_logo && (
                            <img 
                              src={game.away_logo} 
                              alt={game.away_team}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <div className="text-left flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {game.away_team}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">@ Away</div>
                          </div>
                          {currentPick?.selected_team === game.away_team && (
                            <div className="text-blue-600 font-bold text-lg">✓</div>
                          )}
                        </div>
                      </button>

                      {/* VS Divider with Date */}
                      <div className="flex-shrink-0 text-center px-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatDate(game.game_date)}
                        </div>
                        <div className="text-gray-400 font-bold text-sm">VS</div>
                        {game.spread && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {game.spread > 0 ? '+' : ''}{game.spread}
                          </div>
                        )}
                      </div>

                      {/* Home Team */}
                      <button
                        onClick={() => !isGameStarted && updatePick(game.game_id, game.home_team)}
                        disabled={isGameStarted}
                        className={`flex-1 max-w-[280px] p-2 rounded-lg border-2 transition-all duration-200 ${
                          currentPick?.selected_team === game.home_team
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        } ${isGameStarted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center space-x-2">
                          {game.home_logo && (
                            <img 
                              src={game.home_logo} 
                              alt={game.home_team}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <div className="text-left flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {game.home_team}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">🏠 Home</div>
                          </div>
                          {currentPick?.selected_team === game.home_team && (
                            <div className="text-blue-600 font-bold text-lg">✓</div>
                          )}
                        </div>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {saved && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
          <div className="text-green-800 dark:text-green-400 font-medium">
            🎉 Your picks have been saved successfully!
          </div>
        </div>
      )}
    </div>
  );
};

export default PicksManager;