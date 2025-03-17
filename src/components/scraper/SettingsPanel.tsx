
import React from 'react';
import { Clock, Database, Download, CheckCircle, Pause, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScraperSettings } from '@/types/scraper';

interface SettingsPanelProps {
  scraperSettings: ScraperSettings | undefined;
  events: any[];
  setActiveTab: (tab: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  scraperSettings,
  events,
  setActiveTab
}) => {
  const { toast } = useToast();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Settings</CardTitle>
        <CardDescription>
          Configure the historical events admin panel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-md p-4 space-y-4">
            <h3 className="text-lg font-medium">Scraper Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure how the historical events scraper operates.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auto-run Interval</Label>
                <div className="text-sm">
                  The scraper will automatically run every {scraperSettings?.auto_run_interval || 24} hours.
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div className="flex items-center gap-2">
                  {scraperSettings?.is_running ? (
                    <Badge variant="default" className="gap-1 flex items-center">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Running
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 flex items-center">
                      <Pause className="h-3 w-3" />
                      Idle
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Max Images to Import</Label>
              <div className="text-sm">
                The scraper will import up to {scraperSettings?.max_images_to_import || 50} images per run.
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Enabled Default Sources</Label>
              <div className="text-sm space-y-2">
                {scraperSettings?.enabled_sources?.map((source, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {source}
                  </div>
                ))}
              </div>
            </div>
            
            {scraperSettings?.custom_sources && scraperSettings.custom_sources.length > 0 && (
              <>
                <Separator />
                
                <div className="space-y-2">
                  <Label>Custom Sources</Label>
                  <div className="text-sm space-y-2">
                    {scraperSettings.custom_sources.map((source, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        <div>
                          <div>{source.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {source.url}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveTab('logs');
                }}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                View Scraper Logs
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md p-4 space-y-4">
            <h3 className="text-lg font-medium">Data Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage database and historical events data.
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <Label>Historical Events</Label>
                  <div className="text-sm text-muted-foreground">
                    Total events in database: {events.length}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => { setActiveTab('events'); }}
                >
                  <Database className="h-4 w-4" />
                  Manage Events
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Database Export</Label>
              <div className="text-sm text-muted-foreground">
                Export historical events data for backup or analysis.
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  toast({
                    title: "Feature not implemented",
                    description: "Data export feature is not yet implemented.",
                    variant: "destructive"
                  });
                }}
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;
