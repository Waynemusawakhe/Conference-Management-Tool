import { http } from "./client";

export const discussionsApi = {
  getAll: (params = {}) => http.get("/discussions", { params }),
  mine: () => http.get("/discussions/mine"),
  getById: (id) => http.get(`/discussions/${encodeURIComponent(id)}`),
  create: (body) => http.post("/discussions", body),
  update: (id, body) => http.put(`/discussions/${encodeURIComponent(id)}`, body),
  toggleLike: (id) => http.post(`/discussions/${encodeURIComponent(id)}/like`),
  addComment: (discussionId, body) =>
    http.post(`/discussions/${encodeURIComponent(discussionId)}/comments`, { body }),
  remove: (id) => http.delete(`/discussions/${encodeURIComponent(id)}`),
  removeComment: (discussionId, commentId) =>
    http.delete(
      `/discussions/${encodeURIComponent(discussionId)}/comments/${encodeURIComponent(commentId)}`
    ),
  setVisibility: (id, body) =>
    http.patch(`/discussions/${encodeURIComponent(id)}/visibility`, body),
};
