import {
  Ban,
  CheckCircle2,
  Clock3,
  CircleHelp,
  FileClock,
  FileCheck2,
  FileText,
  LockKeyhole,
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
  submitted: { label: "Submitted", tone: "info", Icon: FileCheck2 },
  locked: { label: "Locked", tone: "neutral", Icon: LockKeyhole },
  new: { label: "New", tone: "info", Icon: CircleHelp },
  in_progress: { label: "In progress", tone: "warning", Icon: Clock3 },
  resolved: { label: "Resolved", tone: "success", Icon: CheckCircle2 },
  completed: { label: "Completed", tone: "success", Icon: CheckCircle2 },
  cancelled: { label: "Cancelled", tone: "neutral", Icon: Ban },
  canceled: { label: "Cancelled", tone: "neutral", Icon: Ban },
  confirmed: { label: "Confirmed", tone: "success", Icon: CheckCircle2 },
  registered: { label: "Registered", tone: "success", Icon: CheckCircle2 },
  approved: { label: "Approved", tone: "success", Icon: CheckCircle2 },
  draft: { label: "Draft", tone: "neutral", Icon: FileText },
  published: { label: "Published", tone: "success", Icon: CheckCircle2 },
  ongoing: { label: "Ongoing", tone: "info", Icon: Clock3 },
};

export default function StatusIndicator({ status, context, className = "" }) {
  const key = String(status || "pending").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const configuration = STATUS[key] || {
    label: key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    tone: "info",
    Icon: CircleHelp,
  };
  const { label, tone, Icon } = configuration;

  return (
    <span
      className={`cmt-semantic-status ${className}`}
      data-cmt-tone={tone}
      data-cmt-status={key}
    >
      <Icon size={14} strokeWidth={2.3} aria-hidden="true" className="shrink-0" />
      <span>{context ? `${context}: ${label}` : label}</span>
    </span>
  );
}
