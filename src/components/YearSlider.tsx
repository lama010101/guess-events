
import React from 'react';
import { Slider } from "@/components/ui/slider";

export interface YearSliderProps {
  onYearSelect: (year: number) => void;
  selectedYear: number | null;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}

const YearSlider: React.FC<YearSliderProps> = ({
  onYearSelect,
  selectedYear = 1950,
  min = 1800,
  max = 2023,
  step = 1,
  disabled = false
}) => {
  const handleYearChange = (values: number[]) => {
    if (values.length > 0) {
      onYearSelect(values[0]);
    }
  };
  
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Year:</span>
        <span className="font-medium text-xl">{selectedYear}</span>
      </div>
      
      <Slider
        defaultValue={[selectedYear || 1950]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleYearChange}
        disabled={disabled}
        className="py-4"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default YearSlider;
