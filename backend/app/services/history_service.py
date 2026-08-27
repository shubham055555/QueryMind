from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import engine


# ============================================================
# CREATE HISTORY TABLE
# ============================================================

def ensure_history_table():

    sql = """
    CREATE TABLE IF NOT EXISTS query_history (
        history_id SERIAL PRIMARY KEY,

        original_question TEXT NOT NULL,

        resolved_question TEXT,

        answer TEXT,

        generated_sql TEXT,

        data JSONB DEFAULT '[]'::jsonb,

        status VARCHAR(50) NOT NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_query_history_created_at
    ON query_history(created_at DESC);
    """

    try:

        with engine.begin() as connection:
            connection.execute(text(sql))

    except SQLAlchemyError as error:

        raise RuntimeError(
            f"Unable to initialize query history: {error}"
        ) from error


# ============================================================
# SAVE HISTORY
# ============================================================

def save_history(
    original_question: str,
    resolved_question: str | None,
    answer: str | None,
    generated_sql: str | None,
    data: list | None,
    status: str
):

    ensure_history_table()

    sql = """
    INSERT INTO query_history (
        original_question,
        resolved_question,
        answer,
        generated_sql,
        data,
        status
    )
    VALUES (
        :original_question,
        :resolved_question,
        :answer,
        :generated_sql,
        CAST(:data AS JSONB),
        :status
    )
    RETURNING history_id;
    """

    import json

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text(sql),
                {
                    "original_question":
                        original_question,

                    "resolved_question":
                        resolved_question,

                    "answer":
                        answer,

                    "generated_sql":
                        generated_sql,

                    "data":
                        json.dumps(
                            data or []
                        ),

                    "status":
                        status,
                }
            )

            return result.scalar_one()

    except SQLAlchemyError as error:

        raise RuntimeError(
            f"Unable to save query history: {error}"
        ) from error


# ============================================================
# GET HISTORY
# ============================================================

def get_history(limit: int = 50):

    ensure_history_table()

    limit = max(
        1,
        min(limit, 100)
    )

    sql = """
    SELECT
        history_id,
        original_question,
        resolved_question,
        answer,
        generated_sql,
        data,
        status,
        created_at
    FROM query_history
    ORDER BY created_at DESC
    LIMIT :limit;
    """

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text(sql),
                {
                    "limit": limit
                }
            )

            rows = [
                dict(row._mapping)
                for row in result
            ]

        for row in rows:

            if row.get("created_at"):

                row["created_at"] = (
                    row["created_at"].isoformat()
                )

            if row.get("data") is None:

                row["data"] = []

        return rows

    except SQLAlchemyError as error:

        raise RuntimeError(
            f"Unable to fetch query history: {error}"
        ) from error


# ============================================================
# DELETE ONE HISTORY ITEM
# ============================================================

def delete_history_item(history_id: int):

    ensure_history_table()

    sql = """
    DELETE FROM query_history
    WHERE history_id = :history_id;
    """

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text(sql),
                {
                    "history_id":
                        history_id
                }
            )

            return {
                "deleted":
                    result.rowcount
            }

    except SQLAlchemyError as error:

        raise RuntimeError(
            f"Unable to delete history item: {error}"
        ) from error


# ============================================================
# DELETE ALL HISTORY
# ============================================================

def clear_history():

    ensure_history_table()

    sql = """
    DELETE FROM query_history;
    """

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text(sql)
            )

            return {
                "deleted":
                    result.rowcount
            }

    except SQLAlchemyError as error:

        raise RuntimeError(
            f"Unable to clear history: {error}"
        ) from error


# ============================================================
# MANUAL TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("QUERYMIND HISTORY SERVICE TEST")
    print("=" * 60)

    ensure_history_table()

    history_id = save_history(

        original_question=
            "How many customers are there?",

        resolved_question=
            "How many customers are there?",

        answer=
            "Count: 100.",

        generated_sql=
            "SELECT COUNT(*) FROM customers;",

        data=[
            {
                "count": 100
            }
        ],

        status=
            "completed"
    )

    print()
    print("Saved history ID:")
    print(history_id)

    print()
    print("History:")

    for item in get_history():

        print(item)