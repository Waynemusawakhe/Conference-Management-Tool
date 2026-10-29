import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Loader2,
  Search,
  Ticket,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDate, formatDateTime } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { registrationsApi } from "../api/registrationsApi";
import { AdminTableToolbar, SortableTh, useAdminTableControls } from "../components/AdminTableControls";

const REGISTRATION_COLUMNS = [
  { key: "attendee", label: "Attendee" },
  { key: "conference", label: "Conference" },
  { key: "status", label: "Status" },
  { key: "registered", label: "Registered" },
  { key: "actions", label: "Actions" },
];

const regConfName = (r) =>
  r.conference?.name ??
  r.conference?.title ??
  r.conference_name ??
  `Conference #${r.conference_id ?? "?"}`;
const regUserName = (r) =>
  r.user?.name ??
  r.user?.full_name ??
  r.user_name ??
  r.attendee?.name ??
  `User #${r.user_id ?? "?"}`;
const regUserEmail = (r) => r.user?.email ?? r.user_email ?? r.email ?? "—";
const regStatus = (r) => String(r.status ?? "registered").toLowerCase();
const regConferenceId = (r) => r.conference_id ?? r.conference?.id ?? null;

const STATUS_TONES = {
  registered: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  confirmed: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  cancelled: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  canceled: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
};

function statusTone(status) {
  return STATUS_TONES[status] ?? "border-[#e2e6ee] bg-[#f5f6fa] text-[#59657d]";
}

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function StatStrip({ registrations }) {
  const counts = useMemo(() => {
    const c = { total: registrations.length, conferences: new Set(), uniqueUsers: new Set() };
    registrations.forEach((r) => {
      const cid = regConferenceId(r);
      if (cid != null) c.conferences.add(cid);
      const uid = r.user_id ?? r.user?.id;
      if (uid != null) c.uniqueUsers.add(uid);
    });
    return c;
  }, [registrations]);

  const items = [
    { label: "Total registrations", value: counts.total, icon: <Ticket size={14} />, tone: "text-[#4f46c7] bg-[#efedff]" },
    { label: "Conferences", value: counts.conferences.size, icon: <CalendarDays size={14} />, tone: "text-[#1d5fa8] bg-[#eef5fd]" },
    { label: "Unique attendees", value: counts.uniqueUsers.size, icon: <Users size={14} />, tone: "text-[#18794e] bg-[#effaf4]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-[14px] border border-[#e4e8f0] bg-white p-3 shadow-[0_6px_18px_rgba(15,28,65,.03)]">
          <span className={`inline-grid h-7 w-7 place-items-center rounded-lg ${it.tone}`}>{it.icon}</span>
          <strong className="mt-3 block text-[18px] leading-none tracking-[-.03em] text-[#1c2a4a]">{it.value}</strong>
          <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingRows({ rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-[#f0f2f6] last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-[#eef1f7]" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-32 animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="h-2 w-40 animate-pulse rounded-full bg-[#eef1f7]" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="h-2.5 w-40 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-2.5 w-24 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-6 py-4"><div className="ml-auto h-6 w-20 animate-pulse rounded-lg bg-[#eef1f7]" /></td>
    </tr>
  ));
}

function ConfirmCancelModal({ registration, onClose, onConfirm, isCancelling }) {
  if (!registration) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)] animate-[scaleIn_.15s_ease-out]">
        <div className="flex flex-col items-center p-6 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-[18px] font-extrabold text-[#1c2a4a]">Cancel registration?</h2>
          <p className="mt-2 text-[12px] leading-6 text-[#66728b]">
            Are you sure you want to cancel the registration for <strong>{regUserName(registration)}</strong> to <strong>{regConfName(registration)}</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#edf0f5] bg-[#fafbfe] p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-4 text-[12px] font-extrabold text-[#5c6880] transition hover:bg-[#f3f5f9] disabled:opacity-50"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(220,38,38,.25)] transition hover:bg-red-700 hover:shadow-[0_12px_25px_rgba(220,38,38,.35)] disabled:opacity-50"
          >
            {isCancelling ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Cancelling...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Yes, cancel
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function AdminRegistrationsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");
  const [feedback, setFeedback] = useState(null);
  
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const regRes = useApiResource(() => registrationsApi.getAll(), []);
  const registrations = useMemo(() => toArray(regRes.data), [regRes.data]);
  const table = useAdminTableControls("registrations", REGISTRATION_COLUMNS);

  const uniqueConferences = useMemo(() => {
    const map = new Map();
    registrations.forEach((r) => {
      const cid = regConferenceId(r);
      if (cid && !map.has(cid)) {
        map.set(cid, regConfName(r));
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [registrations]);

  const statuses = useMemo(() => {
    const set = new Set();
    registrations.forEach((r) => set.add(regStatus(r)));
    return Array.from(set);
  }, [registrations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registrations.filter((r) => {
      const st = regStatus(r);
      const cid = regConferenceId(r);

      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (conferenceFilter !== "all" && String(cid) !== String(conferenceFilter)) return false;
      
      if (!q) return true;
      return [regUserName(r), regUserEmail(r), regConfName(r), String(r.id ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [registrations, query, statusFilter, conferenceFilter]);

  const visibleRegistrations = table.sortRows(filtered, {
    attendee: (registration) => regUserName(registration),
    conference: (registration) => regConfName(registration),
    status: (registration) => regStatus(registration),
    registered: (registration) => registration.created_at ?? registration.registered_at,
  });
  const visibleColumnCount = REGISTRATION_COLUMNS.filter((column) => table.columnVisible(column.key)).length;

  const requestCancel = (r) => {
    setCancelTarget(r);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    
    setIsCancelling(true);
    setFeedback(null);
    
    try {
      await registrationsApi.remove(cancelTarget.id);
      await regRes.reload();
      setFeedback({ type: "success", message: "Registration cancelled successfully." });
      setCancelTarget(null);
    } catch (err) {
      setFeedback({ type: "error", message: err?.message ?? "Failed to cancel." });
      setCancelTarget(null);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AdminLayout subtitle="Platform" title="Registrations">
      {feedback && (
        <div role="alert" className={`mb-4 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[11px] font-semibold ${feedback.type === "success" ? "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]" : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {!regRes.loading && !regRes.error && registrations.length > 0 && (
        <div className="mb-5"><StatStrip registrations={registrations} /></div>
      )}

      <Card className="overflow-hidden w-full max-w-full border-0 ring-1 ring-[#eef1f7] shadow-[0_20px_60px_-30px_rgba(23,35,66,.18)]">
        <CardHeader
          eyebrow="Manage"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6655f6] to-[#8b7bff] text-white shadow-[0_8px_18px_-6px_rgba(102,85,246,.55)]">
                <Ticket size={14} />
              </span>
              {filtered.length === registrations.length
                ? `${registrations.length} registration${registrations.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${registrations.length} registrations`}
            </span>
          }
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Search attendee..." 
                  className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-9 text-[11px] outline-none transition focus:border-[#8175ef] focus:bg-white focus:ring-2 focus:ring-[#8175ef]/10" 
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[#98a1b3] hover:bg-[#eef1f7] hover:text-[#5c6880]" aria-label="Clear search"><X size={12} /></button>
                )}
              </div>
              
              <div className="relative w-full sm:w-[220px]">
                <select
                  value={conferenceFilter}
                  onChange={(e) => setConferenceFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-3 pr-9 text-[11px] font-semibold text-[#59657d] outline-none focus:border-[#8175ef]"
                >
                  <option value="all">All Conferences</option>
                  {uniqueConferences.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={14} />
              </div>
            </div>
          }
        />

        {statuses.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-[#edf0f5] px-5 py-3 sm:px-6">
            <button
              onClick={() => setStatusFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${statusFilter === "all" ? "border-transparent bg-[#07132f] text-white shadow-[0_6px_18px_rgba(7,19,47,.18)]" : "border-[#e2e6ee] bg-white text-[#66728b] hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"}`}
            >
              All
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${statusFilter === "all" ? "bg-white/20 text-white" : "bg-[#f1efff] text-[#5649dc]"}`}>{registrations.length}</span>
            </button>
            {statuses.map((s) => {
              const isActive = statusFilter === s;
              const count = registrations.filter((r) => regStatus(r) === s).length;
              return (
                <button key={s} onClick={() => setStatusFilter(s)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold capitalize transition ${isActive ? "border-transparent bg-[#07132f] text-white shadow-[0_6px_18px_rgba(7,19,47,.18)]" : "border-[#e2e6ee] bg-white text-[#66728b] hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"}`}>
                  {s}
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${isActive ? "bg-white/20 text-white" : "bg-[#f1efff] text-[#5649dc]"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <AdminTableToolbar columns={REGISTRATION_COLUMNS} controls={table} />
        
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table data-table-density={table.density} className="cmt-registration-table admin-data-table w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f5] bg-gradient-to-b from-[#fafbff] to-[#f4f6fb] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                {table.columnVisible("attendee") && <SortableTh column={REGISTRATION_COLUMNS[0]} controls={table} className="sticky left-0 z-20 bg-[#fafbff] px-6 py-2.5 dark:bg-[#0f172a]" />}
                {table.columnVisible("conference") && <SortableTh column={REGISTRATION_COLUMNS[1]} controls={table} className="cmt-registration-conference whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("status") && <SortableTh column={REGISTRATION_COLUMNS[2]} controls={table} className="cmt-registration-status whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("registered") && <SortableTh column={REGISTRATION_COLUMNS[3]} controls={table} className="cmt-registration-date whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("actions") && <th className="cmt-registration-actions px-6 py-2.5 text-right whitespace-nowrap">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {regRes.loading && <LoadingRows />}

              {!regRes.loading && regRes.error && (
                <tr><td colSpan={visibleColumnCount}><StateBlock kind="error" message={regRes.error.message} onRetry={regRes.reload} /></td></tr>
              )}

              {!regRes.loading && !regRes.error && filtered.length === 0 && (
                <tr>
                  <td colSpan={visibleColumnCount}>
                    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]"><Ticket size={22} /></span>
                      <h3 className="m-0 text-[13px] font-bold text-[#1c2a4a]">{registrations.length === 0 ? "No registrations yet" : "No matches"}</h3>
                      <p className="m-0 max-w-[400px] text-[11px] leading-5 text-[#8993a6]">
                        {registrations.length === 0
                          ? "When attendees register for conferences, they'll appear here."
                          : "Try a different filter or clear the search."}
                      </p>
                      {registrations.length > 0 && (query || statusFilter !== "all" || conferenceFilter !== "all") && (
                        <button
                          onClick={() => { setQuery(""); setStatusFilter("all"); setConferenceFilter("all"); }}
                          className="mt-1 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!regRes.loading && !regRes.error && visibleRegistrations.map((r) => {
                const name = regUserName(r);
                const status = regStatus(r);
                return (
                  <tr key={r.id} className="cmt-admin-list-row admin-registration-row group border-b border-[#f0f2f6] transition-colors last:border-0 hover:bg-[#fafbff]">
                    {table.columnVisible("attendee") && <td className="cmt-registration-attendee sticky left-0 z-10 bg-white px-6 py-4 dark:bg-[#0f172a]">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#efedff] text-[10px] font-extrabold text-[#4f46c7]">
                          {getInitials(name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <strong className="block truncate text-[11px] font-bold text-[#1c2a4a]">{name}</strong>
                          <span className="block truncate text-[10px] text-[#8a95a8]">{regUserEmail(r)}</span>
                          <div className="cmt-registration-mobile-meta mt-2 hidden min-w-0 flex-wrap items-center gap-2">
                            {table.columnVisible("conference") && <span className="w-full break-words text-[11px] leading-5 text-[#5c6880]">{regConfName(r)}</span>}
                            <div className="flex w-full flex-wrap items-center justify-between gap-2">
                              {table.columnVisible("status") && <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${statusTone(status)}`}>{status}</span>}
                              {table.columnVisible("registered") && <span className="text-[10px] text-[#7b869b]">{formatDate(r.created_at ?? r.registered_at)}</span>}
                            </div>
                            {table.columnVisible("actions") && <button onClick={() => requestCancel(r)} className="cmt-registration-mobile-cancel mt-1 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 text-[11px] font-bold text-red-600 transition hover:bg-red-100" aria-label={`Cancel registration for ${name}`}><Trash2 size={14} /> Cancel registration</button>}
                          </div>
                        </div>
                      </div>
                    </td>}
                    {table.columnVisible("conference") && <td className="cmt-registration-conference px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#5c6880]">
                        <CalendarDays size={12} className="text-[#aeb6c6]" />
                        <span className="max-w-[220px] truncate">{regConfName(r)}</span>
                      </span>
                    </td>}
                    {table.columnVisible("status") && <td className="cmt-registration-status px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${statusTone(status)}`}>
                        {status}
                      </span>
                    </td>}
                    {table.columnVisible("registered") && <td className="cmt-registration-date px-4 py-4 text-[10px] text-[#7b869b]">
                      {formatDate(r.created_at ?? r.registered_at)}
                    </td>}
                    {table.columnVisible("actions") && <td className="cmt-registration-actions px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => requestCancel(r)}
                        className="cmt-registration-desktop-cancel inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-100"
                        aria-label={`Cancel registration for ${name}`}
                      >
                        <Trash2 size={12} /> Cancel
                      </button>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmCancelModal
        registration={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        isCancelling={isCancelling}
      />

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 14px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 3px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </AdminLayout>
  );
}