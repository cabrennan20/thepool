import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { api, type Game, type User } from '../lib/api';

interface WeeklyScoresData {
  user_id: number;
  username: string;
  week: number;
  correct_picks: number;
  total_picks: number;
  total_points: number;
  possible_points: number;
  win_percentage: number;
  weekly_rank?: number;
}

const AdminPanel: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentWeekGames, setCurrentWeekGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'games' | 'users' | 'scores'>('games');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.is_admin) return;
      
      try {
        setLoading(true);
        
        // Fetch current week games
        const gamesData = await api.getCurrentWeekGames();
        setCurrentWeekGames(gamesData);
        
        // Fetch all users
        const usersData = await api.getAllUsers();
        setUsers(usersData);
        
      } catch (err) {
        setError('Failed to load admin data');
        console.error('Admin fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const updateGameResult = async (gameId: number, homeScore: number, awayScore: number) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await api.updateGameResult(gameId, homeScore, awayScore);
      
      setSuccessMessage('Game result updated successfully!');
      
      // Refresh games data
      const gamesData = await api.getCurrentWeekGames();
      setCurrentWeekGames(gamesData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update game result';
      setError(errorMessage);
    }
  };

  const calculateWeeklyScores = async (week: number, season: number) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await api.calculateWeeklyScores(week, season);
      
      setSuccessMessage(`Weekly scores calculated for Week ${week}!`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate scores';
      setError(errorMessage);
    }
  };

  const updateUserStatus = async (userId: number, isAdmin: boolean, isActive: boolean) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await api.updateUser(userId, { is_admin: isAdmin, is_active: isActive });
      
      setSuccessMessage('User updated successfully!');
      
      // Refresh users data
      const usersData = await api.getAllUsers();
      setUsers(usersData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
    }
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

  if (!user.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading admin data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">
            Manage games, users, and scoring for the NFL picks tracker.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('games')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'games'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Game Results
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('scores')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scores'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Score Calculation
            </button>
          </nav>
        </div>

        {/* Game Results Tab */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Current Week Games</h2>
            
            <div className="grid gap-4">
              {currentWeekGames.map((game) => (
                <GameResultForm
                  key={game.game_id}
                  game={game}
                  onUpdate={updateGameResult}
                />
              ))}
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.map((userItem) => (
                  <UserManagementItem
                    key={userItem.user_id}
                    user={userItem}
                    onUpdate={updateUserStatus}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Score Calculation Tab */}
        {activeTab === 'scores' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Score Calculation</h2>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Calculate Weekly Scores</h3>
              <p className="text-gray-600 mb-4">
                Calculate scores for all users after games are completed. This will update the leaderboards.
              </p>
              
              <button
                onClick={() => calculateWeeklyScores(1, 2025)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Calculate Week 1 Scores
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Game Result Form Component
interface GameResultFormProps {
  game: Game;
  onUpdate: (gameId: number, homeScore: number, awayScore: number) => Promise<void>;
}

const GameResultForm: React.FC<GameResultFormProps> = ({ game, onUpdate }) => {
  const [homeScore, setHomeScore] = useState(game.home_score?.toString() || '');
  const [awayScore, setAwayScore] = useState(game.away_score?.toString() || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeScore || !awayScore) return;
    
    setSubmitting(true);
    try {
      await onUpdate(game.game_id, parseInt(homeScore), parseInt(awayScore));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {game.away_team} @ {game.home_team}
          </h3>
          <p className="text-sm text-gray-500">{formatDate(game.game_date)}</p>
          <p className="text-sm text-gray-500">
            Status: <span className="font-medium">{game.game_status}</span>
          </p>
        </div>
        
        {game.game_status === 'final' && (
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              Final: {game.away_team} {game.away_score} - {game.home_score} {game.home_team}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {game.away_team} Score
          </label>
          <input
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {game.home_team} Score
          </label>
          <input
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <button
          type="submit"
          disabled={!homeScore || !awayScore || submitting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
        >
          {submitting ? 'Updating...' : 'Update Result'}
        </button>
      </form>
    </div>
  );
};

// User Management Item Component
interface UserManagementItemProps {
  user: User;
  onUpdate: (userId: number, isAdmin: boolean, isActive: boolean) => Promise<void>;
}

const UserManagementItem: React.FC<UserManagementItemProps> = ({ user, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleAdmin = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(user.user_id, !user.is_admin, user.is_active ?? true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(user.user_id, user.is_admin, !(user.is_active ?? true));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <li className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-gray-500">
              @{user.username} • {user.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Admin:</span>
            <button
              onClick={handleToggleAdmin}
              disabled={isUpdating}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.is_admin
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {user.is_admin ? 'Yes' : 'No'}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Active:</span>
            <button
              onClick={handleToggleActive}
              disabled={isUpdating}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {user.is_active ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

export default AdminPanel;