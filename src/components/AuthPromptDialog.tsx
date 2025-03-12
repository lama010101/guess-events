
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

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[9999]">
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
            <Button variant="outline">Continue as Guest</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptDialog;
