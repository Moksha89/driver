'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { closeSocket } from '@/lib/socket';
import { clearToken, getStoredToken, storeToken } from '@/lib/storage';
import type { AuthResponse, User, UserRole } from '@/lib/types';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  state: AuthState;
  message: string | null;
  login: (phone: string, password: string) => Promise<UserRole>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<AuthState>('loading');
  const [message, setMessage] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearToken();
    closeSocket();
    setToken(null);
    setUser(null);
    setState('unauthenticated');
  }, []);

  const refresh = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      closeSocket();
      setToken(null);
      setUser(null);
      setState('unauthenticated');
      return;
    }

    setToken(storedToken);
    try {
      const me = await apiFetch<User>('/api/auth/me');
      if (me.role === 'DRIVER') {
        clearToken();
        setToken(null);
        setUser(null);
        setMessage('Driver accounts are not allowed in the admin dashboard.');
        setState('unauthenticated');
        return;
      }

      setUser(me);
      setState('authenticated');
    } catch {
      clearToken();
      closeSocket();
      setToken(null);
      setUser(null);
      setState('unauthenticated');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (state === 'unauthenticated' && router && window.location.pathname !== '/login') {
      router.replace('/login');
    }
  }, [router, state]);

  const login = useCallback(async (phone: string, password: string) => {
    const response = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { phone, password },
      redirectOn401: false,
    });

    if (response.user.role === 'DRIVER') {
      clearToken();
      setMessage('Driver accounts are not allowed in the admin dashboard.');
      throw new Error('Driver accounts are not allowed in the admin dashboard.');
    }

    storeToken(response.token);
    setToken(response.token);
    setUser(response.user);
    setState('authenticated');
    setMessage(null);
    return response.user.role;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      state,
      message,
      login,
      logout,
      refresh,
    }),
    [login, logout, message, refresh, state, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
