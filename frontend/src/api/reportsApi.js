import { http } from './client';

export const reportsApi = {
  dashboard: () => http.get('/reports/dashboard'),
  submissions: () => http.get('/reports/submissions'),
  reviews: () => http.get('/reports/reviews'),
  registrations: () => http.get('/reports/registrations'),
  conferences: () => http.get('/reports/conferences'),
};