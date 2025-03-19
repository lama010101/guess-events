
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, User, Trophy, Settings, Users } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

interface AuthButtonProps {
  topBar?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ topBar = false }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut, isLoading } = useAuth();
  
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  
  const handleViewProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  };
  
  const handleGoToLeaderboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/leaderboard');
  };

  const handleGoToSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/settings');
  };

  const handleGoToFriends = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/friends');
  };

  const handleGoToAdmin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/admin');
  };
  
  const handleGoToScraper = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/admin/scraper');
  };
  
  const handleOpenDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };
  
  const handleAuthSuccess = () => {
    setOpen(false);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <Button 
        variant={topBar ? "outline" : "default"} 
        size={topBar ? "sm" : "default"}
        className={`${topBar ? "h-8" : ""} pointer-events-auto z-50`}
        disabled
        type="button"
      >
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }
  
  // Not authenticated
  if (!user) {
    return (
      <>
        <Button 
          variant={topBar ? "outline" : "default"} 
          onClick={handleOpenDialog}
          size={topBar ? "sm" : "default"}
          className={`${topBar ? "h-8" : ""} cursor-pointer z-50 relative pointer-events-auto`}
          type="button"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {!topBar && "Register / Sign In"}
        </Button>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md z-[9999]">
            <DialogHeader>
              <DialogTitle>Sign In or Register</DialogTitle>
              <DialogDescription>
                Create an account or sign in to access all features
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm onSuccess={handleAuthSuccess} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm onSuccess={handleAuthSuccess} />
              </TabsContent>
            </Tabs>
            
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setOpen(false)} type="button">
                Continue as Guest
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // If the user is authenticated, show the user avatar
  if (user && profile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full pointer-events-auto z-50" type="button">
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
          <DropdownMenuItem onClick={handleGoToFriends} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>Friends</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleGoToSettings} className="cursor-pointer">
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
  
  // Fallback return
  return (
    <Button 
      variant={topBar ? "outline" : "default"} 
      onClick={handleOpenDialog}
      size={topBar ? "sm" : "default"}
      className={`${topBar ? "h-8" : ""}`}
      type="button"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      {!topBar && "Sign In"}
    </Button>
  );
};

export default AuthButton;
