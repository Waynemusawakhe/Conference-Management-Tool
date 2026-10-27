
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, ExternalLink, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/notificationsApi";
import RoleChrome from "../components/RoleChrome";

export default function NotificationCentre() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [readingId, setReadingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
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
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (item) => {
    if (item.read_at || readingId !== null || markingAll) return;

    setActionError("");
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
      return true;
    } catch (err) {
      console.error("Unable to mark notification as read:", err);
      setActionError(
        err.message || "Could not mark this notification as read. Please try again."
      );
      return false;
    } finally {
      setReadingId(null);
    }
  };

  const markAllRead = async () => {
    if (unread === 0 || markingAll || readingId !== null) return;

    setActionError("");
    setMarkingAll(true);

    try {
      await notificationsApi.markAllRead();
      const readAt = new Date().toISOString();
      setItems((current) =>
        current.map((notification) =>
          notification.read_at
            ? notification
            : { ...notification, read_at: readAt }
        )
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

  const openNotification = async (item) => {
    setActionError("");

    if (!item.read_at && !(await markRead(item))) return;

    const submissionId = item.data?.submission_id;
    const actionUrl =
      submissionId && !item.data?.action_url?.startsWith("/submissions/")
        ? `/submissions/${submissionId}`
        : item.data?.action_url;

    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  return (
    <RoleChrome>
      <main className="mx-auto w-full max-w-5xl space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-[#07132f] via-[#0b1740] to-[#342b87] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                <Bell size={24} />
              </span>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#b9b3ff]">
                  Your updates
                </p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Notification Centre
                </h1>
                <p className="mt-2 text-sm text-white/70">
                  View and manage your CMT notifications.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
            <p className="text-sm">
              <strong>{unread}</strong> unread notification{unread === 1 ? "" : "s"}
            </p>

            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || loading || unread === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#342b87] hover:bg-[#f0efff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck size={16} />
              {markingAll ? "Marking as read..." : "Mark all as read"}
            </button>
          </div>
        </section>

        {actionError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError("")}
              className="font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#e4e8f0] bg-white shadow-sm">
          <div className="border-b border-[#edf0f5] px-5 py-4">
            <h2 className="text-base font-bold text-[#18233f]">All notifications</h2>
            <p className="mt-1 text-sm text-[#78849a]">
              Your notifications are retrieved from your account.
            </p>
          </div>

          {loading && (
            <p className="px-5 py-12 text-center text-sm text-[#78849a]">
              Loading notifications...
            </p>
          )}

          {!loading && error && (
            <div className="px-5 py-12 text-center">
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
              <button
                type="button"
                onClick={loadNotifications}
                className="mt-4 rounded-lg border border-[#e4e8f0] px-4 py-2 text-sm font-semibold text-[#18233f] hover:bg-[#f7f8fb]"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="px-5 py-14 text-center">
              <Bell size={30} className="mx-auto text-[#a0a8b8]" />
              <h3 className="mt-3 font-bold text-[#18233f]">
                You're all caught up
              </h3>
              <p className="mt-1 text-sm text-[#78849a]">
                New notifications will appear here when you receive them.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            items.map((item) => (
              <article
                key={item.id}
                className={`flex flex-col gap-4 border-b border-[#f0f2f6] p-5 last:border-b-0 sm:flex-row sm:items-start ${
                  item.read_at ? "bg-white" : "bg-[#f7f5ff]"
                }`}
              >
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                    item.read_at ? "bg-[#d5d9e2]" : "bg-[#6d5dfc]"
                  }`}
                  aria-label={item.read_at ? "Read" : "Unread"}
                  title={item.read_at ? "Read" : "Unread"}
                />

                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-bold text-[#18233f]">
                    {item.data?.title || "CMT notification"}
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#66728b]">
                    {item.data?.message || "You have a new notification."}
                  </p>

                  <p className="mt-3 text-xs text-[#9aa3b3]">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Date unavailable"}
                  </p>

                  {item.read_at && (
                    <p className="mt-1 text-xs font-semibold text-[#78849a]">
                      Read
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  {!item.read_at && (
                    <button
                      type="button"
                      onClick={() => markRead(item)}
                      disabled={readingId === item.id || markingAll}
                      className="rounded-lg border border-[#dcd7ff] px-3 py-2 text-xs font-bold text-[#5649dc] hover:bg-[#f1efff] disabled:opacity-50"
                    >
                      {readingId === item.id ? "Marking..." : "Mark as read"}
                    </button>
                  )}

                  {(item.data?.action_url || item.data?.submission_id) && (
                     <button
                        type="button"
                      onClick={() => openNotification(item)}
                                disabled={readingId === item.id || markingAll}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#342b87] px-3 py-2 text-xs font-bold text-white hover:bg-[#27216b] disabled:opacity-50"
                            >
                                Open <ExternalLink size={13} />
                            </button>
                            )}
                </div>
              </article>
            ))}
        </section>
      </main>
    </RoleChrome>
  );
}
