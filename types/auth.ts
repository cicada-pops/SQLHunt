// Интерфейс пользователя
export interface User {
  username: string;
  email: string;
  registrationDate: string;
  experience: number;
}

// Параметры аутентификации
export interface AuthCredentials {
  email: string;
  password: string;
}

// Параметры регистрации
export interface RegisterData extends AuthCredentials {
  username: string;
} 