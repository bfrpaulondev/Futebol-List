// -.-.-.-
import api from './api';

// -.-.-.-
export const gameService = {
  // Get next game
  getNextGame: async () => {
    const { data } = await api.get('/games/next');
    return data;
  },
  
  // Confirm presence
  confirmPresence: async (gameId) => {
    const { data } = await api.post(`/games/${gameId}/confirm`);
    return data;
  },
  
  // Cancel presence
  cancelPresence: async (gameId) => {
    const { data } = await api.post(`/games/${gameId}/cancel`);
    return data;
  },
  
  // Get game details
  getGameById: async (gameId) => {
    const { data } = await api.get(`/games/${gameId}`);
    return data;
  },
  
  // Draw teams
  drawTeams: async (gameId) => {
    const { data } = await api.post(`/games/${gameId}/draw`);
    return data;
  },
  
  // Update result (admin)
  updateResult: async (gameId, result) => {
    const { data } = await api.put(`/games/${gameId}/result`, result);
    return data;
  }
};
