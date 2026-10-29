import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Hash,
  HelpCircle,
  Loader2,
  MessageSquare,
  Save,
  Tag,
  Trash2,
  TriangleAlert,
  Type,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDate } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { faqsApi } from "../api/faqsApi";

const QUESTION_MAX = 500;
const CATEGORY_MAX = 255;

function Field({ icon, label, error, hint, children }) {
  return (
    <div className="grid gap-2">
      <label className="grid gap-2">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#3b4761]">
            <span className="text-[#7a6ef0]">{icon}</span>
            {label}
          </span>
          {hint}
        </span>
        {children}
      </label>
      {error && (
        <span
          role="alert"
          className="flex items-center gap-1 text-[11px] font-semibold text-red-600"
        >
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
}

function inputClass(error, extra = "") {
  const base =
    "min-h-11 w-full rounded-xl border bg-white px-3.5 text-[13px] text-[#1c2a4a] outline-none transition placeholder:text-[#aab3c4] focus:ring-4";
  const tone = error
    ? "border-[#e8b4b4] bg-[#fffafa] focus:border-[#d98080] focus:ring-[#d98080]/10"
    : "border-[#e4e8f0] hover:border-[#d6dbe8] focus:border-[#8878f8] focus:ring-[#8878f8]/10";
  return `${base} ${tone} ${extra}`;
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
            Are you sure you want to delete this FAQ? This action cannot be undone and will remove it from the Help & FAQ page.
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

export default function AdminFaqEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const faqRes = useApiResource(
    () => (isEdit ? faqsApi.getById(id) : Promise.resolve(null)),
    [id, isEdit]
  );
  const faq = faqRes.data?.data ?? faqRes.data ?? null;

  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (!isEdit || !faq) return;
    setForm({
      question: faq.question ?? faq.title ?? "",
      answer: faq.answer ?? faq.body ?? "",
      category:
        typeof faq.category === "string"
          ? faq.category
          : faq.category?.name ?? faq.category?.title ?? "",
    });
  }, [faq, isEdit]);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const questionCount = form.question.length;
  const categoryCount = form.category.length;

  const validate = () => {
    const next = {};
    if (!form.question.trim()) next.question = "Question is required.";
    else if (form.question.trim().length > QUESTION_MAX)
      next.question = `Question must be ${QUESTION_MAX} characters or fewer.`;

    if (!form.answer.trim()) next.answer = "Answer is required.";

    if (form.category && form.category.length > CATEGORY_MAX)
      next.category = `Category must be ${CATEGORY_MAX} characters or fewer.`;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
      };
      const cat = form.category.trim();
      if (cat) payload.category = cat;

      if (isEdit) {
        await faqsApi.update(id, payload);
      } else {
        await faqsApi.create(payload);
      }

      navigate("/admin/faqs");
    } catch (err) {
      if (err?.status === 422 && err.errors) setErrors(err.errors);
      setBanner({
        type: "error",
        text:
          err?.message ??
          (isEdit ? "Unable to update FAQ." : "Unable to create FAQ."),
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!faq) return;
    
    setDeleting(true);
    setBanner(null);
    try {
      await faqsApi.remove(faq.id);
      navigate("/admin/faqs");
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.message ?? "Failed to delete FAQ.",
      });
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (isEdit && faqRes.loading) {
    return (
      <AdminLayout subtitle="FAQ" title="Edit FAQ">
        <Card>
          <StateBlock kind="loading" message="Loading FAQ…" />
        </Card>
      </AdminLayout>
    );
  }

  if (isEdit && !faqRes.loading && faqRes.error) {
    return (
      <AdminLayout subtitle="FAQ" title="Edit FAQ">
        <Card>
          <StateBlock
            kind="error"
            message={faqRes.error.message}
            onRetry={faqRes.reload}
          />
        </Card>
      </AdminLayout>
    );
  }

  const displayTitle = isEdit
    ? form.question || faq?.question || "Edit FAQ"
    : "New FAQ";

  return (
    <AdminLayout
      subtitle="FAQ"
      title={displayTitle}
      action={
        <button
          onClick={() => navigate("/admin/faqs")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#07132f] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_26px_rgba(7,19,47,.28)] transition hover:-translate-y-px hover:bg-[#0a1740] focus:outline-none focus:ring-4 focus:ring-[#07132f]/20"
        >
          <ArrowLeft size={14} /> Back
        </button>
      }
    >
      {banner && (
        <div
          role="alert"
          className={`mb-4 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[11px] font-semibold ${
            banner.type === "success"
              ? "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]"
              : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"
          }`}
        >
          <span>{banner.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader
            eyebrow={isEdit ? "Edit" : "Create"}
            title="FAQ content"
          />

          <form onSubmit={handleSubmit} className="grid gap-6 p-6 sm:p-7">
            <Field
              icon={<Type size={13} />}
              label="Question"
              error={errors.question}
              hint={
                <span
                  className={`text-[10px] font-semibold tabular-nums ${
                    questionCount > QUESTION_MAX
                      ? "text-red-600"
                      : questionCount > QUESTION_MAX * 0.9
                      ? "text-amber-600"
                      : "text-[#aab3c4]"
                  }`}
                >
                  {questionCount} / {QUESTION_MAX}
                </span>
              }
            >
              <input
                value={form.question}
                onChange={update("question")}
                placeholder="e.g. How do I submit a paper?"
                aria-invalid={Boolean(errors.question)}
                className={inputClass(errors.question)}
              />
            </Field>

            <Field
              icon={<MessageSquare size={13} />}
              label="Answer"
              error={errors.answer}
            >
              <textarea
                value={form.answer}
                onChange={update("answer")}
                rows={7}
                placeholder="Give a clear, helpful answer."
                aria-invalid={Boolean(errors.answer)}
                className={inputClass(errors.answer, "resize-y py-3 leading-6")}
              />
            </Field>

            <Field
              icon={<Tag size={13} />}
              label="Category (optional)"
              error={errors.category}
              hint={
                <span
                  className={`text-[10px] font-semibold tabular-nums ${
                    categoryCount > CATEGORY_MAX
                      ? "text-red-600"
                      : "text-[#aab3c4]"
                  }`}
                >
                  {categoryCount} / {CATEGORY_MAX}
                </span>
              }
            >
              <input
                value={form.category}
                onChange={update("category")}
                placeholder="e.g. Submissions"
                aria-invalid={Boolean(errors.category)}
                className={inputClass(errors.category)}
              />
            </Field>

            <div className="flex flex-col-reverse justify-end gap-2.5 border-t border-[#eef1f7] pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/admin/faqs")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-5 text-[11px] font-bold text-[#5c6880] transition hover:-translate-y-px hover:border-[#d6dbe8] hover:bg-[#fafbff]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-6 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <Save size={14} />{" "}
                {saving
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
                  ? "Save changes"
                  : "Create FAQ"}
              </button>
            </div>
          </form>
        </Card>

        <aside className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader eyebrow="Preview" title="How it reads" />
            <div className="p-5 sm:p-6">
              <div className="rounded-xl border border-[#edf0f5] bg-gradient-to-br from-[#fafbff] to-[#f4f6fb] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#efedff] text-[#4f46c7]">
                    <HelpCircle size={14} />
                  </span>
                  <div className="min-w-0">
                    <strong className="block text-[12px] font-bold text-[#1c2a4a]">
                      {form.question || "Your question goes here"}
                    </strong>
                    {form.category.trim() && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#c9dff5] bg-[#eef5fd] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#1d5fa8]">
                        <Tag size={9} /> {form.category.trim()}
                      </span>
                    )}
                  </div>
                </div>
                <p className="m-0 mt-3 line-clamp-4 whitespace-pre-wrap text-[11px] leading-5 text-[#5c6880]">
                  {form.answer || "The answer will appear here as you type."}
                </p>
              </div>
            </div>
          </Card>

          {isEdit && faq && (
            <Card className="overflow-hidden">
              <CardHeader eyebrow="Metadata" title="Record info" />
              <dl className="divide-y divide-[#f2f4f9] px-6">
                <MetaRow
                  icon={<Hash size={12} />}
                  label="Reference"
                  value={`#${faq.id}`}
                />
                <MetaRow
                  icon={<Calendar size={12} />}
                  label="Created"
                  value={formatDate(faq.created_at ?? faq.createdAt)}
                />
                <MetaRow
                  icon={<Clock size={12} />}
                  label="Updated"
                  value={formatDate(faq.updated_at ?? faq.updatedAt)}
                />
              </dl>
            </Card>
          )}

          {isEdit && (
            <div className="overflow-hidden rounded-[20px] border border-[#f0d4d4] bg-gradient-to-b from-[#fffafa] to-[#fff5f5] p-6">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-100 text-red-600">
                  <Trash2 size={13} />
                </span>
                <strong className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b13a3a]">
                  Danger zone
                </strong>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-[#9a6470]">
                Deleting this FAQ removes it from the Help & FAQ page. This
                cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0c8c8] bg-white px-4 py-2.5 text-[11px] font-extrabold text-red-600 transition hover:border-[#e8a8a8] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={13} />
                Delete FAQ
              </button>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDeleteModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        faq={faq}
        busy={deleting}
      />
    </AdminLayout>
  );
}

function MetaRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
        {icon} {label}
      </dt>
      <dd className="m-0 text-right text-[12px] font-semibold text-[#1c2a4a]">
        {value ?? "—"}
      </dd>
    </div>
  );
}