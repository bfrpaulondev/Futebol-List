// -.-.-.-
import { create } from 'zustand';
import { authService } from '@services/authService';

// -.-.-.-
export const useAuthStore = create((set) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  
  setUser: (user) => set({ user, isAuthenticated: true }),
  
  clearUser: () => set({ user: null, isAuthenticated: false }),
  
  updateUser: (updates) => set((state) => ({
    user: { ...state.user, ...updates }
  }))
}));
