
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, CheckCircle, Download, ImageOff, Image } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { validateEventImage } from '@/integrations/supabase/events';
import { hasHistoricalEvents } from '@/integrations/supabase/events';

const ImportHistoricalEventsButton = ({ autoImport = false }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDailyUpdateLoading, setIsDailyUpdateLoading] = useState(false);
  const [isValidatingImages, setIsValidatingImages] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<any[] | null>(null);
  
  // Check if we need to auto-import on mount
  useEffect(() => {
    const checkAndImport = async () => {
      if (autoImport) {
        const hasEvents = await hasHistoricalEvents();
        if (!hasEvents) {
          handleImport();
        }
      }
    };
    
    checkAndImport();
  }, [autoImport]);
  
  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResults(null);
      setProgress(25);
      
      // Invoke the edge function
      const { data, error } = await supabase.functions.invoke('import-historical-events');
      
      setProgress(100);
      
      if (error) {
        setError(error.message);
        toast({
          title: "Import failed",
          description: "Failed to import historical events",
          variant: "destructive"
        });
        return;
      }
      
      setResults(data.results);
      
      toast({
        title: "Import successful",
        description: `Imported ${data.results.filter((r: any) => r.status === 'success').length} historical events`
      });
      
      // Automatically run daily update after import
      handleDailyUpdate();
      
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
      toast({
        title: "Import failed",
        description: "An error occurred while importing events",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDailyUpdate = async () => {
    try {
      setIsDailyUpdateLoading(true);
      
      // Invoke the daily update function
      const { data, error } = await supabase.functions.invoke('daily-events-update', {
        body: { forceRefresh: true }
      });
      
      if (error) {
        toast({
          title: "Update failed",
          description: "Failed to run daily events update",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Update successful",
        description: data.message || "Daily events update completed successfully"
      });
      
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: "An error occurred while running daily update",
        variant: "destructive"
      });
    } finally {
      setIsDailyUpdateLoading(false);
    }
  };
  
  const handleValidateImages = async () => {
    try {
      setIsValidatingImages(true);
      setValidationResults(null);
      setValidationProgress(0);
      
      // Get all events
      const { data: events, error } = await supabase
        .from('historical_events')
        .select('id, year, description, image_url');
        
      if (error) {
        toast({
          title: "Validation failed",
          description: "Failed to fetch events for validation",
          variant: "destructive"
        });
        return;
      }
      
      if (!events || events.length === 0) {
        toast({
          title: "No events found",
          description: "There are no events to validate",
          variant: "destructive"
        });
        return;
      }
      
      const results: any[] = [];
      
      // Validate images one by one with progress tracking
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        setValidationProgress(Math.round((i / events.length) * 100));
        
        // Skip events that already have valid images
        if (event.image_url) {
          const validationResult = await validateEventImage(event.id);
          
          results.push({
            id: event.id,
            year: event.year,
            description: event.description.substring(0, 30) + "...",
            originalUrl: event.image_url,
            newUrl: validationResult.newImageUrl || event.image_url,
            success: validationResult.success,
            message: validationResult.message
          });
        } else {
          // For events without images, try to find one
          const validationResult = await validateEventImage(event.id);
          
          results.push({
            id: event.id,
            year: event.year,
            description: event.description.substring(0, 30) + "...",
            originalUrl: null,
            newUrl: validationResult.newImageUrl,
            success: validationResult.success,
            message: validationResult.message
          });
        }
      }
      
      setValidationProgress(100);
      setValidationResults(results);
      
      const successCount = results.filter(r => r.success).length;
      
      toast({
        title: "Image validation complete",
        description: `Successfully validated/fixed ${successCount} out of ${events.length} images`
      });
      
    } catch (err: any) {
      toast({
        title: "Validation failed",
        description: "An error occurred during image validation",
        variant: "destructive"
      });
    } finally {
      setIsValidatingImages(false);
    }
  };
  
  const handleExportCSV = () => {
    if (!results) return;
    
    // Create CSV content
    const headers = ["Year", "Description", "Status", "Error"];
    const csvRows = [headers.join(',')];
    
    results.forEach(result => {
      const row = [
        result.year,
        `"${result.description.replace(/"/g, '""')}"`,
        result.status,
        result.error ? `"${result.error.replace(/"/g, '""')}"` : ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historical_events_import_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          Click the button below to import sample historical events from Wikimedia Commons into your database.
          After importing, you can validate images to ensure all events have valid, relevant images.
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
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Running daily update check...</span>
            </div>
          </div>
        )}
        
        {isValidatingImages && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating images...</span>
            </div>
            <Progress value={validationProgress} className="h-2 w-full" />
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
            
            {results.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Results to CSV
              </Button>
            )}
          </div>
        )}
        
        {validationResults && (
          <div className="mt-6 space-y-4">
            <h3 className="font-medium text-lg">Image Validation Results</h3>
            
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <table className="min-w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-xs font-medium text-left p-2">Year</th>
                    <th className="text-xs font-medium text-left p-2">Description</th>
                    <th className="text-xs font-medium text-right p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {validationResults.map((result, index) => (
                    <tr key={index} className={!result.success ? 'bg-destructive/10' : ''}>
                      <td className="text-sm p-2">{result.year}</td>
                      <td className="text-sm p-2">{result.description}</td>
                      <td className="text-sm p-2 text-right">
                        {result.success ? (
                          <div className="flex items-center justify-end">
                            <Image className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                            <span>{result.newUrl !== result.originalUrl ? 'Fixed' : 'Valid'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end">
                            <ImageOff className="h-4 w-4 text-destructive mr-1" />
                            <span>{result.message}</span>
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
      <CardFooter className="flex-col gap-3">
        <Button 
          onClick={handleImport} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Historical Events'
          )}
        </Button>
        
        <Button 
          onClick={handleValidateImages} 
          disabled={isValidatingImages}
          variant="outline"
          className="w-full"
        >
          {isValidatingImages ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            'Validate & Fix Images'
          )}
        </Button>
        
        <Button 
          onClick={handleDailyUpdate} 
          disabled={isDailyUpdateLoading}
          variant="outline"
          className="w-full"
        >
          {isDailyUpdateLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            'Run Daily Update Check'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImportHistoricalEventsButton;
