// -.-.-.-
import api from './api';

// -.-.-.-
export const gameService = {
  // Get next game
  getNextGame: async () => {
    const { data } = await api.get('/games/next');
    return data.game || null;
  },
  
  // Confirm presence
  confirmPresence: async (gameId) => {
    const { data } = await api.post(`/games/${gameId}/confirm`);
    return data.game || data;
  },
  
  // Cancel presence
  cancelPresence: async (gameId) => {
    const { data } = await api.post(`/games/${gameId}/cancel`);
    return data.game || data;
  },
  
  // Get game details
  getGameById: async (gameId) => {
    const { data } = await api.get(`/games/${gameId}`);
    return data.game || data;
  },
  
  // Draw teams
  drawTeams: async (gameId) => {
    const { data } = await api.post(`/games/${gameId}/draw`);
    return data.game || data;
  },
  
  // Update result (admin)
  updateResult: async (gameId, result) => {
    const { data } = await api.put(`/games/${gameId}/result`, result);
    return data.game || data;
  }
};
