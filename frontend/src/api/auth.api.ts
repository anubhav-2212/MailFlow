import apiClient from './client';
import type { User } from '../types/auth';

/**
 * Returns the backend URL that starts the Google OAuth flow.
 * Redirect the browser to this URL — do NOT call Google directly from JS.
 *
 * Example:
 *   window.location.href = getGoogleLoginUrl();
 */
export function getGoogleLoginUrl(): string {
  return `${import.meta.env.VITE_API_URL as string}/auth/google`;
}

/**
 * Fetches the currently authenticated user from the backend.
 * The auth_token HTTP-only cookie is sent automatically via withCredentials.
 *
 * @returns The authenticated User, or throws if unauthenticated (401).
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}

/**
 * Logs the current user out by invalidating the session on the backend.
 * The server is responsible for clearing the auth_token cookie.
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
