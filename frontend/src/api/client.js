import axios from 'axios';

let accessToken = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token) => { accessToken = token; },
  clear: () => { accessToken = null; },
};

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        status: null,
        message: 'Network request failed.',
        errors: {},
        cause: error,
      });
    }

    const { status, data } = error.response;
    return Promise.reject({
      status,
      message: data?.message || `Request failed (${status}).`,
      errors: data?.errors || {},
      data,
    });
  }
);

export async function request(method, url, options = {}) {
  const { body, params, signal, ...config } = options;
  const response = await apiClient.request({
    method,
    url,
    params,
    signal,
    data: body,
    ...config,
  });
  return response.data;
}

export const http = {
  get: (url, options) => request('GET', url, options),
  post: (url, body, options) => request('POST', url, { ...options, body }),
  put: (url, body, options) => request('PUT', url, { ...options, body }),
  patch: (url, body, options) => request('PATCH', url, { ...options, body }),
  delete: (url, options) => request('DELETE', url, options),
};
//ntuthuko939