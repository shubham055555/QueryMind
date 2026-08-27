import { useMemo, useState } from 'react'
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  Database,
  History,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'


// ============================================================
// CONFIG
// ============================================================

const API_BASE_URL = 'http://127.0.0.1:8000'


// ============================================================
// HELPERS
// ============================================================

function cleanSQL(sql) {
  if (!sql) return ''

  return sql
    .replace(/^```sql\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}


function formatValue(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  return String(value)
}


function isNumeric(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}


function prettyColumn(column) {
  return column
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}


// ============================================================
// RESULT SUMMARY
// ============================================================

function ResultSummary({ data }) {
  if (!data || data.length !== 1) {
    return null
  }

  const row = data[0]
  const columns = Object.keys(row)

  if (columns.length !== 1) {
    return null
  }

  const key = columns[0]
  const value = row[key]

  if (!isNumeric(value)) {
    return null
  }

  return (
    <div className="mt-5 grid max-w-sm grid-cols-1">
      <div className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent p-5">

        <div className="flex items-center justify-between">

          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {prettyColumn(key)}
          </span>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
            <BarChart3 size={15} />
          </div>

        </div>

        <div className="mt-3 text-4xl font-bold tracking-tight text-white">
          {formatValue(value)}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Database query result
        </p>

      </div>
    </div>
  )
}


// ============================================================
// RESULT TABLE
// ============================================================

function ResultTable({ data }) {
  if (!data || data.length === 0) {
    return null
  }

  // Single numeric result is already shown as KPI.
  if (
    data.length === 1 &&
    Object.keys(data[0]).length === 1 &&
    isNumeric(Object.values(data[0])[0])
  ) {
    return null
  }

  const columns = Object.keys(data[0])

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#080d17]">

      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.025] px-4 py-3">

        <div className="flex items-center gap-2">
          <Database
            size={14}
            className="text-indigo-300"
          />

          <span className="text-xs font-semibold text-slate-400">
            Query Results
          </span>
        </div>

        <span className="text-[11px] text-slate-600">
          {data.length} row{data.length !== 1 ? 's' : ''}
        </span>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full min-w-max text-left text-sm">

          <thead>

            <tr className="border-b border-white/10 bg-white/[0.02]">

              {columns.map((column) => (

                <th
                  key={column}
                  className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  {prettyColumn(column)}
                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {data.map((row, rowIndex) => (

              <tr
                key={rowIndex}
                className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.025]"
              >

                {columns.map((column) => (

                  <td
                    key={column}
                    className="whitespace-nowrap px-5 py-4 text-slate-300"
                  >
                    {formatValue(row[column])}
                  </td>

                ))}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}


// ============================================================
// CHART ANALYZER
// ============================================================

function analyzeChartData(data) {
  if (!data || data.length < 2) {
    return null
  }

  const columns = Object.keys(data[0])

  const numericColumns = columns.filter((column) =>
    data.every((row) => isNumeric(row[column]))
  )

  const labelColumns = columns.filter((column) =>
    data.every(
      (row) =>
        typeof row[column] === 'string' ||
        typeof row[column] === 'number'
    )
  )

  if (numericColumns.length === 0) {
    return null
  }

  const numericColumn = numericColumns[0]

  const labelColumn =
    labelColumns.find(
      (column) =>
        column !== numericColumn &&
        (
          column.toLowerCase().includes('name') ||
          column.toLowerCase().includes('status') ||
          column.toLowerCase().includes('category') ||
          column.toLowerCase().includes('month') ||
          column.toLowerCase().includes('date') ||
          column.toLowerCase().includes('city') ||
          column.toLowerCase().includes('product')
        )
    ) ||
    labelColumns.find(
      (column) => column !== numericColumn
    )

  if (!labelColumn) {
    return null
  }

  const rows = data.slice(0, 10).map((row) => ({
    name: String(row[labelColumn]),
    value: Number(row[numericColumn]),
  }))

  const lowerLabel = labelColumn.toLowerCase()

  let chartType = 'bar'

  if (
    lowerLabel.includes('month') ||
    lowerLabel.includes('date') ||
    lowerLabel.includes('year') ||
    lowerLabel.includes('time')
  ) {
    chartType = 'line'
  }

  if (
    lowerLabel.includes('status') ||
    lowerLabel.includes('category') ||
    lowerLabel.includes('type')
  ) {
    chartType = 'pie'
  }

  return {
    chartType,
    labelColumn,
    numericColumn,
    rows,
  }
}


// ============================================================
// TOOLTIP
// ============================================================

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b111d] px-3 py-2 shadow-xl">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {formatValue(payload[0].value)}
      </p>

    </div>
  )
}


// ============================================================
// RESULT CHART
// ============================================================

function ResultChart({ data }) {
  const chartData = useMemo(
    () => analyzeChartData(data),
    [data]
  )

  if (!chartData) {
    return null
  }

  const {
    chartType,
    labelColumn,
    numericColumn,
    rows,
  } = chartData

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#080d17]">

      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">

        <div className="flex items-center gap-2">

          <BarChart3
            size={15}
            className="text-indigo-300"
          />

          <div>

            <span className="text-xs font-semibold text-slate-300">
              Visualization
            </span>

            <p className="mt-0.5 text-[10px] text-slate-600">
              {prettyColumn(numericColumn)} by{' '}
              {prettyColumn(labelColumn)}
            </p>

          </div>

        </div>

        <span className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-1 text-[10px] uppercase tracking-wider text-slate-600">
          {chartType}
        </span>

      </div>


      <div className="h-[300px] w-full p-4">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          {chartType === 'line' ? (

            <LineChart
              data={rows}
              margin={{
                top: 10,
                right: 15,
                left: 0,
                bottom: 5,
              }}
            >

              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              <Line
                type="monotone"
                dataKey="value"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />

            </LineChart>

          ) : chartType === 'pie' ? (

            <PieChart>

              <Tooltip
                content={<CustomTooltip />}
              />

              <Pie
                data={rows}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={55}
                paddingAngle={3}
              >

                {rows.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                  />
                ))}

              </Pie>

            </PieChart>

          ) : (

            <BarChart
              data={rows}
              margin={{
                top: 10,
                right: 15,
                left: 0,
                bottom: 5,
              }}
            >

              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
              >

                {rows.map((entry, index) => (
                  <Cell
                    key={`bar-cell-${index}`}
                  />
                ))}

              </Bar>

            </BarChart>

          )}

        </ResponsiveContainer>

      </div>

    </div>
  )
}


// ============================================================
// SQL VIEWER
// ============================================================

function SQLViewer({ sql }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!sql) {
    return null
  }

  const cleanedSQL = cleanSQL(sql)

  const copySQL = async () => {

    try {

      await navigator.clipboard.writeText(
        cleanedSQL
      )

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)

    } catch (error) {

      console.error(
        'Unable to copy SQL:',
        error
      )

    }

  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#080d17]">

      <div className="flex items-center justify-between px-4 py-3">

        <button
          onClick={() =>
            setOpen((value) => !value)
          }
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white"
        >

          <span className="h-2 w-2 rounded-full bg-indigo-400" />

          Generated SQL

          {open ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}

        </button>


        <button
          onClick={copySQL}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
        >

          {copied ? (
            <>
              <Check size={12} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy SQL
            </>
          )}

        </button>

      </div>


      {open && (

        <pre className="overflow-x-auto border-t border-white/10 p-5 text-sm leading-7 text-indigo-200">

          <code>
            {cleanedSQL}
          </code>

        </pre>

      )}

    </div>
  )
}


// ============================================================
// MESSAGE
// ============================================================

function Message({ message }) {

  if (message.type === 'user') {

    return (
      <div className="flex justify-end">

        <div className="max-w-xl rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-3.5 shadow-lg shadow-indigo-900/20">

          <p className="text-sm leading-6">
            {message.text}
          </p>

        </div>

      </div>
    )
  }


  return (
    <div className="flex gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-indigo-300">
        Q
      </div>


      <div className="max-w-4xl rounded-2xl rounded-tl-md border border-white/10 bg-[#0b111d] px-5 py-4 shadow-lg">

        <div className="mb-2 flex items-center gap-2">

          <span className="text-xs font-semibold text-indigo-300">
            QueryMind
          </span>

          <span className="text-[10px] text-slate-600">
            AI response
          </span>

        </div>


        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
          {message.text}
        </p>


        <ResultSummary
          data={message.data}
        />

        <ResultChart
          data={message.data}
        />

        <ResultTable
          data={message.data}
        />

        <SQLViewer
          sql={message.sql}
        />

      </div>

    </div>
  )
}


// ============================================================
// MAIN APP
// ============================================================

function App() {

  const [question, setQuestion] = useState('')

  const [messages, setMessages] = useState([])

  const [history, setHistory] = useState([])

  const [loading, setLoading] = useState(false)

  const [clarification, setClarification] =
    useState(null)

  const [error, setError] = useState('')

  const [sidebarOpen, setSidebarOpen] =
    useState(false)


  // ==========================================================
  // BUILD CONVERSATION FOR BACKEND
  // ==========================================================

  const buildConversation = () => {

    return messages.map((message) => ({

      role:
        message.type === 'user'
          ? 'user'
          : 'assistant',

      content:
        message.text || '',

    })).filter(
      (message) =>
        message.content.trim().length > 0
    )
  }


  // ==========================================================
  // ASK QUESTION
  // ==========================================================

  const askQuestion = async () => {

    if (!question.trim() || loading) {
      return
    }

    const userQuestion =
      question.trim()


    // Save current conversation BEFORE
    // adding the new question.
    const conversation =
      buildConversation()


    // Add user message to UI
    setMessages((prev) => [

      ...prev,

      {
        type: 'user',
        text: userQuestion,
      },

    ])


    // Add history
    setHistory((prev) => [

      {
        question: userQuestion,

        time:
          new Date().toLocaleTimeString(
            [],
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),
      },

      ...prev,

    ])


    setQuestion('')

    setLoading(true)

    setError('')

    setClarification(null)


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/api/query`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body: JSON.stringify({

              question:
                userQuestion,

              conversation,

            }),

          }
        )


      if (!response.ok) {

        let errorMessage =
          `API request failed: ${response.status}`

        try {

          const errorData =
            await response.json()

          if (errorData?.detail) {
            errorMessage =
              errorData.detail
          }

        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(
          errorMessage
        )
      }


      const data =
        await response.json()


      // ======================================================
      // CLARIFICATION REQUIRED
      // ======================================================

      if (
        data.status ===
        'clarification_required'
      ) {

        const clarificationData = {

          originalQuestion:
            userQuestion,

          message:
            data.message ||
            data.clarification_question ||
            'Please clarify your request.',

          options:
            Array.isArray(data.options)
              ? data.options
              : [],

        }


        setClarification(
          clarificationData
        )


        setMessages((prev) => [

          ...prev,

          {
            type: 'ai',

            text:
              clarificationData.message,
          },

        ])

        return
      }


      // ======================================================
      // COMPLETED
      // ======================================================

      if (
        data.status ===
        'completed'
      ) {

        setMessages((prev) => [

          ...prev,

          {
            type: 'ai',

            text:
              data.answer ||
              'Query completed successfully.',

            data:
              Array.isArray(data.data)
                ? data.data
                : [],

            sql:
              data.sql || '',

          },

        ])

        return
      }


      // ======================================================
      // ERROR RESPONSE
      // ======================================================

      if (
        data.status === 'error'
      ) {

        setError(
          data.answer ||
          'QueryMind could not execute the query.'
        )

        return
      }


      throw new Error(
        'Unexpected API response.'
      )

    } catch (err) {

      console.error(
        'QueryMind request error:',
        err
      )


      setError(
        err.message ||
        'Unable to connect to QueryMind backend.'
      )

    } finally {

      setLoading(false)

    }

  }


  // ==========================================================
  // CLARIFICATION SELECTION
  // ==========================================================

  const selectClarification =
    async (option) => {

      if (
        !clarification ||
        loading
      ) {
        return
      }


      // IMPORTANT:
      // Include current conversation + original
      // clarification question.

      const conversation =
        buildConversation()


      setLoading(true)

      setError('')


      // Show user's selected option
      setMessages((prev) => [

        ...prev,

        {
          type: 'user',
          text: option,
        },

      ])


      try {

        const response =
          await fetch(
            `${API_BASE_URL}/api/query/clarify`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',
              },

              body: JSON.stringify({

                original_question:
                  clarification.originalQuestion,

                selected_option:
                  option,

                conversation,

              }),

            }
          )


        if (!response.ok) {

          let errorMessage =
            `Clarification request failed: ${response.status}`

          try {

            const errorData =
              await response.json()

            if (errorData?.detail) {
              errorMessage =
                errorData.detail
            }

          } catch {
            // Ignore parsing error
          }

          throw new Error(
            errorMessage
          )
        }


        const data =
          await response.json()


        if (
          data.status ===
          'completed'
        ) {

          setMessages((prev) => [

            ...prev,

            {
              type: 'ai',

              text:
                data.answer ||
                'Query completed successfully.',

              data:
                Array.isArray(data.data)
                  ? data.data
                  : [],

              sql:
                data.sql || '',

            },

          ])


          setClarification(null)

        } else if (
          data.status ===
          'clarification_required'
        ) {

          setClarification({
            originalQuestion:
              clarification.originalQuestion,

            message:
              data.message ||
              'Please clarify your request.',

            options:
              data.options || [],

          })

        } else {

          throw new Error(
            'Unexpected clarification response.'
          )

        }

      } catch (err) {

        console.error(
          'Clarification error:',
          err
        )


        setError(
          err.message ||
          'Something went wrong while processing your selection.'
        )

      } finally {

        setLoading(false)

      }

    }


  // ==========================================================
  // CLEAR CHAT
  // ==========================================================

  const clearChat = () => {

    setMessages([])

    setClarification(null)

    setError('')

    setQuestion('')

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#070b14] text-white">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[140px]" />

        <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[130px]" />

      </div>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b14]/85 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold shadow-lg shadow-indigo-500/20"
            >
              Q
            </button>


            <div>

              <h1 className="text-base font-semibold tracking-tight">
                QueryMind
              </h1>

              <p className="text-[11px] text-slate-500">
                Conversational Text-to-SQL
              </p>

            </div>

          </div>


          <div className="flex items-center gap-3">

            {messages.length > 0 && (

              <button
                onClick={clearChat}
                className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-500 transition hover:bg-white/5 hover:text-white sm:flex"
              >

                <Trash2 size={13} />

                Clear

              </button>

            )}


            <div className="flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300">

              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

              Backend connected

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      {sidebarOpen && (

        <>

          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              setSidebarOpen(false)
            }
          />


          <aside className="fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-white/10 bg-[#090e18] shadow-2xl">

            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">

              <div className="flex items-center gap-2">

                <History
                  size={16}
                  className="text-indigo-300"
                />

                <span className="text-sm font-semibold">
                  Query History
                </span>

              </div>


              <button
                onClick={() =>
                  setSidebarOpen(false)
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
              >

                <X size={17} />

              </button>

            </div>


            <div className="flex-1 overflow-y-auto p-3">

              {history.length === 0 ? (

                <div className="flex h-full flex-col items-center justify-center px-6 text-center">

                  <Clock3
                    size={28}
                    className="mb-3 text-slate-700"
                  />

                  <p className="text-sm text-slate-500">
                    No queries yet
                  </p>

                  <p className="mt-1 text-xs text-slate-700">
                    Your recent queries will
                    appear here.
                  </p>

                </div>

              ) : (

                <div className="space-y-2">

                  {history.map(
                    (item, index) => (

                      <button
                        key={`${item.question}-${index}`}
                        onClick={() => {

                          setQuestion(
                            item.question
                          )

                          setSidebarOpen(false)

                        }}
                        className="w-full rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-indigo-400/20 hover:bg-indigo-500/5"
                      >

                        <div className="flex gap-3">

                          <MessageSquare
                            size={14}
                            className="mt-0.5 shrink-0 text-indigo-300"
                          />

                          <div className="min-w-0">

                            <p className="truncate text-xs text-slate-300">
                              {item.question}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-600">
                              {item.time}
                            </p>

                          </div>

                        </div>

                      </button>

                    )
                  )}

                </div>

              )}

            </div>


            <div className="border-t border-white/10 p-4">

              <button
                onClick={() => {

                  clearChat()

                  setSidebarOpen(false)

                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
              >

                <Trash2 size={14} />

                Clear conversation

              </button>

            </div>

          </aside>

        </>

      )}


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">

        {messages.length === 0 ? (

          <div className="flex flex-1 flex-col items-center justify-center">

            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/20">

              <Sparkles size={28} />

            </div>


            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/5 px-4 py-1.5 text-xs font-medium text-indigo-300">

              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />

              AI-powered database assistant

            </div>


            <h2 className="text-center text-4xl font-bold tracking-tight sm:text-6xl">

              Ask your database

              <span className="block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                anything.
              </span>

            </h2>


            <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-6 text-slate-400">

              QueryMind converts natural
              language into safe SQL, validates
              queries before execution, and
              returns understandable results.

            </p>


            <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">

              {[
                'How many customers are there?',
                'Show top 5 customers by spending',
                'How many orders are completed?',
              ].map((example) => (

                <button
                  key={example}
                  onClick={() =>
                    setQuestion(example)
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left text-xs text-slate-400 transition hover:border-indigo-400/30 hover:bg-indigo-500/5 hover:text-white"
                >

                  <Plus
                    size={13}
                    className="mb-2 text-indigo-300"
                  />

                  {example}

                </button>

              ))}

            </div>

          </div>

        ) : (

          <section className="flex-1 rounded-3xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-6">

            <div className="space-y-6">

              {messages.map(
                (message, index) => (

                  <Message
                    key={`${message.type}-${index}`}
                    message={message}
                  />

                )
              )}


              {/* =================================================
                  CLARIFICATION
              ================================================= */}

              {clarification && (

                <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/5 p-5 sm:ml-12">

                  <div className="mb-4 flex items-center gap-2">

                    <div className="h-2 w-2 rounded-full bg-indigo-400" />

                    <p className="text-sm font-medium text-slate-200">
                      Choose an option
                    </p>

                  </div>


                  <p className="mb-4 text-sm leading-6 text-slate-400">
                    {clarification.message}
                  </p>


                  <div className="grid gap-2.5">

                    {clarification.options.map(
                      (option, index) => (

                        <button
                          key={option}
                          onClick={() =>
                            selectClarification(
                              option
                            )
                          }
                          disabled={loading}
                          className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left text-sm text-slate-300 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-slate-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-300">

                            {index + 1}

                          </span>

                          {option}

                        </button>

                      )
                    )}

                  </div>

                </div>

              )}


              {/* =================================================
                  LOADING
              ================================================= */}

              {loading && (

                <div className="flex gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-indigo-300">
                    Q
                  </div>

                  <div className="rounded-2xl rounded-tl-md border border-white/10 bg-[#0b111d] px-5 py-4">

                    <div className="flex items-center gap-2 text-sm text-slate-400">

                      <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />

                      QueryMind is thinking...

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (

                <div className="flex items-center justify-between rounded-xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">

                  <span>
                    {error}
                  </span>

                  <button
                    onClick={() =>
                      setError('')
                    }
                    className="text-red-400/60 hover:text-red-300"
                  >

                    <X size={15} />

                  </button>

                </div>

              )}

            </div>

          </section>

        )}


        {/* =====================================================
            COMPOSER
        ===================================================== */}

        <div className="mt-5">

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#080d17] p-2 shadow-xl shadow-black/20">

            <input
              type="text"
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={(event) => {

                if (
                  event.key === 'Enter' &&
                  !event.shiftKey
                ) {

                  event.preventDefault()

                  askQuestion()

                }

              }}
              placeholder="Ask something about your database..."
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
            />


            <button
              onClick={askQuestion}
              disabled={
                !question.trim() ||
                loading
              }
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-medium shadow-lg shadow-indigo-900/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <Send size={14} />

              <span className="hidden sm:inline">

                {loading
                  ? 'Running...'
                  : 'Ask'}

              </span>

            </button>

          </div>


          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-600">

            <Database size={11} />

            QueryMind generates and validates
            SQL before execution.

          </div>

        </div>

      </main>

    </div>

  )
}


export default App