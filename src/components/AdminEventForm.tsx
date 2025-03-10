
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HistoricalEvent } from '@/types/game';
import { Card } from '@/components/ui/card';

interface AdminEventFormProps {
  event?: HistoricalEvent;
  onSubmit: (event: HistoricalEvent) => void;
  onCancel: () => void;
}

const AdminEventForm: React.FC<AdminEventFormProps> = ({ 
  event, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Omit<HistoricalEvent, 'id'> & { id?: string }>({
    imageUrl: '',
    location: {
      lat: 0,
      lng: 0,
      name: ''
    },
    year: new Date().getFullYear(),
    description: ''
  });

  const [errors, setErrors] = useState<{
    imageUrl?: string;
    year?: string;
    location?: string;
    description?: string;
  }>({});

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setFormData(event);
      setImagePreview(event.imageUrl);
    }
  }, [event]);

  const validateForm = () => {
    const newErrors: {
      imageUrl?: string;
      year?: string;
      location?: string;
      description?: string;
    } = {};
    
    if (!formData.imageUrl) {
      newErrors.imageUrl = 'Image URL is required';
    }
    
    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else if (formData.year < 1900 || formData.year > new Date().getFullYear()) {
      newErrors.year = `Year must be between 1900 and ${new Date().getFullYear()}`;
    }
    
    if (!formData.location.name) {
      newErrors.location = 'Location name is required';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'lat' || name === 'lng') {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [name]: parseFloat(value) || 0
        }
      });
    } else if (name === 'locationName') {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          name: value
        }
      });
    } else if (name === 'year') {
      setFormData({
        ...formData,
        year: parseInt(value) || new Date().getFullYear()
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for this field
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        id: event?.id || '0',
        ...formData
      });
    }
  };

  const handlePreviewImage = () => {
    if (formData.imageUrl) {
      setImagePreview(formData.imageUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className={errors.imageUrl ? "border-red-500" : ""}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePreviewImage}
              >
                Preview
              </Button>
            </div>
            {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl}</p>}
          </div>

          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              name="year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.year}
              onChange={handleChange}
              className={errors.year ? "border-red-500" : ""}
            />
            {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
          </div>

          <div>
            <Label htmlFor="locationName">Location Name</Label>
            <Input
              id="locationName"
              name="locationName"
              value={formData.location.name}
              onChange={handleChange}
              placeholder="City, Country"
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                name="lat"
                type="number"
                step="0.0001"
                value={formData.location.lat}
                onChange={handleChange}
                placeholder="e.g. 40.7128"
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                name="lng"
                type="number"
                step="0.0001"
                value={formData.location.lng}
                onChange={handleChange}
                placeholder="e.g. -74.0060"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the historical event..."
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {imagePreview && (
            <Card className="p-2 h-60 overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover rounded"
                onError={() => {
                  setImagePreview(null);
                  setErrors({
                    ...errors,
                    imageUrl: 'Invalid image URL'
                  });
                }}
              />
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {event ? 'Update Event' : 'Add Event'}
        </Button>
      </div>
    </form>
  );
};

export default AdminEventForm;
