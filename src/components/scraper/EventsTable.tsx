
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Trash2, ArrowUpCircle, Search, Eye, Image, Calendar, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HistoricalEventDB } from '@/types/scraper';
import { UseMutationResult } from '@tanstack/react-query';

interface EventsTableProps {
  events: HistoricalEventDB[];
  isLoadingEvents: boolean;
  bulkUpdateEventsMutation: UseMutationResult<any, Error, { ids: string[], deleted: boolean }, unknown>;
}

const EventsTable: React.FC<EventsTableProps> = ({
  events,
  isLoadingEvents,
  bulkUpdateEventsMutation
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedEvents.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to delete.",
        variant: "destructive"
      });
      return;
    }

    bulkUpdateEventsMutation.mutate({ 
      ids: selectedEvents, 
      deleted: true 
    });
  };

  // Handle bulk restore
  const handleBulkRestore = () => {
    if (selectedEvents.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to restore.",
        variant: "destructive"
      });
      return;
    }

    bulkUpdateEventsMutation.mutate({ 
      ids: selectedEvents, 
      deleted: false 
    });
  };

  // Toggle select all events
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(events.map(event => event.id));
    } else {
      setSelectedEvents([]);
    }
  };

  // Toggle selection of a single event
  const toggleEventSelection = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEvents(prev => [...prev, id]);
    } else {
      setSelectedEvents(prev => prev.filter(eventId => eventId !== id));
    }
  };
  
  // Render event details popover
  const renderEventDetails = (event: HistoricalEventDB) => (
    <PopoverContent className="w-96">
      <div className="space-y-2">
        <h4 className="font-medium">{event.location_name || 'Historical Event'}</h4>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        
        {event.image_url && (
          <div className="mt-2 rounded overflow-hidden">
            <img 
              src={event.image_url} 
              alt={event.location_name || 'Historical Event'}
              className="w-full h-auto object-cover max-h-48" 
            />
          </div>
        )}
        
        <div className="flex flex-col gap-2 text-sm mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Year: {event.year || 'Unknown'}
            </span>
          </div>
          
          {(event.latitude && event.longitude) && (
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-muted-foreground" />
              <span>
                Lat: {event.latitude.toFixed(4)}, Lng: {event.longitude.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </div>
    </PopoverContent>
  );
  
  // Filter events based on search term and deleted status
  const filteredEvents = events.filter(event => {
    // Filter by deleted status
    if (!showDeleted && event.deleted) return false;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        event.description?.toLowerCase().includes(term) ||
        event.location_name?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manage Historical Events</CardTitle>
            <CardDescription>
              View, bulk delete, and restore historical events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-deleted" 
                checked={showDeleted}
                onCheckedChange={(checked) => setShowDeleted(!!checked)}
              />
              <label
                htmlFor="show-deleted"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show Deleted
              </label>
            </div>
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              disabled={selectedEvents.length === 0}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkRestore}
              disabled={selectedEvents.length === 0}
              className="gap-1"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Restore Selected
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by title, description, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={filteredEvents.length > 0 && selectedEvents.length === filteredEvents.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all events"
                  />
                </TableHead>
                <TableHead className="w-12">Image</TableHead>
                <TableHead className="w-[300px]">Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEvents ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No events found. Run the scraper to collect historical events.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow 
                    key={event.id}
                    className={event.deleted ? "opacity-60 bg-gray-50 dark:bg-gray-800/50" : ""}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={(checked) => toggleEventSelection(event.id, !!checked)}
                        aria-label={`Select event ${event.location_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                        {event.image_url ? (
                          <img 
                            src={event.image_url} 
                            alt={event.location_name}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Image className="w-full h-full p-2 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-left justify-start font-normal">
                            <span className="line-clamp-2">{event.location_name}</span>
                          </Button>
                        </PopoverTrigger>
                        {renderEventDetails(event)}
                      </Popover>
                    </TableCell>
                    <TableCell>
                      {event.year 
                        ? event.year
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-1">
                        {event.location_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {event.deleted ? (
                        <Badge variant="destructive">Deleted</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.latitude && event.longitude ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {event.latitude.toFixed(2)}, {event.longitude.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No Location</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (event.deleted) {
                              bulkUpdateEventsMutation.mutate({ 
                                ids: [event.id], 
                                deleted: false 
                              });
                            } else {
                              bulkUpdateEventsMutation.mutate({ 
                                ids: [event.id], 
                                deleted: true 
                              });
                            }
                          }}
                        >
                          {event.deleted ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (event.image_url) {
                              window.open(event.image_url, '_blank');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsTable;
