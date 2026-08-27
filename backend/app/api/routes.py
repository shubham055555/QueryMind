from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.query_pipeline import (
    start_query,
    continue_query
)

from app.services.response_formatter import (
    format_database_result,
    build_answer
)

from app.services.history_service import (
    get_history,
    save_history,
    clear_history,
    delete_history_item
)

from app.services.analytics_service import (
    get_analytics
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api",
    tags=["QueryMind"]
)


# ============================================================
# REQUEST MODELS
# ============================================================

class QueryRequest(BaseModel):
    question: str


class ClarificationRequest(BaseModel):
    original_question: str
    selected_option: str


# ============================================================
# POST /api/query
# ============================================================

@router.post("/query")
def query(request: QueryRequest):

    # --------------------------------------------------------
    # Validate empty question
    # --------------------------------------------------------

    question = request.question.strip()

    if not question:

        return {
            "status": "error",
            "question": "",
            "answer": "Please enter a question.",
            "data": [],
            "sql": ""
        }


    # --------------------------------------------------------
    # Start QueryMind pipeline
    # --------------------------------------------------------

    try:

        response = start_query(
            question
        )

    except Exception as error:

        print(
            f"Unexpected QueryMind error: {error}"
        )

        return {
            "status": "error",
            "question": question,
            "answer": "Something went wrong while processing your query.",
            "data": [],
            "sql": ""
        }


    # --------------------------------------------------------
    # Clarification required
    # --------------------------------------------------------

    if response["status"] == "clarification_required":

        return {
            "status":
                "clarification_required",

            "question":
                question,

            "message":
                response.get(
                    "clarification_question",
                    "Please clarify your question."
                ),

            "options":
                response.get(
                    "options",
                    []
                )
        }


    # --------------------------------------------------------
    # Get engine result
    # --------------------------------------------------------

    engine_result = response.get(
        "result",
        {}
    )


    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    if not engine_result:

        return {
            "status": "error",
            "question": question,
            "answer": "Query engine returned no result.",
            "data": [],
            "sql": ""
        }


    # --------------------------------------------------------
    # Query failed
    # --------------------------------------------------------

    if not engine_result.get(
        "success",
        False
    ):

        validation = engine_result.get(
            "validation",
            {}
        )

        answer = validation.get(
            "reason",
            "The query could not be executed."
        )

        generated_sql = engine_result.get(
            "generated_sql",
            ""
        )

        try:

            save_history(

                original_question=
                    response.get(
                        "original_question",
                        question
                    ),

                resolved_question=
                    response.get(
                        "resolved_question",
                        question
                    ),

                answer=
                    answer,

                generated_sql=
                    generated_sql,

                data=[],

                status=
                    "failed"
            )

        except Exception as error:

            print(
                f"History save failed: {error}"
            )


        return {
            "status": "error",

            "question":
                question,

            "answer":
                answer,

            "data": [],

            "sql":
                generated_sql
        }


    # --------------------------------------------------------
    # Format database result
    # --------------------------------------------------------

    try:

        rows = format_database_result(
            engine_result.get(
                "result",
                {}
            )
        )

    except Exception as error:

        print(
            f"Result formatting error: {error}"
        )

        rows = []


    # --------------------------------------------------------
    # Build human-readable answer
    # --------------------------------------------------------

    try:

        answer = build_answer(
            rows
        )

    except Exception as error:

        print(
            f"Answer formatting error: {error}"
        )

        answer = (
            "Query completed successfully."
        )


    # --------------------------------------------------------
    # Generated SQL
    # --------------------------------------------------------

    generated_sql = engine_result.get(
        "generated_sql",
        ""
    )


    # --------------------------------------------------------
    # Save history
    # --------------------------------------------------------

    try:

        save_history(

            original_question=
                response.get(
                    "original_question",
                    question
                ),

            resolved_question=
                response.get(
                    "resolved_question",
                    question
                ),

            answer=
                answer,

            generated_sql=
                generated_sql,

            data=
                rows,

            status=
                "completed"
        )

    except Exception as error:

        print(
            f"History save failed: {error}"
        )


    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {

        "status":
            "completed",

        "question":
            question,

        "answer":
            answer,

        "data":
            rows,

        "sql":
            generated_sql
    }


# ============================================================
# POST /api/query/clarify
# ============================================================

@router.post("/query/clarify")
def clarify(
    request: ClarificationRequest
):

    original_question = (
        request.original_question.strip()
    )

    selected_option = (
        request.selected_option.strip()
    )


    # --------------------------------------------------------
    # Validate
    # --------------------------------------------------------

    if not original_question:

        return {
            "status": "error",
            "question": "",
            "answer":
                "Original question is required.",
            "data": [],
            "sql": ""
        }


    if not selected_option:

        return {
            "status": "error",
            "question":
                original_question,
            "answer":
                "Please select a clarification option.",
            "data": [],
            "sql": ""
        }


    # --------------------------------------------------------
    # Continue pipeline
    # --------------------------------------------------------

    try:

        response = continue_query(

            original_question,

            selected_option
        )

    except Exception as error:

        print(
            f"Clarification error: {error}"
        )

        return {

            "status":
                "error",

            "question":
                original_question,

            "answer":
                "Something went wrong while processing your clarification.",

            "data": [],

            "sql":
                ""
        }


    # --------------------------------------------------------
    # Engine result
    # --------------------------------------------------------

    engine_result = response.get(
        "result",
        {}
    )


    if not engine_result:

        return {

            "status":
                "error",

            "question":
                original_question,

            "answer":
                "Query engine returned no result.",

            "data": [],

            "sql":
                ""
        }


    # --------------------------------------------------------
    # Failed
    # --------------------------------------------------------

    if not engine_result.get(
        "success",
        False
    ):

        validation = engine_result.get(
            "validation",
            {}
        )

        answer = validation.get(
            "reason",
            "The query could not be executed."
        )

        generated_sql = engine_result.get(
            "generated_sql",
            ""
        )

        try:

            save_history(

                original_question=
                    original_question,

                resolved_question=
                    response.get(
                        "resolved_question",
                        original_question
                    ),

                answer=
                    answer,

                generated_sql=
                    generated_sql,

                data=[],

                status=
                    "failed"
            )

        except Exception as error:

            print(
                f"History save failed: {error}"
            )


        return {

            "status":
                "error",

            "question":
                response.get(
                    "resolved_question",
                    original_question
                ),

            "answer":
                answer,

            "data": [],

            "sql":
                generated_sql
        }


    # --------------------------------------------------------
    # Format result
    # --------------------------------------------------------

    try:

        rows = format_database_result(
            engine_result.get(
                "result",
                {}
            )
        )

    except Exception as error:

        print(
            f"Result formatting error: {error}"
        )

        rows = []


    # --------------------------------------------------------
    # Build answer
    # --------------------------------------------------------

    try:

        answer = build_answer(
            rows
        )

    except Exception as error:

        print(
            f"Answer formatting error: {error}"
        )

        answer = (
            "Query completed successfully."
        )


    # --------------------------------------------------------
    # SQL
    # --------------------------------------------------------

    generated_sql = engine_result.get(
        "generated_sql",
        ""
    )


    # --------------------------------------------------------
    # Save history
    # --------------------------------------------------------

    try:

        save_history(

            original_question=
                original_question,

            resolved_question=
                response.get(
                    "resolved_question",
                    original_question
                ),

            answer=
                answer,

            generated_sql=
                generated_sql,

            data=
                rows,

            status=
                "completed"
        )

    except Exception as error:

        print(
            f"History save failed: {error}"
        )


    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {

        "status":
            "completed",

        "question":
            response.get(
                "resolved_question",
                original_question
            ),

        "answer":
            answer,

        "data":
            rows,

        "sql":
            generated_sql
    }


# ============================================================
# GET /api/history
# ============================================================

@router.get("/history")
def history(

    limit: int = Query(
        default=50,
        ge=1,
        le=100
    )

):

    try:

        rows = get_history(
            limit
        )

        return {

            "status":
                "success",

            "data":
                rows
        }

    except Exception as error:

        print(
            f"History fetch error: {error}"
        )

        return {

            "status":
                "error",

            "message":
                str(error),

            "data":
                []
        }


# ============================================================
# DELETE /api/history/{history_id}
# ============================================================

@router.delete(
    "/history/{history_id}"
)
def delete_single_history(
    history_id: int
):

    try:

        result = delete_history_item(
            history_id
        )

        deleted = result.get(
            "deleted",
            0
        )


        if deleted == 0:

            return {

                "status":
                    "not_found",

                "message":
                    "History item not found.",

                "deleted":
                    0
            }


        return {

            "status":
                "success",

            "message":
                "History item deleted.",

            "deleted":
                deleted
        }


    except Exception as error:

        print(
            f"Delete history error: {error}"
        )

        return {

            "status":
                "error",

            "message":
                str(error),

            "deleted":
                0
        }


# ============================================================
# DELETE /api/history
# ============================================================

@router.delete("/history")
def delete_all_history():

    try:

        result = clear_history()

        return {

            "status":
                "success",

            "message":
                "All history deleted.",

            "deleted":
                result.get(
                    "deleted",
                    0
                )
        }

    except Exception as error:

        print(
            f"Clear history error: {error}"
        )

        return {

            "status":
                "error",

            "message":
                str(error),

            "deleted":
                0
        }


# ============================================================
# GET /api/analytics
# ============================================================

@router.get("/analytics")
def analytics():

    try:

        data = get_analytics()

        return {

            "status":
                "success",

            "data":
                data
        }

    except Exception as error:

        print(
            f"Analytics error: {error}"
        )

        return {

            "status":
                "error",

            "message":
                str(error),

            "data":
                {}
        }