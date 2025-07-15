// Authentication utilities for better session management

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const hasValidToken = (): boolean => {
  const token = getStoredToken();
  if (!token) return false;
  
  try {
    // Check if token is not expired (basic JWT structure check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    
    // If token expires within next 5 minutes, consider it invalid
    return payload.exp && payload.exp > (now + 300);
  } catch (error) {
    // Invalid token format
    return false;
  }
};

export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

export const setAuthData = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};