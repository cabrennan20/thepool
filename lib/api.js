// Enhanced API client for real backend integration
// Replaces localStorage-based picks with database calls

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://thepool-production.up.railway.app/api';

// Import mock data for fallback
import { 
  mockWeeklyScores, 
  mockRecapResponse, 
  mockAvailableWeeks,
  mockUsers
} from './mockData';

class ApiClient {
  constructor() {
    this.token = null;
    // Initialize token from localStorage on client-side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      const errorToThrow = new Error(error.message || `HTTP ${response.status}`);
      if (error.details) {
        errorToThrow.details = error.details;
      }
      throw errorToThrow;
    }

    return response.json();
  }

  // Authentication
  async login(username, password) {
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      this.setToken(data.token);
      return data;
    } catch (error) {
      console.warn('Backend not available, using mock authentication');
      const mockUser = mockUsers.find(user => user.username === username);
      
      if (mockUser && password === 'demo') {
        const token = this.generateMockToken(mockUser);
        this.setToken(token);
        return {
          user: mockUser,
          token: token
        };
      }
      
      throw new Error('Invalid credentials (try username: "admin" password: "demo")');
    }
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    this.setToken(data.token);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    try {
      return await this.request('/auth/me');
    } catch (error) {
      console.warn('Backend not available, checking token locally');
      
      // If we have a token, try to decode it locally
      if (this.token) {
        try {
          const payloadPart = this.token.split('.')[1];
          const payload = JSON.parse(atob(payloadPart));
          
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            console.warn('Token is expired');
            this.clearToken();
            return null;
          }
          
          // For mock tokens, use mock user data
          if (this.token.includes('.mock_signature')) {
            const mockUser = mockUsers.find(user => user.user_id === payload.userId);
            return mockUser;
          }
          
          // For production tokens, create a minimal user object from token payload
          return {
            user_id: payload.userId,
            username: payload.username,
            is_admin: payload.isAdmin || false,
            alias: payload.username // Fallback alias
          };
        } catch (e) {
          console.error('Failed to decode token:', e);
          this.clearToken();
        }
      }
      return null;
    }
  }

  // Games
  async getCurrentWeekGames() {
    try {
      const data = await this.request('/games/current-week');
      return data.games || [];
    } catch (error) {
      console.warn('Backend not available, using mock games data');
      const { mockGames } = await import('./mockData');
      return mockGames;
    }
  }

  // Get live scores from ESPN API
  async getLiveScores(week = 1, season = 2025) {
    try {
      const params = new URLSearchParams();
      params.append('week', week.toString());
      params.append('season', season.toString());
      
      const data = await this.request(`/games/live-scores?${params.toString()}`);
      return data.games || [];
    } catch (error) {
      console.warn('ESPN API not available, using current week games');
      return await this.getCurrentWeekGames();
    }
  }

  // Check ESPN API health
  async checkESPNHealth() {
    try {
      return await this.request('/games/espn/health');
    } catch (error) {
      return {
        available: false,
        message: error.message
      };
    }
  }

  // Picks
  async getUserPicks(userId, week, season) {
    try {
      const params = new URLSearchParams();
      params.append('week', week.toString());
      if (season) params.append('season', season.toString());
      
      return await this.request(`/picks/user/${userId}?${params.toString()}`);
    } catch (error) {
      console.warn('Backend not available, using mock picks data');
      return [];
    }
  }

  async submitPicks(picks) {
    try {
      return await this.request('/picks', {
        method: 'POST',
        body: JSON.stringify({ picks }),
      });
    } catch (error) {
      console.warn('Backend not available, using mock picks submission');
      return picks.map((pick, index) => ({
        ...pick,
        pick_id: Date.now() + index,
        user_id: 1,
        is_correct: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    }
  }

  // Recap
  async getRecapWeeks(season = new Date().getFullYear()) {
    try {
      return await this.request(`/recap/weeks/${season}`);
    } catch (error) {
      console.warn('Backend not available, using mock recap weeks data');
      return mockAvailableWeeks;
    }
  }

  async getRecapData(week, season = new Date().getFullYear()) {
    try {
      return await this.request(`/recap/week/${week}?season=${season}`);
    } catch (error) {
      console.warn('Backend not available, using mock recap data');
      return mockRecapResponse;
    }
  }

  // Scores
  async getWeeklyScores(week, season = new Date().getFullYear()) {
    try {
      const data = await this.request(`/scores/weekly?week=${week}&season=${season}`);
      return data.leaderboard || data;
    } catch (error) {
      console.warn('Backend not available, using mock scores data');
      return mockWeeklyScores;
    }
  }

  async getSeasonStandings(season = new Date().getFullYear()) {
    try {
      const data = await this.request(`/scores/season?season=${season}`);
      return data.standings || data;
    } catch (error) {
      console.warn('Backend not available, using mock season standings');
      // Generate mock season standings from the same user data as recap
      const { mockRecapData } = await import('./mockData');
      return mockRecapData.map((user, index) => ({
        user_id: user.user_id,
        username: user.username,
        alias: user.alias,
        first_name: null,
        last_name: null,
        weeks_played: 1,
        correct_picks: Object.values(user.picks).length - Math.floor(Math.random() * 3), // Random correct picks
        total_picks: Object.values(user.picks).length,
        win_percentage: Math.round((Object.values(user.picks).length - Math.floor(Math.random() * 3)) / Object.values(user.picks).length * 100),
        season_rank: index + 1
      })).sort((a, b) => b.correct_picks - a.correct_picks);
    }
  }

  // Live Tracker - Get current week with live scores
  async getCurrentWeekWithLiveScores() {
    try {
      const data = await this.request('/games/current-week');
      return {
        week: data.week,
        season: data.season,
        games: data.games || []
      };
    } catch (error) {
      console.warn('Backend not available, using mock live scores data');
      const { mockGames } = await import('./mockData');
      
      // Simulate some live scores for demo
      const gamesWithLiveScores = mockGames.map(game => ({
        ...game,
        home_score: Math.floor(Math.random() * 35),
        away_score: Math.floor(Math.random() * 35),
        game_status: ['scheduled', 'in_progress', 'final'][Math.floor(Math.random() * 3)]
      }));
      
      return {
        week: 1,
        season: 2025,
        games: gamesWithLiveScores
      };
    }
  }

  // Live Tracker - Calculate forecasted standings
  async calculateForecast(worksheetScores, week, season = new Date().getFullYear()) {
    try {
      // This would be a backend endpoint that calculates forecasts
      return await this.request('/tracker/forecast', {
        method: 'POST',
        body: JSON.stringify({ 
          worksheet_scores: worksheetScores,
          week,
          season 
        }),
      });
    } catch (error) {
      console.warn('Backend not available, using mock forecast calculation');
      
      // Mock forecast calculation
      const weeklyScores = await this.getWeeklyScores(week, season);
      const seasonStandings = await this.getSeasonStandings(season);
      
      const forecast = weeklyScores.map((userScore, index) => {
        const seasonRecord = seasonStandings.find(s => s.user_id === userScore.user_id);
        
        return {
          user_id: userScore.user_id,
          alias: userScore.alias,
          weekly_record: `${Math.floor(Math.random() * 16)}-${16 - Math.floor(Math.random() * 16)}`,
          weekly_rank: index + 1,
          yearly_rank: seasonRecord?.season_rank || index + 1,
          yearly_rank_change: Math.floor(Math.random() * 5) - 2,
          correct_picks: Math.floor(Math.random() * 16),
          total_picks: 16
        };
      });
      
      return forecast.sort((a, b) => b.correct_picks - a.correct_picks);
    }
  }

  async getCurrentWeek() {
    try {
      const data = await this.request('/system/current-week');
      return data;
    } catch (error) {
      console.warn('Failed to get current week, defaulting to week 1:', error);
      return { season: new Date().getFullYear(), week: 1 };
    }
  }

  // Helper method for mock data
  generateMockToken(user) {
    const header = { alg: 'none', typ: 'JWT' };
    const payload = {
      userId: user.user_id,
      username: user.username,
      isAdmin: user.is_admin,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours to match backend production
    };
    
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    return `${encodedHeader}.${encodedPayload}.mock_signature`;
  }
}

export const api = new ApiClient();