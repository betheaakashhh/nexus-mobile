// src/lib/storage.ts
// Encrypted token storage for the mobile app.
// This replaces the web's HttpOnly cookie — expo-secure-store
// uses the Android Keystore / iOS Secure Enclave under the hood.

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'nexus_jwt';
const USER_KEY  = 'nexus_user';

// ── Token ─────────────────────────────────────────────────────────
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── User cache (so we don't call /api/auth/me on every cold start) ─
export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function saveUser(user: StoredUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function deleteStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

// ── Wipe everything (logout) ─────────────────────────────────────
export async function clearAll(): Promise<void> {
  await Promise.all([deleteToken(), deleteStoredUser()]);
}