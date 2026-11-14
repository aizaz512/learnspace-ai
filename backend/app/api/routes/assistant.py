
from fastapi import APIRouter, HTTPException, Query

from app.schemas.assistant import (
    AskQuestionRequest,
    AskQuestionResponse,
    GenerateQuizRequest,
    SubmitQuizRequest,
)

from app.services.assistant_service import (
    answer_document_question,
    summarize_document,
    generate_document_flashcards,
    AssistantServiceError,
)

from app.services.quiz_service import (
    generate_document_quiz,
    grade_document_quiz,
    list_quiz_attempts,
    clear_quiz_attempts,
    QuizServiceError,
)

from app.services.embedding_service import EmbeddingServiceError

from app.services.rag_service import RAGProcessingError

from app.services.pdf_service import PDFProcessingError


router = APIRouter(
    prefix="/api/assistant",
    tags=["AI Assistant"],
)


# ==========================================
# ASK QUESTIONS ABOUT A PDF
# ==========================================

@router.post(
    "/{document_id}/ask",
    response_model=AskQuestionResponse,
)
def ask_about_document(
    document_id: str,
    payload: AskQuestionRequest,
):
    try:
        return answer_document_question(
            document_id=document_id,
            question=payload.question,
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except RAGProcessingError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except (
        EmbeddingServiceError,
        AssistantServiceError,
    ) as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


# ==========================================
# GENERATE STUDY SUMMARY
# ==========================================

@router.post(
    "/{document_id}/summary",
)
def summarize_uploaded_document(
    document_id: str,
):
    try:
        return summarize_document(
            document_id=document_id,
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except PDFProcessingError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except (
        EmbeddingServiceError,
        RAGProcessingError,
        AssistantServiceError,
    ) as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


# ==========================================
# GENERATE PDF FLASHCARDS
# ==========================================

@router.post(
    "/{document_id}/flashcards",
)
def generate_pdf_flashcards(
    document_id: str,
    card_count: int = Query(
        default=10,
        ge=5,
        le=30,
        description="Number of flashcards to generate (5–30).",
    ),
):
    try:
        return generate_document_flashcards(
            document_id=document_id,
            card_count=card_count,
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except PDFProcessingError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except (
        EmbeddingServiceError,
        RAGProcessingError,
        AssistantServiceError,
    ) as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


# ==========================================
# GET QUIZ HISTORY
# ==========================================

@router.get(
    "/quizzes/history",
)
def get_quiz_history():
    try:
        return list_quiz_attempts()

    except QuizServiceError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


# ==========================================
# CLEAR QUIZ HISTORY
# ==========================================

@router.delete(
    "/quizzes/history",
)
def delete_quiz_history():
    try:
        return clear_quiz_attempts()

    except QuizServiceError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


# ==========================================
# GENERATE AI QUIZ FROM PDF
# ==========================================

@router.post(
    "/{document_id}/quizzes",
)
def generate_pdf_quiz(
    document_id: str,
    payload: GenerateQuizRequest,
):
    try:
        return generate_document_quiz(
            document_id=document_id,
            question_count=payload.question_count,
            difficulty=payload.difficulty,
            question_types=payload.question_types,
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except PDFProcessingError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except QuizServiceError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


# ==========================================
# SUBMIT AND GRADE AI QUIZ
# ==========================================

@router.post(
    "/quizzes/{quiz_id}/submit",
)
def submit_pdf_quiz(
    quiz_id: str,
    payload: SubmitQuizRequest,
):
    try:
        answers = [
            answer.model_dump()
            for answer in payload.answers
        ]

        return grade_document_quiz(
            quiz_id=quiz_id,
            answers=answers,
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except QuizServiceError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc
