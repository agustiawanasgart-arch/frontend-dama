import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

const clearAuthStorage = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const getInitialUser = () => {
  const stored = localStorage.getItem('user');
  const token = localStorage.getItem('accessToken');

  if (!stored || !token) return null;

  try {
    return JSON.parse(stored);
  } catch {
    clearAuthStorage();
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [loading] = useState(false);

  const persistSession = (payload) => {
    const accessToken = payload.accessToken ?? payload.access_token;
    const refreshToken = payload.refreshToken ?? payload.refresh_token;
    const normalizedUser = {
      ...payload.user,
      nama: payload.user?.nama ?? payload.user?.name,
      name: payload.user?.name ?? payload.user?.nama,
    };

    if (!accessToken || !refreshToken || !payload.user) {
      throw new Error('Invalid login response');
    }

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    return persistSession(data.data);
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    return persistSession(data.data);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  const isRole = useCallback((...roles) => {
    return user && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
