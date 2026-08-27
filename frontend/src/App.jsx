import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  History,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Table2,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import querymindLogo from "./assets/querymind-logo.png";
import SplineBackground from "./components/SplineBackground";


// ============================================================
// CONFIG
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// ============================================================
// HELPERS
// ============================================================

function cleanSQL(sql) {
  if (!sql) return "";

  return sql
    .replace(/^```sql\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}


function formatDate(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString([], {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}


function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  return value;
}


// ============================================================
// MAIN APP
// ============================================================

export default function App() {

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeView, setActiveView] = useState("query");

  // ----------------------------------------------------------
  // QUERY
  // ----------------------------------------------------------

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ----------------------------------------------------------
  // BACKEND
  // ----------------------------------------------------------

  const [backendConnected, setBackendConnected] =
    useState(false);

  // ----------------------------------------------------------
  // HISTORY
  // ----------------------------------------------------------

  const [history, setHistory] = useState([]);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  // ----------------------------------------------------------
  // ANALYTICS
  // ----------------------------------------------------------

  const [analytics, setAnalytics] =
    useState(null);

  const [loadingAnalytics, setLoadingAnalytics] =
    useState(false);

  // ----------------------------------------------------------
  // SQL
  // ----------------------------------------------------------

  const [copiedSQL, setCopiedSQL] =
    useState(null);

  const [expandedSQL, setExpandedSQL] =
    useState({});


  // ==========================================================
  // DATABASE SCHEMA
  // ==========================================================

  const databaseSchema = useMemo(
    () => [
      {
        name: "customers",
        columns: [
          ["customer_id", "SERIAL", "PRIMARY KEY"],
          ["name", "VARCHAR(100)", "NOT NULL"],
          ["email", "VARCHAR(150)", "UNIQUE, NOT NULL"],
          ["signup_date", "DATE", "NOT NULL"],
          ["city", "VARCHAR(100)", ""],
        ],
      },

      {
        name: "products",
        columns: [
          ["product_id", "SERIAL", "PRIMARY KEY"],
          ["name", "VARCHAR(150)", "NOT NULL"],
          ["category", "VARCHAR(100)", ""],
          ["price", "DECIMAL(10,2)", "NOT NULL"],
        ],
      },

      {
        name: "orders",
        columns: [
          ["order_id", "SERIAL", "PRIMARY KEY"],
          ["customer_id", "INTEGER", "FK → customers"],
          ["order_date", "DATE", "NOT NULL"],
          ["total_amount", "DECIMAL(10,2)", "NOT NULL"],
          ["status", "VARCHAR(50)", "NOT NULL"],
        ],
      },

      {
        name: "order_items",
        columns: [
          ["order_item_id", "SERIAL", "PRIMARY KEY"],
          ["order_id", "INTEGER", "FK → orders"],
          ["product_id", "INTEGER", "FK → products"],
          ["quantity", "INTEGER", "NOT NULL"],
          ["unit_price", "DECIMAL(10,2)", "NOT NULL"],
        ],
      },

      {
        name: "payments",
        columns: [
          ["payment_id", "SERIAL", "PRIMARY KEY"],
          ["order_id", "INTEGER", "FK → orders"],
          ["amount", "DECIMAL(10,2)", "NOT NULL"],
          ["payment_date", "DATE", "NOT NULL"],
          ["payment_status", "VARCHAR(50)", "NOT NULL"],
        ],
      },
    ],
    []
  );


  // ==========================================================
  // BACKEND HEALTH
  // ==========================================================

  async function checkBackend() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/health`
      );

      setBackendConnected(response.ok);

    } catch {
      setBackendConnected(false);
    }
  }


  // ==========================================================
  // LOAD HISTORY
  // ==========================================================

  async function loadHistory() {

    setLoadingHistory(true);

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/history?limit=50`
      );

      if (!response.ok) {
        throw new Error("Unable to load history.");
      }

      const result = await response.json();

      setHistory(
        Array.isArray(result.data)
          ? result.data
          : []
      );

    } catch (error) {

      console.error(
        "History error:",
        error
      );

    } finally {

      setLoadingHistory(false);

    }
  }


  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  async function loadAnalytics() {

    setLoadingAnalytics(true);

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/analytics`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load analytics."
        );
      }

      const result = await response.json();

      setAnalytics(
        result.data || null
      );

    } catch (error) {

      console.error(
        "Analytics error:",
        error
      );

      setAnalytics(null);

    } finally {

      setLoadingAnalytics(false);

    }
  }


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    checkBackend();

    loadHistory();

    const interval = setInterval(
      checkBackend,
      10000
    );

    return () =>
      clearInterval(interval);

  }, []);


  // ==========================================================
  // ANALYTICS LOAD
  // ==========================================================

  useEffect(() => {

    if (activeView === "analytics") {
      loadAnalytics();
    }

  }, [activeView]);


  // ==========================================================
  // NEW QUERY
  // ==========================================================

  function handleNewQuery() {

    setActiveView("query");

    setMessages([]);

    setQuestion("");

    setErrorMessage("");

    setSidebarOpen(false);

  }


  // ==========================================================
  // GET CONVERSATION
  // ==========================================================

  function buildConversation(extraMessage = null) {

    const currentMessages =
      extraMessage
        ? [...messages, extraMessage]
        : messages;

    return currentMessages.map(
      (message) => ({
        role: message.role,
        content: message.content,
      })
    );
  }


  // ==========================================================
  // SUBMIT QUERY
  // ==========================================================

  async function handleSubmit(event) {

    event?.preventDefault();

    const trimmed =
      question.trim();

    if (
      !trimmed ||
      loading
    ) {
      return;
    }

    setActiveView("query");

    setErrorMessage("");

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
      ]
    );

    setQuestion("");

    setLoading(true);


    try {

      const response = await fetch(
        `${API_BASE_URL}/api/query`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            question: trimmed,

            conversation:
              buildConversation(
                userMessage
              ),
          }),
        }
      );


      const result =
        await response.json();


      if (!response.ok) {

        const detail =
          result?.detail ||
          result?.message ||
          "Something went wrong while processing your query.";

        throw new Error(
          typeof detail === "string"
            ? detail
            : JSON.stringify(detail)
        );
      }


      // ------------------------------------------------------
      // CLARIFICATION
      // ------------------------------------------------------

      if (
        result.status ===
        "clarification_required"
      ) {

        setMessages(
          (previous) => [
            ...previous,

            {
              id:
                crypto.randomUUID(),

              role: "assistant",

              content:
                result.clarification_question ||
                result.message ||
                "Could you clarify your question?",

              clarification: true,

              options:
                result.options || [],
            },
          ]
        );

        return;
      }


      // ------------------------------------------------------
      // COMPLETED
      // ------------------------------------------------------

      if (
        result.status ===
        "completed"
      ) {

        setMessages(
          (previous) => [
            ...previous,

            {
              id:
                crypto.randomUUID(),

              role: "assistant",

              content:
                result.answer ||
                "Query completed successfully.",

              data:
                Array.isArray(
                  result.data
                )
                  ? result.data
                  : [],

              sql:
                cleanSQL(
                  result.sql ||
                  result.generated_sql
                ),

              status:
                "completed",
            },
          ]
        );

        await loadHistory();

        return;
      }


      throw new Error(
        "Unexpected response from QueryMind backend."
      );

    } catch (error) {

      console.error(
        "QueryMind error:",
        error
      );

      const message =
        error?.message ||
        "Something went wrong while processing your query.";

      setErrorMessage(message);

      setMessages(
        (previous) => [
          ...previous,

          {
            id:
              crypto.randomUUID(),

            role: "assistant",

            content:
              "Something went wrong while processing your query.",

            error: true,

            errorDetail:
              message,

            data: [],
          },
        ]
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // CLARIFICATION
  // ==========================================================

  async function handleClarification(
    originalQuestion,
    selectedOption
  ) {

    if (loading) {
      return;
    }

    setLoading(true);

    setErrorMessage("");


    setMessages(
      (previous) => [
        ...previous,

        {
          id:
            crypto.randomUUID(),

          role: "user",

          content:
            selectedOption,
        },
      ]
    );


    try {

      const response = await fetch(
        `${API_BASE_URL}/api/query/clarify`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            original_question:
              originalQuestion,

            selected_option:
              selectedOption,

            conversation:
              buildConversation(),
          }),
        }
      );


      const result =
        await response.json();


      if (!response.ok) {

        const detail =
          result?.detail ||
          result?.message ||
          "Unable to resolve clarification.";

        throw new Error(
          typeof detail === "string"
            ? detail
            : JSON.stringify(detail)
        );
      }


      if (
        result.status ===
        "completed"
      ) {

        setMessages(
          (previous) => [
            ...previous,

            {
              id:
                crypto.randomUUID(),

              role: "assistant",

              content:
                result.answer ||
                "Query completed successfully.",

              data:
                Array.isArray(
                  result.data
                )
                  ? result.data
                  : [],

              sql:
                cleanSQL(
                  result.sql ||
                  result.generated_sql
                ),

              status:
                "completed",
            },
          ]
        );

        await loadHistory();

      } else {

        throw new Error(
          "Unable to complete clarified query."
        );

      }

    } catch (error) {

      console.error(
        "Clarification error:",
        error
      );

      const message =
        error?.message ||
        "Something went wrong while processing your query.";

      setErrorMessage(message);

      setMessages(
        (previous) => [
          ...previous,

          {
            id:
              crypto.randomUUID(),

            role: "assistant",

            content:
              "Something went wrong while processing your query.",

            error: true,

            errorDetail:
              message,

            data: [],
          },
        ]
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // DELETE ONE HISTORY
  // ==========================================================

  async function deleteHistoryItem(
    historyId,
    event
  ) {

    event?.stopPropagation();

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/history/${historyId}`,
        {
          method: "DELETE",
        }
      );


      if (!response.ok) {

        throw new Error(
          "Unable to delete history item."
        );

      }


      setHistory(
        (previous) =>
          previous.filter(
            (item) =>
              item.history_id !==
              historyId
          )
      );

    } catch (error) {

      console.error(
        "Delete history error:",
        error
      );

      alert(
        "Unable to delete this history item."
      );

    }
  }


  // ==========================================================
  // CLEAR ALL HISTORY
  // ==========================================================

  async function clearAllHistory() {

    if (
      history.length === 0
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        "Are you sure you want to delete all query history?"
      );


    if (!confirmed) {
      return;
    }


    try {

      const response = await fetch(
        `${API_BASE_URL}/api/history`,
        {
          method: "DELETE",
        }
      );


      if (!response.ok) {

        throw new Error(
          "Unable to clear history."
        );

      }


      setHistory([]);

    } catch (error) {

      console.error(
        "Clear history error:",
        error
      );

      alert(
        "Unable to clear query history."
      );

    }
  }


  // ==========================================================
  // OPEN HISTORY
  // ==========================================================

  function openHistoryItem(item) {

    setActiveView("query");

    setSidebarOpen(false);

    setErrorMessage("");


    const loadedMessages = [];


    if (
      item.original_question
    ) {

      loadedMessages.push({
        id:
          `history-user-${item.history_id}`,

        role: "user",

        content:
          item.original_question,
      });

    }


    if (
      item.answer ||
      item.generated_sql ||
      item.data
    ) {

      loadedMessages.push({

        id:
          `history-assistant-${item.history_id}`,

        role: "assistant",

        content:
          item.answer ||
          "Query completed successfully.",

        data:
          Array.isArray(
            item.data
          )
            ? item.data
            : [],

        sql:
          cleanSQL(
            item.generated_sql
          ),

        status:
          item.status ||
          "completed",
      });

    }


    setMessages(
      loadedMessages
    );

  }


  // ==========================================================
  // COPY SQL
  // ==========================================================

  async function copySQL(
    sql,
    messageId
  ) {

    if (!sql) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        sql
      );

      setCopiedSQL(
        messageId
      );


      setTimeout(() => {

        setCopiedSQL(null);

      }, 1500);

    } catch (error) {

      console.error(
        "Copy SQL error:",
        error
      );

    }
  }


  // ==========================================================
  // TOGGLE SQL
  // ==========================================================

  function toggleSQL(
    messageId
  ) {

    setExpandedSQL(
      (previous) => ({
        ...previous,

        [messageId]:
          !previous[messageId],
      })
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="app-shell min-h-screen text-slate-200">


      {/* ====================================================
          SPLINE BACKGROUND
      ==================================================== */}

      <SplineBackground />


      {/* ====================================================
          MAIN UI
      ==================================================== */}

      <div className="app-content">


        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="fixed left-0 right-0 top-0 z-50 h-[74px] border-b border-white/[0.08] bg-[#070b14]/80 backdrop-blur-xl">

          <div className="flex h-full items-center px-5">


            {/* HAMBURGER */}

            <button
              onClick={() =>
                setSidebarOpen(
                  (previous) =>
                    !previous
                )
              }

              className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.10] bg-[#0c111c]/80 text-slate-400 transition hover:border-indigo-500/30 hover:text-white"
              title="Open menu"
            >

              {sidebarOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}

            </button>


            {/* LOGO */}

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-indigo-600/20">

                <img
                  src={querymindLogo}
                  alt="QueryMind"
                  className="h-full w-full object-cover"
                />

              </div>


              <div>

                <div className="text-lg font-semibold text-white">
                  QueryMind
                </div>

                <div className="text-xs text-slate-500">
                  Conversational Text-to-SQL
                </div>

              </div>

            </div>


            {/* HEADER RIGHT */}

            <div className="ml-auto flex items-center gap-3">


              {activeView ===
                "analytics" && (

                <div className="hidden items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 text-sm text-indigo-300 sm:flex">

                  <BarChart3
                    size={15}
                  />

                  Analytics

                </div>

              )}


              {activeView ===
                "schema" && (

                <div className="hidden items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 text-sm text-indigo-300 sm:flex">

                  <Database
                    size={15}
                  />

                  Database Schema

                </div>

              )}


              <button
                onClick={
                  handleNewQuery
                }

                className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-[#0b101a]/80 px-4 py-2.5 text-sm text-slate-400 transition hover:border-white/[0.18] hover:text-white"
              >

                <Plus size={15} />

                <span className="hidden sm:inline">
                  New Query
                </span>

              </button>


              <div
                className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm ${
                  backendConnected
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                    : "border-red-500/20 bg-red-500/5 text-red-300"
                }`}
              >

                <span
                  className={`h-2 w-2 rounded-full ${
                    backendConnected
                      ? "bg-emerald-400"
                      : "bg-red-400"
                  }`}
                />

                <span className="hidden sm:inline">

                  {backendConnected
                    ? "Backend connected"
                    : "Backend offline"}

                </span>

              </div>

            </div>

          </div>

        </header>


        {/* ==================================================
            SIDEBAR
        ================================================== */}

        {sidebarOpen && (

          <>

            {/* OVERLAY */}

            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
              onClick={() =>
                setSidebarOpen(false)
              }
            />


            {/* SIDEBAR */}

            <aside className="fixed bottom-0 left-0 top-[74px] z-50 flex w-[400px] max-w-[90vw] flex-col border-r border-white/[0.08] bg-[#080d17]/95 shadow-2xl backdrop-blur-xl">


              {/* SIDEBAR HEADER */}

              <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-5">

                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">

                  <img
                    src={querymindLogo}
                    alt="QueryMind"
                    className="h-full w-full object-cover"
                  />

                </div>


                <div className="flex-1">

                  <div className="font-semibold text-white">
                    QueryMind
                  </div>

                  <div className="text-xs text-slate-500">
                    Query history
                  </div>

                </div>


                <button
                  onClick={() =>
                    setSidebarOpen(
                      false
                    )
                  }

                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                >

                  <X size={20} />

                </button>

              </div>


              {/* NAVIGATION */}

              <div className="space-y-2 p-3">


                {/* NEW QUERY */}

                <button
                  onClick={
                    handleNewQuery
                  }

                  className="flex w-full items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200 transition hover:bg-indigo-500/15"
                >

                  <Plus size={18} />

                  New Query

                </button>


                {/* ANALYTICS */}

                <button
                  onClick={() =>
                    setActiveView(
                      "analytics"
                    )
                  }

                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                    activeView ===
                    "analytics"
                      ? "bg-white/[0.07] text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >

                  <BarChart3
                    size={18}
                  />

                  Analytics

                </button>


                {/* DATABASE SCHEMA */}

                <button
                  onClick={() =>
                    setActiveView(
                      "schema"
                    )
                  }

                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                    activeView ===
                    "schema"
                      ? "bg-white/[0.07] text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >

                  <Database
                    size={18}
                  />

                  Database Schema

                </button>

              </div>


              {/* HISTORY TITLE */}

              <div className="flex items-center justify-between px-5 pb-3 pt-2">

                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-600">

                  <Clock3 size={13} />

                  Recent Queries

                </div>


                {loadingHistory && (

                  <RefreshCw
                    size={13}
                    className="animate-spin text-slate-600"
                  />

                )}

              </div>


              {/* HISTORY LIST */}

              <div className="flex-1 overflow-y-auto px-3">

                {history.length ===
                0 ? (

                  <div className="px-3 py-10 text-center">

                    <History
                      size={28}
                      className="mx-auto mb-3 text-slate-700"
                    />

                    <p className="text-sm text-slate-600">
                      No recent queries
                    </p>

                  </div>

                ) : (

                  <div className="space-y-1">

                    {history.map(
                      (item) => (

                        <div
                          key={
                            item.history_id
                          }

                          className="group flex w-full items-start gap-2 rounded-xl transition hover:bg-white/[0.04]"
                        >


                          {/* QUERY */}

                          <button
                            onClick={() =>
                              openHistoryItem(
                                item
                              )
                            }

                            className="min-w-0 flex-1 px-3 py-3 text-left"
                          >

                            <div className="line-clamp-2 text-sm text-slate-300 group-hover:text-white">

                              {
                                item.original_question
                              }

                            </div>


                            <div className="mt-1 text-[11px] text-slate-600">

                              {formatDate(
                                item.created_at
                              )}

                            </div>

                          </button>


                          {/* DELETE */}

                          <button
                            onClick={(
                              event
                            ) =>
                              deleteHistoryItem(
                                item.history_id,
                                event
                              )
                            }

                            title="Delete query"

                            className="mr-2 mt-3 rounded-lg p-2 text-slate-700 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                          >

                            <Trash2
                              size={15}
                            />

                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* CLEAR ALL */}

              <div className="border-t border-white/[0.07] p-4">

                <button
                  onClick={
                    clearAllHistory
                  }

                  disabled={
                    history.length ===
                    0
                  }

                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.02] px-4 py-3 text-sm text-slate-500 transition hover:bg-red-500/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <Trash2
                    size={16}
                  />

                  Clear All History

                </button>

              </div>

            </aside>

          </>

        )}


        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="min-h-screen pt-[74px]">


          {/* =================================================
              ANALYTICS
          ================================================= */}

          {activeView ===
            "analytics" && (

            <div className="mx-auto max-w-6xl px-6 py-10">

              <div className="mb-8">

                <div className="mb-2 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">

                    <BarChart3
                      size={20}
                    />

                  </div>

                  <h1 className="text-2xl font-semibold text-white">
                    Analytics
                  </h1>

                </div>

                <p className="text-sm text-slate-500">
                  QueryMind usage and performance overview.
                </p>

              </div>


              {loadingAnalytics ? (

                <div className="flex items-center justify-center py-24">

                  <RefreshCw
                    size={25}
                    className="animate-spin text-indigo-400"
                  />

                </div>

              ) : (

                <>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <AnalyticsCard
                      icon={
                        <MessageSquare
                          size={19}
                        />
                      }
                      title="Total Queries"
                      value={
                        analytics?.total_queries ??
                        0
                      }
                    />


                    <AnalyticsCard
                      icon={
                        <Check
                          size={19}
                        />
                      }
                      title="Successful Queries"
                      value={
                        analytics?.successful_queries ??
                        0
                      }
                    />


                    <AnalyticsCard
                      icon={
                        <Zap
                          size={19}
                        />
                      }
                      title="Failed Queries"
                      value={
                        analytics?.failed_queries ??
                        0
                      }
                    />


                    <AnalyticsCard
                      icon={
                        <Activity
                          size={19}
                        />
                      }
                      title="Success Rate"
                      value={`${analytics?.success_rate ?? 0}%`}
                    />

                  </div>


                  <div className="mt-6 grid gap-6 lg:grid-cols-2">


                    {/* ACTIVITY */}

                    <div className="rounded-2xl border border-white/[0.08] bg-[#0a101b]/80 p-5 backdrop-blur-xl">

                      <div className="mb-5 flex items-center gap-2">

                        <Activity
                          size={17}
                          className="text-indigo-400"
                        />

                        <h2 className="font-medium text-white">
                          Activity
                        </h2>

                      </div>


                      {analytics?.activity?.length ? (

                        <div className="space-y-3">

                          {analytics.activity.map(
                            (item, index) => (

                              <div
                                key={index}
                                className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
                              >

                                <span className="text-sm text-slate-400">

                                  {item.date ||
                                    item.day ||
                                    `Day ${index + 1}`}

                                </span>


                                <span className="font-medium text-white">

                                  {item.count ??
                                    item.queries ??
                                    0}

                                </span>

                              </div>

                            )
                          )}

                        </div>

                      ) : (

                        <EmptyState
                          text="No activity data available."
                        />

                      )}

                    </div>


                    {/* RECENT QUERIES */}

                    <div className="rounded-2xl border border-white/[0.08] bg-[#0a101b]/80 p-5 backdrop-blur-xl">

                      <div className="mb-5 flex items-center gap-2">

                        <History
                          size={17}
                          className="text-indigo-400"
                        />

                        <h2 className="font-medium text-white">
                          Recent Queries
                        </h2>

                      </div>


                      {analytics?.recent_queries?.length ? (

                        <div className="space-y-3">

                          {analytics.recent_queries.map(
                            (item, index) => (

                              <div
                                key={index}
                                className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
                              >

                                <div className="line-clamp-2 text-sm text-slate-300">

                                  {item.original_question ||
                                    item.question ||
                                    "Query"}

                                </div>


                                <div className="mt-1 text-xs text-slate-600">

                                  {formatDate(
                                    item.created_at
                                  )}

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      ) : (

                        <EmptyState
                          text="No recent query data."
                        />

                      )}

                    </div>

                  </div>

                </>

              )}

            </div>

          )}


          {/* =================================================
              DATABASE SCHEMA
          ================================================= */}

          {activeView ===
            "schema" && (

            <div className="mx-auto max-w-6xl px-6 py-10">

              <div className="mb-8">

                <div className="mb-2 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">

                    <Database
                      size={20}
                    />

                  </div>

                  <h1 className="text-2xl font-semibold text-white">
                    Database Schema
                  </h1>

                </div>

                <p className="text-sm text-slate-500">
                  PostgreSQL database structure available to QueryMind.
                </p>

              </div>


              <div className="grid gap-4 md:grid-cols-2">

                {databaseSchema.map(
                  (table) => (

                    <div
                      key={
                        table.name
                      }

                      className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a101b]/80 backdrop-blur-xl"
                    >

                      <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">

                          <Table2
                            size={17}
                          />

                        </div>


                        <div>

                          <div className="font-medium text-white">
                            {table.name}
                          </div>

                          <div className="text-xs text-slate-600">
                            {table.columns.length} columns
                          </div>

                        </div>

                      </div>


                      {table.columns.map(
                        (
                          column,
                          index
                        ) => (

                          <div
                            key={
                              column[0]
                            }

                            className={`grid grid-cols-[1fr_auto] gap-4 px-5 py-3 ${
                              index !==
                              table.columns.length -
                                1
                                ? "border-b border-white/[0.04]"
                                : ""
                            }`}
                          >

                            <div>

                              <div className="text-sm text-slate-300">
                                {column[0]}
                              </div>

                              {column[2] && (

                                <div className="mt-0.5 text-[10px] text-slate-600">

                                  {column[2]}

                                </div>

                              )}

                            </div>


                            <div className="text-right font-mono text-xs text-indigo-300/70">

                              {column[1]}

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )
                )}

              </div>

            </div>

          )}


          {/* =================================================
              QUERY VIEW
          ================================================= */}

          {activeView ===
            "query" && (

            <div className="mx-auto flex min-h-[calc(100vh-74px)] max-w-[1100px] flex-col px-5">

              <div className="flex-1 space-y-8 pb-36 pt-12">


                {/* EMPTY */}

                {messages.length ===
                  0 && (

                  <EmptyQueryState
                    onSuggestion={(
                      text
                    ) =>
                      setQuestion(
                        text
                      )
                    }
                  />

                )}


                {/* MESSAGES */}

                {messages.map(
                  (message) => (

                    <MessageBubble
                      key={
                        message.id
                      }

                      message={
                        message
                      }

                      onClarification={
                        handleClarification
                      }

                      onCopySQL={
                        copySQL
                      }

                      copiedSQL={
                        copiedSQL
                      }

                      expandedSQL={
                        expandedSQL
                      }

                      toggleSQL={
                        toggleSQL
                      }

                      originalQuestion={
                        messages
                          .filter(
                            (item) =>
                              item.role ===
                              "user"
                          )
                          .at(-1)
                          ?.content ||
                        ""
                      }

                    />

                  )
                )}


                {/* LOADING */}

                {loading && (

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0b111d]/80 text-indigo-400">

                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                    </div>


                    <div className="rounded-2xl border border-white/[0.08] bg-[#0a101a]/80 px-5 py-4 backdrop-blur-xl">

                      <div className="text-sm text-slate-500">

                        QueryMind is analyzing your query...

                      </div>

                    </div>

                  </div>

                )}

              </div>


              {/* ERROR */}

              {errorMessage && (

                <div className="fixed bottom-[100px] left-1/2 z-30 w-[min(700px,90vw)] -translate-x-1/2 rounded-xl border border-red-500/20 bg-[#160d12]/95 px-4 py-3 text-sm text-red-300 shadow-xl backdrop-blur-xl">

                  <div className="flex items-start gap-3">

                    <X
                      size={17}
                      className="mt-0.5 shrink-0"
                    />

                    <div>

                      <div className="font-medium">
                        Request failed
                      </div>

                      <div className="mt-1 break-words text-xs text-red-400/70">
                        {errorMessage}
                      </div>

                    </div>

                  </div>

                </div>

              )}


              {/* INPUT */}

              <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.06] bg-[#060912]/75 px-5 py-5 backdrop-blur-xl">

                <form
                  onSubmit={
                    handleSubmit
                  }

                  className="mx-auto max-w-[1100px]"
                >

                  <div className="relative flex items-center rounded-2xl border border-white/[0.10] bg-[#0a101b]/90 p-2 shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/30">

                    <input
                      value={
                        question
                      }

                      onChange={(
                        event
                      ) =>
                        setQuestion(
                          event.target
                            .value
                        )
                      }

                      onKeyDown={(
                        event
                      ) => {

                        if (
                          event.key ===
                            "Enter" &&
                          !event.shiftKey
                        ) {

                          event.preventDefault();

                          handleSubmit(
                            event
                          );

                        }

                      }}

                      placeholder="Ask something about your database..."

                      disabled={
                        loading
                      }

                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                    />


                    <button
                      type="submit"

                      disabled={
                        loading ||
                        !question.trim()
                      }

                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white transition hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >

                      {loading ? (

                        <RefreshCw
                          size={18}
                          className="animate-spin"
                        />

                      ) : (

                        <Send
                          size={18}
                        />

                      )}

                    </button>

                  </div>


                  <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-700">

                    <Database
                      size={12}
                    />

                    QueryMind generates and validates SQL before execution.

                  </div>

                </form>

              </div>

            </div>

          )}

        </main>

      </div>

    </div>

  );
}


// ============================================================
// ANALYTICS CARD
// ============================================================

function AnalyticsCard({
  icon,
  title,
  value,
}) {

  return (

    <div className="rounded-2xl border border-white/[0.08] bg-[#0a101b]/80 p-5 backdrop-blur-xl">

      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">

        {icon}

      </div>


      <div className="text-xs uppercase tracking-wider text-slate-600">

        {title}

      </div>


      <div className="mt-2 text-3xl font-semibold text-white">

        {formatValue(value)}

      </div>

    </div>

  );
}


// ============================================================
// EMPTY QUERY
// ============================================================

function EmptyQueryState({
  onSuggestion,
}) {

  const suggestions = [
    "How many customers are there?",
    "Show me the top 5 products.",
    "Which customer spent the most?",
    "Show total revenue by city.",
  ];


  return (

    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">


      <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-indigo-600/20">

        <img
          src={querymindLogo}
          alt="QueryMind"
          className="h-full w-full object-cover"
        />

      </div>


      <h1 className="text-3xl font-semibold text-white">
        Ask your database anything.
      </h1>


      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">

        QueryMind converts natural language into safe,
        validated PostgreSQL queries and returns the results.

      </p>


      <div className="mt-8 flex max-w-2xl flex-wrap justify-center gap-2">

        {suggestions.map(
          (suggestion) => (

            <button
              key={
                suggestion
              }

              onClick={() =>
                onSuggestion(
                  suggestion
                )
              }

              className="rounded-xl border border-white/[0.08] bg-[#0a101b]/80 px-4 py-2.5 text-sm text-slate-400 backdrop-blur-xl transition hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-300"
            >

              {suggestion}

            </button>

          )
        )}

      </div>

    </div>

  );
}


// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({
  message,
  onClarification,
  onCopySQL,
  copiedSQL,
  expandedSQL,
  toggleSQL,
  originalQuestion,
}) {

  const isUser =
    message.role ===
    "user";


  // ----------------------------------------------------------
  // USER
  // ----------------------------------------------------------

  if (isUser) {

    return (

      <div className="flex justify-end">

        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5 text-sm text-white shadow-lg shadow-indigo-600/10">

          {message.content}

        </div>

      </div>

    );
  }


  // ----------------------------------------------------------
  // ASSISTANT
  // ----------------------------------------------------------

  return (

    <div className="flex items-start gap-3">


      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white backdrop-blur-xl">

        <img
          src={querymindLogo}
          alt="QueryMind"
          className="h-full w-full object-cover"
        />

      </div>


      <div className="min-w-0 max-w-[850px]">


        <div className="mb-2 flex items-center gap-2">

          <span className="text-sm font-semibold text-indigo-300">
            QueryMind
          </span>

          <span className="text-[10px] text-slate-700">
            AI response
          </span>

        </div>


        <div className="rounded-2xl rounded-tl-md border border-white/[0.08] bg-[#0a101b]/85 p-5 backdrop-blur-xl">


          <p
            className={`text-sm leading-6 ${
              message.error
                ? "text-red-300"
                : "text-slate-300"
            }`}
          >

            {message.content}

          </p>


          {/* ERROR */}

          {message.error &&
            message.errorDetail && (

              <div className="mt-3 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-xs text-red-400/70">

                {message.errorDetail}

              </div>

            )}


          {/* CLARIFICATION */}

          {message.clarification && (

            <div className="mt-4 flex flex-wrap gap-2">

              {message.options?.map(
                (option) => (

                  <button
                    key={
                      option
                    }

                    onClick={() =>
                      onClarification(
                        originalQuestion,
                        option
                      )
                    }

                    className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5 text-sm text-indigo-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/10"
                  >

                    {option}

                  </button>

                )
              )}

            </div>

          )}


          {/* DATA */}

          {Array.isArray(
            message.data
          ) &&
            message.data.length >
              0 && (

              <ResultTable
                rows={
                  message.data
                }
              />

            )}


          {/* SQL */}

          {message.sql && (

            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">


              <div className="flex items-center justify-between bg-[#080d16]/95 px-3 py-2">


                <button
                  onClick={() =>
                    toggleSQL(
                      message.id
                    )
                  }

                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"
                >

                  {expandedSQL[
                    message.id
                  ] ? (

                    <ChevronDown
                      size={14}
                    />

                  ) : (

                    <ChevronRight
                      size={14}
                    />

                  )}

                  Generated SQL

                </button>


                <button
                  onClick={() =>
                    onCopySQL(
                      message.sql,
                      message.id
                    )
                  }

                  className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-slate-500 hover:text-white"
                >

                  {copiedSQL ===
                  message.id ? (

                    <>
                      <Check
                        size={13}
                      />

                      Copied
                    </>

                  ) : (

                    <>
                      <Copy
                        size={13}
                      />

                      Copy SQL
                    </>

                  )}

                </button>

              </div>


              {expandedSQL[
                message.id
              ] && (

                <pre className="max-h-[350px] overflow-auto border-t border-white/[0.06] bg-[#060a11] p-4 text-xs leading-6 text-indigo-200/80">

                  {message.sql}

                </pre>

              )}

            </div>

          )}

        </div>

      </div>

    </div>

  );
}


// ============================================================
// RESULT TABLE
// ============================================================

function ResultTable({
  rows,
}) {

  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return null;
  }


  const columns =
    Object.keys(
      rows[0]
    );


  // ----------------------------------------------------------
  // SINGLE VALUE
  // ----------------------------------------------------------

  if (
    rows.length === 1 &&
    columns.length === 1
  ) {

    const key =
      columns[0];

    const value =
      rows[0][key];


    return (

      <div className="mt-5 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.07] to-purple-500/[0.03] p-5">

        <div className="flex items-start justify-between">


          <div>

            <div className="text-[10px] uppercase tracking-widest text-indigo-300/50">

              {key.replaceAll(
                "_",
                " "
              )}

            </div>


            <div className="mt-2 text-3xl font-semibold text-white">

              {formatValue(
                value
              )}

            </div>


            <div className="mt-1 text-xs text-slate-600">
              Database query result
            </div>

          </div>


          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">

            <BarChart3
              size={17}
            />

          </div>

        </div>

      </div>

    );
  }


  // ----------------------------------------------------------
  // TABLE
  // ----------------------------------------------------------

  return (

    <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.08]">


      <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#080d16]/95 px-4 py-3">


        <div className="flex items-center gap-2 text-sm text-slate-400">

          <Database
            size={15}
          />

          Query Results

        </div>


        <div className="text-xs text-slate-600">

          {rows.length}{" "}

          {rows.length ===
          1
            ? "row"
            : "rows"}

        </div>

      </div>


      <div className="max-h-[380px] overflow-auto">

        <table className="w-full min-w-[500px] text-left">

          <thead className="sticky top-0 bg-[#0a101b]">

            <tr>

              {columns.map(
                (column) => (

                  <th
                    key={
                      column
                    }

                    className="border-b border-white/[0.07] px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-600"
                  >

                    {column.replaceAll(
                      "_",
                      " "
                    )}

                  </th>

                )
              )}

            </tr>

          </thead>


          <tbody>

            {rows.map(
              (
                row,
                rowIndex
              ) => (

                <tr
                  key={
                    rowIndex
                  }

                  className="border-b border-white/[0.04] last:border-0"
                >

                  {columns.map(
                    (column) => (

                      <td
                        key={
                          column
                        }

                        className="px-4 py-3 text-sm text-slate-300"
                      >

                        {formatValue(
                          row[
                            column
                          ]
                        )}

                      </td>

                    )
                  )}

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>

  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  text,
}) {

  return (

    <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-10 text-center text-sm text-slate-700">

      {text}

    </div>

  );
}