import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTeamHelmetLogo } from '../lib/teamHelmetLogos';
import { api, type Game, type Pick } from '../lib/api';

interface GameWithLogos extends Game {
  home_logo?: string;
  away_logo?: string;
  is_favorite?: boolean;
  favorite_team?: string;
  underdog_team?: string;
  spread_display?: string;
}

interface UserStats {
  total_correct: number;
  total_games: number;
  win_percentage: number;
  season_rank: number;
  weeks_played: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<GameWithLogos[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tiebreakerPoints, setTiebreakerPoints] = useState<number | ''>('');
  const [isMobile, setIsMobile] = useState(false);
  const [quickPickMode, setQuickPickMode] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    total_correct: 0,
    total_games: 0,
    win_percentage: 0,
    season_rank: 0,
    weeks_played: 0
  });

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setQuickPickMode(mobile); // Enable quick pick mode by default on mobile
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError('');
        
        // Fetch user stats
        try {
          const stats = await api.getUserStats(user.user_id);
          setUserStats(stats);
        } catch (error) {
          console.error('Failed to load user stats:', error);
        }

        // Fetch current week games
        const gamesData = await api.getCurrentWeekGames();
        
        // Add team helmet logos and determine favorites
        const gamesWithLogos = gamesData.map((game) => {
          const spread = game.spread ? parseFloat(game.spread.toString()) : 0;
          let favorite_team = game.home_team;
          let underdog_team = game.away_team;
          let spread_display = '';

          if (spread > 0) {
            // Home team is underdog
            favorite_team = game.away_team;
            underdog_team = game.home_team;
            spread_display = `+${spread}`;
          } else if (spread < 0) {
            // Home team is favorite
            favorite_team = game.home_team;
            underdog_team = game.away_team;
            spread_display = `${spread}`;
          } else {
            spread_display = 'PICK';
          }

          return {
            ...game,
            home_logo: getTeamHelmetLogo(game.home_team),
            away_logo: getTeamHelmetLogo(game.away_team),
            favorite_team,
            underdog_team,
            spread_display
          };
        });

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
          console.log('No existing picks found');
          setPicks([]);
        }
        
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getPick = (gameId: number) => {
    return picks.find(p => p.game_id === gameId);
  };

  const updatePick = async (gameId: number, selectedTeam: string) => {
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
        user_id: user!.user_id,
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

  const getTeamDisplayName = (teamName: string): string => {
    const teamMap: Record<string, string> = {
      'Arizona Cardinals': 'Cardinals',
      'Atlanta Falcons': 'Falcons',
      'Baltimore Ravens': 'Ravens',
      'Buffalo Bills': 'Bills',
      'Carolina Panthers': 'Panthers',
      'Chicago Bears': 'Bears',
      'Cincinnati Bengals': 'Bengals',
      'Cleveland Browns': 'Browns',
      'Dallas Cowboys': 'Cowboys',
      'Denver Broncos': 'Broncos',
      'Detroit Lions': 'Lions',
      'Green Bay Packers': 'Packers',
      'Houston Texans': 'Texans',
      'Indianapolis Colts': 'Colts',
      'Jacksonville Jaguars': 'Jaguars',
      'Kansas City Chiefs': 'Chiefs',
      'Las Vegas Raiders': 'Raiders',
      'Los Angeles Chargers': 'Chargers',
      'Los Angeles Rams': 'Rams',
      'Miami Dolphins': 'Dolphins',
      'Minnesota Vikings': 'Vikings',
      'New England Patriots': 'Patriots',
      'New Orleans Saints': 'Saints',
      'New York Giants': 'Giants',
      'New York Jets': 'Jets',
      'Philadelphia Eagles': 'Eagles',
      'Pittsburgh Steelers': 'Steelers',
      'San Francisco 49ers': '49ers',
      'Seattle Seahawks': 'Seahawks',
      'Tampa Bay Buccaneers': 'Buccaneers',
      'Tennessee Titans': 'Titans',
      'Washington Commanders': 'Commanders'
    };
    return teamMap[teamName] || teamName;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Make Your Weekly Picks
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Select your pick for each game. Favorites are listed first.
        </p>
      </div>

      {/* Progress indicator */}
      {games.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>{picks.length}/{games.length} picks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${games.length > 0 ? (picks.length / games.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Pick Mode Toggle (Mobile Only) */}
      {isMobile && (
        <div className="mb-4">
          <div className="flex items-center justify-center space-x-4 bg-white rounded-lg p-3 shadow-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={quickPickMode}
                onChange={(e) => setQuickPickMode(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Quick Pick Mode</span>
            </label>
            <div className="text-xs text-gray-500">Larger tap targets</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Picks Section */}
        <div className="lg:col-span-3">
          <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
            {games.map((game, index) => {
              const currentPick = getPick(game.game_id);
              const gameDate = new Date(game.game_date);
              const now = new Date();
              const isGameStarted = gameDate <= now;
              const isFinalGame = index === games.length - 1;
              const isQuickMode = quickPickMode && isMobile;

              if (isQuickMode) {
                return (
                  <div
                    key={game.game_id}
                    className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
                      currentPick ? 'border-green-500 shadow-md' : 'border-gray-200'
                    } ${isGameStarted ? 'opacity-60' : ''}`}
                  >
                    <div className="p-3">
                      {/* Quick Pick Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">Game {index + 1}</span>
                          <span className="text-xs text-gray-500">{formatDate(game.game_date).split(',')[0]}</span>
                        </div>
                        {currentPick && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            ✓ Picked
                          </span>
                        )}
                      </div>
                      
                      {/* Large Tap Targets */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          onClick={() => !isGameStarted && updatePick(game.game_id, game.favorite_team!)}
                          disabled={isGameStarted}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            currentPick?.selected_team === game.favorite_team
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${isGameStarted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <img
                              src={game.favorite_team === game.home_team ? game.home_logo : game.away_logo}
                              alt={game.favorite_team}
                              className="w-8 h-8 object-contain"
                            />
                            <div className="text-center">
                              <div className="font-medium text-gray-900 text-sm">
                                {getTeamDisplayName(game.favorite_team!)}
                              </div>
                              <div className="text-xs text-gray-500">FAVORITE</div>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => !isGameStarted && updatePick(game.game_id, game.underdog_team!)}
                          disabled={isGameStarted}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            currentPick?.selected_team === game.underdog_team
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${isGameStarted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <img
                              src={game.underdog_team === game.home_team ? game.home_logo : game.away_logo}
                              alt={game.underdog_team}
                              className="w-8 h-8 object-contain"
                            />
                            <div className="text-center">
                              <div className="font-medium text-gray-900 text-sm">
                                {getTeamDisplayName(game.underdog_team!)}
                              </div>
                              <div className="text-xs text-gray-500">UNDERDOG</div>
                            </div>
                          </div>
                        </button>
                      </div>
                      
                      {/* Game Time and Spread */}
                      <div className="text-center">
                        <div className="text-xs text-gray-500">{formatTime(game.game_date)}</div>
                        <div className="text-xs font-medium text-gray-600 mt-1">
                          Spread: {game.spread_display}
                        </div>
                      </div>
                      
                      {/* Tiebreaker for final game */}
                      {isFinalGame && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tiebreaker: Total points
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={tiebreakerPoints}
                            onChange={(e) => setTiebreakerPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Total points"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={game.game_id}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
                    currentPick ? 'border-green-500 shadow-md' : 'border-gray-200'
                  } ${isGameStarted ? 'opacity-60' : ''}`}
                >
                  <div className={`p-4 ${isMobile ? 'p-3' : ''}`}>
                    {/* Game Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          Game {index + 1}
                        </span>
                        {currentPick && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            ✓ Picked
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(game.game_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(game.game_date)}
                        </div>
                      </div>
                    </div>

                    {/* Team Selection */}
                    <div className={`grid grid-cols-2 gap-4 ${isMobile ? 'gap-2' : ''}`}>
                      {/* Favorite Team (Left) */}
                      <button
                        onClick={() => !isGameStarted && updatePick(game.game_id, game.favorite_team!)}
                        disabled={isGameStarted}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          currentPick?.selected_team === game.favorite_team
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isGameStarted ? 'cursor-not-allowed' : 'cursor-pointer'} ${isMobile ? 'p-2' : ''}`}
                      >
                        <div className={`flex items-center space-x-3 ${isMobile ? 'space-x-2' : ''}`}>
                          <img
                            src={game.favorite_team === game.home_team ? game.home_logo : game.away_logo}
                            alt={game.favorite_team}
                            className={`object-contain ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
                          />
                          <div className="text-left">
                            <div className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
                              {getTeamDisplayName(game.favorite_team!)}
                            </div>
                            <div className={`text-xs text-gray-500 ${isMobile ? 'text-xs' : ''}`}>
                              {game.favorite_team === game.home_team ? 'HOME' : 'AWAY'} • FAVORITE
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Underdog Team (Right) */}
                      <button
                        onClick={() => !isGameStarted && updatePick(game.game_id, game.underdog_team!)}
                        disabled={isGameStarted}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          currentPick?.selected_team === game.underdog_team
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isGameStarted ? 'cursor-not-allowed' : 'cursor-pointer'} ${isMobile ? 'p-2' : ''}`}
                      >
                        <div className={`flex items-center space-x-3 ${isMobile ? 'space-x-2' : ''}`}>
                          <img
                            src={game.underdog_team === game.home_team ? game.home_logo : game.away_logo}
                            alt={game.underdog_team}
                            className={`object-contain ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
                          />
                          <div className="text-left">
                            <div className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
                              {getTeamDisplayName(game.underdog_team!)}
                            </div>
                            <div className={`text-xs text-gray-500 ${isMobile ? 'text-xs' : ''}`}>
                              {game.underdog_team === game.home_team ? 'HOME' : 'AWAY'} • UNDERDOG
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Spread */}
                    <div className="mt-3 text-center">
                      <div className="text-sm font-medium text-gray-600">
                        Spread: {game.spread_display}
                      </div>
                    </div>

                    {/* Tiebreaker for final game */}
                    {isFinalGame && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tiebreaker: Total points in this game
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tiebreakerPoints}
                          onChange={(e) => setTiebreakerPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter total points"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={submitPicks}
              disabled={submitting || picks.length === 0}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 ${
                submitting || picks.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
              }`}
            >
              {submitting ? 'Submitting...' : `Submit ${picks.length} Pick${picks.length !== 1 ? 's' : ''}`}
            </button>
          </div>

          {saved && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="text-green-800">✓ Picks saved successfully!</div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={`lg:col-span-1 ${isMobile ? 'mt-4' : ''}`}>
          <div className={`space-y-6 ${isMobile ? 'space-y-4' : ''}`}>
            {/* User Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Wins</span>
                  <span className="text-sm font-medium">{userStats.total_correct}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Win Rate</span>
                  <span className="text-sm font-medium">{userStats.win_percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rank</span>
                  <span className="text-sm font-medium">
                    {userStats.season_rank > 0 ? `#${userStats.season_rank}` : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a
                  href="/recap"
                  className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  View Recap
                </a>
                <a
                  href="/leaderboard"
                  className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Leaderboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;