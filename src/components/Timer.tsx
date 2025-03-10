
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface TimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  isActive: boolean;
  remainingSeconds?: number;
}

const Timer: React.FC<TimerProps> = ({ durationMinutes, onTimeUp, isActive, remainingSeconds }) => {
  const [timeLeft, setTimeLeft] = useState(remainingSeconds || durationMinutes * 60);
  const totalSeconds = durationMinutes * 60;
  const progress = (timeLeft / totalSeconds) * 100;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            if (interval) clearInterval(interval);
            onTimeUp();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else if (!isActive && interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onTimeUp]);

  // Update timeLeft when remainingSeconds changes
  useEffect(() => {
    if (remainingSeconds !== undefined) {
      setTimeLeft(remainingSeconds);
    }
  }, [remainingSeconds]);

  // Color changes based on time remaining
  const getColorClass = () => {
    if (progress > 50) return "bg-green-500";
    if (progress > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">{formatTime(timeLeft)}</span>
        </div>
        <span className="text-xs text-gray-500">{durationMinutes} min</span>
      </div>
      <Progress value={progress} className={getColorClass()} />
    </div>
  );
};

export default Timer;
