'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, getUser, saveUser, getToken, removeToken, removeUser } from '../utils/api';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  username?: string;
  avatar?: string;
  address?: any;
  [key: string]: any;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshProfile: async () => {},
  logout: () => {},
  updateUser: () => {},
});

const PROFILE_CACHE_KEY = 'vendly_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > PROFILE_CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCachedProfile(data: AuthUser) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function clearProfileCache() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Must start as null on both server and client — reading localStorage here
  // causes SSR/client HTML mismatch (hydration error). We read it in useEffect instead.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedOnce = useRef(false);

  const refreshProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiRequest('/auth/profile');
      if (res.success && res.data) {
        const profile = res.data;
        setUser(profile);
        saveUser(profile);
        setCachedProfile(profile);
      } else {
        setUser(null);
        clearProfileCache();
      }
    } catch {
      // Keep existing user from cache on network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Show cached profile instantly (no spinner), then refresh in background
    const cached = getCachedProfile() || getUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
      refreshProfile(); // silent background refresh
    } else {
      refreshProfile();
    }
  }, [refreshProfile]);

  const logout = useCallback(() => {
    removeToken();
    removeUser();
    clearProfileCache();
    setUser(null);
    fetchedOnce.current = false;
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      saveUser(updated);
      setCachedProfile(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
