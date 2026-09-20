import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  CheckCircle2,
  Clock,
  Mail,
  MailOpen,
  Send,
  Trash2,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDateTime } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { contactMessagesApi } from "../api/contactMessagesApi";

const STATUS_CONFIG = {
  new: {
    label: "New",
    chip: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
    dot: "bg-[#5548d7]",
    icon: <Mail size={15} />,
    iconTint: "bg-[#efedff] text-[#5c50ec]",
  },
  in_progress: {
    label: "In progress",
    chip: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
    dot: "bg-[#9b7414]",
    icon: <Clock size={15} />,
    iconTint: "bg-[#fff9e9] text-[#9b7414]",
  },
  resolved: {
    label: "Resolved",
    chip: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
    dot: "bg-[#18794e]",
    icon: <CheckCircle2 size={15} />,
    iconTint: "bg-[#effaf4] text-[#18794e]",
  },
};

const STATUS_ORDER = ["new", "in_progress", "resolved"];

function statusKey(raw) {
  if (!raw) return "new";
  return String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
}
function statusConfig(raw) {
  return STATUS_CONFIG[statusKey(raw)] ?? STATUS_CONFIG.new;
}

export default function ContactMessageDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const messageRes = useApiResource(() => contactMessagesApi.getById(id), [id]);
  const message = messageRes.data?.data ?? messageRes.data ?? null;
  const key = statusKey(message?.status);
  const config = statusConfig(message?.status);

  const setStatus = async (next) => {
    if (next === key) return;
    setSaving(true);
    setFeedback(null);
    try {
      await contactMessagesApi.updateStatus(id, { status: next });
      await messageRes.reload();
      setFeedback({
        type: "success",
        message: `Status updated to ${STATUS_CONFIG[next]?.label ?? next}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message ?? "Failed to update status.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      await contactMessagesApi.remove(id);
      navigate("/admin/contact-messages");
    } catch (err) {
      window.alert(err?.message ?? "Failed to delete.");
    }
  };

  return (
    <AdminLayout
      subtitle="Message"
      title={message ? `From ${message.name ?? "—"}` : "Message Detail"}
      action={
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/contact-messages")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#07132f] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_26px_rgba(7,19,47,.28)] transition hover:-translate-y-px hover:bg-[#0a1740] focus:outline-none focus:ring-4 focus:ring-[#07132f]/20"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {message && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      }
    >
      {messageRes.loading && (
        <Card>
          <StateBlock kind="loading" message="Loading message…" />
        </Card>
      )}

      {!messageRes.loading && messageRes.error && (
        <Card>
          <StateBlock kind="error" message={messageRes.error.message} onRetry={messageRes.reload} />
        </Card>
      )}

      {message && (
        <>
          {feedback && (
            <div
              role="alert"
              className={`mb-4 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[11px] font-semibold ${
                feedback.type === "success"
                  ? "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]"
                  : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"
              }`}
            >
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader eyebrow="Sender" title="Contact details" />
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 border-b border-[#edf0f5] pb-5">
                  <div className={`grid h-12 w-12 place-items-center rounded-full ${config.iconTint}`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-[13px] font-bold text-[#1c2a4a]">
                      {message.name ?? "—"}
                    </strong>
                    <span className="mt-0.5 block truncate text-[10px] text-[#8a95a8]">
                      {message.email ?? "—"}
                    </span>
                  </div>
                </div>

                <dl className="mt-5 space-y-4">
                  <Field icon={<Mail size={13} />} label="Email" value={message.email ?? "—"} />
                  <Field icon={<Clock size={13} />} label="Received" value={formatDateTime(message.created_at)} />
                  <Field icon={<AtSign size={13} />} label="Reference" value={`#${message.id}`} />
                </dl>

                {message.email && (
                  <a
                    href={`mailto:${message.email}?subject=Re: your message to CMT`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_26px_rgba(37,99,235,.28)] transition hover:-translate-y-px hover:bg-[#1e3a8a] hover:shadow-[0_10px_26px_rgba(30,58,138,.32)]"
                  >
                    <Send size={13} /> Reply via email
                  </a>
                )}
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                eyebrow="Message"
                title="Content"
                action={
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${config.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </span>
                }
              />

              <div className="p-5 sm:p-6">
                <div className="relative rounded-2xl border border-[#edf0f5] bg-[#fafbff] p-5">
                  <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1.5 rounded-full border border-[#edf0f5] bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                    <MailOpen size={10} /> Message body
                  </span>
                  <p className="m-0 mt-1 whitespace-pre-wrap break-words text-[13px] leading-7 text-[#35415f]">
                    {message.message ?? "—"}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#edf0f5] pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
                      Update status
                    </span>
                    {saving && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#66728b]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6655f6]" />
                        Saving…
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {STATUS_ORDER.map((s) => {
                      const c = STATUS_CONFIG[s];
                      const isActive = s === key;
                      return (
                        <button
                          key={s}
                          disabled={saving || isActive}
                          onClick={() => setStatus(s)}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-extrabold transition ${
                            isActive
                              ? `${c.chip} shadow-[0_6px_18px_rgba(15,28,65,.06)]`
                              : "border-[#e2e6ee] bg-white text-[#66728b] hover:-translate-y-px hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"
                          } disabled:cursor-default disabled:hover:translate-y-0 disabled:opacity-100`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                          {c.label}
                          {isActive && <CheckCircle2 size={12} className="ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function Field({ icon, label, value }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
        {icon} {label}
      </dt>
      <dd className="m-0 mt-2 break-words text-[12px] font-semibold text-[#1c2a4a]">{value}</dd>
    </div>
  );
}