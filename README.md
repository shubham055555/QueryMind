How QueryMind Works

QueryMind follows a conversational Text-to-SQL pipeline.

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
🔄 Query Flow

For example, the user asks:

Show total revenue by city.

QueryMind processes the request and generates SQL similar to:

SELECT
    c.city,
    SUM(o.total_amount) AS total_revenue
FROM orders o
JOIN customers c
    ON c.customer_id = o.customer_id
GROUP BY c.city
ORDER BY total_revenue DESC;

The SQL is then executed against PostgreSQL.

The application returns a structured response such as:

City	Total Revenue
Mumbai	284,000
Delhi	168,000
Bangalore	168,000
Hyderabad	110,000
Pune	24,000
🛠️ Tech Stack
Frontend
React
Vite
JavaScript
CSS
REST API
Backend
Python
FastAPI
Uvicorn
SQLAlchemy
Pydantic
AI
Google Gemini API
Natural Language Processing
Text-to-SQL Generation
Conversational Context
Database
PostgreSQL
SQLAlchemy ORM / Engine
Query History Storage
Deployment
Vercel — Frontend
Railway — Backend
Railway PostgreSQL — Database
Version Control
Git
GitHub
📁 Project Structure
QueryMind/
│
├── backend/
│   │
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
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── ...
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── README.md
└── .gitignore
🗄️ Database Schema

QueryMind currently works with a PostgreSQL database containing the following core tables.

Customers
customers
├── customer_id
├── name
├── email
├── city
├── country
└── created_at
Products
products
├── product_id
├── product_name
├── category
└── price
Orders
orders
├── order_id
├── customer_id
├── product_id
├── quantity
├── total_amount
└── order_date
Query History
query_history
├── history_id
├── original_question
├── resolved_question
├── answer
├── generated_sql
├── data
├── status
└── created_at
🔌 API Endpoints
Health Check
GET /health

Example response:

{
  "status": "healthy"
}
Root Endpoint
GET /

Example response:

{
  "name": "QueryMind",
  "status": "running",
  "version": "1.0.0"
}
Execute Query
POST /api/query

Example request:

{
  "question": "How many customers are there?"
}

Example response:

{
  "status": "completed",
  "result": {
    "rows": [
      {
        "count": 8
      }
    ]
  }
}
Query History
GET /api/history?limit=50

Returns previously processed QueryMind requests.

Clarification
POST /api/query/clarify

Used when QueryMind detects ambiguity in the user's question and requires additional information.

⚙️ Local Development
1. Clone the Repository
git clone https://github.com/shubham055555/QueryMind.git
cd QueryMind
🐍 Backend Setup

Go to the backend directory:

cd backend

Create a virtual environment:

python -m venv venv

Activate it on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt
🔐 Environment Variables

Create a .env file inside the backend directory.

DATABASE_URL=postgresql://username:password@localhost:5432/querymind_db
GEMINI_API_KEY=your_gemini_api_key
Production

For Railway deployment, configure the following variables in Railway:

DATABASE_URL
GEMINI_API_KEY

Never commit your .env file to GitHub.

▶️ Run Backend

From the backend directory:

uvicorn app.main:app --reload

The backend will be available at:

http://127.0.0.1:8000

Health check:

http://127.0.0.1:8000/health
💻 Frontend Setup

Open a new terminal.

cd frontend

Install dependencies:

npm install

Start development server:

npm run dev

The frontend will normally be available at:

http://localhost:5173
🌐 Frontend Environment Variable

Create:

frontend/.env

Example:

VITE_API_URL=http://127.0.0.1:8000

For production:

VITE_API_URL=https://querymind-production-4b9c.up.railway.app
🚂 Railway Deployment

The backend is deployed using Railway.

Production backend:

https://querymind-production-4b9c.up.railway.app/

Railway provides:

FastAPI backend hosting
PostgreSQL database
Environment variables
Automatic deployments
Public backend domain

Required environment variables:

DATABASE_URL
GEMINI_API_KEY

The backend listens on the Railway-provided port.

▲ Vercel Deployment

The React frontend is deployed using Vercel.

Production frontend:

https://query-mind-omega.vercel.app/

The frontend communicates with the Railway backend through the configured API URL.

🔒 Security

QueryMind uses environment variables for sensitive configuration.

Sensitive values should never be hardcoded.

GEMINI_API_KEY=...
DATABASE_URL=...

The .env file should be included in .gitignore.

Example:

.env
.env.*
venv/
__pycache__/
node_modules/
dist/
🧪 Example Queries

QueryMind can process natural language database questions such as:

How many customers are there?
Show total revenue by city.
Show the top 5 products by revenue.
Which city has the highest revenue?
Show all customers from Delhi.
What is the average order value?
Which product has been ordered the most?
💡 Ambiguity-Aware Queries

QueryMind can detect questions where important information is missing or ambiguous.

For example:

Show me the top 5 products.

The system may ask:

Top 5 products based on what?

1. Customer ratings
2. Revenue
3. Number of orders
4. Sales quantity

The user's selection is then used to resolve the original question before generating SQL.

📊 Query History

QueryMind stores processed queries in PostgreSQL.

The history contains information such as:

Original Question
Resolved Question
Generated SQL
Result Data
Status
Timestamp

This allows the application to maintain a record of previous database interactions.

🧠 Conversational Context

QueryMind supports conversational context.

Example:

User:
Show total revenue by city.

Then:

User:
Only show Delhi.

The previous question can be used as context to understand the second request.

This makes QueryMind more conversational than a simple one-shot Text-to-SQL system.

🎯 Project Goals

The main goals of QueryMind are:

Make database querying accessible through natural language.
Reduce the need for users to manually write SQL.
Generate SQL using AI.
Validate SQL before execution.
Handle ambiguous questions through clarification.
Support conversational database interaction.
Provide structured and understandable results.
Maintain query history for better usability.
🚀 Future Improvements

Potential future improvements include:

Multi-database support
MySQL support
SQLite support
Database schema visualization
Advanced SQL validation
Query performance analysis
SQL explanation
Result charts and visualizations
Voice-based database querying
Authentication and user accounts
Role-based database permissions
Streaming AI responses
Better query caching
Advanced agent-based SQL planning
Automated evaluation benchmarks
Query cost estimation
More robust conversational memory
📈 Evaluation

QueryMind can be evaluated using metrics such as:

SQL Accuracy

Whether the generated SQL correctly represents the user's intent.

Execution Accuracy

Whether the generated SQL executes successfully and produces the expected result.

Result Accuracy

Whether the returned database result matches the expected answer.

Clarification Accuracy

Whether the system correctly detects ambiguous questions and asks an appropriate clarification question.

Latency

Time taken from user query to final result.

🧩 Core Components
QueryMind
│
├── Frontend
│   └── React + Vite
│
├── API Layer
│   └── FastAPI
│
├── AI Layer
│   └── Gemini
│
├── Query Understanding
│   ├── Intent Detection
│   ├── Ambiguity Detection
│   └── Clarification
│
├── Text-to-SQL
│   ├── SQL Generation
│   └── SQL Validation
│
├── Database Layer
│   ├── SQLAlchemy
│   └── PostgreSQL
│
└── History
    └── Query History
🛠️ Troubleshooting
Backend Offline

Check:

GET /health

The expected response is:

{
  "status": "healthy"
}
Database Connection Error

Verify:

DATABASE_URL=...

For Railway, make sure the backend service receives the PostgreSQL DATABASE_URL.

Gemini API Error

Verify:

GEMINI_API_KEY=...

Also check your Gemini API quota and billing/rate limits.

CORS Error

Make sure the frontend URL is included in the FastAPI CORS configuration.

Production frontend:

https://query-mind-omega.vercel.app
📸 Screenshots

Add screenshots of the application here.

Example:

![QueryMind Dashboard](screenshots/dashboard.png)

Recommended screenshots:

QueryMind dashboard
Natural language query
Generated SQL
Query results
Clarification flow
Query history
🤝 Contributing

Contributions are welcome.

Steps
Fork the repository.
Create a new branch.
git checkout -b feature/new-feature
Make your changes.
Commit your changes.
git add .
git commit -m "Add new feature"
Push the branch.
git push origin feature/new-feature
Open a Pull Request.
📄 License

This project is currently intended for educational, research, and portfolio purposes.

A formal open-source license can be added later.

👨‍💻 Author

QueryMind

Built as an AI-powered conversational Text-to-SQL project.

⭐ Support

If you find QueryMind useful, consider giving the repository a ⭐ on GitHub.
