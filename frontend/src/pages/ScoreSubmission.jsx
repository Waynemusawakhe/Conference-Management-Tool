import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  FileText,
  LogOut,
  Menu,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
import { reviewsApi } from "../api/reviewsApi";

export default function ScoreSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();

  const [notice, setNotice] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [paper, setPaper] = useState(null);
  const [score, setScore] = useState(3);
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("accept");

  useEffect(() => {
    // Fetch details for the paper/review being evaluated
    const fetchPaper = async () => {
      try {
        const response = await reviewsApi.getById?.(id) || await fetch(`http://localhost:5000/api/reviews/${id}`).then(res => res.json());
        const data = response?.data ?? response;
        setPaper(data);
      } catch (err) {
        console.error("Failed to load review details:", err);
        // Fallback placeholder data if API route is strictly local
        setPaper({
          id,
          title: "Distributed Database Systems Optimization",
          abstract: "This study explores query execution strategies and concurrency control within distributed database environments.",
          file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaper();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      review_id: id,
      score,
      comments,
      recommendation,
    };

    try {
      if (reviewsApi.submit) {
        await reviewsApi.submit(payload);
      } else {
        await fetch("http://localhost:5000/api/reviews/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setSuccess(true);
      setTimeout(() => navigate("/reviewer-dashboard"), 1500);
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-sans text-[#4b5563]">
        <div className="text-center text-lg font-semibold">Loading evaluation workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-6">
          <button
            onClick={() => navigate("/reviewer-dashboard")}
            className="flex items-center gap-2 rounded-lg p-2 text-white/80 hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          </button>
          <button className="border-0 bg-transparent p-0" onClick={() => navigate("/")} aria-label="CMT home">
            <Logo />
          </button>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <div className="hidden sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">Evaluation Form</p>
            <p className="m-0 mt-0.5 text-[12px] font-semibold text-white/65">Review #{id}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10"
              onClick={() => setNotice((v) => !v)}
            >
              <Bell size={17} />
              {notice && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7d6bff]" />}
            </button>
            <button
              className="hidden h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 sm:grid"
              onClick={toggleTheme}
            >
              <Sparkles size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-[min(1200px,calc(100%-32px))] py-8">
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-[#ecfdf5] p-4 text-[#065f46] border border-[#a7f3d0]">
            <CheckCircle size={20} />
            <span className="font-semibold text-sm">Review submitted successfully! Redirecting...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-[#fef2f2] p-4 text-[#991b1b] border border-[#f87171] text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Submission Details Card */}
          <div className="flex flex-col gap-5 rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-sm">
            <div>
              <span className="inline-block rounded bg-[#e0e7ff] px-2.5 py-1 text-xs font-semibold text-[#3730a3] mb-2">
                Submission Details
              </span>
              <h2 className="text-xl font-bold text-[#111827] m-0">
                {paper?.submission?.title || paper?.title || `Paper ID: ${id}`}
              </h2>
            </div>

            <div>
              <strong className="block text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-1">Abstract</strong>
              <p className="text-sm leading-relaxed text-[#374151] m-0 bg-[#f9fafb] p-4 rounded-xl border border-[#f3f4f6]">
                {paper?.submission?.abstract || paper?.abstract || "No abstract available for this submission."}
              </p>
            </div>

            {/* Document Preview */}
            <div className="flex-1 min-h-[350px]">
              <strong className="block text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2">Paper Document</strong>
              <iframe
                src={paper?.file_url || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                title="Paper Document"
                className="w-full h-full min-h-[350px] rounded-xl border border-[#e5e7eb]"
              />
            </div>
          </div>

          {/* Scoring Form */}
          <div className="rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-[#111827] m-0 mb-6 border-b border-[#edf0f5] pb-4">
              Evaluation & Scoring
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Score Selector (1 to 5) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-3">
                  Score Rating (1 - Poor to 5 - Excellent)
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setScore(num)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5 border ${
                        score === num
                          ? "bg-[#4f46e5] text-white border-[#4f46e5] shadow-md"
                          : "bg-white text-[#374151] border-[#d1d5db] hover:bg-[#f9fafb]"
                      }`}
                    >
                      <Star size={14} className={score === num ? "fill-white" : "text-[#9ca3af]"} />
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommendation Dropdown */}
              <div>
                <label htmlFor="recommendation" className="block text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2">
                  Final Recommendation
                </label>
                <select
                  id="recommendation"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full rounded-xl border border-[#d1d5db] bg-white p-3 text-sm text-[#111827] outline-none focus:border-[#4f46e5]"
                >
                  <option value="accept">Accept</option>
                  <option value="revise">Minor Revision</option>
                  <option value="major_revision">Major Revision</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              {/* Comments */}
              <div>
                <label htmlFor="comments" className="block text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2">
                  Review Comments
                </label>
                <textarea
                  id="comments"
                  rows={6}
                  required
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide constructive feedback on methodology, findings, and overall presentation..."
                  className="w-full rounded-xl border border-[#d1d5db] bg-white p-3 text-sm text-[#111827] outline-none focus:border-[#4f46e5]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#4f46e5] py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#4338ca] disabled:opacity-50 mt-auto"
              >
                {submitting ? "Submitting Review..." : "Submit Final Review"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
