
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Clock, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Custom Hooks
import { useScraperAdmin } from '@/hooks/use-scraper-admin';
import { useAutoImport } from '@/hooks/use-auto-import';

// Custom Components
import ScraperControls from '@/components/scraper/ScraperControls';
import EventsTable from '@/components/scraper/EventsTable';
import ScraperLogs from '@/components/scraper/ScraperLogs';
import SettingsPanel from '@/components/scraper/SettingsPanel';
import EventImporter from '@/components/scraper/EventImporter';

const WebScraperAdmin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('events');
  
  // Get scraper data and functions from custom hooks
  const {
    events,
    isLoadingEvents,
    refetchEvents,
    scraperLogs,
    isLoadingLogs,
    refetchLogs,
    scraperSettings,
    isLoadingSettings,
    refetchSettings,
    bulkUpdateEventsMutation,
    updateSettingsMutation,
  } = useScraperAdmin();

  // Handle auto-import on first load
  const { isAutoImportComplete, isAutoImportRunning } = useAutoImport();
  
  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You need administrator privileges to access this page.",
        variant: "destructive"
      });
    }
  }, [profile, navigate, toast]);

  // Handle import completion
  const handleImportComplete = () => {
    refetchEvents();
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-[#f7f7f7] dark:bg-gray-950">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Historical Events Admin</h1>
            <p className="text-muted-foreground">Manage historical events and web scraper settings</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to App
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin')}>
              Admin Dashboard
            </Button>
          </div>
        </div>
        
        {/* Event Importer Component */}
        <EventImporter onImportComplete={handleImportComplete} />
        
        {/* Scraper Controls */}
        <ScraperControls 
          scraperSettings={scraperSettings}
          isLoadingSettings={isLoadingSettings}
          refetchEvents={refetchEvents}
          refetchLogs={refetchLogs}
          refetchSettings={refetchSettings}
          updateSettingsMutation={updateSettingsMutation}
        />
        
        {/* Main Tabs */}
        <Tabs 
          defaultValue="events" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Historical Events
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scraper Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Events Tab */}
          <TabsContent value="events">
            <EventsTable 
              events={events}
              isLoadingEvents={isLoadingEvents}
              bulkUpdateEventsMutation={bulkUpdateEventsMutation}
            />
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs">
            <ScraperLogs 
              scraperLogs={scraperLogs}
              isLoadingLogs={isLoadingLogs}
            />
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsPanel 
              scraperSettings={scraperSettings}
              events={events}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WebScraperAdmin;
