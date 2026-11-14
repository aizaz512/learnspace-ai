
import {
  API_URL,
  authenticatedFetch,
} from "./api";

export const QUIZ_HISTORY_UPDATED_EVENT =
  "learnspace:quiz-history-updated";

// ============================================
// TYPES
// ============================================

export type QuizQuestionType =
  | "mcq"
  | "true_false"
  | "short_answer";

export type QuizDifficulty =
  | "easy"
  | "medium"
  | "hard";

export interface GenerateQuizRequest {
  question_count: number;
  difficulty: QuizDifficulty;
  question_types: QuizQuestionType[];
}

export interface GeneratedQuizQuestion {
  id: string;
  question_type: QuizQuestionType;
  question: string;
  options: string[];
  page_number: number;
  topic: string;
}

export interface GeneratedQuiz {
  quiz_id: string;
  document_id: string;
  document_name: string;
  page_count: number;
  difficulty: QuizDifficulty;
  question_types: QuizQuestionType[];
  requested_count: number;
  generated_count: number;
  questions: GeneratedQuizQuestion[];
  created_at: string;
}

export interface QuizAnswerSubmission {
  question_id: string;
  answer: string;
}

export interface QuizQuestionResult {
  question_id: string;
  question: string;
  question_type: QuizQuestionType;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  feedback: string;
  page_number: number;
  topic: string;
}

export interface QuizSubmissionResult {
  quiz_id: string;
  document_id: string;
  document_name: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  score_percentage: number;
  results: QuizQuestionResult[];
  submitted_at: string;
}

export interface StoredQuizAttempt
  extends QuizSubmissionResult {
  saved_at: string;
}

// ============================================
// API ERROR HANDLING
// ============================================

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "detail" in data
    ) {
      const detail = data.detail;

      if (typeof detail === "string") {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail
          .map((item: unknown) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "msg" in item &&
              typeof item.msg === "string"
            ) {
              return item.msg;
            }

            return "Invalid request";
          })
          .join(", ");
      }
    }
  } catch {
    // Use the fallback error message.
  }

  return `Request failed with status ${response.status}.`;
}

// ============================================
// LOAD QUIZ HISTORY FROM SUPABASE
// ============================================

export async function loadQuizHistory(): Promise<
  StoredQuizAttempt[]
> {
  const response = await authenticatedFetch(
    `${API_URL}/api/assistant/quizzes/history`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "The server returned an invalid quiz history."
    );
  }

  return data.filter(
    (item): item is StoredQuizAttempt => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return false;
      }

      const attempt =
        item as Record<string, unknown>;

      return (
        typeof attempt.quiz_id === "string" &&
        typeof attempt.document_id === "string" &&
        typeof attempt.document_name === "string" &&
        typeof attempt.total_questions === "number" &&
        typeof attempt.correct_count === "number" &&
        typeof attempt.incorrect_count === "number" &&
        typeof attempt.score_percentage === "number" &&
        typeof attempt.submitted_at === "string" &&
        typeof attempt.saved_at === "string" &&
        Array.isArray(attempt.results)
      );
    }
  );
}

// ============================================
// CLEAR QUIZ HISTORY IN SUPABASE
// ============================================

export async function clearQuizHistory(): Promise<void> {
  const response = await authenticatedFetch(
    `${API_URL}/api/assistant/quizzes/history`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  // Notify any mounted analytics page.
  window.dispatchEvent(
    new Event(QUIZ_HISTORY_UPDATED_EVENT)
  );
}

// ============================================
// GENERATE QUIZ
// ============================================

export async function generateDocumentQuiz(
  documentId: string,
  payload: GenerateQuizRequest
): Promise<GeneratedQuiz> {
  if (!documentId.trim()) {
    throw new Error(
      "Please select a PDF document."
    );
  }

  const response = await authenticatedFetch(
    `${API_URL}/api/assistant/${encodeURIComponent(
      documentId
    )}/quizzes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data: GeneratedQuiz = await response.json();

  if (
    !data.quiz_id ||
    !Array.isArray(data.questions) ||
    data.questions.length === 0
  ) {
    throw new Error(
      "The server did not return a valid quiz. Please try again."
    );
  }

  return data;
}

// ============================================
// SUBMIT QUIZ
// ============================================

export async function submitDocumentQuiz(
  quizId: string,
  answers: QuizAnswerSubmission[]
): Promise<QuizSubmissionResult> {
  if (!quizId.trim()) {
    throw new Error("Invalid quiz ID.");
  }

  const response = await authenticatedFetch(
    `${API_URL}/api/assistant/quizzes/${encodeURIComponent(
      quizId
    )}/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        answers,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data: QuizSubmissionResult =
    await response.json();

  if (
    !Array.isArray(data.results) ||
    typeof data.score_percentage !== "number" ||
    !data.quiz_id
  ) {
    throw new Error(
      "The server returned an invalid quiz result."
    );
  }

  // The backend saves the attempt to Supabase.
  // Do not save another copy in browser localStorage.
  window.dispatchEvent(
    new Event(QUIZ_HISTORY_UPDATED_EVENT)
  );

  return data;
}
