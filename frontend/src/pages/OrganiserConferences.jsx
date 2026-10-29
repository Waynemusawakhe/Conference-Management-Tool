import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, Loader2, MapPin, Pencil, Plus, Search, Trash2,
} from "lucide-react";
import OrganiserLayout from "../components/OrganiserLayout";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";

const unwrapList = (r) => (Array.isArray(r) ? r : r?.data || []);
const dateLabel = (v) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function OrganiserConferences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await conferencesApi.getAll({ per_page: 100 });
      const mine = unwrapList(res).filter(
        (c) =>
          Number(c.organiser_id) === Number(user?.id) ||
          Number(c.organiser?.id) === Number(user?.id)
      );
      setItems(mine);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const l = location.trim().toLowerCase();
    return items.filter(
      (c) =>
        (!q || (c.name || "").toLowerCase().includes(q)) &&
        (!l ||
          (c.city || "").toLowerCase().includes(l) ||
          (c.country || "").toLowerCase().includes(l))
    );
  }, [items, query, location]);

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    try {
      await conferencesApi.remove(c.id);
      await load();
    } catch (e) {
      alert(e?.message || "Unable to delete conference.");
    }
  };

  const inputBase =
    "h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] text-[11px] outline-none dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white";

  return (
    <OrganiserLayout>
      <section className="rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">
              Conference management
            </span>
            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">
              All my conferences
            </h2>
          </div>
          <button
            onClick={() => navigate("/create-conference")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"
          >
            <Plus size={16} /> New conference
          </button>
        </div>

        {/* Search + location filter — matches the All Conferences wireframe */}
        <div className="flex flex-wrap gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className={`${inputBase} w-full pl-9 pr-3`}
            />
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Filter: location…"
            className={`${inputBase} w-[220px] px-3`}
          />
        </div>

        {loading ? (
          <div className="grid place-items-center py-20 text-[12px] font-semibold text-[#7c879a] dark:text-[#94a3b8]">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading conferences…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays size={22} className="mx-auto text-[#aab2c0] dark:text-[#64748b]" />
            <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">
              No conferences found
            </h3>
            <p className="m-0 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
              Create your first conference or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
            {filtered.map((c) => (
              <article
                key={c.id}
                className="flex flex-col rounded-[17px] border border-[#e9ecf2] bg-[#fafbfe] p-5 dark:border-[#1e293b] dark:bg-[#0b1224]"
              >
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#6757f5] dark:text-[#a9a2ff]">
                  {c.code}
                </span>
                <h3 className="mb-0 mt-1 line-clamp-2 text-sm font-bold text-[#0d1b3d] dark:text-white">
                  {c.name}
                </h3>
                <p className="mb-0 mt-2 flex items-center gap-1.5 text-[10px] text-[#7e899c] dark:text-[#94a3b8]">
                  <CalendarDays size={12} /> {dateLabel(c.start_date)} — {dateLabel(c.end_date)}
                </p>
                <p className="mb-0 mt-1 flex items-center gap-1.5 text-[10px] text-[#7e899c] dark:text-[#94a3b8]">
                  <MapPin size={12} /> {c.city}, {c.country}
                </p>

                <div className="mt-4 flex gap-2 border-t border-[#edf0f5] pt-4 dark:border-[#1e293b]">
                  <button
                    onClick={() => navigate(`/edit-conference/${c.id}`)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dfe4ed] bg-white px-3 py-2 text-[10px] font-extrabold text-[#58647b] transition hover:-translate-y-px dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#94a3b8]"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-extrabold text-red-700 transition hover:-translate-y-px dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"
                    aria-label="Delete conference"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </OrganiserLayout>
  );
}