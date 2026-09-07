import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api.js';
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

/** Applies user settings to the document root as data attributes / CSS vars. */
export function applySettings(s: Settings | null) {
  const root = document.documentElement;
  root.dataset.theme = s?.theme === 'dark' ? 'dark' : 'light';
  root.dataset.density = s?.density === 'compact' ? 'compact' : 'comfortable';
  root.dataset.contrast = s?.high_contrast ? 'high' : 'normal';
  root.dataset.motion = s?.reduced_motion ? 'reduced' : 'normal';
  root.style.setProperty('--font-scale', String(s?.font_scale ?? 1));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const setSettings = (s: Settings) => {
    setSettingsState(s);
    applySettings(s);
  };

  async function refresh() {
    try {
      const res = await api.get<{ user: User; settings: Settings }>('/me');
      setUser(res.user);
      setSettings(res.settings);
    } catch {
      setUser(null);
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
