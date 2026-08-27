from typing import Optional
from pydantic import BaseModel, Field


class ClarificationResult(BaseModel):
    ambiguous: bool
    intent: str = Field(min_length=1)
    clarification_question: Optional[str] = None
    options: list[str] = Field(default_factory=list)
