import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('skillswap_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('skillswap_token'));
  const [loading, setLoading] = useState(true);

  // Restore & verify user session on app startup
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('skillswap_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('skillswap_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed or token expired:', err.message);
        // Clear invalid token
        localStorage.removeItem('skillswap_token');
        localStorage.removeItem('skillswap_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;

    if (newToken) {
      localStorage.setItem('skillswap_token', newToken);
      setToken(newToken);
    }
    if (userData) {
      localStorage.setItem('skillswap_user', JSON.stringify(userData));
      setUser(userData);
    }

    return response.data;
  };

  // Register handler
  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = response.data;

    if (newToken) {
      localStorage.setItem('skillswap_token', newToken);
      setToken(newToken);
    }
    if (userData) {
      localStorage.setItem('skillswap_user', JSON.stringify(userData));
      setUser(userData);
    }

    return response.data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('skillswap_token');
    localStorage.removeItem('skillswap_user');
    setToken(null);
    setUser(null);
  };

  // Profile update handler
  const updateUserState = (updatedUser) => {
    localStorage.setItem('skillswap_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
