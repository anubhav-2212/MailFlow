/**
 * Matches the shape returned by GET /api/v1/auth/me on the backend.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}
