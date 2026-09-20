import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
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
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";

// ---------- Dummy Data ----------
const conferencesData = [
  {
    id: 1,
    name: "AI & Machine Learning Summit",
    location: "Cape Town",
    date: "2026-10-15",
    submissions: 12,
  },
  {
    id: 2,
    name: "Healthcare Innovations Conference",
    location: "London",
    date: "2026-11-01",
    submissions: 8,
  },
];

const submissionsData = [
  {
    id: 101,
    title: "Deep Learning for Medical Imaging",
    author: "Dr. Sarah Chen",
    conference: "AI & Machine Learning Summit",
    status: "Under review",
    reviewers: ["Dr. Smith", "Prof. Jones"],
    decision: "Pending",
  },
  {
    id: 102,
    title: "Blockchain in Healthcare",
    author: "Prof. Michael Okafor",
    conference: "Healthcare Innovations Conference",
    status: "Accepted",
    reviewers: ["Dr. Lee"],
    decision: "Accept",
  },
  {
    id: 103,
    title: "Natural Language Processing for Clinical Notes",
    author: "Dr. Emily Davis",
    conference: "AI & Machine Learning Summit",
    status: "Revision requested",
    reviewers: ["Dr. Smith", "Dr. Patel"],
    decision: "Revise",
  },
];

const usersData = [
  { id: 1, name: "Admin User", role: "admin" },
  { id: 2, name: "John Doe", role: "author" },
  { id: 3, name: "Jane Smith", role: "reviewer" },
  { id: 4, name: "Alice Johnson", role: "organiser" },
];

const statusStyles = {
  Pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  "Under review": "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  Accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  Rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  "Revision requested": "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [notice, setNotice] = useState(true);

  // All dropdowns closed by default
  const [expanded, setExpanded] = useState({
    conferences: false,
    submissions: false,
    users: false,
  });

  // Only way to toggle a dropdown – user clicks the header
  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const collapseAll = () => {
    setExpanded({
      conferences: false,
      submissions: false,
      users: false,
    });
  };

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  // Reset dropdowns whenever sidebar opens (ensures they stay closed)
  useEffect(() => {
    if (sidebarVisible) {
      setExpanded({
        conferences: false,
        submissions: false,
        users: false,
      });
    }
  }, [sidebarVisible]);

  const filteredSubmissions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return submissionsData.filter((sub) => {
      const matchesStatus = statusFilter === "All statuses" || sub.status === statusFilter;
      const matchesQuery = !normalized ||
        [sub.title, sub.author, sub.conference, sub.id.toString()]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeleteConference = (id) => {
    if (window.confirm("Are you sure you want to delete this conference?")) {
      alert(`Conference ${id} deleted. (Simulated)`);
    }
  };

  const handleDeleteSubmission = (id) => {
    if (window.confirm("Are you sure you want to delete this submission?")) {
      alert(`Submission ${id} deleted. (Simulated)`);
    }
  };

  const handleCreateConference = () => {
    navigate("/create-conference");
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-6">
          <button
            className="rounded-lg p-2 transition hover:bg-white/10"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarVisible ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button className="border-0 bg-transparent p-0" onClick={() => navigate("/")} aria-label="CMT home">
            <Logo />
          </button>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <div className="hidden sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">Admin workspace</p>
            <p className="m-0 mt-0.5 text-[12px] font-semibold text-white/65">Conference Management Tool</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10"
              onClick={() => setNotice((v) => !v)}
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
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">AD</div>
              <div className="leading-tight">
                <strong className="block text-[11px] text-white">Admin User</strong>
                <span className="block text-[9px] text-white/45">Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        {/* Sidebar (togglable on all screens) */}
        <aside
          className={`
            relative z-40 transition-all duration-300 ease-in-out
            ${sidebarVisible ? 'max-w-[260px]' : 'max-w-0'}
            overflow-hidden
            lg:sticky lg:top-[100px] lg:max-h-[calc(100vh-120px)]
          `}
          style={{ flexShrink: 0 }}
        >
          <div className="w-[260px] overflow-y-auto rounded-2xl border border-[#e4e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,28,65,.10)] lg:shadow-none">
            <style>
              {`
                .overflow-y-auto::-webkit-scrollbar {
                  width: 4px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                  background: transparent;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                  background: #c4c8d4;
                  border-radius: 999px;
                }
              `}
            </style>

            {/* Close button inside sidebar */}
            <div className="flex justify-end -mt-1 -mr-1">
              <button
                onClick={toggleSidebar}
                className="rounded-lg p-1.5 text-[#66728b] hover:bg-[#f0f2f6] transition"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Admin control card – collapses all dropdowns when clicked */}
            <div
              className="mb-3 cursor-pointer rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white transition hover:shadow-lg"
              onClick={collapseAll}
            >
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10"><LayoutDashboard size={17} /></span>
              <strong className="block text-[13px]">Admin control</strong>
              <p className="mt-1 text-[10px] leading-5 text-white/60">Click to collapse all menus</p>
            </div>

            <nav className="space-y-1" aria-label="Admin dashboard navigation">
              <button
                className="flex w-full items-center gap-3 rounded-xl bg-[#efedff] px-3 py-2.5 text-left text-[12px] font-extrabold text-[#5649dc]"
                onClick={() => scrollTo("dashboard-overview")}
              >
                <LayoutDashboard size={16} /> Overview
              </button>

              {/* Conferences – closed by default, only user click expands */}
              <div>
                <button
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                  onClick={() => toggleSection("conferences")}
                >
                  <span className="flex items-center gap-3"><CalendarDays size={16} /> Conferences</span>
                  {expanded.conferences ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expanded.conferences && (
                  <div className="ml-6 space-y-1 border-l border-[#edf0f5] pl-3">
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]" onClick={() => scrollTo("conferences-table")}>All Conferences</button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]" onClick={handleCreateConference}>Create New</button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">Reports</button>
                  </div>
                )}
              </div>

              {/* Submissions */}
              <div>
                <button
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                  onClick={() => toggleSection("submissions")}
                >
                  <span className="flex items-center gap-3"><FileText size={16} /> Submissions</span>
                  {expanded.submissions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expanded.submissions && (
                  <div className="ml-6 space-y-1 border-l border-[#edf0f5] pl-3">
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]" onClick={() => scrollTo("submissions-table")}>All Submissions</button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">Pending Review</button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">Final Decisions</button>
                  </div>
                )}
              </div>

              {/* Users */}
              <div>
                <button
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                  onClick={() => toggleSection("users")}
                >
                  <span className="flex items-center gap-3"><Users size={16} /> Users</span>
                  {expanded.users ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expanded.users && (
                  <div className="ml-6 space-y-1 border-l border-[#edf0f5] pl-3">
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]" onClick={() => scrollTo("users-section")}>All Users</button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">Reviewers</button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">Organisers</button>
                  </div>
                )}
              </div>
            </nav>

            <div className="my-4 border-t border-[#edf0f5]" />
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"><UserRound size={16} /> Profile</button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"><Settings size={16} /> Settings</button>
            <button className="mt-auto flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] hover:bg-[#fff4f5]" onClick={() => navigate("/login")}><LogOut size={16} /> Sign out</button>
          </div>
        </aside>

        {/* Backdrop on mobile */}
        {sidebarVisible && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content (unchanged – you can keep your tables, etc.) */}
        <main id="dashboard-overview" className="min-w-0 flex-1 scroll-mt-24">
          {/* ... your existing main content ... */}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#07132f] text-white/60">
        <div className="mx-auto flex min-h-[100px] w-[min(1200px,calc(100%-40px))] items-center justify-between gap-5 text-[10px] max-[560px]:block max-[560px]:py-6">
          <div>
            <LogoFallback />
            <p className="mt-1 text-[9px] text-white/45">Conference Management Tool</p>
          </div>
          <span>© {new Date().getFullYear()} CMT. Conference Management Tool.</span>
        </div>
      </footer>
    </div>
  );
}

function LogoFallback() {
  return (
    <div className="flex items-center gap-2.5 text-white">
      <img className="h-[34px] w-[34px] object-contain" src="/cmt-mark.png" alt="CMT logo" />
      <div className="flex flex-col leading-[1.05]">
        <strong className="text-xl tracking-[-.04em]">CMT</strong>
        <span className="mt-1 whitespace-nowrap text-[9px] text-white/70">Conference Management Tool</span>
      </div>
    </div>
  );
}