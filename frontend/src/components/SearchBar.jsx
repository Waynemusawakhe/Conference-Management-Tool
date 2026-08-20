import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

const categories = [
  "AI & Machine Learning",
  "Engineering",
  "Medicine & Health",
];

const countries = ["South Africa"];

export default function SearchBar({
  value,
  onChange,
  onSearch,
  filters = { category: "", country: "" },
  onFiltersChange,
}) {
  const [showFilters, setShowFilters] = useState(false);

  const submit = (event) => {
    event?.preventDefault();
    onSearch?.();
    setShowFilters(false);
  };

  const updateFilter = (key, nextValue) => {
    onFiltersChange?.({ ...filters, [key]: nextValue });
  };

  const clearFilters = () => {
    onFiltersChange?.({ category: "", country: "" });
  };

  const activeFilterCount = [filters.category, filters.country].filter(Boolean).length;

  return (
    <div className="search-wrapper">
      <form className="search-box" onSubmit={submit}>
        <Search className="search-icon" size={22} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search conferences by title, topic or location..."
          aria-label="Search conferences"
        />
        <button
          className={`search-filter ${activeFilterCount ? "has-filters" : ""}`}
          type="button"
          onClick={() => setShowFilters((open) => !open)}
          aria-label="Open conference filters"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={18} />
          <span>Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</span>
        </button>
        <button className="btn btn-primary search-submit" type="submit">
          Search
        </button>
      </form>

      {showFilters && (
        <div className="filter-panel" role="region" aria-label="Conference filters">
          <div className="filter-panel-header">
            <strong>Filter conferences</strong>
            <button type="button" className="filter-close" onClick={() => setShowFilters(false)} aria-label="Close filters">
              <X size={17} />
            </button>
          </div>

          <div className="filter-fields">
            <label>
              <span>Research area</span>
              <select
                value={filters.category}
                onChange={(event) => updateFilter("category", event.target.value)}
              >
                <option value="">All areas</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>

            <label>
              <span>Country</span>
              <select
                value={filters.country}
                onChange={(event) => updateFilter("country", event.target.value)}
              >
                <option value="">All countries</option>
                {countries.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </label>
          </div>

          <div className="filter-panel-actions">
            <button type="button" className="filter-clear" onClick={clearFilters}>
              Clear filters
            </button>
            <button type="button" className="btn btn-primary filter-apply" onClick={submit}>
              Apply filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
