import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from "lucide-react";

const details = [
  { icon: CalendarDays, label: "Important dates" },
  { icon: MapPin, label: "Places to meet" },
];

export default function HeroVisual() {
  return (
    <div className="home-visual" aria-hidden="true">
      <div className="home-visual-orbit home-visual-orbit-one" />
      <div className="home-visual-orbit home-visual-orbit-two" />
      <div className="home-visual-sun" />

      <div className="home-preview-card">
        <div className="home-preview-topline">
          <span className="home-preview-mark"><Sparkles size={13} /></span>
          <span>YOUR CONFERENCE DESK</span>
          <span className="home-preview-dot" />
        </div>

        <div className="home-preview-content">
          <span className="home-preview-overline">Make room for good ideas</span>
          <h2>Find the people<br />who want to hear it.</h2>
          <p>Conference details, together in one place.</p>
        </div>

        <div className="home-preview-details">
          {details.map(({ icon: Icon, label }) => (
            <div key={label}>
              <Icon size={15} />
              <span>{label}</span>
              <ArrowUpRight size={14} className="home-preview-arrow" />
            </div>
          ))}
        </div>
      </div>

      <div className="home-visual-caption">
        <span className="home-caption-mark"><span /><span /><span /></span>
        <span>Discover something worth sharing.</span>
      </div>
    </div>
  );
}
