from app.services.clarification_resolver import resolve_question


original_question = "Show me the best customer."

selected_option = "Highest total spending"

resolved = resolve_question(
    original_question,
    selected_option
)

print("\nORIGINAL:")
print(original_question)

print("\nUSER CHOICE:")
print(selected_option)

print("\nRESOLVED QUESTION:")
print(resolved)
