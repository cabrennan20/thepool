// Enhanced API client for real backend integration
// Replaces localStorage-based picks with database calls

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Import mock data for fallback
import { 
  mockWeeklyScores, 
  mockRecapResponse, 
  mockAvailableWeeks 
} from './mockData';

interface User {
  user_id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  alias?: string;
  is_admin: boolean;
  is_active?: boolean;
}

interface Game {
  game_id: number;
  season: number;
  week: number;
  game_date: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  spread?: number;
  game_status: 'scheduled' | 'in_progress' | 'final';
}

interface Pick {
  pick_id?: number;
  user_id: number;
  game_id: number;
  selected_team: string;
  tiebreaker_points?: number;
  is_correct?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface WeeklyScore {
  user_id: number;
  username: string;
  alias?: string;
  week: number;
  correct_picks: number;
  total_picks: number;
  win_percentage: number;
  weekly_rank?: number;
}

interface RecapData {
  user_id: number;
  alias: string;
  username: string;
  picks: Record<number, string | null>; // game_id -> selected_team
  tiebreaker_points: number | null;
}

interface PickPercentage {
  total_picks: number;
  home_team_picks: number;
  away_team_picks: number;
  home_team_percentage: number;
  away_team_percentage: number;
  home_team: string;
  away_team: string;
  is_upset: boolean;
  winner?: string;
}

interface RecapResponse {
  week: number;
  season: number;
  picks_closed: boolean;
  games: Game[];
  final_game: Game;
  recap_data: RecapData[];
  pick_percentages: Record<number, PickPercentage>;
  total_users: number;
  total_games: number;
}

interface RecapWeek {
  week: number;
  first_game_date: string;
  last_game_date: string;
  game_count: number;
  completed_games: number;
  picks_closed: boolean;
  recap_available: boolean;
}

interface NotificationPreferences {
  user_id: number;
  email_pick_reminders: boolean;
  email_weekly_recap: boolean;
  email_urgent_reminders: boolean;
  sms_pick_reminders: boolean;
  reminder_hours_before: number;
  created_at: string;
  updated_at: string;
}

interface AdminMessage {
  message_id: number;
  title: string;
  content: string;
  author_username: string;
  author_first_name: string;
  author_last_name: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  send_email: boolean;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string) {
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle authentication errors specifically
      if (response.status === 401 || response.status === 403) {
        this.clearToken();
      }
      
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    this.setToken(data.token);
    return data;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    alias: string;
    phone: string;
    address: string;
  }): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    this.setToken(data.token);
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Games
  async getGames(season?: number, week?: number): Promise<Game[]> {
    const params = new URLSearchParams();
    if (season) params.append('season', season.toString());
    if (week) params.append('week', week.toString());
    
    return this.request<Game[]>(`/games?${params.toString()}`);
  }

  async getCurrentWeekGames(): Promise<Game[]> {
    const data = await this.request<{ week: number; season: number; games: Game[] }>('/games/current-week');
    return data.games;
  }

  // Picks
  async getUserPicks(userId: number, week: number, season?: number): Promise<Pick[]> {
    const params = new URLSearchParams();
    params.append('week', week.toString());
    if (season) params.append('season', season.toString());
    
    return this.request<Pick[]>(`/picks/user/${userId}?${params.toString()}`);
  }

  async submitPicks(picks: Omit<Pick, 'pick_id' | 'user_id' | 'is_correct'>[]): Promise<Pick[]> {
    return this.request<Pick[]>('/picks', {
      method: 'POST',
      body: JSON.stringify({ picks }),
    });
  }

  async updatePick(pickId: number, updates: Partial<Pick>): Promise<Pick> {
    return this.request<Pick>(`/picks/${pickId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Scoring and Standings
  async getWeeklyScores(week: number, season?: number): Promise<WeeklyScore[]> {
    try {
      const params = new URLSearchParams();
      params.append('week', week.toString());
      if (season) params.append('season', season.toString());
      
      return await this.request<WeeklyScore[]>(`/scores/weekly?${params.toString()}`);
    } catch (error) {
      console.warn('Backend not available, using mock weekly scores data');
      return mockWeeklyScores;
    }
  }

  async getSeasonStandings(season?: number): Promise<WeeklyScore[]> {
    try {
      const params = new URLSearchParams();
      if (season) params.append('season', season.toString());
      
      return await this.request<WeeklyScore[]>(`/scores/season?${params.toString()}`);
    } catch (error) {
      console.warn('Backend not available, using mock season standings data');
      return mockWeeklyScores;
    }
  }

  async getUserStats(userId: number, season?: number): Promise<{
    total_correct: number;
    total_games: number;
    win_percentage: number;
    season_rank: number;
    weeks_played: number;
  }> {
    const params = new URLSearchParams();
    if (season) params.append('season', season.toString());
    
    return this.request(`/users/${userId}/stats?${params.toString()}`);
  }

  // Recap functions
  async getRecapData(week: number, season?: number): Promise<RecapResponse> {
    try {
      const params = new URLSearchParams();
      if (season) params.append('season', season.toString());
      
      return await this.request<RecapResponse>(`/recap/week/${week}?${params.toString()}`);
    } catch (error) {
      console.warn('Backend not available, using mock recap data');
      return mockRecapResponse;
    }
  }

  async getRecapWeeks(season: number): Promise<{ season: number; weeks: RecapWeek[] }> {
    try {
      return await this.request<{ season: number; weeks: RecapWeek[] }>(`/recap/weeks/${season}`);
    } catch (error) {
      console.warn('Backend not available, using mock recap weeks data');
      return { season, weeks: mockAvailableWeeks };
    }
  }

  async getUserRecapData(userId: number, week: number, season?: number): Promise<{
    user_id: number;
    week: number;
    season: number;
    picks: any[];
  }> {
    const params = new URLSearchParams();
    if (season) params.append('season', season.toString());
    
    return this.request(`/recap/user/${userId}/week/${week}?${params.toString()}`);
  }

  // System
  async getSystemSettings(): Promise<Record<string, string>> {
    return this.request<Record<string, string>>('/system/settings');
  }

  async getCurrentWeek(): Promise<{ season: number; week: number }> {
    return this.request<{ season: number; week: number }>('/system/current-week');
  }

  // Admin functions
  async updateGameResult(gameId: number, homeScore: number, awayScore: number): Promise<Game> {
    return this.request<Game>(`/admin/games/${gameId}/result`, {
      method: 'PUT',
      body: JSON.stringify({ home_score: homeScore, away_score: awayScore }),
    });
  }

  async calculateWeeklyScores(week: number, season?: number): Promise<void> {
    const params = new URLSearchParams();
    params.append('week', week.toString());
    if (season) params.append('season', season.toString());
    
    await this.request(`/admin/calculate-scores?${params.toString()}`, {
      method: 'POST',
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/admin/users');
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    return this.request<User>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Notifications
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return this.request<NotificationPreferences>('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<{ message: string; preferences: NotificationPreferences }> {
    return this.request<{ message: string; preferences: NotificationPreferences }>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async testEmailConfiguration(): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request<{ success: boolean; message?: string; error?: string }>('/notifications/test-email');
  }

  async sendTestEmail(email: string): Promise<{ success: boolean; message: string; details: string }> {
    return this.request<{ success: boolean; message: string; details: string }>('/notifications/test-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Admin Messages
  async getAdminMessages(limit?: number, offset?: number): Promise<{
    messages: AdminMessage[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    return this.request<{
      messages: AdminMessage[];
      total: number;
      limit: number;
      offset: number;
    }>(`/admin-messages?${params.toString()}`);
  }

  async createAdminMessage(data: {
    title: string;
    content: string;
    is_pinned?: boolean;
    send_email?: boolean;
  }): Promise<{ message: string; data: AdminMessage }> {
    return this.request<{ message: string; data: AdminMessage }>('/admin-messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminMessage(messageId: number, data: {
    title: string;
    content: string;
    is_pinned?: boolean;
    send_email?: boolean;
  }): Promise<{ message: string; data: AdminMessage }> {
    return this.request<{ message: string; data: AdminMessage }>(`/admin-messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminMessage(messageId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin-messages/${messageId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
export type { User, Game, Pick, WeeklyScore, RecapData, RecapResponse, RecapWeek, PickPercentage, NotificationPreferences, AdminMessage };