# QueryMind

## Conversational Text-to-SQL

QueryMind is an AI-powered conversational Text-to-SQL application that allows users to interact with a PostgreSQL database using natural language.

Instead of manually writing SQL queries, users can simply ask questions such as:

> How many customers are there?

or:

> Show total revenue by city.

QueryMind understands the user's question, detects ambiguity when required, generates SQL using Gemini AI, validates the query, executes it against PostgreSQL, and displays the result in a conversational interface.

---

## 🚀 Live Demo

### Frontend

https://query-mind-omega.vercel.app/

### Backend API

https://querymind-production-4b9c.up.railway.app/

### Backend Health Check

https://querymind-production-4b9c.up.railway.app/health

---

# ✨ Features

- 🤖 Natural Language to SQL
- 💬 Conversational database querying
- 🧠 AI-powered SQL generation
- 🔍 SQL validation before execution
- 🗄️ PostgreSQL database integration
- 📊 Structured query results
- 📝 Generated SQL display
- 📋 Copy generated SQL
- 📚 Query history
- ❓ Ambiguity detection
- 💡 Clarification questions
- 🔄 Conversational context
- 🌐 REST API
- ❤️ Backend health check
- 🔐 Environment variable configuration
- 🚂 Railway backend deployment
- ▲ Vercel frontend deployment
- 🌍 CORS support

---

# 🧠 How QueryMind Works

QueryMind follows a conversational Text-to-SQL pipeline.

```text
User Question
      ↓
Conversation Context
      ↓
Ambiguity Detection
      ↓
Clarification (if required)
      ↓
AI Text-to-SQL Generation
      ↓
SQL Validation
      ↓
PostgreSQL Execution
      ↓
Result Processing
      ↓
Query History
      ↓
Frontend Response
