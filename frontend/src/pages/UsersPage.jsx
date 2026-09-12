import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { usersApi } from "../api/usersApi";

export default function UsersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const usersRes = useApiResource(() => usersApi.getAll(), []);
  const users = useMemo(() => toArray(usersRes.data), [usersRes.data]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [users, query]);

  return (
    <div className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)]">
      <button onClick={() => navigate("/AdminDashboard")} className="mb-6 flex items-center gap-2 text-[11px] font-bold text-[#6655f6] hover:underline">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-.03em]">All Users</h1>
          <p className="mt-1 text-[11px] text-[#8993a6]">Manage and view all registered accounts.</p>
        </div>
        <div className="relative w-full sm:w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users..." className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none focus:border-[#8175ef]" />
        </div>
      </div>

      {usersRes.loading && <div className="p-10 text-center text-[11px] text-[#8993a6]">Loading users…</div>}
      {usersRes.error && <div className="p-10 text-center text-[11px] text-[#b13a3a]">{usersRes.error.message}</div>}

      {!usersRes.loading && !usersRes.error && (
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
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#efedff] text-[10px] font-extrabold text-[#4f46c7]">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <strong className="text-[11px] text-[#1c2a4a]">{user.name || `User #${user.id}`}</strong>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[10px] text-[#5c6880]">{user.email || "—"}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full border border-[#cfd0ff] bg-[#f0efff] px-2.5 py-1 text-[9px] font-extrabold capitalize text-[#5548d7]">
                      {user.role || "unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[10px]">
                    <button className="rounded-lg bg-blue-50 px-2 py-1 text-blue-600 hover:bg-blue-100" onClick={() => navigate(`/edit-user/${user.id}`)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Users size={20} className="mx-auto text-[#aeb6c6]" />
              <p className="mt-2 text-[11px] text-[#8993a6]">No users found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}