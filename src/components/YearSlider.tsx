
import React, { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface YearSliderProps {
  minYear?: number;
  maxYear?: number;
  value: number;
  onChange: (year: number) => void;
  disabled?: boolean;
}

const YearSlider: React.FC<YearSliderProps> = ({
  minYear = 1800,
  maxYear = 2025,
  value,
  onChange,
  disabled = false
}) => {
  const [yearInput, setYearInput] = useState(value.toString());

  useEffect(() => {
    setYearInput(value.toString());
  }, [value]);

  const handleSliderChange = (newValue: number[]) => {
    const year = newValue[0];
    onChange(year);
    setYearInput(year.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setYearInput(inputValue);
    
    const year = parseInt(inputValue);
    if (!isNaN(year) && year >= minYear && year <= maxYear) {
      onChange(year);
    }
  };

  const handleInputBlur = () => {
    const year = parseInt(yearInput);
    if (isNaN(year) || year < minYear) {
      setYearInput(minYear.toString());
      onChange(minYear);
    } else if (year > maxYear) {
      setYearInput(maxYear.toString());
      onChange(maxYear);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          type="number"
          min={minYear}
          max={maxYear}
          value={yearInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-32 text-center"
          disabled={disabled}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Year</span>
      </div>
      <div className="px-2">
        <Slider
          value={[value]}
          min={minYear}
          max={maxYear}
          step={1}
          onValueChange={handleSliderChange}
          disabled={disabled}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{minYear}</span>
          <span>{Math.floor((minYear + maxYear) / 2)}</span>
          <span>{maxYear}</span>
        </div>
      </div>
    </div>
  );
};

export default YearSlider;
