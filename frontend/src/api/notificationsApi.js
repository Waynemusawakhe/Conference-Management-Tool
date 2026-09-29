import { http } from "./client";

export const notificationsApi = {
  list: () => http.get("/auth/notifications"),
  unreadCount: () => http.get("/auth/notifications/unread-count"),
  markRead: (id) =>
    http.post(`/auth/notifications/${encodeURIComponent(id)}/read`, {}),
  markAllRead: () => http.post("/auth/notifications/read-all", {}),
};