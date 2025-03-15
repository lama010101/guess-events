
import React from 'react';

interface ScraperResultsData {
  sourcesProcessed?: number;
  totalEvents?: number;
  newEvents?: number;
  existingEvents?: number;
  failures?: number;
}

interface ScraperResultsProps {
  results: ScraperResultsData | null;
}

const ScraperResults: React.FC<ScraperResultsProps> = ({ results }) => {
  if (!results) return null;
  
  return (
    <div className="mt-4 p-4 bg-muted rounded-md">
      <h3 className="font-medium mb-2">Latest Scraper Results</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
          <div className="text-xl font-bold">{results.sourcesProcessed || 0}</div>
          <div className="text-xs text-muted-foreground">Sources Processed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
          <div className="text-xl font-bold">{results.totalEvents || 0}</div>
          <div className="text-xs text-muted-foreground">Total Events Found</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
          <div className="text-xl font-bold text-green-600">{results.newEvents || 0}</div>
          <div className="text-xs text-muted-foreground">New Events Added</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
          <div className="text-xl font-bold text-amber-600">{results.existingEvents || 0}</div>
          <div className="text-xs text-muted-foreground">Duplicate Events Skipped</div>
        </div>
      </div>
    </div>
  );
};

export default ScraperResults;
