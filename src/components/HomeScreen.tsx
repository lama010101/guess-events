
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GameSettings } from '@/types/game';
import { useToast } from "@/hooks/use-toast";
import AuthButton from './AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import FriendsDialog from './FriendsDialog';
import AuthPromptDialog from './AuthPromptDialog';
import GameModeButtons from './home/GameModeButtons';
import GameSettingsComponent from './home/GameSettings';
import AdminLinks from './home/AdminLinks';

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
      console.log("User authenticated, fetching data...");
      checkDailyCompletion();
      fetchFriends();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      console.log("Profile loaded, updating settings");
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

  const handleStartGame = async (mode: 'daily' | 'friends' | 'single') => {
    console.log(`Starting game in ${mode} mode`);
    
    // Always ensure hints settings are properly set
    const newSettings = {
      ...settings,
      gameMode: mode,
      hintsEnabled: settings.hintsEnabled,
      maxHints: settings.hintsEnabled ? 2 : 0
    };
    
    if (mode === 'friends') {
      try {
        const creatorId = user?.id;
        if (!creatorId) {
          toast({
            title: "Authentication Required",
            description: "You need to sign in to play with friends.",
            variant: "destructive"
          });
          setShowAuthPrompt(true);
          return;
        }
        
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
          
          setShowFriendsDialog(true);
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
      console.log("Calling onStartGame with settings:", newSettings);
      // Direct call to start single player or daily game
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
    if (key === 'hintsEnabled') {
      // When changing hints enabled, automatically set maxHints to 2 or 0
      setSettings(prev => ({
        ...prev,
        hintsEnabled: value,
        maxHints: value ? 2 : 0
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
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
            <GameModeButtons 
              dailyCompleted={dailyCompleted}
              dailyScore={dailyScore}
              onStartGame={handleStartGame}
              setShowAuthPrompt={setShowAuthPrompt}
            />
            
            <GameSettingsComponent
              settings={settings}
              onSettingChange={handleSettingChange}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <AdminLinks isAdmin={profile?.role === 'admin'} />
        </CardFooter>
      </Card>
      
      {user && (
        <FriendsDialog 
          open={showFriendsDialog}
          onOpenChange={setShowFriendsDialog}
          gameSessionLink={gameSessionLink}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredFriends={friendsList.filter(friend => 
            friend.name.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          selectedFriends={selectedFriends}
          onToggleFriend={toggleFriendSelection}
          onCopyLink={handleCopyLink}
          onStartGame={handleStartFriendsGame}
          user={user}
        />
      )}

      <AuthPromptDialog 
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
        onContinueAsGuest={handleContinueAsGuest}
      />
    </div>
  );
};

export default HomeScreen;
