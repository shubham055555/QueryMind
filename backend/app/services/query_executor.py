from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import engine


# --------------------------------------------------
# Query safety configuration
# --------------------------------------------------

QUERY_TIMEOUT_MS = 10_000
LOCK_TIMEOUT_MS = 5_000
MAX_RESULT_ROWS = 1000


# --------------------------------------------------
# Execute validated SQL safely
# --------------------------------------------------

def execute_query(sql: str):

    if not sql or not sql.strip():
        raise ValueError("SQL query is empty.")

    try:

        # --------------------------------------------------
        # Open database connection
        # --------------------------------------------------

        with engine.connect() as connection:

            # --------------------------------------------------
            # Start transaction
            # --------------------------------------------------

            with connection.begin():

                # --------------------------------------------------
                # PostgreSQL READ ONLY transaction
                #
                # Even if something bypasses the application
                # validator, this database transaction cannot
                # perform INSERT / UPDATE / DELETE / DROP etc.
                # --------------------------------------------------

                connection.execute(
                    text("SET TRANSACTION READ ONLY")
                )

                # --------------------------------------------------
                # Query timeout
                #
                # Prevents expensive queries from running forever.
                # --------------------------------------------------

                connection.execute(
                    text(
                        f"SET LOCAL statement_timeout = "
                        f"'{QUERY_TIMEOUT_MS}ms'"
                    )
                )

                # --------------------------------------------------
                # Lock timeout
                #
                # Prevents waiting too long for database locks.
                # --------------------------------------------------

                connection.execute(
                    text(
                        f"SET LOCAL lock_timeout = "
                        f"'{LOCK_TIMEOUT_MS}ms'"
                    )
                )

                # --------------------------------------------------
                # Execute validated SELECT query
                # --------------------------------------------------

                result = connection.execute(
                    text(sql)
                )

                # --------------------------------------------------
                # Column names
                # --------------------------------------------------

                columns = list(result.keys())

                # --------------------------------------------------
                # Fetch result
                #
                # Limit the amount of data returned to the API.
                # --------------------------------------------------

                raw_rows = result.fetchmany(
                    MAX_RESULT_ROWS + 1
                )

                truncated = len(raw_rows) > MAX_RESULT_ROWS

                raw_rows = raw_rows[:MAX_RESULT_ROWS]

                # --------------------------------------------------
                # Convert SQLAlchemy rows → dictionaries
                # --------------------------------------------------

                rows = [
                    dict(row._mapping)
                    for row in raw_rows
                ]

                # --------------------------------------------------
                # Result
                # --------------------------------------------------

                return {
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "truncated": truncated
                }

    except SQLAlchemyError as error:

        raise RuntimeError(
            f"Database query failed: {error}"
        ) from error


# --------------------------------------------------
# Manual test
# --------------------------------------------------

if __name__ == "__main__":

    sql = """
    SELECT COUNT(*) AS customer_count
    FROM customers;
    """

    try:

        result = execute_query(sql)

        print("\n" + "=" * 60)
        print("QUERYMIND QUERY EXECUTOR TEST")
        print("=" * 60)

        print("\nSQL:")
        print(sql.strip())

        print("\nRESULT:")
        print(result)

    except Exception as error:

        print("\nQUERY FAILED:")
        print(error)