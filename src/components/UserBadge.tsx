
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserBadgeProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away';
  role?: 'user' | 'admin' | 'mod';
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({
  username,
  avatarUrl,
  size = 'md',
  status,
  role,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  
  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
  };
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive' as const;
      case 'mod':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={avatarUrl || ''} alt={username} />
          <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {status && (
          <span 
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-white', 
              statusColor[status],
              size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'
            )} 
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className={cn(
          'font-medium', 
          size === 'sm' ? 'text-sm' : 'text-base'
        )}>
          {username}
        </span>
        {role && (
          <Badge variant={getRoleBadgeVariant(role)} className="text-xs">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default UserBadge;
