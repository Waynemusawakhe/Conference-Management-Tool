import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, CheckCircle2, ChevronRight, Clock, Mail, Search, ShieldCheck, Users, UserCheck, Shield, X } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDate } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { usersApi } from "../api/usersApi";
import { AdminTableToolbar, SortableTh, useAdminTableControls } from "../components/AdminTableControls";

const USER_TABLE_COLUMNS = [
  { key: "user", label: "User" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "joined", label: "Joined" },
  { key: "actions", label: "Actions" },
];

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
    rowHover: "#6b5de0",
  },
  organiser: {
    chip: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
    avatar: "bg-[#fff6ee] text-[#a55b25]",
    rowHover: "#b96c36",
  },
  reviewer: {
    chip: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
    avatar: "bg-[#effaf4] text-[#18794e]",
    rowHover: "#208458",
  },
  author: {
    chip: "border-[#c9dff5] bg-[#eef5fd] text-[#1d5fa8]",
    avatar: "bg-[#eef5fd] text-[#1d5fa8]",
    rowHover: "#2f70ad",
  },
  attendee: {
    chip: "border-[#e2e6ee] bg-[#f5f6fa] text-[#59657d]",
    avatar: "bg-[#f5f6fa] text-[#59657d]",
    rowHover: "#6d788c",
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
      className={`cmt-user-role-badge inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${styles.chip}`}
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
    { label: "Total", value: users.length, icon: <Users size={14} />, tone: "text-[#4f46c7] bg-[#efedff]", tile: "border-[#cfd0ff] bg-white dark:border-[#514a83] dark:bg-[#0f172a]", text: "text-[#4f46c7] dark:text-[#a9a2ff]" },
    { label: "Admins", value: counts.admin, icon: <Shield size={14} />, tone: "text-[#5548d7] bg-[#f0efff]", tile: "border-[#b5b6ff] bg-[#f0efff] dark:border-[#7169b5] dark:bg-[#211d3d]", text: "text-[#5548d7] dark:text-[#c4bfff]" },
    { label: "Organisers", value: counts.organiser, icon: <UserCheck size={14} />, tone: "text-[#a55b25] bg-[#fff6ee]", tile: "border-[#e6b48f] bg-[#fff6ee] dark:border-[#96613d] dark:bg-[#2a1c14]", text: "text-[#a55b25] dark:text-[#f0b98e]" },
    { label: "Reviewers", value: counts.reviewer, icon: <UserCheck size={14} />, tone: "text-[#18794e] bg-[#effaf4]", tile: "border-[#9bd7b7] bg-[#effaf4] dark:border-[#347b52] dark:bg-[#10271d]", text: "text-[#18794e] dark:text-[#70d69d]" },
    { label: "Authors & Attendees", value: counts.authorAttendee, icon: <Users size={14} />, tone: "text-[#1d5fa8] bg-[#eef5fd]", tile: "border-[#a9cdec] bg-[#eef5fd] dark:border-[#456d99] dark:bg-[#132338]", text: "text-[#1d5fa8] dark:text-[#8bc3f5]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div
          key={it.label}
          className={`rounded-[14px] border-2 p-3 shadow-[0_6px_18px_rgba(15,28,65,.08)] ${it.tile}`}
        >
          <span className={`inline-grid h-7 w-7 place-items-center rounded-lg ${it.tone}`}>
            {it.icon}
          </span>
          <strong className={`mt-3 block text-[20px] font-black leading-none tracking-[-.03em] ${it.text}`}>
            {it.value}
          </strong>
          <span className={`mt-1 block text-[10px] font-black uppercase tracking-[.08em] ${it.text}`}>
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
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewPhase, setViewPhase] = useState("list");
  const [viewFrameHeight, setViewFrameHeight] = useState(null);
  const viewContentRef = useRef(null);

  const usersRes = useApiResource(() => usersApi.getAll(), []);
  const detailRes = useApiResource(
    () => selectedUserId ? usersApi.getById(selectedUserId) : Promise.resolve(null),
    [selectedUserId],
  );
  const selectedUser = detailRes.data?.data ?? detailRes.data ?? null;
  const activeView = selectedUserId && viewPhase.startsWith("detail") ? "detail" : "list";
  const users = useMemo(() => toArray(usersRes.data), [usersRes.data]);
  const table = useAdminTableControls("users", USER_TABLE_COLUMNS);

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
  const visibleUsers = table.sortRows(filtered, {
    user: (u) => userName(u),
    email: (u) => u.email,
    role: (u) => userRole(u),
    joined: (u) => u.created_at ?? u.joined_at,
  });
  const visibleColumnCount = USER_TABLE_COLUMNS.filter((column) => table.columnVisible(column.key)).length;

  const openUser = (id) => {
    setSelectedUserId(id);
    setViewPhase("list-out");
    window.setTimeout(() => setViewPhase("detail-in"), 180);
  };
  const closeUser = () => {
    setViewPhase("detail-out");
    window.setTimeout(() => {
      setSelectedUserId(null);
      setViewPhase("list-in");
    }, 180);
  };

  useLayoutEffect(() => {
    const updateFrameHeight = () => {
      if (viewContentRef.current) setViewFrameHeight(viewContentRef.current.scrollHeight);
    };
    updateFrameHeight();
    window.addEventListener("resize", updateFrameHeight);
    return () => window.removeEventListener("resize", updateFrameHeight);
  }, [activeView, selectedUser, detailRes.loading, viewPhase, filtered.length, usersRes.loading, usersRes.error]);

  return (
    <AdminLayout subtitle="People" title="User Directory">
      {!usersRes.loading && !usersRes.error && users.length > 0 && (
        <div className="mb-5">
          <StatStrip users={users} />
        </div>
      )}

      <Card className="cmt-users-shared-card">
        <div className="cmt-users-view-frame" style={viewFrameHeight ? { height: `${viewFrameHeight}px` } : undefined}>
        <div
          ref={activeView === "list" ? viewContentRef : null}
          className={`cmt-users-view-content ${activeView === "list" ? `cmt-users-view-${viewPhase}` : "cmt-users-view-hidden"}`}
          aria-hidden={activeView !== "list"}
        >
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

        <AdminTableToolbar columns={USER_TABLE_COLUMNS} controls={table} />

        <div className="cmt-users-table-wrap overflow-x-auto">
          <table data-table-density={table.density} className="cmt-users-table admin-data-table w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                {table.columnVisible("user") && <SortableTh column={USER_TABLE_COLUMNS[0]} controls={table} className="sticky left-0 z-20 bg-[#fafbff] px-6 py-2.5 dark:bg-[#0f172a]" />}
                {table.columnVisible("email") && <SortableTh column={USER_TABLE_COLUMNS[1]} controls={table} className="cmt-user-email whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("role") && <SortableTh column={USER_TABLE_COLUMNS[2]} controls={table} className="cmt-user-role whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("joined") && <SortableTh column={USER_TABLE_COLUMNS[3]} controls={table} className="cmt-user-joined whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("actions") && <th className="cmt-user-actions px-6 py-2.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {usersRes.loading && <LoadingRows />}

              {!usersRes.loading && usersRes.error && (
                <tr>
                  <td colSpan={visibleColumnCount}>
                    <StateBlock kind="error" message={usersRes.error.message} onRetry={usersRes.reload} />
                  </td>
                </tr>
              )}

              {!usersRes.loading && !usersRes.error && filtered.length === 0 && (
                <tr>
                  <td colSpan={visibleColumnCount}>
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
                visibleUsers.map((u) => {
                  const name = userName(u);
                  const role = userRole(u);
                  const styles = ROLE_STYLES[role] ?? ROLE_STYLES.attendee;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => openUser(u.id)}
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openUser(u.id); } }}
                      tabIndex={0}
                      aria-label={`View ${name}`}
                      style={{ "--user-role-hover": styles.rowHover }}
                      className="cmt-user-row group cursor-pointer border-b border-[#f0f2f6] transition-colors last:border-0"
                    >
                      {table.columnVisible("user") && <td className="sticky left-0 z-10 bg-white px-6 py-4 dark:bg-[#0f172a]">
                        <div className="flex items-center gap-3">
                          <span className={`cmt-user-avatar grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${styles.avatar}`}>
                            {getInitials(name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <strong className="cmt-user-name block truncate text-[11px] font-bold text-[#1c2a4a] transition-colors group-hover:text-white">{name}</strong>
                            <span className="text-[9px] text-[#929bad] transition-colors group-hover:text-white/80">#{u.id}</span>
                            <div className="cmt-user-mobile-meta mt-2 hidden min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                              {table.columnVisible("email") && <span className="cmt-user-mobile-email min-w-0 break-all text-[11px] text-[#66728b]">{u.email ?? "—"}</span>}
                              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                                {table.columnVisible("role") && <RoleChip role={role} />}
                                {table.columnVisible("joined") && <span className="text-[10px] text-[#7b869b]">Joined {formatDate(u.created_at ?? u.joined_at)}</span>}
                              </div>
                            </div>
                          </div>
                          {table.columnVisible("actions") && <span className="cmt-user-mobile-chevron hidden h-9 w-9 shrink-0 place-items-center rounded-full text-[#7c879b]"><ChevronRight size={17} /></span>}
                        </div>
                      </td>}
                      {table.columnVisible("email") && <td className="cmt-user-email px-4 py-4 text-[10px] text-[#5c6880] transition-colors group-hover:text-white">{u.email ?? "—"}</td>}
                      {table.columnVisible("role") && <td className="cmt-user-role px-4 py-4 text-[10px] text-[#5c6880] transition-colors group-hover:text-white">
                        <RoleChip role={role} />
                      </td>}
                      {table.columnVisible("joined") && <td className="cmt-user-joined px-4 py-4 text-[10px] text-[#7b869b] transition-colors group-hover:text-white/90">
                        {formatDate(u.created_at ?? u.joined_at)}
                      </td>}
                      {table.columnVisible("actions") && <td className="cmt-user-actions px-6 py-4 text-right">
                        <span className="cmt-user-chevron inline-grid h-7 w-7 place-items-center rounded-full text-[#aeb6c6] transition group-hover:bg-white/20 group-hover:text-white">
                          <ChevronRight size={16} />
                        </span>
                      </td>}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        </div>
        {activeView === "detail" && (
          <div ref={viewContentRef} className={`cmt-users-view-content cmt-users-view-${viewPhase}`}>
            <UserDetailContent user={selectedUser} loading={detailRes.loading} error={detailRes.error} onBack={closeUser} onRetry={detailRes.reload} />
          </div>
        )}
        </div>
      </Card>
    </AdminLayout>
  );
}

function UserDetailContent({ user, loading, error, onBack, onRetry }) {
  const name = user ? userName(user) : "User details";
  const role = user ? userRole(user) : "";
  const details = [
    ["Full name", name],
    ["Email address", user?.email ?? "—"],
    ["Role", role || "—"],
    ["Email verified", user?.email_verified_at ? formatDate(user.email_verified_at) : "Not verified"],
    ["Joined", formatDate(user?.created_at ?? user?.joined_at)],
    ["Last updated", formatDate(user?.updated_at)],
  ];

  return (
    <div className="cmt-user-detail-body p-5 sm:p-6">
      <button onClick={onBack} className="cmt-user-detail-back mb-5 inline-flex items-center gap-2 rounded-lg border border-[#07132f] bg-[#07132f] px-2.5 py-2 text-[11px] font-extrabold text-white transition hover:bg-[#10234a] dark:border-[#0b1224] dark:bg-[#0b1224] dark:hover:bg-[#080d19] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6655f6]">
        <ArrowLeft size={14} /> Back to users
      </button>
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]" aria-label="Loading user details">
          <div className="space-y-4 rounded-2xl border border-[#edf0f5] p-5">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[#e8eaf2]" />
            <div className="h-4 w-48 animate-pulse rounded bg-[#e8eaf2]" />
            <div className="h-3 w-64 max-w-full animate-pulse rounded bg-[#eef0f5]" />
            <div className="mt-7 grid grid-cols-2 gap-4">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[#f1f2f7]" />)}</div>
          </div>
          <div className="h-48 animate-pulse rounded-2xl bg-[#f1f2f7]" />
        </div>
      ) : error ? (
        <StateBlock kind="error" message={error.message} onRetry={onRetry} />
      ) : user ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section className="cmt-user-detail-profile rounded-2xl border border-[#edf0f5] p-5 sm:p-6">
            <div className="cmt-user-detail-header flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#efedff] text-[15px] font-extrabold text-[#4f46c7]">{getInitials(name)}</span>
              <div className="min-w-0">
                <h3 className="m-0 truncate text-[17px] font-bold text-[#1c2a4a]">{name}</h3>
                <p className="mb-0 mt-1 truncate text-[11px] text-[#788398]">{user.email ?? "—"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><RoleChip role={role} />{user.email_verified_at ? <span className="text-[9px] font-bold text-[#18794e]">Verified</span> : <span className="text-[9px] font-bold text-[#9b7414]">Not verified</span>}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {details.map(([label, value], index) => <div key={label} className="rounded-xl border border-[#edf0f5] bg-[#fafbfe] p-3" style={{ "--user-detail-i": index }}><span className="block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">{label}</span><strong className="mt-1 block break-words text-[11px] font-semibold text-[#263653]">{value}</strong></div>)}
            </div>
          </section>
          <aside className="cmt-user-detail-summary rounded-2xl border border-[#e7e5fb] bg-[#f7f6ff] p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#5548d7] shadow-sm"><ShieldCheck size={18} /></span>
            <h3 className="mb-1 mt-4 text-[13px] font-bold text-[#1c2a4a]">Account summary</h3>
            <p className="m-0 text-[10px] leading-5 text-[#788398]">User #{user.id} is registered as {role || "a user"}.</p>
            <div className="mt-5 space-y-3 border-t border-[#e7e5fb] pt-4 text-[10px] text-[#59657d]">
              <div className="flex items-center gap-2"><Mail size={13} />{user.email ?? "No email provided"}</div>
              <div className="flex items-center gap-2"><Calendar size={13} />Joined {formatDate(user.created_at ?? user.joined_at)}</div>
              <div className="flex items-center gap-2">{user.email_verified_at ? <CheckCircle2 size={13} /> : <Clock size={13} />}{user.email_verified_at ? "Email verified" : "Email not verified"}</div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
