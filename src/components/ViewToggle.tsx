
import React from 'react';
import { Button } from "@/components/ui/button";
import { Image, MapPin } from 'lucide-react';

interface ViewToggleProps {
  view: 'photo' | 'map';
  onChange: (view: 'photo' | 'map') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ 
  view, 
  onChange 
}) => {
  return (
    <div className="flex space-x-2 justify-center mb-4 z-[100] relative">
      <Button
        variant={view === 'photo' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('photo')}
        className="flex-1 max-w-32 pointer-events-auto"
      >
        <Image className="mr-2 h-4 w-4" />
        Photo
      </Button>
      <Button
        variant={view === 'map' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('map')}
        className="flex-1 max-w-32 pointer-events-auto"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Map
      </Button>
    </div>
  );
};

export default ViewToggle;
