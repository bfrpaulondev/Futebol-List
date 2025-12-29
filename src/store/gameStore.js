// -.-.-.-
import { create } from 'zustand';

// -.-.-.-
export const useGameStore = create((set) => ({
  currentGame: null,
  games: [],
  loading: false,
  
  setCurrentGame: (game) => set({ currentGame: game }),
  
  setGames: (games) => set({ games }),
  
  setLoading: (loading) => set({ loading }),
  
  updateGame: (gameId, updates) => set((state) => ({
    games: state.games.map(g => g._id === gameId ? { ...g, ...updates } : g),
    currentGame: state.currentGame?._id === gameId 
      ? { ...state.currentGame, ...updates }
      : state.currentGame
  }))
}));
