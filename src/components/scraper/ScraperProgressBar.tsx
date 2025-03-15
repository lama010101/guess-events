
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface ScraperProgressBarProps {
  progress: number;
}

const ScraperProgressBar: React.FC<ScraperProgressBarProps> = ({ progress }) => {
  // Only show the progress bar if there's actual progress (greater than 0)
  if (progress <= 0) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Scraping progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default ScraperProgressBar;
