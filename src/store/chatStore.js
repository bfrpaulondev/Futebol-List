// -.-.-.-
import { create } from 'zustand';

// -.-.-.-
export const useChatStore = create((set) => ({
  messages: [],
  onlineUsers: [],
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(m => m._id !== messageId)
  })),
  
  setOnlineUsers: (users) => set({ onlineUsers: users })
}));
