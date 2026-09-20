import { http } from './client';

export const contactMessagesApi = {
  getAll: () => http.get('/contact-messages'),
  getById: (id) => http.get(`/contact-messages/${id}`),
  create: (body) => http.post('/contact-messages', body),
  remove: (id) => http.delete(`/contact-messages/${id}`),
  updateStatus: (id, status) => http.patch(`/contact-messages/${id}/status`, { status }),
};