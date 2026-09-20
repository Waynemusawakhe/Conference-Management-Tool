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
      <div className="relative w-full max-w-[680px]">
        <form className="flex min-h-[62px] w-full items-center rounded-[14px] bg-white p-1.5 shadow-[0_20px_55px_rgba(0,0,0,.18)]" onSubmit={submit}>
          <Search className="mx-[13px] shrink-0 text-[#71809a]" size={22} />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#0d1b3d] outline-none placeholder:text-[#8792a8]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search conferences by title, topic or location..."
          aria-label="Search conferences"
        />
        <button
            className={`mr-1 flex items-center gap-1.5 border-0 bg-transparent p-2.5 text-xs font-bold text-[#68748b] ${activeFilterCount ? "text-[#5c50ec]" : ""}`}
          type="button"
          onClick={() => setShowFilters((open) => !open)}
          aria-label="Open conference filters"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={18} />
          <span>Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</span>
        </button>
          <button className="min-h-[50px] min-w-[106px] rounded-[10px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] text-[13px] font-bold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)]" type="submit">
          Search
        </button>
      </form>

      {showFilters && (
          <div className="absolute right-0 top-[calc(100%+9px)] z-20 w-full max-w-[420px] rounded-[14px] border border-[#e4e8f0] bg-white p-[17px] text-[#0d1b3d] shadow-[0_18px_45px_rgba(15,28,65,.16)]" role="region" aria-label="Conference filters">
            <div className="mb-[14px] flex items-center justify-between text-xs">
            <strong>Filter conferences</strong>
              <button type="button" className="grid h-[30px] w-[30px] place-items-center rounded-lg border-0 bg-[#f4f6fa] text-[#68748b]" onClick={() => setShowFilters(false)} aria-label="Close filters">
              <X size={17} />
            </button>
          </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-[10px] font-bold text-[#68748b]">
                <span>Research area</span>
              <select
                className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                value={filters.category}
                onChange={(event) => updateFilter("category", event.target.value)}
              >
                <option value="">All areas</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>

              <label className="grid gap-1.5 text-[10px] font-bold text-[#68748b]">
              <span>Country</span>
              <select
                className="min-h-10 w-full rounded-[9px] border border-[#dfe4ed] bg-white px-2.5 text-[11px] text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                value={filters.country}
                onChange={(event) => updateFilter("country", event.target.value)}
              >
                <option value="">All countries</option>
                {countries.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </label>
          </div>

            <div className="mt-[15px] flex items-center justify-end gap-2.5">
              <button type="button" className="border-0 bg-transparent text-[11px] font-bold text-[#68748b]" onClick={clearFilters}>
              Clear filters
            </button>
              <button type="button" className="min-h-[38px] rounded-[10px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-3.5 text-xs font-bold text-white" onClick={submit}>
              Apply filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
