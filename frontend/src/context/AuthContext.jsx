import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/**
 * Mock user for demo purposes.
 * In production this would be populated from a real auth backend.
 * Roles: 'admin' | 'editor' | 'viewer'
 */
const MOCK_USER = {
  id: 'usr-1',
  name: 'Bishnupriya Mohapatra',
  email: 'bishnupriya@quelle.dev',
  role: 'admin',
  workspaces: [
    { id: 'ws-1', name: 'Engineering Docs' },
    { id: 'ws-2', name: 'Finance Reports' },
  ],
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('auth_token') || 'mock-token';
    } catch {
      return 'mock-token';
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      return savedUser ? JSON.parse(savedUser) : MOCK_USER;
    } catch {
      return MOCK_USER;
    }
  });

  const isLoggedIn = !!token;

  const login = (newToken, userData = null) => {
    try {
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      if (userData) {
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (e) {
      console.warn('Unable to persist auth state:', e);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } catch (e) {
      console.warn('Unable to clear auth state:', e);
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
