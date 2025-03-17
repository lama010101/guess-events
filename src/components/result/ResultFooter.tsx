
import React from 'react';
import { Button } from '@/components/ui/button';

interface ResultFooterProps {
  onNextRound: () => void;
  isLastRound: boolean;
}

const ResultFooter: React.FC<ResultFooterProps> = ({ onNextRound, isLastRound }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white shadow-md border-t border-gray-200 p-4">
      <div className="container mx-auto">
        <Button onClick={onNextRound} className="w-full">
          {isLastRound ? 'See Final Results' : 'Next Round'}
        </Button>
      </div>
    </div>
  );
};

export default ResultFooter;
