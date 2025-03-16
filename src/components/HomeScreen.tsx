import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Shield, Users, User, Database, Calendar } from "lucide-react";
import { GameSettings } from '@/types/game';
import { useToast } from "@/hooks/use-toast";
import AuthButton from './AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DailyCompetitionButton from './DailyCompetitionButton';
import FriendsDialog from './FriendsDialog';
import AuthPromptDialog from './AuthPromptDialog';
import GameHeader from './GameHeader';

interface HomeScreenProps {
  onStartGame: (settings: GameSettings) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<GameSettings>({
    distanceUnit: profile?.default_distance_unit || 'km',
    timerEnabled: false,
    timerDuration: 5,
    gameMode: 'daily',
    hintsEnabled: true,
    maxHints: 2
  });
  
  const [showFriendsDialog, setShowFriendsDialog] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyScore, setDailyScore] = useState(0);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [gameSessionLink, setGameSessionLink] = useState('');

  useEffect(() => {
    if (user) {
      checkDailyCompletion();
      fetchFriends();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setSettings(prev => ({
        ...prev,
        distanceUnit: profile.default_distance_unit || 'km'
      }));
    }
  }, [profile]);

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
    if (mode === 'daily' && !user) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to play the Daily Competition.",
        variant: "destructive"
      });
      setShowAuthPrompt(true);
      return;
    }
    
    const newSettings = {
      ...settings,
      gameMode: mode,
      hintsEnabled: true,
      maxHints: 2
    };
    
    if (mode === 'friends') {
      try {
        const creatorId = user ? user.id : null;
        
        const { data, error } = await supabase
          .from('game_sessions')
          .insert({
            creator_id: creatorId,
            game_mode: 'friends',
            settings: newSettings
          })
          .select()
          .single();
          
        if (error) {
          console.error('Error creating game session:', error);
          throw error;
        }
        
        if (data) {
          const sessionUrl = `${window.location.origin}/game/${data.id}`;
          setGameSessionLink(sessionUrl);
          
          try {
            await navigator.clipboard.writeText(sessionUrl);
            toast({
              title: "Game link copied",
              description: "Share this with your friends to play together!",
            });
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
          }
          
          if (user) {
            setShowFriendsDialog(true);
          } else {
            navigate(sessionUrl);
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

  const handleContinueAsGuest = () => {
    setShowAuthPrompt(false);
    
    onStartGame({
      ...settings,
      gameMode: 'single',
      hintsEnabled: true,
      maxHints: 2
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f3f3f3]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">HISTORYGUESS</h1>
            <AuthButton topBar={true} />
          </div>
        </div>
      </div>
      
      <Card className="w-full max-w-lg mt-16">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">HISTORYGUESS</CardTitle>
          <CardDescription>Test your knowledge of historical events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <DailyCompetitionButton 
              dailyCompleted={dailyCompleted}
              dailyScore={dailyScore}
              user={user}
              onStartGame={() => handleStartGame('daily')}
            />
            
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
            variant="secondary"
            onClick={() => handleStartGame('single')}
          >
            <User className="mr-2 h-4 w-4" /> Singleplayer
          </Button>
          
          <Button 
            className="w-full"
            variant="outline"
            size="lg" 
            onClick={() => handleStartGame('friends')}
          >
            <Users className="mr-2 h-4 w-4" /> Play with Friends
          </Button>
          
          <div className="flex w-full justify-center gap-4">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center">
              <Shield className="mr-1 h-3 w-3" /> Admin Panel
            </Link>
            <Link to="/admin/scraper" className="text-sm text-muted-foreground hover:text-primary flex items-center">
              <Database className="mr-1 h-3 w-3" /> Scraper Dashboard
            </Link>
            <Link to="/adminlolo" className="text-sm text-muted-foreground hover:text-primary flex items-center">
              <Shield className="mr-1 h-3 w-3" /> Admin Access
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      <FriendsDialog 
        open={showFriendsDialog}
        onOpenChange={setShowFriendsDialog}
        gameSessionLink={gameSessionLink}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filteredFriends={filteredFriends}
        selectedFriends={selectedFriends}
        onToggleFriend={toggleFriendSelection}
        onCopyLink={handleCopyLink}
        onStartGame={handleStartFriendsGame}
        user={user}
      />

      <AuthPromptDialog 
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
        onContinueAsGuest={handleContinueAsGuest}
      />
    </div>
  );
};

export default HomeScreen;
