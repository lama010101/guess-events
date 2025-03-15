
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ImportResult {
  year: number;
  description: string;
  status: string;
  id?: string;
  error?: string;
}

const EventImporter = ({ onImportComplete }: { onImportComplete: () => void }) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const importHistoricalEvents = async () => {
    try {
      setIsImporting(true);
      setImportProgress(10);
      setImportResults([]);

      const { data, error } = await supabase.functions.invoke('import-historical-events');

      if (error) throw error;

      setImportProgress(100);
      setImportResults(data.results || []);

      toast({
        title: "Import Completed",
        description: `Imported ${data.results.filter((r: ImportResult) => r.status === 'success').length} historical events.`,
      });

      // Notify parent component that import is complete
      onImportComplete();
    } catch (error: any) {
      console.error('Error importing events:', error);
      toast({
        title: "Import Failed",
        description: `Failed to import events: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Import Historical Events</CardTitle>
        <CardDescription>
          Import a curated set of historical events with images
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {importProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Import progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Button
              onClick={importHistoricalEvents}
              disabled={isImporting}
              className="gap-2"
              variant="outline"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import Historical Events
            </Button>

            {importResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Import Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {importResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded border flex justify-between ${
                        result.status === 'success' 
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
                          : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                      }`}
                    >
                      <div>
                        <span className="font-medium">{result.year}</span>: {result.description}
                      </div>
                      <div>
                        {result.status === 'success' ? '✅' : '❌'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventImporter;
