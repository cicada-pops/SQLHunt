'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import authService from '@/services/auth';
import styles from './styles.module.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!uid || !token) {
      setError('Недействительный uid');
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== password2) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }

    if (!uid || !token) {
      setError('Недействительная ссылка');
      return;
    }

    setIsLoading(true);

    try {
      await authService.confirmResetPassword({
        uid,
        token,
        password
      });
      
      setSuccess('Пароль успешно изменен');
      
      // Перенаправляем на страницу входа через 2 секунды
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-[var(--font-color)] z-10"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            type="button"
          >
            <X size={20} />
          </button>

          <div className={styles.title + " auth-modal-test"}>
            Новый пароль
            <br />
            <span className={styles.subtitle}>
              для вашего аккаунта
            </span>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <input
            type="password"
            placeholder="Новый пароль"
            name="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <input
            type="password"
            placeholder="Повторите пароль"
            name="password2"
            className={styles.input}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            autoComplete="new-password"
          />

          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Загрузка...' : 'Сохранить →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0px' }}>
            <button 
              type="button" 
              onClick={handleClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--font-color)', 
                textDecoration: 'underline'
              }}
            >
              Вернуться к входу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 