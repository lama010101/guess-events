
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useAuth } from '@/contexts/AuthContext';

interface AuthButtonProps {
  topBar?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ topBar = false }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(topBar ? "register" : "login");
  const { user } = useAuth();

  if (user) {
    return null;
  }

  const handleSuccess = () => {
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleButtonClick = () => {
    // If in topBar mode, pre-select the register tab
    if (topBar) {
      setActiveTab("register");
    }
    setOpen(true);
  };

  return (
    <>
      <Button 
        variant={topBar ? "outline" : "default"} 
        onClick={handleButtonClick}
      >
        {topBar ? "Register" : "Register / Sign In"}
      </Button>
      
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px] z-[9999]">
          <DialogHeader>
            <DialogTitle>Welcome to HistoryGuessr</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue={topBar ? "register" : "login"} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-4">
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            
            <TabsContent value="register" className="mt-4">
              <RegisterForm onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthButton;
