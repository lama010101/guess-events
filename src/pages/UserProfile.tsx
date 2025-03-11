
import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Settings, Home, Medal, BarChart, Camera, CameraIcon } from "lucide-react";
import AuthButton from '@/components/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const UserProfile = () => {
  const { userId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile, updateProfile, updateAvatar } = useAuth();
  const [username, setUsername] = useState('');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    averageScore: 0,
    highestDailyScore: 0,
    perfectYearGuesses: 0,
    perfectLocationGuesses: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load profile data
  React.useEffect(() => {
    if (user && userId) {
      const isOwn = user.id === userId;
      setIsOwnProfile(isOwn);
      
      if (isOwn && profile) {
        setUsername(profile.username);
        setDistanceUnit(profile.default_distance_unit);
        loadStats(userId);
      } else {
        loadUserData(userId);
      }
    }
  }, [user, userId, profile]);
  
  const loadUserData = async (id: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setUserData(data);
        setUsername(data.username);
        setDistanceUnit(data.default_distance_unit);
        loadStats(id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadStats = async (id: string) => {
    try {
      // Get game results
      const { data: gameResults, error: gameError } = await supabase
        .from('game_results')
        .select('*')
        .eq('user_id', id);
        
      if (gameError) throw gameError;
      
      if (gameResults) {
        // Calculate stats
        const gamesPlayed = gameResults.length;
        const totalScore = gameResults.reduce((sum, game) => sum + game.total_score, 0);
        const averageScore = gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;
        const highestScore = gamesPlayed > 0 ? Math.max(...gameResults.map(game => game.total_score)) : 0;
        
        // Parse round results to calculate perfect guesses
        let perfectYearGuesses = 0;
        let perfectLocationGuesses = 0;
        
        gameResults.forEach(game => {
          if (!game.round_results) return;
          
          const rounds = Array.isArray(game.round_results) ? game.round_results : [];
          rounds.forEach((round: any) => {
            if (round.yearDifference === 0) {
              perfectYearGuesses++;
            }
            if (round.distance !== undefined && round.distance < 100) {
              perfectLocationGuesses++;
            }
          });
        });
        
        setStats({
          gamesPlayed,
          totalScore,
          averageScore,
          highestDailyScore: highestScore,
          perfectYearGuesses,
          perfectLocationGuesses
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!isOwnProfile || !user) return;
    
    try {
      setIsLoading(true);
      const { error } = await updateProfile({
        username,
        default_distance_unit: distanceUnit
      });
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;
    
    try {
      setIsLoading(true);
      const { error } = await updateAvatar(file);
      
      if (error) throw error;
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.'
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to update profile picture',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddFriend = (friendId: string) => {
    // Implementation for adding friends
    toast({
      title: "Friend request sent",
      description: "They will be notified of your request."
    });
  };
  
  const displayProfile = isOwnProfile ? profile : userData;
  
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view profiles
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (isLoading && !displayProfile) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] p-4 flex flex-col items-center justify-center">
        <div>Loading profile...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f3f3f3] p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <AuthButton topBar />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  {isOwnProfile ? 
                    "Manage your personal information" : 
                    `Viewing ${displayProfile?.username}'s profile`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={displayProfile?.avatar_url || ''} alt={displayProfile?.username} />
                    <AvatarFallback>{displayProfile?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    
                    {isOwnProfile && (
                      <div className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full">
                        <CameraIcon className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </Avatar>
                  
                  {isOwnProfile && (
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  )}
                </div>
                <h2 className="text-xl font-bold">{displayProfile?.username}</h2>
                
                {isOwnProfile && (
                  <div className="w-full mt-6 space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        value={username} 
                        className="mt-1" 
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultUnit">Default Distance Unit</Label>
                      <select 
                        id="defaultUnit" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={distanceUnit}
                        onChange={(e) => setDistanceUnit(e.target.value as 'km' | 'miles')}
                      >
                        <option value="km">Kilometers</option>
                        <option value="miles">Miles</option>
                      </select>
                    </div>
                  </div>
                )}
              </CardContent>
              {isOwnProfile && (
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handleSaveChanges}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Statistics
                </TabsTrigger>
                <TabsTrigger value="friends" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Friends
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats">
                <Card>
                  <CardHeader>
                    <CardTitle>Game Statistics</CardTitle>
                    <CardDescription>View performance and achievements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm text-gray-500">Games Played</h3>
                        <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm text-gray-500">Average Score</h3>
                        <p className="text-2xl font-bold">{stats.averageScore.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm text-gray-500">Total Score</h3>
                        <p className="text-2xl font-bold">{stats.totalScore.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm text-gray-500">Highest Daily Score</h3>
                        <p className="text-2xl font-bold">{stats.highestDailyScore.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Achievements</h3>
                      <div className="flex flex-wrap gap-2">
                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center">
                          <Medal className="h-4 w-4 mr-1" />
                          Perfect Year Guesses: {stats.perfectYearGuesses}
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                          <Medal className="h-4 w-4 mr-1" />
                          Perfect Location Guesses: {stats.perfectLocationGuesses}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="friends">
                <Card>
                  <CardHeader>
                    <CardTitle>Friends</CardTitle>
                    <CardDescription>Manage your friends and find new players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Label htmlFor="searchFriends">Find Players</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          id="searchFriends" 
                          placeholder="Search by username..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button>Search</Button>
                      </div>
                    </div>
                    
                    {searchTerm && (
                      <div className="mb-6">
                        <h3 className="font-semibold mb-2">Search Results</h3>
                        <div className="space-y-2">
                          {/* Placeholder for search results */}
                          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>HB</AvatarFallback>
                              </Avatar>
                              <span>HistoryBuff</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleAddFriend("1")}
                            >
                              Add Friend
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold mb-2">Your Friends</h3>
                      <div className="space-y-2">
                        {/* Placeholder for friends list */}
                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>MM</AvatarFallback>
                              </Avatar>
                              <span>MapMaster</span>
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                            >
                              Invite to Game
                            </Button>
                          </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
