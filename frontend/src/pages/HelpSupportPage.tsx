
import { useMemo, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clipboard,
  FileText,
  Lightbulb,
  MessageCircle,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

interface HelpSupportPageProps {
  onNavigate: (page: string) => void;
}

type HelpCategory =
  | "All"
  | "Getting started"
  | "Learning tools"
  | "PDF & AI"
  | "Account";

interface FAQItem {
  id: number;
  category: Exclude<HelpCategory, "All">;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 1,
    category: "Getting started",
    question: "How do I organize my courses?",
    answer:
      "Start by creating a semester, then add your subjects. Open a subject to create chapters. Your chapters can be used as learning notebooks for organizing notes and study material.",
  },
  {
    id: 2,
    category: "Getting started",
    question: "How do I create a notebook?",
    answer:
      "Open My Notebooks and use the create option. You can also open My Subjects, select a subject, and add a chapter. Chapters are used as notebooks in the current LearnSpace AI workspace.",
  },
  {
    id: 3,
    category: "Learning tools",
    question: "Where can I write and manage my notes?",
    answer:
      "Open a notebook or chapter and choose its notes area. You can create notes, edit existing notes and remove notes that you no longer need.",
  },
  {
    id: 4,
    category: "Learning tools",
    question: "How do I create flashcards or quizzes?",
    answer:
      "Open Flashcards or Quizzes from the sidebar. Select the available study source and configure the activity. Review generated questions and answers before using them for exam preparation.",
  },
  {
    id: 5,
    category: "PDF & AI",
    question: "How do I upload a PDF?",
    answer:
      "Open My Subjects, select a subject and open a chapter. Go to its PDF Library and use the upload option to add your document. Wait for processing to complete before asking document-related questions.",
  },
  {
    id: 6,
    category: "PDF & AI",
    question: "Why is the AI assistant not answering?",
    answer:
      "Check your internet connection and make sure the document has finished processing. Try your question again. AI responses can also fail temporarily when the AI provider is unavailable or a request cannot be processed.",
  },
  {
    id: 7,
    category: "PDF & AI",
    question: "Can I rely completely on AI-generated answers?",
    answer:
      "No. Treat AI output as a study aid. Check important facts, calculations, quotations and references against your original course material and trusted academic sources.",
  },
  {
    id: 8,
    category: "Account",
    question: "How do I update my profile?",
    answer:
      "Open My Profile from the account area in the sidebar. You can update your profile name there. Your registered email is managed through authentication.",
  },
  {
    id: 9,
    category: "Account",
    question: "What should I do if my learning data is missing?",
    answer:
      "Check that you are signed in to the correct account. Refresh the page and use the retry option if the page displays a loading error. If the issue continues, prepare a report below for your LearnSpace AI administrator.",
  },
];

const CATEGORIES: HelpCategory[] = [
  "All",
  "Getting started",
  "Learning tools",
  "PDF & AI",
  "Account",
];

export default function HelpSupportPage({
  onNavigate,
}: HelpSupportPageProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<HelpCategory>("All");
  const [openFAQ, setOpenFAQ] = useState<number | null>(1);

  const [reportTitle, setReportTitle] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportPreview, setReportPreview] = useState("");

  const filteredFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return FAQS.filter((faq) => {
      const matchesCategory =
        category === "All" || faq.category === category;

      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  async function handleCopyReport() {
    setReportStatus("");
    setReportPreview("");

    if (!reportTitle.trim() || !reportDetails.trim()) {
      setReportStatus(
        "Please enter an issue title and describe what happened."
      );
      return;
    }

    const report = [
      "LearnSpace AI — Support Report",
      "",
      `Issue: ${reportTitle.trim()}`,
      "",
      "Details:",
      reportDetails.trim(),
      "",
      `Page: ${window.location.href}`,
      `Date: ${new Date().toLocaleString()}`,
    ].join("\n");

    setReportPreview(report);

    try {
      if (!navigator.clipboard?.writeText) {
        setReportStatus(
          "Clipboard access is unavailable. You can copy the report text shown below."
        );
        return;
      }

      await navigator.clipboard.writeText(report);

      setReportStatus(
        "Report copied. Send it to your LearnSpace AI administrator through your available contact channel."
      );
    } catch {
      setReportStatus(
        "The report could not be copied automatically. Select and copy the report text below."
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">

      {/* PAGE HEADER */}

      <header>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <CircleHelp size={19} />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-green-700">
            Student support center
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Help & Support
        </h1>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Find answers, learn how to use your workspace and prepare
          a report when something goes wrong.
        </p>
      </header>


      {/* QUICK GUIDES */}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-green-700" />

          <h2 className="text-sm font-bold text-slate-900">
            Quick guides
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* SEMESTERS */}

          <button
            type="button"
            onClick={() => onNavigate("My Semesters")}
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-green-200 hover:bg-green-50/40"
          >
            <BookOpen
              size={19}
              className="mb-3 text-green-700"
            />

            <h3 className="text-xs font-bold text-slate-900">
              Organize courses
            </h3>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              Manage semesters and subjects.
            </p>

            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
              Open semesters
              <ArrowRight size={12} />
            </span>
          </button>


          {/* NOTEBOOKS */}

          <button
            type="button"
            onClick={() => onNavigate("My Notebooks")}
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-green-200 hover:bg-green-50/40"
          >
            <FileText
              size={19}
              className="mb-3 text-green-700"
            />

            <h3 className="text-xs font-bold text-slate-900">
              Use notebooks
            </h3>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              Organize chapters and notes.
            </p>

            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
              Open notebooks
              <ArrowRight size={12} />
            </span>
          </button>


          {/* PDF LIBRARY */}

          <button
            type="button"
            onClick={() => onNavigate("My Subjects")}
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-green-200 hover:bg-green-50/40"
          >
            <FileText
              size={19}
              className="mb-3 text-blue-600"
            />

            <h3 className="text-xs font-bold text-slate-900">
              PDF library
            </h3>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              Select a subject and chapter to manage PDFs.
            </p>

            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
              Choose a subject
              <ArrowRight size={12} />
            </span>
          </button>


          {/* AI ASSISTANT */}

          <button
            type="button"
            onClick={() => onNavigate("AI Assistant")}
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-green-200 hover:bg-green-50/40"
          >
            <Sparkles
              size={19}
              className="mb-3 text-violet-600"
            />

            <h3 className="text-xs font-bold text-slate-900">
              AI assistant
            </h3>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              Get help understanding study material.
            </p>

            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
              Open assistant
              <ArrowRight size={12} />
            </span>
          </button>

        </div>
      </section>


      {/* FAQ SECTION */}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="flex items-center gap-2">
          <CircleHelp size={18} className="text-green-700" />

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Frequently asked questions
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Search common questions about LearnSpace AI.
            </p>
          </div>
        </div>


        {/* SEARCH */}

        <div className="relative mt-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpenFAQ(null);
            }}
            placeholder="Search questions..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>


        {/* CATEGORY FILTERS */}

        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((item) => {
            const selected = category === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  setOpenFAQ(null);
                }}
                className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                  selected
                    ? "bg-green-700 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-green-50 hover:text-green-800"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>


        {/* QUESTIONS */}

        <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">

          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => {
              const expanded = openFAQ === faq.id;

              return (
                <div key={faq.id} className="py-3">

                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      setOpenFAQ(expanded ? null : faq.id)
                    }
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="text-xs font-semibold text-slate-800">
                      {faq.question}
                    </span>

                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400 transition ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expanded && (
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-3">
                      <p className="text-[11px] leading-6 text-slate-600">
                        {faq.answer}
                      </p>

                      <span className="mt-2 inline-block rounded-full bg-green-50 px-2 py-1 text-[9px] font-semibold text-green-800">
                        {faq.category}
                      </span>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="py-8 text-center">
              <Search
                size={23}
                className="mx-auto mb-2 text-slate-300"
              />

              <p className="text-xs font-semibold text-slate-700">
                No matching questions found.
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Try another search term or category.
              </p>
            </div>
          )}

        </div>
      </section>


      {/* TROUBLESHOOTING */}

      <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">

        <div className="flex items-start gap-3">
          <Lightbulb
            size={19}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <div>
            <h2 className="text-xs font-bold text-slate-900">
              Quick troubleshooting
            </h2>

            <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-600">
              <li>
                Check your internet connection and refresh the page.
              </li>
              <li>
                Confirm that you are signed in to the correct account.
              </li>
              <li>
                Use a page's Retry option when learning data fails to load.
              </li>
              <li>
                For PDF questions, make sure document processing has completed.
              </li>
              <li>
                For AI errors, retry later if the AI service is temporarily unavailable.
              </li>
            </ul>
          </div>
        </div>

      </section>


      {/* SUPPORT REPORT */}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <MessageCircle size={19} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Report a problem
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Prepare a report that you can share with your administrator.
            </p>
          </div>
        </div>


        <div className="mt-4 space-y-3">

          <div>
            <label
              htmlFor="support-report-title"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Issue title
            </label>

            <input
              id="support-report-title"
              value={reportTitle}
              onChange={(event) => {
                setReportTitle(event.target.value);
                setReportStatus("");
              }}
              maxLength={120}
              placeholder="Example: My PDF is not processing"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>


          <div>
            <label
              htmlFor="support-report-details"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              What happened?
            </label>

            <textarea
              id="support-report-details"
              value={reportDetails}
              onChange={(event) => {
                setReportDetails(event.target.value);
                setReportStatus("");
              }}
              rows={4}
              maxLength={3000}
              placeholder="Describe what you were doing, what you expected, and what happened instead..."
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

            <p className="mt-1 text-right text-[9px] text-slate-400">
              {reportDetails.length}/3000
            </p>
          </div>


          <button
            type="button"
            onClick={() => void handleCopyReport()}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-800"
          >
            <Clipboard size={15} />
            Copy problem report
          </button>


          {reportStatus && (
            <p
              role="status"
              className="text-[11px] leading-5 text-slate-600"
            >
              {reportStatus}
            </p>
          )}


          {reportPreview && (
            <textarea
              aria-label="Copyable support report"
              readOnly
              value={reportPreview}
              rows={7}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[10px] leading-5 text-slate-700 outline-none"
            />
          )}


          <p className="text-[10px] leading-5 text-slate-400">
            This creates a report for you to copy. It does not submit
            a support ticket or send a message automatically.
          </p>

        </div>
      </section>


      {/* ACCOUNT HELP */}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">

        <div className="flex items-center gap-2">
          <UserRound size={16} className="text-slate-400" />

          <span className="text-xs text-slate-600">
            Need to update your student information?
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("My Profile")}
          className="text-xs font-semibold text-green-700 transition hover:text-green-900"
        >
          Open My Profile
        </button>

      </section>


      <div className="flex items-center justify-center gap-2 pb-2 text-[10px] text-slate-400">
        <CheckCircle2 size={13} />
        LearnSpace AI student help center
      </div>

    </div>
  );
}
