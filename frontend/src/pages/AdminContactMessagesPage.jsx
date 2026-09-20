import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Inbox,
  Mail,
  Search,
  Trash2,
  X,
  MailOpen,
  CheckCircle2,
  Clock,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDateTime } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { contactMessagesApi } from "../api/contactMessagesApi";

const STATUS_CONFIG = {
  new: {
    label: "New",
    chip: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
    icon: "text-[#5c50ec] bg-[#efedff]",
  },
  in_progress: {
    label: "In progress",
    chip: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
    icon: "text-[#9b7414] bg-[#fff9e9]",
  },
  resolved: {
    label: "Resolved",
    chip: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
    icon: "text-[#18794e] bg-[#effaf4]",
  },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

function statusKey(raw) {
  if (!raw) return "new";
  return String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
}
function statusConfig(raw) {
  return STATUS_CONFIG[statusKey(raw)] ?? STATUS_CONFIG.new;
}

function StatStrip({ counts }) {
  const items = [
    { label: "Total", value: counts.all, icon: <Inbox size={14} />, tone: "text-[#4f46c7] bg-[#efedff]" },
    { label: "New", value: counts.new, icon: <Mail size={14} />, tone: "text-[#5548d7] bg-[#f0efff]" },
    { label: "In progress", value: counts.in_progress, icon: <Clock size={14} />, tone: "text-[#9b7414] bg-[#fff9e9]" },
    { label: "Resolved", value: counts.resolved, icon: <CheckCircle2 size={14} />, tone: "text-[#18794e] bg-[#effaf4]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-[14px] border border-[#e4e8f0] bg-white p-3 shadow-[0_6px_18px_rgba(15,28,65,.03)]"
        >
          <span className={`inline-grid h-7 w-7 place-items-center rounded-lg ${it.tone}`}>
            {it.icon}
          </span>
          <strong className="mt-3 block text-[18px] leading-none tracking-[-.03em] text-[#1c2a4a]">
            {it.value}
          </strong>
          <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
            {it.label}
          </span>
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
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="h-2 w-36 animate-pulse rounded-full bg-[#eef1f7]" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="h-2.5 w-56 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-2.5 w-24 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-6 py-4"><div className="ml-auto h-6 w-6 animate-pulse rounded-full bg-[#eef1f7]" /></td>
    </tr>
  ));
}

export default function ContactMessagesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const messagesRes = useApiResource(() => contactMessagesApi.getAll(), []);
  const messages = useMemo(() => toArray(messagesRes.data), [messagesRes.data]);

  const counts = useMemo(() => {
    const c = { all: messages.length, new: 0, in_progress: 0, resolved: 0 };
    messages.forEach((m) => {
      const k = statusKey(m.status);
      if (c[k] !== undefined) c[k] += 1;
    });
    return c;
  }, [messages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      const key = statusKey(m.status);
      if (filter !== "all" && key !== filter) return false;
      if (!q) return true;
      return [m.name, m.email, m.message, String(m.id ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [messages, query, filter]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this message?")) return;
    try {
      await contactMessagesApi.remove(id);
      await messagesRes.reload();
    } catch (err) {
      window.alert(err?.message ?? "Failed to delete.");
    }
  };

  return (
    <AdminLayout subtitle="Inbox" title="Contact Messages">
      {!messagesRes.loading && !messagesRes.error && messages.length > 0 && (
        <div className="mb-5">
          <StatStrip counts={counts} />
        </div>
      )}

      <Card>
        <CardHeader
          eyebrow="Messages"
          title={
            <span className="inline-flex items-center gap-2">
              <Inbox size={16} className="text-[#6655f6]" />
              {filtered.length === messages.length
                ? `${messages.length} message${messages.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${messages.length} messages`}
            </span>
          }
          action={
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, message…"
                className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-9 text-[11px] outline-none transition focus:border-[#8175ef] focus:bg-white focus:ring-2 focus:ring-[#8175ef]/10"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[#98a1b3] hover:bg-[#eef1f7] hover:text-[#5c6880]"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          }
        />

        <div className="flex flex-wrap gap-2 border-b border-[#edf0f5] px-5 py-3 sm:px-6">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${
                  isActive
                    ? "border-transparent bg-[#07132f] text-white shadow-[0_6px_18px_rgba(7,19,47,.18)]"
                    : "border-[#e2e6ee] bg-white text-[#66728b] hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    isActive ? "bg-white/20 text-white" : "bg-[#f1efff] text-[#5649dc]"
                  }`}
                >
                  {counts[f.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                <th className="px-6 py-3">From</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messagesRes.loading && <LoadingRows />}

              {!messagesRes.loading && messagesRes.error && (
                <tr>
                  <td colSpan={5}>
                    <StateBlock kind="error" message={messagesRes.error.message} onRetry={messagesRes.reload} />
                  </td>
                </tr>
              )}

              {!messagesRes.loading && !messagesRes.error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <StateBlock
                      message={
                        messages.length === 0
                          ? "No contact messages yet."
                          : query || filter !== "all"
                          ? "No messages match your filters."
                          : "No messages in this view."
                      }
                    />
                  </td>
                </tr>
              )}

              {!messagesRes.loading &&
                !messagesRes.error &&
                filtered.map((m) => {
                  const key = statusKey(m.status);
                  const config = statusConfig(m.status);
                  return (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/admin/contact-messages/${m.id}`)}
                      className="group cursor-pointer border-b border-[#f0f2f6] transition-colors last:border-0 hover:bg-[#fafbff]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${config.icon}`}>
                            {key === "resolved" ? <MailOpen size={15} /> : <Mail size={15} />}
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-[11px] font-bold text-[#1c2a4a]">
                              {m.name ?? "—"}
                            </strong>
                            <span className="block truncate text-[10px] text-[#8a95a8]">
                              {m.email ?? "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-[360px]">
                        <p className="m-0 line-clamp-2 text-[11px] text-[#5c6880]">
                          {m.message ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${config.chip}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[10px] text-[#7b869b]">
                        {formatDateTime(m.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleDelete(e, m.id)}
                            className="rounded-lg bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100"
                            aria-label="Delete message"
                          >
                            <Trash2 size={13} />
                          </button>
                          <span className="inline-grid h-7 w-7 place-items-center rounded-full text-[#aeb6c6] transition group-hover:bg-[#efedff] group-hover:text-[#5649dc]">
                            <ChevronRight size={16} />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}