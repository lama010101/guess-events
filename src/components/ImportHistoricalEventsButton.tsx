
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const ImportHistoricalEventsButton = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
};

export default ImportHistoricalEventsButton;
