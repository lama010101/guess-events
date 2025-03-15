
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ScraperResultsData {
  sourcesProcessed?: number;
  totalEvents?: number;
  newEvents?: number;
  existingEvents?: number;
  failures?: number;
}

interface ScraperResultsProps {
  results: ScraperResultsData | null;
}

const ScraperResults: React.FC<ScraperResultsProps> = ({ results }) => {
  const [importedEvents, setImportedEvents] = useState<any[]>([]);
  
  useEffect(() => {
    fetchImportedEvents();
  }, []);
  
  const fetchImportedEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('historical_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      if (data) {
        setImportedEvents(data);
        console.log('Imported events:', data);
      }
    } catch (error) {
      console.error('Error fetching imported events:', error);
    }
  };
  
  if (!results) return null;
  
  return (
    <div className="mt-4 p-4 bg-muted rounded-md">
      <h3 className="font-medium mb-2">Latest Scraper Results</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
          <div className="text-xl font-bold">{results.sourcesProcessed || 0}</div>
          <div className="text-xs text-muted-foreground">Sources Processed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
          <div className="text-xl font-bold">{results.totalEvents || 0}</div>
          <div className="text-xs text-muted-foreground">Total Events Found</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
          <div className="text-xl font-bold text-green-600">{results.newEvents || 0}</div>
          <div className="text-xs text-muted-foreground">New Events Added</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
          <div className="text-xl font-bold text-amber-600">{results.existingEvents || 0}</div>
          <div className="text-xs text-muted-foreground">Duplicate Events Skipped</div>
        </div>
      </div>
      
      {importedEvents.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">Recently Imported Events (Last 10)</h4>
          <div className="overflow-auto max-h-[400px] border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left">Year</th>
                  <th className="p-2 text-left">Location</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-left">Image</th>
                </tr>
              </thead>
              <tbody>
                {importedEvents.map((event) => (
                  <tr key={event.id} className="border-t">
                    <td className="p-2">{event.year}</td>
                    <td className="p-2">{event.location_name}</td>
                    <td className="p-2">
                      <div className="line-clamp-2">{event.description}</div>
                    </td>
                    <td className="p-2">
                      {event.image_url ? (
                        <a 
                          href={event.image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Image
                        </a>
                      ) : 'No image'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperResults;
