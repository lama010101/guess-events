
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, Image, Plus, X, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sampleEvents } from '@/data/sampleEvents';
import { HistoricalEvent } from '@/types/game';
import PhotoViewer from '@/components/PhotoViewer';
import AdminEventForm from '@/components/AdminEventForm';

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<HistoricalEvent[]>(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    toast({
      title: "Event deleted",
      description: "The event has been removed from the game."
    });
  };

  const handleAddEvent = (event: HistoricalEvent) => {
    // Generate a new ID for the event
    const newEvent = {
      ...event,
      id: String(Math.max(...events.map(e => Number(e.id))) + 1)
    };
    
    setEvents([...events, newEvent]);
    setIsAdding(false);
    
    toast({
      title: "Event added",
      description: "The new event has been added to the game."
    });
  };

  const handleUpdateEvent = (event: HistoricalEvent) => {
    setEvents(events.map(e => e.id === event.id ? event : e));
    setSelectedEvent(null);
    
    toast({
      title: "Event updated",
      description: "The event has been updated successfully."
    });
  };

  const handleCancel = () => {
    setSelectedEvent(null);
    setIsAdding(false);
  };

  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game
          </Button>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        
        <Button onClick={() => setIsAdding(true)} disabled={isAdding || selectedEvent !== null}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Event
        </Button>
      </div>

      {(isAdding || selectedEvent) ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{isAdding ? "Add New Event" : "Edit Event"}</CardTitle>
            <CardDescription>
              {isAdding 
                ? "Create a new historical event for the game" 
                : "Update the details of this historical event"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminEventForm 
              event={selectedEvent || undefined}
              onSubmit={isAdding ? handleAddEvent : handleUpdateEvent}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Manage Historical Events</CardTitle>
            <CardDescription>
              View, edit, and delete events used in the game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of all historical events in the game.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.year}</TableCell>
                    <TableCell>{event.location.name}</TableCell>
                    <TableCell className="line-clamp-2">{event.description}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePreview(event.imageUrl)}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedEvent(event)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute top-4 right-4 z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <PhotoViewer src={previewImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
