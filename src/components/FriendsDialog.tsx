
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, X, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

interface Friend {
  id: string;
  name: string;
  image: string;
}

interface FriendsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameSessionLink: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredFriends: Friend[];
  selectedFriends: string[];
  onToggleFriend: (friendId: string) => void;
  onCopyLink: () => void;
  onStartGame: () => void;
  user: any;
}

const FriendsDialog: React.FC<FriendsDialogProps> = ({
  open,
  onOpenChange,
  gameSessionLink,
  searchTerm,
  onSearchChange,
  filteredFriends,
  selectedFriends,
  onToggleFriend,
  onCopyLink,
  onStartGame,
  user
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle>Invite Friends to Play</DialogTitle>
          <DialogDescription>
            You can now share the game link that was copied to your clipboard. You can also select friends to invite to your game session. They'll receive a notification to join.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Input 
              value={gameSessionLink} 
              readOnly 
              className="flex-1"
            />
            <Button 
              size="sm" 
              onClick={onCopyLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          {user && (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus={false}
                />
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => (
                    <div
                      key={friend.id}
                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${
                        selectedFriends.includes(friend.id) ? 'bg-green-50' : ''
                      }`}
                      onClick={() => onToggleFriend(friend.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.image} alt={friend.name} />
                          <AvatarFallback>{friend.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{friend.name}</span>
                      </div>
                      {selectedFriends.includes(friend.id) ? (
                        <X className="h-5 w-5 text-gray-400" />
                      ) : (
                        <UserPlus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-500 py-2">
                    {user ? "No friends found" : "Sign in to invite friends"}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            variant="default" 
            className="w-full sm:w-auto"
            onClick={onStartGame}
          >
            Start Game {user && selectedFriends.length > 0 && `& Invite (${selectedFriends.length} selected)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FriendsDialog;
