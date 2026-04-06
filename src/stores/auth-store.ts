import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  congregation?: string | null;
  playerType: string;
  position: string;
  avatar: string | null;
  role: string;
  skillsJson: string;
  overallRating: number;
  gamesPlayed: number;
  mvpCount: number;
  notificationsEnabled: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null, isLoading: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({ user: data.user, isLoading: false });
          return;
        }
      }
      set({ user: null, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
