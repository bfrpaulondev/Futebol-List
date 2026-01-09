// -.-.-.-
import api from './api';

// -.-.-.-
export const chatService = {
  // Get messages
  getMessages: async (channel = 'general', limit = 50) => {
    const { data } = await api.get('/chat/messages', {
      params: { channel, limit }
    });
    return data?.messages || [];
  },


  // Send message
  sendMessage: async (content, type = 'text', channel = 'general') => {
    const { data } = await api.post('/chat/messages', {
      content,
      type,
      channel
    });
    return data;
  },
  
  // Delete message
  deleteMessage: async (messageId) => {
    const { data } = await api.delete(`/chat/messages/${messageId}`);
    return data;
  },
  
  // Mark as read
  markAsRead: async (messageId) => {
    const { data } = await api.post(`/chat/messages/${messageId}/read`);
    return data;},
  addReaction: async (messageId, emoji) => {
    const { data } = await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
    return data;
  },
  removeReaction: async (messageId, emoji) => {
    const { data } = await api.delete(`/chat/messages/${messageId}/reactions/${emoji}`);
    return data;
  }
  }
};
