from app.services.clarification_service import analyze_question
from app.services.clarification_resolver import resolve_question
from app.services.text_to_sql import run_text_to_sql
from app.services.history_service import save_history


# ============================================================
# CONVERSATION CONTEXT
# ============================================================

def _build_context(conversation: list[dict]) -> str:
    """
    Convert conversation messages into compact text context.
    Only the latest 6 messages are used.
    """

    if not conversation:
        return ""

    lines = []

    for item in conversation[-6:]:
        role = item.get("role", "user")
        content = item.get("content", "").strip()

        if content:
            lines.append(f"{role}: {content}")

    if not lines:
        return ""

    return "\n".join(lines)


# ============================================================
# START QUERY
# ============================================================

def start_query(
    question: str,
    conversation: list[dict] | None = None
):
    """
    Start a new QueryMind request.

    Flow:
        Question
        -> Context
        -> Ambiguity Detection
        -> Text-to-SQL
        -> SQL Validation
        -> Database Execution
        -> Save History
        -> Return Result
    """

    conversation = conversation or []

    context = _build_context(conversation)

    # --------------------------------------------------------
    # Build contextual question
    # --------------------------------------------------------

    if context:
        contextual_question = f"""
Previous conversation:
{context}

Current user question:
{question}

Use the previous conversation only when it is necessary
to understand the current question.

Do not invent missing information.
""".strip()
    else:
        contextual_question = question

    # --------------------------------------------------------
    # Ambiguity detection
    # --------------------------------------------------------

    analysis = analyze_question(
        contextual_question
    )

    if analysis.ambiguous:
        return {
            "status": "clarification_required",
            "original_question": question,
            "intent": analysis.intent,
            "clarification_question": analysis.clarification_question,
            "options": analysis.options
        }

    # --------------------------------------------------------
    # Text-to-SQL
    # --------------------------------------------------------

    result = run_text_to_sql(
        contextual_question
    )

    # ========================================================
    # QUERY FAILED
    # ========================================================

    if not result.get("success", False):

        generated_sql = result.get(
            "generated_sql"
        )

        validation = result.get(
            "validation",
            {}
        )

        reason = validation.get(
            "reason",
            "Query execution failed."
        )

        try:
            save_history(
                original_question=question,
                resolved_question=question,
                answer=reason,
                generated_sql=generated_sql,
                data=[],
                status="failed"
            )
        except Exception as history_error:
            print(
                f"History save failed: {history_error}"
            )

        return {
            "status": "completed",
            "original_question": question,
            "resolved_question": question,
            "intent": analysis.intent,
            "result": result
        }

    # ========================================================
    # SUCCESSFUL QUERY
    # ========================================================

    engine_result = result.get(
        "result",
        {}
    )

    database_rows = engine_result.get(
        "rows",
        []
    )

    generated_sql = result.get(
        "generated_sql"
    )

    # --------------------------------------------------------
    # Save successful query
    # --------------------------------------------------------

    try:
        save_history(
            original_question=question,
            resolved_question=question,
            answer=None,
            generated_sql=generated_sql,
            data=database_rows,
            status="completed"
        )
    except Exception as history_error:
        print(
            f"History save failed: {history_error}"
        )

    # --------------------------------------------------------
    # Return
    # --------------------------------------------------------

    return {
        "status": "completed",
        "original_question": question,
        "resolved_question": question,
        "intent": analysis.intent,
        "result": result
    }


# ============================================================
# CONTINUE QUERY AFTER CLARIFICATION
# ============================================================

def continue_query(
    original_question: str,
    selected_option: str,
    conversation: list[dict] | None = None
):
    """
    Continue a query after the user selects
    a clarification option.
    """

    conversation = conversation or []

    # --------------------------------------------------------
    # Resolve clarification
    # --------------------------------------------------------

    resolved_question = resolve_question(
        original_question,
        selected_option
    )

    # --------------------------------------------------------
    # Build context
    # --------------------------------------------------------

    context = _build_context(conversation)

    if context:
        final_question = f"""
Previous conversation:
{context}

Resolved current question:
{resolved_question}

Generate SQL for the resolved question.
Use previous conversation only if required.
""".strip()
    else:
        final_question = resolved_question

    # --------------------------------------------------------
    # Text-to-SQL
    # --------------------------------------------------------

    result = run_text_to_sql(
        final_question
    )

    # ========================================================
    # QUERY FAILED
    # ========================================================

    if not result.get("success", False):

        generated_sql = result.get(
            "generated_sql"
        )

        validation = result.get(
            "validation",
            {}
        )

        reason = validation.get(
            "reason",
            "Query execution failed."
        )

        try:
            save_history(
                original_question=original_question,
                resolved_question=resolved_question,
                answer=reason,
                generated_sql=generated_sql,
                data=[],
                status="failed"
            )
        except Exception as history_error:
            print(
                f"History save failed: {history_error}"
            )

        return {
            "status": "completed",
            "original_question": original_question,
            "selected_option": selected_option,
            "resolved_question": resolved_question,
            "result": result
        }

    # ========================================================
    # SUCCESS
    # ========================================================

    engine_result = result.get(
        "result",
        {}
    )

    database_rows = engine_result.get(
        "rows",
        []
    )

    generated_sql = result.get(
        "generated_sql"
    )

    # --------------------------------------------------------
    # Save clarification query
    # --------------------------------------------------------

    try:
        save_history(
            original_question=original_question,
            resolved_question=resolved_question,
            answer=None,
            generated_sql=generated_sql,
            data=database_rows,
            status="completed"
        )
    except Exception as history_error:
        print(
            f"History save failed: {history_error}"
        )

    # --------------------------------------------------------
    # Return
    # --------------------------------------------------------

    return {
        "status": "completed",
        "original_question": original_question,
        "selected_option": selected_option,
        "resolved_question": resolved_question,
        "result": result
    }


# ============================================================
# MANUAL TEST
# ============================================================

if __name__ == "__main__":

    question = "How many customers are there?"

    print("\n" + "=" * 60)
    print("QUERYMIND QUERY PIPELINE TEST")
    print("=" * 60)

    print("\nUSER:")
    print(question)

    response = start_query(question)

    print("\nRESPONSE:")
    print(response)