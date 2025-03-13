
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, CheckCircle, RefreshCw, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { hasHistoricalEvents, verifyHistoricalEventImages } from '@/integrations/supabase/events';

const ImportHistoricalEventsButton = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDailyUpdateLoading, setIsDailyUpdateLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasEvents, setHasEvents] = useState<boolean | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    valid: boolean;
    eventsCount: number;
    eventsWithoutImages: number;
  } | null>(null);
  
  useEffect(() => {
    checkExistingEvents();
  }, []);
  
  const checkExistingEvents = async () => {
    try {
      console.log("Checking for existing events...");
      const eventsExist = await hasHistoricalEvents();
      setHasEvents(eventsExist);
      console.log("Events exist:", eventsExist);
      
      if (eventsExist) {
        const status = await verifyHistoricalEventImages();
        setVerificationStatus(status);
        console.log("Verification status:", status);
      }
    } catch (err) {
      console.error("Error checking events:", err);
    }
  };
  
  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResults(null);
      setProgress(25);
      
      console.log("Invoking import-historical-events function...");
      
      // Invoke the edge function with force refresh
      const { data, error: functionError } = await supabase.functions.invoke('import-historical-events', {
        method: 'POST',
        body: { forceRefresh: true }
      });
      
      console.log("Function response:", data, "Error:", functionError);
      
      setProgress(100);
      
      if (functionError) {
        console.error("Function error:", functionError);
        setError(functionError.message || "Function error");
        toast({
          title: "Import failed",
          description: "Failed to import historical events: " + functionError.message,
          variant: "destructive"
        });
        return;
      }
      
      if (!data) {
        setError("No data returned from function");
        toast({
          title: "Import failed",
          description: "No data returned from import function",
          variant: "destructive"
        });
        return;
      }
      
      setResults(data.results);
      await checkExistingEvents();
      
      toast({
        title: "Import successful",
        description: `Imported ${data.results.filter((r: any) => r.status === 'success').length} historical events`
      });
      
    } catch (err: any) {
      console.error("Client-side error:", err);
      setError(err.message || "An unknown error occurred");
      toast({
        title: "Import failed",
        description: "An error occurred while importing events: " + err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const runDailyUpdate = async () => {
    try {
      setIsDailyUpdateLoading(true);
      setError(null);
      
      console.log("Invoking daily-events-update function...");
      
      const { data, error: functionError } = await supabase.functions.invoke('daily-events-update', {
        method: 'POST'
      });
      
      console.log("Daily update response:", data, "Error:", functionError);
      
      if (functionError) {
        console.error("Function error:", functionError);
        setError(functionError.message || "Function error");
        toast({
          title: "Daily update failed",
          description: "Failed to run daily events update: " + functionError.message,
          variant: "destructive"
        });
        return;
      }
      
      if (!data) {
        setError("No data returned from function");
        toast({
          title: "Daily update failed",
          description: "No data returned from daily update function",
          variant: "destructive"
        });
        return;
      }
      
      if (data.results) {
        setResults(data.results);
      }
      
      await checkExistingEvents();
      
      toast({
        title: "Daily update successful",
        description: data.message
      });
      
    } catch (err: any) {
      console.error("Client-side error:", err);
      setError(err.message || "An unknown error occurred");
      toast({
        title: "Daily update failed",
        description: "An error occurred while running daily update: " + err.message,
        variant: "destructive"
      });
    } finally {
      setIsDailyUpdateLoading(false);
    }
  };
  
  const successCount = results?.filter(r => r.status === 'success').length || 0;
  const failedCount = results?.filter(r => r.status === 'failed').length || 0;
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Import Historical Events</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {hasEvents 
            ? `Historical events are already imported (${verificationStatus?.eventsCount || 0} events). ${
                !verificationStatus?.valid 
                  ? `There are ${verificationStatus?.eventsWithoutImages || 0} events missing images that need to be fixed.` 
                  : 'All events have images.'
              }`
            : "Click the button below to import sample historical events from Wikimedia Commons into your database."}
        </p>
        
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Importing events...</span>
            </div>
            <Progress value={progress} className="h-2 w-full" />
          </div>
        )}
        
        {isDailyUpdateLoading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Running daily update...</span>
            </div>
            <Progress value={75} className="h-2 w-full" />
          </div>
        )}
        
        {error && (
          <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2 mt-4">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Import failed</p>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        )}
        
        {results && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">{successCount} events imported successfully</p>
                {failedCount > 0 && (
                  <p className="text-sm text-destructive">{failedCount} events failed to import</p>
                )}
              </div>
            </div>
            
            {results.length > 0 && (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <table className="min-w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-xs font-medium text-left p-2">Year</th>
                      <th className="text-xs font-medium text-left p-2">Description</th>
                      <th className="text-xs font-medium text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((result, index) => (
                      <tr key={index} className={result.status === 'failed' ? 'bg-destructive/10' : ''}>
                        <td className="text-sm p-2">{result.year}</td>
                        <td className="text-sm p-2">{result.description}</td>
                        <td className="text-sm p-2">
                          {result.status === 'success' ? (
                            <span className="text-green-600 dark:text-green-400">Success</span>
                          ) : (
                            <span className="text-destructive">{result.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={handleImport} 
          disabled={isLoading || isDailyUpdateLoading}
          className="w-full"
          variant={hasEvents ? "outline" : "default"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : hasEvents ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Historical Events
            </>
          ) : (
            'Import Historical Events'
          )}
        </Button>
        
        <Button 
          onClick={runDailyUpdate}
          disabled={isLoading || isDailyUpdateLoading}
          variant="secondary"
          className="w-full"
        >
          {isDailyUpdateLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Update...
            </>
          ) : (
            <>
              <CalendarClock className="mr-2 h-4 w-4" />
              Run Daily Update Check
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImportHistoricalEventsButton;
