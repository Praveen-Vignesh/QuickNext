import axios from 'axios';

const TOKEN_KEY = 'quicknext_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

// The API is a separate deployment (Render), so this must point at it in
// production. In dev it's a local process on :5000.
//
// Never fall back to localhost in a production build — that would tell every
// visitor's browser to call their own machine.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Unset in production means every request silently 404s against the static
// host, which looks like a broken app rather than a missing config. Say so.
if (!import.meta.env.DEV && !API_BASE_URL) {
  console.error(
    '[config] VITE_API_BASE_URL is not set. Set it to your deployed API URL in ' +
      'Vercel → Settings → Environment Variables, then redeploy (Vite bakes it in at build time).'
  );
}

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
