export default function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5 text-white">
      <img className="h-[42px] w-[42px] object-contain" src="/cmt-mark.png" alt="CMT logo" />
      <div className="flex flex-col leading-[1.05]">
        <strong className="text-2xl tracking-[-.04em]">CMT</strong>
        {!compact && <span className="mt-1 whitespace-nowrap text-[9px] text-white/70">Conference Management Tool</span>}
      </div>
    </div>
  );
}