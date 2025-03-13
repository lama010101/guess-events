
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import ImportHistoricalEventsButton from '@/components/ImportHistoricalEventsButton';
import { Home, Download, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllHistoricalEvents, verifyHistoricalEventImages } from '@/integrations/supabase/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

const HistoricalEventsImport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    valid: boolean;
    eventsCount: number;
    eventsWithoutImages: number;
  } | null>(null);
  
  useEffect(() => {
    loadEvents();
  }, []);
  
  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventData = await fetchAllHistoricalEvents();
      setEvents(eventData);
      
      // Check verification status
      const status = await verifyHistoricalEventImages();
      setVerificationStatus(status);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error loading events",
        description: "Could not load historical events from the database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const refreshEvents = async () => {
    setRefreshing(true);
    try {
      await loadEvents();
      sonnerToast.success('Events refreshed successfully');
    } catch (error) {
      console.error("Error refreshing events:", error);
      sonnerToast.error('Failed to refresh events');
    } finally {
      setRefreshing(false);
    }
  };
  
  const exportToCSV = () => {
    try {
      // Convert events to CSV format
      const headers = ['id', 'year', 'description', 'location_name', 'latitude', 'longitude', 'image_url', 'image_attribution'];
      
      const csvData = events.map(event => [
        event.id,
        event.year,
        event.description,
        event.location.name,
        event.location.lat,
        event.location.lng,
        event.imageUrl,
        'Wikimedia Commons'
      ]);
      
      // Add headers
      csvData.unshift(headers);
      
      // Convert to CSV string
      const csvContent = csvData.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(',')).join('\n');
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'historical_events.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      sonnerToast.success('CSV file downloaded successfully');
    } catch (error) {
      console.error("Error exporting CSV:", error);
      sonnerToast.error('Failed to export CSV file');
    }
  };
  
  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-2xl font-bold">Historical Events Import</h1>
        <div className="flex gap-2">
          {events.length > 0 && (
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={refreshEvents} 
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="max-w-xl mx-auto mb-8">
        <ImportHistoricalEventsButton />
      </div>
      
      {verificationStatus && !verificationStatus.valid && (
        <Card className="mt-8 mb-4 border-yellow-500 dark:border-yellow-600">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
            <CardTitle className="text-yellow-700 dark:text-yellow-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Image Verification Warning
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p>
              {verificationStatus.eventsWithoutImages} out of {verificationStatus.eventsCount} events are missing images. 
              Use the "Run Daily Update Check" button above to fix this issue.
            </p>
          </CardContent>
        </Card>
      )}
      
      {events.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Imported Events ({events.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto rounded-md border">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-xs font-medium text-left p-2">Year</th>
                    <th className="text-xs font-medium text-left p-2">Event</th>
                    <th className="text-xs font-medium text-left p-2">Location</th>
                    <th className="text-xs font-medium text-left p-2">Image</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map(event => (
                    <tr key={event.id}>
                      <td className="text-sm p-2">{event.year}</td>
                      <td className="text-sm p-2">{event.description.substring(0, 100)}...</td>
                      <td className="text-sm p-2">{event.location.name}</td>
                      <td className="text-sm p-2">
                        {event.imageUrl ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-md">
                            <img 
                              src={event.imageUrl} 
                              alt={`Event from ${event.year}`} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-destructive">No image</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HistoricalEventsImport;
