
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Settings, Play, Shield, Copy, Users, Trophy, Search, X, UserPlus, Bell } from "lucide-react";
import { GameSettings } from '@/types/game';
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AuthButton from './AuthButton';

interface HomeScreenProps {
  onStartGame: (settings: GameSettings) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GameSettings>({
    distanceUnit: 'km',
    timerEnabled: false,
    timerDuration: 5,
    gameMode: 'daily'
  });
  const [showFriendsDialog, setShowFriendsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Mock friends data
  const allFriends = [
    { id: "1", name: "HistoryBuff", image: "https://i.pravatar.cc/150?img=1" },
    { id: "2", name: "MapMaster", image: "https://i.pravatar.cc/150?img=2" },
    { id: "3", name: "TimeTraveler", image: "https://i.pravatar.cc/150?img=3" },
    { id: "4", name: "HistoryNerd", image: "https://i.pravatar.cc/150?img=4" },
    { id: "5", name: "GeographyPro", image: "https://i.pravatar.cc/150?img=5" },
  ];

  const filteredFriends = allFriends.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartGame = (mode: 'daily' | 'friends') => {
    const newSettings = {
      ...settings,
      gameMode: mode
    };
    
    if (mode === 'friends') {
      setShowFriendsDialog(true);
    } else {
      onStartGame(newSettings);
    }
  };

  const handleStartFriendsGame = () => {
    // Copy the game session link to clipboard
    const gameURL = window.location.href;
    navigator.clipboard.writeText(gameURL)
      .then(() => {
        toast({
          title: "Link copied!",
          description: "Game link copied to clipboard. Share with your friends!",
        });
        
        // Send notifications to selected friends
        if (selectedFriends.length > 0) {
          toast({
            title: "Invitations sent!",
            description: `Sent invitations to ${selectedFriends.length} friends.`,
          });
        }
        
        onStartGame({
          ...settings,
          gameMode: 'friends'
        });
        
        setShowFriendsDialog(false);
        setSelectedFriends([]);
      })
      .catch(err => {
        toast({
          title: "Failed to copy link",
          description: "Please try again or share the URL manually.",
          variant: "destructive",
        });
      });
  };

  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f3f3f3]">
      <div className="absolute top-4 right-4">
        <AuthButton />
      </div>
      
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">GUESS HISTORY</CardTitle>
          <CardDescription>Test your knowledge of historical events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium leading-none">Enable Timer</h4>
                  <p className="text-sm text-muted-foreground">
                    Play with a time limit for each round
                  </p>
                </div>
                <Switch
                  id="timer-enabled"
                  checked={settings.timerEnabled}
                  onCheckedChange={(checked) => handleSettingChange('timerEnabled', checked)}
                />
              </div>
              
              {settings.timerEnabled && (
                <div className="pt-2 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="timer-duration">Timer Duration: {settings.timerDuration} minutes</Label>
                  </div>
                  <Slider
                    id="timer-duration"
                    min={1}
                    max={10}
                    step={1}
                    value={[settings.timerDuration]}
                    onValueChange={(value) => handleSettingChange('timerDuration', value[0])}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => handleStartGame('daily')}
          >
            <Trophy className="mr-2 h-4 w-4" /> Daily Competition
          </Button>
          <Button 
            className="w-full" 
            variant="outline" 
            size="lg" 
            onClick={() => handleStartGame('friends')}
          >
            <Users className="mr-2 h-4 w-4" /> Play with Friends
          </Button>
          <div className="flex w-full justify-center">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center">
              <Shield className="mr-1 h-3 w-3" /> Admin Panel
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={showFriendsDialog} onOpenChange={setShowFriendsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Friends to Play</DialogTitle>
            <DialogDescription>
              Select friends to invite to your game session. They'll receive a notification to join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredFriends.length > 0 ? (
                filteredFriends.map(friend => (
                  <div
                    key={friend.id}
                    className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${
                      selectedFriends.includes(friend.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleFriendSelection(friend.id)}
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
                <p className="text-center text-sm text-gray-500 py-2">No friends found</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="default" 
              className="w-full sm:w-auto"
              onClick={handleStartFriendsGame}
            >
              Start Game & Invite ({selectedFriends.length} selected)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeScreen;
