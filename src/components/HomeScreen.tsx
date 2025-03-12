import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Settings, Play, Shield, Copy, Users, Trophy, Search, X, UserPlus, Bell, User } from "lucide-react";
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
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface HomeScreenProps {
  onStartGame: (settings: GameSettings) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<GameSettings>({
    distanceUnit: 'km',
    timerEnabled: false,
    timerDuration: 5,
    gameMode: 'daily'
  });
  const [showFriendsDialog, setShowFriendsDialog] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyScore, setDailyScore] = useState(0);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [gameSessionLink, setGameSessionLink] = useState('');
  
  const todayDate = format(new Date(), 'MMMM d, yyyy');

  useEffect(() => {
    if (user) {
      checkDailyCompletion();
      fetchFriends();
    }
  }, [user]);

  const checkDailyCompletion = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('game_results')
        .select('*, game_sessions(*)')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .eq('game_sessions.game_mode', 'daily')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setDailyCompleted(true);
        setDailyScore(data[0].total_score);
      }
    } catch (error) {
      console.error('Error checking daily completion:', error);
    }
  };

  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          friend:profiles!friends_friend_id_fkey(
            id,
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');
      
      if (error) throw error;
      
      if (data) {
        const friends = data.map(item => ({
          id: item.friend.id,
          name: item.friend.username,
          image: item.friend.avatar_url,
        }));
        setFriendsList(friends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const filteredFriends = friendsList.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartGame = async (mode: 'daily' | 'friends' | 'single') => {
    const newSettings = {
      ...settings,
      gameMode: mode
    };
    
    if (mode === 'friends') {
      try {
        const creatorId = user ? user.id : 'anonymous';
        
        const { data, error } = await supabase
          .from('game_sessions')
          .insert({
            creator_id: creatorId,
            game_mode: 'friends',
            settings: newSettings
          })
          .select()
          .single();
          
        if (error) throw error;
        
        if (data) {
          const sessionUrl = `${window.location.origin}/game/${data.id}`;
          setGameSessionLink(sessionUrl);
          
          try {
            await navigator.clipboard.writeText(sessionUrl);
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
          }
          
          if (user) {
            setShowFriendsDialog(true);
          } else {
            setShowAuthPrompt(true);
          }
        }
      } catch (error) {
        console.error('Error creating game session:', error);
        toast({
          title: "Error",
          description: "Failed to create game session",
          variant: "destructive",
        });
      }
    } else {
      onStartGame(newSettings);
    }
  };

  const handleStartFriendsGame = async () => {
    try {
      await navigator.clipboard.writeText(gameSessionLink);
      
      if (user && selectedFriends.length > 0) {
        toast({
          title: "Invitations sent!",
          description: `Sent invitations to ${selectedFriends.length} friends.`,
        });
      }
      
      navigate(gameSessionLink);
      
      setShowFriendsDialog(false);
      setSelectedFriends([]);
    } catch (err) {
      toast({
        title: "Failed to copy link",
        description: "Please try again or share the URL manually.",
        variant: "destructive",
      });
    }
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameSessionLink);
      toast({
        title: "Link copied!",
        description: "Game link copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy link",
        description: "Please try again or share the URL manually.",
        variant: "destructive",
      });
    }
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
            onClick={() => handleStartGame('single')}
          >
            <User className="mr-2 h-4 w-4" /> Singleplayer
          </Button>
          
          {dailyCompleted ? (
            <Button 
              className="w-full" 
              size="lg" 
              disabled
            >
              <Trophy className="mr-2 h-4 w-4" /> Daily Competition Completed ({todayDate}): {dailyScore}
            </Button>
          ) : (
            <Button 
              className="w-full" 
              size="lg" 
              onClick={() => handleStartGame('daily')}
            >
              <Trophy className="mr-2 h-4 w-4" /> Daily Competition ({todayDate})
            </Button>
          )}
          
          <Button 
            className="w-full" 
            variant="outline" 
            size="lg" 
            onClick={() => handleStartGame('friends')}
          >
            <Users className="mr-2 h-4 w-4" /> Play with Friends
          </Button>
          
          {profile?.role === 'admin' && (
            <div className="flex w-full justify-center">
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                <Shield className="mr-1 h-3 w-3" /> Admin Panel
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
      
      <Dialog open={showFriendsDialog} onOpenChange={setShowFriendsDialog}>
        <DialogContent className="sm:max-w-md">
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
                onClick={handleCopyLink}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={handleStartFriendsGame}
            >
              Start Game {user && selectedFriends.length > 0 && `& Invite (${selectedFriends.length} selected)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Game Link Copied!</DialogTitle>
            <DialogDescription>
              You can now share the game link that was copied to your clipboard. Register or sign in to invite your friends to play.
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
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-center">
              <AuthButton />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="default" 
              className="w-full sm:w-auto"
              onClick={() => {
                navigate(gameSessionLink);
                setShowAuthPrompt(false);
              }}
            >
              Start Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeScreen;
