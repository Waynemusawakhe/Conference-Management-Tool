import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import Logo from "../components/Logo";
import { conferencesApi } from "../api/conferencesApi";

const statusStyles = {
  Registered: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  Pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  "Under review": "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  "under review": "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  Accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  Rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  "Revision requested": "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
  "revision requested": "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
  "Open for submissions": "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  open: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  closed: "border-[#e4e8f0] bg-[#f8f9fc] text-[#68748b]",
  Closed: "border-[#e4e8f0] bg-[#f8f9fc] text-[#68748b]",
};

function StatusBadge({ status }) {
  const key = status || "—";
  const style =
    statusStyles[key] ||
    statusStyles[String(key).toLowerCase()] ||
    "border-[#e4e8f0] bg-[#f8f9fc] text-[#68748b]";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${style}`}
    >
      {key}
    </span>
  );
}

function asList(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function mapOrganising(c) {
  const start = c.start_date ? String(c.start_date).slice(0, 10) : "";
  const end = c.end_date ? String(c.end_date).slice(0, 10) : "";
  return {
    id: c.id,
    title: c.name || "Untitled conference",
    acronym: c.code || "",
    date: start && end ? `${start} – ${end}` : start || end || "Dates TBA",
    location:
      c.venue_name || [c.city, c.country].filter(Boolean).join(", ") || "TBA",
    status:
      c.submission_status === "open"
        ? "Open for submissions"
        : c.submission_status === "closed"
          ? "Closed"
          : c.submission_status || "—",
  };
}

const tabs = [
  { id: "attending", label: "Attending", icon: Users },
  { id: "proposals", label: "My Proposals", icon: FileText },
  { id: "organising", label: "Organising", icon: Building2 },
];

export default function MyConferences() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("organising");
  const [query, setQuery] = useState("");
  const [attending, setAttending] = useState([]);
  const [proposals] = useState([]);
  const [organising, setOrganising] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrganising = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await conferencesApi.getAll();
      setOrganising(asList(payload).map(mapOrganising));
    } catch (e) {
      setOrganising([]);
      setError(
        e?.message ||
          "Could not load conferences from API. Is php artisan serve running?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganising();
  }, [loadOrganising]);

  const counts = {
    attending: attending.length,
    proposals: proposals.length,
    organising: organising.length,
  };

  const filterList = (list, fields) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) =>
      fields
        .map((f) => String(item[f] ?? ""))
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  };

  const filteredAttending = useMemo(
    () => filterList(attending, ["title", "acronym", "location", "status"]),
    [attending, query]
  );
  const filteredProposals = useMemo(
    () => filterList(proposals, ["title", "conference", "track", "status"]),
    [proposals, query]
  );
  const filteredOrganising = useMemo(
    () => filterList(organising, ["title", "acronym", "location", "status"]),
    [organising, query]
  );

  const list =
    tab === "attending"
      ? filteredAttending
      : tab === "proposals"
        ? filteredProposals
        : filteredOrganising;

  const emptyMessage =
    tab === "attending"
      ? "You are not registered for any conferences yet."
      : tab === "proposals"
        ? "You have not submitted any proposals yet."
        : "No conferences yet. Create one to get started.";

  const cancelRegistration = (item) => {
    if (!window.confirm(`Cancel registration for “${item.title}”?`)) return;
    setAttending((prev) => prev.filter((r) => r.id !== item.id));
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#0d1b3d]">
      <header className="sticky top-0 z-30 border-b border-[#e4e8f0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-[min(1200px,calc(100%-32px))] items-center justify-between gap-4 py-3.5">
          <button
            type="button"
            className="border-0 bg-transparent p-0"
            onClick={() => navigate("/")}
          >
            <Logo />
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadOrganising}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4e8f0] bg-white px-3 py-2 text-[12px] font-bold text-[#35415f]"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate("/author-dashboard")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4e8f0] bg-white px-3 py-2 text-[12px] font-bold text-[#35415f]"
            >
              <LayoutDashboard size={14} /> Author dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/account-settings")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4e8f0] bg-white px-3 py-2 text-[12px] font-bold text-[#35415f]"
            >
              <Settings size={14} /> Settings
            </button>
            <button
              type="button"
              onClick={() => navigate("/create-conference")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-3 py-2 text-[12px] font-extrabold text-white"
            >
              <Plus size={14} /> Create conference
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(1200px,calc(100%-32px))] py-6">
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#111e4b] via-[#1c2860] to-[#342b87] px-6 py-7 text-white">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
            <Sparkles size={14} /> My Conferences
          </span>
          <h1 className="mb-2 mt-3 text-[clamp(26px,4vw,40px)] font-bold tracking-[-.045em]">
            Everything you’re involved in
          </h1>
          <p className="m-0 max-w-[640px] text-[13px] text-white/70">
            Attending, proposals, and conferences you organise.
          </p>
          <button
            type="button"
            onClick={() => navigate("/create-conference")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[12px] font-extrabold text-[#342b87]"
          >
            <Plus size={16} /> Create conference
          </button>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900"
          >
            {error}
          </div>
        )}

        <section className="mt-5 grid grid-cols-3 gap-4 max-[720px]:grid-cols-1">
          {[
            { label: "Attending", value: counts.attending, icon: <Users size={18} /> },
            { label: "My Proposals", value: counts.proposals, icon: <FileText size={18} /> },
            { label: "Organising", value: counts.organising, icon: <Building2 size={18} /> },
          ].map((s) => (
            <article
              key={s.label}
              className="rounded-[17px] border border-[#e4e8f0] bg-white p-4"
            >
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec]">
                {s.icon}
              </span>
              <strong className="mt-3 block text-[24px]">
                {loading && s.label === "Organising" ? "…" : s.value}
              </strong>
              <p className="mb-0 mt-1 text-[12px] font-bold">{s.label}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[20px] border border-[#e4e8f0] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e8f0] p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-extrabold ${
                      active
                        ? "bg-gradient-to-br from-[#6655f6] to-[#7869ff] text-white"
                        : "border border-[#e4e8f0] bg-[#f8f9fc] text-[#35415f]"
                    }`}
                  >
                    <Icon size={14} />
                    {t.label}
                    <span className="ml-1 rounded-full bg-black/10 px-1.5 text-[10px]">
                      {counts[t.id]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative min-w-[220px] max-w-xs flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b95a8]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search this list…"
                className="w-full rounded-xl border border-[#e4e8f0] bg-[#f8f9fc] py-2.5 pl-9 pr-3 text-[12px] outline-none"
              />
            </div>
          </div>

          <div className="p-4">
            {loading && tab === "organising" ? (
              <p className="py-10 text-center text-[13px] text-[#68748b]">
                Loading conferences…
              </p>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dfe4ee] px-6 py-12 text-center">
                <UserRound className="mx-auto text-[#aeb6c6]" size={28} />
                <p className="mt-3 text-[13px] font-bold">{emptyMessage}</p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      tab === "organising" ? "/create-conference" : "/conferences"
                    )
                  }
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[12px] font-extrabold text-white"
                >
                  <Plus size={14} />{" "}
                  {tab === "organising" ? "Create conference" : "Browse conferences"}
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {tab === "attending" &&
                  filteredAttending.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4e8f0] bg-[#fafbfe] p-4"
                    >
                      <div>
                        <StatusBadge status={item.status} />
                        <h3 className="mt-1 text-[14px] font-extrabold">{item.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => cancelRegistration(item)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#f1c8c8] bg-[#fff2f2] px-3 py-2 text-[11px] font-bold text-[#b13a3a]"
                      >
                        <Trash2 size={13} /> Cancel
                      </button>
                    </article>
                  ))}

                {tab === "proposals" &&
                  filteredProposals.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4e8f0] bg-[#fafbfe] p-4"
                    >
                      <div>
                        <StatusBadge status={item.status} />
                        <h3 className="mt-1 text-[14px] font-extrabold">{item.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/author-dashboard")}
                        className="rounded-xl border border-[#e4e8f0] bg-white px-3 py-2 text-[11px] font-bold"
                      >
                        Open
                      </button>
                    </article>
                  ))}

                {tab === "organising" &&
                  filteredOrganising.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4e8f0] bg-[#fafbfe] p-4"
                    >
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <StatusBadge status={item.status} />
                          {item.acronym && (
                            <span className="text-[11px] font-bold text-[#5c50ec]">
                              {item.acronym}
                            </span>
                          )}
                        </div>
                        <h3 className="m-0 text-[14px] font-extrabold">{item.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#68748b]">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={13} /> {item.date}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={13} /> {item.location}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/edit-conference/${item.id}`)}
                          className="rounded-xl border border-[#e4e8f0] bg-white px-3 py-2 text-[11px] font-bold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/conferences")}
                          className="rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-3 py-2 text-[11px] font-extrabold text-white"
                        >
                          Manage
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

