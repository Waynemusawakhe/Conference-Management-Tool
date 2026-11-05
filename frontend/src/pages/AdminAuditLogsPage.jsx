import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDateTime } from "../components/AdminUI";
import { auditLogsApi } from "../api/auditLogsApi";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try { const response = await auditLogsApi.getAll({ per_page: 100 }); const data = response.data?.data ?? response.data ?? []; setLogs(Array.isArray(data) ? data : data.data ?? []); }
    catch (e) { setError(e?.response?.data?.message ?? e.message ?? "Could not load the audit trail."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return <AdminLayout subtitle="Platform" title="Audit trail">
    <Card><CardHeader eyebrow="Security" title="Recorded administration changes" />
      {loading ? <StateBlock kind="loading" message="Loading audit trail…" /> : error ? <StateBlock kind="error" message={error} onRetry={load} /> : logs.length === 0 ? <StateBlock kind="empty" message="No audited changes yet." /> : <div className="overflow-x-auto"><table className="w-full text-left text-[11px]"><thead className="border-b border-[#e8ebf1] text-[9px] uppercase tracking-[.08em] text-[#8791a4]"><tr><th className="pb-3">When</th><th className="pb-3">Action</th><th className="pb-3">Administrator</th><th className="pb-3">User affected</th></tr></thead><tbody className="divide-y divide-[#edf0f5]">{logs.map((log) => <tr key={log.id}><td className="py-3 text-[#748097]">{formatDateTime(log.created_at)}</td><td className="py-3 font-bold text-[#1c2a4a]">{String(log.action ?? "change").replaceAll("_", " ")}</td><td className="py-3">{log.actor?.name ?? "System"}<span className="block text-[#8791a4]">{log.actor?.email ?? ""}</span></td><td className="py-3">{log.target?.name ?? "—"}<span className="block text-[#8791a4]">{log.target?.email ?? ""}</span></td></tr>)}</tbody></table></div>}
    </Card>
  </AdminLayout>;
}
