import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // If the authentication check is in progress, you can render a loading spinner or null
    return <div>Loading...</div>; // Or <LoadingSpinner />
  }

  if (!isAuthenticated) {
    // If not authenticated, redirect to the login page,
    // preserving the current location so we can redirect back later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated and not loading, render the child components (e.g., the Home page)
  return <>{children}</>;
};

export default ProtectedRoute;