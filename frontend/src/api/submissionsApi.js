import { http } from './client';

export const submissionsApi = {
  getAll: () => http.get('/submissions'),
  getById: (id) => http.get(`/submissions/${id}`),
  create: (body) => http.post('/submissions', body),
  update: (id, body) => http.put(`/submissions/${id}`, body),
  remove: (id) => http.delete(`/submissions/${id}`),
  withdraw: (id) => http.post(`/submissions/${id}/withdraw`, {}),
  updateStatus: (id, body) => http.patch(`/submissions/${id}/status`, body),
};