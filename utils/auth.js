// Authentication utilities for better session management

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const hasValidToken = () => {
  const token = getStoredToken();
  if (!token) return false;
  
  try {
    // Check if token is not expired (basic JWT structure check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    
    // For mock tokens, always consider them valid if they have proper structure
    if (token.includes('.mock_signature')) {
      return payload.exp && payload.exp > now;
    }
    
    // Only consider token invalid if it's actually expired (not within 1 minute)
    return payload.exp && payload.exp > now;
  } catch (error) {
    // Invalid token format
    return false;
  }
};

export const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

export const setAuthData = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};