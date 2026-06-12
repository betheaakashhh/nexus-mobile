// src/stores/authStore.ts
// Mirrors the web's useAuth.ts hook, but persists the JWT in
// expo-secure-store instead of an HttpOnly cookie.

import { create } from 'zustand';
import { authApi, ApiError } from '@/lib/api';
import {
  saveToken,
  getToken,
  deleteToken,
  saveUser,
  getStoredUser,
  deleteStoredUser,
  StoredUser,
} from '@/lib/storage';

interface AuthState {
  user: StoredUser | null;
  loading: boolean;       // true while restoring session on cold start
  error: string | null;

  // Actions
  bootstrap: () => Promise<void>;          // call once on app start
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;          // re-validate session in background
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  // ── Cold start: try cached user first (instant UI),
  // then verify token is still valid in the background. ──────────────
  bootstrap: async () => {
    set({ loading: true });

    const [token, cachedUser] = await Promise.all([getToken(), getStoredUser()]);

    if (!token) {
      set({ user: null, loading: false });
      return;
    }

    // Show cached user immediately so the UI doesn't flash a login screen
    if (cachedUser) {
      set({ user: cachedUser, loading: false });
    }

    // Verify token is still valid (handles expiry / revoked sessions)
    try {
      const { user } = await authApi.me();
      await saveUser(user);
      set({ user, loading: false });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await deleteToken();
        await deleteStoredUser();
        set({ user: null, loading: false });
      } else {
        // Network error — keep showing cached user, app works offline
        set({ loading: false });
      }
    }
  },

  // ── Login ────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ error: null, loading: true });
    try {
      const data = await authApi.login(email, password);

      // The web /api/auth/login sets an HttpOnly cookie AND returns
      // { user }. After the Bearer-token change to auth.ts, the
      // server should also return a `token` field in the JSON body
      // for mobile clients. See the auth.ts patch notes.
      if (!data.token) {
        set({
          loading: false,
          error:
            'Server did not return a token. Make sure /api/auth/login includes "token" in its JSON response for mobile clients.',
        });
        return false;
      }

      await saveToken(data.token);
      await saveUser(data.user);
      set({ user: data.user, loading: false, error: null });
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Network error — check your connection';
      set({ loading: false, error: message });
      return false;
    }
  },

  // ── Logout ───────────────────────────────────────────────────────
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the network call fails, clear local session
    }
    await deleteToken();
    await deleteStoredUser();
    set({ user: null, error: null });
  },

  // ── Background refresh (called on app foreground) ──────────────────
  refreshMe: async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const { user } = await authApi.me();
      await saveUser(user);
      set({ user });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await deleteToken();
        await deleteStoredUser();
        set({ user: null });
      }
      // other errors: stay logged in, just couldn't refresh
    }
  },

  clearError: () => set({ error: null }),
}));