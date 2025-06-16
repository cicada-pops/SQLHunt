"use client"

import Link from "next/link"
import { CaseCard, ExpandedCaseContent } from "../components/case-card"
import { Header } from "../components/header"
import { AuthProvider, useAuth } from "../contexts/auth-context"
import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthModal } from "../components/auth-modal"
import Loader from "../components/bounce-loader"

interface CaseData {
  number: string;
  title: string;
  description: string;
  requiredExp: number;
  rewardXp: number;
  isMarked?: boolean;
}

const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

function HomeContent() {
  // Получаем параметры из URL
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case');
  const router = useRouter();
  const { user, isAuthenticated, refreshUserData } = useAuth();

  // Ref для отслеживания первого рендера
  const isFirstRender = useRef(true);
  // Ref для отслеживания инициализации с URL
  const initializedFromUrl = useRef(false);
  
  // Состояние для модального окна авторизации
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [casesList, setCasesList] = useState<Array<{
    number: string;
    title: string;
    description: string;
    requiredExp: number;
    rewardXp: number;
    isMarked?: boolean;
  }>>([]);
  const [caseTitles, setCaseTitles] = useState<string[]>([]); // Добавляем состояние для заголовков
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Состояние для отслеживания открытой карточки
  const [expandedCase, setExpandedCase] = useState<{
    isExpanded: boolean;
    data: any;
    isClosing: boolean;
  }>({
    isExpanded: false,
    data: null,
    isClosing: false
  });

  // Состояние для анимации основного контента - инициализируем только один раз, независимо от условий
  const [mainContentState, setMainContentState] = useState<'visible' | 'hiding' | 'hidden' | 'showing'>('visible');

  // Состояние для заголовка страницы
  const [pageTitle, setPageTitle] = useState("SQL Hunt - Детективные загадки");

  // Состояние для определения, находимся ли мы на клиенте
  const [isClient, setIsClient] = useState(false);
  
  // Добавляем новое состояние для начальной загрузки
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Проверяем состояние авторизации при монтировании
  useEffect(() => {
    console.log('Состояние авторизации:', {
      isAuthenticated,
      user,
      hasToken: !!localStorage.getItem('token')
    });
  }, [isAuthenticated, user]);

  // Обновляем эффект для проверки клиента
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Устанавливаем минимальное время отображения лоадера
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Проверяем URL при загрузке для восстановления состояния
  useEffect(() => {
    // Выполнять только на клиенте и после первого рендера
    if (typeof window === 'undefined' || initializedFromUrl.current) {
      return;
    }

    const caseNumber = searchParams.get('case');
    if (caseNumber) {
      const caseData = casesList.find(c => c.number === caseNumber);
      if (caseData) {
        // Проверяем, достаточно ли у пользователя опыта
        const userExp = user?.experience || 0;
        if (userExp >= caseData.requiredExp) {
          // Открываем дело только если достаточно опыта
          setExpandedCase({
            isExpanded: true,
            data: caseData,
            isClosing: false
          });
          setMainContentState('hidden');
          setPageTitle(`Дело №${caseData.number}: ${caseData.title} - SQL Hunt`);
        } else {
          // Если опыта недостаточно, перенаправляем на главную
          router.replace('/');
        }
        initializedFromUrl.current = true;
      }
    }
  }, [searchParams, user]);

  useEffect(() => {
    console.log('Состояние авторизации изменилось:', { isAuthenticated, user });
    
    const fetchCases = async () => {
      console.log('Начинаем загрузку дел...');
      setFetchError(null);
      
      try {
        // Обновляем данные пользователя перед загрузкой дел
        if (isAuthenticated) {
          await refreshUserData();
          
          const token = localStorage.getItem('token');
          console.log('Пробуем загрузить с токеном:', token);
          
          // Загружаем список дел
          const casesResponse = await fetch('https://sqlhunt.com:8000/api/cases/', {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            mode: 'cors',
          });
          
          if (!casesResponse.ok) {
            throw new Error(`Ошибка загрузки дел: ${casesResponse.status}`);
          }
          
          const casesData = await casesResponse.json();
          
          // Загружаем прогресс пользователя
          const progressResponse = await fetch('https://sqlhunt.com:8000/api/users/userprogress/', {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          
          if (!progressResponse.ok) {
            throw new Error(`Ошибка загрузки прогресса: ${progressResponse.status}`);
          }
          
          const progressData = await progressResponse.json();
          
          // Создаем Set с ID завершенных дел для быстрого поиска
          const completedCases = new Set(progressData.map((progress: any) => progress.case_id));
          
          // Маппим дела с учетом прогресса
          const cases = casesData.map((item: any) => ({
            number: String(item.id),
            title: item.title,
            description: item.description,
            requiredExp: item.required_xp,
            rewardXp: item.reward_xp,
            isMarked: completedCases.has(item.id) // Помечаем завершенные дела
          }));
          
          console.log('Получены дела с прогрессом:', cases);
          setCasesList(cases);
          // Обновляем список заголовков
          setCaseTitles(cases.map((c: CaseData) => c.title.toUpperCase()));
        } else {
          // Для неавторизованных пользователей устанавливаем только заголовки для анимации
          setCaseTitles([
            "СЕРЕБРЯНЫЙ КЛЮЧ",
            "ПОСЛЕДНЯЯ ВСТРЕЧА",
            "АРХИВНЫЕ ЗАКОНОМЕРНОСТИ",
            "ТАЙНА ПРОПАВШИХ ДАННЫХ",
            "ЦИФРОВОЙ СЛЕД",
          ]);
          setCasesList([]);
        }
      } catch (e: any) {
        console.error('Ошибка при загрузке дел:', e);
        setFetchError(e.message || 'Ошибка загрузки');
      }
    };

    fetchCases();
  }, [isAuthenticated]); // Зависимость от isAuthenticated остаётся

  // Обработчик успешной авторизации
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (expandedCase.data) {
      // Проверяем, достаточно ли у пользователя опыта
      const userExp = user?.experience || 0;
      if (userExp >= expandedCase.data.requiredExp) {
        // Открываем открытое дело после успешной авторизации
        setMainContentState('hidden');
        setPageTitle(`Дело №${expandedCase.data.number}: ${expandedCase.data.title} - SQL Hunt`);
        // Восстанавливаем URL с номером дела
        router.push(`/?case=${expandedCase.data.number}`);
      }
    }
  };

  // Обработка кнопок навигации браузера (Назад/Вперед)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // Не выполнять на сервере
    }

    const handlePopState = () => {
      const caseNumber = new URL(window.location.href).searchParams.get('case');
      
      if (caseNumber) {
        // Восстанавливаем открытое дело
        const caseData = casesList.find(c => c.number === caseNumber);
        if (caseData) {
          setMainContentState('hiding');
          
          setTimeout(() => {
            setMainContentState('hidden');
            setExpandedCase({
              isExpanded: true,
              data: caseData,
              isClosing: false
            });
          }, 500);
        }
      } else {
        // Закрываем открытое дело, если мы на главной странице
        if (expandedCase.isExpanded) {
          setExpandedCase(prev => ({
            ...prev,
            isClosing: true
          }));
          
          setTimeout(() => {
            setMainContentState('showing');
          }, 400);
          
          setTimeout(() => {
            setExpandedCase({
              isExpanded: false,
              data: null,
              isClosing: false
            });
            
            setTimeout(() => {
              setMainContentState('visible');
            }, 400);
          }, 600);
        }
      }
    };

    // Добавляем слушатель события popstate
    window.addEventListener('popstate', handlePopState);
    
    // Удаляем слушатель при размонтировании компонента
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [expandedCase.isExpanded]); // Упрощаем зависимости

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    const href = e.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    
    const targetElement = document.querySelector(href);
    if (!targetElement) return;
    
    const offsetTop = targetElement.getBoundingClientRect().top + window.scrollY;
    
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }, []);
  
  const handleExpandCase = useCallback((isExpanded: boolean, caseData: CaseData) => {
    if (!isExpanded) {
      // Если закрываем карточку
      setExpandedCase(prev => ({
        ...prev,
        isClosing: true
      }));
      
      // Изменяем URL на главную страницу без параметра case
      if (typeof window !== 'undefined') {
        window.history.pushState({}, "", "/");
      }
      
      // Обновляем заголовок страницы
      setPageTitle("SQL Hunt - Детективные загадки");
      
      // Запускаем анимацию появления основного контента
      setTimeout(() => {
        setMainContentState('showing');
      }, 400);
      
      // После окончания анимации, полностью закрываем карточку
      setTimeout(() => {
        setExpandedCase({
          isExpanded: false,
          data: null,
          isClosing: false
        });
        // Сбрасываем состояние основного контента
        setTimeout(() => {
          setMainContentState('visible');
        }, 400);
      }, 600);
    } else {
      // Проверяем, достаточно ли у пользователя опыта
      const userExp = user?.experience || 0;
      if (userExp < caseData.requiredExp) {
        return;
      }

      // Открываем карточку
      // Сначала скрываем основной контент
      setMainContentState('hiding');
      
      // Изменяем URL, добавляя номер дела в качестве параметра
      if (typeof window !== 'undefined') {
        window.history.pushState({}, "", `?case=${caseData.number}`);
      }
      
      // Обновляем заголовок страницы
      setPageTitle(`Дело №${caseData.number}: ${caseData.title} - SQL Hunt`);
      
      // После того как контент скрылся, показываем расширенную карточку
      setTimeout(() => {
        setMainContentState('hidden');
        setExpandedCase({
          isExpanded: true,
          data: caseData,
          isClosing: false
        });
      }, 500);
    }
  }, [user]);
  
  // Используем useEffect для изменения title страницы
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = pageTitle;
    }
  }, [pageTitle]);

  // Удаляем атрибуты, которые могут вызывать ошибки гидратации
  useEffect(() => {
    // Удаляем проблемные атрибуты после гидратации
    const cleanup = () => {
      if (typeof document !== 'undefined') {
        document.querySelectorAll('[cz-shortcut-listen]').forEach(el => {
          el.removeAttribute('cz-shortcut-listen');
        });
      }
    };
    
    // Выполняем очистку после рендера
    cleanup();
    
    // Устанавливаем наблюдатель для DOM-мутаций
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'cz-shortcut-listen') {
            cleanup();
          }
        }
      });
      
      observer.observe(document.body, { 
        attributes: true, 
        subtree: true, 
        attributeFilter: ['cz-shortcut-listen'] 
      });
      
      return () => observer.disconnect();
    }
  }, []);

  // Рендеринг карточки и основного контента - используем условный рендеринг только для содержимого, а не хуков
  const renderMainContent = () => (
    <div
      className="w-full"
      style={{
        animation: mainContentState === 'showing' 
          ? 'fadeIn 0.6s ease-out forwards' 
          : mainContentState === 'hiding' 
            ? 'fadeOut 0.5s ease-out forwards' 
            : '',
        opacity: mainContentState === 'visible' ? 1 : mainContentState === 'hidden' ? 0 : undefined
      }}
    >
      {/* Вторая часть страницы */}
      {isAuthenticated && (
        <div id="second-page" className="min-h-screen font-serif text-black p-4 md:p-8 pt-20">
          <div className="max-w-5xl mx-auto">
            {/* Header with filter button */}
            <div className="flex justify-between items-center mb-6">
              <h2 
                className="text-5xl font-normal opacity-0" 
                style={{ 
                  fontFamily: "var(--font-heathergreen)",
                  letterSpacing: "0.08em",
                  animation: 'fadeIn 0.6s ease-out 0.2s forwards'
                }}
              >
                Дела:
              </h2>
            </div>

            {/* Cards container */}
            <div className="min-h-[200px] transition-opacity duration-300 ease-in-out">
              {fetchError ? (
                <div className="flex items-center justify-center min-h-[200px] transition-opacity duration-300">
                  <div className="text-xl text-red-500">{fetchError}</div>
                </div>
              ) : (
                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn"
                  style={{
                    animation: 'fadeIn 0.4s ease-in-out'
                  }}
                >
                  {casesList.map((caseItem) => (
                    <div 
                      key={caseItem.number} 
                      className="w-full opacity-0 animate-slideUp"
                      style={{
                        animation: 'slideUp 0.4s ease-out forwards',
                        animationDelay: `${parseInt(caseItem.number) * 0.1}s`
                      }}
                    >
                      <CaseCard
                        key={caseItem.number}
                        number={caseItem.number}
                        title={caseItem.title}
                        description={caseItem.description}
                        isMarked={caseItem.isMarked || false}
                        requiredExp={caseItem.requiredExp}
                        rewardXp={caseItem.rewardXp}
                        userExp={user?.experience || 0}
                        onExpandCase={handleExpandCase}
                      />
                    </div>
                  ))}
                  {casesList.length === 0 && (
                    <div className="col-span-full text-center py-10 animate-fadeIn">
                      <p className="text-xl">Нет доступных дел</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {!isAuthenticated && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl mb-4" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
              Войдите, чтобы начать расследование
            </h2>
            <p className="text-xl" style={{ fontFamily: "var(--font-rationalist-light)" }}>
              Доступ к делам открыт только для авторизованных детективов
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderExpandedCase = () => (
    <div className="container mx-auto my-8 max-w-6xl bg-transparent" 
         style={{ 
           animation: expandedCase.isClosing 
             ? "collapseCard 0.5s ease-out forwards" 
             : "expandCard 0.6s ease-out 0.5s forwards",
           opacity: expandedCase.isClosing ? 1 : 0
         }}>
      {expandedCase.data && (
        <ExpandedCaseContent 
          number={expandedCase.data.number}
          title={expandedCase.data.title}
          description={expandedCase.data.description}
          rewardXp={expandedCase.data.rewardXp}
          onClose={() => handleExpandCase(false, expandedCase.data!)}
        />
      )}
    </div>
  );
  
  return (
    <main className="min-h-screen flex flex-col p-10 relative">
      {/* Хедер (всегда видимый) */}
      <Header 
        onSmoothScroll={handleSmoothScroll}
        caseTitles={caseTitles}
      />

      {/* Модальное окно авторизации */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => {
          setIsAuthModalOpen(false);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Содержимое развернутой карточки или основной контент - отображаем только на клиенте */}
      {isLoading ? (
        <div className="w-full min-h-[80vh] flex items-center justify-center">
          <Loader />
        </div>
      ) : isClient ? (
        expandedCase.isExpanded && isAuthenticated ? renderExpandedCase() : renderMainContent()
      ) : null}
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

