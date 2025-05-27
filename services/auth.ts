import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://sqlhunt.com:8000';
const API_URL = `${BASE_URL}/account/api`;

// Настраиваем axios для работы с CSRF
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

// Функция для получения CSRF токена
async function getCSRFToken() {
  try {
    // Делаем GET запрос к Django для получения CSRF токена
    const response = await axios.get(`${BASE_URL}/account/api/csrf/`);
    console.log('CSRF token response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    experience: number;
  };
  token: {
    access: string;
    refresh: string;
  };
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
}

const errorMessages: { [key: string]: string } = {
  // Ошибки аутентификации
  'Invalid credentials': 'Неверный логин или пароль',
  
  // Ошибки регистрации
  'User with this username already exists': 'Детектив с таким именем уже существует',
  'User with this email already exists': 'Детектив с такой почтой уже существует',
  'Passwords do not match': 'Пароли не совпадают',
  
  // Ошибки валидации email
  'Enter a valid email address': 'Введите корректный email',
  'Enter a valid email address.': 'Введите корректный email',
  'email': 'Введите корректный email',
  
  // Ошибки пустых полей
  'This field may not be blank': 'Это поле обязательно для заполнения',
  'This field may not be blank.': 'Это поле обязательно для заполнения',
  'This field is required': 'Это поле обязательно для заполнения',
  'This field may not be blank., Enter a valid email address.': 'Заполните все поля',
  
  // Ошибки пароля
  'Password is too short': 'Пароль слишком короткий',
  'Password must be at least 8 characters': 'Пароль должен быть не менее 8 символов',
  
  // Системные ошибки
  'CSRF verification failed': 'Ошибка верификации CSRF',
  'Request aborted': 'Запрос прерван',
  'No response from server': 'Нет ответа от сервера',
  'Network Error': 'Ошибка сети. Проверьте подключение',
};

// Функция для обработки составных ошибок
const translateError = (error: string): string => {
  // Если ошибка содержит несколько сообщений, разделенных запятой
  if (error.includes(',')) {
    const errors = error.split(',').map(e => e.trim());
    // Пытаемся найти перевод для полной строки
    if (errorMessages[error]) { 
      return errorMessages[error];
    }
    // Если не нашли, переводим каждую ошибку отдельно и объединяем
    return errors
      .map(e => errorMessages[e] || e)
      .filter((value, index, self) => self.indexOf(value) === index) // Убираем дубликаты
      .join('. ');
  }
  
  return errorMessages[error] || error;
};

const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      await getCSRFToken(); // Получаем CSRF токен перед запросом
      console.log('Sending login request to:', `${API_URL}/login/`);
      const response = await axios.post(`${API_URL}/login/`, data, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Login response:', response.data);
      const authResponse = response.data as AuthResponse;
      if (authResponse.token) {
        localStorage.setItem('token', authResponse.token.access);
        localStorage.setItem('refreshToken', authResponse.token.refresh);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      }
      return authResponse;
    } catch (error: any) {
      // Не логируем ошибки 401 (неверные учетные данные)
      if (error.response && error.response.status !== 401) {
        console.error('Login error:', error);
      }
      
      if (error.response) {
        const errorMessage = error.response.data.detail || 
                           Object.values(error.response.data).flat().join(', ');
        throw new Error(translateError(errorMessage));
      } else if (error.request) {
        throw new Error(translateError('No response from server'));
      } else {
        throw new Error(translateError(error.message));
      }
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      await getCSRFToken();
      const url = `${API_URL}/register/`;
      console.log('Sending register request to:', url);
      console.log('Register data:', data);
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Register response:', response.data);
      const authResponse = response.data as AuthResponse;
      if (authResponse.token) {
        localStorage.setItem('token', authResponse.token.access);
        localStorage.setItem('refreshToken', authResponse.token.refresh);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      }
      return authResponse;
    } catch (error: any) {
      // Не логируем ошибки 400 (ошибки валидации) и 409 (конфликты)
      if (error.response && ![400, 409].includes(error.response.status)) {
        console.error('Register error:', error);
      }
      
      if (error.response) {
        const errorMessage = error.response.data.detail || 
                           Object.values(error.response.data).flat().join(', ');
        throw new Error(translateError(errorMessage));
      } else if (error.request) {
        throw new Error(translateError('No response from server'));
      } else {
        throw new Error(translateError(error.message));
      }
    }
  },

  async logout(): Promise<void> {
    try {
      // Очищаем локальное хранилище
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await axios.post(`${API_URL}/token/refresh/`, {
        refresh: refreshToken
      });
      const newAccessToken = (response.data as { access: string }).access;
      localStorage.setItem('token', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async getCurrentUser(): Promise<AuthResponse['user']> {
    let token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      const response = await axios.get<AuthResponse['user']>(`${API_URL}/user/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error: any) {
      // Если токен истек, пробуем обновить его
      if (error.response?.status === 401) {
        const newToken = await this.refreshToken();
        if (newToken) {
          // Повторяем запрос с новым токеном
          const response = await axios.get<AuthResponse['user']>(`${API_URL}/user/`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
          const userData = response.data;
          localStorage.setItem('user', JSON.stringify(userData));
          return userData;
        }
      }
      console.error('Error fetching user data:', error);
      throw error;
    }
  },
};

export default authService; 