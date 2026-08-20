import { CalendarDays, Globe2, Users } from "lucide-react";

export default function HeroVisual() {
  return (
    <div className="relative min-h-[470px]" aria-hidden="true">
      <div className="absolute left-[110px] top-[110px] h-[270px] w-[270px] rounded-full bg-[#5c4ef0]/25 blur-sm" />
      <div className="absolute right-[50px] top-10 h-40 w-40 rounded-full bg-[#388cff]/15 blur-sm" />

      <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-[45%] -translate-y-1/2 overflow-hidden rounded-full bg-[radial-gradient(circle_at_34%_28%,#9a91ff_0%,#5e55cf_35%,#292c78_68%,#171b52_100%)] shadow-[inset_-25px_-30px_60px_rgba(0,0,0,.35),0_0_80px_rgba(101,86,255,.28)]">
        <img className="h-full w-full object-contain drop-shadow-[0_0_28px_rgba(39,142,255,.28)]" src="/digital-earth.png" alt="" />
      </div>

      <div className="absolute left-1/2 top-1/2 h-[180px] w-[400px] -translate-x-1/2 -translate-y-1/2 rotate-[-20deg] rounded-[50%] border border-[#aaa5ff]/40" />
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[250px] -translate-x-1/2 -translate-y-1/2 rotate-[57deg] rounded-[50%] border border-[#aaa5ff]/40" />

      <div className="absolute left-2 top-[55px] flex min-w-40 items-center gap-2.5 rounded-[15px] border border-white/35 bg-white/95 px-4 py-[13px] text-[#0d1b3d] shadow-[0_20px_45px_rgba(0,0,0,.2)]">
        <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-[#efedff] text-[#5c50ec]"><CalendarDays size={18} /></span>
        <span className="flex flex-col"><small className="text-[8px] text-[#7b8497]">Global conferences</small><strong className="mt-0.5 text-base">1,250+</strong></span>
      </div>

      <div className="absolute bottom-[52px] left-[22px] flex min-w-40 items-center gap-2.5 rounded-[15px] border border-white/35 bg-white/95 px-4 py-[13px] text-[#0d1b3d] shadow-[0_20px_45px_rgba(0,0,0,.2)]">
        <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-[#e8faf2] text-[#19a56a]"><Users size={18} /></span>
        <span className="flex flex-col"><small className="text-[8px] text-[#7b8497]">Researchers</small><strong className="mt-0.5 text-base">25,000+</strong></span>
      </div>

      <div className="absolute right-0 top-[190px] flex min-w-40 items-center gap-2.5 rounded-[15px] border border-white/35 bg-white/95 px-4 py-[13px] text-[#0d1b3d] shadow-[0_20px_45px_rgba(0,0,0,.2)]">
        <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-[#fff2e5] text-[#ef8c29]"><Globe2 size={18} /></span>
        <span className="flex flex-col"><small className="text-[8px] text-[#7b8497]">Countries</small><strong className="mt-0.5 text-base">120+</strong></span>
      </div>

      <div className="mini-dot dot-one" />
      <div className="mini-dot dot-two" />
      <div className="mini-dot dot-three" />
    </div>
  );
}
