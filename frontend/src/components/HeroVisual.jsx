import { CalendarDays, Globe2, Users } from "lucide-react";

export default function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="glow-orb orb-one" />
      <div className="glow-orb orb-two" />

      <div className="world">
        <img className="world-image" src="/digital-earth.png" alt="" />
      </div>

      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />

      <div className="floating-card card-conferences">
        <span className="floating-icon purple"><CalendarDays size={18} /></span>
        <span><small>Global conferences</small><strong>1,250+</strong></span>
      </div>

      <div className="floating-card card-researchers">
        <span className="floating-icon green"><Users size={18} /></span>
        <span><small>Researchers</small><strong>25,000+</strong></span>
      </div>

      <div className="floating-card card-countries">
        <span className="floating-icon orange"><Globe2 size={18} /></span>
        <span><small>Countries</small><strong>120+</strong></span>
      </div>

      <div className="mini-dot dot-one" />
      <div className="mini-dot dot-two" />
      <div className="mini-dot dot-three" />
    </div>
  );
}
