import { useState, memo, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { AuthModal } from './auth-modal';
import { ProfilePopup } from './profile-popup';

interface HeaderProps {
  onSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const Header = memo(function Header({ onSmoothScroll }: HeaderProps) {
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  
  const titles = [
    "УБИЙСТВО НА РАССВЕТЕ",
    "ЗАГАДКА ЗАКРЫТОГО КАБИНЕТА",
    "ПРОПАВШИЙ КАРТЕЛЬ"
  ];
  
  // Функция для определения стиля на основе полного заголовка, а не только напечатанной части
  const getTitleStyle = (currentTitleIndex: number) => {
    const fullTitle = titles[currentTitleIndex];
    return {
      fontFamily: "var(--font-heathergreen)",
      fontSize: fullTitle.length > 25 ? "clamp(1.4rem, 13vw, 13rem)" : "clamp(2rem, 18vw, 18rem)",
      width: "100%",
      letterSpacing: fullTitle.length > 25 ? "2px" : "5px",
      textShadow: "none",
      whiteSpace: "nowrap",
      overflow: "hidden",
      maxWidth: "110vw"
    };
  };
  
  // Инициализируем typedText первым символом первого заголовка
  const [typedText, setTypedText] = useState(titles[0].charAt(0));
  const typingRef = useRef<number | null>(null);
  
  // Ref для отслеживания состояния печати
  const stateRef = useRef({
    titleIndex: 0,
    charIndex: 1, // Начинаем с 1, так как первый символ уже отображается
    isDeleting: false,
    pauseCount: 0
  });

  useEffect(() => {
    // Функция эффекта печатной машинки
    const typeEffect = () => {
      const state = stateRef.current;
      const currentTitle = titles[state.titleIndex];
      
      // Если мы удаляем текст
      if (state.isDeleting) {
        const newText = currentTitle.substring(0, state.charIndex - 1);
        setTypedText(newText);
        state.charIndex--;
        
        // Когда текст полностью удален, переключаемся на печать
        if (state.charIndex <= 0) {
          state.isDeleting = false;
          state.titleIndex = (state.titleIndex + 1) % titles.length;
          state.charIndex = 0;
        }
      } 
      // Если мы в паузе (после завершения печати текста)
      else if (state.charIndex >= currentTitle.length) {
        state.pauseCount++;
        
        // После паузы начинаем удаление
        if (state.pauseCount >= 20) {
          state.isDeleting = true;
          state.pauseCount = 0;
        }
      }
      // Если мы печатаем текст
      else {
        const newText = currentTitle.substring(0, state.charIndex + 1);
        setTypedText(newText);
        state.charIndex++;
      }
      
      // Определяем скорость печати
      let typeSpeed = 100;
      if (state.isDeleting) typeSpeed = 50; // Быстрее удаляем
      
      // Запускаем следующую итерацию
      typingRef.current = window.setTimeout(typeEffect, typeSpeed);
    };
    
    // Запускаем эффект при монтировании компонента
    typingRef.current = window.setTimeout(typeEffect, 100);
    
    // Очищаем таймер при размонтировании
    return () => {
      if (typingRef.current) {
        window.clearTimeout(typingRef.current);
      }
    };
  }, []); // Пустой массив зависимостей означает, что эффект запустится только при монтировании

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleProfileClick = () => {
    setIsProfilePopupOpen(prev => !prev);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error('Ошибка входа:', error);
    }
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    try {
      await register(username, email, password);
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error('Ошибка регистрации:', error);
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfilePopupOpen(false);
  };

  return (
    <header className="w-full z-10">
      <div className="w-full">
        <div className="text-center mb-1 flex items-center justify-center">
          <div className="border-t-2 border-b-2 border-black w-full"></div>
          <p className="text-2xl font-bold font-serif mx-8 whitespace-nowrap">Detective mysteries</p>
          <div className="border-t-2 border-b-2 border-black w-full"></div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="w-1/4 text-center">
            <a 
              href="mailto:sqlhunt@gmail.com"
              className="text-3xl italic font-serif hover:opacity-80 cursor-pointer"
            >
              CONTACT
            </a>
          </div>
          <div className="text-8xl flex items-center justify-center" style={{ fontFamily: "var(--font-chomsky)", lineHeight: "0", marginBottom: "-40px" }}>*</div>
          <div className="text-center w-1/4">
            <h1 className="text-7xl font-standart" style={{ fontFamily: "var(--font-chomsky)" }}>
              SQL Hunt
            </h1>
          </div>
          <div className="text-8xl flex items-center justify-center" style={{ fontFamily: "var(--font-chomsky)", lineHeight: "0", marginBottom: "-40px" }}>*</div>
          <div className="w-1/4 flex justify-center relative">
            {isAuthenticated ? (
              <>
                <span 
                  className="text-3xl italic font-serif cursor-pointer hover:opacity-80"
                  onClick={handleProfileClick}
                >
                  PROFILE
                </span>
                {isProfilePopupOpen && (
                  <ProfilePopup 
                    username={user?.username || ''}
                    email={user?.email || ''}
                    experience={user?.experience || 0}
                    isOpen={isProfilePopupOpen}
                    onClose={() => setIsProfilePopupOpen(false)}
                    onLogout={handleLogout}
                  />
                )}
              </>
            ) : (
              <span 
                className="text-3xl italic font-serif cursor-pointer hover:opacity-80"
                onClick={handleLoginClick}
              >
                PROFILE
              </span>
            )}
          </div>
        </div>

        <div className="border-t-5 border-b-4 border-black mb-4"></div>
        <div className="border-t-2 border-b-2 border-black mb-5"></div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xl italic font-serif">VOL. 13. NO. 7</p>
          </div>
          <div>
            <a href="#second-page" onClick={onSmoothScroll}>
              <button className="bg-black text-white px-8 py-2 text-2xl">START!</button>
            </a>
          </div>
          <div>
            <p className="text-xl italic font-serif">
              {new Date().toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }).toUpperCase()}
            </p>
          </div>
        </div>
        
        {/* Дополнительная полоса под кнопкой START */}
        <div className="border-t-5 border-black mb-4"></div>

        {/* Заголовок с эффектом печатной машинки */}
        <div className="text-center relative" style={{ height: "250px", marginBottom: "2rem", overflow: 'visible' }}>
          <h2 className="font-normal tracking-tighter leading-none responsive-title absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
              style={{
                ...getTitleStyle(stateRef.current.titleIndex),
                width: "100%",
              }}>
            <span id="typewriter-title">{typedText}</span>
            <span className="typing-cursor">|</span>
          </h2>
        </div>

        <div className="border-t-4 border-b-4 border-black mb-4"></div>
        <div className="border-t-2 border-b-2 border-black mb-8"></div>
      </div>

      {/* Модальное окно авторизации */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}); 