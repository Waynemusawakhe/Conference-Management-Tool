import { http } from './client';

export const submissionsApi = {
  getAll: () => http.get('/v1/submissions'),
  getById: (id) => http.get(`/v1/submissions/${id}`),
  create: (body) => http.post('/v1/submissions', body),
  update: (id, body) => http.put(`/v1/submissions/${id}`, body),
  remove: (id) => http.delete(`/v1/submissions/${id}`),
  withdraw: (id) => http.post(`/v1/submissions/${id}/withdraw`, {}),
  updateStatus: (id, body) => http.patch(`/v1/submissions/${id}/status`, body),
};