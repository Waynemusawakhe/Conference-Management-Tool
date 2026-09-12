import { http } from './client';

export const conferencesApi = {
  getAll: () => http.get('/conferences'),
  getById: (id) => http.get(`/conferences/${id}`),
  create: (body) => http.post('/conferences', body),
  update: (id, body) => http.put(`/conferences/${id}`, body),
  remove: (id) => http.delete(`/conferences/${id}`),
  updateStatus: (id, body) => http.patch(`/conferences/${id}/status`, body),
};