
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { User, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

interface AuthButtonProps {
  topBar?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ topBar = false }) => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  
  if (user) {
    return (
      <Button 
        onClick={signOut} 
        variant={topBar ? "ghost" : "outline"}
        size={topBar ? "sm" : "default"}
        className="relative z-[9999]"
      >
        Sign Out
      </Button>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={topBar ? "ghost" : "default"}
          size={topBar ? "sm" : "default"}
          className="relative z-[9999]"
        >
          {topBar ? (
            <User className="h-5 w-5" />
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Sign In / Register
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new account to save your progress and compete with others.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSuccess={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthButton;
