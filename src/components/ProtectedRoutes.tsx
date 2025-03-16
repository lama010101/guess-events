
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface ProtectedRoutesProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoutes = ({ children }: ProtectedRoutesProps) => {
  // Allow all users to access routes
  return <>{children}</>;
};

export default ProtectedRoutes;
