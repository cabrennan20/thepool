import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { api } from '../lib/api';

const AdminPanel = () => {
  const { user, isLoading } = useAuth();
  const [currentWeekGames, setCurrentWeekGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('games');
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
        
        // Fetch admin messages
        const messagesData = await api.getAdminMessages(10, 0);
        setAdminMessages(messagesData.messages);
        
      } catch (err) {
        setError('Failed to load admin data');
        console.error('Admin fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const updateGameResult = async (gameId, homeScore, awayScore) => {
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

  const calculateWeeklyScores = async (week, season) => {
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

  const updateUserStatus = async (userId, isAdmin, isActive) => {
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
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Messages
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

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <AdminMessagesTab 
            messages={adminMessages}
            onMessagesChange={async () => {
              // Refresh messages
              try {
                const messagesData = await api.getAdminMessages(10, 0);
                setAdminMessages(messagesData.messages);
              } catch (err) {
                console.error('Failed to refresh messages:', err);
              }
            }}
            onError={setError}
            onSuccess={setSuccessMessage}
          />
        )}
      </div>
    </div>
  );
};

// Game Result Form Component

const GameResultForm = ({ game, onUpdate }) => {
  const [homeScore, setHomeScore] = useState(game.home_score?.toString() || '');
  const [awayScore, setAwayScore] = useState(game.away_score?.toString() || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!homeScore || !awayScore) return;
    
    setSubmitting(true);
    try {
      await onUpdate(game.game_id, parseInt(homeScore), parseInt(awayScore));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
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

const UserManagementItem = ({ user, onUpdate }) => {
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

// Admin Messages Tab Component

const AdminMessagesTab = ({ 
  messages, 
  onMessagesChange, 
  onError, 
  onSuccess 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const handleCreateMessage = async (data) => {
    try {
      await api.createAdminMessage(data);
      onSuccess('Message created successfully!');
      setShowCreateForm(false);
      await onMessagesChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create message');
    }
  };

  const handleUpdateMessage = async (messageId, data) => {
    try {
      await api.updateAdminMessage(messageId, data);
      onSuccess('Message updated successfully!');
      setEditingMessage(null);
      await onMessagesChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await api.deleteAdminMessage(messageId);
      onSuccess('Message deleted successfully!');
      await onMessagesChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">League Messages</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Create Message
        </button>
      </div>

      {/* Create Message Form */}
      {showCreateForm && (
        <MessageForm
          onSubmit={handleCreateMessage}
          onCancel={() => setShowCreateForm(false)}
          title="Create New Message"
        />
      )}

      {/* Edit Message Form */}
      {editingMessage && (
        <MessageForm
          message={editingMessage}
          onSubmit={(data) => handleUpdateMessage(editingMessage.message_id, data)}
          onCancel={() => setEditingMessage(null)}
          title="Edit Message"
        />
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet. Create your first league announcement!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.message_id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{message.title}</h3>
                    {message.is_pinned && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        Pinned
                      </span>
                    )}
                    {message.send_email && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        Emailed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    By {message.author_first_name} {message.author_last_name} • {' '}
                    {new Date(message.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="prose prose-sm max-w-none">
                    {message.content.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setEditingMessage(message)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(message.message_id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Message Form Component

const MessageForm = ({ message, onSubmit, onCancel, title }) => {
  const [formData, setFormData] = useState({
    title: message?.title || '',
    content: message?.content || '',
    is_pinned: message?.is_pinned || false,
    send_email: message?.send_email || false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Message title..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Your message content..."
            required
          />
        </div>
        
        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_pinned}
              onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Pin this message</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.send_email}
              onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Send email notification</span>
          </label>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!formData.title || !formData.content || submitting}
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {submitting ? 'Saving...' : (message ? 'Update Message' : 'Create Message')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPanel;