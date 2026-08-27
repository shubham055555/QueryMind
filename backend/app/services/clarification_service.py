import os
import json
import time

from google import genai
from google.genai import errors
from dotenv import load_dotenv

from app.models.clarification import ClarificationResult


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from .env")


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(api_key=API_KEY)

MODEL_NAME = "gemini-3.6-flash"


# ============================================================
# QUESTION ANALYZER
# ============================================================

def analyze_question(question: str) -> ClarificationResult:
    """
    Analyze whether a user's natural-language database question
    is ambiguous.

    Returns:
        ClarificationResult
    """

    normalized = question.strip().lower()

    # ========================================================
    # DETERMINISTIC SAFE CASES
    # ========================================================
    #
    # These questions are obviously clear and should NOT depend
    # on the LLM's interpretation.
    #

    simple_customer_count_questions = {
        "how many customers are there?",
        "how many customers are there",
        "how many customers?",
        "how many customers",
        "what is the number of customers?",
        "what is the number of customers",
        "total customers?",
        "total customers",
        "total number of customers?",
        "total number of customers",
    }

    if normalized in simple_customer_count_questions:
        return ClarificationResult(
            ambiguous=False,
            intent="Count the total number of customers in the database.",
            clarification_question=None,
            options=[]
        )

    # ========================================================
    # DETERMINISTIC CUSTOMER LOCATION CASE
    # ========================================================
    #
    # Example:
    # "How many customers are there in Delhi?"
    #
    # This is normally clear for our current schema because
    # customers have a city field.
    #

    if (
        normalized.startswith("how many customers are there in ")
        and normalized.endswith("?")
    ):
        city = normalized[
            len("how many customers are there in "):-1
        ].strip()

        if city:
            return ClarificationResult(
                ambiguous=False,
                intent=(
                    f"Count the total number of customers "
                    f"located in {city.title()}."
                ),
                clarification_question=None,
                options=[]
            )

    # ========================================================
    # LLM PROMPT
    # ========================================================

    prompt = f"""
You are an ambiguity detection engine for a PostgreSQL
Text-to-SQL system.

Your job is ONLY to determine whether the user's question
is ambiguous.

USER QUESTION:
{question}

Return ONLY valid JSON.

Required structure:

{{
  "ambiguous": true,
  "intent": "short description",
  "clarification_question": "question or null",
  "options": []
}}

Rules:

1. ambiguous=true ONLY when an important part of the question
   has multiple reasonable interpretations.

2. ambiguous=false when enough information exists to generate
   a reliable SQL query.

3. Do NOT invent ambiguity.

4. Do NOT ask unnecessary clarification questions.

5. If the user asks a simple database question and the required
   information is clear, return ambiguous=false.

6. For example:

   "How many customers are there?"
   -> ambiguous=false

   "How many customers are there in Delhi?"
   -> ambiguous=false

7. If ambiguous=false:
   - clarification_question must be null
   - options must be []

8. If ambiguous=true:
   - clarification_question must explain exactly what is unclear
   - options must contain 2 to 4 useful choices

9. "Best", "top", "most", "highest" etc. may be ambiguous
   when the metric is not specified.

10. Do not generate SQL.

11. Return JSON only.
"""

    # ========================================================
    # RETRY CONFIGURATION
    # ========================================================

    max_retries = 3

    for attempt in range(max_retries):

        try:
            # =================================================
            # GEMINI REQUEST
            # =================================================

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )

            # =================================================
            # RESPONSE TEXT
            # =================================================

            if not response.text:
                raise ValueError(
                    "Gemini returned an empty response."
                )

            text = response.text.strip()

            # =================================================
            # REMOVE MARKDOWN CODE BLOCK
            # =================================================

            if text.startswith("```"):
                text = text.replace("```json", "", 1)
                text = text.replace("```", "", 1)
                text = text.strip()

            # =================================================
            # PARSE JSON
            # =================================================

            try:
                data = json.loads(text)

            except json.JSONDecodeError as error:
                raise ValueError(
                    f"Invalid JSON returned by LLM: {error}"
                )

            # =================================================
            # PYDANTIC VALIDATION
            # =================================================

            result = ClarificationResult.model_validate(data)

            # =================================================
            # NORMALIZE NON-AMBIGUOUS RESPONSE
            # =================================================

            if not result.ambiguous:
                result.clarification_question = None
                result.options = []

            # =================================================
            # NORMALIZE AMBIGUOUS RESPONSE
            # =================================================

            else:
                if not result.clarification_question:
                    raise ValueError(
                        "Ambiguous response must contain "
                        "a clarification_question."
                    )

                if not result.options:
                    raise ValueError(
                        "Ambiguous response must contain "
                        "at least one option."
                    )

            return result

        # ====================================================
        # GEMINI SERVER ERROR
        # ====================================================

        except errors.ServerError as error:

            print(
                f"Gemini server error "
                f"(attempt {attempt + 1}/{max_retries}): {error}"
            )

            if attempt == max_retries - 1:
                raise RuntimeError(
                    "Gemini service is temporarily unavailable. "
                    "Please try again later."
                )

            # Exponential backoff:
            # attempt 0 -> 1 second
            # attempt 1 -> 2 seconds
            # attempt 2 -> stop
            time.sleep(2 ** attempt)

        # ====================================================
        # GEMINI CLIENT ERROR
        # ====================================================

        except errors.ClientError as error:

            error_message = str(error)

            print(
                f"Gemini client error "
                f"(attempt {attempt + 1}/{max_retries}): "
                f"{error_message}"
            )

            # ------------------------------------------------
            # QUOTA / RATE LIMIT
            # ------------------------------------------------

            if "429" in error_message:
                raise RuntimeError(
                    "Gemini API quota exceeded. "
                    "Please try again later or use another API key."
                )

            # ------------------------------------------------
            # OTHER CLIENT ERRORS
            # ------------------------------------------------

            raise RuntimeError(
                "Gemini API request failed."
            )

        # ====================================================
        # JSON / PYDANTIC / VALIDATION ERRORS
        # ====================================================

        except ValueError as error:

            print(
                f"Clarification parsing error: {error}"
            )

            raise RuntimeError(
                "QueryMind could not understand the "
                "clarification analysis returned by Gemini."
            )