
import React, { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Import, Database, AlertCircle, Upload, FileSpreadsheet, FileArchive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useScraperAdmin } from '@/hooks/use-scraper-admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from '@/integrations/supabase/client';

interface EventImporterProps {
  onImportComplete: () => void;
}

const EventImporter: React.FC<EventImporterProps> = ({ onImportComplete }) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTab, setImportTab] = useState<'api' | 'file'>('api');
  const { importEventsMutation } = useScraperAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file or ZIP archive first.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setImportProgress(10);

    try {
      // For Excel files
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        // Upload Excel file to temp storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from('event-images')
          .upload(`imports/excel/${Date.now()}_${selectedFile.name}`, selectedFile);

        if (fileError) throw fileError;

        // Call the import-historical-events function to process the Excel file
        setImportProgress(40);
        const { data, error } = await supabase.functions.invoke('import-historical-events', {
          body: { 
            fileType: 'excel',
            filePath: fileData.path
          }
        });

        if (error) throw error;
        
        setImportProgress(100);
        toast({
          title: "Import Successful",
          description: `Imported ${data.results.filter((r: any) => r.status === 'success').length} events.`
        });
      }
      // For ZIP files
      else if (selectedFile.name.endsWith('.zip')) {
        // Upload ZIP file to temp storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from('event-images')
          .upload(`imports/zip/${Date.now()}_${selectedFile.name}`, selectedFile);

        if (fileError) throw fileError;

        // Call the import-historical-events function to process the ZIP file
        setImportProgress(40);
        const { data, error } = await supabase.functions.invoke('import-historical-events', {
          body: { 
            fileType: 'zip',
            filePath: fileData.path
          }
        });

        if (error) throw error;
        
        setImportProgress(100);
        toast({
          title: "Import Successful",
          description: `Imported ${data.results.filter((r: any) => r.status === 'success').length} events with images.`
        });
      }
      else {
        throw new Error("Unsupported file format. Please upload an Excel file (.xlsx, .xls) or a ZIP archive (.zip).");
      }

      // Call the onImportComplete callback to refresh the events list
      onImportComplete();
      
      // Reset the file input and selected file
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (zipInputRef.current) zipInputRef.current.value = '';
      setSelectedFile(null);

    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import historical events",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setImportProgress(0), 1000);
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
        
        {(importEventsMutation.isError || importTab === 'api') && (
          <Alert variant={importEventsMutation.isError ? "destructive" : "default"} className="mb-4">
            {importEventsMutation.isError && <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{importEventsMutation.isError ? "Import Error" : "Import Events"}</AlertTitle>
            <AlertDescription>
              {importEventsMutation.isError 
                ? (importEventsMutation.error instanceof Error 
                    ? importEventsMutation.error.message 
                    : "An unknown error occurred during import.")
                : "Import a collection of historical events with images to populate your database. This will add interesting events from various periods in history."}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="api" value={importTab} onValueChange={(v) => setImportTab(v as 'api' | 'file')} className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="api">API Import</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Import a collection of historical events with images from public APIs to populate your database.
              </p>
              <Button 
                onClick={handleStartImport} 
                disabled={isImporting || importEventsMutation.isPending}
                className="gap-2 w-full mt-2"
              >
                {isImporting || importEventsMutation.isPending 
                  ? <Spinner size="sm" /> 
                  : <Import className="h-4 w-4" />}
                {isImporting || importEventsMutation.isPending 
                  ? "Importing Events..." 
                  : "Import Historical Events"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="file">
            <div className="space-y-4">
              <div>
                <Label htmlFor="excel-file">Upload Excel File</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    ref={fileInputRef}
                    id="excel-file" 
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Excel file should contain columns: Year, Title, Description, Location Name, Latitude, Longitude, Hint Year, Hint Location
                </p>
              </div>
              
              <div>
                <Label htmlFor="zip-file">Upload ZIP Archive</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    ref={zipInputRef}
                    id="zip-file" 
                    type="file" 
                    accept=".zip" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    type="button"
                    onClick={() => zipInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <FileArchive className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ZIP should contain images and an Excel file with event details matching the image filenames.
                </p>
              </div>
              
              <Button 
                onClick={handleFileUpload} 
                disabled={!selectedFile || isUploading}
                className="gap-2 w-full mt-4"
              >
                {isUploading 
                  ? <Spinner size="sm" /> 
                  : <Upload className="h-4 w-4" />}
                {isUploading 
                  ? "Uploading..." 
                  : "Upload & Import Events"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EventImporter;
