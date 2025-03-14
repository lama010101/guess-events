
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, CheckCircle, Download, ImageOff, Image, Database } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { validateEventImage, hasHistoricalEvents, batchImportEvents } from '@/integrations/supabase/events';
import { Slider } from "@/components/ui/slider";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ImportHistoricalEventsButtonProps {
  autoImport?: boolean;
  onImportComplete?: (success: boolean, data: any) => void;
}

const ImportHistoricalEventsButton: React.FC<ImportHistoricalEventsButtonProps> = ({ 
  autoImport = false,
  onImportComplete
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDailyUpdateLoading, setIsDailyUpdateLoading] = useState(false);
  const [isValidatingImages, setIsValidatingImages] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<any[] | null>(null);
  
  // Advanced settings
  const [batchSize, setBatchSize] = useState(100);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);
  const [validateContent, setValidateContent] = useState(true);
  const [useFallbackImages, setUseFallbackImages] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Rate limiting state
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(null);
  
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
      setProgress(5);
      
      // Check for rate limiting
      if (isRateLimited && rateLimitResetTime && new Date() < rateLimitResetTime) {
        const timeRemaining = Math.ceil((rateLimitResetTime.getTime() - new Date().getTime()) / 1000);
        toast({
          title: "Rate limited",
          description: `Please wait ${timeRemaining} seconds before trying again`,
          variant: "destructive"
        });
        return;
      }
      
      setProgress(15);
      
      // Use the new batch import function with advanced options
      const importResult = await batchImportEvents({
        batchSize,
        validateImages: validateContent,
        confidenceThreshold,
        source: 'wikimedia'
      });
      
      setProgress(100);
      
      if (!importResult.success) {
        setError(importResult.message);
        
        // Check if we're rate limited
        if (importResult.message.includes('rate limit')) {
          setIsRateLimited(true);
          const resetTime = new Date();
          resetTime.setMinutes(resetTime.getMinutes() + 15); // Assume 15-minute rate limit
          setRateLimitResetTime(resetTime);
          
          toast({
            title: "Rate limited",
            description: "API rate limit reached. Please try again in 15 minutes.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Import failed",
            description: "Failed to import historical events",
            variant: "destructive"
          });
        }
        return;
      }
      
      setResults(importResult.results || []);
      
      toast({
        title: "Import successful",
        description: `Imported ${importResult.imported} historical events (${importResult.failed} failed)`
      });
      
      // Notify parent component
      if (onImportComplete) {
        onImportComplete(true, importResult);
      }
      
      // Automatically run daily update after import
      handleDailyUpdate();
      
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
      toast({
        title: "Import failed",
        description: "An error occurred while importing events",
        variant: "destructive"
      });
      
      // Notify parent component
      if (onImportComplete) {
        onImportComplete(false, { error: err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDailyUpdate = async () => {
    try {
      setIsDailyUpdateLoading(true);
      
      // Invoke the daily update function with enhanced settings
      const { data, error } = await supabase.functions.invoke('daily-events-update', {
        body: { 
          forceRefresh: true,
          validateImages: validateContent,
          confidenceThreshold,
          useFallbackSources: useFallbackImages
        }
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
      const batchSize = 10; // Process 10 events at a time to avoid rate limits
      
      // Validate images in batches with progress tracking
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        setValidationProgress(Math.round((i / events.length) * 100));
        
        // Process batch in parallel
        const batchPromises = batch.map(async (event) => {
          // Use the enhanced validation with AI-powered content verification
          const validationResult = await validateEventImage(event.id);
          
          return {
            id: event.id,
            year: event.year,
            description: event.description.substring(0, 30) + "...",
            originalUrl: event.image_url,
            newUrl: validationResult.newImageUrl || event.image_url,
            success: validationResult.success,
            message: validationResult.message,
            metadata: validationResult.metadata || {
              confidence: validationResult.success ? 1.0 : 0.0
            }
          };
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Brief pause to avoid rate limiting
        if (i + batchSize < events.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setValidationProgress(100);
      setValidationResults(results);
      
      const successCount = results.filter(r => r.success).length;
      
      toast({
        title: "Image validation complete",
        description: `Successfully validated/fixed ${successCount} out of ${events.length} images with AI verification`
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
    const headers = ["Year", "Description", "Status", "Error", "Confidence", "Keywords"];
    const csvRows = [headers.join(',')];
    
    results.forEach(result => {
      const row = [
        result.year,
        `"${result.description.replace(/"/g, '""')}"`,
        result.status,
        result.error ? `"${result.error.replace(/"/g, '""')}"` : '',
        result.metadata?.confidence || '',
        result.metadata?.keywords ? `"${result.metadata.keywords.join(', ')}"` : ''
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
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Import Historical Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Import historical events from Wikimedia Commons with AI-powered image validation. The system will verify historical context, ensure image quality, and provide fallback images when needed.
        </p>
        
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            {showAdvancedSettings ? "Hide" : "Show"} Advanced Settings
          </Button>
        </div>
        
        {showAdvancedSettings && (
          <Card className="bg-muted/30 mb-6">
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-size">Batch Size: {batchSize}</Label>
                  <span className="text-xs text-muted-foreground">(10-200)</span>
                </div>
                <Slider
                  id="batch-size"
                  min={10}
                  max={200}
                  step={10}
                  value={[batchSize]}
                  onValueChange={(values) => setBatchSize(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidence">Confidence Threshold: {confidenceThreshold.toFixed(2)}</Label>
                  <span className="text-xs text-muted-foreground">(0.5-0.95)</span>
                </div>
                <Slider
                  id="confidence"
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  value={[confidenceThreshold]}
                  onValueChange={(values) => setConfidenceThreshold(values[0])}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="validate-content"
                  checked={validateContent}
                  onCheckedChange={setValidateContent}
                />
                <Label htmlFor="validate-content">AI Content Verification</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="fallback-images"
                  checked={useFallbackImages}
                  onCheckedChange={setUseFallbackImages}
                />
                <Label htmlFor="fallback-images">Use Fallback Image Sources</Label>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Importing events with AI validation...</span>
            </div>
            <Progress value={progress} className="h-2 w-full" />
          </div>
        )}
        
        {isDailyUpdateLoading && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Running daily update check with content verification...</span>
            </div>
          </div>
        )}
        
        {isValidatingImages && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating images with AI content verification...</span>
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
                      <th className="text-xs font-medium text-right p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((result, index) => (
                      <tr key={index} className={result.status === 'failed' ? 'bg-destructive/10' : ''}>
                        <td className="text-sm p-2">{result.year}</td>
                        <td className="text-sm p-2">{result.description}</td>
                        <td className="text-sm p-2 text-right">
                          {result.status === 'success' ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {result.metadata?.confidence 
                                ? `${(result.metadata.confidence * 100).toFixed(0)}% confidence` 
                                : 'Success'}
                            </span>
                          ) : (
                            <span className="text-destructive flex items-center justify-end gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {result.error}
                            </span>
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
            <h3 className="font-medium text-lg">AI-Powered Image Validation Results</h3>
            
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
                            <span>
                              {result.newUrl !== result.originalUrl ? 'Fixed ' : 'Valid '}
                              {result.metadata?.confidence 
                                ? `(${(result.metadata.confidence * 100).toFixed(0)}%)` 
                                : ''}
                            </span>
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
          disabled={isLoading || (isRateLimited && rateLimitResetTime && new Date() < rateLimitResetTime)}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing with AI Validation...
            </>
          ) : isRateLimited && rateLimitResetTime && new Date() < rateLimitResetTime ? (
            `Rate limited (retry in ${Math.ceil((rateLimitResetTime.getTime() - new Date().getTime()) / 60000)} min)`
          ) : (
            'Import Historical Events with AI Validation'
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
              Validating with AI...
            </>
          ) : (
            'Validate & Fix Images with AI'
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
