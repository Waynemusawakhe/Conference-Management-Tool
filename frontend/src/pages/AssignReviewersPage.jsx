import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, X, Loader2 } from "lucide-react";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { submissionsApi } from "../api/submissionsApi";
import { usersApi } from "../api/usersApi";
import { reviewsApi } from "../api/reviewsApi";
import { useAuth } from "../hooks/useAuth";

export default function AssignReviewersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submissionRes = useApiResource(() => submissionsApi.getById(id), [id]);
  const usersRes = useApiResource(() => usersApi.getReviewers(), []);
  const reviewsRes = useApiResource(() => reviewsApi.getAll({ submission_id: id }), [id]);

  const submission = submissionRes.data?.data || submissionRes.data;
  const reviewers = toArray(usersRes.data).filter((u) => u.role?.toLowerCase() === "reviewer");
  const currentReviews = toArray(reviewsRes.data);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedReviewer) return;
    setSaving(true);
    setError(null);
    try {
      await reviewsApi.create({ submission_id: Number(id), reviewer_id: Number(selectedReviewer) });
      setSelectedReviewer("");
      await reviewsRes.reload();
    } catch (err) {
      setError(err.message || "Failed to assign reviewer");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (reviewId) => {
    if (!window.confirm("Remove this reviewer assignment?")) return;
    try {
      await reviewsApi.remove(reviewId);
      await reviewsRes.reload();
    } catch (err) {
      setError(err.message || "Failed to remove reviewer");
    }
  };

  if (submissionRes.loading) return <div className="p-10 text-center text-[11px] text-[#8993a6]">Loading submission…</div>;

  return (
    <div className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)]">
      <button onClick={() => navigate(role === "organiser" ? "/organiser-dashboard" : "/admin-dashboard")} className="mb-6 flex items-center gap-2 text-[11px] font-bold text-[#6655f6] hover:underline">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-[24px] font-bold tracking-[-.03em]">Assign Reviewers</h1>
        <p className="mt-1 text-[11px] text-[#8993a6]">Submission: <span className="font-bold text-[#1c2a4a]">{submission?.title || `#${id}`}</span></p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-[#f1c8c8] bg-[#fff2f2] p-3 text-[11px] text-[#b13a3a]">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current Reviewers */}
        <div className="rounded-xl border border-[#edf0f5] p-4">
          <h2 className="mb-3 text-[13px] font-bold text-[#1c2a4a]">Current Assignments</h2>
          {reviewsRes.loading && <p className="text-[11px] text-[#8993a6]">Loading…</p>}
          {!reviewsRes.loading && currentReviews.length === 0 && <p className="text-[11px] text-[#8993a6]">No reviewers assigned yet.</p>}
          <div className="space-y-2">
            {currentReviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between rounded-lg bg-[#fafbfe] p-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[#efedff] text-[10px] font-extrabold text-[#4f46c7]">
                    {(review.reviewer?.name || "R").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong className="block text-[11px]">{review.reviewer?.name || `Reviewer #${review.reviewer_id}`}</strong>
                    <span className="text-[9px] text-[#8a95a8] capitalize">{review.status || "Pending"}</span>
                  </div>
                </div>
                <button onClick={() => handleRemove(review.id)} className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100" title="Remove">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assign New */}
        <div className="rounded-xl border border-[#edf0f5] p-4">
          <h2 className="mb-3 text-[13px] font-bold text-[#1c2a4a]">Add Reviewer</h2>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">Select Reviewer</label>
              <select value={selectedReviewer} onChange={(e) => setSelectedReviewer(e.target.value)} required className="h-11 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[12px] outline-none focus:border-[#8175ef]">
                <option value="">Choose a reviewer…</option>
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={saving || !selectedReviewer} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6655f6] px-4 py-3 text-[12px] font-extrabold text-white hover:bg-[#5649dc] disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {saving ? "Assigning…" : "Assign Reviewer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

