import { http } from './client';

export const reviewsApi = {
  getAll: (params) => http.get('/v1/reviews', { params }),
  pending: (params) => http.get('/v1/reviews/pending', { params }),
  getById: (id) => http.get(`/v1/reviews/${id}`),
  create: (body) => http.post('/v1/reviews', body),
  remove: (id) => http.delete(`/v1/reviews/${id}`),
  submit: (id, body) => http.post(`/v1/reviews/${id}/submit`, body),
  lock: (id) => http.post(`/v1/reviews/${id}/lock`, {}),
};