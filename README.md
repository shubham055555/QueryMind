# QueryMind

### Conversational Text-to-SQL

QueryMind is an AI-powered conversational Text-to-SQL application that allows users to interact with a PostgreSQL database using natural language.

Instead of manually writing SQL queries, users can simply ask questions such as:

> How many customers are there?

QueryMind understands the question, generates SQL, validates it for safety, executes it against the database, and presents the result in a clean conversational interface.

---

## Features

- Natural language to SQL generation
- Conversational database querying
- AI-powered SQL generation
- Read-only SQL validation
- PostgreSQL database integration
- SQL execution and result formatting
- Ambiguity detection and clarification
- Query history
- Delete individual history items
- Clear complete query history
- Query analytics
- Database schema viewer
- Generated SQL viewer
- Copy generated SQL
- Interactive result tables
- Modern React dashboard
- 3D Spline background
- Responsive UI
- FastAPI backend
- Vite + React frontend

---

## Architecture

```text
User
  │
  ▼
React Frontend
  │
  ▼
FastAPI Backend
  │
  ├── Clarification Service
  │
  ├── Text-to-SQL Service
  │
  ├── SQL Validator
  │
  ├── Query Executor
  │
  ├── Response Formatter
  │
  ├── History Service
  │
  └── Analytics Service
  │
  ▼
PostgreSQL
