import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Тип пользователя
interface User {
  username: string;
  email: string;
  registrationDate: string;
}

// Тип контекста авторизации
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
  
  // Проверяем наличие пользователя в localStorage при загрузке
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Ошибка при парсинге пользователя из localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Функция для авторизации
  const login = async (email: string, password: string) => {
    // В реальном приложении здесь был бы запрос к API
    // Для демонстрации создаем пользователя с временными данными
    const mockUser: User = {
      username: email.split('@')[0],
      email,
      registrationDate: new Date().toISOString(),
    };
    
    // Сохраняем пользователя в состоянии и localStorage
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  // Функция для регистрации
  const register = async (username: string, email: string, password: string) => {
    // В реальном приложении здесь был бы запрос к API
    // Для демонстрации создаем пользователя с переданными данными
    const newUser: User = {
      username,
      email,
      registrationDate: new Date().toISOString(),
    };
    
    // Сохраняем пользователя в состоянии и localStorage
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Функция для выхода
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Значение контекста
  const value = {
    user,
    isAuthenticated: !!user,
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