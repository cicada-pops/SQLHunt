import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService from '../services/auth';

// Тип пользователя
interface User {
  username: string;
  email: string;
  registrationDate: string;
  experience: number;
}

// Тип контекста авторизации
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Создаем контекст с начальным значением
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
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
        setUser({
          username: userData.username,
          email: userData.email,
          registrationDate: new Date().toISOString(),
          experience: userData.experience
        });
        setIsAuthenticated(true);
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
  const login = async (username: string, password: string) => {
    const response = await authService.login({ username, password });
    setIsAuthenticated(true);
    await updateUserData();
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
  };

  // Функция для выхода
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Значение контекста
  const value = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 