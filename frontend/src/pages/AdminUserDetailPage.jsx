import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDate, formatDateTime } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { usersApi } from "../api/usersApi";

const ROLE_TONES = {
  admin: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  organiser: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
  reviewer: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  author: "border-[#c9dff5] bg-[#eef5fd] text-[#1d5fa8]",
  attendee: "border-[#e2e6ee] bg-[#f5f6fa] text-[#59657d]",
};

function roleChip(role) {
  const key = String(role ?? "").toLowerCase();
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.06em] ${
        ROLE_TONES[key] ?? ROLE_TONES.attendee
      }`}
    >
      {key || "—"}
    </span>
  );
}

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userRes = useApiResource(() => usersApi.getById(id), [id]);
  const user = userRes.data?.data ?? userRes.data ?? null;

  const displayName = user?.name ?? user?.full_name ?? (user ? `User #${user.id}` : "User Detail");

  return (
    <AdminLayout
      subtitle="User"
      title={displayName}
      action={
        <button
          onClick={() => navigate("/users")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#07132f] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_26px_rgba(7,19,47,.28)] transition hover:-translate-y-px hover:bg-[#0a1740] focus:outline-none focus:ring-4 focus:ring-[#07132f]/20"
        >
          <ArrowLeft size={14} /> Back to users
        </button>
      }
    >
      {userRes.loading && (
        <Card>
          <StateBlock kind="loading" message="Loading user…" />
        </Card>
      )}

      {!userRes.loading && userRes.error && (
        <Card>
          <StateBlock kind="error" message={userRes.error.message} onRetry={userRes.reload} />
        </Card>
      )}

      {user && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* ---------- Profile card ---------- */}
          <Card className="overflow-hidden lg:col-span-1">
            <div className="relative h-28 bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.32),transparent_35%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.22),transparent_40%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)]">
              <div className="absolute inset-0 opacity-[.18] [background-image:radial-gradient(rgba(255,255,255,.18)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
              <div className="absolute inset-x-0 -bottom-10 flex justify-center">
                <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-[#efedff] text-[26px] font-extrabold text-[#4f46c7] shadow-[0_10px_28px_rgba(15,28,65,.18)]">
                  {getInitials(displayName)}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-14 text-center">
              <strong className="block text-[16px] font-bold tracking-[-.02em] text-[#1c2a4a]">
                {displayName}
              </strong>
              <span className="mt-1 block text-[11px] text-[#8a95a8]">
                {user.email ?? "—"}
              </span>

              <div className="mt-4 flex justify-center">{roleChip(user.role)}</div>

              {user.email_verified_at ? (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#bfe5d1] bg-[#effaf4] px-3 py-1 text-[10px] font-extrabold text-[#18794e]">
                  <CheckCircle2 size={12} /> Verified
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#e9d9a7] bg-[#fff9e9] px-3 py-1 text-[10px] font-extrabold text-[#9b7414]">
                  <Clock size={12} /> Not verified
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 divide-x divide-[#edf0f5] rounded-xl border border-[#edf0f5]">
                <div className="px-3 py-3">
                  <span className="block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                    User ID
                  </span>
                  <strong className="mt-1 block text-[12px] text-[#1c2a4a]">#{user.id}</strong>
                </div>
                <div className="px-3 py-3">
                  <span className="block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                    Joined
                  </span>
                  <strong className="mt-1 block text-[12px] text-[#1c2a4a]">
                    {formatDate(user.created_at ?? user.joined_at)}
                  </strong>
                </div>
              </div>
            </div>
          </Card>

          {/* ---------- Details card ---------- */}
          <Card className="lg:col-span-2">
            <CardHeader eyebrow="Profile" title="Account details" />
            <div className="grid grid-cols-1 gap-px bg-[#edf0f5] sm:grid-cols-2">
              <Field icon={<UserCircle2 size={13} />} label="Full name" value={displayName} />
              <Field icon={<Mail size={13} />} label="Email address" value={user.email ?? "—"} />
              <Field
                icon={<ShieldCheck size={13} />}
                label="Role"
                value={String(user.role ?? "—")}
                capitalize
              />
              <Field
                icon={<CheckCircle2 size={13} />}
                label="Email verified"
                value={
                  user.email_verified_at
                    ? formatDateTime(user.email_verified_at)
                    : "Not verified"
                }
              />
              <Field
                icon={<Calendar size={13} />}
                label="Joined"
                value={formatDateTime(user.created_at ?? user.joined_at)}
              />
              <Field
                icon={<Clock size={13} />}
                label="Last updated"
                value={formatDateTime(user.updated_at)}
              />
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({ icon, label, value, capitalize = false }) {
  return (
    <div className="bg-white px-5 py-4 transition hover:bg-[#fafbff] sm:px-6">
      <dt className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
        {icon} {label}
      </dt>
      <dd
        className={`m-0 mt-2 break-words text-[12px] font-semibold text-[#1c2a4a] ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}