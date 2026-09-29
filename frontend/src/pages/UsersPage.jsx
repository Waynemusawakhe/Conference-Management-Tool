import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search, Users, UserCheck, Shield, X } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDate } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { usersApi } from "../api/usersApi";

const ROLES = [
  { key: "all", label: "All", match: () => true },
  { key: "admin", label: "Admins", match: (r) => r === "admin" },
  { key: "organiser", label: "Organisers", match: (r) => r === "organiser" },
  { key: "reviewer", label: "Reviewers", match: (r) => r === "reviewer" },
  {
    key: "author_attendee",
    label: "Authors & Attendees",
    match: (r) => r === "author" || r === "attendee",
  },
];

const ROLE_STYLES = {
  admin: {
    chip: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
    avatar: "bg-[#efedff] text-[#4f46c7]",
  },
  organiser: {
    chip: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
    avatar: "bg-[#fff6ee] text-[#a55b25]",
  },
  reviewer: {
    chip: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
    avatar: "bg-[#effaf4] text-[#18794e]",
  },
  author: {
    chip: "border-[#c9dff5] bg-[#eef5fd] text-[#1d5fa8]",
    avatar: "bg-[#eef5fd] text-[#1d5fa8]",
  },
  attendee: {
    chip: "border-[#e2e6ee] bg-[#f5f6fa] text-[#59657d]",
    avatar: "bg-[#f5f6fa] text-[#59657d]",
  },
};

function userName(u) {
  return u.name ?? u.full_name ?? `User #${u.id}`;
}
function userRole(u) {
  return String(u.role ?? "—").toLowerCase();
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

function RoleChip({ role }) {
  const key = role.toLowerCase();
  const styles = ROLE_STYLES[key] ?? ROLE_STYLES.attendee;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${styles.chip}`}
    >
      {key || "—"}
    </span>
  );
}

function StatStrip({ users }) {
  const counts = useMemo(() => {
    const acc = { admin: 0, organiser: 0, reviewer: 0, authorAttendee: 0 };
    users.forEach((u) => {
      const r = userRole(u);
      if (r === "admin") acc.admin += 1;
      else if (r === "organiser") acc.organiser += 1;
      else if (r === "reviewer") acc.reviewer += 1;
      else acc.authorAttendee += 1;
    });
    return acc;
  }, [users]);

  const items = [
    { label: "Total", value: users.length, icon: <Users size={14} />, tone: "text-[#4f46c7] bg-[#efedff]" },
    { label: "Admins", value: counts.admin, icon: <Shield size={14} />, tone: "text-[#5548d7] bg-[#f0efff]" },
    { label: "Organisers", value: counts.organiser, icon: <UserCheck size={14} />, tone: "text-[#a55b25] bg-[#fff6ee]" },
    { label: "Reviewers", value: counts.reviewer, icon: <UserCheck size={14} />, tone: "text-[#18794e] bg-[#effaf4]" },
    { label: "Authors & Attendees", value: counts.authorAttendee, icon: <Users size={14} />, tone: "text-[#1d5fa8] bg-[#eef5fd]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-[14px] border border-[#e4e8f0] bg-white p-3 shadow-[0_6px_18px_rgba(15,28,65,.03)]"
        >
          <span className={`inline-grid h-7 w-7 place-items-center rounded-lg ${it.tone}`}>
            {it.icon}
          </span>
          <strong className="mt-3 block text-[18px] leading-none tracking-[-.03em] text-[#1c2a4a]">
            {it.value}
          </strong>
          <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LoadingRows({ rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-[#f0f2f6] last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-[#eef1f7]" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="h-2 w-12 animate-pulse rounded-full bg-[#eef1f7]" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="h-2.5 w-40 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-2.5 w-20 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-6 py-4"><div className="ml-auto h-3 w-3 animate-pulse rounded-full bg-[#eef1f7]" /></td>
    </tr>
  ));
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const usersRes = useApiResource(() => usersApi.getAll(), []);
  const users = useMemo(() => toArray(usersRes.data), [usersRes.data]);

  const activeRole = ROLES.find((r) => r.key === roleFilter) ?? ROLES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const role = userRole(u);
      if (!activeRole.match(role)) return false;
      if (!q) return true;
      return [userName(u), u.email ?? "", role, String(u.id ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, query, activeRole]);

  return (
    <AdminLayout subtitle="People" title="User Directory">
      {!usersRes.loading && !usersRes.error && users.length > 0 && (
        <div className="mb-5">
          <StatStrip users={users} />
        </div>
      )}

      <Card>
        <CardHeader
          eyebrow="Platform"
          title={
            <span className="inline-flex items-center gap-2">
              <Users size={16} className="text-[#6655f6]" />
              {filtered.length === users.length
                ? `${users.length} registered users`
                : `${filtered.length} of ${users.length} users`}
            </span>
          }
          action={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:w-[280px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                  size={15}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email, role…"
                  className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-9 text-[11px] outline-none transition focus:border-[#8175ef] focus:bg-white focus:ring-2 focus:ring-[#8175ef]/10"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[#98a1b3] hover:bg-[#eef1f7] hover:text-[#5c6880]"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          }
        />

        <div className="flex flex-wrap gap-2 border-b border-[#edf0f5] px-5 py-3 sm:px-6">
          {ROLES.map((r) => {
            const isActive = roleFilter === r.key;
            const count = users.filter((u) => r.match(userRole(u))).length;
            return (
              <button
                key={r.key}
                onClick={() => setRoleFilter(r.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${
                  isActive
                    ? "border-transparent bg-[#07132f] text-white shadow-[0_6px_18px_rgba(7,19,47,.18)]"
                    : "border-[#e2e6ee] bg-white text-[#66728b] hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"
                }`}
              >
                {r.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    isActive ? "bg-white/20 text-white" : "bg-[#f1efff] text-[#5649dc]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                <th className="px-6 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {usersRes.loading && <LoadingRows />}

              {!usersRes.loading && usersRes.error && (
                <tr>
                  <td colSpan={5}>
                    <StateBlock kind="error" message={usersRes.error.message} onRetry={usersRes.reload} />
                  </td>
                </tr>
              )}

              {!usersRes.loading && !usersRes.error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <StateBlock
                      message={
                        users.length === 0
                          ? "No users found."
                          : roleFilter !== "all" || query
                          ? "No users match your filters."
                          : "No users to display."
                      }
                    />
                  </td>
                </tr>
              )}

              {!usersRes.loading &&
                !usersRes.error &&
                filtered.map((u) => {
                  const name = userName(u);
                  const role = userRole(u);
                  const styles = ROLE_STYLES[role] ?? ROLE_STYLES.attendee;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="group cursor-pointer border-b border-[#f0f2f6] transition-colors last:border-0 hover:bg-[#fafbff]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${styles.avatar}`}>
                            {getInitials(name)}
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-[11px] font-bold text-[#1c2a4a]">{name}</strong>
                            <span className="text-[9px] text-[#929bad]">#{u.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[10px] text-[#5c6880]">{u.email ?? "—"}</td>
                      <td className="px-4 py-4">
                        <RoleChip role={role} />
                      </td>
                      <td className="px-4 py-4 text-[10px] text-[#7b869b]">
                        {formatDate(u.created_at ?? u.joined_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-grid h-7 w-7 place-items-center rounded-full text-[#aeb6c6] transition group-hover:bg-[#efedff] group-hover:text-[#5649dc]">
                          <ChevronRight size={16} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}