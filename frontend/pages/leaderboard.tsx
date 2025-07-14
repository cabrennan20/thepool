import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { api } from '../lib/api';

interface LeaderboardEntry {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  total_correct?: number;
  total_games?: number;
  total_picks?: number;
  total_points?: number;
  win_percentage?: number;
  weekly_rank?: number;
  season_rank?: number;
  correct_picks?: number;
  possible_points?: number;
  week?: number;
}

const LeaderboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [seasonLeaderboard, setSeasonLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'weekly' | 'season'>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentSeason] = useState(2025);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError('');
        
        // Fetch weekly scores
        const weeklyData = await api.getWeeklyScores(currentWeek, currentSeason);
        
        // Sort by correct picks, then by win percentage
        const sortedWeekly = weeklyData.sort((a, b) => {
          if (b.correct_picks !== a.correct_picks) {
            return b.correct_picks - a.correct_picks;
          }
          return b.win_percentage - a.win_percentage;
        });
        
        setWeeklyLeaderboard(sortedWeekly);

        // Fetch season standings
        const seasonData = await api.getSeasonStandings(currentSeason);
        
        // Sort by correct picks, then by win percentage
        const sortedSeason = seasonData.sort((a, b) => {
          if ((b.correct_picks || 0) !== (a.correct_picks || 0)) {
            return (b.correct_picks || 0) - (a.correct_picks || 0);
          }
          return (b.win_percentage || 0) - (a.win_percentage || 0);
        });
        
        setSeasonLeaderboard(sortedSeason);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load leaderboard data';
        setError(errorMessage);
        console.error('Leaderboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentWeek, currentSeason]);

  const getUserDisplayName = (entry: LeaderboardEntry) => {
    if (entry.first_name && entry.last_name) {
      return `${entry.first_name} ${entry.last_name}`;
    }
    return entry.username;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-gray-200 text-gray-700';
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
          <div className="text-lg">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  const currentData = activeTab === 'weekly' ? weeklyLeaderboard : seasonLeaderboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            See how you stack up against other players this week and season.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-medium">Error loading leaderboard</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'weekly'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Week {currentWeek} ({weeklyLeaderboard.length} players)
            </button>
            <button
              onClick={() => setActiveTab('season')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'season'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Season {currentSeason} ({seasonLeaderboard.length} players)
            </button>
          </nav>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            {currentData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === 'weekly' ? 'Correct' : 'Total Wins'}
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === 'weekly' ? 'Total Picks' : 'Total Games'}
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Win %
                      </th>
                      {activeTab === 'weekly' && (
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((entry, index) => {
                      const rank = index + 1;
                      const isCurrentUser = entry.user_id === user.user_id;
                      
                      return (
                        <tr 
                          key={entry.user_id} 
                          className={`${isCurrentUser ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full text-xs sm:text-sm font-medium ${getRankBadgeColor(rank)}`}>
                                {rank}
                              </span>
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-indigo-600 font-medium">(You)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getUserDisplayName(entry)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              @{entry.username}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.correct_picks || 0}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.total_picks || 0}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {((entry.win_percentage || 0)).toFixed(1)}%
                          </td>
                          {activeTab === 'weekly' && (
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {entry.total_points || 0}
                              <span className="text-xs text-gray-500 ml-1">
                                / {entry.possible_points || 0}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg font-medium">No data available</p>
                <p className="text-sm mt-2">
                  {activeTab === 'weekly' 
                    ? `No picks have been made for Week ${currentWeek} yet.`
                    : 'No season data available yet.'
                  }
                </p>
                {activeTab === 'weekly' && (
                  <a 
                    href="/picks" 
                    className="inline-block mt-4 text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Make your picks →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {currentData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">1</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Leader</dt>
                      <dd className="text-sm sm:text-base font-medium text-gray-900">
                        {currentData[0] ? getUserDisplayName(currentData[0]) : '--'}
                      </dd>
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
                      <span className="text-white font-semibold text-sm">#</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Your Rank</dt>
                      <dd className="text-sm sm:text-base font-medium text-gray-900">
                        {(() => {
                          const userIndex = currentData.findIndex(entry => entry.user_id === user.user_id);
                          return userIndex >= 0 ? `#${userIndex + 1}` : '--';
                        })()}
                      </dd>
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
                      <span className="text-white font-semibold text-sm">👥</span>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Players</dt>
                      <dd className="text-sm sm:text-base font-medium text-gray-900">
                        {currentData.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;