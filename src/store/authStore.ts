import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { api, setAccessToken, setSessionExpiredHandler } from '../lib/api';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.data.accessToken);
    set({ user: res.data.data.user, status: 'authenticated' });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    setAccessToken(null);
    set({ user: null, status: 'unauthenticated' });
  },

  /** On app load, try to restore a session using the httpOnly refresh cookie. */
  bootstrap: async () => {
    set({ status: 'loading' });
    try {
      const refresh = await api.post('/auth/refresh');
      setAccessToken(refresh.data.data.accessToken);
      const me = await api.get('/auth/me');
      set({ user: me.data.data.user, status: 'authenticated' });
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'unauthenticated' });
    }
  },

  hasRole: (...roles) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return roles.includes(user.role);
  },
}));

// Wire the API client's session-expired callback to the store.
setSessionExpiredHandler(() => {
  setAccessToken(null);
  useAuthStore.setState({ user: null, status: 'unauthenticated' });
});
