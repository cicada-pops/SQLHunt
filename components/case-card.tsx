import Link from "next/link"
import Image from "next/image"
import { X, Play, ChevronUp, ChevronDown } from "lucide-react"
import { memo, useState, useRef, useEffect } from "react"
import { useAuth } from "../contexts/auth-context"

// Функция для нормализации текста
const normalizeText = (text?: string) => {
  if (!text) return '';
  return text
    .trim()
    // Заменяем множественные пустые строки на одну
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Убираем пробелы в начале строк
    .replace(/^\s+/gm, '')
    // Убираем пробелы в конце строк
    .replace(/\s+$/gm, '');
};

interface CaseCardProps {
  number: string
  title: string
  description: string
  fullDescription?: string
  investigationPlan?: string
  isMarked: boolean
  className?: string
  requiredExp: number
  rewardXp: number
  userExp: number
  onExpandCase?: (isExpanded: boolean, caseData: { 
    number: string; 
    title: string; 
    description: string; 
    fullDescription?: string;
    investigationPlan?: string;
    requiredExp: number;
    rewardXp: number;
  }) => void
}

// Используем memo для предотвращения ненужных перерендеров
export const CaseCard = memo(function CaseCard({ 
  number, 
  title, 
  description, 
  fullDescription,
  investigationPlan,
  isMarked,
  requiredExp,
  rewardXp,
  userExp, 
  className = "",
  onExpandCase
}: CaseCardProps) {
  // Инициализируем все хуки до каких-либо условных выражений
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Проверяем, доступно ли дело
  const isLocked = userExp < requiredExp;
  
  // Проверяем, что мы на клиенте
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenCase = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Если дело заблокировано, не открываем его
    if (isLocked) {
      return;
    }
    
    // Уведомляем родительский компонент об открытии карточки
    if (onExpandCase) {
      onExpandCase(true, { number, title, description, fullDescription, investigationPlan, requiredExp, rewardXp });
    } else {
      setIsExpanded(true);
    }
  };

  const handleCloseCase = () => {
    setIsExpanded(false);
    // Уведомляем родительский компонент о закрытии карточки
    if (onExpandCase) {
      onExpandCase(false, { number, title, description, fullDescription, investigationPlan, requiredExp, rewardXp });
    }
  };

  // Если карточка развернута и мы показываем ее в родительском компоненте, 
  // не отображаем ее собственную версию карточки
  if (isExpanded && onExpandCase) {
    // Вместо того чтобы сразу скрывать карточку, мы продолжаем её рендерить
    // но с меньшей непрозрачностью, чтобы она плавно исчезала
    return (
      <div className={`relative border border-black p-4 h-auto bg-transparent ${className}`}
           style={{ opacity: 0, transition: 'opacity 0.3s ease-out', minHeight: '230px' }}>
        {/* Копия содержимого карточки */}
        {isMarked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/close.png" alt="Зачеркнуто" width={200} height={200} style={{ objectFit: 'contain', width: '70%', height: 'auto' }} />
          </div>
        )}

        <div className="relative z-10">
          <div className="mb-2 border-b border-black pb-1">
            <h3 className="font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>Дело №{number}: {title}</h3>
          </div>

          <p className="text-sm mb-4 text-justify whitespace-pre-line" style={{ 
            fontFamily: "var(--font-rationalist-light)",
            lineHeight: "1.5"
          }}>{normalizeText(description)}</p>

          <div className="text-right">
            <span 
              className="inline-block relative font-bold"
              style={{ fontFamily: "var(--font-rationalist-demibold)" }}
            >
              <span>Рассмотреть дело →</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // На сервере или при первом рендере выводим статичную карточку без интерактивности
  if (!isClient) {
    return (
      <div 
        className={`relative border border-black p-4 h-auto bg-transparent ${className}`}
        style={{ 
          minHeight: '230px', 
          opacity: isLocked ? 0.4 : isMarked ? 0.6 : 1,
          filter: isLocked ? 'grayscale(100%)' : 'none'
        }}
      >
        {isMarked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/close.png" alt="Зачеркнуто" width={200} height={200} style={{ objectFit: 'contain', width: '70%', height: 'auto' }} />
          </div>
        )}

        <div className="relative z-10">
          <div className="mb-2 border-b border-black pb-1">
            <h3 className="font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>Дело №{number}: {title}</h3>
          </div>

          {isLocked ? (
            <div className="text-center py-4">
              <p className="text-sm mb-2" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                Требуется опыта: {requiredExp}
              </p>
              <p className="text-sm" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                🔒 Дело заблокировано
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-4 text-justify whitespace-pre-line" style={{ 
                fontFamily: "var(--font-rationalist-light)",
                lineHeight: "1.5"
              }}>{normalizeText(description)}</p>
              <div className="text-right">
                <span 
                  className="inline-block relative font-bold group"
                  style={{ fontFamily: "var(--font-rationalist-demibold)" }}
                >
                  <span>Рассмотреть дело →</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative border border-black p-4 h-auto bg-transparent ${isLocked ? 'group' : ''} ${className}`}
        style={{
          transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
          opacity: isExpanded && onExpandCase ? 0 : isLocked ? 0.4 : isMarked ? 0.6 : 1,
          minHeight: '230px',
          filter: isLocked ? 'grayscale(100%)' : 'none',
          cursor: isLocked ? 'not-allowed' : 'default'
        }}
      >
        {isMarked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/close.png" alt="Зачеркнуто" width={200} height={200} style={{ objectFit: 'contain', width: '70%', height: 'auto' }} />
          </div>
        )}

        {isLocked && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
          >
            <div 
              className="bg-black text-white text-sm rounded px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
              style={{ fontFamily: "var(--font-rationalist-light)" }}
            >
              Требуется {requiredExp} опыта
            </div>
          </div>
        )}

        <div className="relative z-10">
          <div className="mb-2 border-b border-black pb-1">
            <h3 className="font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>Дело №{number}: {title}</h3>
          </div>

          <p className="text-sm mb-4 text-justify whitespace-pre-line" style={{ 
            fontFamily: "var(--font-rationalist-light)",
            lineHeight: "1.5"
          }}>{normalizeText(description)}</p>

          <div className="text-right">
            {isLocked ? (
              <div className="relative">
                <span 
                  className="inline-block relative font-bold text-gray-500"
                  style={{ fontFamily: "var(--font-rationalist-demibold)" }}
                >
                  <span>Рассмотреть дело →</span>
                </span>
              </div>
            ) : (
              <Link 
                href="#" 
                onClick={handleOpenCase}
                className="inline-block relative font-bold"
                style={{ fontFamily: "var(--font-rationalist-demibold)" }}
              >
                <span className="view-case-link inline-block cursor-pointer hover:opacity-80">
                  Рассмотреть дело →
                  <span 
                    className="absolute left-0 bottom-0 w-0 h-[1px] bg-black view-case-link-hover" 
                    style={{ transition: "width 0.3s ease-in-out" }}
                  ></span>
                </span>
              </Link>
            )}
          </div>
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-transparent" />
        )}
      </div>

      {/* Развернутая карточка (отображается только если нет onExpandCase) */}
      {isExpanded && !onExpandCase && !isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" 
            style={{ animation: "fadeIn 0.3s ease-out" }}>
          <ExpandedCaseContent 
            number={number} 
            title={title} 
            description={description} 
            fullDescription={fullDescription}
            investigationPlan={investigationPlan}
            rewardXp={rewardXp}
            onClose={handleCloseCase} 
          />
        </div>
      )}
    </>
  );
});

// Выделим содержимое развернутой карточки в отдельный компонент для переиспользования
export const ExpandedCaseContent = memo(function ExpandedCaseContent({
  number,
  title,
  description,
  fullDescription,
  investigationPlan,
  rewardXp,
  onClose,
  className = ""
}: {
  number: string;
  title: string;
  description: string;
  fullDescription?: string;
  investigationPlan?: string;
  rewardXp: number;
  onClose: () => void;
  className?: string;
}) {
  const tabs = ["SQL-запросы", "Схема БД", "Заметки", "Ответы"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [isClosing, setIsClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isResultCollapsed, setIsResultCollapsed] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const toggleResultPanel = () => {
    setIsResultCollapsed(!isResultCollapsed);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSqlQuery(e.target.value);
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      setError("SQL запрос не может быть пустым");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Необходима авторизация');
      }

      // Отправляем запрос на выполнение
      const response = await fetch(`https://sqlhunt.com:8000/api/cases/${number}/execute-sql/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sql: sqlQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка выполнения запроса');
      }

      // Получаем task_id и начинаем опрашивать статус
      const taskId = data.task_id;
      let result = null;

      while (true) {
        const statusResponse = await fetch(`https://sqlhunt.com:8000/api/tasks/${taskId}/status/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const statusData = await statusResponse.json();

        if (statusData.status === 'SUCCESS') {
          result = statusData.result;
          break;
        } else if (statusData.status === 'FAILURE') {
          throw new Error(statusData.error || 'Задача завершилась с ошибкой');
        }

        // Ждем 1 секунду перед следующим запросом
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (result && result.error) {
        throw new Error(result.error);
      }

      setQueryResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
      setQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={contentRef}
      className={`border-2 border-black p-6 w-full h-auto bg-transparent backdrop-blur-none ${className}`}
      style={{ 
        animation: isClosing ? "collapseCard 0.5s ease-out forwards" : "expandCard 0.5s ease-out",
        fontFamily: "var(--font-rationalist-light)",
      }}
    >
      {/* Кнопка "Назад к делам" */}
      <button 
        onClick={handleClose}
        className="flex items-center mb-6 font-bold hover:underline"
        style={{ fontFamily: "var(--font-rationalist-demibold)" }}
      >
        ← Назад к делам
      </button>

      {/* Заголовок и описание дела */}
      <div className="mb-8 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
            Дело №{number}: {title}
          </h2>
          <div className="text-xl" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
            Награда: {rewardXp} XP
          </div>
        </div>

        {/* Полное описание */}
        {fullDescription && (
          <div className="mb-6">
            <p className="text-lg whitespace-pre-line" style={{ 
              fontFamily: "var(--font-rationalist-light)",
              lineHeight: "1.6"
            }}>
              {normalizeText(fullDescription)}
            </p>
          </div>
        )}

        {/* Краткое описание */}
        {description && description !== fullDescription && (
          <div className="mb-6">
            <p className="text-lg whitespace-pre-line" style={{ 
              fontFamily: "var(--font-rationalist-light)",
              lineHeight: "1.6"
            }}>
              {normalizeText(description)}
            </p>
          </div>
        )}

        {/* План расследования */}
        {investigationPlan && (
          <div className="mt-6">
            <p className="text-lg whitespace-pre-line" style={{ 
              fontFamily: "var(--font-rationalist-light)",
              lineHeight: "1.6"
            }}>
              {normalizeText(investigationPlan).split('\n').map((line, index) => (
                index === 0 ? (
                  <span key={index} className="font-bold block" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
                    {line}
                  </span>
                ) : (
                  <span key={index} className="block">
                    {line}
                  </span>
                )
              ))}
            </p>
          </div>
        )}
      </div>

      {/* Вкладки */}
      <div className="mb-4">
        <div className="flex border-b border-black">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 font-bold ${activeTab === tab ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
              style={{ fontFamily: "var(--font-rationalist-bold)" }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Содержимое активной вкладки */}
      <div className="h-[40vh] p-4 overflow-y-auto bg-transparent">
        {activeTab === "SQL-запросы" && (
          <div className="flex h-full gap-4">
            {/* Панель для SQL-запроса (левая) */}
            <div className="flex flex-col w-1/2" style={{ 
              border: 'none'
            }}>
              {/* Шапка окна SQL */}
              <div className="flex justify-between items-center pr-1" style={{ backgroundColor: 'rgba(255, 168, 16, 0.4)' }}>
                <div className="p-2 font-bold text-black" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                  SQL запрос
                </div>
                <button 
                  className={`px-2 py-0.5 m-1 mr-2 text-black flex items-center justify-center gap-1 text-sm ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: 'rgba(255, 168, 16, 0.6)', fontFamily: "var(--font-rationalist-light)" }}
                  onClick={executeQuery}
                  disabled={isLoading}
                >
                  <Play className="w-3 h-3 stroke-[2]" />
                  {isLoading ? 'Выполняется...' : 'Выполнить'}
                </button>
              </div>
              {/* Поле для ввода SQL */}
              <textarea
                className="flex-1 p-4 resize-none border-0 outline-none sql-textarea text-sm"
                style={{ backgroundColor: '#241C13', color: '#FFFFFF', fontFamily: "var(--font-rationalist-light)" }}
                placeholder="SELECT * FROM bla_bla_table ..."
                spellCheck="false"
                value={sqlQuery}
                onChange={handleQueryChange}
              ></textarea>
            </div>

            {/* Панель результата запроса (правая) */}
            <div className="flex flex-col w-1/2">
              {/* Шапка окна результата */}
              <div 
                className="flex justify-between items-center cursor-pointer" 
                style={{ backgroundColor: 'rgba(255, 168, 16, 0.4)' }}
                onClick={toggleResultPanel}
              >
                <div className="p-2 font-bold text-black" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                  Результат {error ? '(Ошибка)' : ''}
                </div>
                <button className="px-3 py-1 m-1 text-black" style={{ background: 'none', fontFamily: "var(--font-rationalist-light)" }}>
                  {isResultCollapsed ? <ChevronDown className="w-4 h-4 stroke-[2]" /> : <ChevronUp className="w-4 h-4 stroke-[2]" />}
                </button>
              </div>
              
              {/* Область результата */}
              <div 
                className="flex-1 overflow-auto transition-all duration-300"
                style={{ 
                  maxHeight: isResultCollapsed ? '0' : '100%',
                  opacity: isResultCollapsed ? 0 : 1,
                  visibility: isResultCollapsed ? 'hidden' : 'visible',
                  backgroundColor: '#241C13'
                }}
              >
                <div className="p-4 h-full">
                  {error ? (
                    <div className="text-red-500 whitespace-pre-wrap text-sm" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                      {error}
                    </div>
                  ) : queryResult ? (
                    <div className="text-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            {queryResult.columns.map((column: string) => (
                              <th key={column} className="text-left p-2 border-b border-gray-600">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row: any[], rowIndex: number) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="p-2 border-b border-gray-600">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-400 italic" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                      Строк нет. Выполните запрос, чтобы увидеть результат.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ... other tabs content ... */}
      </div>
    </div>
  );
}); 