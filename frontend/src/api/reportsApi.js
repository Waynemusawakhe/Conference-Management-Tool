import { http } from './client';

export const reportsApi = {
    submissions: (params = {}) => http.get('/reports/submissions', { params }),
  reviews: (params = {}) => http.get('/reports/reviews', { params }),
  registrations: (params = {}) => http.get('/reports/registrations', { params }),
  conferences: (params = {}) => http.get('/reports/conferences', { params }),
};
