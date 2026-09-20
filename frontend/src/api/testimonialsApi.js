import { http } from './client';

export const testimonialsApi = {
  getAll: () => http.get('/testimonials'),
  getById: (id) => http.get(`/testimonials/${id}`),
  create: (body) => http.post('/testimonials', body),
  update: (id, body) => http.put(`/testimonials/${id}`, body),
  remove: (id) => http.delete(`/testimonials/${id}`),
<<<<<<< HEAD
};
=======
};
>>>>>>> origin/main
