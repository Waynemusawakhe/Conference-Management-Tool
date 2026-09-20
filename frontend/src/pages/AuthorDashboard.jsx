<<<<<<< HEAD
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
=======
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  TicketCheck,
  UserRound,
  X,
  AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";
import { registrationsApi } from "../api/registrationsApi";

const REGISTRATION_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  registered: "Registered",
  approved: "Approved",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  rejected: "Rejected",
  completed: "Completed",
};

const REGISTRATION_STATUS_STYLES = {
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  confirmed: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  registered: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  approved: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  cancelled: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]",
  canceled: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]",
  rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  completed: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
};

function getErrorMessage(error) {
  const first = Object.values(error?.errors || {})[0];

  return (
    (Array.isArray(first) ? first[0] : first) ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function unwrapList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function normalizeStatus(value) {
  return String(value ?? "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function formatDate(value, fallback = "Date not set") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function conferenceName(conference) {
  return conference?.name ?? conference?.title ?? "Conference";
}

function conferenceStartDate(conference) {
  return (
    conference?.start_date ??
    conference?.starts_at ??
    conference?.date ??
    null
  );
}

function conferenceEndDate(conference) {
  return conference?.end_date ?? conference?.ends_at ?? null;
}

function registrationConference(registration, conferences) {
  if (registration?.conference) {
    return registration.conference;
  }

  const conferenceId =
    registration?.conference_id ??
    registration?.conferenceId ??
    null;

  return conferences.find(
    (conference) => String(conference.id) === String(conferenceId)
  );
}

function isFutureConference(conference) {
  const value = conferenceStartDate(conference);

  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() >= new Date().setHours(0, 0, 0, 0);
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition-colors ${
        active
          ? "bg-[#efedff] font-extrabold text-[#5649dc]"
          : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function AttendeeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const { toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState(true);
  const [query, setQuery] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyRegistrationId, setBusyRegistrationId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [registrationResponse, conferenceResponse] = await Promise.all([
        registrationsApi.getAll({ per_page: 100 }),
        conferencesApi.getAll({ per_page: 100 }),
      ]);

      setRegistrations(unwrapList(registrationResponse));
      setConferences(unwrapList(conferenceResponse));
    } catch (err) {
      if (err?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (location.pathname === "/my-conferences") {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const displayName = user?.name || "Attendee";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "AT";

  const registrationRows = useMemo(() => {
    return registrations.map((registration) => {
      const conference = registrationConference(registration, conferences);

      return {
        ...registration,
        resolvedConference: conference,
        normalizedStatus: normalizeStatus(registration.status),
      };
    });
  }, [registrations, conferences]);

  const filteredRegistrations = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return registrationRows;
    }

    return registrationRows.filter((registration) => {
      const conference = registration.resolvedConference;

      return [
        registration.id,
        registration.reference,
        registration.registration_code,
        conferenceName(conference),
        registration.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [registrationRows, query]);

  const upcomingRegistrations = useMemo(() => {
    return registrationRows
      .filter((registration) => {
        const status = registration.normalizedStatus;

        if (["cancelled", "canceled", "rejected"].includes(status)) {
          return false;
        }

        return isFutureConference(registration.resolvedConference);
      })
      .sort((a, b) => {
        const aDate = new Date(
          conferenceStartDate(a.resolvedConference) || 0
        ).getTime();

        const bDate = new Date(
          conferenceStartDate(b.resolvedConference) || 0
        ).getTime();

        return aDate - bDate;
      })
      .slice(0, 4);
  }, [registrationRows]);

  const confirmedCount = registrationRows.filter((registration) =>
    ["confirmed", "registered", "approved"].includes(
      registration.normalizedStatus
    )
  ).length;

  const stats = [
    {
      icon: <TicketCheck size={19} />,
      value: registrationRows.length,
      label: "My registrations",
      note: "Conference registrations",
    },
    {
      icon: <CircleCheckBig size={19} />,
      value: confirmedCount,
      label: "Confirmed",
      note: "Ready to attend",
    },
    {
      icon: <CalendarCheck2 size={19} />,
      value: upcomingRegistrations.length,
      label: "Upcoming",
      note: "Future conferences",
    },
    {
      icon: <Compass size={19} />,
      value: conferences.length,
      label: "Available conferences",
      note: "Browse opportunities",
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleCancelRegistration = async (registration) => {
    const conference = registration.resolvedConference;

    const confirmed = window.confirm(
      `Cancel your registration for "${conferenceName(conference)}"?`
    );

    if (!confirmed) return;

    setBusyRegistrationId(registration.id);
    setFeedback("");
    setError("");

    try {
      await registrationsApi.remove(registration.id);

      setFeedback("Registration cancelled successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyRegistrationId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-5">
          <button
            type="button"
            className="text-white/80 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Toggle attendee navigation"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <button
            type="button"
            className="border-0 bg-transparent p-0"
            onClick={() => navigate("/")}
            aria-label="CMT home"
          >
            <Logo />
          </button>

          <div className="hidden h-7 w-px bg-white/10 sm:block" />

          <div className="hidden sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">
              Attendee workspace
            </p>
            <p className="m-0 mt-0.5 text-[12px] font-semibold text-white/65">
              Conference Management Tool
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10"
              onClick={() => setNotice((value) => !value)}
              aria-label="Notifications"
            >
              <Bell size={17} />
              {notice && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7d6bff]" />
              )}
            </button>

            <button
              type="button"
              className="hidden h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10 sm:grid"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <Sparkles size={16} />
            </button>

            <div className="ml-1 hidden items-center gap-2.5 border-l border-white/10 pl-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">
                {initials}
              </div>

              <div className="leading-tight">
                <strong className="block text-[11px] text-white">
                  {displayName}
                </strong>
                <span className="block text-[9px] text-white/45">
                  Attendee
                </span>
>>>>>>> origin/main
              </div>
            </div>
          </div>
        </div>
      </header>

<<<<<<< HEAD
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
=======
      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-[#07132f]/45 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close attendee navigation"
          />
        )}

        <aside
          className={`${
            sidebarOpen
              ? "fixed left-4 top-[88px] z-40 block"
              : "hidden"
          } w-[250px] shrink-0 rounded-2xl border border-[#e4e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,28,65,.12)] lg:sticky lg:top-[100px] lg:block lg:h-[calc(100vh-124px)] lg:shadow-none`}
        >
          <div className="mb-3 rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10">
              <TicketCheck size={17} />
            </span>

            <strong className="block text-[13px]">
              My Conferences
            </strong>

            <p className="mt-1 text-[10px] leading-5 text-white/60">
              See what you are attending and manage your conference registrations.
            </p>
          </div>

          <nav className="space-y-1" aria-label="Attendee dashboard navigation">
            <NavItem
              icon={<LayoutDashboard size={16} />}
              label="My Conferences"
              active={location.pathname === "/my-conferences"}
              onClick={() => {
                setSidebarOpen(false);
                navigate("/my-conferences");
              }}
            />

            <NavItem
              icon={<TicketCheck size={16} />}
              label="Attending"
              active={location.pathname === "/my-conferences"}
              onClick={() => {
                setSidebarOpen(false);
                navigate("/my-conferences");
                window.setTimeout(() => {
                  document
                    .getElementById("my-registrations")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 100);
              }}
            />

            <NavItem
              icon={<Compass size={16} />}
              label="Browse conferences"
              active={false}
              onClick={() => {
                setSidebarOpen(false);
                navigate("/conferences");
              }}
            />
          </nav>

          <div className="my-4 border-t border-[#edf0f5]" />

          <NavItem
            icon={<UserRound size={16} />}
            label="Profile"
            active={false}
            onClick={() => navigate("/profile")}
          />

          <NavItem
            icon={<Settings size={16} />}
            label="Settings"
            active={false}
            onClick={() => navigate("/settings")}
          />

          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] hover:bg-[#fff4f5]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </aside>

        <main
          id="attendee-overview"
          className="min-w-0 flex-1 scroll-mt-24"
        >
          <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
            <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
                  <Sparkles size={14} />
                  My Conferences
                </span>

                <h1 className="mb-2 mt-3 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-.045em]">
                  Welcome, {displayName.split(" ")[0]}.
                </h1>

                <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
                  View the conferences you are attending, manage your registrations,
                  and discover your next event from one workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/conferences")}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px sm:w-auto"
              >
                <Compass size={16} />
                Browse conferences
              </button>
            </div>
          </section>

          {feedback && (
            <div
              role="status"
              className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-xs font-semibold text-[#18794e]"
            >
              <span>{feedback}</span>
              <button
                type="button"
                onClick={() => setFeedback("")}
                aria-label="Dismiss message"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />

              <div className="flex-1">
                {error}
              </div>

              <button
                type="button"
                onClick={loadData}
                className="font-extrabold underline"
              >
                Retry
              </button>
            </div>
          )}

          <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[17px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec]">
                  {stat.icon}
                </span>

                <strong className="mt-4 block text-[25px] leading-none tracking-[-.04em]">
                  {loading ? "—" : stat.value}
                </strong>

                <p className="mb-0 mt-1.5 text-[11px] font-bold text-[#35415f]">
                  {stat.label}
                </p>

                <span className="text-[9px] text-[#8b95a8]">
                  {stat.note}
                </span>
              </article>
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
            <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
                    Coming up
                  </span>

                  <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
                    Upcoming conferences
                  </h2>
                </div>

                <CalendarDays
                  size={19}
                  className="text-[#6a5af2]"
                />
              </div>

              {loading ? (
                <p className="m-0 text-xs text-[#8a95a8]">
                  Loading upcoming conferences...
                </p>
              ) : upcomingRegistrations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dfe4ed] bg-[#fafbfe] p-6 text-center">
                  <CalendarDays
                    size={22}
                    className="mx-auto text-[#a9b1c0]"
                  />

                  <p className="mb-0 mt-3 text-xs font-bold text-[#536079]">
                    No upcoming registered conferences.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/conferences")}
                    className="mt-4 rounded-xl bg-[#efedff] px-4 py-2.5 text-[10px] font-extrabold text-[#5548d7]"
                  >
                    Browse conferences
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingRegistrations.map((registration) => {
                    const conference = registration.resolvedConference;

                    return (
                      <button
                        key={registration.id}
                        type="button"
                        onClick={() => navigate("/conferences")}
                        className="flex w-full items-center gap-3 rounded-[13px] border border-[#edf0f5] bg-[#fafbfe] p-3 text-left transition hover:border-[#dcd9ff] hover:bg-[#f8f7ff]"
                      >
                        <div className="grid h-11 w-14 shrink-0 place-items-center rounded-[10px] bg-[#efedff] px-1 text-center">
                          <strong className="text-[9px] font-extrabold text-[#5649dc]">
                            {formatDate(
                              conferenceStartDate(conference),
                              "TBA"
                            )}
                          </strong>
                        </div>

                        <div className="min-w-0 flex-1">
                          <strong className="block truncate text-[11px] text-[#1c2a4a]">
                            {conferenceName(conference)}
                          </strong>

                          <span className="text-[9px] text-[#8a95a8]">
                            {conference?.city ||
                              conference?.venue ||
                              "Conference details"}
                          </span>
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-[#a7afbd]"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-[20px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-6 text-white shadow-[0_18px_45px_rgba(20,28,80,.15)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                <Compass size={18} />
              </span>

              <h2 className="mb-2 mt-5 text-[20px] font-bold tracking-[-.03em]">
                Find your next conference
              </h2>

              <p className="m-0 text-[10px] leading-6 text-white/60">
                Explore available conferences, review dates and choose the
                events you want to attend.
              </p>

              <button
                type="button"
                onClick={() => navigate("/conferences")}
                className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[.08] px-3.5 py-2.5 text-[10px] font-extrabold text-white hover:bg-white/[.14]"
              >
                Browse conferences
                <ChevronRight size={14} />
              </button>
            </article>
          </section>

          <section
            id="my-registrations"
            className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]"
          >
            <div className="flex flex-col items-start justify-between gap-4 border-b border-[#edf0f5] p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
                  Attendance
                </span>

                <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
                  Attending
                </h2>
              </div>

              <div className="relative w-full sm:w-[260px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                  size={15}
                />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search registrations..."
                  className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">
                Loading your registrations...
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center">
                <TicketCheck
                  size={22}
                  className="mx-auto text-[#aeb6c6]"
                />

                <h3 className="mb-1 mt-3 text-[13px] font-bold">
                  No registrations found
                </h3>

                <p className="m-0 text-[10px] text-[#8993a6]">
                  Browse conferences and register for an event to see it here.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/conferences")}
                  className="mt-4 rounded-xl bg-[#efedff] px-4 py-2.5 text-[10px] font-extrabold text-[#5548d7]"
                >
                  Browse conferences
                </button>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                        <th className="px-6 py-3">
                          Conference
                        </th>
                        <th className="px-4 py-3">
                          Date
                        </th>
                        <th className="px-4 py-3">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRegistrations.map((registration) => {
                        const conference =
                          registration.resolvedConference;

                        const status = registration.normalizedStatus;

                        const canCancel = ![
                          "cancelled",
                          "canceled",
                          "rejected",
                          "completed",
                        ].includes(status);

                        return (
                          <tr
                            key={registration.id}
                            className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe]"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                                  <CalendarDays size={16} />
                                </span>

                                <div>
                                  <strong className="block max-w-[300px] truncate text-[11px] text-[#1c2a4a]">
                                    {conferenceName(conference)}
                                  </strong>

                                  <span className="text-[9px] text-[#929bad]">
                                    Registration #{registration.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-[10px] text-[#7b869b]">
                              {formatDate(
                                conferenceStartDate(conference)
                              )}
                              {conferenceEndDate(conference)
                                ? ` – ${formatDate(
                                    conferenceEndDate(conference)
                                  )}`
                                : ""}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                                  REGISTRATION_STATUS_STYLES[status] ||
                                  REGISTRATION_STATUS_STYLES.pending
                                }`}
                              >
                                {REGISTRATION_STATUS_LABELS[status] ||
                                  registration.status ||
                                  "Pending"}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate("/conferences")
                                  }
                                  className="rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-bold text-[#5548d7] hover:bg-[#e4e1ff]"
                                >
                                  View
                                </button>

                                {canCancel && (
                                  <button
                                    type="button"
                                    disabled={
                                      busyRegistrationId ===
                                      registration.id
                                    }
                                    onClick={() =>
                                      handleCancelRegistration(
                                        registration
                                      )
                                    }
                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {busyRegistrationId ===
                                    registration.id
                                      ? "Cancelling..."
                                      : "Cancel"}
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
                  {filteredRegistrations.map((registration) => {
                    const conference =
                      registration.resolvedConference;

                    const status = registration.normalizedStatus;

                    const canCancel = ![
                      "cancelled",
                      "canceled",
                      "rejected",
                      "completed",
                    ].includes(status);

                    return (
                      <article
                        key={registration.id}
                        className="p-4"
                      >
                        <div className="flex gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                            <CalendarDays size={17} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <strong className="block text-[11px] text-[#1c2a4a]">
                              {conferenceName(conference)}
                            </strong>

                            <p className="mb-2 mt-1 text-[9px] text-[#8c96a9]">
                              {formatDate(
                                conferenceStartDate(conference)
                              )}
                            </p>

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                                REGISTRATION_STATUS_STYLES[status] ||
                                REGISTRATION_STATUS_STYLES.pending
                              }`}
                            >
                              {REGISTRATION_STATUS_LABELS[status] ||
                                registration.status ||
                                "Pending"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/conferences")
                            }
                            className="rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-bold text-[#5548d7]"
                          >
                            View
                          </button>

                          {canCancel && (
                            <button
                              type="button"
                              disabled={
                                busyRegistrationId === registration.id
                              }
                              onClick={() =>
                                handleCancelRegistration(registration)
                              }
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 disabled:opacity-50"
                            >
                              {busyRegistrationId === registration.id
                                ? "Cancelling..."
                                : "Cancel"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 px-1 py-8 text-[9px] text-[#8c96a9]">
            <span>
              CMT Attendee Workspace · API connected
            </span>

            <span>
              Registration permissions are enforced by the backend.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
>>>>>>> origin/main
