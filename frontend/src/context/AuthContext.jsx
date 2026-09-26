import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 'usr-admin',
  name: 'Bishnupriya Mohapatra',
  email: 'priya@acme.com',
  role: 'admin',
  workspaces: [],
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
      return savedUser ? JSON.parse(savedUser) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    try {
      const saved = localStorage.getItem('active_workspace');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchWorkspaces = useCallback(async () => {
    try {
      const list = await api.workspaces.list();
      if (Array.isArray(list) && list.length > 0) {
        setWorkspaces(list);
        setActiveWorkspace((prev) => {
          if (prev && list.some((w) => w.id === prev.id)) {
            return prev;
          }
          const defaultWs = list[0];
          localStorage.setItem('active_workspace', JSON.stringify(defaultWs));
          return defaultWs;
        });
      }
    } catch (e) {
      console.warn('Backend workspaces fetch failed, using fallback:', e);
      const fallback = [
        { id: 'a388c08d-67f1-45ee-a10d-e2e9583c0dee', name: 'General Intelligence Workspace', strict_mode: false },
        { id: '5d58b7c1-0ad7-4f25-8e62-952031dc0f1c', name: 'Legal & Compliance Vault', strict_mode: true },
      ];
      setWorkspaces(fallback);
      setActiveWorkspace((prev) => prev || fallback[0]);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const selectWorkspace = (ws) => {
    setActiveWorkspace(ws);
    try {
      localStorage.setItem('active_workspace', JSON.stringify(ws));
    } catch (e) {
      console.warn('Could not store active_workspace', e);
    }
  };

  const isLoggedIn = !!token;

  const login = (newToken, userData = null) => {
    try {
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      if (userData) {
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
      }
      fetchWorkspaces();
    } catch (e) {
      console.warn('Unable to persist auth state:', e);
    }
  };

  const loginWithCredentials = async (email, password) => {
    try {
      const res = await api.auth.login(email, password);
      const authToken = res.access_token;
      const authUser = {
        id: res.user.id,
        name: res.user.full_name || email.split('@')[0],
        email: res.user.email,
        role: res.user.role || 'editor',
      };
      login(authToken, authUser);
      return { success: true, user: authUser };
    } catch (err) {
      // Return error for UI handling
      return { success: false, error: err.message };
    }
  };

  const registerWithCredentials = async (data) => {
    try {
      const res = await api.auth.register(data);
      const authUser = {
        id: res.user.id,
        name: res.user.full_name || data.email.split('@')[0],
        email: res.user.email,
        role: res.user.role || 'editor',
      };
      // Do not auto-login: user must see and sign in via the login page
      return { success: true, user: authUser };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('active_workspace');
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
        workspaces,
        activeWorkspace,
        setActiveWorkspace: selectWorkspace,
        refreshWorkspaces: fetchWorkspaces,
        login,
        loginWithCredentials,
        registerWithCredentials,
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
