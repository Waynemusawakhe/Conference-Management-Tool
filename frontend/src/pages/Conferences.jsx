import { useEffect, useState } from "react";
import {
  CalendarDays,
  LayoutGrid,
  List,
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
const COUNTRIES = ["South Africa"];

export default function Conferences() {
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
  };

  const clearFilters = () => {
    setQuery("");
    setFilters({ category: "", country: "", status: "", format: "" });
    getAllConferences().then((data) =>
      setConferences(sortConferences(data, sortBy))
    );
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const FilterPanel = () => (
    <aside className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between border-b border-[#e8ebf2] pb-4">
        <strong>Filters</strong>
        {activeFilterCount > 0 && (
          <button type="button" className="border-0 bg-transparent text-[11px] font-bold text-[#5c50ec]" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Research area</span>
        <select className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="">All areas</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Country</span>
        <select className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.country}
          onChange={(e) => updateFilter("country", e.target.value)}
        >
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-4 grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Status</span>
        <select className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-[10px] font-bold text-[#68748b]">
        <span>Format</span>
        <select className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
          value={filters.format}
          onChange={(e) => updateFilter("format", e.target.value)}
        >
          <option value="">All formats</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
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
              <Sparkles size={15} /> Browse conferences
            </span>
            <h1 className="my-4 max-w-[720px] text-[clamp(34px,4.4vw,54px)] font-bold leading-tight tracking-[-.05em]">Find the right conference for your research.</h1>
            <p className="max-w-[620px] text-[15px] leading-7 text-white/75">
              Search by topic, filter by status and format, and sort by
              submission deadline — the same patterns used on major CFP
              directories.
            </p>
          </div>
        </section>

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
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#8792a8]"
                  placeholder="Search by title, topic, city or acronym..."
                  aria-label="Search conferences"
                />
                <button className="min-h-11 rounded-[10px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-xs font-bold text-white" type="submit">
                  Search
                </button>
              </form>

              <div className="flex items-center gap-3 max-[700px]:mt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#dfe4ed] bg-white px-3 py-2.5 text-xs font-bold text-[#43506a] lg:hidden"
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
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    className={`grid h-10 w-10 place-items-center border-0 ${view === "list" ? "bg-[#efedff] text-[#5c50ec]" : "bg-white text-[#68748b]"}`}
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

            <div className="grid grid-cols-[220px_1fr] gap-8 max-[900px]:grid-cols-1">
              <div className="hidden lg:block">
                <FilterPanel />
              </div>

              <div className="min-w-0">
                <SectionHeading
                  eyebrow="Conference catalogue"
                  title={
                    query || activeFilterCount
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
                        Clear filters
                      </button>
                    </div>
                  )}
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
              </div>
            </div>
          </div>
        </section>
      </main>

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
    </div>
  );
}