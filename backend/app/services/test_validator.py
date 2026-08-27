from app.services.sql_validator import validate_sql


allowed_tables = {
    "customers",
    "products",
    "orders",
    "order_items",
    "payments"
}


tests = [
    "SELECT COUNT(*) FROM customers;",
    "SELECT * FROM orders LIMIT 5;",
    "SELECT * FROM unknown_table;",
    "DELETE FROM customers;",
    "DROP TABLE customers;",
    "UPDATE customers SET city = 'Delhi';"
]


for sql in tests:

    result = validate_sql(sql, allowed_tables)

    print("\nSQL:")
    print(sql)

    print("RESULT:")
    print(result)
