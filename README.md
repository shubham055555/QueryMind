# QueryMind

## Conversational Text-to-SQL

QueryMind is an AI-powered conversational Text-to-SQL application that allows users to query a PostgreSQL database using natural language.

Instead of writing SQL queries manually, users can ask questions in plain English. QueryMind understands the request, detects ambiguity when necessary, generates SQL using Gemini AI, validates the query, executes it against PostgreSQL, and displays the result in a conversational interface.

---

## Live Demo

Frontend:
https://query-mind-omega.vercel.app/

Backend API:
https://querymind-production-4b9c.up.railway.app/

Backend Health:
https://querymind-production-4b9c.up.railway.app/health

GitHub Repository:
https://github.com/shubham055555/QueryMind

---

## Features

- Natural Language to SQL
- AI-powered SQL generation
- Conversational database querying
- Ambiguity detection
- Clarification questions
- Conversational context
- SQL validation before execution
- PostgreSQL integration
- SQLAlchemy database layer
- Structured query results
- Generated SQL display
- Query history
- REST API
- FastAPI backend
- React + Vite frontend
- Railway deployment
- Vercel deployment
- CORS support
- Health monitoring endpoint

---

## How It Works

QueryMind follows this pipeline:

User Question
    |
    v
Conversation Context
    |
    v
Ambiguity Detection
    |
    +------ Ambiguous ------> Clarification
    |                              |
    |                              v
    |                       Resolved Question
    |                              |
    +------------------------------+
                   |
                   v
              Gemini AI
                   |
                   v
            SQL Generation
                   |
                   v
             SQL Validation
                   |
                   v
          PostgreSQL Database
                   |
                   v
            Query Execution
                   |
                   v
             Result Processing
                   |
                   v
              Query History
                   |
                   v
             Frontend Response

---

## Architecture

                    +----------------------+
                    |        User          |
                    |                      |
                    | Natural Language     |
                    |       Query          |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |      React + Vite    |
                    |       Frontend       |
                    +----------+-----------+
                               |
                         REST API / HTTP
                               |
                               v
                    +----------------------+
                    |       FastAPI        |
                    |       Backend        |
                    +----------+-----------+
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       +-------------+  +-------------+  +-------------+
       | Clarification|  | Text-to-SQL |  |   History   |
       |   Service    |  |   Service   |  |   Service   |
       +-------------+  +------+------+  +------+------+
                               |
                               v
                       +---------------+
                       |   Gemini AI   |
                       +-------+-------+
                               |
                               v
                         Generated SQL
                               |
                               v
                        SQL Validation
                               |
                               v
                       +---------------+
                       |  PostgreSQL   |
                       +-------+-------+
                               |
                               v
                         Query Result
                               |
                               v
                       React Frontend

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic

### AI

- Google Gemini API
- Natural Language Processing
- Text-to-SQL
- Intent Understanding
- Ambiguity Detection

### Database

- PostgreSQL
- SQLAlchemy

### Deployment

- Vercel
- Railway
- Railway PostgreSQL

### Version Control

- Git
- GitHub

---

## Project Structure

QueryMind/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── text_to_sql.py
│   │   │   ├── clarification_service.py
│   │   │   ├── clarification_resolver.py
│   │   │   ├── history_service.py
│   │   │   └── ...
│   │   │
│   │   ├── database/
│   │   │   └── ...
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   ├── .env
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── ...
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── .gitignore
└── README.md

---

## Database Schema

QueryMind uses PostgreSQL with the following core tables.

### Customers

customers
├── customer_id
├── name
├── email
├── city
├── country
└── created_at

### Products

products
├── product_id
├── product_name
├── category
└── price

### Orders

orders
├── order_id
├── customer_id
├── product_id
├── quantity
├── total_amount
└── order_date

### Query History

query_history
├── history_id
├── original_question
├── resolved_question
├── answer
├── generated_sql
├── data
├── status
└── created_at

---

## Example

User asks:

How many customers are there?

QueryMind generates SQL similar to:

SELECT COUNT(*)
FROM customers;

The database contains 8 customers, so the application returns:

Count: 8

---

## Revenue Query Example

User asks:

Show total revenue by city.

QueryMind can generate:

SELECT
    c.city,
    SUM(o.total_amount) AS total_revenue
FROM orders o
JOIN customers c
    ON c.customer_id = o.customer_id
GROUP BY c.city
ORDER BY total_revenue DESC;

Example result:

| City | Total Revenue |
|------|--------------:|
| Mumbai | 284,000 |
| Delhi | 168,000 |
| Bangalore | 168,000 |
| Hyderabad | 110,000 |
| Pune | 24,000 |

---

## Ambiguity Detection

QueryMind can detect ambiguous natural language questions.

For example:

Show me the top 5 products.

The word "top" does not specify the metric.

QueryMind can ask the user to clarify:

What should the top 5 products be based on?

1. Revenue
2. Number of orders
3. Sales quantity
4. Customer ratings

After the user selects an option, QueryMind resolves the original question and generates the appropriate SQL.

---

## Conversational Context

QueryMind supports conversational database queries.

Example:

User:

Show total revenue by city.

Then:

User:

Only show Delhi.

The previous question can be used as context to understand the second query.

This makes QueryMind a conversational database assistant rather than a simple one-shot Text-to-SQL system.

---

## Query History

QueryMind stores processed queries in PostgreSQL.

Stored information includes:

- Original question
- Resolved question
- Generated SQL
- Query result
- Answer
- Status
- Timestamp

This provides a persistent history of database interactions.

---

## API Endpoints

### Root

GET /

Example response:

{
  "name": "QueryMind",
  "status": "running",
  "version": "1.0.0"
}

### Health Check

GET /health

Example response:

{
  "status": "healthy"
}

### Execute Query

POST /api/query

Example request:

{
  "question": "How many customers are there?"
}

### Clarify Query

POST /api/query/clarify

Used when QueryMind needs additional information to resolve an ambiguous question.

### Query History

GET /api/history?limit=50

Returns previously processed queries.

---

## Local Development

### Clone Repository

git clone https://github.com/shubham055555/QueryMind.git

cd QueryMind

---

## Backend Setup

Go to the backend:

cd backend

Create a virtual environment:

python -m venv venv

### Windows

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

---

## Environment Variables

Create a .env file inside the backend directory.

DATABASE_URL=postgresql://username:password@localhost:5432/querymind_db
GEMINI_API_KEY=your_gemini_api_key

For production, configure these variables in Railway:

DATABASE_URL
GEMINI_API_KEY

Never commit API keys or database credentials to GitHub.

---

## Run Backend

From the backend directory:

uvicorn app.main:app --reload

Backend:

http://127.0.0.1:8000

Health check:

http://127.0.0.1:8000/health

---

## Frontend Setup

Open another terminal and go to:

cd frontend

Install dependencies:

npm install

Run the development server:

npm run dev

Frontend:

http://localhost:5173

---

## Frontend Environment Variable

Create:

frontend/.env

For local development:

VITE_API_URL=http://127.0.0.1:8000

For production:

VITE_API_URL=https://querymind-production-4b9c.up.railway.app

---

## Railway Deployment

The QueryMind backend is deployed on Railway.

Production backend:

https://querymind-production-4b9c.up.railway.app/

Railway is used for:

- FastAPI backend
- PostgreSQL database
- Environment variables
- Production deployment
- Public API endpoint

Required environment variables:

DATABASE_URL
GEMINI_API_KEY

---

## Vercel Deployment

The QueryMind frontend is deployed on Vercel.

Production frontend:

https://query-mind-omega.vercel.app/

The frontend communicates with the Railway backend using the configured API URL.

---

## Security

Sensitive information should be stored in environment variables.

Example:

DATABASE_URL=your_database_url
GEMINI_API_KEY=your_api_key

Do not hardcode credentials in source code.

Recommended .gitignore:

.env
.env.*
venv/
__pycache__/
*.pyc
node_modules/
dist/

---

## Testing

Test the backend:

GET /health

Expected:

{
  "status": "healthy"
}

Test the application with:

How many customers are there?

Expected:

Count: 8

Test revenue:

Show total revenue by city.

Expected result:

Delhi       168,000
Hyderabad   110,000
Bangalore   168,000
Mumbai      284,000
Pune         24,000

---

## Evaluation

QueryMind can be evaluated using the following metrics.

### SQL Accuracy

Measures whether the generated SQL correctly represents the user's question.

### Execution Accuracy

Measures whether the generated SQL executes successfully.

### Result Accuracy

Measures whether the returned result matches the expected database result.

### Clarification Accuracy

Measures whether ambiguous questions are correctly identified and clarified.

### Latency

Measures the time taken from the user query to the final response.

---

## Project Objectives

The main objectives of QueryMind are:

1. Enable natural language database querying.
2. Reduce the need to manually write SQL.
3. Generate SQL using AI.
4. Validate SQL before execution.
5. Detect ambiguous questions.
6. Ask clarification questions when required.
7. Support conversational context.
8. Execute queries against PostgreSQL.
9. Return structured results.
10. Maintain query history.

---

## Use Cases

QueryMind can be used for:

- Business analytics
- Data exploration
- Reporting
- Database assistants
- Internal company tools
- Data analyst workflows
- Educational applications
- AI-powered BI tools
- Natural language database interfaces

---

## Future Improvements

Possible future improvements include:

- Multi-database support
- MySQL support
- SQLite support
- Database schema visualization
- Advanced SQL validation
- SQL explanation
- Query performance analysis
- Result charts
- Automatic data visualization
- Voice-based database querying
- User authentication
- Role-based database access
- Streaming AI responses
- Query caching
- Advanced agent-based SQL planning
- Automated Text-to-SQL benchmarks
- Query cost estimation
- Advanced conversational memory

---

## Screenshots

Add screenshots to a screenshots folder and reference them here.

Example:

![QueryMind Dashboard](screenshots/dashboard.png)

Recommended screenshots:

- QueryMind dashboard
- Natural language query
- Generated SQL
- Query results
- Clarification flow
- Query history

---

## Contributing

Contributions are welcome.

### Create a branch

git checkout -b feature/new-feature

### Make changes

### Commit

git add .
git commit -m "Add new feature"

### Push

git push origin feature/new-feature

Then open a Pull Request.

---

## Git Workflow

After making changes:

git add .

git commit -m "update QueryMind"

If the remote repository contains new changes:

git pull --rebase origin main

Then:

git push origin main

---

## Troubleshooting

### Backend Offline

Check:

https://querymind-production-4b9c.up.railway.app/health

Expected:

{
  "status": "healthy"
}

### Database Connection Error

Check the DATABASE_URL variable.

DATABASE_URL=postgresql://username:password@host:port/database

Make sure Railway PostgreSQL is connected to the backend service.

### Gemini API Error

Check:

GEMINI_API_KEY=your_gemini_api_key

Also verify that the Gemini API has available quota.

### CORS Error

Make sure the production frontend URL is allowed by FastAPI:

https://query-mind-omega.vercel.app

---

## Current Sample Data

QueryMind has been tested with sample data containing customers, products, and orders.

### Customers

Aarav Sharma
Priya Verma
Rahul Singh
Ananya Gupta
Rohan Mehta
Sneha Kapoor
Aditya Kumar
Neha Sharma

### Cities

Delhi
Mumbai
Bangalore
Pune
Hyderabad

### Products

Laptop Pro
Wireless Mouse
Mechanical Keyboard
Smartphone X
Headphones
Smart Watch

---

## Project Highlights

Natural Language
       |
       v
AI Understanding
       |
       v
Ambiguity Detection
       |
       v
Clarification
       |
       v
Text-to-SQL
       |
       v
SQL Validation
       |
       v
PostgreSQL
       |
       v
Query Execution
       |
       v
Structured Results

QueryMind combines Artificial Intelligence, Natural Language Processing, backend engineering, database systems, and modern web development into a conversational database assistant.

---

## License

This project is currently intended for educational, research, and portfolio purposes.

A formal open-source license can be added to the repository in the future.

---

## Author

### QueryMind

AI-powered Conversational Text-to-SQL application.

Built with:

React
Vite
Python
FastAPI
Gemini AI
SQLAlchemy
PostgreSQL
Vercel
Railway

---

## Links

Live Application:
https://query-mind-omega.vercel.app/

Backend API:
https://querymind-production-4b9c.up.railway.app/

Backend Health:
https://querymind-production-4b9c.up.railway.app/health

GitHub Repository:
https://github.com/shubham055555/QueryMind

---

# QueryMind

## Ask your database questions in plain English.

Natural Language
       |
       v
      AI
       |
       v
Generated SQL
       |
       v
SQL Validation
       |
       v
PostgreSQL
       |
       v
Results

QueryMind — Conversational Text-to-SQL
