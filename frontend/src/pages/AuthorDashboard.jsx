import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, BookOpen, CalendarDays, ChevronRight, Clock3, FileCheck2, FileText,
  Filter, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Sparkles,
  Trash2, Upload, UserRound, X, Eye, Pencil, RotateCcw, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
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

function getErrorMessage(error) {
  const first = Object.values(error?.errors || {})[0];
  return Array.isArray(first) ? first[0] : first || error?.message || "Something went wrong.";
}

function dateLabel(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function unwrapList(response) {
  return Array.isArray(response) ? response : response?.data || [];
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-[22px] bg-white p-5 text-[#0d1b3d] shadow-[0_30px_90px_rgba(7,19,47,.3)] sm:p-7 ${wide ? "max-w-[760px]" : "max-w-[560px]"}`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">Author workspace</span><h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em]">{title}</h2></div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] hover:bg-[#e9ecf3]" aria-label="Close"><X size={17} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [proposals, setProposals] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState(null);

  const emptyForm = { conference_id: "", title: "", track: "", abstract: "", file: null };
  const [form, setForm] = useState(emptyForm);

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

  useEffect(() => { loadData(); }, [loadData]);

  const filteredProposals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proposals.filter((p) => {
      const status = p.status || "pending";
      const conferenceName = p.conference?.name || p.conference?.title || "";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesQuery = !q || [p.title, p.track, p.id, conferenceName].filter(Boolean).join(" ").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [proposals, query, statusFilter]);

  const stats = useMemo(() => ({
    total: proposals.length,
    review: proposals.filter((p) => p.status === "under_review").length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    revision: proposals.filter((p) => p.status === "revision_requested").length,
  }), [proposals]);

  const deadlines = useMemo(() => conferences
    .filter((c) => c.submission_deadline)
    .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))
    .slice(0, 4), [conferences]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setModal("create");
  };

  const openEdit = (proposal) => {
    setSelected(proposal);
    setForm({ conference_id: proposal.conference_id || proposal.conference?.id || "", title: proposal.title || "", track: proposal.track || "", abstract: proposal.abstract || "", file: null });
    setFormError("");
    setModal("edit");
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.conference_id || !form.title.trim() || !form.abstract.trim()) {
      setFormError("Conference, title and abstract are required.");
      return;
    }
    if (form.file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const extension = form.file.name.toLowerCase().split(".").pop();
      if (!allowedTypes.includes(form.file.type) && !["pdf", "doc", "docx"].includes(extension)) {
        setFormError("Only PDF, DOC or DOCX files are allowed.");
        return;
      }
    }
    if (form.file && form.file.size > 10 * 1024 * 1024) {
      setFormError("The PDF must be 10MB or smaller.");
      return;
    }

    const body = new FormData();
    if (modal === "create") body.append("conference_id", String(form.conference_id));
    body.append("title", form.title.trim());
    body.append("track", form.track.trim());
    body.append("abstract", form.abstract.trim());
    if (form.file) body.append("file", form.file);

    setSaving(true);
    try {
      if (modal === "create") {
        await submissionsApi.create(body);
      } else {
        await submissionsApi.update(selected.id, body);
      }
      setModal(null);
      await loadData();
    } catch (err) {
      if (err?.status === 401) { await logout(); return; }
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeProposal = async (proposal) => {
    if (!window.confirm(`Delete "${proposal.title}"? This action cannot be undone.`)) return;
    setError("");
    try {
      await submissionsApi.remove(proposal.id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const withdrawProposal = async (proposal) => {
    if (!window.confirm(`Withdraw "${proposal.title}"?`)) return;
    setError("");
    try {
      await submissionsApi.withdraw(proposal.id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const scrollTo = (id) => {
    setSidebarOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const displayName = user?.name || "Author";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-5">
          <button className="lg:hidden" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle dashboard navigation">{sidebarOpen ? <X size={22} /> : <Menu size={22} />}</button>
          <button className="border-0 bg-transparent p-0" onClick={() => navigate("/")} aria-label="CMT home"><Logo /></button>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <div className="hidden sm:block"><p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">Author workspace</p><p className="m-0 text-[12px] font-semibold text-white/65">Conference Management Tool</p></div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10" onClick={() => setNotice((v) => !v)} aria-label="Notifications"><Bell size={17} />{notice && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7d6bff]" />}</button>
            <button className="hidden h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 sm:grid" onClick={toggleTheme} aria-label="Toggle theme"><Sparkles size={16} /></button>
            <div className="ml-1 hidden items-center gap-2.5 border-l border-white/10 pl-3 sm:flex"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">{initials}</div><div className="leading-tight"><strong className="block text-[11px] text-white">{displayName}</strong><span className="block text-[9px] text-white/45">Author</span></div></div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        <aside className={`${sidebarOpen ? "fixed inset-x-4 top-[88px] z-40 block" : "hidden"} w-[235px] shrink-0 rounded-2xl border border-[#e4e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,28,65,.10)] lg:sticky lg:top-[100px] lg:block lg:h-[calc(100vh-124px)] lg:shadow-none`}>
          <div className="mb-3 rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white"><span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10"><BookOpen size={17} /></span><strong className="block text-[13px]">Your research hub</strong><p className="mt-1 text-[10px] leading-5 text-white/60">Manage submissions and stay on top of conference deadlines.</p></div>
          <nav className="space-y-1" aria-label="Author dashboard navigation">
            <button className="flex w-full items-center gap-3 rounded-xl bg-[#efedff] px-3 py-2.5 text-left text-[12px] font-extrabold text-[#5649dc]" onClick={() => scrollTo("dashboard-overview")}><LayoutDashboard size={16} /> Overview</button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa]" onClick={() => scrollTo("my-proposals")}><FileText size={16} /> My proposals</button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa]" onClick={() => scrollTo("deadlines")}><CalendarDays size={16} /> Deadlines</button>
          </nav>
          <div className="my-4 border-t border-[#edf0f5]" />
          <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa]"><UserRound size={16} /> Profile</button>
          <button onClick={() => navigate("/settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa]"><Settings size={16} /> Settings</button>
          <button onClick={async () => { await logout(); navigate("/login", { replace: true }); }} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] hover:bg-[#fff4f5]"><LogOut size={16} /> Sign out</button>
        </aside>

        <main id="dashboard-overview" className="min-w-0 flex-1 scroll-mt-24">
          <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
            <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
            <div className="relative flex items-end justify-between gap-6 max-[700px]:block">
              <div><span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]"><Sparkles size={14} /> Author dashboard</span><h1 className="mb-2 mt-3 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-.045em]">Welcome, {displayName.split(" ")[0]}.</h1><p className="m-0 max-w-[600px] text-[12px] leading-6 text-white/65">Track proposal progress, update eligible submissions and keep every deadline visible from one workspace.</p></div>
              <button onClick={openCreate} className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"><Plus size={16} /> Submit a proposal</button>
            </div>
          </section>

          {error && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" /><div className="flex-1">{error}</div><button onClick={loadData} className="font-extrabold underline">Retry</button></div>}

          <section className="mt-5 grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[520px]:grid-cols-1">
            {[
              { icon: <FileText size={19} />, value: stats.total, label: "Total proposals", note: "Your submissions" },
              { icon: <Clock3 size={19} />, value: stats.review, label: "In review", note: "Awaiting decisions" },
              { icon: <FileCheck2 size={19} />, value: stats.accepted, label: "Accepted", note: "Positive decisions" },
              { icon: <Upload size={19} />, value: stats.revision, label: "Needs revision", note: "Action required" },
            ].map((stat) => <article key={stat.label} className="rounded-[17px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)]"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec]">{stat.icon}</span><strong className="mt-4 block text-[25px] leading-none tracking-[-.04em]">{stat.value}</strong><p className="mb-0 mt-1.5 text-[11px] font-bold text-[#35415f]">{stat.label}</p><span className="text-[9px] text-[#8b95a8]">{stat.note}</span></article>)}
          </section>

          <section id="my-proposals" className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6 max-[720px]:block">
              <div><span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">Research activity</span><h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">My proposals</h2></div>
              <div className="mt-3 flex gap-2 sm:mt-0 max-[480px]:grid max-[480px]:grid-cols-[1fr_auto]">
                <div className="relative min-w-0 sm:w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search proposals..." className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none focus:border-[#8175ef]" /></div>
                <div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={14} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 max-w-[165px] rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] font-semibold text-[#59657d] outline-none"><option value="all">All statuses</option>{Object.entries(STATUS_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              </div>
            </div>

            {loading ? <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">Loading your proposals…</div> : filteredProposals.length ? <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left"><thead><tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]"><th className="px-6 py-3">Proposal</th><th className="px-4 py-3">Conference</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                  <tbody>{filteredProposals.map((proposal) => { const conferenceName = proposal.conference?.name || proposal.conference?.title || conferences.find((c) => c.id === proposal.conference_id)?.name || "Conference"; const status = proposal.status || "pending"; const editable = status === "pending"; return <tr key={proposal.id} className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe]">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]"><FileText size={16} /></span><div><strong className="block max-w-[290px] truncate text-[11px] text-[#1c2a4a]">{proposal.title}</strong><span className="text-[9px] text-[#929bad]">#{proposal.id} · {proposal.track || "General track"}</span></div></div></td>
                    <td className="px-4 py-4 text-[10px] font-semibold text-[#5c6880]">{conferenceName}</td><td className="px-4 py-4 text-[10px] text-[#7b869b]">{dateLabel(proposal.created_at)}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>{STATUS_LABELS[status] || status}</span></td>
                    <td className="px-6 py-4"><div className="flex justify-end gap-1.5"><button title="View" onClick={() => { setSelected(proposal); setModal("view"); }} className="grid h-8 w-8 place-items-center rounded-lg bg-[#f4f6fa] text-[#647089] hover:bg-[#eceffa] hover:text-[#5548d7]"><Eye size={14}/></button>{editable && <button title="Edit" onClick={() => openEdit(proposal)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#f4f6fa] text-[#647089] hover:bg-[#eceffa] hover:text-[#5548d7]"><Pencil size={14}/></button>}{editable && <button title="Delete" onClick={() => removeProposal(proposal)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff3f4] text-[#b13a3a] hover:bg-[#ffe6e8]"><Trash2 size={14}/></button>}{["under_review","revision_requested"].includes(status) && <button title="Withdraw" onClick={() => withdrawProposal(proposal)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff7ec] text-[#a55b25] hover:bg-[#ffeed8]"><RotateCcw size={14}/></button>}</div></td>
                  </tr>})}</tbody>
                </table>
              </div>
              <div className="divide-y divide-[#edf0f5] md:hidden">{filteredProposals.map((proposal) => { const status=proposal.status||"pending"; const conferenceName=proposal.conference?.name || proposal.conference?.title || conferences.find((c)=>c.id===proposal.conference_id)?.name || "Conference"; const editable=status==="pending"; return <article key={proposal.id} className="p-4"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]"><FileText size={16}/></span><div className="min-w-0 flex-1"><strong className="block text-[11px]">{proposal.title}</strong><p className="mb-2 mt-1 text-[9px] text-[#8c96a9]">{conferenceName}</p><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>{STATUS_LABELS[status] || status}</span></div></div><div className="mt-3 flex flex-wrap justify-between gap-2 text-[9px] text-[#8c96a9]"><span>Submitted {dateLabel(proposal.created_at)}</span><div className="flex gap-1.5"><button onClick={()=>{setSelected(proposal);setModal("view")}} className="rounded-lg bg-[#f4f6fa] px-2.5 py-1.5 font-bold">View</button>{editable&&<button onClick={()=>openEdit(proposal)} className="rounded-lg bg-[#efedff] px-2.5 py-1.5 font-bold text-[#5548d7]">Edit</button>}{editable&&<button onClick={()=>removeProposal(proposal)} className="rounded-lg bg-[#fff2f2] px-2.5 py-1.5 font-bold text-[#b13a3a]">Delete</button>}</div></div></article>})}</div>
            </> : <div className="p-12 text-center"><Search size={20} className="mx-auto text-[#aeb6c6]" /><h3 className="mb-1 mt-3 text-[13px] font-bold">No proposals found</h3><p className="m-0 text-[10px] text-[#8993a6]">Try another search/status filter or submit a new proposal.</p></div>}
          </section>

          <section id="deadlines" className="mt-6 grid scroll-mt-24 grid-cols-[1.25fr_.75fr] gap-5 max-[900px]:grid-cols-1">
            <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] sm:p-6"><div className="mb-5 flex items-start justify-between"><div><span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">Stay ahead</span><h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">Upcoming deadlines</h2></div><CalendarDays size={19} className="text-[#6a5af2]" /></div><div className="space-y-3">{deadlines.length ? deadlines.map((c)=><div key={c.id} className="flex items-center gap-3 rounded-[13px] border border-[#edf0f5] bg-[#fafbfe] p-3"><div className="grid h-11 w-12 shrink-0 place-items-center rounded-[10px] bg-[#efedff] text-center"><strong className="block text-[10px] font-extrabold text-[#5649dc]">{new Date(c.submission_deadline).toLocaleDateString(undefined,{month:"short",day:"2-digit"})}</strong></div><div className="min-w-0 flex-1"><strong className="block truncate text-[11px]">{c.name}</strong><span className="text-[9px] text-[#8a95a8]">Submission deadline</span></div><ChevronRight size={15} className="text-[#a7afbd]" /></div>) : <p className="m-0 text-xs text-[#8a95a8]">No conference deadlines are available yet.</p>}</div></article>
            <article className="rounded-[20px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-6 text-white shadow-[0_18px_45px_rgba(20,28,80,.15)]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><BookOpen size={18} /></span><h2 className="mb-2 mt-5 text-[20px] font-bold tracking-[-.03em]">Ready for your next submission?</h2><p className="m-0 text-[10px] leading-6 text-white/60">Browse open conferences and submit directly into the CMT workflow.</p><button onClick={()=>navigate("/conferences")} className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[.08] px-3.5 py-2.5 text-[10px] font-extrabold text-white hover:bg-white/[.14]">Browse conferences <ChevronRight size={14}/></button></article>
          </section>
          <footer className="flex flex-wrap items-center justify-between gap-3 px-1 py-8 text-[9px] text-[#8c96a9]"><span>CMT Author Workspace · API connected</span><span>Submission permissions are enforced by the backend.</span></footer>
        </main>
      </div>

      {modal === "create" || modal === "edit" ? <Modal title={modal === "create" ? "Submit a proposal" : "Edit proposal"} onClose={()=>setModal(null)} wide>
        <form onSubmit={submitForm} className="grid gap-4">
          {modal === "create" && <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">Conference<select value={form.conference_id} onChange={(e)=>setForm((v)=>({...v,conference_id:e.target.value}))} className="h-11 rounded-xl border border-[#dfe4ed] bg-white px-3 text-sm font-normal outline-none focus:border-[#7568f7]"><option value="">Select a conference</option>{conferences.filter((c)=>c.submission_status !== "closed").map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] sm:col-span-2">Title<input value={form.title} onChange={(e)=>setForm((v)=>({...v,title:e.target.value}))} maxLength={255} className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none focus:border-[#7568f7]" placeholder="Research proposal title" /></label><label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">Track<input value={form.track} onChange={(e)=>setForm((v)=>({...v,track:e.target.value}))} maxLength={255} className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none focus:border-[#7568f7]" placeholder="e.g. Artificial Intelligence" /></label><label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">Proposal file<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e)=>setForm((v)=>({...v,file:e.target.files?.[0] || null}))} className="block h-11 w-full rounded-xl border border-[#dfe4ed] bg-white px-2 py-2 text-[11px]" /><span className="font-normal text-[9px] text-[#8a95a8]">Optional · PDF, DOC or DOCX · maximum 10MB</span></label></div>
          <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">Abstract<textarea value={form.abstract} onChange={(e)=>setForm((v)=>({...v,abstract:e.target.value}))} maxLength={5000} rows={8} className="resize-y rounded-xl border border-[#dfe4ed] p-3 text-sm font-normal leading-6 outline-none focus:border-[#7568f7]" placeholder="Write the research abstract…" /><span className="text-right text-[9px] font-normal text-[#8a95a8]">{form.abstract.length}/5000</span></label>
          {formError && <p role="alert" className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{formError}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#edf0f5] pt-4"><button type="button" onClick={()=>setModal(null)} className="rounded-xl border border-[#dfe4ed] px-4 py-2.5 text-xs font-bold text-[#66728b]">Cancel</button><button disabled={saving} type="submit" className="rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{saving ? "Saving…" : modal === "create" ? "Submit proposal" : "Save changes"}</button></div>
        </form>
      </Modal> : null}

      {modal === "view" && selected ? <Modal title={selected.title} onClose={()=>setModal(null)}>
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#fafbfe] p-3"><span className="text-[9px] font-bold uppercase tracking-wide text-[#9aa3b3]">Status</span><p className="mb-0 mt-1"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${STATUS_STYLES[selected.status] || STATUS_STYLES.pending}`}>{STATUS_LABELS[selected.status] || selected.status || "Pending"}</span></p></div><div className="rounded-xl bg-[#fafbfe] p-3"><span className="text-[9px] font-bold uppercase tracking-wide text-[#9aa3b3]">Submitted</span><p className="mb-0 mt-1 text-xs font-bold">{dateLabel(selected.created_at)}</p></div></div>
          <div><span className="text-[9px] font-extrabold uppercase tracking-wide text-[#9aa3b3]">Conference</span><p className="mb-0 mt-1 text-sm font-bold">{selected.conference?.name || conferences.find((c)=>c.id===selected.conference_id)?.name || "Conference"}</p></div>
          <div><span className="text-[9px] font-extrabold uppercase tracking-wide text-[#9aa3b3]">Track</span><p className="mb-0 mt-1 text-sm">{selected.track || "General track"}</p></div>
          <div><span className="text-[9px] font-extrabold uppercase tracking-wide text-[#9aa3b3]">Abstract</span><p className="mb-0 mt-2 whitespace-pre-wrap text-sm leading-7 text-[#536079]">{selected.abstract || "The API did not return an abstract for this submission."}</p></div>
          {selected.file_path && <div className="rounded-xl border border-[#e5e8ef] p-3 text-xs text-[#66728b]">A submission file is attached to this record. Downloading private files is not exposed by the supplied API contract.</div>}
          {selected.status === "pending" && <div className="flex justify-end border-t border-[#edf0f5] pt-4"><button onClick={()=>openEdit(selected)} className="inline-flex items-center gap-2 rounded-xl bg-[#efedff] px-4 py-2.5 text-xs font-extrabold text-[#5548d7]"><Pencil size={14}/> Edit proposal</button></div>}
        </div>
      </Modal> : null}
    </div>
  );
}