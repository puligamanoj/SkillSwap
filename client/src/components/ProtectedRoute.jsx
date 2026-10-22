import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, guestOnly = false }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          backgroundColor: 'var(--bg-main)',
        }}
      >
        <LoadingSpinner size={36} label="Verifying session..." />
      </div>
    );
  }

  // If user is already logged in and tries to access /login or /register
  if (guestOnly) {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // If user is not logged in and tries to access protected page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
