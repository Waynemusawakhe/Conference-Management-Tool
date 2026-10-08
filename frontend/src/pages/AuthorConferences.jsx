import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  LayoutGrid,
  List,
  LoaderCircle,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import AuthorLayout from "../components/AuthorLayout";
import ConferenceCard from "../components/ConferenceCard";
import SectionHeading from "../components/SectionHeading";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";

const CATEGORIES = [
  "AI & Machine Learning",
  "Computer Science",
  "Engineering",
  "Medicine & Health",
  "Education",
];

const STATUSES = [
  { value: "open", label: "Open for submissions" },
  { value: "closed", label: "Closed" },
];

const FORMATS = [
  { value: "in_person", label: "In-person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "virtual", label: "Online" },
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
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAccent(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("medicine") || value.includes("health")) return "green";
  if (value.includes("engineering") || value.includes("education"))
    return "orange";
  return "purple";
}

function normaliseConference(conference) {
  return {
    ...conference,
    id: conference.id,
    code: conference.code || "",
    name: conference.name || "Untitled Conference",
    shortTitle: conference.name || conference.code || "Untitled Conference",
    description:
      conference.description ||
      "Conference information and submission details.",
    category: conference.category || "Computer Science",
    topics: Array.isArray(conference.topics) ? conference.topics : [],
    format: conference.format || "",
    status: conference.submission_status || "",
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

function FilterPanel({ activeFilterCount, clearFilters, filters, updateFilter }) {
  return (
    <aside className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between border-b border-[#e8ebf2] pb-4">
        <strong>Filters</strong>
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="border-0 bg-transparent text-[11px] font-bold text-[#5c50ec]"
            onClick={clearFilters}
          >
            Clear all
          </button>
        )}
      </div>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Research area</span>
        <select
          className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="">All areas</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Country</span>
        <input
          value={filters.country}
          onChange={(e) => updateFilter("country", e.target.value)}
          placeholder="All countries"
          aria-label="Country"
          className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] px-2.5 text-[11px]"
        />
      </label>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Status</span>
        <select
          className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Format</span>
        <select
          className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.format}
          onChange={(e) => updateFilter("format", e.target.value)}
        >
          <option value="">All formats</option>
          {FORMATS.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </label>
    </aside>
  );
}

function SubmitProposalModal({ open, conference, onClose, onSubmitted }) {
  const [title, setTitle] = useState("");
  const [track, setTrack] = useState("");
  const [abstract, setAbstract] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setTrack("");
    setAbstract("");
    setFile(null);
    setError("");
  }, [open, conference]);

  if (!open || !conference) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim() || !abstract.trim()) {
      setError("Title and abstract are required.");
      return;
    }

    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const extension = file.name.toLowerCase().split(".").pop();
      if (
        !allowedTypes.includes(file.type) &&
        !["pdf", "doc", "docx"].includes(extension)
      ) {
        setError("Only PDF, DOC or DOCX files are allowed.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("The file must be 10MB or smaller.");
        return;
      }
    }

    const body = new FormData();
    body.append("conference_id", String(conference.id));
    body.append("title", title.trim());
    body.append("track", track.trim());
    body.append("abstract", abstract.trim());
    if (file) body.append("file", file);

    setSaving(true);
    try {
      await submissionsApi.create(body);
      onSubmitted?.();
      onClose();
    } catch (err) {
      const first = Object.values(err?.errors || {})[0];
      setError(
        (Array.isArray(first) ? first[0] : first) ||
          err?.message ||
          "Unable to submit the proposal.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm"
      onMouseDown={(e) =>
        e.target === e.currentTarget && !saving && onClose()
      }
    >
      <div className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">
              Submit a proposal
            </span>
            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d]">
              {conference.name}
            </h2>
            <p className="mt-1 text-[11px] text-[#66728b]">
              {conference.code || ""}{" "}
              {conference.submission_deadline &&
                `· Deadline: ${formatDate(conference.submission_deadline)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] hover:bg-[#e9ecf3] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-4 p-6">
          <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
              className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none focus:border-[#7568f7]"
              placeholder="Research proposal title"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
              Track
              <input
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                maxLength={255}
                className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none focus:border-[#7568f7]"
                placeholder="e.g. Artificial Intelligence"
              />
            </label>

            <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
              Proposal file
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block h-11 w-full rounded-xl border border-[#dfe4ed] bg-white px-2 py-2 text-[11px]"
              />
              <span className="font-normal text-[9px] text-[#8a95a8]">
                Optional · PDF, DOC or DOCX · maximum 10MB
              </span>
              {file && (
                <span className="mt-1 flex items-center gap-1.5 rounded-md bg-[#effaf4] px-2 py-1 text-[10px] font-medium text-[#18794e]">
                  <Upload size={11} />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </label>
          </div>

          <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
            Abstract
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              maxLength={5000}
              rows={8}
              required
              className="resize-y rounded-xl border border-[#dfe4ed] p-3 text-sm font-normal leading-6 outline-none focus:border-[#7568f7]"
              placeholder="Write the research abstract…"
            />
            <span className="text-right text-[9px] font-normal text-[#8a95a8]">
              {abstract.length}/5000
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#edf0f5] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#dfe4ed] px-4 py-2.5 text-xs font-bold text-[#66728b] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AuthorConferences() {
  const requestVersion = useRef(0);
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("search") || "");
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    country: searchParams.get("country") || "",
    status: "",
    format: "",
  });

  const [sortBy, setSortBy] = useState("deadline");
  const [view, setView] = useState("grid");
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalConferences, setTotalConferences] = useState(0);
  const [error, setError] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [submitTarget, setSubmitTarget] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadConferences = useCallback(
    async ({ page = 1, append = false } = {}) => {
      const version = ++requestVersion.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");

      try {
        const response = await conferencesApi.getAll({
          page,
          per_page: 12,
          search: query.trim(),
          category: filters.category,
          country: filters.country,
          submission_status: filters.status,
          format: filters.format,
          sort: sortBy,
        });

        if (version !== requestVersion.current) return;
        const data = unwrapList(response);

        setConferences((current) => (append ? [...current, ...data] : data));
        setCurrentPage(page);
        setHasMore(page < Number(response?.meta?.last_page ?? page));
        setTotalConferences(Number(response?.meta?.total ?? data.length));
      } catch (err) {
        if (version !== requestVersion.current) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load conferences. Please try again.",
        );
        if (!append) setConferences([]);
      } finally {
        if (version === requestVersion.current) {
          if (append) setLoadingMore(false);
          else setLoading(false);
        }
      }
    },
    [query, filters, sortBy],
  );

  useEffect(() => {
    requestVersion.current += 1;
    setLoading(true);
    setHasMore(false);
    setLoadingMore(false);
    const timer = setTimeout(() => loadConferences(), 250);
    return () => {
      clearTimeout(timer);
      requestVersion.current += 1;
    };
  }, [loadConferences]);

  const displayConferences = useMemo(
    () => conferences.map(normaliseConference),
    [conferences],
  );

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const clearFilters = () => {
    setQuery("");
    setFilters({ category: "", country: "", status: "", format: "" });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleSubmit = (conference) => {
    if (!conference?.id) return;
    if (conference.status === "closed") return;
    setSubmitTarget(conference);
  };

  const handleSubmitted = () => {
    setSuccessMessage("Your proposal has been submitted successfully.");
    window.setTimeout(() => setSuccessMessage(""), 5000);
  };

  return (
    <AuthorLayout>
      <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-6 py-10 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:px-8">
        <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
        <div className="relative z-[2]">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
            <Sparkles size={14} />
            Browse conferences
          </span>
          <h1 className="mb-2 mt-3 text-[clamp(24px,3.4vw,36px)] font-bold leading-tight tracking-[-.04em]">
            Find the right conference for your research.
          </h1>
          <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
            Search by topic, filter by status and format, and submit your
            proposal to any open conference.
          </p>
        </div>
      </section>

      {successMessage && (
        <div
          role="status"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-xs font-semibold text-[#18794e]"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            {successMessage}
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <section className="mt-6 rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] sm:p-6">
        <div className="mb-8 flex items-center justify-between gap-5 max-[700px]:block">
          <form
            className="flex min-h-[58px] w-full max-w-[620px] items-center rounded-[14px] border border-[#e4e8f0] bg-white p-1.5 shadow-sm"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search className="mx-3 shrink-0 text-[#71809a]" size={20} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#8792a8]"
              placeholder="Search by title, topic, city or acronym..."
              aria-label="Search conferences"
            />
            <button
              className="min-h-11 rounded-[10px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-xs font-bold text-white"
              type="submit"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-3 max-[700px]:mt-4">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#dfe4ed] bg-white px-3 py-2.5 text-xs font-bold text-[#43506a] lg:hidden"
              onClick={() => setShowMobileFilters((value) => !value)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>

            <label className="flex items-center gap-2 text-xs font-bold text-[#68748b]">
              <span className="hidden sm:inline">Sort</span>
              <select
                className="min-h-10 rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7]"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="deadline">Submission deadline</option>
                <option value="date">Conference date</option>
                <option value="name">Name</option>
              </select>
            </label>

            <div
              className="flex overflow-hidden rounded-[9px] border border-[#dfe4ed]"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                className={`grid h-10 w-10 place-items-center border-0 ${
                  view === "grid"
                    ? "bg-[#efedff] text-[#5c50ec]"
                    : "bg-white text-[#68748b]"
                }`}
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                className={`grid h-10 w-10 place-items-center border-0 ${
                  view === "list"
                    ? "bg-[#efedff] text-[#5c50ec]"
                    : "bg-white text-[#68748b]"
                }`}
                onClick={() => setView("list")}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {showMobileFilters && (
          <div className="mb-6 lg:hidden">
            <FilterPanel
              activeFilterCount={activeFilterCount}
              clearFilters={clearFilters}
              filters={filters}
              updateFilter={updateFilter}
            />
          </div>
        )}

        <div className="grid grid-cols-[220px_1fr] gap-8 max-[900px]:grid-cols-1">
          <div className="hidden lg:block">
            <FilterPanel
              activeFilterCount={activeFilterCount}
              clearFilters={clearFilters}
              filters={filters}
              updateFilter={updateFilter}
            />
          </div>

          <div className="min-w-0">
            <SectionHeading
              eyebrow="Conference catalogue"
              title={
                query || activeFilterCount
                  ? `${displayConferences.length} result${
                      displayConferences.length === 1 ? "" : "s"
                    }`
                  : "All conferences"
              }
              description={
                query || activeFilterCount
                  ? "Refine your search or clear the filters to see all conferences."
                  : "Live conference data from the Conference Management Tool."
              }
            />

            {loading && (
              <div className="rounded-[18px] border border-[#e4e8f0] bg-[#fafbfe] p-10 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#e5e3ff] border-t-[#6655f6]" />
                <h3 className="text-sm font-bold text-[#0d1b3d]">
                  Loading conferences...
                </h3>
                <p className="mt-1 text-xs text-[#788398]">
                  Fetching the latest conferences.
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-[18px] border border-red-200 bg-red-50 p-8 text-center">
                <h3 className="text-sm font-bold text-red-700">
                  Unable to load conferences
                </h3>
                <p className="mt-2 text-xs leading-6 text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => loadConferences()}
                  className="mt-5 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && displayConferences.length > 0 && (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-2 gap-6 max-[560px]:grid-cols-1"
                    : "grid gap-5"
                }
              >
                {displayConferences.map((conference) => {
                  const closed = conference.status === "closed";
                  return (
                    <div key={conference.id} className="min-w-0">
                      <ConferenceCard
                        conference={conference}
                        layout={view}
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          disabled={closed}
                          onClick={() => handleSubmit(conference)}
                          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[11px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            closed
                              ? "border border-[#dfe4ed] bg-[#f4f6f9] text-[#68748b]"
                              : "border border-transparent bg-gradient-to-br from-[#6655f6] to-[#7869ff] text-white shadow-[0_8px_20px_rgba(103,87,245,.18)] hover:-translate-y-px"
                          }`}
                        >
                          {closed ? (
                            <>
                              <CheckCircle2 size={15} />
                              Submissions closed
                            </>
                          ) : (
                            <>
                              <FileText size={15} />
                              Submit a proposal
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && !error && displayConferences.length === 0 && (
              <div className="rounded-[18px] border border-dashed border-[#ccd3df] bg-[#fafbfe] p-[35px] text-center">
                <Search size={28} className="mx-auto text-[#68748b]" />
                <h3 className="mt-3 text-base font-bold text-[#0d1b3d]">
                  No conferences found
                </h3>
                <p className="mt-2 text-xs text-[#788398]">
                  Try another search or clear your filters.
                </p>
                <button
                  type="button"
                  className="mt-5 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            )}

            {!loading && !error && displayConferences.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#e8ebf2] pt-4 text-[10px] text-[#788398]">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={16} />
                  Sorted by{" "}
                  {sortBy === "deadline"
                    ? "submission deadline"
                    : sortBy === "date"
                    ? "conference date"
                    : "name"}
                </span>
                <span>
                  {conferences.length} of {totalConferences} conferences loaded
                </span>
              </div>
            )}

            {!loading && hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() =>
                    loadConferences({
                      page: currentPage + 1,
                      append: true,
                    })
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#dfe4ed] bg-white px-5 text-[11px] font-extrabold text-[#5649dc] transition hover:bg-[#f7f6ff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more conferences"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <SubmitProposalModal
        open={!!submitTarget}
        conference={submitTarget}
        onClose={() => setSubmitTarget(null)}
        onSubmitted={handleSubmitted}
      />
    </AuthorLayout>
  );
}