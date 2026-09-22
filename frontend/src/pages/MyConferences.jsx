import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ConferenceCard from "../components/ConferenceCard";
import { conferencesApi } from "../api/conferencesApi";

const CATEGORIES = [
  "AI & Machine Learning",
  "Computer Science",
  "Engineering",
  "Medicine & Health",
  "Education",
];

const STATUSES = ["open", "closed"];
const FORMATS = ["in_person", "hybrid", "virtual"];

const PAGE_MENU = [
  { label: "All conferences", path: "/conferences" },
  { label: "My Conferences", path: "/my-conferences" },
  { label: "Create conference", path: "/create-conference" },
  { label: "Author dashboard", path: "/author-dashboard" },
];

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAccent(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("medicine") || value.includes("health")) return "green";
  if (value.includes("engineering") || value.includes("education")) return "orange";
  return "purple";
}

function normaliseConference(conference) {
  const formatMap = {
    in_person: "In-person",
    virtual: "Online",
    hybrid: "Hybrid",
  };
  const statusMap = {
    open: "Open for submissions",
    closed: "Closed",
  };

  return {
    ...conference,
    id: conference.id,
    code: conference.code || "",
    name: conference.name || "Untitled Conference",
    shortTitle: conference.name || conference.code || "Untitled Conference",
    title: conference.name || "Untitled Conference",
    description:
      conference.description || "Conference information and submission details.",
    category: conference.category || "Computer Science",
    topics: Array.isArray(conference.topics) ? conference.topics : [],
    format: formatMap[conference.format] || conference.format || "",
    status:
      statusMap[conference.submission_status] ||
      conference.submission_status ||
      "",
    submission_status: conference.submission_status || "",
    submissionDeadline: formatDate(conference.submission_deadline),
    startDate: formatDate(conference.start_date),
    endDate: formatDate(conference.end_date),
    date: formatDate(conference.start_date),
    location: conference.venue_name || "Venue to be announced",
    city: conference.city || "",
    country: conference.country || "",
    websiteLink: conference.website_link || "",
    accent: getAccent(conference.category),
  };
}

function matchesSearch(conference, query) {
  if (!query.trim()) return true;
  const text = [
    conference.name,
    conference.code,
    conference.description,
    conference.category,
    conference.format,
    conference.submission_status,
    conference.venue_name,
    conference.city,
    conference.country,
    ...(Array.isArray(conference.topics) ? conference.topics : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(query.trim().toLowerCase());
}

function matchesFilters(conference, filters) {
  if (
    filters.category &&
    String(conference.category || "").toLowerCase() !==
      filters.category.toLowerCase()
  ) {
    return false;
  }
  if (
    filters.country &&
    String(conference.country || "").toLowerCase() !==
      filters.country.toLowerCase()
  ) {
    return false;
  }
  if (
    filters.status &&
    String(conference.submission_status || "").toLowerCase() !==
      filters.status.toLowerCase()
  ) {
    return false;
  }
  if (
    filters.format &&
    String(conference.format || "").toLowerCase() !==
      filters.format.toLowerCase()
  ) {
    return false;
  }
  return true;
}

function sortConferences(list, sortBy) {
  const sorted = [...list];
  if (sortBy === "name") {
    return sorted.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }
  if (sortBy === "date") {
    return sorted.sort((a, b) => {
      const aT = a.start_date ? new Date(a.start_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bT = b.start_date ? new Date(b.start_date).getTime() : Number.MAX_SAFE_INTEGER;
      return aT - bT;
    });
  }
  return sorted.sort((a, b) => {
    const aT = a.submission_deadline
      ? new Date(a.submission_deadline).getTime()
      : Number.MAX_SAFE_INTEGER;
    const bT = b.submission_deadline
      ? new Date(b.submission_deadline).getTime()
      : Number.MAX_SAFE_INTEGER;
    return aT - bT;
  });
}

export default function Conferences() {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    country: "",
    status: "",
    format: "",
  });
  const [sortBy, setSortBy] = useState("deadline");
  const [view, setView] = useState("grid");
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const loadConferences = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await conferencesApi.getAll({ per_page: 100 });
      setConferences(unwrapList(response));
    } catch (err) {
      console.error("Failed to load conferences:", err);
      setError(
        err?.message ||
          "Unable to load conferences. Is the API running at http://127.0.0.1:8000?"
      );
      setConferences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConferences();
  }, [loadConferences]);

  const countries = useMemo(() => {
    const set = new Set(conferences.map((c) => c.country).filter(Boolean));
    return Array.from(set).sort();
  }, [conferences]);

  const displayConferences = useMemo(() => {
    const filtered = conferences.filter(
      (c) => matchesSearch(c, query) && matchesFilters(c, filters)
    );
    return sortConferences(filtered, sortBy).map(normaliseConference);
  }, [conferences, query, filters, sortBy]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setQuery("");
    setFilters({ category: "", country: "", status: "", format: "" });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const FilterPanel = () => (
    <aside className="rounded-2xl border border-[#d0d5e0] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121a33]">
      <div className="mb-5 flex items-center justify-between border-b border-[#e8ebf2] pb-4 dark:border-white/10">
        <strong className="text-[13px] font-extrabold text-[#0d1b3d] dark:text-white">
          Filters
        </strong>
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="border-0 bg-transparent text-[11px] font-bold text-[#5c50ec] dark:text-[#b7aeff]"
            onClick={clearFilters}
          >
            Clear all
          </button>
        )}
      </div>

      <label className="mb-4 grid gap-1.5 text-[11px] font-bold text-[#4a5568] dark:text-[#c0c7d6]">
        <span>Category</span>
        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="min-h-10 w-full rounded-[11px] border border-[#d0d5e0] bg-[#f8f9fc] px-3 text-[13px] font-medium text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 grid gap-1.5 text-[11px] font-bold text-[#4a5568] dark:text-[#c0c7d6]">
        <span>Country</span>
        <select
          value={filters.country}
          onChange={(e) => updateFilter("country", e.target.value)}
          className="min-h-10 w-full rounded-[11px] border border-[#d0d5e0] bg-[#f8f9fc] px-3 text-[13px] font-medium text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 grid gap-1.5 text-[11px] font-bold text-[#4a5568] dark:text-[#c0c7d6]">
        <span>Submission status</span>
        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="min-h-10 w-full rounded-[11px] border border-[#d0d5e0] bg-[#f8f9fc] px-3 text-[13px] font-medium text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "open" ? "Open for submissions" : "Closed"}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-[11px] font-bold text-[#4a5568] dark:text-[#c0c7d6]">
        <span>Format</span>
        <select
          value={filters.format}
          onChange={(e) => updateFilter("format", e.target.value)}
          className="min-h-10 w-full rounded-[11px] border border-[#d0d5e0] bg-[#f8f9fc] px-3 text-[13px] font-medium text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white"
        >
          <option value="">All formats</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f === "in_person" ? "In-person" : f === "virtual" ? "Online" : "Hybrid"}
            </option>
          ))}
        </select>
      </label>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#0d1b3d] dark:bg-[#070f24] dark:text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-gradient-to-br from-[#07132f] via-[#0c1c40] to-[#1a2458] text-white">
        <div className="mx-auto w-[min(1200px,calc(100%-40px))] py-10 md:py-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#cfc8ff]">
                <Sparkles size={14} /> All conferences
              </span>
              <h1 className="mt-4 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-0.04em] text-white">
                Browse academic conferences
              </h1>
              <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/85">
                Search and filter open calls, hybrid events, and in-person
                programmes from the live CMT database.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadConferences}
                className="inline-flex items-center gap-2 rounded-[11px] border border-white/20 bg-transparent px-4 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-px"
              >
                <RefreshCw size={15} /> Refresh
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-conferences")}
                className="rounded-[11px] border border-white/20 bg-transparent px-4 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-px"
              >
                My Conferences
              </button>
              <button
                type="button"
                onClick={() => navigate("/create-conference")}
                className="inline-flex items-center gap-2 rounded-[11px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)] transition hover:-translate-y-px"
              >
                <Plus size={15} /> Create conference
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            {PAGE_MENU.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${
                    active
                      ? "bg-white text-[#07132f]"
                      : "border border-white/20 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="border-b border-[#e4e8f0] bg-white dark:border-white/10 dark:bg-[#0c152c]">
        <div className="mx-auto flex w-[min(1200px,calc(100%-40px))] flex-wrap items-center justify-between gap-3 py-4">
          <div className="relative min-w-[240px] max-w-md flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5b657a] dark:text-[#aeb6c8]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, city, topic…"
              className="w-full rounded-[11px] border border-[#d0d5e0] bg-[#f8f9fc] py-2.5 pl-10 pr-3 text-[13px] font-medium text-[#0d1b3d] outline-none placeholder:text-[#6b7280] focus:border-[#6655f6] dark:border-white/15 dark:bg-[#1a2442] dark:text-white dark:placeholder:text-[#9aa3b5]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-[11px] border border-[#d0d5e0] bg-white px-3 py-2.5 text-[12px] font-bold text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white"
            >
              <option value="deadline">Sort: deadline</option>
              <option value="date">Sort: start date</option>
              <option value="name">Sort: name</option>
            </select>

            <div className="flex overflow-hidden rounded-[11px] border border-[#d0d5e0] dark:border-white/15">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`grid h-10 w-10 place-items-center ${
                  view === "grid"
                    ? "bg-[#efedff] text-[#5c50ec] dark:bg-[#2a3358] dark:text-[#cfc8ff]"
                    : "bg-white text-[#4a5568] dark:bg-[#121a33] dark:text-[#c0c7d6]"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`grid h-10 w-10 place-items-center border-l border-[#d0d5e0] dark:border-white/15 ${
                  view === "list"
                    ? "bg-[#efedff] text-[#5c50ec] dark:bg-[#2a3358] dark:text-[#cfc8ff]"
                    : "bg-white text-[#4a5568] dark:bg-[#121a33] dark:text-[#c0c7d6]"
                }`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilters((v) => !v)}
              className="inline-flex items-center gap-2 rounded-[11px] border border-[#d0d5e0] bg-white px-3 py-2.5 text-[12px] font-bold text-[#0d1b3d] lg:hidden dark:border-white/15 dark:bg-[#1a2442] dark:text-white"
            >
              <SlidersHorizontal size={15} /> Filters
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-[min(1200px,calc(100%-40px))] py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100"
          >
            {error}
          </div>
        )}

        <p className="mb-4 text-[13px] font-semibold text-[#4a5568] dark:text-[#c0c7d6]">
          {loading
            ? "Loading conferences…"
            : `${displayConferences.length} conference${
                displayConferences.length === 1 ? "" : "s"
              } found`}
        </p>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
            <FilterPanel />
          </div>

          <div>
            {loading && (
              <div className="rounded-2xl border border-dashed border-[#c5cddb] bg-white px-6 py-16 text-center text-[13px] font-semibold text-[#4a5568] dark:border-white/15 dark:bg-[#121a33] dark:text-[#c0c7d6]">
                Loading conferences from the API…
              </div>
            )}

            {!loading && !error && displayConferences.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#c5cddb] bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-[#121a33]">
                <p className="text-[14px] font-extrabold text-[#0d1b3d] dark:text-white">
                  No conferences match your search
                </p>
                <p className="mt-2 text-[13px] text-[#4a5568] dark:text-[#c0c7d6]">
                  Try clearing filters or create a new conference.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-[11px] border border-[#d0d5e0] bg-white px-4 py-2.5 text-[13px] font-bold text-[#0d1b3d] dark:border-white/15 dark:bg-[#1a2442] dark:text-white"
                  >
                    Clear filters
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/create-conference")}
                    className="rounded-[11px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[13px] font-bold text-white"
                  >
                    Create conference
                  </button>
                </div>
              </div>
            )}

            {!loading && displayConferences.length > 0 && (
              <div
                className={
                  view === "grid"
                    ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid gap-3"
                }
              >
                {displayConferences.map((conference) => (
                  <ConferenceCard
                    key={conference.id}
                    conference={conference}
                    layout={view}
                  />
                ))}
              </div>
            )}

            {!loading && displayConferences.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#e8ebf2] pt-4 text-[12px] text-[#4a5568] dark:border-white/10 dark:text-[#c0c7d6]">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CalendarDays size={16} />
                  Sorted by{" "}
                  {sortBy === "deadline"
                    ? "submission deadline"
                    : sortBy === "date"
                      ? "conference date"
                      : "name"}
                </span>
                <span className="font-semibold">
                  {displayConferences.length} conference
                  {displayConferences.length === 1 ? "" : "s"} available
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-[#07132f] text-white/70">
        <div className="mx-auto flex min-h-[90px] w-[min(1200px,calc(100%-40px))] flex-wrap items-center justify-between gap-4 py-6 text-[12px]">
          <strong className="text-white">CMT · Conference Management Tool</strong>
          <span>© {new Date().getFullYear()} CMT</span>
        </div>
      </footer>
    </div>
  );
}