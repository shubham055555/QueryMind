from decimal import Decimal
from datetime import date, datetime
from typing import Any


# ============================================================
# VALUE CONVERSION
# ============================================================

def convert_value(value: Any):

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    return value


# ============================================================
# FORMAT DATABASE RESULT
# ============================================================

def format_database_result(result: dict):

    if not result:
        return []

    rows = result.get("rows", [])

    formatted_rows = []

    for row in rows:

        formatted_rows.append({
            key: convert_value(value)
            for key, value in row.items()
        })

    return formatted_rows


# ============================================================
# HUMAN-READABLE COLUMN NAME
# ============================================================

def pretty_name(name: str):

    return (
        name
        .replace("_", " ")
        .strip()
        .title()
    )


# ============================================================
# FORMAT NUMBER
# ============================================================

def format_number(value):

    if isinstance(value, float):

        if value.is_integer():
            return f"{int(value):,}"

        return f"{value:,.2f}"

    if isinstance(value, int):
        return f"{value:,}"

    return str(value)


# ============================================================
# SINGLE VALUE ANSWER
# ============================================================

def build_single_value_answer(
    key: str,
    value: Any
):

    label = pretty_name(key)

    formatted_value = format_number(value)

    key_lower = key.lower()

    # --------------------------------------------------------
    # Count
    # --------------------------------------------------------

    if (
        "count" in key_lower
        or key_lower.startswith("total_")
    ):

        if (
            "customer" in key_lower
            or "customers" in key_lower
        ):
            return (
                f"There are {formatted_value} "
                f"customers in the database."
            )

        if (
            "order" in key_lower
            or "orders" in key_lower
        ):
            return (
                f"There are {formatted_value} "
                f"orders."
            )

    # --------------------------------------------------------
    # Revenue
    # --------------------------------------------------------

    if "revenue" in key_lower:

        return (
            f"The total revenue is "
            f"{formatted_value}."
        )

    # --------------------------------------------------------
    # Spending
    # --------------------------------------------------------

    if (
        "spending" in key_lower
        or "spent" in key_lower
    ):

        return (
            f"The total spending is "
            f"{formatted_value}."
        )

    # --------------------------------------------------------
    # Generic
    # --------------------------------------------------------

    return (
        f"{label}: {formatted_value}."
    )


# ============================================================
# CUSTOMER INSIGHT
# ============================================================

def build_customer_answer(
    row: dict
):

    name = row.get("name")

    spending = row.get(
        "total_spending"
    )

    customer_id = row.get(
        "customer_id"
    )

    if name and spending is not None:

        answer = (
            f"{name} is the highest-spending "
            f"customer, with total spending of "
            f"{format_number(spending)}."
        )

        if customer_id is not None:

            answer += (
                f" Customer ID: {customer_id}."
            )

        return answer

    return None


# ============================================================
# GENERIC SINGLE ROW ANSWER
# ============================================================

def build_single_row_answer(
    row: dict
):

    # --------------------------------------------------------
    # Customer-specific result
    # --------------------------------------------------------

    customer_answer = build_customer_answer(
        row
    )

    if customer_answer:
        return customer_answer

    # --------------------------------------------------------
    # Generic entity with name
    # --------------------------------------------------------

    name = row.get("name")

    if name:

        other_values = []

        for key, value in row.items():

            if key == "name":
                continue

            if value is None:
                continue

            other_values.append(
                f"{pretty_name(key)}: "
                f"{format_number(value)}"
            )

        if other_values:

            return (
                f"{name} — "
                + ", ".join(other_values)
                + "."
            )

        return f"The result is {name}."

    # --------------------------------------------------------
    # Generic row
    # --------------------------------------------------------

    parts = []

    for key, value in row.items():

        if value is None:
            continue

        parts.append(
            f"{pretty_name(key)}: "
            f"{format_number(value)}"
        )

    if parts:
        return ". ".join(parts) + "."

    return "A result was found."


# ============================================================
# MULTI-ROW ANSWER
# ============================================================

def build_multi_row_answer(
    rows: list[dict]
):

    count = len(rows)

    if count == 0:
        return "No results found."

    # --------------------------------------------------------
    # Customer ranking
    # --------------------------------------------------------

    if all(
        "name" in row
        for row in rows
    ):

        if all(
            "total_spending" in row
            for row in rows
        ):

            first = rows[0]

            name = first.get(
                "name"
            )

            spending = first.get(
                "total_spending"
            )

            if name and spending is not None:

                return (
                    f"Found {count} customers. "
                    f"{name} is currently the top "
                    f"result with total spending of "
                    f"{format_number(spending)}."
                )

    # --------------------------------------------------------
    # Generic
    # --------------------------------------------------------

    return (
        f"Found {count} results."
    )


# ============================================================
# MAIN ANSWER BUILDER
# ============================================================

def build_answer(
    rows: list[dict]
):

    # --------------------------------------------------------
    # No results
    # --------------------------------------------------------

    if not rows:
        return "No results found."

    # --------------------------------------------------------
    # One row
    # --------------------------------------------------------

    if len(rows) == 1:

        row = rows[0]

        # ----------------------------------------------
        # One column
        # ----------------------------------------------

        if len(row) == 1:

            key = next(
                iter(row)
            )

            value = row[key]

            return build_single_value_answer(
                key,
                value
            )

        # ----------------------------------------------
        # Multiple columns
        # ----------------------------------------------

        return build_single_row_answer(
            row
        )

    # --------------------------------------------------------
    # Multiple rows
    # --------------------------------------------------------

    return build_multi_row_answer(
        rows
    )


# ============================================================
# MANUAL TESTS
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("QUERYMIND RESPONSE FORMATTER TEST")
    print("=" * 60)


    # --------------------------------------------------------
    # Test 1
    # --------------------------------------------------------

    rows = [
        {
            "count": 100
        }
    ]

    print("\nTEST 1:")
    print(build_answer(rows))


    # --------------------------------------------------------
    # Test 2
    # --------------------------------------------------------

    rows = [
        {
            "customer_id": 100,
            "name": "Customer 100",
            "email": "customer100@example.com",
            "total_spending": Decimal(
                "45300.00"
            )
        }
    ]

    formatted = format_database_result({
        "rows": rows
    })

    print("\nTEST 2:")
    print(formatted)
    print(build_answer(formatted))


    # --------------------------------------------------------
    # Test 3
    # --------------------------------------------------------

    rows = [
        {
            "customer_id": 100,
            "name": "Customer 100",
            "total_spending": 45300
        },
        {
            "customer_id": 101,
            "name": "Customer 101",
            "total_spending": 42000
        },
        {
            "customer_id": 102,
            "name": "Customer 102",
            "total_spending": 39000
        }
    ]

    print("\nTEST 3:")
    print(build_answer(rows))


    # --------------------------------------------------------
    # Test 4
    # --------------------------------------------------------

    rows = []

    print("\nTEST 4:")
    print(build_answer(rows))