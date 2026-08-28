import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const storedUser = localStorage.getItem('user');
  let parsedUser: User | null = null;
  try {
    parsedUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    parsedUser = null;
  }
  const user = ref<User | null>(parsedUser);

  const setAuth = (newToken: string, newUser: User) => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const loginUser = async (email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = response.data;
    setAuth(newToken, newUser);
    return newUser;
  };

  const fetchProfile = async (): Promise<User | null> => {
    if (!token.value) return null;
    try {
      const response = await api.get('/auth/me');
      user.value = response.data.user;
      return response.data.user;
    } catch (error) {
      logout();
      return null;
    }
  };

  return {
    token,
    user,
    setAuth,
    logout,
    loginUser,
    fetchProfile,
  };
});
