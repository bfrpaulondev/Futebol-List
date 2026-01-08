// -.-.-.-
import axios from 'axios';
import toast from 'react-hot-toast';

// -.-.-.-
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://futebol-api-6d10.onrender.com/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// -.-.-.-
// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// -.-.-.-
// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Erro desconhecido';
    
    // Handle 401 - token expired
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Sessão expirada. Faça login novamente.');
      return Promise.reject(error);
    }
    
    // Handle 403 - forbidden
    if (error.response?.status === 403) {
      toast.error('Acesso negado.');
      return Promise.reject(error);
    }
    
    // Handle 404 - not found
    if (error.response?.status === 404) {
      toast.error('Recurso não encontrado.');
      return Promise.reject(error);
    }
    
    // Generic error
    toast.error(message);
    
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message
    });
    
    return Promise.reject(error);
  }
);

export default api;
