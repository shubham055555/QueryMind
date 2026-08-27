from app.services.schema_service import get_database_schema
from app.services.llm_service import generate_sql

schema = get_database_schema()

question = "How many customers are there?"

sql = generate_sql(question, schema)

print("\nUSER QUESTION:")
print(question)

print("\nGENERATED SQL:")
print(sql)
