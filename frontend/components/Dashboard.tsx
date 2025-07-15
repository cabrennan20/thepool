import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTeamHelmetLogo } from '../lib/teamHelmetLogos';
import { api, type Game, type Pick } from '../lib/api';

interface GameWithLogos extends Game {
  home_logo?: string;
  away_logo?: string;
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
  const [recentPicks, setRecentPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState<UserStats>({
    total_correct: 0,
    total_games: 0,
    win_percentage: 0,
    season_rank: 0,
    weeks_played: 0
  });

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
          // Don't fail the whole dashboard for stats
        }

        // Fetch current week games
        const gamesData = await api.getCurrentWeekGames();
        
        // Show first 8 games for dashboard preview
        const displayGames = gamesData.slice(0, 8);
        
        // Add team helmet logos
        const gamesWithLogos = displayGames.map((game) => {
          return {
            ...game,
            home_logo: getTeamHelmetLogo(game.home_team),
            away_logo: getTeamHelmetLogo(game.away_team)
          };
        });
        
        setGames(gamesWithLogos);

        // Fetch user's recent picks for current week
        try {
          const currentSeason = new Date().getFullYear();
          const currentWeek = 1; // TODO: Get from system settings
          const picks = await api.getUserPicks(user.user_id, currentWeek, currentSeason);
          setRecentPicks(picks.slice(0, 5)); // Show last 5 picks
        } catch (error) {
          console.error('Failed to load picks:', error);
          // Don't fail for picks
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
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

  const getSpread = (game: Game) => {
    return game.spread ? parseFloat(game.spread.toString()) : null;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">W</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Wins</dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">{userStats.total_correct}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">L</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Losses</dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">{userStats.total_games - userStats.total_correct}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">%</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">{userStats.win_percentage.toFixed(1)}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">#</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rank</dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {userStats.season_rank > 0 ? `#${userStats.season_rank}` : '--'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Games List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">This Week's Games</h2>
              
              <div className="space-y-3">
                {games.map((game) => (
                  <div key={game.game_id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      {/* Teams Section */}
                      <div className="flex items-center space-x-3 sm:space-x-6">
                        {/* Away Team */}
                        <div className="flex items-center space-x-2">
                          {game.away_logo && (
                            <img 
                              src={game.away_logo} 
                              alt={game.away_team}
                              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                            />
                          )}
                          <div className="font-medium text-gray-900 text-sm sm:text-base">{game.away_team}</div>
                        </div>
                        
                        <div className="text-xs sm:text-sm text-gray-500 font-medium">@</div>
                        
                        {/* Home Team */}
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-gray-900 text-sm sm:text-base">{game.home_team}</div>
                          {game.home_logo && (
                            <img 
                              src={game.home_logo} 
                              alt={game.home_team}
                              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Game Info */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end space-x-4 sm:space-x-0">
                        <div className="text-xs sm:text-sm text-gray-500">
                          {formatDate(game.game_date)}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Spread</div>
                          <div className="font-medium text-sm">
                            {game.home_team} {(() => {
                              const spread = getSpread(game);
                              return spread !== null ? (spread > 0 ? '+' : '') + spread : 'N/A';
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {games.length > 0 && (
                <div className="mt-6 text-center">
                  <a 
                    href="/picks"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium inline-block w-full sm:w-auto"
                  >
                    Make Your Picks
                  </a>
                </div>
              )}

              {games.length === 0 && !error && (
                <div className="text-center py-8 text-gray-500">
                  <p>No games available for this week.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Picks Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Picks</h2>
              
              {recentPicks.length > 0 ? (
                <div className="space-y-3">
                  {recentPicks.map((pick) => (
                    <div key={pick.pick_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{pick.selected_team}</div>
                        <div className="text-xs text-gray-500">
                          {pick.is_correct === true && <span className="text-green-600">✓ Correct</span>}
                          {pick.is_correct === false && <span className="text-red-600">✗ Incorrect</span>}
                          {pick.is_correct === null && <span className="text-yellow-600">⏳ Pending</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No picks yet this week.</p>
                  <a 
                    href="/picks" 
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mt-2 inline-block"
                  >
                    Make your first picks →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;