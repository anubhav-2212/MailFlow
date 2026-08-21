import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getCurrentUser,
  getGoogleLoginUrl,
  logout as apiLogout,
} from '../api/auth.api';
import type { User } from '../types/auth';

// ---------------------------------------------------------------------------
// Shape of what the context exposes
// ---------------------------------------------------------------------------
export interface AuthContextValue {
  /** Authenticated user, or null when logged out. */
  user: User | null;
  /** True while the initial /auth/me check (or a manual refresh) is in flight. */
  loading: boolean;
  /** Convenience flag derived from user. */
  isAuthenticated: boolean;
  /** Redirects the browser to the backend Google OAuth start URL. */
  login: () => void;
  /** Calls the backend logout endpoint, then clears local user state. */
  logout: () => Promise<void>;
  /** Re-fetches /auth/me and updates state (useful after token refresh etc.). */
  refreshUser: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context – exported so useAuth.ts can consume it
// ---------------------------------------------------------------------------
export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the current session from the backend.
  // The HTTP-only auth_token cookie is sent automatically.
  const refreshUser = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      // 401 (or any network error) → treat as logged out
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session once on mount
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  // Redirect the browser — no JS-level Google interaction
  const login = useCallback((): void => {
    window.location.href = getGoogleLoginUrl();
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiLogout();
    } finally {
      // Always clear local state even if the network call fails
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: user !== null,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
