import { http } from './client';

export const usersApi = {
  getAll: () => http.get('/users'),
  getById: (id) => http.get(`/users/${id}`),
};