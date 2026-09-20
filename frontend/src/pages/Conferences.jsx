<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useCallback, useEffect, useMemo, useState } from "react";
>>>>>>> origin/main
import {
  CalendarDays,
  LayoutGrid,
  List,
<<<<<<< HEAD
  MapPin,
  Search,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import Navbar from "../components/Navbar";
import ConferenceCard from "../components/ConferenceCard";
import SectionHeading from "../components/SectionHeading";
import {
  searchConferences,
  sortConferences,
  getAllConferences,
} from "../services/conferenceService";
=======
  Search,
  SlidersHorizontal,
  Sparkles,
  TicketCheck,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ConferenceCard from "../components/ConferenceCard";
import SectionHeading from "../components/SectionHeading";
import { conferencesApi } from "../api/conferencesApi";
import { registrationsApi } from "../api/registrationsApi";
import { useAuth } from "../hooks/useAuth";
>>>>>>> origin/main

const CATEGORIES = [
  "AI & Machine Learning",
  "Computer Science",
  "Engineering",
  "Medicine & Health",
  "Education",
];

const STATUSES = [
  "Open for submissions",
  "Reviewing",
  "Registration open",
  "Coming soon",
  "Closed",
];

const FORMATS = ["In-person", "Hybrid", "Online"];
<<<<<<< HEAD
const COUNTRIES = ["South Africa"];

export default function Conferences() {
  const [query, setQuery] = useState("");
=======

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

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
}

function normaliseConference(conference) {
  return {
    ...conference,

    id: conference.id,

    code: conference.code || "",

    name: conference.name || "Untitled Conference",

    shortTitle:
      conference.name ||
      conference.code ||
      "Untitled Conference",

    description:
      conference.description ||
      "Conference information and submission details.",

    category:
      conference.category ||
      "Computer Science",

    topics: Array.isArray(conference.topics)
      ? conference.topics
      : [],

    format:
      conference.format ||
      "",

    status:
      conference.submission_status ||
      "",

    submissionDeadline:
      formatDate(conference.submission_deadline),

    startDate:
      formatDate(conference.start_date),

    endDate:
      formatDate(conference.end_date),

    date:
      formatDate(conference.start_date),

    location:
      conference.venue_name ||
      "Venue to be announced",

    city:
      conference.city ||
      "",

    country:
      conference.country ||
      "",

    websiteLink:
      conference.website_link ||
      "",

    accent: getAccent(conference.category),
  };
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAccent(category) {
  const value = String(category || "").toLowerCase();

  if (
    value.includes("medicine") ||
    value.includes("health")
  ) {
    return "green";
  }

  if (
    value.includes("engineering") ||
    value.includes("education")
  ) {
    return "orange";
  }

  return "purple";
}

function matchesSearch(conference, query) {
  if (!query.trim()) {
    return true;
  }

  const searchableText = [
    conference.name,
    conference.code,
    conference.description,
    conference.category,
    conference.format,
    conference.submission_status,
    conference.venue_name,
    conference.city,
    conference.country,
    ...(Array.isArray(conference.topics)
      ? conference.topics
      : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query.trim().toLowerCase());
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

function getRegistrationConferenceId(registration) {
  return (
    registration?.conference_id ??
    registration?.conferenceId ??
    registration?.conference?.id ??
    null
  );
}

function sortConferences(conferences, sortBy) {
  const sorted = [...conferences];

  if (sortBy === "name") {
    return sorted.sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || "")
      )
    );
  }

  if (sortBy === "date") {
    return sorted.sort((a, b) => {
      const dateA = a.start_date
        ? new Date(a.start_date).getTime()
        : Number.MAX_SAFE_INTEGER;

      const dateB = b.start_date
        ? new Date(b.start_date).getTime()
        : Number.MAX_SAFE_INTEGER;

      return dateA - dateB;
    });
  }

  return sorted.sort((a, b) => {
    const dateA = a.submission_deadline
      ? new Date(a.submission_deadline).getTime()
      : Number.MAX_SAFE_INTEGER;

    const dateB = b.submission_deadline
      ? new Date(b.submission_deadline).getTime()
      : Number.MAX_SAFE_INTEGER;

    return dateA - dateB;
  });
}

export default function Conferences() {
  const navigate = useNavigate();
  const { user, status: authStatus } = useAuth();

  const [query, setQuery] = useState("");

>>>>>>> origin/main
  const [filters, setFilters] = useState({
    category: "",
    country: "",
    status: "",
    format: "",
  });
<<<<<<< HEAD
  const [sortBy, setSortBy] = useState("deadline");
  const [view, setView] = useState("grid");
  const [conferences, setConferences] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const runSearch = async () => {
    const results = await searchConferences(query, filters);
    setConferences(sortConferences(results, sortBy));
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
=======

  const [sortBy, setSortBy] = useState("deadline");
  const [view, setView] = useState("grid");

  const [conferences, setConferences] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [registeredConferenceIds, setRegisteredConferenceIds] = useState(
    new Set()
  );
  const [registeringConferenceId, setRegisteringConferenceId] =
    useState(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationError, setRegistrationError] = useState("");

  const [showMobileFilters, setShowMobileFilters] =
    useState(false);

  const loadConferences = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await conferencesApi.getAll({
        per_page: 100,
      });

      const data = unwrapList(response);

      setConferences(data);
    } catch (err) {
      console.error("Failed to load conferences:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load conferences. Please try again."
      );

      setConferences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConferences();
  }, [loadConferences]);

  const loadMyRegistrations = useCallback(async () => {
    if (authStatus !== "authenticated" || !user?.id) {
      setRegisteredConferenceIds(new Set());
      return;
    }

    try {
      const response = await registrationsApi.getAll({
        per_page: 100,
      });

      const registrationList = unwrapList(response);

      const ownRegistrations = registrationList.filter((registration) => {
        if (
          registration?.user_id === undefined ||
          registration?.user_id === null
        ) {
          return true;
        }

        return String(registration.user_id) === String(user.id);
      });

      const ids = new Set(
        ownRegistrations
          .map(getRegistrationConferenceId)
          .filter((id) => id !== null && id !== undefined)
          .map(String)
      );

      setRegisteredConferenceIds(ids);
    } catch (err) {
      console.warn("Unable to load current registrations:", err);
    }
  }, [authStatus, user?.id]);

  useEffect(() => {
    loadMyRegistrations();
  }, [loadMyRegistrations]);

  const handleRegister = async (conference) => {
    setRegistrationMessage("");
    setRegistrationError("");

    if (authStatus !== "authenticated") {
      navigate("/login", {
        state: {
          from: "/conferences",
        },
      });
      return;
    }

    const conferenceId = conference?.id;

    if (!conferenceId) {
      setRegistrationError(
        "This conference does not have a valid identifier."
      );
      return;
    }

    if (registeredConferenceIds.has(String(conferenceId))) {
      navigate("/my-conferences");
      return;
    }

    setRegisteringConferenceId(conferenceId);

    try {
      await registrationsApi.create({
        conference_id: conferenceId,
      });

      setRegisteredConferenceIds((current) => {
        const next = new Set(current);
        next.add(String(conferenceId));
        return next;
      });

      setRegistrationMessage(
        `You are now registered for ${conference.name || "this conference"}.`
      );
    } catch (err) {
      const validationMessage = Object.values(err?.errors || {})
        .flat()
        .filter(Boolean)
        .join(" ");

      setRegistrationError(
        validationMessage ||
          err?.message ||
          "Unable to register for this conference."
      );
    } finally {
      setRegisteringConferenceId(null);
    }
  };

  const filteredConferences = useMemo(() => {
    const filtered = conferences.filter((conference) => {
      return (
        matchesSearch(conference, query) &&
        matchesFilters(conference, filters)
      );
    });

    return sortConferences(filtered, sortBy);
  }, [conferences, query, filters, sortBy]);

  const displayConferences = useMemo(() => {
    return filteredConferences.map(normaliseConference);
  }, [filteredConferences]);

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
>>>>>>> origin/main
  };

  const clearFilters = () => {
    setQuery("");
<<<<<<< HEAD
    setFilters({ category: "", country: "", status: "", format: "" });
    getAllConferences().then((data) =>
      setConferences(sortConferences(data, sortBy))
    );
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
=======

    setFilters({
      category: "",
      country: "",
      status: "",
      format: "",
    });
  };

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length;

  const countries = useMemo(() => {
    const values = conferences
      .map((conference) => conference.country)
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      String(a).localeCompare(String(b))
    );
  }, [conferences]);
>>>>>>> origin/main

  const FilterPanel = () => (
    <aside className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between border-b border-[#e8ebf2] pb-4">
        <strong>Filters</strong>
<<<<<<< HEAD
        {activeFilterCount > 0 && (
          <button type="button" className="border-0 bg-transparent text-[11px] font-bold text-[#5c50ec]" onClick={clearFilters}>
=======

        {activeFilterCount > 0 && (
          <button
            type="button"
            className="border-0 bg-transparent text-[11px] font-bold text-[#5c50ec]"
            onClick={clearFilters}
          >
>>>>>>> origin/main
            Clear all
          </button>
        )}
      </div>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Research area</span>
<<<<<<< HEAD
        <select className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="">All areas</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
=======

        <select
          className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.category}
          onChange={(e) =>
            updateFilter("category", e.target.value)
          }
        >
          <option value="">All areas</option>

          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
>>>>>>> origin/main
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Country</span>
<<<<<<< HEAD
        <select className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.country}
          onChange={(e) => updateFilter("country", e.target.value)}
        >
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
=======

        <select
          className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.country}
          onChange={(e) =>
            updateFilter("country", e.target.value)
          }
        >
          <option value="">All countries</option>

          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
>>>>>>> origin/main
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Status</span>
<<<<<<< HEAD
        <select className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
=======

        <select
          className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.status}
          onChange={(e) =>
            updateFilter("status", e.target.value)
          }
        >
          <option value="">All statuses</option>

          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
>>>>>>> origin/main
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Format</span>
<<<<<<< HEAD
        <select className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.format}
          onChange={(e) => updateFilter("format", e.target.value)}
        >
          <option value="">All formats</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
=======

        <select
          className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.format}
          onChange={(e) =>
            updateFilter("format", e.target.value)
          }
        >
          <option value="">All formats</option>

          {FORMATS.map((format) => (
            <option key={format} value={format}>
              {format}
>>>>>>> origin/main
            </option>
          ))}
        </select>
      </label>
    </aside>
  );

  return (
    <div className="min-h-screen overflow-clip bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-5 py-24 text-white">
          <div className="relative z-[2] mx-auto w-[min(1200px,100%)]">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#b9b3ff]">
<<<<<<< HEAD
              <Sparkles size={15} /> Browse conferences
            </span>
            <h1 className="my-4 max-w-[720px] text-[clamp(34px,4.4vw,54px)] font-bold leading-tight tracking-[-.05em]">Find the right conference for your research.</h1>
            <p className="max-w-[620px] text-[15px] leading-7 text-white/75">
              Search by topic, filter by status and format, and sort by
              submission deadline — the same patterns used on major CFP
              directories.
=======
              <Sparkles size={15} />
              Browse conferences
            </span>

            <h1 className="my-4 max-w-[720px] text-[clamp(34px,4.4vw,54px)] font-bold leading-tight tracking-[-.05em]">
              Find the right conference for your research.
            </h1>

            <p className="max-w-[620px] text-[15px] leading-7 text-white/75">
              Search by topic, filter by status and format,
              and find conferences created by organisers on
              the platform.
>>>>>>> origin/main
            </p>
          </div>
        </section>

<<<<<<< HEAD
        <section className="bg-white px-5 py-[88px]" id="conferences">
          <div className="mx-auto w-[min(1200px,100%)]">
            {/* Toolbar */}
            <div className="mb-8 flex items-center justify-between gap-5 max-[700px]:block">
              <form
                className="flex min-h-[58px] w-full max-w-[620px] items-center rounded-[14px] border border-[#e4e8f0] bg-white p-1.5 shadow-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch();
                }}
              >
                <Search className="mx-3 shrink-0 text-[#71809a]" size={20} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
=======
        <section
          className="bg-white px-5 py-[88px]"
          id="conferences"
        >
          <div className="mx-auto w-[min(1200px,100%)]">
            <div className="mb-8 flex items-center justify-between gap-5 max-[700px]:block">
              <form
                className="flex min-h-[58px] w-full max-w-[620px] items-center rounded-[14px] border border-[#e4e8f0] bg-white p-1.5 shadow-sm"
                onSubmit={(e) => e.preventDefault()}
              >
                <Search
                  className="mx-3 shrink-0 text-[#71809a]"
                  size={20}
                />

                <input
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
>>>>>>> origin/main
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#8792a8]"
                  placeholder="Search by title, topic, city or acronym..."
                  aria-label="Search conferences"
                />
<<<<<<< HEAD
                <button className="min-h-11 rounded-[10px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-xs font-bold text-white" type="submit">
=======

                <button
                  className="min-h-11 rounded-[10px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-xs font-bold text-white"
                  type="submit"
                >
>>>>>>> origin/main
                  Search
                </button>
              </form>

              <div className="flex items-center gap-3 max-[700px]:mt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#dfe4ed] bg-white px-3 py-2.5 text-xs font-bold text-[#43506a] lg:hidden"
<<<<<<< HEAD
                  onClick={() => setShowMobileFilters((v) => !v)}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>

                <label className="flex items-center gap-2 text-xs font-bold text-[#68748b]">
                  <span className="hidden sm:inline">Sort</span>
                  <select className="min-h-10 rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7]"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="deadline">Submission deadline</option>
                    <option value="date">Conference date</option>
                    <option value="name">Name</option>
                  </select>
                </label>

                <div className="flex overflow-hidden rounded-[9px] border border-[#dfe4ed]" role="group" aria-label="View mode">
                  <button
                    type="button"
                    className={`grid h-10 w-10 place-items-center border-0 ${view === "grid" ? "bg-[#efedff] text-[#5c50ec]" : "bg-white text-[#68748b]"}`}
=======
                  onClick={() =>
                    setShowMobileFilters((value) => !value)
                  }
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0
                    ? ` (${activeFilterCount})`
                    : ""}
                </button>

                <label className="flex items-center gap-2 text-xs font-bold text-[#68748b]">
                  <span className="hidden sm:inline">
                    Sort
                  </span>

                  <select
                    className="min-h-10 rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7]"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value)
                    }
                  >
                    <option value="deadline">
                      Submission deadline
                    </option>

                    <option value="date">
                      Conference date
                    </option>

                    <option value="name">
                      Name
                    </option>
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
>>>>>>> origin/main
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={18} />
                  </button>
<<<<<<< HEAD
                  <button
                    type="button"
                    className={`grid h-10 w-10 place-items-center border-0 ${view === "list" ? "bg-[#efedff] text-[#5c50ec]" : "bg-white text-[#68748b]"}`}
=======

                  <button
                    type="button"
                    className={`grid h-10 w-10 place-items-center border-0 ${
                      view === "list"
                        ? "bg-[#efedff] text-[#5c50ec]"
                        : "bg-white text-[#68748b]"
                    }`}
>>>>>>> origin/main
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
                <FilterPanel />
              </div>
            )}

<<<<<<< HEAD
=======
            {registrationMessage && (
              <div
                role="status"
                className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#bfe5d1] bg-[#effaf4] px-4 py-3 text-xs font-semibold text-[#18794e]"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  {registrationMessage}
                </span>

                <button
                  type="button"
                  onClick={() => navigate("/my-conferences")}
                  className="rounded-lg bg-white px-3 py-2 text-[10px] font-extrabold text-[#18794e] shadow-sm"
                >
                  View My Conferences
                </button>
              </div>
            )}

            {registrationError && (
              <div
                role="alert"
                className="mb-6 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700"
              >
                {registrationError}
              </div>
            )}

>>>>>>> origin/main
            <div className="grid grid-cols-[220px_1fr] gap-8 max-[900px]:grid-cols-1">
              <div className="hidden lg:block">
                <FilterPanel />
              </div>

              <div className="min-w-0">
                <SectionHeading
                  eyebrow="Conference catalogue"
                  title={
                    query || activeFilterCount
<<<<<<< HEAD
                      ? `${conferences.length} result${conferences.length === 1 ? "" : "s"}`
                      : "All upcoming conferences"
                  }
                  description={
                    query || activeFilterCount
                      ? "Refine filters or clear them to see the full list."
                      : "Demo catalogue shared with the home page."
                  }
                />

                <div
                  className={
                    view === "grid" ? "grid grid-cols-2 gap-6 max-[560px]:grid-cols-1" : "grid gap-5"
                  }
                >
                  {conferences.length ? (
                    conferences.map((conference) => (
                      <ConferenceCard
                        key={conference.id}
                        conference={conference}
                        layout={view}
                      />
                    ))
                  ) : (
                    <div className="col-span-full rounded-[18px] border border-dashed border-[#ccd3df] bg-[#fafbfe] p-[35px] text-center">
                      <Search size={28} />
                      <h3>No conferences found</h3>
                      <p>Try another topic or clear your filters.</p>
                      <button className="rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white" onClick={clearFilters}>
=======
                      ? `${displayConferences.length} result${
                          displayConferences.length === 1
                            ? ""
                            : "s"
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

                    <p className="mt-2 text-xs leading-6 text-red-600">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={loadConferences}
                      className="mt-5 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!loading &&
                  !error &&
                  displayConferences.length > 0 && (
                    <div
                      className={
                        view === "grid"
                          ? "grid grid-cols-2 gap-6 max-[560px]:grid-cols-1"
                          : "grid gap-5"
                      }
                    >
                      {displayConferences.map((conference) => {
                        const isRegistered =
                          registeredConferenceIds.has(
                            String(conference.id)
                          );

                        const isRegistering =
                          registeringConferenceId === conference.id;

                        return (
                          <div
                            key={conference.id}
                            className="min-w-0"
                          >
                            <ConferenceCard
                              conference={conference}
                              layout={view}
                            />

                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                disabled={isRegistering}
                                onClick={() =>
                                  handleRegister(conference)
                                }
                                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[11px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                  isRegistered
                                    ? "border border-[#bfe5d1] bg-[#effaf4] text-[#18794e] hover:bg-[#e6f7ee]"
                                    : "border border-transparent bg-gradient-to-br from-[#6655f6] to-[#7869ff] text-white shadow-[0_8px_20px_rgba(103,87,245,.18)] hover:-translate-y-px"
                                }`}
                              >
                                {isRegistering ? (
                                  <>
                                    <LoaderCircle
                                      size={15}
                                      className="animate-spin"
                                    />
                                    Registering...
                                  </>
                                ) : isRegistered ? (
                                  <>
                                    <CheckCircle2 size={15} />
                                    View registration
                                  </>
                                ) : (
                                  <>
                                    <TicketCheck size={15} />
                                    Register to Attend
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {!loading &&
                  !error &&
                  displayConferences.length === 0 && (
                    <div className="rounded-[18px] border border-dashed border-[#ccd3df] bg-[#fafbfe] p-[35px] text-center">
                      <Search
                        size={28}
                        className="mx-auto text-[#68748b]"
                      />

                      <h3 className="mt-3 text-base font-bold text-[#0d1b3d]">
                        No conferences found
                      </h3>

                      <p className="mt-2 text-xs text-[#788398]">
                        Try another search or clear your
                        filters.
                      </p>

                      <button
                        type="button"
                        className="mt-5 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white"
                        onClick={clearFilters}
                      >
>>>>>>> origin/main
                        Clear filters
                      </button>
                    </div>
                  )}
<<<<<<< HEAD
                </div>

                {conferences.length > 0 && (
                  <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#e8ebf2] pt-4 text-[10px] text-[#788398]">
                    <span>
                      <CalendarDays size={16} /> Sorted by{" "}
                      {sortBy === "deadline"
                        ? "submission deadline"
                        : sortBy === "date"
                          ? "conference date"
                          : "name"}
                    </span>
                    <span>
                      <MapPin size={16} /> Mostly South African venues in this demo
                    </span>
                  </div>
                )}
=======

                {!loading &&
                  !error &&
                  displayConferences.length > 0 && (
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
                        {displayConferences.length} conference
                        {displayConferences.length === 1
                          ? ""
                          : "s"} available
                      </span>
                    </div>
                  )}
>>>>>>> origin/main
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#07132f] text-white/60">
        <div className="mx-auto flex min-h-[100px] w-[min(1200px,calc(100%-40px))] items-center justify-between gap-5 text-[10px] max-[560px]:block max-[560px]:py-6">
          <div>
            <div className="flex items-center gap-2.5 text-white">
<<<<<<< HEAD
              <img className="h-[34px] w-[34px] object-contain" src="/cmt-mark.png" alt="CMT logo" />
              <div className="flex flex-col leading-[1.05]">
                <strong className="text-xl tracking-[-.04em]">CMT</strong>
                <span className="mt-1 whitespace-nowrap text-[9px] text-white/70">Conference Management Tool</span>
              </div>
            </div>
            <p>Conference Management Tool</p>
          </div>
          <span>© {new Date().getFullYear()} CMT. Conference Management Tool.</span>
=======
              <img
                className="h-[34px] w-[34px] object-contain"
                src="/cmt-mark.png"
                alt="CMT logo"
              />

              <div className="flex flex-col leading-[1.05]">
                <strong className="text-xl tracking-[-.04em]">
                  CMT
                </strong>

                <span className="mt-1 whitespace-nowrap text-[9px] text-white/70">
                  Conference Management Tool
                </span>
              </div>
            </div>

            <p>Conference Management Tool</p>
          </div>

          <span>
            © {new Date().getFullYear()} CMT. Conference
            Management Tool.
          </span>
>>>>>>> origin/main
        </div>
      </footer>
    </div>
  );
}