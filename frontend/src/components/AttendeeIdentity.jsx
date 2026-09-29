export default function AttendeeIdentity({ name, label = "Attendee", className = "" }) {
  const displayName = name || label;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className={`flex shrink-0 items-center gap-2.5 border-l border-white/10 pl-3 ${className}`}>
      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">
        {initials || "AT"}
      </div>
      <div className="leading-tight">
        <strong className="block max-w-[180px] truncate text-[11px] text-white">
          {displayName}
        </strong>
        <span className="block text-[9px] text-white/45">{label}</span>
      </div>
    </div>
  );
}