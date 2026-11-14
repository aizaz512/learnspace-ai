import { useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import {
  Bot,
  BookOpen,
  Send,
  User,
  LoaderCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  History,
  Pencil,
  Trash2,
  ArrowUpRight,
} from "lucide-react";

import { askDocumentQuestion } from "../services/assistant";
import type { AssistantSource } from "../services/assistant";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AssistantSource[];
}

interface SavedConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface DocumentAssistantProps {
  documentId: string;
  documentName: string;
  onSourceClick: (pageNumber: number) => void;
}

const SUGGESTED_QUESTIONS = [
  "Summarize this PDF in simple words.",
  "Explain the most important concepts.",
  "What are the key points I should remember?",
];

const STORAGE_PREFIX = "learnspace-ai-conversations-v1";

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createConversationId() {
  return `conversation-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getStorageKey(documentId: string) {
  return `${STORAGE_PREFIX}:${documentId}`;
}

function createConversationTitle(question: string) {
  const title = question.trim();

  return title.length > 42
    ? `${title.slice(0, 42)}...`
    : title;
}

function loadConversations(storageKey: string): SavedConversation[] {
  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    const validConversations = parsed.filter((item: unknown) => {
      if (!item || typeof item !== "object") return false;

      const conversation = item as Record<string, unknown>;

      return (
        typeof conversation.id === "string" &&
        typeof conversation.title === "string" &&
        typeof conversation.createdAt === "string" &&
        typeof conversation.updatedAt === "string" &&
        Array.isArray(conversation.messages)
      );
    });

    return validConversations as SavedConversation[];
  } catch (error) {
    console.error("Unable to load saved conversations:", error);
    return [];
  }
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DocumentAssistant(
  props: DocumentAssistantProps
) {
  return <DocumentAssistantSession key={props.documentId} {...props} />;
}

function DocumentAssistantSession({
  documentId,
  documentName,
  onSourceClick,
}: DocumentAssistantProps) {
  const storageKey = getStorageKey(documentId);

  const [initialData] = useState(() => {
    const saved = loadConversations(storageKey);

    const latest = [...saved].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    )[0];

    return {
      conversations: saved,
      activeId: latest?.id ?? null,
    };
  });

  const [conversations, setConversations] = useState<SavedConversation[]>(
    initialData.conversations
  );

  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(initialData.activeId);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const [expandedSources, setExpandedSources] = useState<
    Record<string, boolean>
  >({});

  // Save conversations automatically.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversations));
      setStorageWarning("");
    } catch (err) {
      console.error("Unable to save conversations:", err);

      setStorageWarning(
        "Your browser could not save chat history. Check your available storage."
      );
    }
  }, [storageKey, conversations]);

  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
  );

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  const messages = activeConversation?.messages ?? [];

  function handleNewConversation() {
    if (loading) return;

    setActiveConversationId(null);
    setQuestion("");
    setError("");
    setExpandedSources({});
    setHistoryOpen(false);
  }

  function handleSelectConversation(conversationId: string) {
    if (loading) return;

    setActiveConversationId(conversationId);
    setQuestion("");
    setError("");
    setExpandedSources({});
    setHistoryOpen(false);
  }

  function handleRenameConversation(conversation: SavedConversation) {
    if (loading) return;

    const newTitle = window
      .prompt("Enter a new conversation name:", conversation.title)
      ?.trim();

    if (!newTitle) return;

    const now = new Date().toISOString();

    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              title: newTitle.slice(0, 80),
              updatedAt: now,
            }
          : item
      )
    );
  }

  function handleDeleteConversation(conversationId: string) {
    if (loading) return;

    const confirmed = window.confirm(
      "Delete this conversation permanently?"
    );

    if (!confirmed) return;

    const remaining = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );

    setConversations(remaining);

    if (activeConversationId === conversationId) {
      const nextActive = [...remaining].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      )[0];

      setActiveConversationId(nextActive?.id ?? null);
      setExpandedSources({});
      setError("");
    }
  }

  async function sendQuestion(value: string) {
    const trimmedQuestion = value.trim();

    if (!trimmedQuestion || loading) return;

    if (trimmedQuestion.length < 3) {
      setError("Please enter at least 3 characters.");
      return;
    }

    if (trimmedQuestion.length > 1000) {
      setError("Your question cannot exceed 1000 characters.");
      return;
    }

    setQuestion("");
    setError("");

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmedQuestion,
    };

    const now = new Date().toISOString();

    let conversationId = activeConversationId;

    const activeExists = conversations.some(
      (conversation) => conversation.id === conversationId
    );

    if (!conversationId || !activeExists) {
      conversationId = createConversationId();

      const newConversation: SavedConversation = {
        id: conversationId,
        title: createConversationTitle(trimmedQuestion),
        createdAt: now,
        updatedAt: now,
        messages: [userMessage],
      };

      setConversations((current) => [
        newConversation,
        ...current,
      ]);

      setActiveConversationId(conversationId);
    } else {
      const targetId = conversationId;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === targetId
            ? {
                ...conversation,
                messages: [...conversation.messages, userMessage],
                updatedAt: now,
              }
            : conversation
        )
      );
    }

    setLoading(true);

    try {
      const result = await askDocumentQuestion(
        documentId,
        trimmedQuestion
      );

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      };

      const updatedAt = new Date().toISOString();
      const targetId = conversationId;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === targetId
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  assistantMessage,
                ],
                updatedAt,
              }
            : conversation
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(question);
    }
  }

  function toggleSources(messageId: string) {
    setExpandedSources((current) => ({
      ...current,
      [messageId]: !current[messageId],
    }));
  }

  return (
    <section className="flex h-[700px] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <Bot size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">
            LearnSpace AI
          </h2>

          <p className="truncate text-[11px] text-slate-500">
            Ask questions about {documentName}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen((current) => !current)}
            disabled={loading}
            aria-expanded={historyOpen}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <History size={14} />
            History
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px]">
              {conversations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleNewConversation}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={14} />
            New
          </button>
        </div>
      </div>

      {/* Conversation history */}
      {historyOpen && (
        <div className="max-h-48 overflow-y-auto border-b border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Previous conversations
            </p>

            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Close
            </button>
          </div>

          {sortedConversations.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
              No saved conversations yet. Ask your first question to
              start one.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedConversations.map((conversation) => {
                const isActive =
                  conversation.id === activeConversationId;

                return (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-2 rounded-lg border p-2 ${
                      isActive
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectConversation(conversation.id)
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {conversation.title}
                      </span>

                      <span className="mt-1 block text-[9px] text-slate-400">
                        {formatUpdatedAt(conversation.updatedAt)}
                        {" · "}
                        {conversation.messages.length} messages
                      </span>
                    </button>

                    <button
                      type="button"
                      title="Rename conversation"
                      aria-label="Rename conversation"
                      onClick={() =>
                        handleRenameConversation(conversation)
                      }
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      title="Delete conversation"
                      aria-label="Delete conversation"
                      onClick={() =>
                        handleDeleteConversation(conversation.id)
                      }
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Storage warning */}
      {storageWarning && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[10px] text-amber-800">
          {storageWarning}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-4">
        {messages.length === 0 && (
          <div className="flex min-h-full flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <BookOpen size={30} />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Your AI study assistant
            </h3>

            <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
              Ask anything about this PDF. I&apos;ll find relevant
              information and provide page references.
            </p>

            <div className="mt-6 w-full space-y-2 text-left">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Try asking
              </p>

              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendQuestion(suggestion)}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                >
                  <BookOpen
                    size={15}
                    className="shrink-0 text-indigo-500"
                  />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2.5 ${
              message.role === "user"
                ? "flex-row-reverse"
                : "flex-row"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                message.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600"
              }`}
            >
              {message.role === "user" ? (
                <User size={16} />
              ) : (
                <Bot size={17} />
              )}
            </div>

            <div
              className={`min-w-0 max-w-[88%] rounded-2xl p-3 ${
                message.role === "user"
                  ? "rounded-tr-sm bg-indigo-600 text-white"
                  : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-xs leading-6">
                {message.content}
              </p>

              {message.role === "assistant" &&
                message.sources &&
                message.sources.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => toggleSources(message.id)}
                      className="flex w-full items-center justify-between gap-2 text-[11px] font-semibold text-indigo-600"
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={14} />
                        Sources ({message.sources.length})
                      </span>

                      {expandedSources[message.id] ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      )}
                    </button>

                    {expandedSources[message.id] && (
                      <div className="mt-3 space-y-2">
                        {message.sources.map((source, index) => (
                          <button
                            key={`${source.chunk_id}-${source.page_number}-${index}`}
                            type="button"
                            onClick={() =>
                              onSourceClick(source.page_number)
                            }
                            title={`Open PDF page ${source.page_number}`}
                            aria-label={`Open PDF page ${source.page_number}`}
                            className="block w-full rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-indigo-700">
                                PDF page {source.page_number}
                              </span>

                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-indigo-600">
                                Open in reader
                                <ArrowUpRight size={11} />
                              </span>
                            </span>

                            <span className="mt-1 block whitespace-pre-wrap text-[10px] leading-5 text-slate-500">
                              {source.excerpt}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Bot size={17} />
            </div>

            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
              <LoaderCircle
                size={15}
                className="animate-spin text-indigo-600"
              />
              Searching your PDF and generating an answer...
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 bg-white p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-400">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={2}
            maxLength={1000}
            placeholder="Ask something about your PDF..."
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            aria-label="Send question"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-[9px] text-slate-400">
          Answers are generated from the uploaded PDF. Verify
          important information against the original document.
        </p>
      </form>
    </section>
  );
}