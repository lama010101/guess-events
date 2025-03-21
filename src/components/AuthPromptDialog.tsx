
import React from 'react';
import { Button } from "@/components/ui/button";
import AuthButton from './AuthButton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueAsGuest?: () => void;
}

const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({
  open,
  onOpenChange,
  onContinueAsGuest
}) => {
  const { user } = useAuth();
  
  // Don't show the dialog if the user is already authenticated
  if (user) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[9999] overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" /> 
            Authentication Required
          </DialogTitle>
          <DialogDescription>
            Please sign in or register to play the Daily Competition, track your progress, and compete with friends.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <AuthButton />
          </div>
          <p className="text-sm text-center text-gray-500">
            Your scores will be saved to your account and appear on the leaderboard.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              onClick={onContinueAsGuest}
              className="relative"
            >
              Continue as Guest
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptDialog;
