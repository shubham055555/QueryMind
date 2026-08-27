from pprint import pprint

from app.services.clarification_service import analyze_question


questions = [
    "How many customers are there?",
    "How many customers are there in Delhi?",
    "Show me the best customer.",
    "Show me the best product.",
    "Give me last month's revenue."
]


for question in questions:

    print("\n" + "=" * 60)
    print("QUESTION:")
    print(question)

    result = analyze_question(question)

    print("\nPYDANTIC RESULT:")
    pprint(result.model_dump())
