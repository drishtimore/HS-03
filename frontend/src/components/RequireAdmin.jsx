import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard that only allows users with role === 'admin'.
 * Non-admin users are redirected to /library.
 */
export default function RequireAdmin({ children }) {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/library" replace />;
  }

  return children;
}
