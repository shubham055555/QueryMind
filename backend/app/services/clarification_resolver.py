import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=API_KEY)


def resolve_question(
    original_question: str,
    selected_option: str
) -> str:

    prompt = f"""
You are a query intent resolver for a Text-to-SQL system.

The user originally asked:

{original_question}

The user selected this clarification option:

{selected_option}

Rewrite the original question into ONE clear,
self-contained natural-language question.

Rules:
1. Preserve the original user's intent.
2. Incorporate the selected clarification.
3. Remove ambiguity.
4. Do not generate SQL.
5. Return only the rewritten question.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text.strip()
