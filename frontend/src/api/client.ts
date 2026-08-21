import axios from 'axios';

/**
 * Reusable Axios instance for all API requests.
 *
 * - Base URL is read from the VITE_API_URL environment variable.
 * - withCredentials: true ensures HTTP-only auth cookies are automatically
 *   included in every request (no manual cookie reading or JWT storage).
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true,
});

export default apiClient;
