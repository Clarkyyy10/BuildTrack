import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from './api.js';
import { setLocale } from './format.js';
import type { Settings, User } from './types.js';

interface AuthState {
  user: User | null;
  settings: Settings | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setSettings: (s: Settings) => void;
}

const AuthContext = createContext<AuthState | null>(null);

const ACCENTS = new Set(['terracotta', 'amber', 'forest', 'teal', 'blue', 'violet', 'rose', 'graphite']);
const DARK_THEMES = new Set(['warm', 'neutral', 'slate', 'midnight', 'black']);

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Applies user settings to the document root as data attributes / CSS vars. */
export function applySettings(s: Settings | null) {
  const root = document.documentElement;
  // Theme: explicit light/dark, or follow the OS when set to "system".
  const theme = s?.theme === 'dark' ? 'dark' : s?.theme === 'system' ? (prefersDark() ? 'dark' : 'light') : 'light';
  root.dataset.theme = theme;
  // Accent: a curated preset key; fall back to the terracotta default.
  root.dataset.accent = s?.accent && ACCENTS.has(s.accent) ? s.accent : 'terracotta';
  // Dark-mode surface tone; only takes effect while data-theme is 'dark'.
  root.dataset.darkTheme = s?.dark_theme && DARK_THEMES.has(s.dark_theme) ? s.dark_theme : 'warm';
  root.dataset.density = s?.density === 'compact' ? 'compact' : 'comfortable';
  root.dataset.contrast = s?.high_contrast ? 'high' : 'normal';
  root.dataset.motion = s?.reduced_motion ? 'reduced' : 'normal';
  // Table density is a separate lane from overall UI density.
  root.dataset.tableDensity = s?.table_density === 'compact' ? 'compact' : 'comfortable';
  // Screen-reader hints: gates extra sr-only helper text across the app.
  root.dataset.srHints = s?.screen_reader_hint ? 'on' : 'off';
  root.style.setProperty('--font-scale', String(s?.font_scale ?? 1));
  // Locale drives number/date/currency formatting (see format.ts) and the
  // document language for assistive tech.
  root.lang = s?.language === 'fil' ? 'fil' : 'en';
  setLocale(s?.region === 'US' ? 'US' : 'PH');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef<Settings | null>(null);

  const setSettings = (s: Settings) => {
    settingsRef.current = s;
    setSettingsState(s);
    applySettings(s);
  };

  // When theme is "system", follow live OS light/dark changes.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (settingsRef.current?.theme === 'system') applySettings(settingsRef.current); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  async function refresh() {
    try {
      const res = await api.get<{ user: User; settings: Settings }>('/me');
      setUser(res.user);
      setSettings(res.settings);
    } catch {
      setUser(null);
      settingsRef.current = null;
      setSettingsState(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function login(email: string, password: string) {
    await api.post('/auth/login', { email, password });
    await refresh();
  }
  async function signup(displayName: string, email: string, password: string) {
    await api.post('/auth/signup', { displayName, email, password });
    await refresh();
  }
  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
    settingsRef.current = null;
    setSettingsState(null);
  }

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, signup, logout, refresh, setSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
