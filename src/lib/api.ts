// src/lib/api.ts
// Central API client for the Nexus mobile app.
// Every request automatically attaches the JWT as Authorization: Bearer
// hitting the same REST endpoints as the web app.

import { getToken, deleteToken, deleteStoredUser } from './storage';

// ── CONFIG ─────────────────────────────────────────────────────────
// Replace with your deployed Vercel URL.
// During development you can use your local IP:
//   e.g. "http://192.168.1.5:3000"  (from `npx expo start` output)
export const BASE_URL = 'https://your-nexus-app.vercel.app';

// ── Types ───────────────────────────────────────────────────────────
type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

interface ApiOptions {
  method?: Method;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  formData?: FormData;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Core request function ───────────────────────────────────────────
async function request<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = await getToken();

  // Build URL with query params
  const url = new URL(BASE_URL + path);
  if (opts.params) {
    for (const [key, value] of Object.entries(opts.params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  // Build headers
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (opts.body && !opts.formData) {
    headers['Content-Type'] = 'application/json';
  }

  // Make request
  const response = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.formData
      ? opts.formData
      : opts.body
        ? JSON.stringify(opts.body)
        : undefined,
  });

  // Handle 401 — token expired, force logout
  if (response.status === 401) {
    await deleteToken();
    await deleteStoredUser();
    // The auth store listener will redirect to login
    throw new ApiError(401, 'Session expired');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data as Record<string, string>).error ?? `HTTP ${response.status}`,
      data,
    );
  }

  return data as T;
}

// ── Convenience methods ─────────────────────────────────────────────
export const api = {
  get:    <T>(path: string, params?: ApiOptions['params']) =>
    request<T>(path, { method: 'GET', params }),

  post:   <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),

  patch:  <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, formData: FormData, method: Method = 'POST') =>
    request<T>(path, { method, formData }),
};

export { ApiError };

// ── Auth endpoints ─────────────────────────────────────────────────
export interface LoginResponse {
  user: { id: string; email: string; name: string; role: string };
  token?: string; // returned in body after our auth.ts change
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { email, password }),

  me: () =>
    api.get<{ user: LoginResponse['user'] }>('/api/auth/me'),

  logout: () =>
    api.post<{ success: boolean }>('/api/auth/logout'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ success: boolean }>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};

// ── Contacts endpoints ─────────────────────────────────────────────
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tag: 'personal' | 'family' | 'work' | 'emergency';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export const contactsApi = {
  list: (params?: { tag?: string; q?: string; sort?: string }) =>
    api.get<{ contacts: Contact[] }>('/api/contacts', params),

  get: (id: string) =>
    api.get<{ contact: Contact }>(`/api/contacts/${id}`),

  create: (data: Partial<Contact>) =>
    api.post<{ contact: Contact }>('/api/contacts', data),

  update: (id: string, data: Partial<Contact>) =>
    api.patch<{ contact: Contact }>(`/api/contacts/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/api/contacts/${id}`),

  importFile: (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('file', file as unknown as Blob);
    return api.upload<{ imported: number; message: string }>(
      '/api/contacts/import',
      form,
    );
  },
};

// ── Tasks endpoints ────────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  priority: 'high' | 'med' | 'low';
  due?: string;
  dueTime?: string;
  done: boolean;
  notified: boolean;
  createdAt: string;
  contactId?: string;
  contact?: { id: string; name: string };
  userId: string;
}

export const tasksApi = {
  list: (params?: { contactId?: string; q?: string }) =>
    api.get<{ tasks: Task[] }>('/api/tasks', params),

  create: (data: Partial<Task>) =>
    api.post<{ task: Task }>('/api/tasks', data),

  update: (id: string, data: Partial<Task>) =>
    api.patch<{ task: Task }>(`/api/tasks/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/api/tasks/${id}`),
};

// ── Email endpoints ────────────────────────────────────────────────
export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  preview?: string;
  tab: 'inbox' | 'sent' | 'starred';
  unread: boolean;
  starred: boolean;
  sentAt?: string;
  createdAt: string;
}

export const emailsApi = {
  list: (params?: { tab?: string; q?: string }) =>
    api.get<{ emails: Email[] }>('/api/emails', params),

  send: (data: { to: string; subject: string; body: string }) =>
    api.post<{ email: Email }>('/api/emails', {
      sender: 'Me',
      senderEmail: data.to,
      subject: data.subject,
      body: data.body,
      tab: 'sent',
      sentAt: new Date().toLocaleTimeString(),
    }),

  markRead: (id: string) =>
    api.patch(`/api/emails/${id}`, { unread: false }),

  toggleStar: (id: string, starred: boolean) =>
    api.patch(`/api/emails/${id}`, { starred }),

  delete: (id: string) =>
    api.delete(`/api/emails/${id}`),
};

// ── Vault endpoints ────────────────────────────────────────────────
export interface VaultEntry {
  id: string;
  name: string;
  userId_field?: string;
  password: string;
  registrationNumber?: string;
  link?: string;
  notes?: string;
  createdAt: string;
}

export const vaultApi = {
  list: (params?: { q?: string }) =>
    api.get<{ entries: VaultEntry[] }>('/api/vault', params),

  create: (data: Partial<VaultEntry>) =>
    api.post<{ entry: VaultEntry }>('/api/vault', data),

  update: (id: string, data: Partial<VaultEntry>) =>
    api.patch<{ entry: VaultEntry }>(`/api/vault/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/api/vault/${id}`),

  verifyPin: (pin: string) =>
    api.post<{ valid: boolean; noPin?: boolean }>('/api/settings/pin/verify', { pin }),

  hasPin: () =>
    api.get<{ hasPin: boolean }>('/api/settings/pin'),
};

// ── Settings endpoints ─────────────────────────────────────────────
export const settingsApi = {
  get: () =>
    api.get<{ settings: Record<string, unknown> }>('/api/settings'),

  patch: (patch: Record<string, unknown>) =>
    api.patch<{ settings: Record<string, unknown> }>('/api/settings', patch),
};