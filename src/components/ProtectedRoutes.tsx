
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
  
  // Special case for /adminlolo route
  if (location.pathname === '/adminlolo') {
    return <>{children}</>;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  // If no user, redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // If a specific role is required
  if (requiredRole && (!profile || profile.role !== requiredRole)) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, render the children
  return <>{children}</>;
};

export default ProtectedRoutes;
