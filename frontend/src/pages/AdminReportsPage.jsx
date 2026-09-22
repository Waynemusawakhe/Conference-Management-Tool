import { useSearchParams } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, GhostButton, StateBlock } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { reportsApi } from "../api/reportsApi";

const DEFAULT_TAB = "dashboard";

const TABS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    accent: "from-[#6655f6] to-[#8b7bff]",
    glow: "shadow-[0_18px_40px_-14px_rgba(102,85,246,.55)]",
    ring: "ring-[#6655f6]/15",
    chip: "bg-[#efedff] text-[#5649dc]",
    text: "text-[#5649dc]",
    loader: () => reportsApi.dashboard(),
  },
  {
    key: "conferences",
    label: "Conferences",
    icon: CalendarDays,
    accent: "from-[#0ea5e9] to-[#38bdf8]",
    glow: "shadow-[0_18px_40px_-14px_rgba(14,165,233,.55)]",
    ring: "ring-[#0ea5e9]/15",
    chip: "bg-[#e6f5fd] text-[#0284c7]",
    text: "text-[#0284c7]",
    loader: () => reportsApi.conferences(),
  },
  {
    key: "submissions",
    label: "Submissions",
    icon: FileText,
    accent: "from-[#f59e0b] to-[#fbbf24]",
    glow: "shadow-[0_18px_40px_-14px_rgba(245,158,11,.55)]",
    ring: "ring-[#f59e0b]/15",
    chip: "bg-[#fef3e2] text-[#b45309]",
    text: "text-[#b45309]",
    loader: () => reportsApi.submissions(),
  },
  {
    key: "reviews",
    label: "Reviews",
    icon: ClipboardCheck,
    accent: "from-[#10b981] to-[#34d399]",
    glow: "shadow-[0_18px_40px_-14px_rgba(16,185,129,.55)]",
    ring: "ring-[#10b981]/15",
    chip: "bg-[#e7f8f1] text-[#047857]",
    text: "text-[#047857]",
    loader: () => reportsApi.reviews(),
  },
  {
    key: "registrations",
    label: "Registrations",
    icon: UserCheck,
    accent: "from-[#ec4899] to-[#f472b6]",
    glow: "shadow-[0_18px_40px_-14px_rgba(236,72,153,.55)]",
    ring: "ring-[#ec4899]/15",
    chip: "bg-[#fdeaf3] text-[#be185d]",
    text: "text-[#be185d]",
    loader: () => reportsApi.registrations(),
  },
];

const VALID_TABS = new Set(TABS.map((t) => t.key));

function prettifyKey(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function MetricCard({ label, value, accent, text, glow, ring }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-[#eef1f7] transition-all duration-300 hover:-translate-y-1 hover:ring-2 ${ring} ${glow}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${accent} opacity-[.06] transition-opacity duration-300 group-hover:opacity-[.12]`}
      />
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent}`} />
      <div
        className={`absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-gradient-to-br ${accent} opacity-40 transition-opacity group-hover:opacity-100`}
      />
      <div className="relative">
        <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[#9ba4b5]">
          {prettifyKey(label)}
        </span>
        <strong
          className={`mt-3 block text-[26px] font-bold leading-none tracking-[-.04em] ${
            text || "text-[#1c2a4a]"
          }`}
        >
          {renderValue(value)}
        </strong>
      </div>
    </div>
  );
}

function DataTable({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <p className="rounded-xl bg-[#f7f8fc] px-4 py-3 text-xs text-[#9ba4b5]">No records.</p>
    );
  }

  if (typeof rows[0] !== "object" || rows[0] === null) {
    return (
      <ul className="grid gap-1.5 text-xs text-[#43506a]">
        {rows.map((row, i) => (
          <li key={i} className="rounded-lg border border-[#eef1f7] bg-white px-3 py-2 transition hover:bg-[#fafbff]">
            {renderValue(row)}
          </li>
        ))}
      </ul>
    );
  }

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[#eef1f7] bg-white shadow-[0_10px_30px_-18px_rgba(23,35,66,.18)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead>
            <tr className="bg-gradient-to-b from-[#fafbff] to-[#f4f6fb]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap border-b border-[#eef1f7] px-4 py-3 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]"
                >
                  {prettifyKey(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#f2f4f9] transition-colors last:border-0 hover:bg-[#fafbff]">
                {columns.map((col) => (
                  <td key={col} className="whitespace-nowrap px-4 py-3 text-[#43506a]">
                    {renderValue(row?.[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubSection({ title, value, accent, text, glow, ring }) {
  if (Array.isArray(value)) {
    return (
      <section className="mt-6">
        <SectionTitle title={title} accent={accent} />
        <DataTable rows={value} />
      </section>
    );
  }

  const entries = Object.entries(value).filter(([, v]) => v === null || typeof v !== "object");
  if (entries.length === 0) return null;

  return (
    <section className="mt-6">
      <SectionTitle title={title} accent={accent} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {entries.map(([k, v]) => (
          <MetricCard key={k} label={k} value={v} accent={accent} text={text} glow={glow} ring={ring} />
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ title, accent }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className={`h-4 w-[3px] rounded-full bg-gradient-to-b ${accent}`} />
      <h3 className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#5b6780]">
        {prettifyKey(title)}
      </h3>
      <span className="h-px flex-1 bg-gradient-to-r from-[#eef1f7] to-transparent" />
    </div>
  );
}

function ReportBody({ payload, tab }) {
  const { accent, text, glow, ring } = tab;

  if (payload === null || payload === undefined) {
    return <StateBlock message="No data available for this report." />;
  }

  if (Array.isArray(payload)) {
    return (
      <div className="p-6 sm:p-7">
        <DataTable rows={payload} />
      </div>
    );
  }

  if (typeof payload !== "object") {
    return (
      <div className="p-6 sm:p-7">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-[#eef1f7] shadow-[0_18px_45px_-25px_rgba(23,35,66,.25)]">
          <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent}`} />
          <div className={`text-4xl font-bold tracking-[-.04em] ${text}`}>
            {renderValue(payload)}
          </div>
        </div>
      </div>
    );
  }

  const scalars = Object.entries(payload).filter(([, v]) => v === null || typeof v !== "object");
  const collections = Object.entries(payload).filter(([, v]) => v !== null && typeof v === "object");

  if (scalars.length === 0 && collections.length === 0) {
    return <StateBlock message="This report has no metrics to display." />;
  }

  return (
    <div className="p-6 sm:p-7">
      {scalars.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {scalars.map(([key, value]) => (
            <MetricCard key={key} label={key} value={value} accent={accent} text={text} glow={glow} ring={ring} />
          ))}
        </div>
      )}
      {collections.map(([key, value]) => (
        <SubSection
          key={key}
          title={key}
          value={value}
          accent={accent}
          text={text}
          glow={glow}
          ring={ring}
        />
      ))}
    </div>
  );
}

function LoadingSkeleton({ accent }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 sm:p-7 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-[#eef1f7]">
          <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent} opacity-30`} />
          <div className="h-2 w-16 animate-pulse rounded-full bg-[#eef1f7]" />
          <div className="mt-3 h-6 w-20 animate-pulse rounded-full bg-[#eef1f7]" />
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab") || DEFAULT_TAB;
  const active = VALID_TABS.has(requested) ? requested : DEFAULT_TAB;
  const tab = TABS.find((t) => t.key === active);
  const TabIcon = tab.icon;

  const reportRes = useApiResource(tab.loader, [active]);
  const payload = reportRes.data?.data ?? reportRes.data ?? null;

  const handleTabChange = (key) => {
    if (key === active) return;
    setSearchParams(key === DEFAULT_TAB ? {} : { tab: key });
  };

  return (
    <AdminLayout
      subtitle="Analytics"
      title="Reports"
      action={
        <GhostButton onClick={reportRes.reload}>
          <RefreshCw size={14} className={reportRes.loading ? "animate-spin" : ""} /> Refresh
        </GhostButton>
      }
    >
      <div role="tablist" aria-label="Report sections" className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(t.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-extrabold transition-all duration-200 ${
                isActive
                  ? `border-transparent ${t.chip} ${t.glow}`
                  : "border-[#e2e6ee] bg-white text-[#66728b] hover:-translate-y-px hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden border-0 ring-1 ring-[#eef1f7] shadow-[0_20px_60px_-30px_rgba(23,35,66,.28)]">
        <CardHeader
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 size={12} /> Report
            </span>
          }
          title={
            <span className="inline-flex items-center gap-2">
              <span className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${tab.accent} text-white shadow-[0_8px_18px_-6px_rgba(23,35,66,.4)]`}>
                <TabIcon size={14} />
              </span>
              {tab.label}
            </span>
          }
        />

        {reportRes.loading && <LoadingSkeleton accent={tab.accent} />}
        {!reportRes.loading && reportRes.error && (
          <StateBlock kind="error" message={reportRes.error.message} onRetry={reportRes.reload} />
        )}
        {!reportRes.loading && !reportRes.error && <ReportBody payload={payload} tab={tab} />}
      </Card>
    </AdminLayout>
  );
}