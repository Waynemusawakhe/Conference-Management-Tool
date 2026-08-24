import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";

const initialProposals = [
  {
    id: "CMT-001",
    title: "Responsible AI in Higher Education",
    conference: "Future of Digital Learning 2026",
    track: "Artificial Intelligence",
    submitted: "18 Aug 2026",
    status: "Under review",
    updated: "2 days ago",
  },
  {
    id: "CMT-002",
    title: "Human-Centred Cybersecurity Practices",
    conference: "African Computing Research Forum",
    track: "Cybersecurity",
    submitted: "09 Aug 2026",
    status: "Revision requested",
    updated: "5 days ago",
  },
  {
    id: "CMT-003",
    title: "Open Data for Smarter Cities",
    conference: "Smart Cities & Society Summit",
    track: "Data Science",
    submitted: "27 Jul 2026",
    status: "Accepted",
    updated: "1 week ago",
  },
  {
    id: "CMT-004",
    title: "Accessible Interfaces for Research Platforms",
    conference: "Inclusive Technology Conference",
    track: "Human-Computer Interaction",
    submitted: "16 Jul 2026",
    status: "Pending",
    updated: "2 weeks ago",
  },
];

const statusStyles = {
  Pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  "Under review": "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  Accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  Rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  "Revision requested": "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

const deadlines = [
  { date: "Sep 02", title: "Future of Digital Learning 2026", meta: "Proposal deadline" },
  { date: "Sep 14", title: "African Computing Research Forum", meta: "Revision deadline" },
  { date: "Oct 01", title: "Smart Cities & Society Summit", meta: "Camera-ready deadline" },
];

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [notice, setNotice] = useState(true);

  const filteredProposals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return initialProposals.filter((proposal) => {
      const matchesStatus = statusFilter === "All statuses" || proposal.status === statusFilter;
      const matchesQuery = !normalized || [proposal.title, proposal.conference, proposal.track, proposal.id]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const scrollTo = (id) => {
    setSidebarOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle dashboard navigation">
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button className="border-0 bg-transparent p-0" onClick={() => navigate("/")} aria-label="CMT home">
            <Logo />
          </button>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <div className="hidden sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">Author workspace</p>
            <p className="m-0 mt-0.5 text-[12px] font-semibold text-white/65">Conference Management Tool</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10"
              onClick={() => setNotice((value) => !value)}
              aria-label="Toggle notifications"
              title="Notifications"
            >
              <Bell size={17} />
              {notice && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7d6bff]" />}
            </button>
            <button
              className="hidden h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 sm:grid"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Sparkles size={16} />
            </button>
            <div className="ml-1 hidden items-center gap-2.5 border-l border-white/10 pl-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">AM</div>
              <div className="leading-tight">
                <strong className="block text-[11px] text-white">Alex Morgan</strong>
                <span className="block text-[9px] text-white/45">Author</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        <aside className={`${sidebarOpen ? "fixed inset-x-4 top-[88px] z-40 block" : "hidden"} w-[235px] shrink-0 rounded-2xl border border-[#e4e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,28,65,.10)] lg:sticky lg:top-[100px] lg:block lg:h-[calc(100vh-124px)] lg:shadow-none`}>
          <div className="mb-3 rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10"><BookOpen size={17} /></span>
            <strong className="block text-[13px]">Your research hub</strong>
            <p className="mt-1 text-[10px] leading-5 text-white/60">Track proposals and stay on top of important deadlines.</p>
          </div>

          <nav className="space-y-1" aria-label="Author dashboard navigation">
            <button className="flex w-full items-center gap-3 rounded-xl bg-[#efedff] px-3 py-2.5 text-left text-[12px] font-extrabold text-[#5649dc]" onClick={() => scrollTo("dashboard-overview")}><LayoutDashboard size={16} /> Overview</button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]" onClick={() => scrollTo("my-proposals")}><FileText size={16} /> My proposals</button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]" onClick={() => scrollTo("deadlines")}><CalendarDays size={16} /> Deadlines</button>
          </nav>

          <div className="my-4 border-t border-[#edf0f5]" />
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"><UserRound size={16} /> Profile</button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"><Settings size={16} /> Settings</button>
          <button className="mt-auto flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] hover:bg-[#fff4f5]" onClick={() => navigate("/login")}><LogOut size={16} /> Sign out</button>
        </aside>

        <main id="dashboard-overview" className="min-w-0 flex-1 scroll-mt-24">
          <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
            <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
            <div className="relative flex items-end justify-between gap-6 max-[700px]:block">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]"><Sparkles size={14} /> Author dashboard</span>
                <h1 className="mb-2 mt-3 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-.045em]">Good evening, Alex.</h1>
                <p className="m-0 max-w-[600px] text-[12px] leading-6 text-white/65">Keep your research moving. Review your proposal updates, upcoming deadlines and submission activity from one place.</p>
              </div>
              <button className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px" onClick={() => navigate("/conferences")}>
                <Plus size={16} /> Submit a proposal
              </button>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[520px]:grid-cols-1">
            {[
              { icon: <FileText size={19} />, value: "4", label: "Total proposals", note: "Across conferences" },
              { icon: <Clock3 size={19} />, value: "2", label: "In review", note: "Awaiting decisions" },
              { icon: <FileCheck2 size={19} />, value: "1", label: "Accepted", note: "Ready for next step" },
              { icon: <Upload size={19} />, value: "1", label: "Needs revision", note: "Action required" },
            ].map((stat) => (
              <article key={stat.label} className="rounded-[17px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)]">
                <div className="flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec]">{stat.icon}</span>
                  <span className="text-[9px] font-bold text-[#aeb6c6]">2026</span>
                </div>
                <strong className="mt-4 block text-[25px] leading-none tracking-[-.04em]">{stat.value}</strong>
                <p className="mb-0 mt-1.5 text-[11px] font-bold text-[#35415f]">{stat.label}</p>
                <span className="text-[9px] text-[#8b95a8]">{stat.note}</span>
              </article>
            ))}
          </section>

          <section id="my-proposals" className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6 max-[700px]:block">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">Research activity</span>
                <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">My proposals</h2>
              </div>
              <div className="mt-3 flex gap-2 sm:mt-0">
                <div className="relative flex-1 sm:w-[220px] sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search proposals..." className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10" />
                </div>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={14} />
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] font-semibold text-[#59657d] outline-none">
                    <option>All statuses</option>
                    <option>Pending</option>
                    <option>Under review</option>
                    <option>Accepted</option>
                    <option>Rejected</option>
                    <option>Revision requested</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead><tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]"><th className="px-6 py-3">Proposal</th><th className="px-4 py-3">Conference</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Status</th><th className="px-6 py-3 text-right">Activity</th></tr></thead>
                <tbody>
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe]">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]"><FileText size={16} /></span><div><strong className="block max-w-[270px] truncate text-[11px] text-[#1c2a4a]">{proposal.title}</strong><span className="text-[9px] text-[#929bad]">{proposal.id} · {proposal.track}</span></div></div></td>
                      <td className="px-4 py-4 text-[10px] font-semibold text-[#5c6880]">{proposal.conference}</td>
                      <td className="px-4 py-4 text-[10px] text-[#7b869b]">{proposal.submitted}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${statusStyles[proposal.status]}`}>{proposal.status}</span></td>
                      <td className="px-6 py-4 text-right text-[9px] text-[#8993a6]">{proposal.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#edf0f5] md:hidden">
              {filteredProposals.map((proposal) => (
                <article key={proposal.id} className="p-4">
                  <div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]"><FileText size={16} /></span><div className="min-w-0"><strong className="block text-[11px]">{proposal.title}</strong><p className="mb-2 mt-1 text-[9px] text-[#8c96a9]">{proposal.conference}</p><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${statusStyles[proposal.status]}`}>{proposal.status}</span></div></div>
                  <div className="mt-3 flex justify-between text-[9px] text-[#8c96a9]"><span>Submitted {proposal.submitted}</span><span>{proposal.updated}</span></div>
                </article>
              ))}
            </div>

            {!filteredProposals.length && <div className="p-10 text-center"><Search size={20} className="mx-auto text-[#aeb6c6]" /><h3 className="mb-1 mt-3 text-[13px] font-bold">No proposals found</h3><p className="m-0 text-[10px] text-[#8993a6]">Try another search or status filter.</p></div>}
          </section>

          <section id="deadlines" className="mt-6 grid scroll-mt-24 grid-cols-[1.25fr_.75fr] gap-5 max-[900px]:grid-cols-1">
            <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] sm:p-6">
              <div className="mb-5 flex items-start justify-between"><div><span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">Stay ahead</span><h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">Upcoming deadlines</h2></div><CalendarDays size={19} className="text-[#6a5af2]" /></div>
              <div className="space-y-3">
                {deadlines.map((deadline) => (
                  <div key={deadline.title} className="flex items-center gap-3 rounded-[13px] border border-[#edf0f5] bg-[#fafbfe] p-3">
                    <div className="grid h-11 w-12 shrink-0 place-items-center rounded-[10px] bg-[#efedff] text-center"><strong className="block text-[12px] font-extrabold text-[#5649dc]">{deadline.date}</strong></div>
                    <div className="min-w-0 flex-1"><strong className="block truncate text-[11px]">{deadline.title}</strong><span className="text-[9px] text-[#8a95a8]">{deadline.meta}</span></div>
                    <ChevronRight size={15} className="text-[#a7afbd]" />
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[20px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-6 text-white shadow-[0_18px_45px_rgba(20,28,80,.15)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><BookOpen size={18} /></span>
              <h2 className="mb-2 mt-5 text-[20px] font-bold tracking-[-.03em]">Ready for your next submission?</h2>
              <p className="m-0 text-[10px] leading-6 text-white/60">Browse available conferences and choose the opportunity that fits your research.</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[.08] px-3.5 py-2.5 text-[10px] font-extrabold text-white hover:bg-white/[.14]" onClick={() => navigate("/conferences")}>Browse conferences <ChevronRight size={14} /></button>
            </article>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 px-1 py-8 text-[9px] text-[#8c96a9]">
            <span>CMT Author Workspace · Frontend prototype</span>
            <span>Proposal data is ready to be replaced with backend API responses.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
