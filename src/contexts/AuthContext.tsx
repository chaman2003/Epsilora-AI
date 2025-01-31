import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { toast } from 'react-hot-toast'; // Using react-hot-toast directly

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('Stored Token:', storedToken);
      if (storedToken) {
        try {
          setToken(storedToken);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const response = await axiosInstance.get('/api/auth/me');
          console.log('User Data Response:', response.data);
          if (response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const checkAuthStatus = async (currentToken: string) => {
    try {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      const response = await axiosInstance.get('/api/auth/me');
      if (response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      toast.error('Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Clear all AI assist and quiz related data from localStorage
      localStorage.removeItem('aiAssistMessages');
      localStorage.removeItem('quiz_data');
      localStorage.removeItem('quizData');
      
      const response = await axiosInstance.post('/api/auth/signup', {
        name,
        email,
        password,
      });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Account created successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      setError(message);
      toast.error('Signup failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    handleLogout();
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};