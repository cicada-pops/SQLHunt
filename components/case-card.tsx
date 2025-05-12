import Link from "next/link"
import Image from "next/image"
import { X, Play, ChevronUp, ChevronDown } from "lucide-react"
import { memo, useState, useRef, useEffect } from "react"

interface CaseCardProps {
  number: string
  title: string
  description: string
  isMarked: boolean
  className?: string
  onExpandCase?: (isExpanded: boolean, caseData: { number: string; title: string; description: string }) => void
}

// Используем memo для предотвращения ненужных перерендеров
export const CaseCard = memo(function CaseCard({ 
  number, 
  title, 
  description, 
  isMarked, 
  className = "",
  onExpandCase
}: CaseCardProps) {
  // Инициализируем все хуки до каких-либо условных выражений
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Проверяем, что мы на клиенте
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenCase = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(true);
    
    // Уведомляем родительский компонент об открытии карточки
    // Теперь без задержки, так как мы хотим сначала начать анимацию исчезновения контента
    if (onExpandCase) {
      onExpandCase(true, { number, title, description });
    }
  };

  const handleCloseCase = () => {
    setIsExpanded(false);
    // Уведомляем родительский компонент о закрытии карточки
    if (onExpandCase) {
      onExpandCase(false, { number, title, description });
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

          <p className="text-sm mb-4 text-justify" style={{ fontFamily: "var(--font-rationalist-light)" }}>{description}</p>

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
      <div className={`relative border border-black p-4 h-auto bg-transparent ${className}`}
           style={{ minHeight: '230px', opacity: isMarked ? 0.6 : 1 }}>
        {isMarked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/close.png" alt="Зачеркнуто" width={200} height={200} style={{ objectFit: 'contain', width: '70%', height: 'auto' }} />
          </div>
        )}

        <div className="relative z-10">
          <div className="mb-2 border-b border-black pb-1">
            <h3 className="font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>Дело №{number}: {title}</h3>
          </div>

          <p className="text-sm mb-4 text-justify" style={{ fontFamily: "var(--font-rationalist-light)" }}>{description}</p>

          <div className="text-right">
            <span 
              className="inline-block relative font-bold group"
              style={{ fontFamily: "var(--font-rationalist-demibold)" }}
            >
              <span>Рассмотреть дело →</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative border border-black p-4 h-auto bg-transparent ${className}`}
        style={{
          transition: 'opacity 0.3s ease-in-out',
          opacity: isExpanded && onExpandCase ? 0 : isMarked ? 0.6 : 1,
          minHeight: '230px'
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

        <p className="text-sm mb-4 text-justify" style={{ fontFamily: "var(--font-rationalist-light)" }}>{description}</p>

        <div className="text-right">
          <Link 
            href="#" 
              onClick={handleOpenCase}
            className="inline-block relative font-bold group"
            style={{ fontFamily: "var(--font-rationalist-demibold)" }}
          >
            <span>Рассмотреть дело →</span>
            <span 
              className="absolute left-0 bottom-0 w-0 h-[1px] bg-black group-hover:w-full" 
              style={{ transition: "width 0.3s ease-in-out" }}
            ></span>
          </Link>
        </div>
      </div>
    </div>

      {/* Развернутая карточка (отображается только если нет onExpandCase) */}
      {isExpanded && !onExpandCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" 
            style={{ animation: "fadeIn 0.3s ease-out" }}>
          <ExpandedCaseContent 
            number={number} 
            title={title} 
            description={description} 
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
  onClose,
  className = ""
}: {
  number: string;
  title: string;
  description: string;
  onClose: () => void;
  className?: string;
}) {
  const tabs = ["SQL-запросы", "Схема БД", "Заметки", "Ответы"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [isClosing, setIsClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isResultCollapsed, setIsResultCollapsed] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<string | null>(null);

  const handleClose = () => {
    setIsClosing(true);
    // Задержка для отображения анимации закрытия
    setTimeout(() => {
      onClose();
    }, 500); // Длительность анимации в globals.css
  };

  const toggleResultPanel = () => {
    setIsResultCollapsed(!isResultCollapsed);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSqlQuery(e.target.value);
  };

  const executeQuery = () => {
    // Здесь будет логика выполнения SQL-запроса
    // Пока сделаем заглушку
    if (sqlQuery.trim() === "") {
      setQueryResult("Запрос пуст. Пожалуйста, введите SQL-запрос.");
      return;
    }
    
    // Имитация выполнения запроса
    setQueryResult("Запрос выполняется...");
    
    // Имитация задержки с сервера
    setTimeout(() => {
      if (sqlQuery.toLowerCase().includes("select") && sqlQuery.toLowerCase().includes("from")) {
        setQueryResult(`Результат запроса: 
| id | name | value |
|----|------|-------|
| 1  | John | 100   |
| 2  | Anna | 200   |
| 3  | Mike | 150   |`);
      } else {
        setQueryResult("Ошибка в запросе. Убедитесь, что вы используете правильный синтаксис SQL.");
      }
    }, 500);
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
        <div className="flex items-center mb-2">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
            Дело №{number}: {title}
          </h2>
        </div>
        <p className="text-lg mb-6" style={{ fontFamily: "var(--font-rationalist-light)" }}>
          {description}
        </p>

        {/* Цели/подсказки */}
        <div className="mt-6">
          <h4 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
            Цели расследования:
          </h4>
          <ul className="list-disc list-inside space-y-2">
            <li>Найти ключевые улики в базе данных</li>
            <li>Определить подозреваемых на основе данных</li>
            <li>Установить мотив преступления</li>
          </ul>
        </div>
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
                  className="px-2 py-0.5 m-1 mr-2 text-black flex items-center justify-center gap-1 text-sm"
                  style={{ backgroundColor: 'rgba(255, 168, 16, 0.6)', fontFamily: "var(--font-rationalist-light)" }}
                  onClick={executeQuery}
                >
                  <Play className="w-3 h-3 stroke-[2]" />
                  Выполнить
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
                  Результат
                </div>
                <button className="px-3 py-1 m-1 text-black" style={{ background: 'none', fontFamily: "var(--font-rationalist-light)" }} onClick={toggleResultPanel}>
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
                  {queryResult ? (
                    <pre className="whitespace-pre-wrap text-sm text-white" style={{ fontFamily: "var(--font-rationalist-light)" }}>{queryResult}</pre>
                  ) : (
                    <div className="text-gray-400 italic" style={{ fontFamily: "var(--font-rationalist-light)" }}>Строк нет. Выполните запрос, чтобы увидеть результат.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "Схема БД" && (
          <div className="text-center p-10">
            <p>Здесь будет отображаться схема базы данных</p>
          </div>
        )}
        {activeTab === "Заметки" && (
          <div>
            <textarea
              className="w-full h-full p-4 border border-gray-300"
              placeholder="Ваши заметки по делу..."
              style={{ fontFamily: "var(--font-rationalist-light)" }}
            ></textarea>
          </div>
        )}
        {activeTab === "Ответы" && (
          <div className="p-4">
            <div className="mb-4">
              <label className="block mb-2 font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
                Ваш ответ:
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300"
                placeholder="Введите ваш ответ..."
                style={{ fontFamily: "var(--font-rationalist-light)" }}
              />
            </div>
            <button className="px-4 py-2 bg-black text-white">Проверить</button>
          </div>
        )}
      </div>
    </div>
  );
}); 