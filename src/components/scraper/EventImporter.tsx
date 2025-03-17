
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Import, Database, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { importHistoricalEvents } from '@/integrations/supabase/events';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useScraperAdmin } from '@/hooks/use-scraper-admin';

interface EventImporterProps {
  onImportComplete: () => void;
}

const EventImporter: React.FC<EventImporterProps> = ({ onImportComplete }) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const { importEventsMutation } = useScraperAdmin();

  const handleStartImport = async () => {
    try {
      setIsImporting(true);
      setImportProgress(10);
      
      // Set progress points to simulate progress
      const progressIntervals = [
        { progress: 30, delay: 1000 },
        { progress: 50, delay: 2000 },
        { progress: 70, delay: 3000 }
      ];
      
      // Schedule progress updates
      progressIntervals.forEach(({ progress, delay }) => {
        setTimeout(() => setImportProgress(progress), delay);
      });
      
      // Start the import
      await importEventsMutation.mutateAsync();
      
      // Complete the progress
      setImportProgress(100);
      
      // Notify completion
      onImportComplete();
      
      // Reset after 2 seconds
      setTimeout(() => {
        setImportProgress(0);
        setIsImporting(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error importing events:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import historical events",
        variant: "destructive"
      });
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Historical Events Database
        </CardTitle>
      </CardHeader>
      <CardContent>
        {importProgress > 0 && (
          <Progress value={importProgress} className="mb-4" />
        )}
        
        {importEventsMutation.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Import Error</AlertTitle>
            <AlertDescription>
              {importEventsMutation.error instanceof Error 
                ? importEventsMutation.error.message 
                : "An unknown error occurred during import."}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Import a collection of historical events with images to populate your database.
            This will add interesting events from various periods in history.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleStartImport} 
          disabled={isImporting || importEventsMutation.isPending}
          className="gap-2"
        >
          <Import className="h-4 w-4" />
          {isImporting || importEventsMutation.isPending 
            ? "Importing..." 
            : "Import Historical Events"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventImporter;
