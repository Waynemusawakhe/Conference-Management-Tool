import { collectPages } from "../utils/pagination";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  CalendarDays,
  LayoutGrid,
  List,
  Search,
  TicketCheck,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import AttendeeHeader from "../components/AttendeeHeader";
import AttendeeSidebar from "../components/AttendeeSidebar";
import ConferenceCard from "../components/ConferenceCard";
import SectionHeading from "../components/SectionHeading";
import { conferencesApi } from "../api/conferencesApi";
import { registrationsApi } from "../api/registrationsApi";
import { useAuth } from "../hooks/useAuth";

const CATEGORIES = [
  "Technology",
  "Medicine & Health",
  "Engineering",
  "Business & Economics",
  "Science",
  "Other",
];

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const FORMATS = [
  { value: "in_person", label: "In-person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "virtual", label: "Virtual" },
];

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function getIsLive(conference) {
  const now = new Date();
  const start = new Date(conference.rawStartDate);
  const end = new Date(conference.rawEndDate || conference.rawStartDate);
  end.setHours(23, 59, 59, 999);
  return now >= start && now <= end;
}

function normaliseConference(conference) {
  return {
    ...conference,
    id: conference.id,
    code: conference.code || "",
    name: conference.name || "Untitled Conference",
    shortTitle: conference.name || conference.code || "Untitled Conference",
    description: conference.description || "Conference information and submission details.",
    category: conference.category || "Computer Science",
    topics: Array.isArray(conference.topics) ? conference.topics : [],
    format: conference.format || "",
    status: conference.submission_status || "",
    submissionDeadline: formatDate(conference.submission_deadline),
    startDate: formatDate(conference.start_date),
    endDate: formatDate(conference.end_date),
    rawStartDate: conference.start_date,
    rawEndDate: conference.end_date,
    date: formatDate(conference.start_date),
    location: conference.venue_name || "Venue to be announced",
    city: conference.city || "",
    country: conference.country || "",
    websiteLink: conference.website_link || "",
    accent: getAccent(conference.category),
    isLive: getIsLive(conference),
  };
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
  if (value.includes("engineering") || value.includes("education")) return "orange";
  return "purple";
}

function getRegistrationConferenceId(registration) {
  return (
    registration?.conference_id ??
    registration?.conferenceId ??
    registration?.conference?.id ??
    null
  );
}

function calculateTimeLeft(targetDate) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const target = new Date(targetDate).getTime();
  if (isNaN(target)) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const difference = target - Date.now();
  let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
}

function Typewriter({ text, speed = 150 }) {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCurrentText("");
    setCurrentIndex(0);
    setIsDeleting(false);
  }, [text]);

  useEffect(() => {
    let timeout;
    if (!isDeleting && currentIndex < text.length) {
      timeout = setTimeout(() => {
        setCurrentText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
    } else if (!isDeleting && currentIndex === text.length) {
      timeout = setTimeout(() => setIsDeleting(true), 3000);
    } else if (isDeleting && currentIndex > 0) {
      timeout = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1));
        setCurrentIndex((prev) => prev - 1);
      }, speed / 2);
    } else if (isDeleting && currentIndex === 0) {
      setIsDeleting(false);
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, text, speed]);

  return (
    <span>
      {currentText}
      <span className="animate-pulse text-[#8b7bff] font-light">|</span>
    </span>
  );
}

function HugeTimeBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-24 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(103,87,245,0.2)] backdrop-blur-md sm:h-32 sm:w-28">
        <span className="font-mono text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] sm:text-6xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-3 text-[10px] font-extrabold uppercase tracking-widest text-[#8b7bff] sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function HugeCountdownHero({ conference }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(conference.rawStartDate));

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(conference.rawStartDate));
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(conference.rawStartDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [conference.rawStartDate]);

  return (
    <section className="relative overflow-hidden bg-[#0a0f24] px-5 py-24 text-white lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#6757f5]/30 via-[#0a0f24] to-[#0a0f24]" />
      
      <div className="relative z-[2] mx-auto flex w-[min(1200px,100%)] flex-col items-center justify-between gap-12 lg:flex-row lg:items-center">
        
        <div className="max-w-2xl text-center lg:text-left">
          <div className="mb-6 flex items-center justify-center lg:justify-start">
            <span className="inline-flex items-center rounded-full border border-[#8b7bff]/30 bg-[#6757f5]/20 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#b9b3ff] backdrop-blur-md">
              Next Upcoming Event
            </span>
          </div>
          
          <h1 className="min-h-[120px] text-[clamp(36px,5vw,64px)] font-black leading-[1.1] tracking-[-.04em] text-white sm:min-h-[140px]">
            <Typewriter text={conference.name} />
          </h1>
          
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-white/80 lg:justify-start">
            <span className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 border border-white/10">
              <CalendarDays size={18} className="text-[#8b7bff]" /> 
              {conference.startDate}
            </span>
            <span className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 border border-white/10">
              <MapPin size={18} className="text-[#f59a43]" /> 
              {conference.city || conference.location}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col items-center lg:w-auto">
          <p className="mb-6 text-[12px] font-bold uppercase tracking-[0.2em] text-white/50">
            Starts In
          </p>
          <div className="flex gap-3 sm:gap-5">
            <HugeTimeBlock value={timeLeft.days} label="Days" />
            <HugeTimeBlock value={timeLeft.hours} label="Hours" />
            <HugeTimeBlock value={timeLeft.minutes} label="Mins" />
            <HugeTimeBlock value={timeLeft.seconds} label="Secs" />
          </div>
          
          <div className="mt-10 hidden max-w-md text-center lg:block">
            <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#b9b3ff]">Browse conferences</p>
            <p className="mt-1 text-sm font-semibold text-white/90">Find the right conference for your research.</p>
            <p className="mt-1 text-[11px] leading-5 text-white/50">Search by topic, filter by status and format, and find conferences created by organisers on the platform.</p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default function Conferences({ embedded = false }) {
  const navigate = useNavigate();
  const requestVersion = useRef(0);
  const { user, status: authStatus } = useAuth();
  const isAttendee = authStatus === "authenticated" && user?.role === "attendee";

  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("search") || "");

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
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

  const [registeredConferenceIds, setRegisteredConferenceIds] = useState(new Set());
  const [registeringConferenceId, setRegisteringConferenceId] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationError, setRegistrationError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadConferences = useCallback(
    async ({ page = 1, append = false } = {}) => {
      const version = ++requestVersion.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");

      try {
        const response = await conferencesApi.getAll({
          page,
          per_page: 50,
          search: query.trim(),
          category: filters.category,
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

  const loadMyRegistrations = useCallback(async () => {
    if (authStatus !== "authenticated" || !user?.id) {
      setRegisteredConferenceIds(new Set());
      return;
    }

    try {
      const registrationList = await collectPages(registrationsApi.getAll);
      const ownRegistrations = registrationList.filter((registration) => {
        if (registration?.user_id === undefined || registration?.user_id === null) return true;
        return String(registration.user_id) === String(user.id);
      });

      const ids = new Set(
        ownRegistrations
          .filter((registration) => registration.status !== "cancelled")
          .map(getRegistrationConferenceId)
          .filter((id) => id !== null && id !== undefined)
          .map(String),
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
      navigate("/login", { state: { from: "/conferences" } });
      return;
    }

    const conferenceId = conference?.id;

    if (!conferenceId) {
      setRegistrationError("This conference does not have a valid identifier.");
      return;
    }

    if (registeredConferenceIds.has(String(conferenceId))) {
      navigate("/my-conferences");
      return;
    }

    setRegisteringConferenceId(conferenceId);

    try {
      await registrationsApi.create({ conference_id: conferenceId });
      setRegisteredConferenceIds((current) => {
        const next = new Set(current);
        next.add(String(conferenceId));
        return next;
      });
      setRegistrationMessage(`You are now registered for ${conference.name || "this conference"}.`);
    } catch (err) {
      const validationMessage = Object.values(err?.errors || {}).flat().filter(Boolean).join(" ");
      setRegistrationError(validationMessage || err?.message || "Unable to register for this conference.");
    } finally {
      setRegisteringConferenceId(null);
    }
  };

  const displayConferences = useMemo(() => {
    let result = conferences.map(normaliseConference);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    result = result.filter((c) => {
      if (!c.rawStartDate) return true;
      const endDate = c.rawEndDate ? new Date(c.rawEndDate) : new Date(c.rawStartDate);
      return endDate.getTime() >= today.getTime();
    });


    return result;
  }, [conferences]);

  const upcomingConference = useMemo(() => {
    if (!displayConferences.length) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = displayConferences
      .filter((c) => c.rawStartDate && new Date(c.rawStartDate).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.rawStartDate).getTime() - new Date(b.rawStartDate).getTime());

    return upcoming.length > 0 ? upcoming[0] : null;
  }, [displayConferences]);

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const clearFilters = () => {
    setQuery("");
    setFilters({ category: "", status: "", format: "" });
  };

  const hasActiveFilters = Boolean(query.trim()) || Boolean(filters.category) || Boolean(filters.status) || Boolean(filters.format);
  const showAttendeeChrome = isAttendee && !embedded;

  return (
    <div className={embedded ? "text-[#0d1b3d]" : "min-h-screen overflow-clip bg-[#f7f9fc] text-[#0d1b3d]"}>
      {!embedded &&
        (isAttendee ? (
          <AttendeeHeader
            name={user?.name || user?.full_name}
            menuOpen={sidebarOpen}
            onMenuToggle={() => setSidebarOpen((value) => !value)}
          />
        ) : (
          <Navbar />
        ))}

      <div className={showAttendeeChrome ? "mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7" : ""}>
        {showAttendeeChrome && <AttendeeSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className={showAttendeeChrome ? "min-w-0 flex-1" : ""}>
          
          {!embedded && (
            upcomingConference && !loading ? (
              <HugeCountdownHero conference={upcomingConference} />
            ) : (
              <section className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-5 py-24 text-white">
                <div className="relative z-[2] mx-auto flex w-[min(1200px,100%)] flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#b9b3ff]">
                      Browse conferences
                    </span>
                    <h1 className="my-4 max-w-[720px] text-[clamp(34px,4.4vw,54px)] font-bold leading-tight tracking-[-.05em]">
                      Find the right conference for your research.
                    </h1>
                    <p className="max-w-[620px] text-[15px] leading-7 text-white/75">
                      Search by topic, filter by status and format, and find conferences created by organisers on the platform.
                    </p>
                  </div>
                </div>
              </section>
            )
          )}

          {embedded && (
            <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-6 py-10 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:px-8">
              <div className="relative z-[2]">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
                  Browse conferences
                </span>
                <h1 className="mb-2 mt-3 text-[clamp(24px,3.4vw,36px)] font-bold leading-tight tracking-[-.04em]">
                  Find the right conference for your research.
                </h1>
                <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
                  Search by topic, filter by status and format, and find conferences created by organisers on the platform.
                </p>
              </div>
            </section>
          )}

          <section className={embedded ? "mt-6 rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] sm:p-6" : "bg-white px-5 py-[88px]"} id="conferences">
            <div className={embedded ? "" : "mx-auto w-[min(1200px,100%)]"}>
              
              {/* UNIFIED FILTER TOOLBAR */}
              <div className="mb-8 flex flex-wrap items-center gap-2 rounded-[16px] border border-[#e4e8f0] bg-white p-2 shadow-sm xl:flex-nowrap">
                
                <div className="relative flex min-w-[200px] flex-1 items-center">
                  <Search className="absolute left-3 text-[#71809a]" size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-10 w-full rounded-lg bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-[#8792a8] focus:bg-[#f7f9fc]"
                    aria-label="Search conferences"
                    placeholder="Search conferences..."
                  />
                </div>

                <div className="hidden h-6 w-px bg-[#e4e8f0] xl:block" />

                <select
                  className="h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3 text-xs font-semibold text-[#43506a] outline-none hover:bg-[#f7f9fc] focus:bg-[#f7f9fc]"
                  aria-label="Category"
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  className="h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3 text-xs font-semibold text-[#43506a] outline-none hover:bg-[#f7f9fc] focus:bg-[#f7f9fc]"
                  aria-label="Status"
                  value={filters.status}
                  onChange={(e) => updateFilter("status", e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                <select
                  className="h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3 text-xs font-semibold text-[#43506a] outline-none hover:bg-[#f7f9fc] focus:bg-[#f7f9fc]"
                  aria-label="Format"
                  value={filters.format}
                  onChange={(e) => updateFilter("format", e.target.value)}
                >
                  <option value="">All Formats</option>
                  {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-1 rounded-lg px-3 py-2 text-xs font-bold text-[#ef4444] hover:bg-red-50"
                  >
                    Clear
                  </button>
                )}

                <div className="ml-auto hidden h-6 w-px bg-[#e4e8f0] xl:block" />

                <select
                  className="h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3 text-xs font-semibold text-[#43506a] outline-none hover:bg-[#f7f9fc] focus:bg-[#f7f9fc]"
                  aria-label="Sort by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="deadline">Deadline</option>
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                </select>

                <div className="flex overflow-hidden rounded-lg border border-[#dfe4ed] bg-white">
                  <button
                    type="button"
                    className={`grid h-10 w-10 place-items-center transition ${view === "grid" ? "bg-[#efedff] text-[#5c50ec]" : "bg-transparent text-[#68748b] hover:bg-[#f7f9fc]"}`}
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    className={`grid h-10 w-10 place-items-center transition ${view === "list" ? "bg-[#efedff] text-[#5c50ec]" : "bg-transparent text-[#68748b] hover:bg-[#f7f9fc]"}`}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    onClick={() => setView("list")}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>

              {!upcomingConference && !loading && conferences.length > 0 && (
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-[#f0f2f6] px-4 py-3 text-[11px] font-semibold text-[#66728b]">
                  <Clock size={14} /> No upcoming conferences found. All listed events are in the past.
                </div>
              )}

              {registrationMessage && (
                <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#bfe5d1] bg-[#effaf4] px-4 py-3 text-xs font-semibold text-[#18794e]">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} /> {registrationMessage}
                  </span>
                  <button type="button" onClick={() => navigate("/my-conferences")} className="rounded-lg bg-white px-3 py-2 text-[10px] font-extrabold text-[#18794e] shadow-sm">
                    View My Conferences
                  </button>
                </div>
              )}

              {registrationError && (
                <div role="alert" className="mb-6 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {registrationError}
                </div>
              )}

              <SectionHeading
                eyebrow="Conference catalogue"
                title={
                  hasActiveFilters
                    ? `${displayConferences.length} result${displayConferences.length === 1 ? "" : "s"}`
                    : "All conferences"
                }
                description={
                  hasActiveFilters
                    ? "Refine your search or clear the filters to see all conferences."
                    : "Live conference data from the Conference Management Tool."
                }
              />

              {loading && (
                <div className="rounded-[18px] border border-[#e4e8f0] bg-[#fafbfe] p-10 text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#e5e3ff] border-t-[#6655f6]" />
                  <h3 className="text-sm font-bold text-[#0d1b3d]">Loading conferences...</h3>
                  <p className="mt-1 text-xs text-[#788398]">Fetching the latest conferences.</p>
                </div>
              )}

              {!loading && error && (
                <div className="rounded-[18px] border border-red-200 bg-red-50 p-8 text-center">
                  <h3 className="text-sm font-bold text-red-700">Unable to load conferences</h3>
                  <p className="mt-2 text-xs leading-6 text-red-600">{error}</p>
                  <button type="button" onClick={() => loadConferences()} className="mt-5 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white">
                    Try again
                  </button>
                </div>
              )}

              {!loading && displayConferences.length > 0 && (
                <div className={view === "grid" ? "grid grid-cols-2 gap-6 max-[560px]:grid-cols-1" : "grid gap-5"}>
                  {displayConferences.map((conference) => {
                    const isRegistered = registeredConferenceIds.has(String(conference.id));
                    const isRegistering = registeringConferenceId === conference.id;

                    return (
                      <div key={conference.id} className="min-w-0">
                        <ConferenceCard conference={conference} layout={view} />
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            disabled={isRegistering}
                            onClick={() => handleRegister(conference)}
                            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[11px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              isRegistered
                                ? "border border-[#bfe5d1] bg-[#effaf4] text-[#18794e] hover:bg-[#e6f7ee]"
                                : "border border-transparent bg-gradient-to-br from-[#6655f6] to-[#7869ff] text-white shadow-[0_8px_20px_rgba(103,87,245,.18)] hover:-translate-y-px"
                            }`}
                          >
                            {isRegistering ? (
                              <><LoaderCircle size={15} className="animate-spin" /> Registering...</>
                            ) : isRegistered ? (
                              <><CheckCircle2 size={15} /> View registration</>
                            ) : (
                              <><TicketCheck size={15} /> Register to Attend</>
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
                  <h3 className="mt-3 text-base font-bold text-[#0d1b3d]">No conferences found</h3>
                  <p className="mt-2 text-xs text-[#788398]">Try another search or clear your filters.</p>
                  <button type="button" className="mt-5 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              )}

              {!loading && !error && displayConferences.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#e8ebf2] pt-4 text-[10px] text-[#788398]">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={16} />
                    Sorted by {sortBy === "deadline" ? "submission deadline" : sortBy === "date" ? "conference date" : "name"}
                  </span>
                  <span>
                    {displayConferences.length} of {totalConferences} conferences loaded
                  </span>
                </div>
              )}

              {!loading && hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => loadConferences({ page: currentPage + 1, append: true })}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#dfe4ed] bg-white px-5 text-[11px] font-extrabold text-[#5649dc] transition hover:bg-[#f7f6ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMore ? "Loading..." : "Load more conferences"}
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {!embedded && (
        <footer className="bg-[#07132f] text-white/60">
          <div className="mx-auto flex min-h-[100px] w-[min(1200px,calc(100%-40px))] items-center justify-between gap-5 text-[10px] max-[560px]:block max-[560px]:py-6">
            <div>
              <div className="flex items-center gap-2.5 text-white">
                <img className="h-[34px] w-[34px] object-contain" src="/cmt-mark.png" alt="CMT logo" />
                <div className="flex flex-col leading-[1.05]">
                  <strong className="text-xl tracking-[-.04em]">CMT</strong>
                  <span className="mt-1 whitespace-nowrap text-[9px] text-white/70">Conference Management Tool</span>
                </div>
              </div>
              <p>Conference Management Tool</p>
            </div>
            <span>© {new Date().getFullYear()} CMT. Conference Management Tool.</span>
          </div>
        </footer>
      )}
    </div>
  );
}