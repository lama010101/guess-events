
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, User, Trophy, Settings, Users } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

interface AuthButtonProps {
  topBar?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ topBar = false }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut, isLoading } = useAuth();
  
  // Track component mounting to prevent state updates on unmounted component
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      // Force reload after sign out to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  
  const handleViewProfile = () => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  };
  
  const handleGoToLeaderboard = () => {
    navigate('/leaderboard');
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };
  
  const handleGoToScraper = () => {
    navigate('/admin/scraper');
  };
  
  const handleContinueAsGuest = () => {
    setOpen(false);
  };
  
  // If the authentication data is loading and we're mounted, show a loading state
  // Limit loading state to 5 seconds to avoid infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (isLoading && isMounted) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isMounted]);
  
  // If loading took too long, show the login button anyway
  if (loadingTimeout) {
    return (
      <Button 
        variant={topBar ? "outline" : "default"} 
        onClick={() => setOpen(true)}
        size={topBar ? "sm" : "default"}
        className={`${topBar ? "h-8" : ""} cursor-pointer z-50 relative pointer-events-auto`}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {!topBar && "Register / Sign In"}
      </Button>
    );
  }
  
  // If the authentication data is loading, show a loading state with a timeout
  if (isLoading) {
    return (
      <Button 
        variant={topBar ? "outline" : "default"} 
        size={topBar ? "sm" : "default"}
        className={`${topBar ? "h-8" : ""} pointer-events-auto z-50`}
        disabled
      >
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }
  
  // If the user is authenticated, show the user avatar
  if (user && profile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full pointer-events-auto z-50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 z-[9999]" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile.username}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Account Settings
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleGoToLeaderboard} className="cursor-pointer">
            <Trophy className="mr-2 h-4 w-4" />
            <span>Leaderboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>Friends</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          {profile.role === 'admin' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleGoToAdmin} className="cursor-pointer">
                <span>Admin Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGoToScraper} className="cursor-pointer">
                <span>Scraper Dashboard</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
            <LogIn className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Enhanced responsiveness for auth button when user is not authenticated
  return (
    <>
      <Button 
        variant={topBar ? "outline" : "default"} 
        onClick={() => setOpen(true)}
        size={topBar ? "sm" : "default"}
        className={`${topBar ? "h-8" : ""} cursor-pointer z-50 relative pointer-events-auto`}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {!topBar && "Register / Sign In"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] z-[9999] overflow-visible">
          <DialogHeader>
            <DialogTitle>Account Access</DialogTitle>
            <DialogDescription>
              Create an account or sign in to save your progress and compete with friends.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={() => setOpen(false)} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSuccess={() => setOpen(false)} />
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center">
            <DialogClose asChild>
              <Button variant="outline" onClick={handleContinueAsGuest}>
                Continue as Guest
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthButton;
