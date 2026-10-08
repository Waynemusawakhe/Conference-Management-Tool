import { useEffect, useMemo, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {

  CheckCircle2,

  ClipboardCheck,

  Clock,

  FileText,

  Filter,

  LayoutDashboard,

  Lightbulb,

  Lock,

  Search,

  Star,

  ThumbsDown,

  ThumbsUp,

  X,

} from "lucide-react";

import ReviewerLayout from "../components/ReviewerLayout";

import { useAuth } from "../context/AuthContext";

import { reviewsApi } from "../api/reviewsApi";



/* ------------------------------------------------------------------ *

 * Status helpers

 * ------------------------------------------------------------------ */

function reviewIsLocked(r) {

  return Boolean(r.locked ?? r.is_locked);

}



// Only submitted_at is a reliable "was submitted" signal.

function reviewIsSubmitted(r) {

  return Boolean(r.submitted_at ?? r.submittedAt);

}



function reviewState(r) {

  if (reviewIsLocked(r)) return "locked";

  if (reviewIsSubmitted(r)) return "submitted";

  return "pending";

}



const STATE_META = {

  pending: {

    label: "Pending",

    chip: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",

    dot: "bg-[#9b7414]",

  },

  submitted: {

    label: "Submitted",

    chip: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",

    dot: "bg-[#5548d7]",

  },

  locked: {

    label: "Locked",

    chip: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",

    dot: "bg-[#18794e]",

  },

};



const RECOMMENDATION_META = {

  accept: {

    label: "Accept",

    icon: ThumbsUp,

    className: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",

  },

  revise: {

    label: "Revise",

    icon: Lightbulb,

    className: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",

  },

  reject: {

    label: "Reject",

    icon: ThumbsDown,

    className: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",

  },

};



const itemReviewId = (r) => r.id;

const itemSubmissionId = (r) => r.submission_id ?? r.submission?.id ?? null;

const itemTitle = (r) =>

  r.submission?.title ??

  r.title ??

  (itemSubmissionId(r) ? `Submission #${itemSubmissionId(r)}` : "Untitled submission");

const itemConference = (r) =>

  r.submission?.conference?.name ??

  r.conference?.name ??

  r.conference_name ??

  r.submission?.conference_name ??

  "";

const itemTrack = (r) =>

  r.submission?.track ?? r.track ?? r.submission?.category ?? "";

const itemAbstract = (r) => r.submission?.abstract ?? r.abstract ?? "";



/* ------------------------------------------------------------------ *

 * Presentation

 * ------------------------------------------------------------------ */

function StatCard({ icon, value, label, tint }) {

  return (

    <div className="rounded-[16px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)] transition hover:-translate-y-px hover:shadow-[0_14px_36px_rgba(15,28,65,.07)] dark:border-[#1e293b] dark:bg-[#0f172a]">

      <span className={`inline-grid h-9 w-9 place-items-center rounded-[10px] ${tint}`}>

        {icon}

      </span>

      <strong className="mt-4 block text-[24px] leading-none tracking-[-.04em] text-[#1c2a4a] dark:text-white">

        {value}

      </strong>

      <p className="m-0 mt-1.5 text-[11px] font-bold text-[#35415f] dark:text-[#94a3b8]">

        {label}

      </p>

    </div>

  );

}



function ScoreChip({ review }) {

  if (review.score == null && !review.recommendation) return null;

  const rec = review.recommendation

    ? RECOMMENDATION_META[String(review.recommendation).toLowerCase()]

    : null;

  const RecIcon = rec?.icon;



  return (

    <div className="flex flex-wrap items-center gap-2">

      {review.score != null && (

        <span className="inline-flex items-center gap-1 rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1 text-[10px] font-extrabold text-[#1d4ed8]">

          <Star size={11} className="fill-[#1d4ed8]" />

          Score {review.score}

        </span>

      )}

      {rec && RecIcon && (

        <span

          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${rec.className}`}

        >

          <RecIcon size={11} />

          {rec.label}

        </span>

      )}

    </div>

  );

}



function ReviewCard({ review, onEvaluate }) {

  const state = reviewState(review);

  const meta = STATE_META[state];

  const conference = itemConference(review);

  const track = itemTrack(review);

  const abstract = itemAbstract(review);



  return (

    <article className="group flex flex-col gap-4 rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-[0_6px_18px_rgba(15,28,65,.03)] transition hover:-translate-y-px hover:border-[#d6dbe8] hover:shadow-[0_14px_36px_rgba(15,28,65,.08)] dark:border-[#1e293b] dark:bg-[#0f172a] sm:p-6">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span

              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${meta.chip}`}

            >

              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />

              {meta.label}

            </span>

            <span className="text-[9px] font-semibold text-[#aeb6c6]">

              Review #{itemReviewId(review)}

            </span>

          </div>



          <h3 className="m-0 mt-3 text-[14px] font-bold leading-6 tracking-[-.01em] text-[#1c2a4a] dark:text-white">

            {itemTitle(review)}

          </h3>



          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#7b869b]">

            {conference && (

              <span className="inline-flex items-center gap-1.5">

                <LayoutDashboard size={11} className="text-[#aeb6c6]" />

                {conference}

              </span>

            )}

            {track && (

              <span className="inline-flex items-center gap-1.5">

                <ClipboardCheck size={11} className="text-[#aeb6c6]" />

                {track}

              </span>

            )}

          </div>



          {abstract && (

            <p className="m-0 mt-3 line-clamp-2 text-[11px] leading-5 text-[#5c6880] dark:text-[#94a3b8]">

              {abstract}

            </p>

          )}

        </div>



        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#efedff] to-[#e0dcff] text-[#4f46c7] shadow-[0_6px_14px_-4px_rgba(102,85,246,.28)]">

          <FileText size={16} />

        </span>

      </div>



      {/* Score + recommendation chips — only when already scored */}

      {reviewIsSubmitted(review) && (

        <div className="border-t border-[#f2f4f9] pt-3 dark:border-[#1e293b]">

          <ScoreChip review={review} />

        </div>

      )}



      <div className="flex items-center justify-between gap-3 border-t border-[#f2f4f9] pt-4 dark:border-[#1e293b]">

        <span className="text-[10px] font-semibold text-[#8a95a8]">

          {state === "pending"

            ? "Not yet evaluated"

            : state === "submitted"

            ? "Awaiting lock"

            : "Completed and locked"}

        </span>

        <button

          onClick={() => onEvaluate(review)}

          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-extrabold transition ${

            state === "locked"

              ? "border border-[#e4e8f0] bg-white text-[#5c6880] hover:bg-[#fafbff] dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-white dark:hover:bg-[#111c33]"

              : "bg-[#2563eb] text-white shadow-[0_12px_28px_rgba(37,99,235,.28)] hover:-translate-y-px hover:bg-[#1d4ed8]"

          }`}

        >

          {state === "locked" ? (

            <>

              <CheckCircle2 size={13} /> View review

            </>

          ) : state === "submitted" ? (

            <>

              <Lock size={13} /> Lock / view

            </>

          ) : (

            <>

              <ClipboardCheck size={13} /> Score this paper

            </>

          )}

        </button>

      </div>

    </article>

  );

}



function LoadingCards({ rows = 4 }) {

  return (

    <div className="grid gap-4">

      {Array.from({ length: rows }).map((_, i) => (

        <div

          key={i}

          className="rounded-2xl border border-[#e4e8f0] bg-white p-6 dark:border-[#1e293b] dark:bg-[#0f172a]"

        >

          <div className="h-5 w-20 animate-pulse rounded-full bg-[#eef1f7] dark:bg-[#1e293b]" />

          <div className="mt-4 h-3 w-2/3 animate-pulse rounded-full bg-[#eef1f7] dark:bg-[#1e293b]" />

          <div className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full bg-[#eef1f7] dark:bg-[#1e293b]" />

          <div className="mt-4 h-2.5 w-full animate-pulse rounded-full bg-[#eef1f7] dark:bg-[#1e293b]" />

        </div>

      ))}

    </div>

  );

}



/* ------------------------------------------------------------------ *

 * Filters

 * ------------------------------------------------------------------ */

const STATE_FILTERS = [

  { key: "all", label: "All" },

  { key: "pending", label: "Pending" },

  { key: "submitted", label: "Submitted" },

  { key: "locked", label: "Locked" },

];



const RECOMMENDATION_FILTERS = [

  { key: "any", label: "Any recommendation" },

  { key: "accept", label: "Accept" },

  { key: "revise", label: "Revise" },

  { key: "reject", label: "Reject" },

];



const PAGE_SIZE = 20;



/* ------------------------------------------------------------------ *

 * Page

 * ------------------------------------------------------------------ */

export default function ReviewerDashboard() {

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();



  // Read filters from URL (so navigation preserves them)

  const rawFilter = searchParams.get("filter") ?? "all";

  const filter = STATE_FILTERS.some((f) => f.key === rawFilter) ? rawFilter : "all";



  const rawRec = searchParams.get("recommendation") ?? "any";

  const recommendation = RECOMMENDATION_FILTERS.some((r) => r.key === rawRec)

    ? rawRec

    : "any";



  const [query, setQuery] = useState("");



  // Data state

  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);



  const displayName = user?.name ?? user?.full_name ?? "Reviewer";

  const reviewerId = user?.id ?? null;



  /* ---- Initial load + reload on role/id change ------------------- */

  useEffect(() => {

    if (!reviewerId) {

      setReviews([]);

      setLoading(false);

      return;

    }



    let cancelled = false;



    (async () => {

      setLoading(true);

      setError(null);

      try {

        // Pass reviewer_id so we don't rely solely on the backend policy.

        const response = await reviewsApi.getAll({

          reviewer_id: reviewerId,

          per_page: PAGE_SIZE,

          page: 1,

        });



        if (cancelled) return;



        const payload = response?.data ?? response ?? [];

        const items = Array.isArray(payload) ? payload : payload?.data ?? [];



        setReviews(items);



        // Tolerant pagination check — envelope is unconfirmed.

        const meta = payload?.meta ?? null;

        if (meta?.last_page != null) {

          setHasMore(meta.current_page < meta.last_page);

        } else if (payload?.last_page != null) {

          setHasMore((payload.current_page ?? 1) < payload.last_page);

        } else {

          setHasMore(items.length === PAGE_SIZE);

        }

        setPage(1);

      } catch (err) {

        if (cancelled) return;

        console.error("Failed to load reviews:", err);

        setError(err?.message ?? "Unable to load your assigned reviews.");

        setReviews([]);

        setHasMore(false);

      } finally {

        if (!cancelled) setLoading(false);

      }

    })();



    return () => {

      cancelled = true;

    };

  }, [reviewerId, reloadKey]);



  /* ---- Load more ------------------------------------------------- */

  async function handleLoadMore() {

    if (!reviewerId || loadingMore || !hasMore) return;

    setLoadingMore(true);

    const nextPage = page + 1;

    try {

      const response = await reviewsApi.getAll({

        reviewer_id: reviewerId,

        per_page: PAGE_SIZE,

        page: nextPage,

      });

      const payload = response?.data ?? response ?? [];

      const items = Array.isArray(payload) ? payload : payload?.data ?? [];

      setReviews((prev) => [...prev, ...items]);

      setPage(nextPage);



      const meta = payload?.meta ?? null;

      if (meta?.last_page != null) {

        setHasMore(meta.current_page < meta.last_page);

      } else if (payload?.last_page != null) {

        setHasMore(nextPage < payload.last_page);

      } else {

        setHasMore(items.length === PAGE_SIZE);

      }

    } catch (err) {

      console.error("Failed to load more reviews:", err);

      setError(err?.message ?? "Unable to load more reviews.");

    } finally {

      setLoadingMore(false);

    }

  }



  /* ---- Client-side filter counts --------------------------------- */

  const counts = useMemo(() => {

    const c = { all: reviews.length, pending: 0, submitted: 0, locked: 0 };

    reviews.forEach((r) => {

      const s = reviewState(r);

      if (c[s] !== undefined) c[s] += 1;

    });

    return c;

  }, [reviews]);



  /* ---- Client-side filtering ------------------------------------ */

  const filtered = useMemo(() => {

    const q = query.trim().toLowerCase();

    return reviews.filter((r) => {

      const state = reviewState(r);

      if (filter !== "all" && state !== filter) return false;



      if (recommendation !== "any") {

        const rec = String(r.recommendation ?? "").toLowerCase();

        if (rec !== recommendation) return false;

      }



      if (!q) return true;

      return [

        itemTitle(r),

        itemConference(r),

        itemTrack(r),

        String(itemReviewId(r) ?? ""),

        String(itemSubmissionId(r) ?? ""),

      ]

        .join(" ")

        .toLowerCase()

        .includes(q);

    });

  }, [reviews, query, filter, recommendation]);



  /* ---- URL filter helpers ---------------------------------------- */

  function updateParam(key, value, defaultValue) {

    const next = new URLSearchParams(searchParams);

    if (value === defaultValue) next.delete(key);

    else next.set(key, value);

    setSearchParams(next, { replace: true });

  }



  function handleFilterChange(key) {

    updateParam("filter", key, "all");

  }

  function handleRecommendationChange(key) {

    updateParam("recommendation", key, "any");

  }



  function handleEvaluate(review) {

    navigate(`/reviewer/evaluate/${itemReviewId(review)}`);

  }



  /* ---- Render ---------------------------------------------------- */

  return (

    <ReviewerLayout>

      {/* Hero */}

      <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">

        <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

        <div className="relative">

          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">

            <ClipboardCheck size={14} /> Reviewer overview

          </span>

          <h1 className="mb-2 mt-3 text-[clamp(24px,3.4vw,36px)] font-bold leading-tight tracking-[-.045em]">

            Welcome, {displayName}.

          </h1>

          <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">

            Score assigned submissions, leave recommendations, and lock completed reviews.

          </p>

        </div>

      </section>



      {/* Stats */}

      {!loading && !error && reviews.length > 0 && (

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <StatCard icon={<ClipboardCheck size={17} />} tint="bg-[#efedff] text-[#4f46c7]" value={counts.all} label="Total assigned" />

          <StatCard icon={<Clock size={17} />} tint="bg-[#fff9e9] text-[#9b7414]" value={counts.pending} label="Pending" />

          <StatCard icon={<FileText size={17} />} tint="bg-[#f0efff] text-[#5548d7]" value={counts.submitted} label="Submitted" />

          <StatCard icon={<Lock size={17} />} tint="bg-[#effaf4] text-[#18794e]" value={counts.locked} label="Locked" />

        </section>

      )}



      {/* Error */}

      {error && (

        <div role="alert" className="rounded-2xl border border-[#f1c8c8] bg-[#fff2f2] p-5 text-[12px] text-[#b13a3a]">

          <strong className="block text-[12px] font-extrabold">Couldn't load your reviews</strong>

          <span className="mt-1 block text-[11px]">{error}</span>

          <button

            onClick={() => setReloadKey((k) => k + 1)}

            className="mt-3 rounded-lg bg-[#b13a3a] px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#8f2d2d]"

          >

            Retry

          </button>

        </div>

      )}



      {/* Search + filters */}

      {!error && (

        <div className="flex flex-col gap-3 rounded-2xl border border-[#e4e8f0] bg-white p-4 shadow-[0_6px_18px_rgba(15,28,65,.03)] dark:border-[#1e293b] dark:bg-[#0f172a] sm:flex-row sm:items-center sm:gap-3">

          <div className="relative flex-1">

            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />

            <input

              type="text"

              placeholder="Search by title, conference, or ID…"

              value={query}

              onChange={(e) => setQuery(e.target.value)}

              className="h-11 w-full rounded-xl border border-[#e2e6ee] bg-[#fafbfe] pl-10 pr-9 text-[12px] outline-none transition focus:border-[#8175ef] focus:bg-white focus:ring-2 focus:ring-[#8175ef]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"

            />

            {query && (

              <button

                onClick={() => setQuery("")}

                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[#98a1b3] hover:bg-[#eef1f7] hover:text-[#5c6880]"

                aria-label="Clear search"

              >

                <X size={12} />

              </button>

            )}

          </div>



          <div className="flex flex-wrap items-center gap-2">

            <Filter size={15} className="text-[#98a1b3]" />

            <select

              value={filter}

              onChange={(e) => handleFilterChange(e.target.value)}

              className="h-11 rounded-xl border border-[#e2e6ee] bg-white px-3 text-[12px] font-semibold text-[#43506a] outline-none focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"

            >

              {STATE_FILTERS.map((f) => (

                <option key={f.key} value={f.key}>

                  {f.label} ({counts[f.key] ?? 0})

                </option>

              ))}

            </select>



            <select

              value={recommendation}

              onChange={(e) => handleRecommendationChange(e.target.value)}

              className="h-11 rounded-xl border border-[#e2e6ee] bg-white px-3 text-[12px] font-semibold text-[#43506a] outline-none focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"

            >

              {RECOMMENDATION_FILTERS.map((r) => (

                <option key={r.key} value={r.key}>

                  {r.label}

                </option>

              ))}

            </select>

          </div>

        </div>

      )}



      {loading && <LoadingCards />}



      {!loading && !error && filtered.length === 0 && (

        <div className="rounded-2xl border border-dashed border-[#d6dbe8] bg-white p-12 text-center dark:border-[#1e293b] dark:bg-[#0f172a]">

          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]">

            <ClipboardCheck size={22} />

          </span>

          <h3 className="mt-4 text-[14px] font-bold text-[#1c2a4a] dark:text-white">

            {reviews.length === 0 ? "No reviews assigned yet" : "No matches"}

          </h3>

          <p className="mx-auto mt-2 max-w-[420px] text-[11px] leading-5 text-[#8993a6]">

            {reviews.length === 0

              ? "Once an organiser assigns you a submission, it will appear here for scoring."

              : "Try a different filter or clear the search."}

          </p>

        </div>

      )}



      {!loading && !error && filtered.length > 0 && (

        <section className="grid gap-4">

          {filtered.map((review) => (

            <ReviewCard key={itemReviewId(review)} review={review} onEvaluate={handleEvaluate} />

          ))}



          {hasMore && (

            <button

              onClick={handleLoadMore}

              disabled={loadingMore}

              className="mx-auto mt-2 inline-flex items-center gap-2 rounded-xl border border-[#d6dbe8] bg-white px-5 py-3 text-[12px] font-extrabold text-[#43506a] shadow-[0_6px_18px_rgba(15,28,65,.04)] transition hover:-translate-y-px hover:border-[#8175ef] hover:text-[#4f46c7] disabled:opacity-50 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-white"

            >

              {loadingMore ? "Loading…" : "Load more"}

            </button>

          )}

        </section>

      )}

    </ReviewerLayout>

  );

}