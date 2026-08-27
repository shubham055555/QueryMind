import re
import sqlglot
from sqlglot import exp


# --------------------------------------------------
# Dangerous SQL keywords
# --------------------------------------------------

BLOCKED_KEYWORDS = {
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "GRANT",
    "REVOKE",
    "MERGE",
    "REPLACE",
    "VACUUM",
    "ANALYZE",
    "COMMENT",
}


# --------------------------------------------------
# Remove markdown code fences
# --------------------------------------------------

def clean_sql(sql: str) -> str:
    if not sql:
        return ""

    sql = sql.strip()

    # ```sql ... ```
    sql = re.sub(r"^```sql\s*", "", sql, flags=re.IGNORECASE)
    sql = re.sub(r"^```\s*", "", sql)
    sql = re.sub(r"\s*```$", "", sql)

    return sql.strip()


# --------------------------------------------------
# Validate SQL
# --------------------------------------------------

def validate_sql(
    sql: str,
    allowed_tables: set[str]
) -> dict:

    sql = clean_sql(sql)

    # --------------------------------------------------
    # Empty SQL
    # --------------------------------------------------

    if not sql:
        return {
            "valid": False,
            "reason": "Generated SQL is empty.",
            "sql": sql,
            "tables": []
        }

    # --------------------------------------------------
    # Normalize allowed table names
    # --------------------------------------------------

    allowed_tables = {
        str(table).lower()
        for table in allowed_tables
    }

    # --------------------------------------------------
    # Block multiple SQL statements
    # --------------------------------------------------

    try:
        statements = sqlglot.parse(
            sql,
            read="postgres"
        )
    except Exception as error:
        return {
            "valid": False,
            "reason": f"SQL parsing failed: {error}",
            "sql": sql,
            "tables": []
        }

    if len(statements) != 1:
        return {
            "valid": False,
            "reason": "Multiple SQL statements are not allowed.",
            "sql": sql,
            "tables": []
        }

    statement = statements[0]

    # --------------------------------------------------
    # Only SELECT queries are allowed
    # --------------------------------------------------

    if not isinstance(statement, exp.Select):
        return {
            "valid": False,
            "reason": (
                "Only read-only SELECT queries are allowed."
            ),
            "sql": sql,
            "tables": []
        }

    # --------------------------------------------------
    # Extra keyword protection
    # --------------------------------------------------

    upper_sql = sql.upper()

    for keyword in BLOCKED_KEYWORDS:

        if re.search(
            rf"\b{re.escape(keyword)}\b",
            upper_sql
        ):
            return {
                "valid": False,
                "reason": (
                    f"Blocked SQL operation detected: {keyword}"
                ),
                "sql": sql,
                "tables": []
            }

    # --------------------------------------------------
    # Extract tables from parsed SQL
    # --------------------------------------------------

    tables = set()

    for table in statement.find_all(exp.Table):

        table_name = table.name.lower()

        if table_name:
            tables.add(table_name)

    # --------------------------------------------------
    # Check tables against database schema
    # --------------------------------------------------

    unauthorized_tables = tables - allowed_tables

    if unauthorized_tables:

        return {
            "valid": False,
            "reason": (
                "Query references unauthorized table(s): "
                + ", ".join(sorted(unauthorized_tables))
            ),
            "sql": sql,
            "tables": sorted(tables)
        }

    # --------------------------------------------------
    # Successful validation
    # --------------------------------------------------

    return {
        "valid": True,
        "reason": "SQL validation successful",
        "sql": sql,
        "tables": sorted(tables)
    }


# --------------------------------------------------
# Manual tests
# --------------------------------------------------

if __name__ == "__main__":

    allowed_tables = {
        "customers",
        "orders",
        "products"
    }

    tests = [

        (
            "SELECT COUNT(*) FROM customers;",
            True
        ),

        (
            "SELECT * FROM customers LIMIT 5;",
            True
        ),

        (
            """
            SELECT c.name, SUM(o.total_amount)
            FROM customers c
            JOIN orders o
                ON c.customer_id = o.customer_id
            GROUP BY c.name;
            """,
            True
        ),

        (
            "DELETE FROM customers;",
            False
        ),

        (
            "DROP TABLE customers;",
            False
        ),

        (
            "UPDATE customers SET name = 'Hacker';",
            False
        ),

        (
            "SELECT * FROM users;",
            False
        ),

        (
            "SELECT * FROM customers; SELECT * FROM orders;",
            False
        ),
    ]

    print("\n" + "=" * 60)
    print("QUERYMIND SQL VALIDATOR TEST")
    print("=" * 60)

    for sql, expected in tests:

        result = validate_sql(
            sql,
            allowed_tables
        )

        status = "PASS" if result["valid"] == expected else "FAIL"

        print(f"\n[{status}]")
        print("SQL:")
        print(sql.strip())
        print("Result:")
        print(result)