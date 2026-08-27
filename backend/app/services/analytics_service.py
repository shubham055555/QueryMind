from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import engine
from app.services.history_service import ensure_history_table


def get_analytics():
    """
    Return QueryMind usage analytics from query_history.
    """

    ensure_history_table()

    try:
        with engine.connect() as connection:

            # ------------------------------------------------
            # Total queries
            # ------------------------------------------------

            total_result = connection.execute(
                text("""
                    SELECT COUNT(*) AS total_queries
                    FROM query_history;
                """)
            )

            total_queries = total_result.scalar_one()


            # ------------------------------------------------
            # Successful queries
            # ------------------------------------------------

            successful_result = connection.execute(
                text("""
                    SELECT COUNT(*) AS successful_queries
                    FROM query_history
                    WHERE status = 'completed';
                """)
            )

            successful_queries = (
                successful_result.scalar_one()
            )


            # ------------------------------------------------
            # Failed queries
            # ------------------------------------------------

            failed_result = connection.execute(
                text("""
                    SELECT COUNT(*) AS failed_queries
                    FROM query_history
                    WHERE status = 'failed';
                """)
            )

            failed_queries = (
                failed_result.scalar_one()
            )


            # ------------------------------------------------
            # Queries by day
            # ------------------------------------------------

            activity_result = connection.execute(
                text("""
                    SELECT
                        DATE(created_at) AS query_date,
                        COUNT(*) AS query_count
                    FROM query_history
                    GROUP BY DATE(created_at)
                    ORDER BY query_date ASC;
                """)
            )

            activity = []

            for row in activity_result:

                activity.append({
                    "date": str(
                        row.query_date
                    ),
                    "count": int(
                        row.query_count
                    )
                })


            # ------------------------------------------------
            # Recent queries
            # ------------------------------------------------

            recent_result = connection.execute(
                text("""
                    SELECT
                        history_id,
                        original_question,
                        status,
                        created_at
                    FROM query_history
                    ORDER BY created_at DESC
                    LIMIT 10;
                """)
            )

            recent_queries = []

            for row in recent_result:

                recent_queries.append({
                    "history_id":
                        row.history_id,

                    "question":
                        row.original_question,

                    "status":
                        row.status,

                    "created_at":
                        row.created_at.isoformat()
                        if row.created_at
                        else None
                })


            # ------------------------------------------------
            # Success rate
            # ------------------------------------------------

            if total_queries > 0:

                success_rate = round(
                    (
                        successful_queries
                        / total_queries
                    ) * 100,
                    2
                )

            else:

                success_rate = 0


            return {

                "total_queries":
                    int(total_queries),

                "successful_queries":
                    int(successful_queries),

                "failed_queries":
                    int(failed_queries),

                "success_rate":
                    success_rate,

                "activity":
                    activity,

                "recent_queries":
                    recent_queries
            }


    except SQLAlchemyError as error:

        raise RuntimeError(
            f"Unable to fetch analytics: {error}"
        ) from error


# ============================================================
# MANUAL TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("QUERYMIND ANALYTICS TEST")
    print("=" * 60)

    result = get_analytics()

    print()

    print(
        "Total queries:",
        result["total_queries"]
    )

    print(
        "Successful:",
        result["successful_queries"]
    )

    print(
        "Failed:",
        result["failed_queries"]
    )

    print(
        "Success rate:",
        f'{result["success_rate"]}%'
    )

    print()

    print("Activity:")

    for item in result["activity"]:
        print(item)

    print()

    print("Recent queries:")

    for item in result["recent_queries"]:
        print(item)