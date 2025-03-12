
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Globe, Wand2, Trophy, RefreshCw, Loader } from 'lucide-react';
import { GameSettings } from '@/types/game';
import { sampleEvents } from '@/data/sampleEvents';
import { useAuth } from '@/contexts/AuthContext';
import DailyCompetitionButton from './DailyCompetitionButton';
import AuthPromptDialog from './AuthPromptDialog';
import HomeHeader from './HomeHeader';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import SettingsDialog from './SettingsDialog';

interface HomeScreenProps {
  onStartGame: (settings: GameSettings) => void;
  isLoading?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame, isLoading = false }) => {
  const { user, profile } = useAuth();
  const { toast: uiToast } = useToast();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyScore, setDailyScore] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    distanceUnit: 'km',
    timerEnabled: false,
    timerDuration: 5,
    gameMode: 'classic'
  });
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      checkDailyCompetition();
    }
  }, [user]);

  useEffect(() => {
    if (profile && profile.default_distance_unit) {
      setSettings(prev => ({
        ...prev,
        distanceUnit: profile.default_distance_unit || 'km'
      }));
    }
  }, [profile]);

  const checkDailyCompetition = async () => {
    try {
      setDailyCompleted(false);
      setDailyScore(0);
    } catch (error) {
      console.error("Error checking daily competition:", error);
    }
  };

  const handleStartGame = async (settings: GameSettings) => {
    if (settings.gameMode === 'daily' && !user) {
      setShowAuthPrompt(true);
      return;
    }
    
    try {
      setLocalLoading(true);
      await onStartGame(settings);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Could not start game. Please try again later.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  // Use local loading state instead of the prop
  const buttonLoading = localLoading;

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col justify-center items-center">
      <HomeHeader onSettingsClick={() => setSettingsOpen(true)} />
      
      <div className="w-full max-w-4xl mx-auto pb-8 pt-20">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Time Trek</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="play" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="play" className="flex items-center gap-2">
                  <Map className="h-4 w-4" /> 
                  Play
                </TabsTrigger>
                <TabsTrigger value="compete" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Compete
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="play">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl flex items-center justify-center gap-2">
                        <Globe className="h-5 w-5" />
                        Classic Game
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Play a standard game with 5 rounds.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleStartGame({
                          ...settings,
                          gameMode: 'classic',
                          timerEnabled: false
                        })} 
                        className="w-full"
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Start Game"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl flex items-center justify-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Timed Challenge
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Race against the clock with a time limit.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleStartGame({
                          ...settings,
                          gameMode: 'timed',
                          timerEnabled: true
                        })} 
                        className="w-full"
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Start Timed Game"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="compete">
                <div className="space-y-4">
                  <DailyCompetitionButton
                    dailyCompleted={dailyCompleted}
                    dailyScore={dailyScore}
                    user={user}
                    onStartGame={() => handleStartGame({
                      ...settings,
                      gameMode: 'daily',
                      timerEnabled: false
                    })}
                    isLoading={buttonLoading}
                  />
                  
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">Friends Competition</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Challenge your friends with a custom game link.
                      </p>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleStartGame({
                          ...settings,
                          gameMode: 'friends',
                          timerEnabled: false
                        })}
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Create Challenge"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <AuthPromptDialog 
        open={showAuthPrompt} 
        onOpenChange={setShowAuthPrompt}
      />
      
      <SettingsDialog 
        open={settingsOpen}
        settings={settings}
        onOpenChange={setSettingsOpen}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
};

export default HomeScreen;
