// -.-.-.-
import api from './api';

// -.-.-.-
export const financeService = {
  // Get balance
  getBalance: async () => {
    const { data } = await api.get('/finance/balance');
    return data;
  },
  
  // Get transactions
  getTransactions: async (filters) => {
    const { data } = await api.get('/finance/transactions', { params: filters });
    return data;
  },
  
  // Get suggestions
  getSuggestions: async (status) => {
    const { data } = await api.get('/finance/suggestions', { params: { status } });
    return data;
  },
  
  // Create suggestion
  createSuggestion: async (suggestionData) => {
    const { data } = await api.post('/finance/suggestions', suggestionData);
    return data;
  },
  
  // Vote suggestion
  voteSuggestion: async (suggestionId) => {
    const { data } = await api.post(`/finance/suggestions/${suggestionId}/vote`);
    return data;
  },
  
  // Unvote suggestion
  unvoteSuggestion: async (suggestionId) => {
    const { data } = await api.delete(`/finance/suggestions/${suggestionId}/vote`);
    return data;
  }
};
