import axios from 'axios';

const TOKEN_KEY = 'quicknext_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

// Bearer header rather than cookies: no SameSite or third-party-cookie problems
// once the frontend and API are on different domains.
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
