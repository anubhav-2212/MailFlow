import apiClient from './client';
import type { User } from '../types/auth';

interface GetCurrentUserResponse {
  user: User;
}

/**
 * Returns the backend URL that starts the Google OAuth flow.
 */
export function getGoogleLoginUrl(): string {
  return `${import.meta.env.VITE_API_URL as string}/auth/google`;
}

/**
 * Fetches the currently authenticated user.
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<GetCurrentUserResponse>(
    '/auth/me',
  );

  return response.data.user;
}

/**
 * Logs the current user out.
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}