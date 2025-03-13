
import React from 'react';
import { Button } from "@/components/ui/button";
import ImportHistoricalEventsButton from '@/components/ImportHistoricalEventsButton';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HistoricalEventsImport = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-2xl font-bold">Historical Events Import</h1>
      </div>
      
      <div className="max-w-xl mx-auto">
        <ImportHistoricalEventsButton />
      </div>
    </div>
  );
};

export default HistoricalEventsImport;
