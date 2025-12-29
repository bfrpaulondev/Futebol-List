// -.-.-.-
import api from './api';

// -.-.-.-
export const userService = {
  // Get profile
  getProfile: async () => {
    const { data } = await api.get('/users/profile');
    return data;
  },
  
  // Update profile
  updateProfile: async (userData) => {
    const { data } = await api.put('/users/profile', userData);
    return data;
  },
  
  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  
  // Get all users (admin)
  getAllUsers: async () => {
    const { data } = await api.get('/users');
    return data;
  }
};
