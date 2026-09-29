import { http } from './client';

export const faqsApi = {
  getAll: (params) => http.get('/faqs', { params }),
  getById: (id) => http.get(`/faqs/${id}`),
  create: (body) => http.post('/faqs', body),
  update: (id, body) => http.put(`/faqs/${id}`, body),
  remove: (id) => http.delete(`/faqs/${id}`),
};
