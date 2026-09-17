import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Plus, RefreshCw, Search, Trash2, Users, X } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { usersApi } from "../api/usersApi";

const ROLES = ["All roles", "admin", "organiser", "reviewer", "author"];

const roleStyles = {
  admin: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  organiser: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
  reviewer: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  author: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
};

const roleLabel = (raw) => (raw ? String(raw).toLowerCase() : "unknown");

function RetryButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
    >
      <RefreshCw size={12} /> Retry
    </button>
  );
}

export default function UsersPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [busy, setBusy] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const usersRes = useApiResource(() => usersApi.getAll(), []);
  const users = useMemo(() => toArray(usersRes.data), [usersRes.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole =
        roleFilter === "All roles" || roleLabel(u.role) === roleLabel(roleFilter);
      const haystack = [u.name ?? "", u.email ?? "", u.role ?? "", String(u.id ?? "")]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesRole && matchesQuery;
    });
  }, [users, query, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts = { "All roles": users.length };
    for (const u of users) {
      const r = roleLabel(u.role);
      counts[r] = (counts[r] ?? 0) + 1;
    }
    return counts;
  }, [users]);

  const handleDeleteUser = useCallback(
    async (user) => {
      const label = user.name || user.email || `User #${user.id}`;
      if (!window.confirm(`Are you sure you want to delete "${label}"? This cannot be undone.`))
        return;

      setBusy(`user-${user.id}`);
      setFeedback(null);
      try {
        await usersApi.remove(user.id);
        await usersRes.reload();
        setFeedback({ type: "success", message: `Deleted ${label}.` });
      } catch (error) {
        setFeedback({
          type: "error",
          message: error?.message || "Failed to delete user. Please try again.",
        });
      } finally {
        setBusy(null);
      }
    },
    [usersRes]
  );

  const handleRefresh = async () => {
    setBusy("refresh");
    setFeedback(null);
    try {
      await usersRes.reload();
      setFeedback({ type: "success", message: "User list refreshed." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error?.message || "Failed to refresh. Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setRoleFilter("All roles");
  };

  const hasActiveFilters = query.trim() !== "" || roleFilter !== "All roles";

  return (
    <div className="mx-auto w-[min(1100px,calc(100%-32px))] py-6">
      <div className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)]">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="mb-6 flex items-center gap-2 text-[11px] font-bold text-[#6655f6] hover:underline"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

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
            <button
              onClick={() => setFeedback(null)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-[-.03em]">All Users</h1>
            <p className="mt-1 text-[11px] text-[#8993a6]">
              Manage and view all registered accounts.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleRefresh}
              disabled={busy === "refresh" || usersRes.loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[11px] font-semibold text-[#59657d] hover:bg-[#f0f2f6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={busy === "refresh" ? "animate-spin" : ""} />
              {busy === "refresh" ? "Refreshing…" : "Refresh"}
            </button>
            <button
              onClick={() => navigate("/create-user")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-[11px] font-extrabold text-white shadow-[0_10px_24px_rgba(103,87,245,.22)] transition hover:-translate-y-px"
            >
              <Plus size={15} /> New User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[260px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
              size={15}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, role…"
              className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
              size={14}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 w-full sm:w-auto rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-8 text-[11px] font-semibold text-[#59657d] outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "All roles" ? `All roles (${roleCounts["All roles"] ?? 0})` : r}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#e2e6ee] bg-white px-3 text-[11px] font-semibold text-[#59657d] hover:bg-[#f5f6fa]"
            >
              <X size={13} /> Clear
            </button>
          )}
          <span className="ml-auto hidden text-[10px] font-semibold text-[#8993a6] sm:block">
            Showing {filtered.length} of {users.length}
          </span>
        </div>

        {/* Content */}
        {usersRes.loading && (
          <div className="p-10 text-center text-[11px] text-[#8993a6]">Loading users…</div>
        )}

        {!usersRes.loading && usersRes.error && (
          <div className="flex flex-col items-center p-10 text-center text-[11px] text-[#b13a3a]">
            <span>{usersRes.error.message}</span>
            <RetryButton onClick={usersRes.reload} />
          </div>
        )}

        {!usersRes.loading && !usersRes.error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                    <th className="px-6 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const label = roleLabel(user.role);
                    const isBusy = busy === `user-${user.id}`;
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#efedff] text-[10px] font-extrabold text-[#4f46c7]">
                              {(user.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <strong className="block truncate text-[11px] text-[#1c2a4a]">
                                {user.name || `User #${user.id}`}
                              </strong>
                              <span className="text-[9px] text-[#929bad]">#{user.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[10px] text-[#5c6880]">
                          {user.email || "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold capitalize ${
                              roleStyles[label] ||
                              "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]"
                            }`}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-[10px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className="rounded-lg bg-blue-50 px-2 py-1 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                              disabled={isBusy}
                              onClick={() => navigate(`/edit-user/${user.id}`)}
                            >
                              Edit
                            </button>
                            <button
                              disabled={isBusy}
                              onClick={() => handleDeleteUser(user)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              {isBusy ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <Users size={20} className="mx-auto text-[#aeb6c6]" />
                <p className="mt-2 text-[11px] text-[#8993a6]">
                  {hasActiveFilters
                    ? "No users match your search or filter."
                    : "No users yet."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-3 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {filtered.length > 0 && (
              <div className="mt-4 text-center text-[10px] text-[#8993a6] sm:hidden">
                Showing {filtered.length} of {users.length}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
