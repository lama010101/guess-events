
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RegisterFormProps {
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This is a placeholder for actual registration
    toast({
      title: "Registration successful",
      description: "Your account has been created. Welcome to Guess History!",
    });
    onSuccess();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" placeholder="Choose a username" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="your@email.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input id="confirm-password" type="password" required />
      </div>
      <Button type="submit" className="w-full">Create Account</Button>
    </form>
  );
};

export default RegisterForm;
