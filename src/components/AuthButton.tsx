
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, User } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
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

interface AuthButtonProps {
  topBar?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ topBar = false }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  // Mock logged-in state for demo
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    id: "123",
    username: "HistoryBuff",
    profilePicture: "https://i.pravatar.cc/150?img=3"
  });
  
  const handleGoogleSignIn = () => {
    // Mock Google sign-in
    setIsLoggedIn(true);
    setOpen(false);
  };
  
  const handleSignOut = () => {
    setIsLoggedIn(false);
  };
  
  const handleViewProfile = () => {
    navigate(`/profile/${userData.id}`);
  };
  
  if (isLoggedIn) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData.profilePicture} alt={userData.username} />
              <AvatarFallback>{userData.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userData.username}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Account Settings
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewProfile}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Game Stats</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Friends</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogIn className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <>
      <Button 
        variant={topBar ? "outline" : "default"} 
        onClick={() => setOpen(true)}
        size={topBar ? "sm" : "default"}
        className={topBar ? "h-8" : ""}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {!topBar && "Register / Sign In"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Account Access</DialogTitle>
            <DialogDescription>
              Create an account or sign in to save your progress and compete with friends.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={handleGoogleSignIn}
            >
              <svg 
                className="mr-2 h-4 w-4" 
                viewBox="0 0 24 24" 
                width="24" 
                height="24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" 
                  fill="#4285F4" 
                />
                <path 
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" 
                  fill="#34A853" 
                />
                <path 
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" 
                  fill="#FBBC05" 
                />
                <path 
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" 
                  fill="#EA4335" 
                />
              </svg>
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={() => {
                setIsLoggedIn(true);
                setOpen(false);
              }} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSuccess={() => {
                setIsLoggedIn(true);
                setOpen(false);
              }} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthButton;
