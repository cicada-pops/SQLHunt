import Link from "next/link"
import Image from "next/image"
import { X, Play, ChevronUp, ChevronDown } from "lucide-react"
import { memo, useState, useRef, useEffect } from "react"
import { useAuth } from "../contexts/auth-context"

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
    number: string
    title: string
    description: string
    fullDescription?: string
    investigationPlan?: string
    requiredExp: number
    rewardXp: number
  }) => void
}

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const isLocked = userExp < requiredExp
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleOpenCase = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isLocked) {
      return
    }
    
    if (onExpandCase) {
      onExpandCase(true, { 
        number, 
        title, 
        description, 
        fullDescription, 
        investigationPlan, 
        requiredExp, 
        rewardXp 
      })
    } else {
      setIsExpanded(true)
    }
  }

  const handleCloseCase = () => {
    setIsExpanded(false)
    if (onExpandCase) {
      onExpandCase(false, { 
        number, 
        title, 
        description, 
        fullDescription, 
        investigationPlan, 
        requiredExp, 
        rewardXp 
      })
    }
  }

  if (isExpanded && onExpandCase) {
    return (
      <div 
        className={`relative border border-black p-6 h-auto bg-transparent ${className}`}
        style={{ 
          opacity: 0, 
          transition: 'opacity 0.3s ease-out', 
          minHeight: '230px' 
        }}
      >
        {isMarked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image 
              src="/images/close.png" 
              alt="Зачеркнуто" 
              width={200} 
              height={200} 
              style={{ 
                objectFit: 'contain', 
                width: '70%', 
                height: 'auto' 
              }} 
            />
          </div>
        )}

        <div className="relative z-10">
          <div className="mb-4 border-b border-black pb-2">
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
              Дело №{number}: {title}
            </h3>
          </div>

          <p 
            className="text-base mb-6 text-justify leading-relaxed" 
            style={{ fontFamily: "var(--font-rationalist-light)" }}
          >
            {description}
          </p>

          <div className="text-right">
            <span 
              className="inline-block relative font-bold text-lg"
              style={{ fontFamily: "var(--font-rationalist-demibold)" }}
            >
              <span>Рассмотреть дело →</span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div 
        className={`relative border border-black p-6 h-auto bg-transparent ${className}`}
        style={{ 
          minHeight: '230px', 
          opacity: isLocked ? 0.4 : isMarked ? 0.6 : 1,
          filter: isLocked ? 'grayscale(100%)' : 'none'
        }}
      >
        {isMarked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image 
              src="/images/close.png" 
              alt="Зачеркнуто" 
              width={200} 
              height={200} 
              style={{ 
                objectFit: 'contain', 
                width: '70%', 
                height: 'auto' 
              }} 
            />
          </div>
        )}

        <div className="relative z-10">
          <div className="mb-4 border-b border-black pb-2">
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
              Дело №{number}: {title}
            </h3>
          </div>

          {isLocked ? (
            <div className="text-center py-6">
              <p 
                className="text-base mb-2" 
                style={{ fontFamily: "var(--font-rationalist-light)" }}
              >
                Требуется опыта: {requiredExp}
              </p>
              <p 
                className="text-base" 
                style={{ fontFamily: "var(--font-rationalist-light)" }}
              >
                🔒 Дело заблокировано
              </p>
            </div>
          ) : (
            <>
              <p 
                className="text-base mb-6 text-justify leading-relaxed" 
                style={{ fontFamily: "var(--font-rationalist-light)" }}
              >
                {description}
              </p>
              <div className="text-right">
                <span 
                  className="inline-block relative font-bold text-lg group"
                  style={{ fontFamily: "var(--font-rationalist-demibold)" }}
                >
                  <span>Рассмотреть дело →</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        className={`relative border border-black p-6 h-auto bg-transparent ${isLocked ? 'group' : ''} ${className}`}
        style={{
          transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
          opacity: isExpanded && onExpandCase ? 0 : isLocked ? 0.4 : isMarked ? 0.6 : 1,
          minHeight: '230px',
          filter: isLocked ? 'grayscale(100%)' : 'none',
          cursor: isLocked ? 'not-allowed' : 'pointer'
        }}
      >
        {isMarked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image 
              src="/images/close.png" 
              alt="Зачеркнуто" 
              width={200} 
              height={200} 
              style={{ 
                objectFit: 'contain', 
                width: '70%', 
                height: 'auto' 
              }} 
            />
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="bg-black text-white text-base px-6 py-3 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ fontFamily: "var(--font-rationalist-light)" }}
            >
              Требуется {requiredExp} опыта
            </div>
          </div>
        )}

        <div className="relative z-10">
          <div className="mb-4 border-b border-black pb-2">
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
              Дело №{number}: {title}
            </h3>
          </div>

          <p 
            className="text-base mb-6 text-justify leading-relaxed" 
            style={{ fontFamily: "var(--font-rationalist-light)" }}
          >
            {description}
          </p>

          <div className="text-right">
            {isLocked ? (
              <div className="relative">
                <span 
                  className="inline-block relative font-bold text-lg text-gray-500"
                  style={{ fontFamily: "var(--font-rationalist-demibold)" }}
                >
                  <span>Рассмотреть дело →</span>
                </span>
              </div>
            ) : (
              <Link 
                href="#" 
                onClick={handleOpenCase}
                className="inline-block relative font-bold text-lg"
                style={{ fontFamily: "var(--font-rationalist-demibold)" }}
              >
                <span className="view-case-link inline-block cursor-pointer hover:opacity-80">
                  Рассмотреть дело →
                  <span 
                    className="absolute left-0 bottom-0 w-0 h-[1px] bg-black view-case-link-hover" 
                    style={{ transition: "width 0.3s ease-in-out" }}
                  />
                </span>
              </Link>
            )}
          </div>
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-transparent" />
        )}
      </div>

      {isExpanded && !onExpandCase && !isLocked && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8" 
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
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
  )
})

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
  number: string
  title: string
  description: string
  fullDescription?: string
  investigationPlan?: string
  rewardXp: number
  onClose: () => void
  className?: string
}) {
  const tabs = ["SQL-запросы", "Схема БД", "Заметки", "Ответы"]
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [isClosing, setIsClosing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isResultCollapsed, setIsResultCollapsed] = useState(false)
  const [sqlQuery, setSqlQuery] = useState("")
  const [queryResult, setQueryResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 500)
  }

  const toggleResultPanel = () => {
    setIsResultCollapsed(!isResultCollapsed)
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSqlQuery(e.target.value)
  }

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      setError("SQL запрос не может быть пустым")
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Необходима авторизация')
      }

      const response = await fetch(`https://sqlhunt.com:8000/api/cases/${number}/execute-sql/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sql: sqlQuery }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка выполнения запроса')
      }

      const taskId = data.task_id
      let result = null

      while (true) {
        const statusResponse = await fetch(`https://sqlhunt.com:8000/api/tasks/${taskId}/status/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const statusData = await statusResponse.json()

        if (statusData.status === 'SUCCESS') {
          result = statusData.result
          break
        } else if (statusData.status === 'FAILURE') {
          throw new Error(statusData.error || 'Задача завершилась с ошибкой')
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (result && result.error) {
        throw new Error(result.error)
      }

      setQueryResult(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка')
      setQueryResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      ref={contentRef}
      className={`border-2 border-black p-8 w-full h-auto bg-transparent backdrop-blur-none ${className}`}
      style={{ 
        animation: isClosing ? "collapseCard 0.5s ease-out forwards" : "expandCard 0.5s ease-out",
        fontFamily: "var(--font-rationalist-light)",
      }}
    >
      <button 
        onClick={handleClose}
        className="flex items-center mb-8 font-bold text-lg hover:underline"
        style={{ fontFamily: "var(--font-rationalist-demibold)" }}
      >
        ← Назад к делам
      </button>

      <div className="mb-10 border-b-2 border-black pb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
            Дело №{number}: {title}
          </h2>
          <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
            Награда: {rewardXp} XP
          </div>
        </div>

        {fullDescription && (
          <div className="mb-8">
            <p 
              className="text-lg leading-relaxed whitespace-pre-wrap" 
              style={{ fontFamily: "var(--font-rationalist-light)" }}
            >
              {fullDescription}
            </p>
          </div>
        )}

        {description && description !== fullDescription && (
          <div className="mb-8">
            <p 
              className="text-lg leading-relaxed" 
              style={{ fontFamily: "var(--font-rationalist-light)" }}
            >
              {description}
            </p>
          </div>
        )}

        {investigationPlan && (
          <div className="mt-8">
            <h4 
              className="text-2xl font-bold mb-4" 
              style={{ fontFamily: "var(--font-rationalist-bold)" }}
            >
              План расследования:
            </h4>
            <div 
              className="text-lg leading-relaxed whitespace-pre-wrap" 
              style={{ fontFamily: "var(--font-rationalist-light)" }}
            >
              {investigationPlan}
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex border-b border-black">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 text-lg font-bold ${
                activeTab === tab ? 'bg-black text-white' : 'hover:bg-gray-200'
              }`}
              style={{ fontFamily: "var(--font-rationalist-bold)" }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[50vh] p-6 overflow-y-auto bg-transparent">
        {activeTab === "SQL-запросы" && (
          <div className="flex h-full gap-6">
            <div className="flex flex-col w-1/2">
              <div 
                className="flex justify-between items-center px-4 py-3" 
                style={{ backgroundColor: 'rgba(255, 168, 16, 0.4)' }}
              >
                <div 
                  className="font-bold text-black text-lg" 
                  style={{ fontFamily: "var(--font-rationalist-light)" }}
                >
                  SQL запрос
                </div>
                <button 
                  className={`px-4 py-2 text-black flex items-center justify-center gap-2 text-base ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'rgba(255, 168, 16, 0.6)', 
                    fontFamily: "var(--font-rationalist-light)" 
                  }}
                  onClick={executeQuery}
                  disabled={isLoading}
                >
                  <Play className="w-4 h-4 stroke-[2]" />
                  {isLoading ? 'Выполняется...' : 'Выполнить'}
                </button>
              </div>

              <textarea
                className="flex-1 p-6 resize-none border-0 outline-none sql-textarea text-base"
                style={{ 
                  backgroundColor: '#241C13', 
                  color: '#FFFFFF', 
                  fontFamily: "var(--font-rationalist-light)" 
                }}
                placeholder="SELECT * FROM bla_bla_table ..."
                spellCheck="false"
                value={sqlQuery}
                onChange={handleQueryChange}
              />
            </div>

            <div className="flex flex-col w-1/2">
              <div 
                className="flex justify-between items-center px-4 py-3 cursor-pointer" 
                style={{ backgroundColor: 'rgba(255, 168, 16, 0.4)' }}
                onClick={toggleResultPanel}
              >
                <div 
                  className="font-bold text-black text-lg" 
                  style={{ fontFamily: "var(--font-rationalist-light)" }}
                >
                  Результат {error ? '(Ошибка)' : ''}
                </div>
                <button 
                  className="p-2 text-black" 
                  style={{ background: 'none', fontFamily: "var(--font-rationalist-light)" }}
                >
                  {isResultCollapsed ? (
                    <ChevronDown className="w-5 h-5 stroke-[2]" />
                  ) : (
                    <ChevronUp className="w-5 h-5 stroke-[2]" />
                  )}
                </button>
              </div>
              
              <div 
                className="flex-1 overflow-auto transition-all duration-300"
                style={{ 
                  maxHeight: isResultCollapsed ? '0' : '100%',
                  opacity: isResultCollapsed ? 0 : 1,
                  visibility: isResultCollapsed ? 'hidden' : 'visible',
                  backgroundColor: '#241C13'
                }}
              >
                <div className="p-6 h-full">
                  {error ? (
                    <div 
                      className="text-red-500 whitespace-pre-wrap text-base" 
                      style={{ fontFamily: "var(--font-rationalist-light)" }}
                    >
                      {error}
                    </div>
                  ) : queryResult ? (
                    <div className="text-white">
                      <table className="w-full text-base">
                        <thead>
                          <tr>
                            {queryResult.columns.map((column: string) => (
                              <th 
                                key={column} 
                                className="text-left p-3 border-b border-gray-600 font-bold"
                                style={{ fontFamily: "var(--font-rationalist-bold)" }}
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row: any[], rowIndex: number) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td 
                                  key={cellIndex} 
                                  className="p-3 border-b border-gray-600"
                                  style={{ fontFamily: "var(--font-rationalist-light)" }}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div 
                      className="text-gray-400 italic text-base" 
                      style={{ fontFamily: "var(--font-rationalist-light)" }}
                    >
                      Строк нет. Выполните запрос, чтобы увидеть результат.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}) 