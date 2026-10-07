import { useEffect, useMemo, useState } from "react";
import { CheckCheck, Loader2, Lock, PenLine, Search, Star } from "lucide-react";
import OrganiserLayout from "../components/OrganiserLayout";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";
import { reviewsApi } from "../api/reviewsApi";

const unwrapList = (r) => (Array.isArray(r) ? r : r?.data || []);

const REC_STYLES = {
  accept: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  reject: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  revise: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

export default function OrganiserReviews() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [conferenceFilter, setConferenceFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const confRes = await conferencesApi.getAll({ per_page: 100 });
        const mine = unwrapList(confRes).filter(
          (c) =>
            Number(c.organiser_id) === Number(user?.id) ||
            Number(c.organiser?.id) === Number(user?.id)
        );
        if (alive) setConferences(mine);

        const submissionToConference = new Map();
        for (const c of mine) {
          try {
            const subRes = await submissionsApi.getAll({
              conference_id: c.id,
              per_page: 100,
            });
            unwrapList(subRes).forEach((s) =>
              submissionToConference.set(Number(s.id), c)
            );
          } catch {}
        }

        const reviewRes = await reviewsApi.getAll({ per_page: 100 });
        const filtered = unwrapList(reviewRes)
          .filter((r) => submissionToConference.has(Number(r.submission_id)))
          .map((r) => ({
            ...r,
            conference: submissionToConference.get(Number(r.submission_id)),
          }));

        if (alive) setRows(filtered);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesConference =
        conferenceFilter === "all" ||
        String(r.conference?.id) === String(conferenceFilter);
      const matchesQuery =
        !q ||
        [
          r.id,
          r.submission_id,
          r.reviewer?.name,
          r.reviewer_id,
          r.recommendation,
          r.conference?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesConference && matchesQuery;
    });
  }, [rows, query, conferenceFilter]);

  const selectClass =
    "h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[10px] font-semibold text-[#59657d] outline-none focus:border-[#8175ef] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#94a3b8]";

  return (
    <OrganiserLayout>
      <section className="rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">
              Peer review
            </span>
            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">
              Reviews on your conferences
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reviews…"
                className="h-10 w-[180px] rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none focus:border-[#8175ef] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"
              />
            </div>
            <select
              value={conferenceFilter}
              onChange={(e) => setConferenceFilter(e.target.value)}
              className={`${selectClass} max-w-[220px]`}
            >
              <option value="all">All conferences</option>
              {conferences.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20 text-[12px] font-semibold text-[#7c879a] dark:text-[#94a3b8]">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading reviews…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCheck
              size={22}
              className="mx-auto text-[#aab2c0] dark:text-[#64748b]"
            />
            <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">
              No reviews found
            </h3>
            <p className="m-0 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
              Reviews assigned to your submissions will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#edf0f5] dark:divide-[#1e293b]">
            {filtered.map((r) => {
              const state = r.locked
                ? {
                    label: "Locked",
                    cls: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
                    Icon: Lock,
                  }
                : r.submitted_at
                ? {
                    label: "Submitted",
                    cls: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
                    Icon: CheckCheck,
                  }
                : {
                    label: "Pending",
                    cls: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
                    Icon: PenLine,
                  };
              const StateIcon = state.Icon;
              const rec = (r.recommendation || "").toLowerCase();
              const recCls =
                REC_STYLES[rec] ||
                "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]";

              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-[#fbfbfe] dark:hover:bg-[#111c33] sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#6757f5] dark:text-[#a9a2ff]">
                        Review #{r.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${state.cls}`}
                      >
                        <StateIcon size={10} /> {state.label}
                      </span>
                      {r.recommendation && (
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${recCls}`}
                        >
                          {r.recommendation}
                        </span>
                      )}
                    </div>
                    <p className="mb-0 mt-2 text-[11px] font-bold text-[#0d1b3d] dark:text-white">
                      Submission #{r.submission_id}
                      {r.conference?.name ? (
                        <span className="ml-2 text-[10px] font-semibold text-[#8993a6] dark:text-[#94a3b8]">
                          · {r.conference.name}
                        </span>
                      ) : null}
                    </p>
                    <p className="mb-0 mt-0.5 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
                      Reviewer: {r.reviewer?.name || `User #${r.reviewer_id}`}
                    </p>
                  </div>

                  {typeof r.score === "number" && (
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#6757f5] dark:text-[#a9a2ff]">
                      <Star size={13} /> {r.score}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </OrganiserLayout>
  );
}