import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ClipboardCheck,
  FilePlus2,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AttendeeHeader from "../components/AttendeeHeader";
import AttendeeSidebar from "../components/AttendeeSidebar";
import { submissionsApi } from "../api/submissionsApi";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  pending: "Pending review",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
  revision_requested: "Revision requested",
  withdrawn: "Withdrawn",
};

const STATUS_STYLES = {
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  under_review: "border-[#c9d9f5] bg-[#f0f6ff] text-[#345f9f]",
  accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  revision_requested: "border-[#ded5fa] bg-[#f5f1ff] text-[#6952b8]",
  withdrawn: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]",
};

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function formatDate(value) {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(value) {
  return String(value || "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export default function AttendeeProposalStatus() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await submissionsApi.getAll({ per_page: 100 });
      setProposals(unwrapList(response));
    } catch (requestError) {
      setError(requestError?.message || "Unable to load proposal statuses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <AttendeeHeader
        name={user?.name || user?.full_name || "Attendee"}
        menuOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((value) => !value)}
      />

      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        <AttendeeSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1">
          <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
              <ClipboardCheck size={14} /> Proposal tracking
            </span>
            <h1 className="mb-2 mt-3 text-3xl font-bold leading-tight">
              Proposal status
            </h1>
            <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
              Follow the review progress of proposals you have submitted.
            </p>
          </section>

          <section className="mt-6 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
                  My submissions
                </span>
                <h2 className="mb-0 mt-1 text-[20px] font-bold">
                  {loading
                    ? "Proposal updates"
                    : `${proposals.length} proposal${proposals.length === 1 ? "" : "s"}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={loadProposals}
                disabled={loading}
                aria-label="Refresh proposal statuses"
                title="Refresh statuses"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe4ed] text-[#66728b] transition hover:bg-[#f6f7fa] disabled:opacity-50"
              >
                <LoaderCircle size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="flex-1">{error}</span>
                <button type="button" onClick={loadProposals} className="font-bold underline">
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">
                Loading proposal statuses...
              </div>
            ) : !error && proposals.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardCheck size={24} className="mx-auto text-[#aeb6c6]" />
                <h3 className="mb-1 mt-3 text-[13px] font-bold">
                  No proposals submitted yet
                </h3>
                <p className="m-0 text-[10px] text-[#8993a6]">
                  Your submitted proposals and their review status will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/submit-proposal")}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6655f6] px-4 py-2.5 text-[10px] font-extrabold text-white"
                >
                  <FilePlus2 size={14} /> Submit a proposal
                </button>
              </div>
            ) : !error ? (
              <div className="divide-y divide-[#edf0f5]">
                {proposals.map((proposal) => {
                  const status = normalizeStatus(proposal.status);
                  const conference = proposal.conference;

                  return (
                    <article
                      key={proposal.id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                          <ClipboardCheck size={17} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="m-0 truncate text-[12px] font-bold text-[#1c2a4a]">
                            {proposal.title || "Untitled proposal"}
                          </h3>
                          <p className="mb-0 mt-1 text-[10px] text-[#788398]">
                            {conference?.name || "Conference"}
                            {proposal.track ? ` · ${proposal.track}` : ""}
                          </p>
                          <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-[#929bad]">
                            <CalendarDays size={11} />
                            Submitted {formatDate(proposal.created_at || proposal.submitted_at)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                          STATUS_STYLES[status] || STATUS_STYLES.pending
                        }`}
                      >
                        {STATUS_LABELS[status] || proposal.status || "Pending review"}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}