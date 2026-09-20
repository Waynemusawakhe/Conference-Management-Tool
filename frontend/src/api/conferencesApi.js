import { http } from './client';

export const conferencesApi = {
  getAll: () => http.get('/v1/conferences'),
  getById: (id) => http.get(`/v1/conferences/${id}`),
  create: (body) => http.post('/v1/conferences', body),
  update: (id, body) => http.put(`/v1/conferences/${id}`, body),
  remove: (id) => http.delete(`/v1/conferences/${id}`),
  updateStatus: (id, body) => http.patch(`/v1/conferences/${id}/status`, body),
};
//ntuthuko939