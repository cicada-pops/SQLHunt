import Link from "next/link"
import Image from "next/image"
import { X, Play, ChevronUp, ChevronDown, Table, Share2 } from "lucide-react"
import { memo, useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/auth-context"
import ReactFlow, { 
  Node, 
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import Loader from "./bounce-loader"

// Определяем типы для колонки
interface Column {
  name: string;
  type: string;
  isPrimary: boolean;
  isForeign: boolean;
}

// Определяем тип для данных узла
interface TableNodeData {
  tableName: string;
  columns: Column[];
}

// Определяем тип для внешнего ключа
interface ForeignKey {
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

// Кастомный компонент узла
const TableNode = ({ data }: NodeProps<TableNodeData>) => {
  return (
    <div className="bg-white rounded-lg border-2 border-black shadow-lg">
      <div className="p-4">
        <div className="font-bold mb-2 border-b border-black pb-1" 
             style={{ fontFamily: "var(--font-rationalist-bold)" }}>
          {data.tableName}
        </div>
        <div className="relative">
          {data.columns.map((col, index) => {
            const rowHeight = 36.4; // Высота строки
            const headerHeight = 0; // Убираем отступ заголовка, так как он уже учтен в padding
            const verticalPosition = (rowHeight * index) + (rowHeight / 2) + headerHeight; // Центрируем по строке
            
            // Добавляем Handle для первичного ключа (source)
            if (col.isPrimary) {
              return (
                <Handle
                  key={`source-${index}`}
                  type="source"
                  position={Position.Right}
                  id={`${data.tableName}-${col.name}-source`}
                  className="!bg-[#FF8A00]"
                  style={{ top: `${verticalPosition}px` }}
                />
              );
            }
            
            // Добавляем Handle для внешнего ключа (target)
            if (col.isForeign) {
              return (
                <Handle
                  key={`target-${index}`}
                  type="target"
                  position={Position.Left}
                  id={`${data.tableName}-${col.name}-target`}
                  className="!bg-[#FF8A00]"
                  style={{ top: `${verticalPosition}px` }}
                />
              );
            }
            return null;
          })}
          <table className="w-full text-sm">
            <tbody>
              {data.columns.map((col, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-1">
                      {col.name}
                      {col.isPrimary && <span title="Первичный ключ">🔑</span>}
                      {col.isForeign && <span title="Внешний ключ">🔗</span>}
                    </div>
                  </td>
                  <td className="py-2 pl-2 text-gray-500">{col.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Регистрируем типы узлов
const nodeTypes = {
  tableNode: TableNode,
};

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
  isMarked: boolean
  className?: string
  requiredExp: number
  rewardXp: number
  userExp: number
  onExpandCase?: (isExpanded: boolean, caseData: { 
    number: string; 
    title: string; 
    description: string; 
    requiredExp: number;
    rewardXp: number;
  }) => void
}

// Используем memo для предотвращения ненужных перерендеров
export const CaseCard = memo(function CaseCard({ 
  number, 
  title, 
  description, 
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
      onExpandCase(true, { number, title, description, requiredExp, rewardXp });
    } else {
      setIsExpanded(true);
    }
  };

  const handleCloseCase = () => {
    setIsExpanded(false);
    // Уведомляем родительский компонент о закрытии карточки
    if (onExpandCase) {
      onExpandCase(false, { number, title, description, requiredExp, rewardXp });
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
  rewardXp,
  onClose,
  className = ""
}: {
  number: string;
  title: string;
  description: string;
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
  const [showLoader, setShowLoader] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Добавляем состояние для схемы БД
  const [dbSchema, setDbSchema] = useState<Array<{
    tableName: string;
    columns: Array<{
      name: string;
      type: string;
      isPrimary: boolean;
      isForeign: boolean;
    }>;
    foreignKeys: Array<ForeignKey>;
  }> | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [showSchemaLoader, setShowSchemaLoader] = useState(false);
  const schemaLoadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaViewMode, setSchemaViewMode] = useState<'table' | 'graphic'>('table');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const resultContentRef = useRef<HTMLDivElement>(null);

  // Функция для управления состоянием загрузки с минимальной задержкой
  const handleLoading = useCallback((loading: boolean) => {
    if (loading) {
      setShowLoader(true);
      setIsLoading(true);
      // Устанавливаем минимальное время отображения лоадера
      loadingTimerRef.current = setTimeout(() => {
        setShowLoader(false);
      }, 2000);
    } else {
      setIsLoading(false);
      // Если прошло меньше 2 секунд, лоадер останется до истечения таймера
      if (!loadingTimerRef.current) {
        setShowLoader(false);
      }
    }
  }, []);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Функция для управления состоянием загрузки схемы с минимальной задержкой
  const handleSchemaLoading = useCallback((loading: boolean) => {
    if (loading) {
      setShowSchemaLoader(true);
      setIsLoadingSchema(true);
      // Устанавливаем минимальное время отображения лоадера
      schemaLoadingTimerRef.current = setTimeout(() => {
        setShowSchemaLoader(false);
      }, 3000);
    } else {
      setIsLoadingSchema(false);
      // Если прошло меньше 3 секунд, лоадер останется до истечения таймера
      if (!schemaLoadingTimerRef.current) {
        setShowSchemaLoader(false);
      }
    }
  }, []);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (schemaLoadingTimerRef.current) {
        clearTimeout(schemaLoadingTimerRef.current);
      }
    };
  }, []);

  // Функция для загрузки схемы БД
  const fetchDbSchema = async () => {
    handleSchemaLoading(true);
    setSchemaError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Необходима авторизация');
      }

      const response = await fetch(`https://sqlhunt.com:8000/api/cases/${number}/schema/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить схему базы данных');
      }

      if (!Array.isArray(data)) {
        throw new Error('Некорректный формат данных схемы');
      }
      
      setDbSchema(data);
    } catch (err) {
      console.error('Schema fetch error:', err);
      setSchemaError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      handleSchemaLoading(false);
    }
  };

  // Загружаем схему БД при переключении на соответствующую вкладку
  useEffect(() => {
    if (activeTab === "Схема БД" && !dbSchema && !isLoadingSchema) {
      fetchDbSchema();
    }
  }, [activeTab, dbSchema, isLoadingSchema, number]);

  // Функция для создания узлов и рёбер для React Flow
  const createGraphElements = useCallback((schema: any[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const spacing = { x: 400, y: 400 }; // Увеличиваем расстояние между таблицами
    const maxColumns = 3;

    schema.forEach((table, tableIndex) => {
      const column = tableIndex % maxColumns;
      const row = Math.floor(tableIndex / maxColumns);

      // Добавляем узел для таблицы с увеличенным расстоянием
      newNodes.push({
        id: table.tableName,
        position: { 
          x: column * spacing.x + 50, 
          y: row * spacing.y + 50 
        },
        data: {
          tableName: table.tableName,
          columns: table.columns
        },
        type: 'tableNode',
        style: { width: 280 }
      });

      // Создаем рёбра для связей между таблицами
      table.foreignKeys.forEach((fk: ForeignKey) => {
        // Находим индекс колонки с внешним ключом
        const sourceColumnIndex = table.columns.findIndex((col: Column) => col.name === fk.fromColumn);
        
        // Находим целевую таблицу и индекс её первичного ключа
        const targetTable = schema.find((t: { tableName: string; columns: Column[] }) => t.tableName === fk.toTable);
        const targetColumnIndex = targetTable?.columns.findIndex((col: Column) => col.name === fk.toColumn) ?? 0;

        newEdges.push({
          id: `${table.tableName}-${fk.toTable}-${fk.fromColumn}`,
          source: fk.toTable, // Меняем местами source и target
          target: table.tableName,
          sourceHandle: `${fk.toTable}-${fk.toColumn}-source`,
          targetHandle: `${table.tableName}-${fk.fromColumn}-target`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#FF8A00' },
          labelStyle: { fill: '#FF8A00', fontFamily: 'var(--font-rationalist-light)' },
          label: `${fk.fromColumn} → ${fk.toColumn}`
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  // Обновляем элементы графа при изменении схемы
  useEffect(() => {
    if (dbSchema && schemaViewMode === 'graphic') {
      createGraphElements(dbSchema);
    }
  }, [dbSchema, schemaViewMode, createGraphElements]);

  // Обновляем высоту при изменении контента
  useEffect(() => {
    if (resultContentRef.current && !isResultCollapsed) {
      setContentHeight(resultContentRef.current.scrollHeight);
    }
  }, [queryResult, error, isResultCollapsed]);

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
    
    handleLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Необходима авторизация. Пожалуйста, войдите в систему.');
      }

      window.console.log('[SQL Execute] Отправка запроса...');
      
      // Отправляем запрос на сервер
      const response = await fetch(`https://sqlhunt.com:8000/api/cases/${number}/execute-sql/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ sql: sqlQuery }),
      });

      window.console.log(`[SQL Execute] Статус ответа:`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      // Получаем текст ответа
      const responseText = await response.text();
      window.console.log('[SQL Execute] Полученный ответ (текст):', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        window.console.log('[SQL Execute] Распарсенные данные:', data);
      } catch (e) {
        window.console.error('[SQL Execute] Ошибка при разборе JSON:', e);
        throw new Error('Получен некорректный ответ от сервера');
      }

      // Проверяем ошибки
      if (!response.ok && response.status !== 202) {
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите в систему заново.');
        } else if (response.status === 403) {
          throw new Error('Нет доступа к выполнению запросов. Пожалуйста, войдите в систему заново.');
        } else {
          throw new Error(data.error || data.detail || `Ошибка сервера: ${response.status}`);
        }
      }

      if (!data || !data.task_id) {
        throw new Error('Сервер не вернул идентификатор задачи');
      }

      // Получаем task_id и начинаем опрашивать статус
      const taskId = data.task_id;
      window.console.log('[Task Status] Начинаем опрос статуса для task_id:', taskId);
      
      let queryResult = null;
      let attempts = 0;
      const maxAttempts = 60;
      const retryDelay = 500;

      // Основной цикл опроса статуса
      while (attempts < maxAttempts) {
        try {
          window.console.log(`[Task Status] Попытка ${attempts + 1}/${maxAttempts} для задачи ${taskId}`);
          
          const statusResponse = await fetch(`https://sqlhunt.com:8000/api/tasks/${taskId}/status/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });

          if (!statusResponse.ok) {
            window.console.error('[Task Status] Ошибка при получении статуса:', {
              status: statusResponse.status,
              statusText: statusResponse.statusText
            });
            const statusError = await statusResponse.json().catch(() => ({}));
            throw new Error(statusError.error || `Ошибка при получении статуса задачи: ${statusResponse.status}`);
          }

          const statusResponseText = await statusResponse.text();
          let statusData;
          try {
            statusData = JSON.parse(statusResponseText);
            window.console.log('[Task Status] Получен статус:', {
              taskId,
              status: statusData.status,
              hasResult: !!statusData.result,
              attempt: attempts + 1
            });
          } catch (e) {
            window.console.error('[Task Status] Ошибка при разборе JSON:', e);
            window.console.error('[Task Status] Текст ответа:', statusResponseText);
            throw new Error('Получен некорректный ответ при проверке статуса');
          }

          if (statusData.status === 'SUCCESS') {
            if (!statusData.result) {
              throw new Error('Получен пустой результат от сервера');
            }
            
            if (statusData.result.error) {
              throw new Error(statusData.result.error);
            }

            if (!Array.isArray(statusData.result.columns) || !Array.isArray(statusData.result.rows)) {
              throw new Error('Некорректный формат результата запроса');
            }

            queryResult = statusData.result;
            window.console.log('[Task Status] Задача успешно завершена');
            break;
          } else if (statusData.status === 'FAILURE') {
            throw new Error(statusData.error || 'Задача завершилась с ошибкой');
          } else if (statusData.status === 'PENDING' || statusData.status === 'STARTED') {
            window.console.log(`[Task Status] Задача ${statusData.status}, ожидаем...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            attempts++;
            continue;
          } else {
            throw new Error(`Неизвестный статус задачи: ${statusData.status}`);
          }
        } catch (error) {
          window.console.error(`[Task Status] Ошибка при попытке ${attempts + 1}:`, error);
          
          if (attempts >= maxAttempts - 1) {
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          attempts++;
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error('Превышено время ожидания ответа от сервера');
      }

      if (!queryResult) {
        throw new Error('Не удалось получить результат выполнения запроса');
      }

      window.console.log('[Task Status] Запрос успешно выполнен:', {
        taskId,
        columnsCount: queryResult.columns.length,
        rowsCount: queryResult.rows.length
      });

      setQueryResult(queryResult);
      setError(null);
    } catch (err) {
      window.console.error('[Error] Ошибка выполнения запроса:', err);
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
      setQueryResult(null);
    } finally {
      handleLoading(false);
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
        <div className="mb-6">
          <p className="text-lg whitespace-pre-line" style={{ 
            fontFamily: "var(--font-rationalist-light)",
            lineHeight: "1.6"
          }}>
            {normalizeText(description)}
          </p>
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
      <div className={`${activeTab === "Схема БД" ? 'h-auto' : 'h-auto'} p-4 bg-transparent`}>
        {activeTab === "SQL-запросы" && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4" style={{ height: '300px' }}>
              {/* Панель для SQL-запроса (слева) */}
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

              {/* Краткая схема БД (справа) */}
              <div className="flex flex-col w-1/2">
                <div className="flex justify-between items-center pr-1" style={{ backgroundColor: 'rgba(255, 168, 16, 0.4)' }}>
                  <div className="p-2 font-bold text-black" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                    Схема БД (краткая)
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-[#241C13] p-4">
                  {showSchemaLoader || isLoadingSchema ? (
                    <div className="text-white text-center py-4" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                      Загрузка схемы...
                    </div>
                  ) : schemaError ? (
                    <div className="text-red-500 py-4" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                      {schemaError}
                    </div>
                  ) : dbSchema ? (
                    <div className="space-y-4">
                      {dbSchema.map((table, tableIndex) => (
                        <div key={tableIndex} className="border border-[rgba(255,168,16,0.4)] p-2 rounded">
                          <h4 className="text-[rgba(255,168,16,0.8)] font-bold mb-1" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
                            {table.tableName}
                          </h4>
                          <div className="text-white text-sm space-y-1">
                            {table.columns.map((col, colIndex) => (
                              <div key={colIndex} className="flex items-center gap-2">
                                <span>{col.name}</span>
                                {col.isPrimary && <span title="Первичный ключ" className="text-[#FF8A00]">🔑</span>}
                                {col.isForeign && <span title="Внешний ключ" className="text-[#FF8A00]">🔗</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                      Схема не загружена
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Панель результата запроса (внизу на всю ширину) */}
            <div className="flex flex-col">
              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-[rgba(255,168,16,0.5)] transition-colors duration-200" 
                style={{ backgroundColor: 'rgba(255, 168, 16, 0.4)' }}
                onClick={toggleResultPanel}
              >
                <div className="p-2 font-bold text-black" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                  Результат {error ? '(Ошибка)' : ''}
                </div>
                <button 
                  className={`px-3 py-1 m-1 text-black transition-transform duration-300 ${isResultCollapsed ? '' : 'rotate-180'}`} 
                  style={{ background: 'none', fontFamily: "var(--font-rationalist-light)" }}
                >
                  <ChevronDown className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
              
              <div 
                className="transition-all duration-300 ease-in-out"
                style={{ 
                  height: isResultCollapsed ? '0' : (contentHeight ? `${contentHeight}px` : 'auto'),
                  opacity: isResultCollapsed ? 0 : 1,
                  overflow: 'hidden',
                  backgroundColor: '#241C13',
                  transformOrigin: 'top',
                }}
              >
                <div ref={resultContentRef} className="p-4">
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

        {activeTab === "Схема БД" && (
          <div className="w-full">
            {showSchemaLoader || isLoadingSchema ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader />
              </div>
            ) : schemaError ? (
              <div className="text-red-500 py-4" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                {schemaError}
              </div>
            ) : dbSchema ? (
              <div>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setSchemaViewMode('table')}
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-black rounded ${
                      schemaViewMode === 'table' ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    Таблица
                  </button>
                  <button
                    onClick={() => setSchemaViewMode('graphic')}
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-black rounded ${
                      schemaViewMode === 'graphic' ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                    График
                  </button>
                </div>

                {schemaViewMode === 'table' ? (
                  <div className="space-y-8">
                    {dbSchema.map((table, tableIndex) => (
                      <div key={tableIndex}>
                        <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
                          Таблица: {table.tableName}
                        </h3>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-[rgba(255,168,16,0.4)]">
                              <th className="p-2 text-left border border-black" style={{ fontFamily: "var(--font-rationalist-bold)" }}>Колонка</th>
                              <th className="p-2 text-left border border-black" style={{ fontFamily: "var(--font-rationalist-bold)" }}>Тип данных</th>
                              <th className="p-2 text-left border border-black" style={{ fontFamily: "var(--font-rationalist-bold)" }}>Первичный ключ</th>
                              <th className="p-2 text-left border border-black" style={{ fontFamily: "var(--font-rationalist-bold)" }}>Внешний ключ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.map((column, columnIndex) => (
                              <tr key={columnIndex} className={columnIndex % 2 === 0 ? 'bg-[rgba(255,168,16,0.1)]' : ''}>
                                <td className="p-2 border border-black" style={{ fontFamily: "var(--font-rationalist-light)" }}>{column.name}</td>
                                <td className="p-2 border border-black" style={{ fontFamily: "var(--font-rationalist-light)" }}>{column.type}</td>
                                <td className="p-2 border border-black" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                                  {column.isPrimary ? 'Да' : 'Нет'}
                                </td>
                                <td className="p-2 border border-black" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                                  {column.isForeign ? 'Да' : 'Нет'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ height: '600px' }} className="border-2 border-black rounded">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      nodeTypes={nodeTypes}
                      fitView
                      className="bg-gray-50"
                    >
                      <Background />
                      <Controls />
                      <MiniMap />
                    </ReactFlow>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4" style={{ fontFamily: "var(--font-rationalist-light)" }}>
                Нет данных о схеме базы данных
              </div>
            )}
          </div>
        )}

        {/* ... other tabs content ... */}
      </div>
    </div>
  );
}); 