
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface ProtectedRoutesProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoutes = ({ children, requiredRole }: ProtectedRoutesProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being checked
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Check if user is authenticated when a role is required
  if (requiredRole && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (requiredRole && profile && profile.role !== requiredRole) {
    // Redirect to home if user doesn't have the required role
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Allow access to the route
  return <>{children}</>;
};

export default ProtectedRoutes;
