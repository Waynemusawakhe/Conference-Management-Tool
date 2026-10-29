import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  FileText,
  Filter,
  Loader2,
  MessageSquareQuote,
  Search,
  Star,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import RoleChrome from "../components/RoleChrome";
import { useAuth } from "../context/AuthContext";
import { submissionsApi } from "../api/submissionsApi";
import { reviewsApi } from "../api/reviewsApi";

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
  revision_requested: "Revision requested",
  withdrawn: "Withdrawn",
};

const STATUS_STYLES = {
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  under_review: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  revision_requested: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
  withdrawn: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]",
};

const REC_STYLES = {
  accept: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  reject: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  revise: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

function unwrapList(r) {
  return Array.isArray(r) ? r : r?.data || [];
}

function dateLabel(value) {
  if (!value) return "Date not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AuthorFeedback() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const subsRes = await submissionsApi.getAll({ per_page: 100 });
      const submissions = unwrapList(subsRes).filter(
        (s) =>
          String(s.author_id ?? s.author?.id) === String(user?.id) ||
          !s.author_id,
      );

      const withReviews = await Promise.all(
        submissions.map(async (s) => {
          try {
            const res = await reviewsApi.getAll({
              submission_id: s.id,
              per_page: 50,
            });
            return { ...s, reviews: unwrapList(res) };
          } catch {
            return { ...s, reviews: [] };
          }
        }),
      );

      setRows(withReviews);
    } catch (err) {
      if (err?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      setError(err?.message || "Unable to load feedback.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => r.reviews.length > 0)
      .filter((r) => {
        const status = r.status || "pending";
        const matchesStatus =
          statusFilter === "all" || status === statusFilter;
        const matchesQuery =
          !q ||
          [r.title, r.track, r.id]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);
        return matchesStatus && matchesQuery;
      });
  }, [rows, query, statusFilter]);

  return (
    <RoleChrome>
      <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
          <MessageSquareQuote size={14} /> Reviewer feedback
        </span>
        <h1 className="mb-2 mt-3 text-[clamp(24px,3.4vw,36px)] font-bold leading-tight tracking-[-.04em]">
          Feedback on my submissions
        </h1>
        <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
          Every review submitted for your proposals — scores, recommendations
          and comments in one place.
        </p>
      </section>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="font-extrabold underline">
            Retry
          </button>
        </div>
      )}

      <section className="mt-6 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]">
        <div className="flex flex-col gap-4 border-b border-[#edf0f5] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
              All feedback
            </span>
            <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
              {loading
                ? "Loading…"
                : `${filtered.length} submission${filtered.length === 1 ? "" : "s"} with feedback`}
            </h2>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                size={15}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search submissions…"
                className="h-10 w-[200px] rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none focus:border-[#8175ef]"
              />
            </div>
            <div className="relative">
              <Filter
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                size={14}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] font-semibold text-[#59657d] outline-none"
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading
            feedback…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={22} className="mx-auto text-[#aeb6c6]" />
            <h3 className="mb-1 mt-3 text-[13px] font-bold">
              No feedback yet
            </h3>
            <p className="m-0 text-[10px] text-[#8993a6]">
              Feedback appears here once reviewers complete their assessment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf0f5]">
            {filtered.map((row) => {
              const status = row.status || "pending";
              return (
                <article key={row.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0">
                        <strong className="block truncate text-[13px] text-[#1c2a4a]">
                          {row.title}
                        </strong>
                        <span className="text-[10px] text-[#8c96a9]">
                          #{row.id} · {row.track || "General track"} ·{" "}
                          {dateLabel(row.created_at)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                        STATUS_STYLES[status] || STATUS_STYLES.pending
                      }`}
                    >
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-3">
                    {row.reviews.map((r) => {
                      const rec = (r.recommendation || "").toLowerCase();
                      const recCls =
                        REC_STYLES[rec] ||
                        "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]";
                      return (
                        <li
                          key={r.id}
                          className="rounded-xl border border-[#e5e8ef] bg-[#fafbfe] p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {r.recommendation && (
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${recCls}`}
                              >
                                {r.recommendation}
                              </span>
                            )}
                            {typeof r.score === "number" && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#cfd0ff] bg-[#f0efff] px-2.5 py-1 text-[9px] font-extrabold text-[#5548d7]">
                                <Star size={11} /> Score: {r.score}
                              </span>
                            )}
                            <span className="text-[9px] font-semibold text-[#8993a6]">
                              {r.locked
                                ? "Locked"
                                : r.submitted_at
                                ? "Submitted"
                                : "In progress"}
                            </span>
                          </div>
                          {r.comments && (
                            <p className="mb-0 mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[#536079]">
                              {r.comments}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </RoleChrome>
  );
}