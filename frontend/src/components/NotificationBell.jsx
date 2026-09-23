import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/notificationsApi";

export default function NotificationBell({ dark = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    try {
      const result = await notificationsApi.list();
      setItems(result?.data || []);
      setUnread(Number(result?.unread_count || 0));
    } catch (error) {
      console.error("Unable to load notifications", error);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openNotification = async (item) => {
    if (!item.read_at) {
      try { await notificationsApi.markRead(item.id); } catch (e) { console.error(e); }
      setUnread((count) => Math.max(0, count - 1));
      setItems((current) => current.map((n) => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n));
    }
    if (item.data?.action_url) navigate(item.data.action_url);
    setOpen(false);
  };

  const markAll = async () => {
    try { await notificationsApi.markAllRead(); } catch (e) { console.error(e); }
    setUnread(0);
    setItems((current) => current.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  const buttonClass = dark
    ? "border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10"
    : "border border-[#e4e8f0] bg-white text-[#526078] hover:bg-[#f7f8fb]";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen((v) => !v); if (!open) load(); }} className={`relative grid h-10 w-10 place-items-center rounded-[11px] transition ${buttonClass}`} aria-label="Notifications" title="Notifications">
        <Bell size={17} />
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-[#6d5dfc] text-white text-[10px] font-extrabold grid place-items-center">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-[100] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#e4e8f0] bg-white text-[#18233f] shadow-[0_20px_60px_rgba(15,28,65,.18)]">
          <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
            <div><strong className="text-sm">Notifications</strong><p className="m-0 mt-0.5 text-[11px] text-[#78849a]">{unread} unread</p></div>
            {unread > 0 && <button onClick={markAll} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#5649dc] hover:bg-[#f1efff]"><CheckCheck size={14}/> Mark all read</button>}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading && <p className="px-4 py-8 text-center text-xs text-[#78849a]">Loading...</p>}
            {!loading && items.length === 0 && <p className="px-4 py-10 text-center text-xs text-[#78849a]">You're all caught up.</p>}
            {items.map((item) => (
              <button key={item.id} onClick={() => openNotification(item)} className={`flex w-full gap-3 border-b border-[#f0f2f6] px-4 py-3 text-left hover:bg-[#f8f8fc] ${!item.read_at ? "bg-[#f5f3ff]" : "bg-white"}`}>
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-[#d5d9e2]" : "bg-[#6d5dfc]"}`} />
                <span className="min-w-0 flex-1"><strong className="block text-[12px]">{item.data?.title || "CMT notification"}</strong><span className="mt-1 block text-[11px] leading-5 text-[#66728b]">{item.data?.message}</span><span className="mt-1 block text-[9px] text-[#9aa3b3]">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</span></span>
                {item.data?.action_url && <ExternalLink size={13} className="mt-1 shrink-0 text-[#9aa3b3]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
