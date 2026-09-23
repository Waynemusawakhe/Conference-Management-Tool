import { Search } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ eyebrow, title, action }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
      <div>
        {eyebrow && (
          <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">{title}</h2>
        )}
      </div>
      {action}
    </div>
  );
}

export function StateBlock({ kind = "empty", message, onRetry }) {
  const tone =
    kind === "error" ? "text-[#b13a3a]" : "text-[#8993a6]";
  return (
    <div className={`flex flex-col items-center gap-2 p-10 text-center text-[11px] ${tone}`}>
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-gray-200 bg-gray-50 text-gray-700",
    purple: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
    green: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
    red: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
    amber: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:w-[260px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10"
      />
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...rest }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...rest }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-xl border border-[#e2e6ee] bg-white px-4 py-2.5 text-[11px] font-bold text-[#66728b] hover:bg-[#f5f6fa] ${className}`}
    >
      {children}
    </button>
  );
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}