import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, type User } from '../lib/api';
import { hasValidToken, getStoredToken } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized) return; // Prevent re-running
      
      try {
        const token = getStoredToken();
        
        if (token && hasValidToken()) {
          // Token exists and appears valid, set it and verify
          api.setToken(token);
          
          try {
            const currentUser = await api.getCurrentUser();
            setUser(currentUser);
            console.log('Auth restored from stored token');
          } catch (error) {
            // Token is invalid, clear it
            console.warn('Stored token is invalid, clearing auth data');
            api.clearToken();
            setUser(null);
          }
        } else if (token) {
          // Token exists but appears expired/invalid
          console.warn('Stored token appears expired, clearing auth data');
          api.clearToken();
          setUser(null);
        }
        // If no token, user remains null
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array to run only once

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await api.login(username, password);
      setUser(response.user);
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    error,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};