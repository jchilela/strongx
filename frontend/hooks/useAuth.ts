'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import {
  getAccessToken,
  getStoredUser,
  storeTokens,
  storeUser,
  clearAuth,
} from '@/lib/auth';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();
    if (token && user) {
      setState({ user, isLoading: false, isAuthenticated: true });
    } else {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      const { user, tokens } = response.data.data;
      storeTokens(tokens);
      storeUser(user);
      setState({ user, isLoading: false, isAuthenticated: true });
      return { user, tokens };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      setState({ user: null, isLoading: false, isAuthenticated: false });
      router.push('/login');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      const user = response.data.data;
      storeUser(user);
      setState((prev) => ({ ...prev, user }));
      return user;
    } catch {
      return null;
    }
  }, []);

  const updateUser = useCallback((user: User) => {
    storeUser(user);
    setState((prev) => ({ ...prev, user }));
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshUser,
    updateUser,
  };
}
