export default function StatCard({ icon, value, label }) {
  return (
    <div className="relative flex items-center gap-[13px] px-5 py-6 sm:px-[30px] [&:not(:last-child)]:after:absolute [&:not(:last-child)]:after:right-0 [&:not(:last-child)]:after:top-6 [&:not(:last-child)]:after:h-[calc(100%-48px)] [&:not(:last-child)]:after:w-px [&:not(:last-child)]:after:bg-[#e7eaf1]">
      <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#efedff] text-[#5c50ec]">{icon}</div>
      <div>
        <strong className="block text-[21px] tracking-[-.04em]">{value}</strong>
        <span className="mt-1 block text-[11px] text-[#718096]">{label}</span>
      </div>
    </div>
  );
}