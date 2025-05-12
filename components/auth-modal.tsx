import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { X } from 'lucide-react';

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
  onLogin: (email: string, password: string) => void;
  onRegister: (username: string, email: string, password: string) => void;
}

export function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [formDirection, setFormDirection] = useState<'left' | 'right'>('left');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Используем ref для управления DOM-элементами напрямую
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Ручная валидация полей вместо HTML-валидации
      if (!email.trim() || !password.trim()) {
        // НЕ показываем ошибку валидации - пусть это делает серверная валидация
        return;
      }
      
      // Вызываем onLogin даже если поля пустые - валидация будет на стороне сервера
      onLogin(email, password);
    } else {
      // Ручная валидация полей вместо HTML-валидации
      if (!username.trim() || !email.trim() || !password.trim()) {
        // НЕ показываем ошибку валидации - пусть это делает серверная валидация
        return;
      }
      
      // Вызываем onRegister даже если поля пустые - валидация будет на стороне сервера
      onRegister(username, email, password);
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
            
            {/* Контейнер для ошибок (только для ошибки о согласии с условиями) */}
            {error && (
              <div 
                className="error-container" 
                style={{ 
                  color: 'red', 
                  fontSize: '14px', 
                  marginBottom: '10px'
                }}
              >
                {error}
              </div>
            )}
            
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Псевдоним" 
                name="username" 
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}
            
            <input 
              type="email" 
              placeholder="Эл. почта" 
              name="email" 
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <input 
              type="password" 
              placeholder="Пароль" 
              name="password" 
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <div className="login-with">
              <div className="button-log">
                <svg className="icon" height="56.6934px" id="Layer_1" style={{background: 'new 0 0 56.6934 56.6934'}} version="1.1" viewBox="0 0 56.6934 56.6934" width="56.6934px" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"><path d="M51.981,24.4812c-7.7173-0.0038-15.4346-0.0019-23.1518-0.001c0.001,3.2009-0.0038,6.4018,0.0019,9.6017  c4.4693-0.001,8.9386-0.0019,13.407,0c-0.5179,3.0673-2.3408,5.8723-4.9258,7.5991c-1.625,1.0926-3.492,1.8018-5.4168,2.139  c-1.9372,0.3306-3.9389,0.3729-5.8713-0.0183c-1.9651-0.3921-3.8409-1.2108-5.4773-2.3649  c-2.6166-1.8383-4.6135-4.5279-5.6388-7.5549c-1.0484-3.0788-1.0561-6.5046,0.0048-9.5805  c0.7361-2.1679,1.9613-4.1705,3.5708-5.8002c1.9853-2.0324,4.5664-3.4853,7.3473-4.0811c2.3812-0.5083,4.8921-0.4113,7.2234,0.294  c1.9815,0.6016,3.8082,1.6874,5.3044,3.1163c1.5125-1.5039,3.0173-3.0164,4.527-4.5231c0.7918-0.811,1.624-1.5865,2.3908-2.4196  c-2.2928-2.1218-4.9805-3.8274-7.9172-4.9056C32.0723,4.0363,26.1097,3.995,20.7871,5.8372  C14.7889,7.8907,9.6815,12.3763,6.8497,18.0459c-0.9859,1.9536-1.7057,4.0388-2.1381,6.1836  C3.6238,29.5732,4.382,35.2707,6.8468,40.1378c1.6019,3.1768,3.8985,6.001,6.6843,8.215c2.6282,2.0958,5.6916,3.6439,8.9396,4.5078  c4.0984,1.0993,8.461,1.0743,12.5864,0.1355c3.7284-0.8581,7.256-2.6397,10.0725-5.24c2.977-2.7358,5.1006-6.3403,6.2249-10.2138  C52.5807,33.3171,52.7498,28.8064,51.981,24.4812z" /></svg>
              </div>
              <div className="button-log">
                <svg xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="56.693px" viewBox="0 0 56.693 56.693" version="1.1" id="Layer_1" height="56.693px" className="icon"><path d="M40.43,21.739h-7.645v-5.014c0-1.883,1.248-2.322,2.127-2.322c0.877,0,5.395,0,5.395,0V6.125l-7.43-0.029  c-8.248,0-10.125,6.174-10.125,10.125v5.518h-4.77v8.53h4.77c0,10.947,0,24.137,0,24.137h10.033c0,0,0-13.32,0-24.137h6.77  L40.43,21.739z" /></svg>
              </div>
            </div>
            
            <button type="submit" className="button-confirm">
              {isLogin ? 'Войти →' : 'Регистрация →'}
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