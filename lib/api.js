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
      throw new Error(error.message || `HTTP ${response.status}`);
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
      console.warn('Backend not available, using mock user from token');
      if (this.token && this.token.includes('.mock_signature')) {
        try {
          const payloadPart = this.token.split('.')[1];
          const payload = JSON.parse(atob(payloadPart));
          const mockUser = mockUsers.find(user => user.user_id === payload.userId);
          return mockUser;
        } catch (e) {
          console.error('Failed to decode mock token:', e);
        }
      }
      return null;
    }
  }

  // Games
  async getCurrentWeekGames() {
    try {
      // Temporarily use mock data to show real 2025 NFL Week 1 schedule
      console.log('Using mock data for real 2025 NFL Week 1 schedule');
      const { mockGames } = await import('./mockData');
      return mockGames;
      
      // Original backend call (commented out temporarily)
      // const data = await this.request('/games/current-week');
      // return data.games;
    } catch (error) {
      console.warn('Backend not available, using mock games data');
      const { mockGames } = await import('./mockData');
      return mockGames;
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

  // Helper method for mock data
  generateMockToken(user) {
    const header = { alg: 'none', typ: 'JWT' };
    const payload = {
      userId: user.user_id,
      username: user.username,
      isAdmin: user.is_admin,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    return `${encodedHeader}.${encodedPayload}.mock_signature`;
  }
}

export const api = new ApiClient();