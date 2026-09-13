import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
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
import { reviewsApi } from "../api/reviewsApi";

export default function ReviewerDashboard() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [notice, setNotice] = useState(true);

  // States for data fetching
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dropdown states for sidebar sections
  const [expanded, setExpanded] = useState({
    reviews: false,
    history: false,
    settings: false,
  });

  useEffect(() => {
    reviewsApi
      .pending()
      .then((response) => {
        const fetchedData = response?.data ?? response;
        setItems(
          Array.isArray(fetchedData)
            ? fetchedData
            : fetchedData?.data || []
        );
      })
      .catch((err) => {
        console.error("Failed to load pending reviews:", err);
        setError("Unable to load pending reviews right now.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const collapseAll = () => {
    setExpanded({
      reviews: false,
      history: false,
      settings: false,
    });
  };

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  useEffect(() => {
    if (sidebarVisible) {
      setExpanded({
        reviews: false,
        history: false,
        settings: false,
      });
    }
  }, [sidebarVisible]);

  const filteredItems = items.filter((item) => {
    const titleText =
      item.submission?.title || item.title || `Submission ID: ${item.submission_id}`;
    const itemStatus = item.status || "Pending";
    const matchesStatus =
      statusFilter === "All statuses" || itemStatus === statusFilter;
    const matchesQuery =
      !query ||
      titleText.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toString().includes(query);
    return matchesStatus && matchesQuery;
  });

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontFamily: 'sans-serif', color: '#4b5563' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Loading reviewer queue...</div>
        </div>
      </div>
    );
  }

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
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">Reviewer workspace</p>
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
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">RV</div>
              <div className="leading-tight">
                <strong className="block text-[11px] text-white">Reviewer User</strong>
                <span className="block text-[9px] text-white/45">Evaluator</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        {/* Sidebar */}
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

            <div className="flex justify-end -mt-1 -mr-1">
              <button
                onClick={toggleSidebar}
                className="rounded-lg p-1.5 text-[#66728b] hover:bg-[#f0f2f6] transition"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="mb-3 cursor-pointer rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white transition hover:shadow-lg"
              onClick={collapseAll}
            >
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10"><LayoutDashboard size={17} /></span>
              <strong className="block text-[13px]">Reviewer menu</strong>
              <p className="mt-1 text-[10px] leading-5 text-white/60">Click to collapse all submenus</p>
            </div>

            <nav className="space-y-1" aria-label="Reviewer dashboard navigation">
              <button
                className="flex w-full items-center gap-3 rounded-xl bg-[#efedff] px-3 py-2.5 text-left text-[12px] font-extrabold text-[#5649dc]"
                onClick={() => scrollTo("dashboard-overview")}
              >
                <LayoutDashboard size={16} /> Overview
              </button>

              {/* Reviews */}
              <div>
                <button
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                  onClick={() => toggleSection("reviews")}
                >
                  <span className="flex items-center gap-3"><FileText size={16} /> Assigned Reviews</span>
                  {expanded.reviews ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expanded.reviews && (
                  <div className="ml-6 space-y-1 border-l border-[#edf0f5] pl-3">
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]" onClick={() => scrollTo("reviews-table")}>Pending Queue</button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">Guidelines</button>
                  </div>
                )}
              </div>

              {/* History */}
              <div>
                <button
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                  onClick={() => toggleSection("history")}
                >
                  <span className="flex items-center gap-3"><Users size={16} /> Past Reviews</span>
                  {expanded.history ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expanded.history && (
                  <div className="ml-6 space-y-1 border-l border-[#edf0f5] pl-3">
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">Completed</button>
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

        {sidebarVisible && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <main id="dashboard-overview" className="min-w-0 flex-1 scroll-mt-24 space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div>
              <h1 className="text-xl font-bold text-[#111827] m-0">Reviewer Dashboard</h1>
              <p className="text-sm text-[#6b7280] mt-1 mb-0">Manage and evaluate your pending conference submissions.</p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="rounded-full bg-[#e0e7ff] px-3 py-1.5 text-xs font-semibold text-[#3730a3]">
                {items.length} Pending
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-[#f87171] bg-[#fef2f2] p-4 text-sm text-[#991b1b]">
              {error}
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <input
                type="text"
                placeholder="Search reviews by title or ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-[#d1d5db] bg-white py-2.5 pl-10 pr-4 text-sm text-[#111827] outline-none focus:border-[#4f46e5]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[#6b7280]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#4f46e5]"
              >
                <option value="All statuses">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Under review">Under review</option>
                <option value="Revision requested">Revision requested</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          <div id="reviews-table" className="scroll-mt-24">
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] p-12 text-center text-[#6b7280]">
                <p className="text-base font-medium text-[#374151] m-0 mb-1">No pending items to review.</p>
                <p className="text-sm m-0">You are all caught up! New assigned reviews will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div>
                      <span className="inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-xs font-semibold text-[#374151] mb-1.5">
                        Review #{item.id}
                      </span>
                      <h3 className="text-base font-semibold text-[#1f2937] m-0 mb-1">
                        {item.submission?.title || item.title || `Submission ID: ${item.submission_id}`}
                      </h3>
                      <p className="text-xs text-[#6b7280] m-0">
                        Status:{" "}
                        <span className="font-medium text-[#d97706] capitalize">
                          {item.status || "Pending"}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => alert(`Opening review workspace for ID: ${item.id}`)}
                      className="self-start sm:self-auto rounded-lg bg-[#4f46e5] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4338ca]"
                    >
                      Evaluate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#07132f] text-white/60 mt-12">
        <div className="mx-auto flex min-h-[100px] w-[min(1200px,calc(100%-40px))] items-center justify-between gap-5 text-[10px] max-[560px]:block max-[560px]:py-6">
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <img className="h-[34px] w-[34px] object-contain" src="/cmt-mark.png" alt="CMT logo" />
              <div className="flex flex-col leading-[1.05]">
                <strong className="text-xl tracking-[-.04em]">CMT</strong>
                <span className="mt-1 whitespace-nowrap text-[9px] text-white/70">Conference Management Tool</span>
              </div>
            </div>
            <p className="mt-1 text-[9px] text-white/45">Conference Management Tool</p>
          </div>
          <span>© {new Date().getFullYear()} CMT. Conference Management Tool.</span>
        </div>
      </footer>
    </div>
  );
}