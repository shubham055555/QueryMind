import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=API_KEY)


def generate_sql(question: str, schema: dict) -> str:

    schema_text = str(schema)

    prompt = f"""
You are an expert PostgreSQL Text-to-SQL system.

Your job is to convert the user's natural language question
into a valid PostgreSQL SQL query.

DATABASE SCHEMA:
{schema_text}

USER QUESTION:
{question}

RULES:
1. Generate PostgreSQL SQL only.
2. Use only tables and columns present in the schema.
3. Never invent tables or columns.
4. Do not generate INSERT, UPDATE, DELETE, DROP, ALTER, or TRUNCATE.
5. Generate read-only SELECT queries only.
6. Return only the SQL query.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text.strip()
