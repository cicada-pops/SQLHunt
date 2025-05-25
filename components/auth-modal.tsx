import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { X } from 'lucide-react';
import authService from '../services/auth';

// Глобальные стили для шрифтов
const FontStyles = createGlobalStyle`
  @font-face {
    font-family: 'TT-Rationalist-Bold';
    src: url('/fonts/TT-Rationalist-Bold.ttf') format('truetype');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'TT-Rationalist-DemiBold';
    src: url('/fonts/TT-Rationalist-DemiBold.ttf') format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'TT-Rationalist-Light';
    src: url('/fonts/TT-Rationalist-Light.ttf') format('truetype');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  :root {
    --font-rationalist-bold: 'TT-Rationalist-Bold', sans-serif;
    --font-rationalist-demibold: 'TT-Rationalist-DemiBold', sans-serif;
    --font-rationalist-light: 'TT-Rationalist-Light', sans-serif;
  }
  
  /* Добавляем прямую демонстрацию шрифтов */
  body .auth-modal-test {
    font-family: 'TT-Rationalist-Bold', sans-serif !important;
  }
`;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;  // New prop for handling successful auth
}

const ErrorMessage = styled.div`
  color: #FF0000;
  font-family: var(--font-rationalist-light);
  font-weight: 600;
  font-size: 15px;
  margin: 0;
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 15px;
  padding: 2px 0;
`;

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formDirection, setFormDirection] = useState<'left' | 'right'>('left');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const formContentRef = useRef<HTMLFormElement>(null);

  // Обработка открытия/закрытия модального окна
  useEffect(() => {
    const modal = modalRef.current;
    const form = formRef.current;
    
    if (!modal || !form) return;

    // Функция для блокировки скролла
    const setScrollLock = (locked: boolean) => {
      document.body.style.overflow = locked ? 'hidden' : 'auto';
    };

    if (isOpen) {
      // Инициализация стилей перед анимацией
      modal.style.opacity = '0';
      modal.style.display = 'flex';
      form.style.opacity = '0';
      form.style.transform = 'scale(0.8)';
      
      // Запускаем анимацию с задержкой для предотвращения моргания
      // Задержка 5мс позволяет браузеру применить начальные стили
      const timer = setTimeout(() => {
        modal.style.transition = 'opacity 300ms ease';
        modal.style.opacity = '1';
        
        // Анимация формы начинается после начала анимации фона
        setTimeout(() => {
          form.style.transition = 'all 300ms ease';
          form.style.opacity = '1';
          form.style.transform = 'scale(1)';
        }, 100);
      }, 5);
      
      setScrollLock(true);
      return () => clearTimeout(timer);
    } else {
      // Если модальное окно закрывается или не открыто
      if (modal.style.display === 'flex') {
        // Анимация закрытия
        form.style.transition = 'all 250ms ease';
        form.style.opacity = '0';
        form.style.transform = 'scale(0.8)';
        
        modal.style.transition = 'opacity 250ms ease';
        modal.style.opacity = '0';
        
        // Убираем модалку из DOM после анимации
        const timer = setTimeout(() => {
          modal.style.display = 'none';
          // Сбрасываем стили для следующего открытия
          modal.style.transition = '';
          form.style.transition = '';
        }, 300);
        
        setScrollLock(false);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen]);
  
  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      // Сбрасываем с задержкой, чтобы не влиять на анимацию
      const timer = setTimeout(() => {
        setUsername('');
        setEmail('');
        setPassword('');
        setPassword2('');
        setError('');
        setIsLogin(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Обработка закрытия модалки
  const handleClose = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Предотвращаем стандартное поведение и валидацию
    onClose();
  };
  
  // Обработка клика по оверлею для закрытия модалки
  const handleOverlayClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Проверяем, что клик был не по форме, а по оверлею
    if (e.target === modalRef.current) {
      e.preventDefault(); // Предотвращаем стандартное поведение
      onClose();
    }
  };
  
  // Анимация переключения между формами входа и регистрации
  const switchForm = (toLogin: boolean, e: React.MouseEvent) => {
    e.preventDefault(); // Предотвращаем стандартное поведение формы
    
    if (isAnimating) return; // Предотвращаем повторные клики во время анимации
    
    const formContent = formContentRef.current;
    if (!formContent) return;
    
    setIsAnimating(true);
    
    // Определяем направление анимации
    setFormDirection(toLogin ? 'left' : 'right');
    
    // Анимация исчезновения
    formContent.style.transition = 'all 200ms ease';
    formContent.style.opacity = '0';
    formContent.style.transform = `translateX(${toLogin ? '-' : ''}20px)`;
    
    // После исчезновения меняем состояние и анимируем появление с другой стороны
    setTimeout(() => {
      setIsLogin(toLogin);
      
      // Подготовка к анимации появления
      formContent.style.transform = `translateX(${toLogin ? '' : '-'}20px)`;
      
      // Запускаем анимацию появления с небольшой задержкой
      setTimeout(() => {
        formContent.style.opacity = '1';
        formContent.style.transform = 'translateX(0)';
        
        // Снимаем блокировку анимации после её завершения
        setTimeout(() => {
          setIsAnimating(false);
        }, 200);
      }, 20);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await authService.login({ username, password });
      } else {
        await authService.register({ username, email, password, password2 });
      }
      onClose();
      if (onAuthSuccess) {
        onAuthSuccess();
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <FontStyles />
      <style jsx global>{`
        @font-face {
          font-family: 'TT-Rationalist-Bold';
          src: url('/fonts/TT-Rationalist-Bold.ttf') format('truetype');
          font-style: normal;
          font-weight: bold;
        }
      `}</style>
      <ModalContainer 
        ref={modalRef} 
        style={{ display: 'none' }}
        onClick={handleOverlayClick}
      >
        <FormWrapper ref={formRef}>
          <form className="form" onSubmit={handleSubmit} ref={formContentRef} noValidate>
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-[var(--font-color)] z-10"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              type="button"
            >
              <X size={20} />
            </button>
            
            <div 
              className="title auth-modal-test" 
              style={{ fontFamily: "TT-Rationalist-Bold, sans-serif" }}
            >
              {isLogin ? 'Детектив,': 'Новобранец?'}
              <br />
              <span style={{ fontFamily: "TT-Rationalist-DemiBold, sans-serif" }}>
                {isLogin ? 'с возвращением!' : 'Добро пожаловать!'}
              </span>
            </div>
            
            {error && (
              <ErrorMessage>
                {error}
              </ErrorMessage>
            )}
            
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Псевдоним" 
                name="username" 
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}
            
            {!isLogin && (
            <input 
              type="email" 
              placeholder="Эл. почта" 
              name="email" 
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}

            {isLogin && (
              <input 
                type="text" 
                placeholder="Псевдоним или эл. почта" 
                name="username" 
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}
            
            <input 
              type="password" 
              placeholder="Пароль" 
              name="password" 
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {!isLogin && (
              <input 
                type="password" 
                placeholder="Повторите пароль" 
                name="password2" 
                className="input"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
              />
            )}
            
            <button 
              type="submit" 
              className="button-confirm"
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Загрузка...' : isLogin ? 'Войти →' : 'Регистрация →'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '0px' }}>
              {isLogin ? (
                <button 
                  type="button" 
                  onClick={(e) => switchForm(false, e)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: isAnimating ? 'default' : 'pointer', 
                    color: 'var(--font-color)', 
                    textDecoration: 'underline',
                    opacity: isAnimating ? 0.7 : 1
                  }}
                  disabled={isAnimating}
                >
                  Ещё не в деле? Регистрация
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={(e) => switchForm(true, e)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: isAnimating ? 'default' : 'pointer', 
                    color: 'var(--font-color)', 
                    textDecoration: 'underline',
                    opacity: isAnimating ? 0.7 : 1
                  }}
                  disabled={isAnimating}
                >
                  Уже числишься в архиве? Войти
                </button>
              )}
            </div>
          </form>
        </FormWrapper>
      </ModalContainer>
    </>
  );
}

// Базовые стили без анимации
const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.60);
  z-index: 50;
  backdrop-filter: blur(10px);
`;

const FormWrapper = styled.div`
  .form {
    --input-focus: #2d8cf0;
    --font-color: #323232;
    --font-color-sub: #666;
    --bg-color: #E5D9C3;
    --main-color: #323232;
    position: relative;
    width: 300px;
    padding: 20px;
    background: #E5D9C3;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 20px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
    font-family: var(--font-rationalist-light);
  }

  .title {
    color: var(--font-color);
    font-family: var(--font-rationalist-bold);
    font-weight: 900;
    font-size: 20px;
    margin-bottom: 0px;
    line-height: 1.1;
    margin-top: 0px;
  }

  .title span {
    color: var(--font-color-sub);
    font-family: var(--font-rationalist-demibold);
    font-weight: 600;
    font-size: 17px;
  }

  .input {
    width: 100%;
    height: 40px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 15px;
    font-family: var(--font-rationalist-light);
    font-weight: 600;
    color: var(--font-color);
    padding: 5px 10px;
    outline: none;
  }

  .input::placeholder {
    color: var(--font-color-sub);
    opacity: 0.8;
    font-family: var(--font-rationalist-light);
  }

  .input:focus {
    border: 2px solid var(--input-focus);
  }

  .login-with {
    display: flex;
    gap: 20px;
  }

  .button-log {
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 100%;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    color: var(--font-color);
    font-size: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .icon {
    width: 24px;
    height: 24px;
    fill: var(--main-color);
  }

  .button-log:active, .button-confirm:active {
    box-shadow: 0px 0px var(--main-color);
    transform: translate(3px, 3px);
  }

  .button-confirm {
    margin: 0 auto;
    width: 180px;
    height: 40px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 17px;
    font-family: var(--font-rationalist-demibold);
    font-weight: 600;
    color: var(--font-color);
    cursor: pointer;
  }
`; 