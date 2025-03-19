import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Spinner } from '@/components/ui/spinner';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, UserCircle } from 'lucide-react';

interface AuthButtonProps {
  topBar?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ topBar = false }) => {
  const { user, profile, isLoading, signOut } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const showLoading = isLoading || !isMounted || localLoading;
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (!isMounted) return null;
  
  if (showLoading) {
    return (
      <Button variant="outline" disabled className="h-9 px-4">
        <Spinner size="sm" className="mr-2" />
        Loading...
      </Button>
    );
  }
  
  if (!user) {
    return (
      <Link to="/auth">
        <Button variant={topBar ? "outline" : "default"} className="h-9 px-4">
          <User className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </Link>
    );
  }
  
  const displayName = profile?.username || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-2 gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link to={`/profile/${user.id}`}>
          <DropdownMenuItem className="cursor-pointer">
            <UserCircle className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>
        </Link>
        <Link to="/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthButton;
