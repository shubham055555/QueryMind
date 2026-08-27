from app.services.schema_service import get_database_schema
from app.services.llm_service import generate_sql
from app.services.sql_validator import validate_sql
from app.services.query_executor import execute_query


def run_text_to_sql(question: str):

    # ==================================================
    # 1. GET DATABASE SCHEMA
    # ==================================================

    schema = get_database_schema()

    # ==================================================
    # 2. GENERATE SQL
    # ==================================================

    generated_sql = generate_sql(
        question,
        schema
    )

    # ==================================================
    # 3. ALLOWED TABLES
    # ==================================================

    allowed_tables = set(schema.keys())

    # ==================================================
    # 4. VALIDATE SQL
    # ==================================================

    validation = validate_sql(
        generated_sql,
        allowed_tables
    )

    if not validation["valid"]:

        return {
            "success": False,
            "question": question,
            "generated_sql": generated_sql,
            "validation": validation,
            "result": None
        }

    # ==================================================
    # 5. EXECUTE SQL
    # ==================================================

    result = execute_query(
        validation["sql"]
    )

    return {
        "success": True,
        "question": question,
        "generated_sql": generated_sql,
        "validation": validation,
        "result": result
    }


if __name__ == "__main__":

    question = "How many customers are there?"

    response = run_text_to_sql(question)

    print("\n==============================")
    print("QUERYMIND TEXT-TO-SQL")
    print("==============================")

    print("\nUSER QUESTION:")
    print(response["question"])

    print("\nGENERATED SQL:")
    print(response["generated_sql"])

    print("\nVALIDATION:")
    print(response["validation"])

    print("\nDATABASE RESULT:")
    print(response["result"])