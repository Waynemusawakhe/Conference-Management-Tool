import DocumentInspector from "../components/DocumentInspector";
import { inspectDocument } from "../utils/documentInspector";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthorLayout from "../components/AuthorLayout";
import { useAuth } from "../context/AuthContext";
import { submissionsApi } from "../api/submissionsApi";
import { conferencesApi } from "../api/conferencesApi";

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

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isDeadlinePassed = (c) =>
  Boolean(c?.submission_deadline) &&
  String(c.submission_deadline).slice(0, 10) < todayISO();

function getErrorMessage(error) {
  const first = Object.values(error?.errors || {})[0];
  return (
    Array.isArray(first)
      ? first[0]
      : first || error?.message || "Something went wrong."
  );
}

function dateLabel(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function unwrapList(response) {
  return Array.isArray(response) ? response : response?.data || [];
}

function extractFilePath(obj) {
  if (!obj) return null;
  return (
    obj.file_path ??
    obj.file_url ??
    obj.fileUrl ??
    obj.document_url ??
    obj.documentUrl ??
    obj.attachment_url ??
    obj.attachmentUrl ??
    obj.file ??
    obj.document ??
    obj.attachment ??
    null
  );
}

function fileNameFromPath(path) {
  if (!path) return null;
  const clean = String(path).split("?")[0].split("#")[0];
  return clean.substring(clean.lastIndexOf("/") + 1);
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#030814]/70 p-4 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-[22px] bg-white text-[#0d1b3d] shadow-[0_40px_120px_rgba(3,8,20,.5)] ${
          wide ? "max-w-[760px]" : "max-w-[560px]"
        }`}
      >
        <div className="sticky top-0 z-[1] flex items-start justify-between gap-4 border-b border-[#edf0f5] bg-white/95 px-5 py-4 backdrop-blur sm:px-7 sm:py-5">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">
              Author workspace
            </span>
            <h2 className="mb-0 mt-1 truncate text-xl font-bold tracking-[-.03em]">
              {title}
            </h2>
            {subtitle && (
              <p className="mb-0 mt-1 text-[11px] text-[#66728b]">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] transition hover:bg-[#07132f] hover:text-white"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="p-5 sm:p-7">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ state, onCancel, onConfirm, isProcessing }) {
  if (!state) return null;

  const isDelete = state.type === "delete";
  const Icon = isDelete ? Trash2 : RotateCcw;

  const theme = isDelete
    ? {
        iconBg: "bg-red-50 text-red-600",
        confirmBtn:
          "bg-gradient-to-br from-[#ef4444] to-[#dc2626] hover:from-[#b91c1c] hover:to-[#991b1b] shadow-[0_8px_20px_rgba(239,68,68,.3)]",
        title: "Delete this proposal?",
        message: `Are you sure you want to permanently delete "${state.proposal.title}"? This action cannot be undone.`,
      }
    : {
        iconBg: "bg-[#fff9e9] text-[#9b7414]",
        confirmBtn:
          "bg-gradient-to-br from-[#f59e0b] to-[#d97706] hover:from-[#b45309] hover:to-[#92400e] shadow-[0_8px_20px_rgba(245,158,11,.3)]",
        title: "Withdraw this proposal?",
        message: `Are you sure you want to withdraw "${state.proposal.title}"? The reviewers will no longer be able to evaluate it.`,
      };

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-[#030814]/70 p-4 backdrop-blur-md">
      <div
        className="w-full max-w-[440px] overflow-hidden rounded-[22px] bg-white shadow-[0_40px_120px_rgba(3,8,20,.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center p-6 text-center">
          <div
            className={`mb-4 grid h-14 w-14 place-items-center rounded-full ${theme.iconBg}`}
          >
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-[18px] font-extrabold text-[#1c2a4a]">
            {theme.title}
          </h2>
          <p className="mt-2 text-[12px] leading-6 text-[#66728b]">
            {theme.message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#edf0f5] bg-[#fafbfe] p-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-4 text-[12px] font-extrabold text-[#5c6880] transition hover:bg-[#07132f] hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-extrabold text-white transition disabled:opacity-50 ${theme.confirmBtn}`}
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Icon size={16} />
            )}
            {isProcessing
              ? "Processing..."
              : isDelete
              ? "Yes, delete"
              : "Yes, withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionSuccessModal({
  open,
  title,
  conferenceName,
  onView,
  onClose,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] grid place-items-center bg-[#030814]/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white shadow-[0_40px_120px_rgba(3,8,20,.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <div className="relative mb-5 grid h-20 w-20 place-items-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#effaf4] to-[#e0f5ea]" />
            <svg
              viewBox="0 0 52 52"
              className="relative h-14 w-14"
              aria-hidden="true"
            >
              <circle
                cx="26"
                cy="26"
                r="23"
                fill="none"
                stroke="#18794e"
                strokeWidth="2"
                strokeOpacity=".15"
              />
              <path
                d="M15 27 L23 35 L38 19"
                fill="none"
                stroke="#18794e"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cmt-check-path"
              />
            </svg>
          </div>
          <h2 className="text-[18px] font-extrabold text-[#1c2a4a]">
            Proposal Submitted Successfully
          </h2>
          {title && (
            <p className="mt-2 line-clamp-2 text-[12px] font-bold text-[#35415f]">
              {title}
            </p>
          )}
          {conferenceName && (
            <p className="mt-1 text-[10px] text-[#8993a6]">{conferenceName}</p>
          )}
          <p className="mt-3 text-[11px] leading-5 text-[#66728b]">
            Your submission is now in review. Track its status from your
            dashboard.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-[#edf0f5] bg-[#fafbfe] p-4">
          <button
            onClick={onView}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dfe4ed] bg-white px-4 text-[11px] font-extrabold text-[#5c6880] transition hover:bg-[#07132f] hover:text-white"
          >
            View proposals
          </button>
          <button
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-[11px] font-extrabold text-white shadow-[0_8px_20px_rgba(103,87,245,.28)] transition hover:from-[#4a3ec9] hover:to-[#5b4be0]"
          >
            Done
          </button>
        </div>
      </div>
      <style>{`
        .cmt-check-path {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: cmtDrawCheck .55s ease-out forwards;
        }
        @keyframes cmtDrawCheck {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cmt-check-path {
            animation: none;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [proposals, setProposals] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState(null);

  const [confirmState, setConfirmState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const emptyForm = {
    conference_id: "",
    title: "",
    track: "",
    abstract: "",
    file: null,
    existingFile: null,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const id = location.hash.slice(1);
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempts++ < 20) {
        setTimeout(tryScroll, 100);
      }
    };
    const timer = setTimeout(tryScroll, 100);
    return () => clearTimeout(timer);
  }, [location.hash, loading]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [submissionResponse, conferenceResponse] = await Promise.all([
        submissionsApi.getAll({ per_page: 100 }),
        conferencesApi.getAll({ per_page: 100 }),
      ]);
      setProposals(unwrapList(submissionResponse));
      setConferences(unwrapList(conferenceResponse));
    } catch (err) {
      if (err?.status === 401) {
        await logout();
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProposals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proposals.filter((p) => {
      const status = p.status || "pending";
      const conferenceName = p.conference?.name || p.conference?.title || "";
      const matchesStatus =
        statusFilter === "all" || status === statusFilter;
      const matchesQuery =
        !q ||
        [p.title, p.track, p.id, conferenceName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [proposals, query, statusFilter]);

  const stats = useMemo(
    () => ({
      total: proposals.length,
      review: proposals.filter((p) =>
        ["pending", "under_review"].includes(p.status || "pending"),
      ).length,
      accepted: proposals.filter((p) => p.status === "accepted").length,
      revision: proposals.filter((p) => p.status === "revision_requested")
        .length,
    }),
    [proposals],
  );

  const deadlines = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return conferences
      .filter((c) => {
        if (!c.submission_deadline) return false;
        const deadlineDate = new Date(c.submission_deadline);
        return deadlineDate >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.submission_deadline) - new Date(b.submission_deadline),
      )
      .slice(0, 4);
  }, [conferences]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setModal("create");
  };

  const openEdit = (proposal) => {
    setSelected(proposal);
    const existingFile = extractFilePath(proposal);
    setForm({
      conference_id: proposal.conference_id || proposal.conference?.id || "",
      title: proposal.title || "",
      track: proposal.track || "",
      abstract: proposal.abstract || "",
      file: null,
      existingFile,
    });
    setFormError("");
    setModal("edit");
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");

    if (!form.conference_id || !form.title.trim() || !form.abstract.trim()) {
      setFormError("Conference, title and abstract are required.");
      return;
    }

    if (form.file) {
      const inspected = inspectDocument(form.file);
      if (inspected && !inspected.valid) {
        setFormError(inspected.problems[0]);
        return;
      }
    }

    const submittedTitle = form.title.trim();
    const submittedConferenceId = form.conference_id;
    const submittedConferenceName =
      conferences.find(
        (c) => String(c.id) === String(submittedConferenceId),
      )?.name || "";

    const body = new FormData();
    if (modal === "create") {
      body.append("conference_id", String(form.conference_id));
    }
    body.append("title", submittedTitle);
    body.append("track", form.track.trim());
    body.append("abstract", form.abstract.trim());

    if (form.file) {
      body.append("file", form.file);
    }

    setSaving(true);
    try {
      if (modal === "create") {
        await submissionsApi.create(body);
        setModal(null);
        setSuccessData({
          title: submittedTitle,
          conferenceName: submittedConferenceName,
        });
      } else {
        await submissionsApi.update(selected.id, body);
        setModal(null);
      }
      await loadData();
    } catch (err) {
      if (err?.status === 401) {
        await logout();
        return;
      }
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const requestAction = (type, proposal) => {
    setError("");
    setConfirmState({ type, proposal });
  };

  const executeAction = async () => {
    if (!confirmState) return;
    const { type, proposal } = confirmState;
    setIsProcessing(true);
    try {
      if (type === "delete") {
        await submissionsApi.remove(proposal.id);
      } else if (type === "withdraw") {
        await submissionsApi.withdraw(proposal.id);
      }
      await loadData();
      setConfirmState(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirmState(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const displayName = user?.name || user?.full_name || "Author";

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AuthorLayout>
      <main id="dashboard-overview" className="min-w-0 flex-1 scroll-mt-24">
        <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
          <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
          <div className="relative flex items-end justify-between gap-6 max-[700px]:block">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
                <Sparkles size={14} /> Author dashboard
              </span>
              <h1 className="mb-2 mt-3 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-.045em]">
                Welcome, {displayName.split(" ")[0]}.
              </h1>
              <p className="m-0 max-w-[600px] text-[12px] leading-6 text-white/65">
                Track proposal progress, update eligible submissions and keep
                every deadline visible from one workspace.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:from-[#4a3ec9] hover:to-[#5b4be0] hover:-translate-y-px"
            >
              <Send size={16} /> Submit a proposal
            </button>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              onClick={loadData}
              className="font-extrabold underline hover:text-[#07132f]"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mt-5 grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[520px]:grid-cols-1">
          {[
            {
              icon: <FileText size={19} />,
              value: stats.total,
              label: "Total proposals",
              note: "Your submissions",
            },
            {
              icon: <Clock3 size={19} />,
              value: stats.review,
              label: "In review",
              note: "Awaiting decisions",
            },
            {
              icon: <FileCheck2 size={19} />,
              value: stats.accepted,
              label: "Accepted",
              note: "Positive decisions",
            },
            {
              icon: <Upload size={19} />,
              value: stats.revision,
              label: "Needs revision",
              note: "Action required",
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className="group rounded-[17px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)] transition hover:border-[#07132f] hover:shadow-[0_14px_34px_rgba(7,19,47,.12)]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec] transition group-hover:bg-[#07132f] group-hover:text-white">
                {stat.icon}
              </span>
              <strong className="mt-4 block text-[25px] leading-none tracking-[-.04em]">
                {stat.value}
              </strong>
              <p className="mb-0 mt-1.5 text-[11px] font-bold text-[#35415f]">
                {stat.label}
              </p>
              <span className="text-[9px] text-[#8b95a8]">{stat.note}</span>
            </article>
          ))}
        </section>

        <section
          id="my-proposals"
          className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6 max-[720px]:block">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
                Research activity
              </span>
              <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
                My proposals
              </h2>
            </div>
            <div className="mt-3 flex gap-2 sm:mt-0 max-[480px]:grid max-[480px]:grid-cols-[1fr_auto]">
              <div className="relative min-w-0 sm:w-[220px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                  size={15}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search proposals..."
                  className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none focus:border-[#07132f] focus:ring-4 focus:ring-[#07132f]/10"
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
                  className="h-10 max-w-[165px] rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] font-semibold text-[#59657d] outline-none focus:border-[#07132f]"
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
              Loading your proposals…
            </div>
          ) : filteredProposals.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                      <th className="px-6 py-3">Proposal</th>
                      <th className="px-4 py-3">Conference</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProposals.map((proposal) => {
                      const conferenceName =
                        proposal.conference?.name ||
                        proposal.conference?.title ||
                        conferences.find(
                          (c) => c.id === proposal.conference_id,
                        )?.name ||
                        "Conference";
                      const status = proposal.status || "pending";
                      const canMutate = status === "pending";
                      const isWithdrawn = status === "withdrawn";

                      return (
                        <tr
                          key={proposal.id}
                          className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#f7f8fc]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                                <FileText size={16} />
                              </span>
                              <div>
                                <strong className="block max-w-[290px] truncate text-[11px] text-[#1c2a4a]">
                                  {proposal.title}
                                </strong>
                                <span className="text-[9px] text-[#929bad]">
                                  #{proposal.id} ·{" "}
                                  {proposal.track || "General track"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[10px] font-semibold text-[#5c6880]">
                            {conferenceName}
                          </td>
                          <td className="px-4 py-4 text-[10px] text-[#7b869b]">
                            {dateLabel(proposal.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                                STATUS_STYLES[status] || STATUS_STYLES.pending
                              }`}
                            >
                              {STATUS_LABELS[status] || status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-1.5">
                              {!isWithdrawn && (
                                <button
                                  title="View"
                                  onClick={() => {
                                    setSelected(proposal);
                                    setModal("view");
                                  }}
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-[#f4f6fa] text-[#647089] transition hover:bg-[#07132f] hover:text-white"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              {canMutate && (
                                <button
                                  title="Edit"
                                  onClick={() => openEdit(proposal)}
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-[#f4f6fa] text-[#647089] transition hover:bg-[#07132f] hover:text-white"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {canMutate && (
                                <button
                                  title="Delete"
                                  onClick={() =>
                                    requestAction("delete", proposal)
                                  }
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff3f4] text-[#b13a3a] transition hover:bg-[#991b1b] hover:text-white"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                              {canMutate && (
                                <button
                                  title="Withdraw"
                                  onClick={() =>
                                    requestAction("withdraw", proposal)
                                  }
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff7ec] text-[#a55b25] transition hover:bg-[#92400e] hover:text-white"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-[#edf0f5] md:hidden">
                {filteredProposals.map((proposal) => {
                  const status = proposal.status || "pending";
                  const conferenceName =
                    proposal.conference?.name ||
                    proposal.conference?.title ||
                    conferences.find((c) => c.id === proposal.conference_id)
                      ?.name ||
                    "Conference";
                  const canMutate = status === "pending";
                  const isWithdrawn = status === "withdrawn";

                  return (
                    <article key={proposal.id} className="p-4">
                      <div className="flex gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                          <FileText size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <strong className="block text-[11px]">
                            {proposal.title}
                          </strong>
                          <p className="mb-2 mt-1 text-[9px] text-[#8c96a9]">
                            {conferenceName}
                          </p>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                              STATUS_STYLES[status] || STATUS_STYLES.pending
                            }`}
                          >
                            {STATUS_LABELS[status] || status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-between gap-2 text-[9px] text-[#8c96a9]">
                        <span>Submitted {dateLabel(proposal.created_at)}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {!isWithdrawn && (
                            <button
                              onClick={() => {
                                setSelected(proposal);
                                setModal("view");
                              }}
                              className="rounded-lg bg-[#f4f6fa] px-2.5 py-1.5 font-bold transition hover:bg-[#07132f] hover:text-white"
                            >
                              View
                            </button>
                          )}
                          {canMutate && (
                            <button
                              onClick={() => openEdit(proposal)}
                              className="rounded-lg bg-[#efedff] px-2.5 py-1.5 font-bold text-[#5548d7] transition hover:bg-[#07132f] hover:text-white"
                            >
                              Edit
                            </button>
                          )}
                          {canMutate && (
                            <button
                              onClick={() =>
                                requestAction("delete", proposal)
                              }
                              className="rounded-lg bg-[#fff2f2] px-2.5 py-1.5 font-bold text-[#b13a3a] transition hover:bg-[#991b1b] hover:text-white"
                            >
                              Delete
                            </button>
                          )}
                          {canMutate && (
                            <button
                              onClick={() =>
                                requestAction("withdraw", proposal)
                              }
                              className="rounded-lg bg-[#fff7ec] px-2.5 py-1.5 font-bold text-[#a55b25] transition hover:bg-[#92400e] hover:text-white"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <Search size={20} className="mx-auto text-[#aeb6c6]" />
              <h3 className="mb-1 mt-3 text-[13px] font-bold">
                No proposals found
              </h3>
              <p className="m-0 text-[10px] text-[#8993a6]">
                Try another search/status filter or submit a new proposal.
              </p>
            </div>
          )}
        </section>

        <section
          id="deadlines"
          className="mt-6 grid scroll-mt-24 grid-cols-[1.25fr_.75fr] gap-5 max-[900px]:grid-cols-1"
        >
          <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
                  Stay ahead
                </span>
                <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
                  Upcoming deadlines
                </h2>
              </div>
              <CalendarDays size={19} className="text-[#6a5af2]" />
            </div>
            <div className="space-y-3">
              {deadlines.length ? (
                deadlines.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-[13px] border border-[#edf0f5] bg-[#fafbfe] p-3 transition hover:border-[#07132f] hover:bg-white"
                  >
                    <div className="grid h-11 w-12 shrink-0 place-items-center rounded-[10px] bg-[#efedff] text-center">
                      <strong className="block text-[10px] font-extrabold text-[#5649dc]">
                        {new Date(c.submission_deadline).toLocaleDateString(
                          undefined,
                          { month: "short", day: "2-digit" },
                        )}
                      </strong>
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-[11px]">
                        {c.name}
                      </strong>
                      <span className="text-[9px] text-[#8a95a8]">
                        Submission deadline
                      </span>
                    </div>
                    <ChevronRight size={15} className="text-[#a7afbd]" />
                  </div>
                ))
              ) : (
                <p className="m-0 text-xs text-[#8a95a8]">
                  No conference deadlines are available yet.
                </p>
              )}
            </div>
          </article>
          <article className="rounded-[20px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-6 text-white shadow-[0_18px_45px_rgba(20,28,80,.15)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
              <BookOpen size={18} />
            </span>
            <h2 className="mb-2 mt-5 text-[20px] font-bold tracking-[-.03em]">
              Ready for your next submission?
            </h2>
            <p className="m-0 text-[10px] leading-6 text-white/60">
              Browse open conferences and submit directly into the CMT
              workflow.
            </p>
            <button
              onClick={() => navigate("/author/conferences")}
              className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[.08] px-3.5 py-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#030814] hover:border-white/30"
            >
              Browse conferences <ChevronRight size={14} />
            </button>
          </article>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-1 py-8 text-[9px] text-[#8c96a9]">
          <span>CMT Author Workspace · API connected</span>
          <span>Submission permissions are enforced by the backend.</span>
        </footer>
      </main>

      {modal === "create" || modal === "edit" ? (
        <Modal
          title={modal === "create" ? "Submit a proposal" : "Edit proposal"}
          subtitle={
            modal === "create"
              ? "Choose a conference and describe your research."
              : "Update the details of your proposal."
          }
          onClose={() => !saving && setModal(null)}
          wide
        >
          <form onSubmit={submitForm} className="grid gap-6">
            {modal === "create" && (
              <div className="rounded-2xl border border-[#e4e8f0] bg-[#fafbfe] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays size={14} className="text-[#6655f6]" />
                  <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#43506a]">
                    Conference
                  </h3>
                </div>
                <select
                  value={form.conference_id}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, conference_id: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-[#dfe4ed] bg-white px-3 text-sm font-normal outline-none focus:border-[#07132f] focus:ring-4 focus:ring-[#07132f]/10"
                >
                  <option value="">Select a conference</option>
                  {conferences
                    .filter(
                      (c) =>
                        c.submission_status !== "closed" &&
                        !isDeadlinePassed(c),
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {modal === "edit" && selected && (
              <div className="rounded-2xl border border-[#e4e8f0] bg-[#fafbfe] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays size={14} className="text-[#6655f6]" />
                  <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#43506a]">
                    Conference
                  </h3>
                </div>
                <p className="m-0 text-sm font-bold text-[#1c2a4a]">
                  {selected.conference?.name ||
                    conferences.find(
                      (c) =>
                        String(c.id) ===
                        String(selected.conference_id || form.conference_id),
                    )?.name ||
                    "Conference"}
                </p>
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <FileText size={14} className="text-[#6655f6]" />
                <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#43506a]">
                  Proposal details
                </h3>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
                  Title
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, title: e.target.value }))
                    }
                    maxLength={255}
                    className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none focus:border-[#07132f] focus:ring-4 focus:ring-[#07132f]/10"
                    placeholder="Research proposal title"
                  />
                </label>
                <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
                  Track
                  <input
                    value={form.track}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, track: e.target.value }))
                    }
                    maxLength={255}
                    className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none focus:border-[#07132f] focus:ring-4 focus:ring-[#07132f]/10"
                    placeholder="e.g. Artificial Intelligence"
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <FileText size={14} className="text-[#6655f6]" />
                <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#43506a]">
                  Abstract
                </h3>
              </div>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
                <textarea
                  value={form.abstract}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, abstract: e.target.value }))
                  }
                  maxLength={5000}
                  rows={8}
                  className="resize-y rounded-xl border border-[#dfe4ed] p-3 text-sm font-normal leading-6 outline-none focus:border-[#07132f] focus:ring-4 focus:ring-[#07132f]/10"
                  placeholder="Write the research abstract…"
                />
                <span className="text-right text-[9px] font-normal text-[#8a95a8]">
                  {form.abstract.length}/5000
                </span>
              </label>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Upload size={14} className="text-[#6655f6]" />
                <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#43506a]">
                  Document
                </h3>
              </div>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
                {modal === "edit" && form.existingFile
                  ? "Replace file (optional)"
                  : "Proposal file"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  id="proposal-file-dashboard"
                  onChange={(e) =>
                    setForm((v) => ({
                      ...v,
                      file: e.target.files?.[0] || null,
                    }))
                  }
                  className="block h-11 w-full rounded-xl border border-[#dfe4ed] bg-white px-2 py-2 text-[11px]"
                />
                <span className="font-normal text-[9px] text-[#8a95a8]">
                  Optional · PDF, DOC or DOCX · maximum 10MB
                </span>
                {modal === "edit" && form.existingFile && (
                  <span className="mt-1 flex items-center gap-1.5 rounded-md bg-[#f0efff] px-2 py-1 text-[10px] font-medium text-[#5548d7]">
                    <FileText size={11} />
                    Current:{" "}
                    {fileNameFromPath(form.existingFile) || "attached file"}
                  </span>
                )}
              </label>
              <DocumentInspector
                file={form.file}
                onRemove={() => {
                  setForm((v) => ({ ...v, file: null }));
                  const i = document.getElementById(
                    "proposal-file-dashboard",
                  );
                  if (i) i.value = "";
                }}
              />
            </div>

            {formError && (
              <p
                role="alert"
                className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                {formError}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#edf0f5] pt-4">
              <button
                type="button"
                onClick={() => !saving && setModal(null)}
                disabled={saving}
                className="rounded-xl border border-[#dfe4ed] px-4 py-2.5 text-xs font-bold text-[#66728b] transition hover:bg-[#07132f] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-xs font-extrabold text-white transition hover:from-[#4a3ec9] hover:to-[#5b4be0] disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : modal === "create" ? (
                  <>
                    <Send size={14} /> Submit proposal
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modal === "view" && selected ? (
        <Modal
          title={selected.title}
          subtitle={`#${selected.id}`}
          onClose={() => setModal(null)}
          wide
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold ${
                  STATUS_STYLES[selected.status] || STATUS_STYLES.pending
                }`}
              >
                {STATUS_LABELS[selected.status] ||
                  selected.status ||
                  "Pending"}
              </span>
              {selected.track && (
                <span className="text-[10px] font-semibold text-[#8993a6]">
                  {selected.track}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#fafbfe] p-4">
                <span className="text-[9px] font-bold uppercase tracking-wide text-[#9aa3b3]">
                  Conference
                </span>
                <p className="mb-0 mt-1 text-sm font-bold text-[#1c2a4a]">
                  {selected.conference?.name ||
                    conferences.find(
                      (c) => c.id === selected.conference_id,
                    )?.name ||
                    "Conference"}
                </p>
              </div>
              <div className="rounded-xl bg-[#fafbfe] p-4">
                <span className="text-[9px] font-bold uppercase tracking-wide text-[#9aa3b3]">
                  Submitted
                </span>
                <p className="mb-0 mt-1 text-sm font-bold text-[#1c2a4a]">
                  {dateLabel(selected.created_at)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="m-0 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#9aa3b3]">
                Abstract
              </h3>
              <p className="mb-0 mt-2 whitespace-pre-wrap text-sm leading-7 text-[#536079]">
                {selected.abstract ||
                  "The API did not return an abstract for this submission."}
              </p>
            </div>

            {selected.has_file && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e8ef] bg-[#fafbfe] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#efedff] text-[#5548d7]">
                    <FileText size={16} />
                  </span>
                  <div>
                    <p className="m-0 text-[11px] font-extrabold text-[#35415f]">
                      Submission document
                    </p>
                    <p className="mb-0 mt-0.5 text-[9px] text-[#8993a6]">
                      {selected.file_size_bytes
                        ? `${(
                            selected.file_size_bytes /
                            1024 /
                            1024
                          ).toFixed(2)} MB`
                        : "Document attached"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    try {
                      await submissionsApi.downloadFile(selected.id);
                    } catch (err) {
                      setError(
                        err?.message ||
                          "Unable to download submission file.",
                      );
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#efedff] px-3.5 py-2.5 text-[10px] font-extrabold text-[#5548d7] transition hover:bg-[#07132f] hover:text-white"
                >
                  <Download size={14} /> Download file
                </button>
              </div>
            )}

            {selected.status === "pending" && (
              <div className="flex justify-end border-t border-[#edf0f5] pt-4">
                <button
                  onClick={() => openEdit(selected)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#efedff] px-4 py-2.5 text-xs font-extrabold text-[#5548d7] transition hover:bg-[#07132f] hover:text-white"
                >
                  <Pencil size={14} /> Edit proposal
                </button>
              </div>
            )}
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        state={confirmState}
        onCancel={() => setConfirmState(null)}
        onConfirm={executeAction}
        isProcessing={isProcessing}
      />

      <SubmissionSuccessModal
        open={Boolean(successData)}
        title={successData?.title}
        conferenceName={successData?.conferenceName}
        onView={() => {
          setSuccessData(null);
          scrollToSection("my-proposals");
        }}
        onClose={() => setSuccessData(null)}
      />
    </AuthorLayout>
  );
}