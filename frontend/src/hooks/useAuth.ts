import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../context/AuthContext';

/**
 * Returns the current auth context value.
 *
 * @throws If called outside of an <AuthProvider> tree.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
}
