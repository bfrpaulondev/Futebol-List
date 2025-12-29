// -.-.-.-
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@services/authService';
import toast from 'react-hot-toast';

// -.-.-.-
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);
  
  // -.-.-.-
  const login = async (email, password) => {
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      toast.success(`Bem-vindo, ${userData.name}!`);
      navigate('/');
    } catch (error) {
      console.error('[useAuth] Login failed:', error);
      throw error;
    }
  };
  
  // -.-.-.-
  const register = async (userData) => {
    try {
      const newUser = await authService.register(userData);
      setUser(newUser);
      toast.success('Conta criada com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('[useAuth] Register failed:', error);
      throw error;
    }
  };
  
  // -.-.-.-
  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Sessão encerrada.');
    navigate('/login');
  };
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout
  };
};
