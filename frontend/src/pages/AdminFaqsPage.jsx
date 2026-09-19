import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardHeader,
  PrimaryButton,
  SearchInput,
  StateBlock,
} from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { faqsApi } from "../api/faqsApi";

export default function FaqsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const faqsRes = useApiResource(() => faqsApi.getAll(), []);
  const faqs = useMemo(() => toArray(faqsRes.data), [faqsRes.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) =>
      [f.question, f.answer, f.category, String(f.id ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [faqs, query]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      await faqsApi.remove(id);
      await faqsRes.reload();
    } catch (err) {
      window.alert(err?.message ?? "Failed to delete FAQ.");
    }
  };

  return (
    <AdminLayout
      subtitle="Help centre"
      title="FAQ Management"
      action={
        <div className="flex gap-2">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search FAQs…" />
          <PrimaryButton onClick={() => navigate("/admin/faqs/new")}>
            <Plus size={14} /> New FAQ
          </PrimaryButton>
        </div>
      }
    >
      <Card>
        <CardHeader eyebrow="Help centre" title={`${faqs.length} entries`} />
        {faqsRes.loading && <StateBlock kind="loading" message="Loading FAQs…" />}
        {!faqsRes.loading && faqsRes.error && (
          <StateBlock kind="error" message={faqsRes.error.message} onRetry={faqsRes.reload} />
        )}
        {!faqsRes.loading && !faqsRes.error && filtered.length === 0 && (
          <StateBlock
            message={faqs.length === 0 ? "No FAQ entries yet. Create the first one." : "No FAQs match your search."}
          />
        )}
        {!faqsRes.loading && !faqsRes.error && filtered.length > 0 && (
          <ul className="divide-y divide-[#f0f2f6]">
            {filtered.map((faq) => (
              <li key={faq.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 sm:p-6">
                <div className="flex gap-3 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                    <HelpCircle size={16} />
                  </span>
                  <div className="min-w-0">
                    <strong className="block text-[12px] text-[#1c2a4a]">
                      {faq.question ?? faq.title ?? "—"}
                    </strong>
                    <p className="mt-1 m-0 line-clamp-2 text-[10px] text-[#8a95a8]">
                      {faq.answer ?? faq.body ?? "—"}
                    </p>
                    {faq.category && (
                      <span className="mt-1.5 inline-block rounded-full bg-[#f1efff] px-2 py-0.5 text-[9px] font-extrabold text-[#5b4fe3]">
                        {faq.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => navigate(`/admin/faqs/${faq.id}/edit`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminLayout>
  );
}