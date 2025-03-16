
import React from 'react';
import { Button } from "@/components/ui/button";
import { Image, Map } from 'lucide-react';

export interface ViewToggleProps {
  view: 'photo' | 'map';
  onChange: (view: 'photo' | 'map') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onChange }) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('photo')}
        className={`${view === 'photo' ? 'bg-primary/10' : ''}`}
      >
        <Image className="h-4 w-4 mr-2" />
        Photo
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('map')}
        className={`${view === 'map' ? 'bg-primary/10' : ''}`}
      >
        <Map className="h-4 w-4 mr-2" />
        Map
      </Button>
    </div>
  );
};

export default ViewToggle;
