import { http } from './client';

export const sessionsApi = {
  getAll: () => http.get('/sessions'),
  getById: (id) => http.get(`/sessions/${id}`),
  create: (body) => http.post('/sessions', body),
  update: (id, body) => http.put(`/sessions/${id}`, body),
  remove: (id) => http.delete(`/sessions/${id}`),
};
