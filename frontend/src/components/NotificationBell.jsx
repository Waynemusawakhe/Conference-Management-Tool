import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/notificationsApi";

export default function NotificationBell({ dark = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [readingId, setReadingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [result, unreadResult] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.unreadCount(),
      ]);

      if (!Array.isArray(result?.data)) {
        throw new Error("The server returned an unexpected notification response.");
      }

      setItems(result.data);
      setUnread(Number(unreadResult.unread_count ?? result.unread_count ?? 0));
    } catch (err) {
      console.error("Unable to load notifications:", err);
      setError(err.message || "Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openNotification = async (item) => {
    setActionError("");

    if (!item.read_at) {
      setReadingId(item.id);

      try {
        const result = await notificationsApi.markRead(item.id);
        const readNotification = result?.data;
        setItems((current) =>
          current.map((notification) =>
            notification.id === item.id
              ? {
                  ...notification,
                  read_at: readNotification?.read_at || new Date().toISOString(),
                }
              : notification
          )
        );
        setUnread((count) => Math.max(0, count - 1));
      } catch (err) {
        console.error("Unable to mark notification as read:", err);
        setActionError(
          err.message || "Could not mark this notification as read. Please try again."
        );
        return;
      } finally {
        setReadingId(null);
      }
    }

    setOpen(false);

    const submissionId = item.data?.submission_id;
    const actionUrl =
      submissionId && !item.data?.action_url?.startsWith("/submissions/")
        ? `/submissions/${submissionId}`
        : item.data?.action_url;

    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  const markAll = async () => {
    setActionError("");
    setMarkingAll(true);

    try {
      await notificationsApi.markAllRead();

      const readAt = new Date().toISOString();

      setItems((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at || readAt,
        }))
      );
      setUnread(0);
    } catch (err) {
      console.error("Unable to mark all notifications as read:", err);
      setActionError(
        err.message || "Could not mark all notifications as read. Please try again."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const buttonClass = dark
    ? "border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10"
    : "border border-[#e4e8f0] bg-white text-[#526078] hover:bg-[#f7f8fb]";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) load();
        }}
        className={`relative grid h-10 w-10 place-items-center rounded-[11px] transition ${buttonClass}`}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        title="Notifications"
      >
        <Bell size={17} />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#6d5dfc] px-1 text-[10px] font-extrabold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[100] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#e4e8f0] bg-white text-[#18233f] shadow-[0_20px_60px_rgba(15,28,65,.18)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-4 py-3">
            <div>
              <strong className="text-sm">Notifications</strong>
              <p className="m-0 mt-0.5 text-[11px] text-[#78849a]">
                {unread} unread
              </p>
            </div>

            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                disabled={markingAll}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#5649dc] hover:bg-[#f1efff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck size={14} />
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#5649dc] hover:bg-[#f1efff]"
            >
              View all
            </button>

          </div>

          {actionError && (
            <div
              role="alert"
              className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700"
            >
              {actionError}
              <button
                type="button"
                onClick={() => setActionError("")}
                className="ml-2 font-bold underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="max-h-[min(420px,65vh)] overflow-y-auto">
            {loading && items.length === 0 && !error && (
              <p className="px-4 py-8 text-center text-xs text-[#78849a]">
                Loading notifications...
              </p>
            )}

            {error && (
              <div className="px-4 py-8 text-center">
                <p role="alert" className="text-xs text-red-600">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-3 rounded-lg border border-[#e4e8f0] px-3 py-2 text-xs font-semibold hover:bg-[#f7f8fb]"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-[#78849a]">
                You're all caught up. No notifications yet.
              </p>
            )}

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openNotification(item)}
                disabled={readingId !== null || markingAll}
                className={`flex w-full gap-3 border-b border-[#f0f2f6] px-4 py-3 text-left hover:bg-[#f8f8fc] disabled:opacity-60 ${
                  item.read_at ? "bg-white" : "bg-[#f5f3ff]"
                }`}
              >
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    item.read_at ? "bg-[#d5d9e2]" : "bg-[#6d5dfc]"
                  }`}
                />

                <span className="min-w-0 flex-1">
                  <strong className="block text-[12px]">
                    {item.data?.title || "CMT notification"}
                  </strong>

                  <span className="mt-1 block break-words text-[11px] leading-5 text-[#66728b]">
                    {item.data?.message || "You have a new notification."}
                  </span>

                  <span className="mt-1 block text-[10px] text-[#9aa3b3]">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Date unavailable"}
                  </span>

                  {readingId === item.id && (
                    <span className="mt-1 block text-[10px] text-[#78849a]">
                      Marking as read...
                    </span>
                  )}
                </span>

                {item.data?.action_url && (
                  <ExternalLink
                    size={13}
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-[#9aa3b3]"
                  />
                )}
              </button>
            ))}
          </div>

          {loading && items.length > 0 && (
            <p className="border-t border-[#edf0f5] px-4 py-2 text-center text-[10px] text-[#78849a]">
              Refreshing notifications...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
