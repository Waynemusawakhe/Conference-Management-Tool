import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { faqsApi } from "../api/faqsApi";

const faqQuestion = (f) => f.question ?? f.title ?? `FAQ #${f.id}`;
const faqAnswer = (f) => f.answer ?? f.body ?? "";
const faqCategory = (f) => {
  const c = f.category;
  if (typeof c === "string" && c.trim()) return c.trim();
  if (c && typeof c === "object") return c.name ?? c.title ?? null;
  return null;
};

function StatStrip({ faqs, categories }) {
  const items = [
    {
      label: "Total FAQs",
      value: faqs.length,
      icon: <HelpCircle size={14} />,
      tone: "text-[#4f46c7] bg-[#efedff]",
    },
    {
      label: "Categories",
      value: categories.length,
      icon: <Tag size={14} />,
      tone: "text-[#1d5fa8] bg-[#eef5fd]",
    },
    {
      label: "Uncategorised",
      value: faqs.filter((f) => !faqCategory(f)).length,
      icon: <HelpCircle size={14} />,
      tone: "text-[#9b7414] bg-[#fff9e9]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-[14px] border border-[#e4e8f0] bg-white p-3 shadow-[0_6px_18px_rgba(15,28,65,.03)]"
        >
          <span className={`inline-grid h-7 w-7 place-items-center rounded-lg ${it.tone}`}>
            {it.icon}
          </span>
          <strong className="mt-3 block text-[18px] leading-none tracking-[-.03em] text-[#1c2a4a]">
            {it.value}
          </strong>
          <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LoadingRows({ rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <div key={i} className="border-b border-[#f0f2f6] px-5 py-4 last:border-0">
      <div className="space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#eef1f7]" />
        <div className="h-2.5 w-full animate-pulse rounded-full bg-[#eef1f7]" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-[#eef1f7]" />
        <div className="mt-2 h-4 w-20 animate-pulse rounded-full bg-[#eef1f7]" />
      </div>
    </div>
  ));
}

function ConfirmDeleteModal({ open, onClose, onConfirm, faq, busy }) {
  if (!open || !faq) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/60 p-4 backdrop-blur-sm"
      onClick={busy ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)] animate-[scaleIn_.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center p-6 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500">
            <TriangleAlert size={28} />
          </div>
          <h2 className="text-[18px] font-extrabold text-[#1c2a4a]">Delete this FAQ?</h2>
          <p className="mt-2 text-[12px] leading-6 text-[#66728b]">
            Are you sure you want to delete <strong>"{faqQuestion(faq)}"</strong>? This action cannot be undone and will remove it from the Help & FAQ page.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#edf0f5] bg-[#fafbfe] p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-4 text-[12px] font-extrabold text-[#5c6880] transition hover:bg-[#f3f5f9] disabled:opacity-50"
          >
            No, cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(220,38,38,.25)] transition hover:bg-red-700 hover:shadow-[0_12px_25px_rgba(220,38,38,.35)] disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Yes, delete
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function AdminFaqsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [feedback, setFeedback] = useState(null);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const faqsRes = useApiResource(() => faqsApi.getAll(), []);
  const faqs = useMemo(() => toArray(faqsRes.data), [faqsRes.data]);

  const categories = useMemo(() => {
    const set = new Set();
    faqs.forEach((f) => {
      const c = faqCategory(f);
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [faqs]);

  const filterChips = useMemo(
    () => [
      { key: "all", label: "All" },
      ...categories.map((c) => ({ key: c, label: c })),
      { key: "__uncategorised__", label: "Uncategorised" },
    ],
    [categories]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      const cat = faqCategory(f);
      if (categoryFilter === "__uncategorised__") {
        if (cat) return false;
      } else if (categoryFilter !== "all") {
        if (cat !== categoryFilter) return false;
      }
      if (!q) return true;
      return [faqQuestion(f), faqAnswer(f), cat ?? "", String(f.id ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [faqs, query, categoryFilter]);

  const requestDelete = (faq) => {
    setFeedback(null);
    setDeleteTarget(faq);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await faqsApi.remove(deleteTarget.id);
      await faqsRes.reload();
      setFeedback({ type: "success", message: "FAQ deleted successfully." });
      setDeleteTarget(null);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message ?? "Failed to delete FAQ.",
      });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout
      subtitle="Help centre"
      title="FAQs"
      action={
        <button
          onClick={() => navigate("/admin/faqs/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"
        >
          <Plus size={14} /> New FAQ
        </button>
      }
    >
      {feedback && (
        <div
          role="alert"
          className={`mb-4 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[11px] font-semibold ${
            feedback.type === "success"
              ? "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]"
              : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {!faqsRes.loading && !faqsRes.error && faqs.length > 0 && (
        <div className="mb-5">
          <StatStrip faqs={faqs} categories={categories} />
        </div>
      )}

      <Card className="overflow-hidden border-0 ring-1 ring-[#eef1f7] shadow-[0_20px_60px_-30px_rgba(23,35,66,.18)]">
        <CardHeader
          eyebrow="Manage"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6655f6] to-[#8b7bff] text-white shadow-[0_8px_18px_-6px_rgba(102,85,246,.55)]">
                <HelpCircle size={14} />
              </span>
              {filtered.length === faqs.length
                ? `${faqs.length} FAQ${faqs.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${faqs.length} FAQs`}
            </span>
          }
          action={
            <div className="relative w-full sm:w-[280px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                size={15}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search question, answer, category…"
                className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-9 text-[11px] outline-none transition focus:border-[#8175ef] focus:bg-white focus:ring-2 focus:ring-[#8175ef]/10"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[#98a1b3] hover:bg-[#eef1f7] hover:text-[#5c6880]"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          }
        />

        {filterChips.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-[#edf0f5] px-5 py-3 sm:px-6">
            {filterChips.map((r) => {
              const isActive = categoryFilter === r.key;
              const count =
                r.key === "all"
                  ? faqs.length
                  : r.key === "__uncategorised__"
                  ? faqs.filter((f) => !faqCategory(f)).length
                  : faqs.filter((f) => faqCategory(f) === r.key).length;
              return (
                <button
                  key={r.key}
                  onClick={() => setCategoryFilter(r.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${
                    isActive
                      ? "border-transparent bg-[#07132f] text-white shadow-[0_6px_18px_rgba(7,19,47,.18)]"
                      : "border-[#e2e6ee] bg-white text-[#66728b] hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"
                  }`}
                >
                  {r.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                      isActive ? "bg-white/20 text-white" : "bg-[#f1efff] text-[#5649dc]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div>
          {faqsRes.loading && <LoadingRows />}

          {!faqsRes.loading && faqsRes.error && (
            <StateBlock
              kind="error"
              message={faqsRes.error.message}
              onRetry={faqsRes.reload}
            />
          )}

          {!faqsRes.loading && !faqsRes.error && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]">
                <HelpCircle size={22} />
              </span>
              <h3 className="m-0 text-[13px] font-bold text-[#1c2a4a]">
                {faqs.length === 0
                  ? "No FAQs yet"
                  : query || categoryFilter !== "all"
                  ? "No matches"
                  : "Nothing here"}
              </h3>
              <p className="m-0 max-w-[400px] text-[11px] leading-5 text-[#8993a6]">
                {faqs.length === 0
                  ? "Create your first FAQ so visitors can find answers on the Help & FAQ page."
                  : "Try a different search term, or clear the filters to see every FAQ."}
              </p>
              {faqs.length === 0 ? (
                <button
                  onClick={() => navigate("/admin/faqs/new")}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                >
                  <Plus size={12} /> Create first FAQ
                </button>
              ) : (
                (query || categoryFilter !== "all") && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setCategoryFilter("all");
                    }}
                    className="mt-1 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                  >
                    Clear filters
                  </button>
                )
              )}
            </div>
          )}

          {!faqsRes.loading &&
            !faqsRes.error &&
            filtered.map((faq) => {
              const cat = faqCategory(faq);
              return (
                <div
                  key={faq.id}
                  className="cmt-admin-list-card group relative border-b border-[#f0f2f6] px-5 py-4 transition last:border-0 hover:bg-[#fafbff] sm:px-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#efedff] to-[#e0dcff] text-[11px] font-extrabold text-[#4f46c7] shadow-[0_6px_14px_-4px_rgba(102,85,246,.28)]">
                          <HelpCircle size={15} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="block truncate text-[12px] font-bold text-[#1c2a4a]">
                              {faqQuestion(faq)}
                            </strong>
                            <span className="shrink-0 text-[9px] font-semibold text-[#aeb6c6]">
                              #{faq.id}
                            </span>
                          </div>
                          {faqAnswer(faq) && (
                            <p className="m-0 mt-1 line-clamp-2 text-[11px] leading-5 text-[#5c6880]">
                              {faqAnswer(faq)}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {cat ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#c9dff5] bg-[#eef5fd] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#1d5fa8]">
                                <Tag size={10} /> {cat}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-[#e2e6ee] bg-[#f5f6fa] px-2 py-0.5 text-[9px] font-bold text-[#8a95a8]">
                                Uncategorised
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/faqs/${faq.id}/edit`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 transition hover:bg-blue-100"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => requestDelete(faq)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-100"
                        aria-label={`Delete ${faqQuestion(faq)}`}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                      <span className="ml-1 hidden h-7 w-7 place-items-center rounded-full text-[#aeb6c6] transition group-hover:bg-[#efedff] group-hover:text-[#5649dc] sm:inline-grid">
                        <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        faq={deleteTarget}
        busy={isDeleting}
      />
    </AdminLayout>
  );
}