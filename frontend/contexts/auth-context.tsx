import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import authService, { AuthResponse } from '../services/auth';

// Тип пользователя
export interface User {
  id: number;
  username: string;
  email: string;
  experience: number;
  token: string;
  registrationDate: string;
}

// Тип контекста авторизации
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

// Создаем контекст с начальным значением
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  register: async () => {},
  logout: () => {},
  refreshUserData: async () => {},
});

// Хук для использования контекста авторизации
export const useAuth = () => useContext(AuthContext);

// Провайдер контекста авторизации
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const updateUserData = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        const token = authService.getToken();
        if (userData && token) {
          setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            experience: userData.experience,
            token: token,
            registrationDate: new Date().toISOString()
          });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      console.error('Error updating user data:', error);
      // Если получаем ошибку авторизации, выходим из системы
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  // Проверяем наличие пользователя в localStorage при загрузке
  useEffect(() => {
    // Сначала проверяем токен
    const isAuth = authService.isAuthenticated();
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      updateUserData();
    }
  }, []);

  // Периодически обновляем данные пользователя
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(updateUserData, 30000); // Обновляем каждые 30 секунд
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Функция для авторизации
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('https://sqlhunt.com:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        // Сохраняем токены в localStorage
        localStorage.setItem('token', userData.token.access);
        localStorage.setItem('refreshToken', userData.token.refresh);
        localStorage.setItem('user', JSON.stringify(userData.user));

        setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          experience: userData.experience,
          token: userData.token.access,
          registrationDate: new Date().toISOString()
        });
        setIsAuthenticated(true);
        window.location.href = '/';
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Функция для регистрации
  const register = async (username: string, email: string, password: string) => {
    const response = await authService.register({ 
      username, 
      email, 
      password, 
      password2: password 
    });
    setIsAuthenticated(true);
    await updateUserData();
    window.location.href = '/';
  };

  // Функция для выхода
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUserData: updateUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
} 
