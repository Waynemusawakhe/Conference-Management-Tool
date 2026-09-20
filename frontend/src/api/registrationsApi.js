import { http } from './client';

export const registrationsApi = {
  getAll: () => http.get('/registrations'),
  getById: (id) => http.get(`/registrations/${id}`),
  create: (body) => http.post('/registrations', body),
  update: (id, body) => http.put(`/registrations/${id}`, body),
  remove: (id) => http.delete(`/registrations/${id}`),
<<<<<<< HEAD
};
=======
};
>>>>>>> origin/main
