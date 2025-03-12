
import React from 'react';
import { Button } from "@/components/ui/button";
import { Image, MapPin } from 'lucide-react';

interface ViewToggleProps {
  activeView: 'photo' | 'map';
  onViewChange: (view: 'photo' | 'map') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ 
  activeView, 
  onViewChange 
}) => {
  return (
    <div className="flex space-x-2 justify-center mb-4 z-[60] relative">
      <Button
        variant={activeView === 'photo' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('photo')}
        className="flex-1 max-w-32 pointer-events-auto"
      >
        <Image className="mr-2 h-4 w-4" />
        Photo
      </Button>
      <Button
        variant={activeView === 'map' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('map')}
        className="flex-1 max-w-32 pointer-events-auto"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Map
      </Button>
    </div>
  );
};

export default ViewToggle;
