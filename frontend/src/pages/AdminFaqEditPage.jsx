import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardHeader,
  GhostButton,
  PrimaryButton,
  StateBlock,
} from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { faqsApi } from "../api/faqsApi";
const EMPTY = { question: "", answer: "", category: "" };

export default function FaqEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const faqRes = useApiResource(
    () => (isEdit ? faqsApi.getById(id) : Promise.resolve(null)),
    [id]
  );
  const existing = faqRes.data?.data ?? faqRes.data ?? null;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (existing) {
      setForm({
        question: existing.question ?? existing.title ?? "",
        answer: existing.answer ?? existing.body ?? "",
        category: existing.category ?? "",
      });
    }
  }, [existing]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.question.trim()) next.question = "Question is required.";
    else if (form.question.length > 500) next.question = "Question must be 500 characters or fewer.";
    if (!form.answer.trim()) next.answer = "Answer is required.";
    if (form.category && form.category.length > 255) next.category = "Category must be 255 characters or fewer.";
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
        ...(form.category.trim() ? { category: form.category.trim() } : {}),
      };
      if (isEdit) await faqsApi.update(id, payload);
      else await faqsApi.create(payload);
      navigate("/admin/faqs");
    } catch (err) {
      setErrors(err?.errors ?? {});
      setBanner({ type: "error", text: err?.message ?? "Unable to save FAQ." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      subtitle="Help centre"
      title={isEdit ? "Edit FAQ" : "New FAQ"}
      action={
        <GhostButton onClick={() => navigate("/admin/faqs")}>
          <ArrowLeft size={14} /> Back to FAQs
        </GhostButton>
      }
    >
      {isEdit && faqRes.loading && <Card><StateBlock kind="loading" message="Loading FAQ…" /></Card>}
      {isEdit && !faqRes.loading && faqRes.error && (
        <Card><StateBlock kind="error" message={faqRes.error.message} onRetry={faqRes.reload} /></Card>
      )}
      {(!isEdit || (!faqRes.loading && !faqRes.error)) && (
        <Card>
          <CardHeader eyebrow="Content" title={isEdit ? "Update entry" : "Create entry"} />
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {banner && (
              <div className="rounded-xl border border-[#f1c8c8] bg-[#fff2f2] px-4 py-3 text-[11px] font-semibold text-[#b13a3a]">
                {banner.text}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.08em] text-[#66728b]">
                Question
              </label>
              <input
                value={form.question}
                onChange={update("question")}
                maxLength={500}
                placeholder="e.g. How do I submit a proposal?"
                className={`h-10 w-full rounded-[10px] border bg-[#fafbfe] px-3 text-[12px] outline-none focus:ring-2 focus:ring-[#8175ef]/10 ${
                  errors.question ? "border-[#e39a9a]" : "border-[#e2e6ee] focus:border-[#8175ef]"
                }`}
              />
              <div className="mt-1 flex justify-between">
                {errors.question ? (
                  <small className="text-[10px] text-[#b13a3a]">{errors.question}</small>
                ) : <span />}
                <small className="text-[10px] text-[#aeb6c6]">{form.question.length}/500</small>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.08em] text-[#66728b]">
                Answer
              </label>
              <textarea
                value={form.answer}
                onChange={update("answer")}
                rows={5}
                placeholder="Provide a clear, helpful answer."
                className={`w-full rounded-[10px] border bg-[#fafbfe] p-3 text-[12px] outline-none focus:ring-2 focus:ring-[#8175ef]/10 ${
                  errors.answer ? "border-[#e39a9a]" : "border-[#e2e6ee] focus:border-[#8175ef]"
                }`}
              />
              {errors.answer && <small className="mt-1 block text-[10px] text-[#b13a3a]">{errors.answer}</small>}
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.08em] text-[#66728b]">
                Category (optional)
              </label>
              <input
                value={form.category}
                onChange={update("category")}
                maxLength={255}
                placeholder="e.g. Submissions, Account"
                className={`h-10 w-full rounded-[10px] border bg-[#fafbfe] px-3 text-[12px] outline-none focus:ring-2 focus:ring-[#8175ef]/10 ${
                  errors.category ? "border-[#e39a9a]" : "border-[#e2e6ee] focus:border-[#8175ef]"
                }`}
              />
              {errors.category && <small className="mt-1 block text-[10px] text-[#b13a3a]">{errors.category}</small>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GhostButton type="button" onClick={() => navigate("/admin/faqs")}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit" disabled={saving}>
                <Save size={14} /> {saving ? "Saving…" : isEdit ? "Save changes" : "Create FAQ"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}
    </AdminLayout>
  );
}