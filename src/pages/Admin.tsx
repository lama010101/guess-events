
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash, Image, Plus, X, Ban, User, Users, Home, Search, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HistoricalEvent } from '@/types/game';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PhotoViewer from '@/components/PhotoViewer';
import AdminEventForm from '@/components/AdminEventForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [eventsSearchTerm, setEventsSearchTerm] = useState('');
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);

  // Load events from Supabase
  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, [currentPage, eventsSearchTerm]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      
      // Calculate pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      let query = supabase
        .from('historical_events')
        .select('*', { count: 'exact' });
      
      // Add search filter if search term exists
      if (eventsSearchTerm) {
        query = query.or(
          `year.ilike.%${eventsSearchTerm}%,` +
          `description.ilike.%${eventsSearchTerm}%,` +
          `location_name.ilike.%${eventsSearchTerm}%`
        );
      }
      
      // Add pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      if (data) {
        const formattedEvents = data.map(event => ({
          id: event.id,
          year: event.year,
          description: event.description,
          imageUrl: event.image_url,
          location: {
            name: event.location_name,
            lat: Number(event.latitude),
            lng: Number(event.longitude)
          }
        }));
        
        setEvents(formattedEvents);
        
        // Update total pages
        if (count !== null) {
          setTotalPages(Math.ceil(count / itemsPerPage));
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load historical events',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*');
      
      if (usersSearchTerm) {
        query = query.ilike('username', `%${usersSearchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('historical_events')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setEvents(events.filter(event => event.id !== id));
      toast({
        title: "Event deleted",
        description: "The event has been removed from the game."
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive'
      });
    }
  };

  const handleAddEvent = async (event: HistoricalEvent) => {
    try {
      const { data, error } = await supabase
        .from('historical_events')
        .insert({
          year: event.year,
          description: event.description,
          image_url: event.imageUrl,
          location_name: event.location.name,
          latitude: event.location.lat,
          longitude: event.location.lng
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newEvent = {
          id: data.id,
          year: data.year,
          description: data.description,
          imageUrl: data.image_url,
          location: {
            name: data.location_name,
            lat: Number(data.latitude),
            lng: Number(data.longitude)
          }
        };
        
        setEvents([newEvent, ...events]);
        setIsAdding(false);
        
        toast({
          title: "Event added",
          description: "The new event has been added to the game."
        });
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: 'Error',
        description: 'Failed to add event',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateEvent = async (event: HistoricalEvent) => {
    try {
      const { error } = await supabase
        .from('historical_events')
        .update({
          year: event.year,
          description: event.description,
          image_url: event.imageUrl,
          location_name: event.location.name,
          latitude: event.location.lat,
          longitude: event.location.lng
        })
        .eq('id', event.id);
        
      if (error) throw error;
      
      setEvents(events.map(e => e.id === event.id ? event : e));
      setSelectedEvent(null);
      
      toast({
        title: "Event updated",
        description: "The event has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = () => {
    setSelectedEvent(null);
    setIsAdding(false);
  };

  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const handleBanUser = async (userId: string, currentStatus: string) => {
    try {
      const newRole = currentStatus === 'banned' ? 'user' : 'banned';
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole === 'banned' ? 'user' : 'user',
          status: newRole
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newRole } : user
      ));
      
      toast({
        title: newRole === 'banned' ? "User banned" : "User unbanned",
        description: `The user has been ${newRole === 'banned' ? 'banned from' : 'restored to'} the platform.`
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Action failed',
        description: 'Failed to update user status',
        variant: 'destructive'
      });
    }
  };

  const handleSearchUsers = () => {
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-[#f3f3f3]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Back to Game
          </Button>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Image className="h-4 w-4" /> 
            Historical Events
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          {(isAdding || selectedEvent) ? (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{isAdding ? "Add New Event" : "Edit Event"}</CardTitle>
                <CardDescription>
                  {isAdding 
                    ? "Create a new historical event for the game" 
                    : "Update the details of this historical event"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminEventForm 
                  event={selectedEvent || undefined}
                  onSubmit={isAdding ? handleAddEvent : handleUpdateEvent}
                  onCancel={handleCancel}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manage Historical Events</CardTitle>
                  <CardDescription>
                    View, edit, and delete events used in the game
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Event
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events by year, description, or location..."
                        className="pl-8"
                        value={eventsSearchTerm}
                        onChange={(e) => setEventsSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-4">Loading events...</div>
                ) : (
                  <>
                    <Table>
                      <TableCaption>A list of all historical events in the game.</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="w-[40%]">Description</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.length > 0 ? (
                          events.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">{event.year}</TableCell>
                              <TableCell>{event.location.name}</TableCell>
                              <TableCell className="line-clamp-2">{event.description}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handlePreview(event.imageUrl)}
                                >
                                  <Image className="h-4 w-4 mr-2" />
                                  Preview
                                </Button>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedEvent(event)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleDeleteEvent(event.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No events found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span>
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>
                View user information and manage account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search users by username..." 
                      value={usersSearchTerm}
                      onChange={(e) => setUsersSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button onClick={handleSearchUsers}>Search</Button>
                </div>
              </div>
              
              <Table>
                <TableCaption>A list of all registered users.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} alt={user.username} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'banned' ? 'destructive' : 'default'}>
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/profile/${user.id}`)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            {user.status === 'banned' ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleBanUser(user.id, 'banned')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleBanUser(user.id, 'active')}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute top-4 right-4 z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <PhotoViewer src={previewImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
