import api from './api';

export const chatService = {

    getMessages: async (channel = 'general', limlimit = 5050) => {
    const { data } = await api.get('/chat/messages', {
      params: { channel, limit }
    });
    return data?.messages || [];
  },
  sendMessage: async (content, type = 'text', channel = 'general') => {
    const { data } = await api.post('/chat/messages', { content, type, channel });
    return data;
  },
  deleteMessage: async (messageId) => {
    const { data } = await api.delete('/chat/messages/' + messageId);
    return data;
  },
  markAsRead: async (messageId) => {
    const { data } = await api.post('/chat/messages/' + messageId + '/read');
    return data;
  },
  addReaction: async (messageId, emoji) => {
    const { data } = await api.post('/chat/messages/' + messageId + '/reactions', { emoji });
    return data;
  },
  removeReaction: async (messageId, emoji) => {
    const { data } = await api.delete('/chat/messages/' + messageId + '/reactions/' + emoji);
    return data;
  },

};
