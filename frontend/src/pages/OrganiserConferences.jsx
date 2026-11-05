import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import OrganiserLayout from "../components/OrganiserLayout";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";

const unwrapList = (r) => (Array.isArray(r) ? r : r?.data || []);
const dateLabel = (v) =>
  v
    ? new Date(v).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function DeleteConfirmModal({ open, conference, busy, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-[#030814]/75 p-4 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        className="w-full max-w-[440px] overflow-hidden rounded-[22px] bg-white shadow-[0_40px_120px_rgba(3,8,20,.5)] dark:bg-[#0f172a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-[#2a1218] dark:text-[#f08a9a]">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-extrabold leading-tight text-[#0d1b3d] dark:text-white">
              Delete this conference?
            </h2>
            <p className="mt-2 text-[12px] leading-6 text-[#66728b] dark:text-[#94a3b8]">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#0d1b3d] dark:text-white">
                "{conference?.name || "this conference"}"
              </strong>
              ? This will remove all related submissions, reviews and
              registrations. This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#9aa3b2] transition hover:bg-[#07132f] hover:text-white disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#edf0f5] bg-[#fafbfe] px-6 py-4 dark:border-[#1e293b] dark:bg-[#0b1224]">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-[#dfe4ed] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#59657d] transition hover:bg-[#07132f] hover:text-white disabled:opacity-50 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#e11d48] to-[#be123c] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(225,29,72,.28)] transition hover:from-[#9f1239] hover:to-[#881337] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={13} /> Delete conference
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganiserConferences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await conferencesApi.getAll({ per_page: 100 });
      const mine = unwrapList(res).filter(
        (c) =>
          Number(c.organiser_id) === Number(user?.id) ||
          Number(c.organiser?.id) === Number(user?.id),
      );
      setItems(mine);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(""), 4000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(""), 6000);
    return () => window.clearTimeout(t);
  }, [error]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const l = location.trim().toLowerCase();
    return items.filter(
      (c) =>
        (!q || (c.name || "").toLowerCase().includes(q)) &&
        (!l ||
          (c.city || "").toLowerCase().includes(l) ||
          (c.country || "").toLowerCase().includes(l)),
    );
  }, [items, query, location]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError("");
    try {
      await conferencesApi.remove(deleteTarget.id);
      setFeedback(`"${deleteTarget.name}" was deleted successfully.`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e?.message || "Unable to delete conference.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const inputBase =
    "h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] text-[11px] outline-none transition focus:border-[#07132f] focus:ring-2 focus:ring-[#07132f]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white";

  return (
    <OrganiserLayout>
      {feedback && (
        <div
          role="status"
          className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-xs font-semibold text-[#18794e] dark:border-[#0a3b26] dark:bg-[#052e1f] dark:text-[#34d399]"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} /> {feedback}
          </span>
          <button
            type="button"
            onClick={() => setFeedback("")}
            aria-label="Dismiss"
            className="text-[#18794e] hover:text-[#0a3b26] dark:text-[#34d399]"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:from-[#4a3ec9] hover:to-[#5b4be0]"
          >
            <Plus size={16} /> New conference
          </button>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
            />
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
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading
            conferences…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays
              size={22}
              className="mx-auto text-[#aab2c0] dark:text-[#64748b]"
            />
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
                className="flex flex-col rounded-[17px] border border-[#e9ecf2] bg-[#fafbfe] p-5 transition hover:border-[#07132f] hover:shadow-[0_10px_24px_rgba(7,19,47,.08)] dark:border-[#1e293b] dark:bg-[#0b1224] dark:hover:border-[#334155]"
              >
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#6757f5] dark:text-[#a9a2ff]">
                  {c.code}
                </span>
                <h3 className="mb-0 mt-1 line-clamp-2 text-sm font-bold text-[#0d1b3d] dark:text-white">
                  {c.name}
                </h3>
                <p className="mb-0 mt-2 flex items-center gap-1.5 text-[10px] text-[#7e899c] dark:text-[#94a3b8]">
                  <CalendarDays size={12} /> {dateLabel(c.start_date)} —{" "}
                  {dateLabel(c.end_date)}
                </p>
                <p className="mb-0 mt-1 flex items-center gap-1.5 text-[10px] text-[#7e899c] dark:text-[#94a3b8]">
                  <MapPin size={12} /> {c.city}, {c.country}
                </p>

                <div className="mt-4 flex gap-2 border-t border-[#edf0f5] pt-4 dark:border-[#1e293b]">
                  <button
                    onClick={() => navigate(`/edit-conference/${c.id}`)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dfe4ed] bg-white px-3 py-2 text-[10px] font-extrabold text-[#58647b] transition hover:bg-[#07132f] hover:text-white dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-extrabold text-red-700 transition hover:bg-[#7f1d1d] hover:text-white dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a] dark:hover:bg-[#7f1d1d]"
                    aria-label="Delete conference"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        conference={deleteTarget}
        busy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />
    </OrganiserLayout>
  );
}