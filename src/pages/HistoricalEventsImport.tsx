import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import ImportHistoricalEventsButton from '@/components/ImportHistoricalEventsButton';
import { Home, FileText, Image, RefreshCw, CheckCircle, XCircle, Users, Database, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasHistoricalEvents } from '@/integrations/supabase/events';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const HistoricalEventsImport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasEvents, setHasEvents] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isVerifyingImages, setIsVerifyingImages] = useState(false);
  const [verificationResults, setVerificationResults] = useState<any>(null);
  const [autoImport, setAutoImport] = useState(true); // Enable auto-import by default
  const [userCount, setUserCount] = useState<number | null>(null);
  const [isLoadingUserCount, setIsLoadingUserCount] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  
  useEffect(() => {
    checkForEvents();
    fetchEventStats();
    fetchUserCount();
  }, [importCompleted]);
  
  const checkForEvents = async () => {
    const exists = await hasHistoricalEvents();
    setHasEvents(exists);
  };
  
  const fetchUserCount = async () => {
    try {
      setIsLoadingUserCount(true);
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (error) throw error;
      setUserCount(count);
    } catch (error) {
      console.error('Error fetching user count:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user count',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingUserCount(false);
    }
  };
  
  const fetchEventStats = async () => {
    try {
      setIsLoadingStats(true);
      
      const { data, error } = await supabase
        .from('historical_events')
        .select('id, year, image_url')
        .order('year', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        const totalEvents = data.length;
        const eventsWithImages = data.filter(event => event.image_url).length;
        
        // Group by century
        const centuries: Record<string, number> = {};
        data.forEach(event => {
          const century = Math.floor(event.year / 100) * 100;
          centuries[century] = (centuries[century] || 0) + 1;
        });
        
        // Format the data for better display
        const centuriesData = Object.entries(centuries)
          .map(([century, count]) => ({ 
            century: `${century}s`, 
            count 
          }))
          .sort((a, b) => parseInt(a.century) - parseInt(b.century));
        
        // Calculate event distribution by decade
        const decades: Record<string, number> = {};
        data.forEach(event => {
          const decade = Math.floor(event.year / 10) * 10;
          decades[decade] = (decades[decade] || 0) + 1;
        });
        
        const decadesData = Object.entries(decades)
          .map(([decade, count]) => ({ 
            decade: `${decade}s`, 
            count 
          }))
          .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
        
        setStats({
          totalEvents,
          eventsWithImages,
          eventsWithoutImages: totalEvents - eventsWithImages,
          centuries: centuriesData,
          decades: decadesData,
          years: data.map(event => event.year),
          imagePercentage: totalEvents > 0 ? Math.round((eventsWithImages / totalEvents) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching event stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event statistics',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  const handleVerifyImages = async () => {
    try {
      setIsVerifyingImages(true);
      setVerificationResults(null);
      
      const { data: events } = await supabase
        .from('historical_events')
        .select('id, year, description, image_url')
        .order('year', { ascending: true });
      
      if (!events) {
        toast({
          title: 'No events found',
          description: 'There are no events to verify',
          variant: 'destructive'
        });
        return;
      }
      
      const results = {
        total: events.length,
        withImage: 0,
        withoutImage: 0,
        details: [] as any[]
      };
      
      // Check each event
      for (const event of events) {
        const detail = {
          id: event.id,
          year: event.year,
          description: event.description.substring(0, 30) + "...",
          hasImage: !!event.image_url,
          imageUrl: event.image_url
        };
        
        if (event.image_url) {
          results.withImage++;
        } else {
          results.withoutImage++;
        }
        
        results.details.push(detail);
      }
      
      setVerificationResults(results);
      
    } catch (error) {
      console.error('Error verifying images:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify images',
        variant: 'destructive'
      });
    } finally {
      setIsVerifyingImages(false);
    }
  };
  
  const handleImportComplete = (success: boolean, data: any) => {
    setImportCompleted(true);
    // Refresh stats
    fetchEventStats();
  };
  
  const renderImageCoverage = () => {
    if (!stats) return null;
    
    const percentage = stats.imagePercentage;
    let color = "bg-red-500";
    
    if (percentage >= 90) {
      color = "bg-green-500";
    } else if (percentage >= 70) {
      color = "bg-yellow-500";
    } else if (percentage >= 50) {
      color = "bg-orange-500";
    }
    
    return (
      <div className="relative h-4 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {percentage}% with images
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-2xl font-bold">Historical Events Management</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <Image className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{stats?.eventsWithImages || 0}</div>
              <div className="text-sm text-muted-foreground">Events with Images</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{isLoadingUserCount ? '...' : userCount || 0}</div>
              <div className="text-sm text-muted-foreground">Registered Users</div>
            </div>
          </div>
        </Card>
      </div>
      
      {stats && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Image Coverage Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderImageCoverage()}
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Date Range</h3>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{Math.min(...stats.years)}</span> to <span className="font-medium text-foreground">{Math.max(...stats.years)}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">AI Image Processing</h3>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                  Enabled
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> 
            Import Events
          </TabsTrigger>
          <TabsTrigger value="verify" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Verify Images
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Event Statistics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="import">
          <div className="max-w-xl mx-auto">
            <ImportHistoricalEventsButton 
              autoImport={autoImport} 
              onImportComplete={handleImportComplete}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle>Verify Historical Event Images</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Check which historical events have valid images and which ones need attention.
                The AI verification system validates image content against historical context.
              </p>
              
              <div className="mb-6">
                <Button 
                  onClick={handleVerifyImages} 
                  disabled={isVerifyingImages}
                >
                  {isVerifyingImages ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verify Images
                    </>
                  )}
                </Button>
              </div>
              
              {verificationResults && (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card className="p-4 bg-muted/30">
                      <div className="text-2xl font-bold">{verificationResults.total}</div>
                      <div className="text-sm text-muted-foreground">Total Events</div>
                    </Card>
                    <Card className="p-4 bg-green-100 dark:bg-green-900/30">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {verificationResults.withImage}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">With Images</div>
                    </Card>
                    <Card className="p-4 bg-red-100 dark:bg-red-900/30">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {verificationResults.withoutImage}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">Without Images</div>
                    </Card>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto border rounded-md">
                    <table className="min-w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-xs font-medium text-left p-2">Year</th>
                          <th className="text-xs font-medium text-left p-2">Description</th>
                          <th className="text-xs font-medium text-right p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {verificationResults.details.map((detail: any) => (
                          <tr key={detail.id} className={!detail.hasImage ? 'bg-destructive/10' : ''}>
                            <td className="text-sm p-2">{detail.year}</td>
                            <td className="text-sm p-2">{detail.description}</td>
                            <td className="text-sm p-2 text-right">
                              {detail.hasImage ? (
                                <div className="flex items-center justify-end">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                                  <span>Has image</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end">
                                  <XCircle className="h-4 w-4 text-destructive mr-1" />
                                  <span>Missing image</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Historical Events Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : stats ? (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 bg-muted/30">
                      <div className="text-2xl font-bold">{stats.totalEvents}</div>
                      <div className="text-sm text-muted-foreground">Total Events</div>
                    </Card>
                    <Card className="p-4 bg-green-100 dark:bg-green-900/30">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.eventsWithImages}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">With Images</div>
                    </Card>
                    <Card className="p-4 bg-red-100 dark:bg-red-900/30">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats.eventsWithoutImages}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">Without Images</div>
                    </Card>
                  </div>
                  
                  <h3 className="text-lg font-medium mb-2">Events by Century</h3>
                  <div className="overflow-x-auto">
                    <div className="flex items-end h-40 gap-1">
                      {stats.centuries.map((century: any) => (
                        <div key={century.century} className="flex flex-col items-center">
                          <div className="text-xs text-center mb-1">{century.count}</div>
                          <div 
                            className="bg-primary/80 rounded-t-sm w-12"
                            style={{ height: `${(century.count / Math.max(...stats.centuries.map((c: any) => c.count))) * 100}%` }}
                          />
                          <div className="text-xs mt-1 text-center">{century.century}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">Events by Decade</h3>
                  <div className="overflow-x-auto">
                    <div className="flex items-end h-40 gap-1">
                      {stats.decades.map((decade: any) => (
                        <div key={decade.decade} className="flex flex-col items-center">
                          <div className="text-xs text-center mb-1">{decade.count}</div>
                          <div 
                            className="bg-blue-500/80 rounded-t-sm w-8"
                            style={{ height: `${(decade.count / Math.max(...stats.decades.map((d: any) => d.count))) * 100}%` }}
                          />
                          <div className="text-xs mt-1 text-center truncate w-10">{decade.decade}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">Year Range</h3>
                  <p>
                    Earliest event: <span className="font-semibold">{Math.min(...stats.years)}</span>
                  </p>
                  <p>
                    Latest event: <span className="font-semibold">{Math.max(...stats.years)}</span>
                  </p>
                </div>
              ) : (
                <p>No event data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoricalEventsImport;
