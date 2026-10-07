import { useEffect, useState } from "react";
import { CheckCheck, Loader2, Lock, PenLine, Star } from "lucide-react";
import OrganiserLayout from "../components/OrganiserLayout";
import { reviewsApi } from "../api/reviewsApi";

const unwrapList = (r) => (Array.isArray(r) ? r : r?.data || []);

const REC_STYLES = {
  accept: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  reject: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  revise: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

export default function OrganiserReviews() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewsApi
      .getAll({ per_page: 100 })
      .then((r) => setRows(unwrapList(r)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]">
      <div className="border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">
          Peer review
        </span>
        <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">
          Reviews on your conferences
        </h2>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-[12px] font-semibold text-[#7c879a] dark:text-[#94a3b8]">
          <Loader2 className="mr-2 animate-spin" size={18} /> Loading reviews…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center">
          <CheckCheck size={22} className="mx-auto text-[#aab2c0] dark:text-[#64748b]" />
          <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">
            No reviews yet
          </h3>
          <p className="m-0 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
            Reviews assigned to your submissions will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#edf0f5] dark:divide-[#1e293b]">
          {rows.map((r) => {
            const state = r.locked
              ? { label: "Locked", cls: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]", Icon: Lock }
              : r.submitted_at
              ? { label: "Submitted", cls: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]", Icon: CheckCheck }
              : { label: "Pending", cls: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]", Icon: PenLine };
            const StateIcon = state.Icon;
            const rec = (r.recommendation || "").toLowerCase();
            const recCls = REC_STYLES[rec] || "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]";

            return (
              <li key={r.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#6757f5] dark:text-[#a9a2ff]">
                      Review #{r.id}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${state.cls}`}>
                      <StateIcon size={10} /> {state.label}
                    </span>
                    {r.recommendation && (
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${recCls}`}>
                        {r.recommendation}
                      </span>
                    )}
                  </div>
                  <p className="mb-0 mt-2 text-[11px] font-bold text-[#0d1b3d] dark:text-white">
                    Submission #{r.submission_id}
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
  );
}