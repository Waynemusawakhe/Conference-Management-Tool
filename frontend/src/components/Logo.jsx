export default function Logo({ compact = false }) {
  return (
    <div className="brand">
      <img className="brand-mark" src="/cmt-mark.png" alt="CMT logo" />
      <div className="brand-copy">
        <strong>CMT</strong>
        {!compact && <span>Conference Management Tool</span>}
      </div>
    </div>
  );
}