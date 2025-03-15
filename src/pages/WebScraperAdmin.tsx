
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Trash2, ArrowUpCircle, Clock, Search, AlertTriangle, 
  Calendar, Map, Link, Image, Play, Pause, RefreshCw, CheckCircle,
  X, Database, Eye, Download, Filter, Settings
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { HistoricalEventDB, ScraperLog, ScraperSettings, ScraperSourceDetail } from '@/types/scraper';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DEFAULT_SCRAPER_SETTINGS: Partial<ScraperSettings> = {
  auto_run_interval: 24, // 24 hours
  is_running: false,
  enabled_sources: [
    "USA Today Historical Events",
    "Rare Historical Photos",
    "Demilked Historical Pics"
  ]
};

const WebScraperAdmin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  // State for events management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  
  // State for scraper controls
  const [isStartingScraper, setIsStartingScraper] = useState(false);
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const [scraperProgress, setScraperProgress] = useState(0);
  const [scraperResults, setScraperResults] = useState<any>(null);
  
  // Settings state
  const [newSettings, setNewSettings] = useState<Partial<ScraperSettings>>(DEFAULT_SCRAPER_SETTINGS);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You need administrator privileges to access this page.",
        variant: "destructive"
      });
    }
  }, [profile, navigate, toast]);

  // Fetch historical events
  const { 
    data: events = [], 
    isLoading: isLoadingEvents,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['historical-events', searchTerm, showDeleted],
    queryFn: async () => {
      try {
        let query = supabase
          .from('historical_events')
          .select('*');
        
        // Filter by search term if provided
        if (searchTerm) {
          query = query.or(
            `description.ilike.%${searchTerm}%,` +
            `location_name.ilike.%${searchTerm}%`
          );
        }
        
        // Filter by deleted status
        if (!showDeleted) {
          query = query.eq('deleted', false);
        }
        
        // Order by created_at
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Add missing fields expected by the component
        return (data as any[]).map(event => ({
          ...event,
          title: event.location_name,
          event_date: event.year?.toString(),
          source_name: "Historical Database",
          source_url: "",
          deleted: event.deleted || false
        })) as HistoricalEventDB[];
      } catch (error) {
        console.error('Error fetching events:', error);
        return [];
      }
    }
  });

  // Fetch scraper logs using stored procedure
  const { 
    data: scraperLogs = [], 
    isLoading: isLoadingLogs,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['scraper-logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_scraper_logs');
        
        if (error) throw error;
        return data as ScraperLog[];
      } catch (error) {
        console.error('Error fetching scraper logs:', error);
        return [];
      }
    }
  });

  // Fetch scraper settings using stored procedure
  const { 
    data: scraperSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['scraper-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_scraper_settings');
        
        if (error) {
          // If no settings found, return default
          return DEFAULT_SCRAPER_SETTINGS as ScraperSettings;
        }
        
        return data as ScraperSettings;
      } catch (error) {
        console.error('Error fetching scraper settings:', error);
        return DEFAULT_SCRAPER_SETTINGS as ScraperSettings;
      }
    }
  });

  // Set state when scraper settings are loaded
  useEffect(() => {
    if (scraperSettings) {
      setNewSettings(scraperSettings);
      setIsScraperRunning(scraperSettings.is_running || false);
    }
  }, [scraperSettings]);

  // Mutation to bulk delete/restore events
  const bulkUpdateEventsMutation = useMutation({
    mutationFn: async ({ ids, deleted }: { ids: string[], deleted: boolean }) => {
      const { data, error } = await supabase
        .from('historical_events')
        .update({ deleted })
        .in('id', ids)
        .select('id');
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historical-events'] });
      setSelectedEvents([]);
      toast({
        title: "Success",
        description: `Events ${selectedEvents.length > 0 ? 'updated' : 'updated'} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update events: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutation to update scraper settings using stored procedure
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<ScraperSettings>) => {
      const { data, error } = await supabase.rpc('update_scraper_settings', {
        settings_json: settings
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraper-settings'] });
      setIsEditingSettings(false);
      toast({
        title: "Settings Updated",
        description: "Scraper settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedEvents.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to delete.",
        variant: "destructive"
      });
      return;
    }

    bulkUpdateEventsMutation.mutate({ 
      ids: selectedEvents, 
      deleted: true 
    });
  };

  // Handle bulk restore
  const handleBulkRestore = () => {
    if (selectedEvents.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to restore.",
        variant: "destructive"
      });
      return;
    }

    bulkUpdateEventsMutation.mutate({ 
      ids: selectedEvents, 
      deleted: false 
    });
  };

  // Toggle select all events
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(events.map(event => event.id));
    } else {
      setSelectedEvents([]);
    }
  };

  // Toggle selection of a single event
  const toggleEventSelection = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEvents(prev => [...prev, id]);
    } else {
      setSelectedEvents(prev => prev.filter(eventId => eventId !== id));
    }
  };

  // Start web scraper
  const startScraper = async () => {
    try {
      setIsStartingScraper(true);
      setScraperProgress(10);
      setScraperResults(null);
      
      // Update scraper status to running
      await updateSettingsMutation.mutateAsync({
        is_running: true,
        last_run_at: new Date().toISOString()
      });
      
      setScraperProgress(30);
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('scrape-historical-events', {
        body: { 
          sourcesToScrape: newSettings?.enabled_sources || DEFAULT_SCRAPER_SETTINGS.enabled_sources 
        }
      });
      
      if (error) throw error;
      
      setScraperProgress(90);
      setScraperResults(data);
      
      // Update scraper status to not running
      await updateSettingsMutation.mutateAsync({
        is_running: false
      });
      
      // Refresh data
      refetchEvents();
      refetchLogs();
      refetchSettings();
      
      setScraperProgress(100);
      
      toast({
        title: "Scraper Completed",
        description: `Added ${data.newEvents} new events from ${data.sourcesProcessed} sources.`,
      });
      
    } catch (error: any) {
      console.error('Error running scraper:', error);
      toast({
        title: "Error",
        description: `Failed to run scraper: ${error.message}`,
        variant: "destructive"
      });
      
      // Update scraper status to not running on error
      await updateSettingsMutation.mutateAsync({
        is_running: false
      });
      
    } finally {
      setIsStartingScraper(false);
      setTimeout(() => setScraperProgress(0), 2000);
    }
  };

  // Stop web scraper
  const stopScraper = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        is_running: false
      });
      
      toast({
        title: "Scraper Stopped",
        description: "The scraper has been stopped.",
      });
      
    } catch (error: any) {
      console.error('Error stopping scraper:', error);
      toast({
        title: "Error",
        description: `Failed to stop scraper: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Save scraper settings
  const saveSettings = () => {
    updateSettingsMutation.mutate(newSettings);
  };

  // Render event details popover
  const renderEventDetails = (event: HistoricalEventDB) => (
    <PopoverContent className="w-96">
      <div className="space-y-2">
        <h4 className="font-medium">{event.location_name || 'Historical Event'}</h4>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        
        {event.image_url && (
          <div className="mt-2 rounded overflow-hidden">
            <img 
              src={event.image_url} 
              alt={event.location_name || 'Historical Event'}
              className="w-full h-auto object-cover max-h-48" 
            />
          </div>
        )}
        
        <div className="flex flex-col gap-2 text-sm mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Year: {event.year || 'Unknown'}
            </span>
          </div>
          
          {(event.latitude && event.longitude) && (
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-muted-foreground" />
              <span>
                Lat: {event.latitude.toFixed(4)}, Lng: {event.longitude.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </div>
    </PopoverContent>
  );

  return (
    <div className="container mx-auto p-4 min-h-screen bg-[#f7f7f7] dark:bg-gray-950">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Historical Events Admin</h1>
            <p className="text-muted-foreground">Manage historical events and web scraper settings</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to App
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin')}>
              Admin Dashboard
            </Button>
          </div>
        </div>
        
        {/* Scraper Controls */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Web Scraper Controls</CardTitle>
            <CardDescription>
              Run the web scraper to collect new historical events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {scraperProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Scraping progress</span>
                    <span>{scraperProgress}%</span>
                  </div>
                  <Progress value={scraperProgress} className="h-2" />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isScraperRunning ? (
                    <Button 
                      variant="destructive" 
                      onClick={stopScraper}
                      disabled={isStartingScraper}
                      className="gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      Stop Scraper
                    </Button>
                  ) : (
                    <Button 
                      onClick={startScraper}
                      disabled={isStartingScraper}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Scraper
                    </Button>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Scraper Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Scraper Settings</DialogTitle>
                        <DialogDescription>
                          Configure the behavior of the web scraper
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="auto-run-interval">Auto-run Interval (hours)</Label>
                          <Select 
                            value={String(newSettings.auto_run_interval)}
                            onValueChange={(value) => setNewSettings({
                              ...newSettings,
                              auto_run_interval: parseInt(value)
                            })}
                          >
                            <SelectTrigger id="auto-run-interval">
                              <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 hour</SelectItem>
                              <SelectItem value="2">2 hours</SelectItem>
                              <SelectItem value="6">6 hours</SelectItem>
                              <SelectItem value="12">12 hours</SelectItem>
                              <SelectItem value="24">24 hours</SelectItem>
                              <SelectItem value="48">48 hours</SelectItem>
                              <SelectItem value="72">72 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label>Enabled Sources</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="source-usatoday"
                                checked={newSettings.enabled_sources?.includes("USA Today Historical Events")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewSettings({
                                      ...newSettings,
                                      enabled_sources: [...(newSettings.enabled_sources || []), "USA Today Historical Events"]
                                    });
                                  } else {
                                    setNewSettings({
                                      ...newSettings,
                                      enabled_sources: (newSettings.enabled_sources || [])
                                        .filter(source => source !== "USA Today Historical Events")
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor="source-usatoday"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                USA Today Historical Events
                              </label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="source-rare"
                                checked={newSettings.enabled_sources?.includes("Rare Historical Photos")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewSettings({
                                      ...newSettings,
                                      enabled_sources: [...(newSettings.enabled_sources || []), "Rare Historical Photos"]
                                    });
                                  } else {
                                    setNewSettings({
                                      ...newSettings,
                                      enabled_sources: (newSettings.enabled_sources || [])
                                        .filter(source => source !== "Rare Historical Photos")
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor="source-rare"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Rare Historical Photos
                              </label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="source-demilked"
                                checked={newSettings.enabled_sources?.includes("Demilked Historical Pics")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewSettings({
                                      ...newSettings,
                                      enabled_sources: [...(newSettings.enabled_sources || []), "Demilked Historical Pics"]
                                    });
                                  } else {
                                    setNewSettings({
                                      ...newSettings,
                                      enabled_sources: (newSettings.enabled_sources || [])
                                        .filter(source => source !== "Demilked Historical Pics")
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor="source-demilked"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Demilked Historical Pics
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewSettings(scraperSettings || DEFAULT_SCRAPER_SETTINGS)}>
                          Reset
                        </Button>
                        <Button onClick={saveSettings}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {scraperSettings?.last_run_at 
                      ? `Last run: ${format(new Date(scraperSettings.last_run_at), 'MMM d, yyyy HH:mm')}` 
                      : 'Never run'}
                  </span>
                </div>
              </div>
              
              {scraperResults && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">Latest Scraper Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <div className="text-xl font-bold">{scraperResults.sourcesProcessed}</div>
                      <div className="text-xs text-muted-foreground">Sources Processed</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <div className="text-xl font-bold">{scraperResults.totalEvents}</div>
                      <div className="text-xs text-muted-foreground">Total Events Found</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <div className="text-xl font-bold text-green-600">{scraperResults.newEvents}</div>
                      <div className="text-xs text-muted-foreground">New Events Added</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                      <div className="text-xl font-bold text-amber-600">{scraperResults.existingEvents}</div>
                      <div className="text-xs text-muted-foreground">Duplicate Events Skipped</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Main Tabs */}
        <Tabs 
          defaultValue="events" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Historical Events
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scraper Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manage Historical Events</CardTitle>
                    <CardDescription>
                      View, bulk delete, and restore historical events
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-deleted" 
                        checked={showDeleted}
                        onCheckedChange={(checked) => setShowDeleted(!!checked)}
                      />
                      <label
                        htmlFor="show-deleted"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show Deleted
                      </label>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleBulkDelete}
                      disabled={selectedEvents.length === 0}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleBulkRestore}
                      disabled={selectedEvents.length === 0}
                      className="gap-1"
                    >
                      <ArrowUpCircle className="h-4 w-4" />
                      Restore Selected
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events by title, description, or source..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={events.length > 0 && selectedEvents.length === events.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all events"
                          />
                        </TableHead>
                        <TableHead className="w-12">Image</TableHead>
                        <TableHead className="w-[300px]">Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingEvents ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            Loading events...
                          </TableCell>
                        </TableRow>
                      ) : events.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            No events found. Run the scraper to collect historical events.
                          </TableCell>
                        </TableRow>
                      ) : (
                        events.map((event) => (
                          <TableRow 
                            key={event.id}
                            className={event.deleted ? "opacity-60 bg-gray-50 dark:bg-gray-800/50" : ""}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={selectedEvents.includes(event.id)}
                                onCheckedChange={(checked) => toggleEventSelection(event.id, !!checked)}
                                aria-label={`Select event ${event.location_name}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                                {event.image_url ? (
                                  <img 
                                    src={event.image_url} 
                                    alt={event.location_name}
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <Image className="w-full h-full p-2 text-gray-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="link" className="p-0 h-auto text-left justify-start font-normal">
                                    <span className="line-clamp-2">{event.location_name}</span>
                                  </Button>
                                </PopoverTrigger>
                                {renderEventDetails(event)}
                              </Popover>
                            </TableCell>
                            <TableCell>
                              {event.year 
                                ? event.year
                                : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <span className="line-clamp-1">
                                {event.location_name}
                              </span>
                            </TableCell>
                            <TableCell>
                              {event.deleted ? (
                                <Badge variant="destructive">Deleted</Badge>
                              ) : (
                                <Badge variant="default">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {event.latitude && event.longitude ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {event.latitude.toFixed(2)}, {event.longitude.toFixed(2)}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">No Location</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    if (event.deleted) {
                                      bulkUpdateEventsMutation.mutate({ 
                                        ids: [event.id], 
                                        deleted: false 
                                      });
                                    } else {
                                      bulkUpdateEventsMutation.mutate({ 
                                        ids: [event.id], 
                                        deleted: true 
                                      });
                                    }
                                  }}
                                >
                                  {event.deleted ? (
                                    <ArrowUpCircle className="h-4 w-4" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    window.open(event.image_url, '_blank');
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Scraper Logs</CardTitle>
                <CardDescription>
                  View history of web scraper runs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Sources</TableHead>
                        <TableHead>Events Found</TableHead>
                        <TableHead>New Events</TableHead>
                        <TableHead>Failures</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingLogs ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading logs...
                          </TableCell>
                        </TableRow>
                      ) : scraperLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No scraper logs found. Run the scraper to generate logs.
                          </TableCell>
                        </TableRow>
                      ) : (
                        scraperLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                            </TableCell>
                            <TableCell>
                              {log.sources_processed}
                            </TableCell>
                            <TableCell>
                              {log.total_events_found}
                            </TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">
                                {log.new_events_added}
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.failures > 0 ? (
                                <Badge variant="destructive">{log.failures}</Badge>
                              ) : (
                                <Badge variant="outline">0</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>Scraper Log Details</DialogTitle>
                                    <DialogDescription>
                                      Run at {format(new Date(log.created_at), 'MMMM d, yyyy HH:mm:ss')}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="max-h-[60vh] overflow-y-auto space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="bg-muted p-4 rounded">
                                        <div className="text-sm text-muted-foreground">
                                          Sources Processed
                                        </div>
                                        <div className="text-2xl font-bold">
                                          {log.sources_processed}
                                        </div>
                                      </div>
                                      <div className="bg-muted p-4 rounded">
                                        <div className="text-sm text-muted-foreground">
                                          Events Found
                                        </div>
                                        <div className="text-2xl font-bold">
                                          {log.total_events_found}
                                        </div>
                                      </div>
                                      <div className="bg-muted p-4 rounded">
                                        <div className="text-sm text-muted-foreground">
                                          New Events Added
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">
                                          {log.new_events_added}
                                        </div>
                                      </div>
                                      <div className="bg-muted p-4 rounded">
                                        <div className="text-sm text-muted-foreground">
                                          Failures
                                        </div>
                                        <div className="text-2xl font-bold text-red-500">
                                          {log.failures}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Source Details</h4>
                                      <div className="space-y-3">
                                        {log.details.map((detail, index) => (
                                          <div key={index} className="border rounded-md p-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="font-medium">{detail.sourceName}</div>
                                              <Badge 
                                                variant={detail.status === 'success' ? 'default' : 'destructive'}
                                              >
                                                {detail.status}
                                              </Badge>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                              <div>
                                                <div className="text-muted-foreground">Events Found</div>
                                                <div>{detail.eventsFound}</div>
                                              </div>
                                              <div>
                                                <div className="text-muted-foreground">New Events</div>
                                                <div className="text-green-600">{detail.newEvents}</div>
                                              </div>
                                              <div>
                                                <div className="text-muted-foreground">Duplicates</div>
                                                <div>{detail.existingEvents}</div>
                                              </div>
                                            </div>
                                            {detail.error && (
                                              <div className="mt-2 text-xs text-red-500">
                                                Error: {detail.error}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>
                  Configure the historical events admin panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="text-lg font-medium">Scraper Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure how the historical events scraper operates.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Auto-run Interval</Label>
                        <div className="text-sm">
                          The scraper will automatically run every {scraperSettings?.auto_run_interval || 24} hours.
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Current Status</Label>
                        <div className="flex items-center gap-2">
                          {isScraperRunning ? (
                            <Badge variant="default" className="gap-1 flex items-center">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Running
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 flex items-center">
                              <Pause className="h-3 w-3" />
                              Idle
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Enabled Sources</Label>
                      <div className="text-sm space-y-2">
                        {scraperSettings?.enabled_sources?.map((source, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setActiveTab('logs');
                        }}
                        className="gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        View Scraper Logs
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="text-lg font-medium">Data Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage database and historical events data.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <Label>Historical Events</Label>
                          <div className="text-sm text-muted-foreground">
                            Total events in database: {events.length}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => { setActiveTab('events'); }}
                        >
                          <Database className="h-4 w-4" />
                          Manage Events
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Database Export</Label>
                      <div className="text-sm text-muted-foreground">
                        Export historical events data for backup or analysis.
                      </div>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => {
                          toast({
                            title: "Feature not implemented",
                            description: "Data export feature is not yet implemented.",
                            variant: "destructive"
                          });
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Export Data
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
  );
};

export default WebScraperAdmin;

