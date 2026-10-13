import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';

/*
 * Sign-in is phone number + password against our own API (/api/auth/*).
 * Firebase is gone: it is a Google service, blocked in China, and gave us no
 * way to reset a forgotten password.
 *
 * The user object keeps the shape the pages were written against under
 * Firebase — email, displayName, photoURL, getIdToken() — so profile,
 * checkout and admin didn't have to change.
 */

export interface AppUser {
  uid: string;
  /** Synthetic "<phone>@phone.avaesim.store"; orders are keyed by it. */
  email: string;
  displayName: null;
  photoURL: null;
  getIdToken: () => Promise<string>;
}

interface Session {
  token: string;
  email: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = 'gotravel-session';

/** Thrown by signIn/signUp; `code` is the API's error code, `message` is shown to the customer. */
export class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? JSON.parse(raw) : null;
    return s && typeof s.token === 'string' && typeof s.email === 'string' ? s : null;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function toUser(s: Session): AppUser {
  return { uid: s.email, email: s.email, displayName: null, photoURL: null, getIdToken: async () => s.token };
}

// Synchronous view of the signed-in user, for code that must decide the
// instant a dialog closes, before React has re-rendered.
let current: AppUser | null = null;
export function currentUser(): AppUser | null {
  return current;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function post(path: string, body: unknown): Promise<Session> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('network', 'Сүлжээний алдаа. Интернэтээ шалгаад дахин оролдоно уу.');
  }
  const data = await res.json().catch(() => ({})) as { token?: string; user?: { email?: string }; error?: string; message?: string };
  if (!res.ok || !data.token || !data.user?.email) {
    throw new AuthError(data.error ?? `http_${res.status}`, data.message ?? 'Алдаа гарлаа. Дахин оролдоно уу.');
  }
  return { token: data.token, email: data.user.email };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const s = readSession();
    current = s ? toUser(s) : null;
    return current;
  });

  function apply(s: Session | null) {
    writeSession(s);
    current = s ? toUser(s) : null;
    setUser(current);
  }

  // A stored token may have expired or been signed with a rotated secret;
  // drop it if the server no longer accepts it. Network failures keep it, so
  // a flaky connection abroad doesn't sign anyone out.
  useEffect(() => {
    const s = readSession();
    if (!s) return;
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${s.token}` } })
      .then(r => { if (r.status === 401) apply(null); })
      .catch(() => {});
  }, []);

  const value: AuthContextType = {
    user,
    loading: false,
    signIn: async (phone, password) => apply(await post('/auth/login', { phone, password })),
    signUp: async (phone, password) => apply(await post('/auth/register', { phone, password })),
    signOut: async () => apply(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
