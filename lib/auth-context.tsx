'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { APIClient } from './api-client';

interface Admin {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if admin is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await APIClient.getCurrentAdmin();
          if (response.success) {
            setAdmin(response.admin);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await APIClient.login(email, password);
      if (response.success) {
        setAdmin(response.admin);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setError(null);
    APIClient.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
