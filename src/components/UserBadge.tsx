
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Clock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface UserBadgeProps {
  role?: UserRole;
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

const UserBadge = ({ role, status, className }: UserBadgeProps) => {
  // Badge for user role
  if (role) {
    return (
      <Badge 
        variant={role === 'admin' ? 'destructive' : 'secondary'}
        className={className}
      >
        {role === 'admin' ? (
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" /> User
          </span>
        )}
      </Badge>
    );
  }
  
  // Badge for user status
  if (status) {
    const statusConfig = {
      online: { variant: 'default', icon: <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />, text: 'Online' },
      offline: { variant: 'outline' as const, icon: <div className="w-2 h-2 bg-gray-500 rounded-full mr-1" />, text: 'Offline' },
      away: { variant: 'secondary' as const, icon: <Clock className="w-3 h-3 mr-1" />, text: 'Away' }
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge variant={config.variant} className={className}>
        <span className="flex items-center">
          {config.icon} {config.text}
        </span>
      </Badge>
    );
  }
  
  return null;
};

export default UserBadge;
