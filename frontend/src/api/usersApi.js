<<<<<<< HEAD
import { http } from './client';

export const usersApi = {
  getAll: () => http.get('/users'),
  getById: (id) => http.get(`/users/${id}`),
};
=======
import { http } from "./client";

export const usersApi = {
  getAll: (params = {}) =>
    http.get("/users", { params }),

  getById: (id) =>
    http.get(`/users/${encodeURIComponent(id)}`),

  getReviewers: () =>
    http.get("/users/reviewers"),
};
>>>>>>> origin/main
