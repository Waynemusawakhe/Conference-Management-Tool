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
    <aside className="conf-filters">
      <div className="conf-filters-header">
        <strong>Filters</strong>
        {activeFilterCount > 0 && (
          <button type="button" className="filter-clear" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>

      <label className="conf-filter-field">
        <span>Research area</span>
        <select
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

      <label className="conf-filter-field">
        <span>Country</span>
        <select
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

      <label className="conf-filter-field">
        <span>Status</span>
        <select
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

      <label className="conf-filter-field">
        <span>Format</span>
        <select
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
    <div className="site">
      <Navbar />

      <main>
        <section className="page-header">
          <div className="hero-noise" />
          <div className="container" style={{ position: "relative", zIndex: 2 }}>
            <span className="hero-kicker">
              <Sparkles size={15} /> Browse conferences
            </span>
            <h1>Find the right conference for your research.</h1>
            <p>
              Search by topic, filter by status and format, and sort by
              submission deadline — the same patterns used on major CFP
              directories.
            </p>
          </div>
        </section>

        <section className="section featured-section" id="conferences">
          <div className="container">
            {/* Toolbar */}
            <div className="conf-toolbar">
              <form
                className="search-box conf-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch();
                }}
              >
                <Search className="search-icon" size={20} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, topic, city or acronym..."
                  aria-label="Search conferences"
                />
                <button className="btn btn-primary search-submit" type="submit">
                  Search
                </button>
              </form>

              <div className="conf-toolbar-actions">
                <button
                  type="button"
                  className="btn btn-ghost conf-mobile-filter-btn"
                  onClick={() => setShowMobileFilters((v) => !v)}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>

                <label className="conf-sort">
                  <span>Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="deadline">Submission deadline</option>
                    <option value="date">Conference date</option>
                    <option value="name">Name</option>
                  </select>
                </label>

                <div className="conf-view-toggle" role="group" aria-label="View mode">
                  <button
                    type="button"
                    className={view === "grid" ? "active" : ""}
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    className={view === "list" ? "active" : ""}
                    onClick={() => setView("list")}
                    aria-label="List view"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {showMobileFilters && (
              <div className="conf-mobile-filters">
                <FilterPanel />
              </div>
            )}

            <div className="conf-layout">
              <div className="conf-sidebar">
                <FilterPanel />
              </div>

              <div className="conf-main">
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
                    view === "grid" ? "conference-grid" : "conference-list"
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
                    <div className="empty-state">
                      <Search size={28} />
                      <h3>No conferences found</h3>
                      <p>Try another topic or clear your filters.</p>
                      <button className="btn btn-primary" onClick={clearFilters}>
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>

                {conferences.length > 0 && (
                  <div className="conferences-meta-bar">
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

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <div className="brand footer-brand">
              <img className="brand-mark" src="/cmt-mark.png" alt="CMT logo" />
              <div className="brand-copy">
                <strong>CMT</strong>
                <span>Conference Management Tool</span>
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