import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { submissionsApi } from "../api/submissionsApi";

export default function EditSubmissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: "", abstract: "", status: "pending" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    submissionsApi.getById(id)
      .then((res) => {
        const data = res.data || res;
        setFormData({
          title: data.title || "",
          abstract: data.abstract || "",
          status: data.status || "pending",
        });
      })
      .catch((err) => setError(err.message || "Failed to load submission"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await submissionsApi.update(id, formData);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Failed to update submission");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-[11px] text-[#8993a6]">Loading submission…</div>;

  return (
    <div className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)]">
      <button onClick={() => navigate("/AdminDashboard")} className="mb-6 flex items-center gap-2 text-[11px] font-bold text-[#6655f6] hover:underline">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-[24px] font-bold tracking-[-.03em]">Edit Submission</h1>
        <p className="mt-1 text-[11px] text-[#8993a6]">Update the details for submission #{id}.</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-[#f1c8c8] bg-[#fff2f2] p-3 text-[11px] text-[#b13a3a]">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">Title *</label>
          <input name="title" value={formData.title} onChange={handleChange} required className="h-11 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[12px] outline-none focus:border-[#8175ef]" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">Abstract</label>
          <textarea name="abstract" value={formData.abstract} onChange={handleChange} rows={5} className="w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 py-3 text-[12px] outline-none focus:border-[#8175ef]" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="h-11 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[12px] outline-none focus:border-[#8175ef]">
            <option value="pending">Pending</option>
            <option value="under_review">Under review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="revision_requested">Revision requested</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={() => navigate("/admin")} className="rounded-xl border border-[#e2e6ee] bg-white px-5 py-3 text-[12px] font-bold text-[#59657d] hover:bg-[#f0f2f6]">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
