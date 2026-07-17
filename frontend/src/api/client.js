import axios from 'axios';

const TOKEN_KEY = 'quicknext_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

// Deployed on Vercel the API is same-origin (/api/* is rewritten to the
// serverless function), so an empty baseURL is correct there and there is no
// cross-origin request at all. In dev the API is a separate process on :5000.
// Setting VITE_API_BASE_URL explicitly overrides both — use it only if the API
// really is on another host.
//
// Note the deliberate `''` rather than a `||` fallback to localhost: an unset
// var in production must mean "same origin", not "the visitor's own machine".
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({ baseURL: API_BASE_URL });

// Bearer header rather than cookies: no SameSite or third-party-cookie problems
// if the API ever does move to another domain.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or revoked session shouldn't leave a dead token in storage.
    if (error.response?.status === 401) setToken(null);
    return Promise.reject(error);
  }
);

/** Pull the server's error message out of an axios error for display. */
export const errorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.error || error?.message || fallback;

export default api;
