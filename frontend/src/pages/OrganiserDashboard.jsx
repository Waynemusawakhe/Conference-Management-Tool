import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, ArrowRight, BarChart3, Bell, CalendarDays, Check, ChevronDown,
  FileText, LayoutDashboard, LogOut, Menu, Pencil, Plus, Search, Settings,
  Sparkles, Trash2, UserRound, Users, X, ClipboardList, UserPlus, Gavel
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";
import { reviewsApi } from "../api/reviewsApi";
import { usersApi } from "../api/usersApi";

const EMPTY_CONFERENCE = {
  code: "", name: "", description: "", category: "", topics: "",
  format: "in_person", submission_status: "open", start_date: "",
  end_date: "", submission_deadline: "", venue_name: "", city: "",
  country: "South Africa", website_link: "",
};

const STATUS_LABELS = {
  pending: "Pending", under_review: "Under review", accepted: "Accepted",
  rejected: "Rejected", revision_requested: "Revision requested", withdrawn: "Withdrawn",
};
const STATUS_STYLES = {
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414] dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
  under_review: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7] dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200",
  accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e] dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a] dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200",
  revision_requested: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25] dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200",
  withdrawn: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b] dark:border-white/15 dark:bg-white/10 dark:text-slate-300",
};

function getErrorMessage(error) {
  const first = Object.values(error?.errors || {})[0];
  return Array.isArray(first) ? first[0] : first || error?.message || "Something went wrong.";
}
function unwrapList(response) { return Array.isArray(response) ? response : response?.data || []; }
function dateLabel(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function dateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-[22px] bg-white p-5 text-[#0d1b3d] shadow-[0_30px_90px_rgba(7,19,47,.3)] dark:bg-[#121a33] dark:text-white sm:p-7 ${wide ? "max-w-[820px]" : "max-w-[560px]"}`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6] dark:text-[#b7aeff]">Organiser workspace</span>
            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] dark:bg-white/10 dark:text-white" aria-label="Close">
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function OrganiserDashboard() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [conferenceForm, setConferenceForm] = useState(EMPTY_CONFERENCE);
  const [reviewerId, setReviewerId] = useState("");
  const [reviewerCandidates, setReviewerCandidates] = useState([]);

  const loadConferences = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await conferencesApi.getAll({ per_page: 100 });
      const all = unwrapList(response);
      const mine = all.filter((c) => Number(c.organiser_id) === Number(user?.id) || Number(c.organiser?.id) === Number(user?.id));
      setConferences(mine);
      setSelectedConference((current) => current && mine.some((c) => c.id === current.id) ? mine.find((c) => c.id === current.id) : mine[0] || null);
    } catch (err) {
      if (err?.status === 401) { await logout(); return; }
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }, [logout, user?.id]);

  const loadConferenceData = useCallback(async (conference) => {
    if (!conference) {
      setSubmissions([]); setReviews([]); setRegistrations([]); setSessions([]); return;
    }
    setDetailLoading(true); setError("");
    try {
      const [submissionResponse, registrationResponse, sessionResponse] = await Promise.all([
        submissionsApi.getAll({ conference_id: conference.id, per_page: 100 }),
        conferencesApi.getRegistrations(conference.id),
        conferencesApi.getSessions(conference.id),
      ]);
      const nextSubmissions = unwrapList(submissionResponse);
      setSubmissions(nextSubmissions);
      setRegistrations(unwrapList(registrationResponse));
      setSessions(unwrapList(sessionResponse));
      const reviewResponses = await Promise.all(nextSubmissions.map((s) => reviewsApi.getAll({ submission_id: s.id, per_page: 100 })));
      setReviews(reviewResponses.flatMap(unwrapList));
    } catch (err) {
      if (err?.status === 401) { await logout(); return; }
      setError(getErrorMessage(err));
      setReviews([]);
    } finally { setDetailLoading(false); }
  }, [logout]);

  useEffect(() => { loadConferences(); }, [loadConferences]);
  useEffect(() => { loadConferenceData(selectedConference); }, [selectedConference, loadConferenceData]);

  const filteredSubmissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions.filter((s) => {
      const status = s.status || "pending";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const author = s.author?.name || s.author_name || "";
      return matchesStatus && (!q || [s.title, s.track, author, String(s.id)].filter(Boolean).join(" ").toLowerCase().includes(q));
    });
  }, [submissions, query, statusFilter]);

  useEffect(() => {
    usersApi.getReviewers().then((response) => setReviewerCandidates(unwrapList(response))).catch(() => setReviewerCandidates([]));
  }, []);

  const stats = useMemo(() => ({
    submissions: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    reviewed: submissions.filter((s) => reviews.some((r) => Number(r.submission_id) === Number(s.id) && (r.locked || r.submitted_at))).length,
    attendees: registrations.filter((r) => r.status !== "cancelled").length,
  }), [submissions, reviews, registrations]);

  const openCreateConference = () => { setConferenceForm(EMPTY_CONFERENCE); setFormError(""); setModal("conference-create"); };
  const openEditConference = (c) => {
    setConferenceForm({
      code: c.code || "", name: c.name || "", description: c.description || "", category: c.category || "",
      topics: Array.isArray(c.topics) ? c.topics.join(", ") : "", format: c.format || "in_person",
      submission_status: c.submission_status || "open", start_date: dateInput(c.start_date), end_date: dateInput(c.end_date),
      submission_deadline: dateInput(c.submission_deadline), venue_name: c.venue_name || "", city: c.city || "",
      country: c.country || "South Africa", website_link: c.website_link || "",
    });
    setFormError(""); setModal("conference-edit");
  };

  const saveConference = async (e) => {
    e.preventDefault(); setFormError("");
    const f = conferenceForm;
    if (!f.code || !f.name || !f.description || !f.category || !f.topics || !f.start_date || !f.end_date || !f.submission_deadline || !f.city || !f.country) {
      setFormError("Please complete all required conference fields.");
      return;
    }
    if (new Date(f.end_date) < new Date(f.start_date)) { setFormError("End date must be on or after the start date."); return; }
    if (new Date(f.submission_deadline) > new Date(f.start_date)) { setFormError("Submission deadline must be on or before the start date."); return; }
    if ((f.format === "in_person" || f.format === "hybrid") && !f.venue_name) { setFormError("Venue name is required for in-person and hybrid conferences."); return; }

    const body = {
      code: f.code.trim(), name: f.name.trim(), description: f.description.trim(), category: f.category.trim(),
      topics: f.topics.split(",").map((x) => x.trim()).filter(Boolean), format: f.format, submission_status: f.submission_status,
      start_date: f.start_date, end_date: f.end_date, submission_deadline: f.submission_deadline,
      venue_name: f.venue_name.trim() || null, city: f.city.trim(), country: f.country.trim(), website_link: f.website_link.trim() || null,
    };
    setSaving(true);
    try {
      if (modal === "conference-create") await conferencesApi.create(body);
      else await conferencesApi.update(selectedConference.id, body);
      setModal(null); await loadConferences();
    } catch (err) { setFormError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const deleteConference = async () => {
    if (!selectedConference || !window.confirm(`Delete "${selectedConference.name}"? This cannot be undone.`)) return;
    try { await conferencesApi.remove(selectedConference.id); setSelectedConference(null); await loadConferences(); }
    catch (err) { setError(getErrorMessage(err)); }
  };

  const toggleSubmissionStatus = async () => {
    if (!selectedConference) return;
    const next = selectedConference.submission_status === "open" ? "closed" : "open";
    try { await conferencesApi.updateStatus(selectedConference.id, next); await loadConferences(); }
    catch (err) { setError(getErrorMessage(err)); }
  };

  const openAssign = (submission) => {
    setSelectedSubmission(submission);
    const existing = reviews.find((r) => Number(r.submission_id) === Number(submission.id) && r.reviewer_id);
    setReviewerId(existing?.reviewer_id ? String(existing.reviewer_id) : "");
    setFormError(""); setModal("assign");
  };

  const assignReviewer = async (e) => {
    e.preventDefault(); setFormError("");
    if (!reviewerId || !selectedSubmission?.id) { setFormError("Select a reviewer before assigning."); return; }
    setSaving(true);
    try {
      const existing = reviews.find((r) => Number(r.submission_id) === Number(selectedSubmission.id));
      if (existing && Number(existing.reviewer_id) !== Number(reviewerId)) {
        if (existing.locked || existing.submitted_at) {
          setFormError("This review has already been submitted or locked and cannot be reassigned.");
          return;
        }
        await reviewsApi.remove(existing.id);
      }
      if (!existing || Number(existing.reviewer_id) !== Number(reviewerId)) {
        await reviewsApi.assign({ submission_id: Number(selectedSubmission.id), reviewer_id: Number(reviewerId) });
      }
      if (selectedSubmission.status === "pending") {
        await submissionsApi.updateStatus(selectedSubmission.id, "under_review");
      }
      setModal(null); await loadConferenceData(selectedConference);
    } catch (err) { setFormError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const decide = async (submission, status) => {
    const related = reviews.filter((r) => Number(r.submission_id) === Number(submission.id));
    const submittedReview = related.find((r) => r.submitted_at || r.locked);
    if (!submittedReview) {
      setError("A reviewer must submit a review before the final decision can be recorded.");
      return;
    }
    const labels = { accepted: "accept", rejected: "reject", revision_requested: "request a revision" };
    if (!window.confirm(`Are you sure you want to ${labels[status]} "${submission.title}"?`)) return;
    try { await submissionsApi.updateStatus(submission.id, status); await loadConferenceData(selectedConference); }
    catch (err) { setError(getErrorMessage(err)); }
  };

  const scrollTo = (id) => { setSidebarOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const displayName = user?.name || "Organiser";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "O";

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d] dark:bg-[#070f24] dark:text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-5">
          <button className="lg:hidden" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle dashboard navigation">{sidebarOpen ? <X size={22} /> : <Menu size={22} />}</button>
          <button className="border-0 bg-transparent p-0" onClick={() => navigate("/")} aria-label="CMT home"><Logo /></button>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <div className="hidden sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">Organiser workspace</p>
            <p className="m-0 text-[12px] font-semibold text-white/65">Conference Management Tool</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setNotice((v) => !v)} className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80">
              <Bell size={17} />{notice && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7d6bff]" />}
            </button>
            <button onClick={toggleTheme} className="hidden h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 sm:grid">
              <Sparkles size={16} />
            </button>
            <div className="ml-1 hidden items-center gap-2.5 border-l border-white/10 pl-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">{initials}</div>
              <div>
                <strong className="block text-[11px] text-white">{displayName}</strong>
                <span className="block text-[9px] text-white/45">Organiser</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        <aside className={`${sidebarOpen ? "fixed inset-x-4 top-[88px] z-40 block" : "hidden"} w-[235px] shrink-0 rounded-2xl border border-[#e4e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,28,65,.10)] dark:border-white/10 dark:bg-[#121a33] lg:sticky lg:top-[100px] lg:block lg:h-[calc(100vh-124px)] lg:shadow-none`}>
          <div className="mb-3 rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10"><Gavel size={17} /></span>
            <strong className="block text-[13px]">Conference control</strong>
            <p className="mt-1 text-[10px] leading-5 text-white/60">Create events, review submissions and record decisions.</p>
          </div>
          <nav className="space-y-1">
            <button onClick={() => scrollTo("overview")} className="flex w-full items-center gap-3 rounded-xl bg-[#efedff] px-3 py-2.5 text-left text-[12px] font-extrabold text-[#5649dc] dark:bg-[#2a3358] dark:text-[#cfc8ff]"><LayoutDashboard size={16} /> Overview</button>
            <button onClick={() => scrollTo("submissions")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#c0c7d6] dark:hover:bg-white/5"><FileText size={16} /> Submissions</button>
            <button onClick={() => scrollTo("conference-management")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#c0c7d6] dark:hover:bg-white/5"><CalendarDays size={16} /> My conferences</button>
          </nav>
          <div className="my-4 border-t border-[#edf0f5] dark:border-white/10" />
          <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#c0c7d6] dark:hover:bg-white/5"><UserRound size={16} /> Profile</button>
          <button onClick={() => navigate("/settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#c0c7d6] dark:hover:bg-white/5"><Settings size={16} /> Settings</button>
          <button onClick={async () => { await logout(); navigate("/login", { replace: true }); }} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] hover:bg-[#fff4f5] dark:text-red-300 dark:hover:bg-red-500/10"><LogOut size={16} /> Sign out</button>
        </aside>

        <main id="overview" className="min-w-0 flex-1 scroll-mt-24">
          <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
            <div className="relative flex items-end justify-between gap-6 max-[700px]:block">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]"><Sparkles size={14} /> Organiser dashboard</span>
                <h1 className="mb-2 mt-3 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-.045em] text-white">Welcome, {displayName.split(" ")[0]}.</h1>
                <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">Run your conferences from one workspace — monitor submissions, assign reviewers and make final decisions.</p>
              </div>
              <button onClick={openCreateConference} className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)]"><Plus size={16} /> Create conference</button>
            </div>
          </section>

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => { loadConferences(); loadConferenceData(selectedConference); }} className="font-extrabold underline">Retry</button>
            </div>
          )}

          <section className="mt-5 grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[520px]:grid-cols-1">
            {[
              [FileText, stats.submissions, "Submissions", "In selected conference"],
              [ClipboardList, stats.pending, "Awaiting action", "Pending submissions"],
              [Check, stats.reviewed, "Reviews received", "Submitted or locked"],
              [Users, stats.attendees, "Attendees", "Active registrations"],
            ].map(([Icon, value, label, note]) => (
              <article key={label} className="rounded-[17px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)] dark:border-white/10 dark:bg-[#121a33]">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec] dark:bg-[#2a3358] dark:text-[#cfc8ff]"><Icon size={18} /></span>
                <strong className="mt-4 block text-[25px] leading-none tracking-[-.04em] text-[#0d1b3d] dark:text-white">{value}</strong>
                <p className="mb-0 mt-1.5 text-[11px] font-bold text-[#35415f] dark:text-[#e8ecf5]">{label}</p>
                <span className="text-[9px] text-[#8b95a8] dark:text-[#aeb6c8]">{note}</span>
              </article>
            ))}
          </section>

          {/* My conferences — FIXED COLORS */}
          <section id="conference-management" className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-white/10 dark:bg-[#121a33]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] p-5 dark:border-white/10 sm:p-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#b7aeff]">Conference management</span>
                <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">My conferences</h2>
              </div>
              <button onClick={openCreateConference} className="inline-flex items-center gap-2 rounded-xl bg-[#efedff] px-3.5 py-2.5 text-[10px] font-extrabold text-[#5548d7] dark:bg-[#2a3358] dark:text-[#cfc8ff]">
                <Plus size={14} /> New conference
              </button>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs font-semibold text-[#7c879a] dark:text-[#c0c7d6]">Loading your conferences…</div>
            ) : conferences.length ? (
              <div className="grid gap-3 p-4 sm:p-5">
                {conferences.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConference(c)}
                    className={`w-full rounded-[15px] border p-4 text-left transition hover:-translate-y-px ${
                      selectedConference?.id === c.id
                        ? "border-[#bcb6ff] bg-[#f7f6ff] shadow-[0_8px_24px_rgba(103,87,245,.08)] dark:border-[#7d6bff] dark:bg-[#1a2442]"
                        : "border-[#e9ecf2] bg-[#fafbfe] dark:border-white/10 dark:bg-[#0f1730]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#6757f5] dark:text-[#b7aeff]">{c.code}</span>
                          <span className={`rounded-full px-2 py-1 text-[8px] font-extrabold ${
                            c.submission_status === "open"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                          }`}>
                            {c.submission_status === "open" ? "Submissions open" : "Submissions closed"}
                          </span>
                        </div>
                        {/* Explicit title color — never pure white on light card */}
                        <h3 className="mb-0 mt-1 truncate text-sm font-bold text-[#0d1b3d] dark:text-white">{c.name}</h3>
                        <p className="mb-0 mt-1 text-[9px] text-[#5b657a] dark:text-[#c0c7d6]">
                          {dateLabel(c.start_date)} — {dateLabel(c.end_date)} · {c.city}, {c.country}
                        </p>
                      </div>
                      <ChevronDown className={`mt-1 shrink-0 transition ${selectedConference?.id === c.id ? "rotate-180 text-[#5c50ec] dark:text-[#b7aeff]" : "text-[#9aa3b2] dark:text-[#aeb6c8]"}`} size={17} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <CalendarDays size={22} className="mx-auto text-[#aab2c0]" />
                <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">No conferences yet</h3>
                <p className="mb-4 text-[10px] text-[#8993a6] dark:text-[#c0c7d6]">Create your first conference to start receiving submissions.</p>
                <button onClick={openCreateConference} className="rounded-xl bg-[#6655f6] px-4 py-2.5 text-xs font-extrabold text-white">Create conference</button>
              </div>
            )}

            {selectedConference && (
              <div className="border-t border-[#edf0f5] bg-[#fcfcfe] p-5 dark:border-white/10 dark:bg-[#0f1730] sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="m-0 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#5b657a] dark:text-[#aeb6c8]">Selected conference</p>
                    <h3 className="mb-0 mt-1 text-lg font-bold text-[#0d1b3d] dark:text-white">{selectedConference.name}</h3>
                    <p className="m-0 mt-1 text-[10px] text-[#5b657a] dark:text-[#c0c7d6]">
                      Submission deadline: {dateLabel(selectedConference.submission_deadline)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEditConference(selectedConference)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe4ed] bg-white px-3 py-2 text-[10px] font-extrabold text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={toggleSubmissionStatus} className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe4ed] bg-white px-3 py-2 text-[10px] font-extrabold text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white">
                      {selectedConference.submission_status === "open" ? "Close submissions" : "Open submissions"}
                    </button>
                    <button onClick={deleteConference} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-extrabold text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-300">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Submissions section — readable in both themes */}
          <section id="submissions" className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-white/10 dark:bg-[#121a33]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] p-5 dark:border-white/10 sm:p-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#b7aeff]">Manage submissions</span>
                <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">{selectedConference?.name || "Select a conference"}</h2>
              </div>
              {selectedConference && (
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={14} />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search submissions…" className="h-10 w-[180px] rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] text-[#0d1b3d] outline-none focus:border-[#8175ef] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[10px] font-semibold text-[#59657d] outline-none dark:border-white/15 dark:bg-[#1a2442] dark:text-white">
                    <option value="all">All statuses</option>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              )}
            </div>

            {!selectedConference ? (
              <div className="p-12 text-center text-xs text-[#8993a6] dark:text-[#c0c7d6]">Create or select one of your conferences above.</div>
            ) : detailLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-[#7c879a] dark:text-[#c0c7d6]">Loading submissions, reviews and attendee data…</div>
            ) : filteredSubmissions.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5] dark:border-white/10 dark:text-[#aeb6c8]">
                        <th className="px-6 py-3">Submission</th>
                        <th className="px-4 py-3">Author</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Reviewer</th>
                        <th className="px-6 py-3 text-right">Decision / action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((s) => {
                        const related = reviews.filter((r) => Number(r.submission_id) === Number(s.id));
                        const reviewer = related[0]?.reviewer;
                        const status = s.status || "pending";
                        return (
                          <tr key={s.id} className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe] dark:border-white/5 dark:hover:bg-white/[.03]">
                            <td className="px-6 py-4">
                              <div className="flex gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3] dark:bg-[#2a3358] dark:text-[#cfc8ff]"><FileText size={15} /></span>
                                <div className="min-w-0">
                                  <strong className="block max-w-[260px] truncate text-[11px] text-[#0d1b3d] dark:text-white">{s.title}</strong>
                                  <span className="text-[9px] text-[#929bad] dark:text-[#aeb6c8]">#{s.id} · {s.track || "General track"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[10px] font-semibold text-[#5c6880] dark:text-[#c0c7d6]">{s.author?.name || "Author"}</td>
                            <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>{STATUS_LABELS[status] || status}</span></td>
                            <td className="px-4 py-4 text-[10px] text-[#68748b] dark:text-[#c0c7d6]">{reviewer?.name || related.length ? `User #${related[0]?.reviewer_id}` : "Unassigned"}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                <button onClick={() => openAssign(s)} className="inline-flex items-center gap-1 rounded-lg bg-[#efedff] px-2.5 py-2 text-[9px] font-extrabold text-[#5548d7] dark:bg-[#2a3358] dark:text-[#cfc8ff]"><UserPlus size={12} /> {related.length ? "Reassign" : "Assign"}</button>
                                {(related.some((r) => r.submitted_at || r.locked)) && status !== "accepted" && <button onClick={() => decide(s, "accepted")} className="rounded-lg bg-emerald-50 px-2.5 py-2 text-[9px] font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Accept</button>}
                                {(related.some((r) => r.submitted_at || r.locked)) && status !== "rejected" && <button onClick={() => decide(s, "rejected")} className="rounded-lg bg-red-50 px-2.5 py-2 text-[9px] font-extrabold text-red-700 dark:bg-red-500/15 dark:text-red-300">Reject</button>}
                                {(related.some((r) => r.submitted_at || r.locked)) && status !== "revision_requested" && <button onClick={() => decide(s, "revision_requested")} className="rounded-lg bg-orange-50 px-2.5 py-2 text-[9px] font-extrabold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">Revise</button>}
                                {!related.some((r) => r.submitted_at || r.locked) && related.length > 0 && <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-2 text-[9px] font-extrabold text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">Awaiting review</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <FileText size={22} className="mx-auto text-[#aab2c0]" />
                <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">No submissions found</h3>
                <p className="m-0 text-[10px] text-[#8993a6] dark:text-[#c0c7d6]">Incoming proposals for this conference will appear here.</p>
              </div>
            )}
          </section>

          <section className="mt-6 grid gap-5 md:grid-cols-2">
            <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-white/10 dark:bg-[#121a33] sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#b7aeff]">Programme</span>
                  <h2 className="mb-0 mt-1 text-xl font-bold text-[#0d1b3d] dark:text-white">Conference snapshot</h2>
                </div>
                <BarChart3 size={19} className="text-[#6a5af2]" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Format", selectedConference?.format?.replace("_", " ") || "—"],
                  ["Sessions", sessions.length],
                  ["Active attendees", stats.attendees],
                  ["Deadline", dateLabel(selectedConference?.submission_deadline)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#fafbfe] p-3 dark:bg-[#0f1730]">
                    <span className="text-[9px] text-[#8a95a8] dark:text-[#aeb6c8]">{label}</span>
                    <strong className="mt-1 block text-xs text-[#0d1b3d] dark:text-white">{value}</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-[20px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-6 text-white shadow-[0_18px_45px_rgba(20,28,80,.15)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Gavel size={18} /></span>
              <h2 className="mb-2 mt-5 text-xl font-bold text-white">Decision workflow</h2>
              <p className="m-0 text-[10px] leading-6 text-white/60">Assign reviewers, wait for review activity, then record the final accept, reject or revision-requested decision.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-bold text-white/75">
                <span className="rounded-full bg-white/10 px-2.5 py-1.5">1 · Assign</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1.5">2 · Review</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1.5">3 · Decide</span>
              </div>
            </article>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 px-1 py-8 text-[9px] text-[#8c96a9] dark:text-[#aeb6c8]">
            <span>CMT Organiser Workspace · API connected</span>
            <span>Backend policies remain the final authority for every action.</span>
          </footer>
        </main>
      </div>

      {(modal === "conference-create" || modal === "conference-edit") && (
        <Modal title={modal === "conference-create" ? "Create conference" : "Edit conference"} onClose={() => setModal(null)} wide>
          <form onSubmit={saveConference} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Conference code<input value={conferenceForm.code} onChange={(e) => setConferenceForm((v) => ({ ...v, code: e.target.value }))} maxLength={50} placeholder="CMT2026" className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Name<input value={conferenceForm.name} onChange={(e) => setConferenceForm((v) => ({ ...v, name: e.target.value }))} className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6] sm:col-span-2">Description<textarea rows={4} value={conferenceForm.description} onChange={(e) => setConferenceForm((v) => ({ ...v, description: e.target.value }))} className="rounded-xl border border-[#dfe4ed] p-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Category<input value={conferenceForm.category} onChange={(e) => setConferenceForm((v) => ({ ...v, category: e.target.value }))} placeholder="Technology" className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Topics <span className="text-[9px] font-normal text-[#8a95a8]">comma separated</span><input value={conferenceForm.topics} onChange={(e) => setConferenceForm((v) => ({ ...v, topics: e.target.value }))} placeholder="AI, Software Engineering" className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Format<select value={conferenceForm.format} onChange={(e) => setConferenceForm((v) => ({ ...v, format: e.target.value }))} className="h-11 rounded-xl border border-[#dfe4ed] bg-white px-3 text-sm font-normal text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white"><option value="in_person">In person</option><option value="virtual">Virtual</option><option value="hybrid">Hybrid</option></select></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Submission status<select value={conferenceForm.submission_status} onChange={(e) => setConferenceForm((v) => ({ ...v, submission_status: e.target.value }))} className="h-11 rounded-xl border border-[#dfe4ed] bg-white px-3 text-sm font-normal text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white"><option value="open">Open</option><option value="closed">Closed</option></select></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Start date<input type="date" value={conferenceForm.start_date} onChange={(e) => setConferenceForm((v) => ({ ...v, start_date: e.target.value }))} className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">End date<input type="date" value={conferenceForm.end_date} onChange={(e) => setConferenceForm((v) => ({ ...v, end_date: e.target.value }))} className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Submission deadline<input type="date" value={conferenceForm.submission_deadline} onChange={(e) => setConferenceForm((v) => ({ ...v, submission_deadline: e.target.value }))} className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Venue name<input value={conferenceForm.venue_name} onChange={(e) => setConferenceForm((v) => ({ ...v, venue_name: e.target.value }))} placeholder="Required for in-person/hybrid" className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">City<input value={conferenceForm.city} onChange={(e) => setConferenceForm((v) => ({ ...v, city: e.target.value }))} className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Country<input value={conferenceForm.country} onChange={(e) => setConferenceForm((v) => ({ ...v, country: e.target.value }))} className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6] sm:col-span-2">External website <span className="text-[9px] font-normal text-[#8a95a8]">optional</span><input type="url" value={conferenceForm.website_link} onChange={(e) => setConferenceForm((v) => ({ ...v, website_link: e.target.value }))} placeholder="https://example.com" className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" /></label>
            </div>
            {formError && <p role="alert" className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-200">{formError}</p>}
            <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4 dark:border-white/10">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-[#dfe4ed] px-4 py-2.5 text-xs font-bold text-[#66728b] dark:border-white/15 dark:text-white">Cancel</button>
              <button disabled={saving} type="submit" className="rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{saving ? "Saving…" : modal === "conference-create" ? "Create conference" : "Save changes"}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "assign" && selectedSubmission && (
        <Modal title={`Assign reviewer · ${selectedSubmission.title}`} onClose={() => setModal(null)}>
          <form onSubmit={assignReviewer} className="grid gap-4">
            <div className="rounded-xl border border-[#e7eaf0] bg-[#fafbfe] p-4 text-[10px] leading-5 text-[#6d7890] dark:border-white/10 dark:bg-[#0f1730] dark:text-[#c0c7d6]">Select an available reviewer from the reviewer directory.</div>
            {reviewerCandidates.length > 0 && (
              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Known reviewer
                <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="h-11 rounded-xl border border-[#dfe4ed] bg-white px-3 text-sm font-normal text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white">
                  <option value="">Select a reviewer</option>
                  {reviewerCandidates.map((r) => <option key={r.id} value={r.id}>{r.name || r.email || `User #${r.id}`} · #{r.id}</option>)}
                </select>
              </label>
            )}
            <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#c0c7d6]">Reviewer user ID
              <input type="number" min="1" value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} placeholder="e.g. 12" className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] dark:border-white/15 dark:bg-[#1a2442] dark:text-white" />
            </label>
            {formError && <p role="alert" className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-200">{formError}</p>}
            <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4 dark:border-white/10">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-[#dfe4ed] px-4 py-2.5 text-xs font-bold text-[#66728b] dark:border-white/15 dark:text-white">Cancel</button>
              <button disabled={saving} type="submit" className="rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-xs font-extrabold text-white">{saving ? "Assigning…" : "Assign reviewer"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}