
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This is a placeholder for actual authentication
    toast({
      title: "Sign in successful",
      description: "Welcome back! You are now signed in.",
    });
    onSuccess();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="your@email.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required />
      </div>
      <Button type="submit" className="w-full">Sign In</Button>
    </form>
  );
};

export default LoginForm;
