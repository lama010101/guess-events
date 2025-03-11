
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Settings, Home, Medal, BarChart } from "lucide-react";
import AuthButton from '@/components/AuthButton';

const UserProfile = () => {
  const { userId } = useParams();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Placeholder for user data. This would come from an API in a real app
  const user = {
    id: userId || '1',
    username: 'HistoryBuff',
    email: 'user@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop',
    stats: {
      gamesPlayed: 42,
      totalScore: 178500,
      averageScore: 8500,
      highestDailyScore: 9800
    },
    preferences: {
      defaultDistanceUnit: 'km' as const
    }
  };
  
  // Placeholder for friends list
  const friends = [
    { id: '2', username: 'HistoryNerd', online: true },
    { id: '3', username: 'TimeTraveler', online: false },
    { id: '4', username: 'MapMaster', online: true }
  ];
  
  // Placeholder for search results
  const searchResults = [
    { id: '5', username: 'GeographyPro', isFriend: false },
    { id: '6', username: 'WorldExplorer', isFriend: true }
  ];
  
  const handleAddFriend = (friendId: string) => {
    toast({
      title: "Friend request sent",
      description: "They will be notified of your request."
    });
  };
  
  const handleChangeAvatar = () => {
    toast({
      title: "Profile picture updated",
      description: "Your new profile picture has been saved."
    });
  };
  
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
          <AuthButton />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    className="absolute bottom-0 right-0" 
                    onClick={handleChangeAvatar}
                  >
                    Change
                  </Button>
                </div>
                <h2 className="text-xl font-bold">{user.username}</h2>
                <p className="text-gray-500">{user.email}</p>
                
                <div className="w-full mt-6 space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={user.username} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="defaultUnit">Default Distance Unit</Label>
                    <select 
                      id="defaultUnit" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={user.preferences.defaultDistanceUnit}
                    >
                      <option value="km">Kilometers</option>
                      <option value="miles">Miles</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Save Changes</Button>
              </CardFooter>
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
                    <CardDescription>View your performance and achievements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm text-gray-500">Games Played</h3>
                        <p className="text-2xl font-bold">{user.stats.gamesPlayed}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm text-gray-500">Average Score</h3>
                        <p className="text-2xl font-bold">{user.stats.averageScore.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm text-gray-500">Total Score</h3>
                        <p className="text-2xl font-bold">{user.stats.totalScore.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm text-gray-500">Highest Daily Score</h3>
                        <p className="text-2xl font-bold">{user.stats.highestDailyScore.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Achievements</h3>
                      <div className="flex flex-wrap gap-2">
                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center">
                          <Medal className="h-4 w-4 mr-1" />
                          Top 10% Daily
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                          <Medal className="h-4 w-4 mr-1" />
                          Perfect Year Guess
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
                          {searchResults.map(result => (
                            <div key={result.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{result.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span>{result.username}</span>
                              </div>
                              <Button 
                                size="sm" 
                                variant={result.isFriend ? "outline" : "default"}
                                onClick={() => handleAddFriend(result.id)}
                                disabled={result.isFriend}
                              >
                                {result.isFriend ? 'Friends' : 'Add Friend'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold mb-2">Your Friends</h3>
                      <div className="space-y-2">
                        {friends.map(friend => (
                          <div key={friend.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span>{friend.username}</span>
                              <span className={`h-2 w-2 rounded-full ${friend.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                            >
                              Invite to Game
                            </Button>
                          </div>
                        ))}
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
