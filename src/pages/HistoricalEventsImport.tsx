
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import ImportHistoricalEventsButton from '@/components/ImportHistoricalEventsButton';
import { Home, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllHistoricalEvents } from '@/integrations/supabase/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

const HistoricalEventsImport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadEvents();
  }, []);
  
  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventData = await fetchAllHistoricalEvents();
      setEvents(eventData);
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
        {events.length > 0 && (
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        )}
      </div>
      
      <div className="max-w-xl mx-auto mb-8">
        <ImportHistoricalEventsButton />
      </div>
      
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
