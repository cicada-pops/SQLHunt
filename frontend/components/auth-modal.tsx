import { X } from 'lucide-react';
import { MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
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
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await authService.resetPassword({ email });
      setSuccessMessage('Инструкции по сбросу пароля отправлены на вашу почту');
      // Очищаем поле email
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToResetPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAnimating) return;

    const formContent = formContentRef.current;
    if (!formContent) return;

    setIsAnimating(true);
    formContent.style.transition = 'all 200ms ease';
    formContent.style.opacity = '0';
    formContent.style.transform = 'translateX(-20px)';

    setTimeout(() => {
      setIsResetPassword(true);
      setError('');
      setSuccessMessage('');

      formContent.style.transform = 'translateX(20px)';
      setTimeout(() => {
        formContent.style.opacity = '1';
        formContent.style.transform = 'translateX(0)';
        setTimeout(() => {
          setIsAnimating(false);
        }, 200);
      }, 20);
    }, 200);
  };

  const switchToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAnimating) return;

    const formContent = formContentRef.current;
    if (!formContent) return;

    setIsAnimating(true);
    formContent.style.transition = 'all 200ms ease';
    formContent.style.opacity = '0';
    formContent.style.transform = 'translateX(20px)';

    setTimeout(() => {
      setIsResetPassword(false);
      setIsLogin(true);
      setError('');
      setSuccessMessage('');

      formContent.style.transform = 'translateX(-20px)';
      setTimeout(() => {
        formContent.style.opacity = '1';
        formContent.style.transform = 'translateX(0)';
        setTimeout(() => {
          setIsAnimating(false);
        }, 200);
      }, 20);
    }, 200);
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
          <form 
            className="form" 
            onSubmit={isResetPassword ? handleResetPassword : handleSubmit} 
            ref={formContentRef} 
            noValidate
          >
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
              {isResetPassword ? 'Забыли пароль?' : isLogin ? 'Детектив,' : 'Новобранец?'}
              <br />
              <span style={{ fontFamily: "TT-Rationalist-DemiBold, sans-serif" }}>
                {isResetPassword 
                  ? 'Мы поможем восстановить' 
                  : isLogin 
                    ? 'с возвращением!' 
                    : 'Добро пожаловать!'}
              </span>
            </div>
            
            {error && (
              <ErrorMessage>
                {error}
              </ErrorMessage>
            )}

            {successMessage && (
              <div className="success-message" style={{ 
                color: '#4CAF50', 
                textAlign: 'center', 
                marginBottom: '10px',
                fontFamily: "var(--font-rationalist-light)"
              }}>
                {successMessage}
              </div>
            )}
            
            {isResetPassword ? (
              // Форма сброса пароля
              <input 
                type="email" 
                placeholder="Эл. почта" 
                name="email" 
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            ) : (
              // Формы входа и регистрации
              <>
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
              </>
            )}
            
            <div className="w-full flex items-center justify-center gap-2">
              <button 
                type="submit" 
                className="button-confirm"
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading 
                  ? 'Загрузка...' 
                  : isResetPassword 
                    ? 'Отправить →' 
                    : isLogin 
                      ? 'Войти →' 
                      : 'Регистрация →'}
              </button>
              
              {!isResetPassword && (
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    className="button-log"
                    onClick={() => console.log('Google login')}
                    title="Войти через Google"
                  >
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#363535"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#363535"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#363535"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#363535"/>
                    </svg>
                  </button>
                  <button 
                    type="button"
                    className="button-log"
                    onClick={() => console.log('GitHub login')}
                    title="Войти через GitHub"
                  >
                    <svg className="icon" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="#363535"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '0px' }}>
              {isResetPassword ? (
                <button 
                  type="button" 
                  onClick={switchToLogin}
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
                  Вернуться к входу
                </button>
              ) : isLogin ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', alignItems: 'flex-start' }}>
                  <button 
                    type="button" 
                    onClick={(e) => switchForm(false, e)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: isAnimating ? 'default' : 'pointer', 
                      color: 'var(--font-color)', 
                      textDecoration: 'underline',
                      opacity: isAnimating ? 0.7 : 1,
                      padding: 0
                    }}
                    disabled={isAnimating}
                  >
                    Ещё не в деле? Регистрация
                  </button>
                  <button 
                    type="button" 
                    onClick={switchToResetPassword}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: isAnimating ? 'default' : 'pointer', 
                      color: 'var(--font-color)', 
                      textDecoration: 'underline',
                      opacity: isAnimating ? 0.7 : 1,
                      padding: 0
                    }}
                    disabled={isAnimating}
                  >
                    Забыли пароль?
                  </button>
                </div>
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
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }

  .icon {
    width: 24px;
    height: 24px;
    fill: var(--main-color);
  }

  .button-log:active {
    box-shadow: 0px 0px var(--main-color);
    transform: translate(3px, 3px);
  }

  .button-confirm {
    margin: 0;
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
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }

  .button-confirm:active {
    box-shadow: 0px 0px var(--main-color);
    transform: translate(3px, 3px);
  }
`; 
