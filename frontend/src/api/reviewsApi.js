import { http } from './client';

export const reviewsApi = {
  getAll: (params) => http.get('/reviews', { params }),
  pending: (params) => http.get('/reviews/pending', { params }), // Add this line
  getById: (id) => http.get(`/reviews/${id}`),
  create: (body) => http.post('/reviews', body), 
  remove: (id) => http.delete(`/reviews/${id}`),
  submit: (id, body) => http.post(`/reviews/${id}/submit`, body),
  lock: (id) => http.post(`/reviews/${id}/lock`, {}),
};