
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export interface TimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  round: number; // to reset timer when round changes
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, round }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    // Reset timer when round changes
    setTimeLeft(duration);
  }, [round, duration]);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);
  
  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  
  // Calculate percentage for visual indicator
  const percentageLeft = (timeLeft / duration) * 100;
  
  return (
    <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
      <Clock className="h-4 w-4 mr-1 text-gray-500" />
      <div className="relative w-16 text-center text-sm font-medium">
        <div 
          className="absolute left-0 top-0 bottom-0 bg-blue-100 rounded-full z-0"
          style={{ width: `${percentageLeft}%` }}
        />
        <span className="relative z-10">{formattedTime}</span>
      </div>
    </div>
  );
};

export default Timer;
