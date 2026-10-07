import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import OrganiserLayout from "../components/OrganiserLayout";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";

const unwrapList = (r) => (Array.isArray(r) ? r : r?.data || []);

const STATUS_CLS = {
  registered: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  cancelled: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
};

export default function OrganiserRegistrations() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await conferencesApi.getAll({ per_page: 100 });
        const mine = unwrapList(res).filter(
          (c) =>
            Number(c.organiser_id) === Number(user?.id) ||
            Number(c.organiser?.id) === Number(user?.id)
        );
        const collected = [];
        for (const c of mine) {
          try {
            const regs = await conferencesApi.getRegistrations(c.id);
            unwrapList(regs).forEach((r) =>
              collected.push({ ...r, conference: c })
            );
          } catch {
            /* skip a conference whose registrations fail to load */
          }
        }
        if (alive) setRows(collected);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  return (
    <section className="rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]">
      <div className="border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">
          Attendees
        </span>
        <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">
          Registrations across your conferences
        </h2>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-[12px] font-semibold text-[#7c879a] dark:text-[#94a3b8]">
          <Loader2 className="mr-2 animate-spin" size={18} /> Loading registrations…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center">
          <Users size={22} className="mx-auto text-[#aab2c0] dark:text-[#64748b]" />
          <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">
            No registrations yet
          </h3>
          <p className="m-0 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
            Once attendees register for your conferences, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5] dark:border-[#1e293b]">
                <th className="px-6 py-3">Attendee</th>
                <th className="px-4 py-3">Conference</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3 text-right">Reference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = (r.status || "registered").toLowerCase();
                const cls = STATUS_CLS[status] || STATUS_CLS.registered;
                return (
                  <tr
                    key={`${r.id}-${r.conference.id}`}
                    className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe] dark:border-[#1e293b] dark:hover:bg-[#111c33]"
                  >
                    <td className="px-6 py-4 text-[11px] font-semibold text-[#0d1b3d] dark:text-white">
                      {r.user?.name || r.name || `User #${r.user_id ?? r.id}`}
                    </td>
                    <td className="px-4 py-4 text-[10px] text-[#66728b] dark:text-[#94a3b8]">
                      {r.conference.name}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${cls}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[10px] text-[#929bad] dark:text-[#94a3b8]">
                      #{r.id}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}