import {
  Ban,
  CheckCircle2,
  Clock3,
  CircleHelp,
  FileClock,
  RefreshCw,
  XCircle,
} from "lucide-react";

// Shape + icon + words remain understandable without differentiating colours.
const STATUS = {
  open: { label: "Open for submissions", tone: "success", Icon: CheckCircle2 },
  closed: { label: "Closed", tone: "neutral", Icon: Ban },
  deadline_passed: { label: "Deadline passed", tone: "warning", Icon: Clock3 },
  pending: { label: "Pending", tone: "warning", Icon: Clock3 },
  under_review: { label: "Under review", tone: "info", Icon: FileClock },
  accepted: { label: "Accepted", tone: "success", Icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "danger", Icon: XCircle },
  revision_requested: { label: "Revision requested", tone: "warning", Icon: RefreshCw },
  withdrawn: { label: "Withdrawn", tone: "neutral", Icon: Ban },
};

export default function StatusIndicator({ status, className = "" }) {
  const key = String(status || "pending").toLowerCase();
  const configuration = STATUS[key] || {
    label: key.replace(/_/g, " "),
    tone: "info",
    Icon: CircleHelp,
  };
  const { label, tone, Icon } = configuration;

  return (
    <span className={`cmt-semantic-status ${className}`} data-cmt-tone={tone} data-cmt-status={key}>
      <Icon size={14} strokeWidth={2.3} aria-hidden="true" className="shrink-0" />
      <span>{label}</span>
    </span>
  );
}
