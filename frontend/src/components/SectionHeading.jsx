export default function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 max-sm:block">
      <div>
        {eyebrow && <span className="mb-2 inline-block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5c50ec]">{eyebrow}</span>}
        <h2 className="m-0 text-[clamp(30px,3.3vw,42px)] font-bold leading-[1.08] tracking-[-.045em] text-[#0d1b3d]">{title}</h2>
        {description && <p className="mt-3 max-w-[650px] text-[13px] leading-7 text-[#66728b]">{description}</p>}
      </div>
      {action}
    </div>
  );
}