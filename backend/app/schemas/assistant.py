from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# ==========================================
# ASK QUESTION SCHEMAS
# ==========================================

class AskQuestionRequest(BaseModel):

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

    question: str = Field(
        min_length=3,
        max_length=1000,
    )


class AnswerSource(BaseModel):

    chunk_id: str

    page_number: int

    excerpt: str

    similarity: float


class AskQuestionResponse(BaseModel):

    document_id: str

    question: str

    answer: str

    sources: list[AnswerSource]


# ==========================================
# QUIZ QUESTION TYPES
# ==========================================

QuizQuestionType = Literal[
    "mcq",
    "true_false",
    "short_answer",
]


QuizDifficulty = Literal[
    "easy",
    "medium",
    "hard",
]


# ==========================================
# GENERATE QUIZ REQUEST
# ==========================================

class GenerateQuizRequest(BaseModel):

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

    question_count: int = Field(
        default=10,
        ge=5,
        le=30,
        description="Number of quiz questions (5–30).",
    )

    difficulty: QuizDifficulty = Field(
        default="medium",
        description="Quiz difficulty level.",
    )

    question_types: list[QuizQuestionType] = Field(
        default_factory=lambda: [
            "mcq",
            "true_false",
            "short_answer",
        ],
        min_length=1,
        max_length=3,
        description="Question types to include in the quiz.",
    )


# ==========================================
# STUDENT QUIZ ANSWER
# ==========================================

class QuizAnswerSubmission(BaseModel):

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

    question_id: str = Field(
        min_length=1,
        max_length=100,
    )

    answer: str = Field(
        default="",
        max_length=2000,
    )


# ==========================================
# SUBMIT QUIZ REQUEST
# ==========================================

class SubmitQuizRequest(BaseModel):

    answers: list[QuizAnswerSubmission] = Field(
        default_factory=list,
        max_length=30,
    )