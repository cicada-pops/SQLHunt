"use client"

import Link from "next/link"
import { CaseCard, ExpandedCaseContent } from "../components/case-card"
import { Header } from "../components/header"
import { AuthProvider, useAuth } from "../contexts/auth-context"
import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthModal } from "../components/auth-modal"

interface CaseData {
  number: string;
  title: string;
  description: string;
  requiredExp: number;
}

export default function Home() {
  // Получаем параметры из URL
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Ref для отслеживания первого рендера
  const isFirstRender = useRef(true);
  // Ref для отслеживания инициализации с URL
  const initializedFromUrl = useRef(false);
  
  // Состояние для модального окна авторизации
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingCaseData, setPendingCaseData] = useState<CaseData | null>(null);

  // Массив с данными всех дел для подгрузки по номеру из URL
  const casesList: CaseData[] = [
    {
      number: "001",
      title: "Убийство на рассвете",
      description: "На окраине города найдено тело частного детектива, занимавшегося разоблачением коррупции в полиции. В его записной книжке были указаны несколько имен, но записи обрываются. Среди улик загадочная записка с тремя инициалами. Кто стоял за этим убийством и что знал детектив перед смертью?",
      requiredExp: 0 // Начальное дело
    },
    {
      number: "002",
      title: "Пропавший картель",
      description: "Действие происходит в 1995 году. Тайная сделка между двумя преступными группировками в клубе 'Красный Фонарь' закончилась неожиданно — один из участников исчез вместе с чемоданом, полным наличных. Свидетели видели, как черный седан спешно уехал с места событий. Вам предстоит изучить улики, допросить свидетелей и выяснить, кто предал своих.",
      requiredExp: 100 // Требуется 100 опыта
    },
    {
      number: "003",
      title: "Загадка закрытого кабинета",
      description: "В элитном особняке найден мертвым известный адвокат. Дверь его кабинета была заперта изнутри, окно не вскрыто. На столе стоит наполовину допитый стакан коньяка, а рядом — перевернутый лист бумаги с едва различимыми буквами. Как убийца смог выбраться из закрытой комнаты?",
      requiredExp: 200 // Требуется 200 опыта
    },
    {
      number: "004",
      title: "Загадка закрытого кабинета",
      description: "В элитном особняке найден мертвым известный адвокат. Дверь его кабинета была заперта изнутри, окно не вскрыто. На столе стоит наполовину допитый стакан коньяка, а рядом — перевернутый лист бумаги с едва различимыми буквами. Как убийца смог выбраться из закрытой комнаты?",
      requiredExp: 300 // Требуется 300 опыта
    },
    {
      number: "005",
      title: "Пропавший картель",
      description: "Действие происходит в 1995 году. Тайная сделка между двумя преступными группировками в клубе 'Красный Фонарь' закончилась неожиданно — один из участников исчез вместе с чемоданом, полным наличных. Свидетели видели, как черный седан спешно уехал с места событий. Вам предстоит изучить улики, допросить свидетелей и выяснить, кто предал своих.",
      requiredExp: 400 // Требуется 400 опыта
    },
    {
      number: "006",
      title: "Пропавший картель",
      description: "Действие происходит в 1995 году. Тайная сделка между двумя преступными группировками в клубе 'Красный Фонарь' закончилась неожиданно — один из участников исчез вместе с чемоданом, полным наличных. Свидетели видели, как черный седан спешно уехал с места событий. Вам предстоит изучить улики, допросить свидетелей и выяснить, кто предал своих.",
      requiredExp: 500 // Требуется 500 опыта
    }
  ];
  
  // Состояние для отслеживания открытой карточки
  const [expandedCase, setExpandedCase] = useState<{
    isExpanded: boolean;
    data: CaseData | null;
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
  
  // Проверяем, что мы на клиенте
  useEffect(() => {
    setIsClient(true);
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

  // Обработчик успешной авторизации
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (pendingCaseData) {
      // Проверяем, достаточно ли у пользователя опыта
      const userExp = user?.experience || 0;
      if (userExp >= pendingCaseData.requiredExp) {
        // Открываем отложенное дело после успешной авторизации
        setExpandedCase({
          isExpanded: true,
          data: pendingCaseData,
          isClosing: false
        });
        setMainContentState('hidden');
        setPageTitle(`Дело №${pendingCaseData.number}: ${pendingCaseData.title} - SQL Hunt`);
        // Восстанавливаем URL с номером дела
        router.push(`/?case=${pendingCaseData.number}`);
      }
      setPendingCaseData(null);
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
      <div id="second-page" className="min-h-screen font-serif text-black p-4 md:p-8 pt-20">
        <div className="max-w-5xl mx-auto">
          {/* Header with filter button */}
          <div className="flex justify-between items-center mb-6">
            <h2 
              className="text-5xl font-normal" 
              style={{ 
                fontFamily: "var(--font-heathergreen)",
                letterSpacing: "0.08em"
              }}
            >
              Дела:
            </h2>
            <span 
              className="text-5xl font-normal cursor-pointer" 
              style={{ 
                fontFamily: "var(--font-heathergreen)",
                letterSpacing: "0.08em"
              }}
            >
              Фильтр
            </span>
          </div>

          {/* Cards container */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Первый столбец */}
            <div className="sm:w-1/2 lg:w-1/3 flex flex-col gap-4">
              <CaseCard
                number={casesList[0].number}
                title={casesList[0].title}
                description={casesList[0].description}
                isMarked={false}
                requiredExp={casesList[0].requiredExp}
                userExp={user?.experience || 0}
                onExpandCase={handleExpandCase}
              />
              
              <CaseCard
                number={casesList[3].number}
                title={casesList[3].title}
                description={casesList[3].description}
                isMarked={false}
                requiredExp={casesList[3].requiredExp}
                userExp={user?.experience || 0}
                onExpandCase={handleExpandCase}
              />
            </div>
            
            {/* Второй столбец */}
            <div className="sm:w-1/2 lg:w-1/3 flex flex-col gap-4">
              <CaseCard
                number={casesList[1].number}
                title={casesList[1].title}
                description={casesList[1].description}
                isMarked={false}
                requiredExp={casesList[1].requiredExp}
                userExp={user?.experience || 0}
                onExpandCase={handleExpandCase}
              />
              
              <CaseCard
                number={casesList[4].number}
                title={casesList[4].title}
                description={casesList[4].description}
                isMarked={false}
                requiredExp={casesList[4].requiredExp}
                userExp={user?.experience || 0}
                onExpandCase={handleExpandCase}
              />
            </div>
            
            {/* Третий столбец - виден только на больших экранах */}
            <div className="hidden lg:flex lg:w-1/3 flex-col gap-4">
              <CaseCard
                number={casesList[2].number}
                title={casesList[2].title}
                description={casesList[2].description}
                isMarked={false}
                requiredExp={casesList[2].requiredExp}
                userExp={user?.experience || 0}
                onExpandCase={handleExpandCase}
              />
              
              <CaseCard
                number={casesList[5].number}
                title={casesList[5].title}
                description={casesList[5].description}
                isMarked={false}
                requiredExp={casesList[5].requiredExp}
                userExp={user?.experience || 0}
                onExpandCase={handleExpandCase}
              />
            </div>
          </div>
        </div>
      </div>
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
          onClose={() => handleExpandCase(false, expandedCase.data!)}
        />
      )}
    </div>
  );
  
  return (
    <AuthProvider>
      <main className="min-h-screen flex flex-col p-10 relative">
        {/* Хедер (всегда видимый) */}
        <Header onSmoothScroll={handleSmoothScroll} />

        {/* Модальное окно авторизации */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingCaseData(null);
          }}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Содержимое развернутой карточки или основной контент - отображаем только на клиенте */}
        {isClient ? (
          expandedCase.isExpanded ? renderExpandedCase() : renderMainContent()
        ) : (
          // Заглушка для серверного рендеринга
          <div className="w-full min-h-[80vh] flex items-center justify-center">
            <p className="text-xl">Загрузка...</p>
          </div>
        )}
      </main>
    </AuthProvider>
  )
}

