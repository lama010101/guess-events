
import React from 'react';
import { Button } from "@/components/ui/button";
import { RoundResult } from '@/types/game';
import RoundResultComponent from './RoundResult';
import { Trophy, Share, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameResultsProps {
  results: RoundResult[];
  totalScore: number;
  onPlayAgain: () => void;
  distanceUnit: 'km' | 'miles';
  gameMode: string;
  achievements?: { id: string; title: string; description: string; icon: string }[];
}

const GameResults: React.FC<GameResultsProps> = ({
  results,
  totalScore,
  onPlayAgain,
  distanceUnit,
  gameMode,
  achievements = []
}) => {
  const navigate = useNavigate();
  
  const handleShare = () => {
    // Implementation for sharing results
    const text = `I scored ${totalScore} points in HistoryGuesser's ${gameMode} mode! Can you beat me?`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My HistoryGuesser Score',
        text: text,
        url: window.location.origin,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(text + ' ' + window.location.origin)
        .then(() => alert('Score copied to clipboard!'))
        .catch((err) => console.error('Failed to copy text: ', err));
    }
  };
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Game Results</h2>
          <p className="text-muted-foreground">
            {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)} Mode
          </p>
          <div className="text-4xl font-bold mt-2">{totalScore} points</div>
        </div>
        
        {/* Show achievements if any were earned */}
        {achievements && achievements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Achievements Unlocked
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start p-3 bg-muted rounded-md">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3 flex-shrink-0">
                    {achievement.icon ? (
                      <img src={achievement.icon} alt="" className="h-6 w-6" />
                    ) : (
                      <Trophy className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold">Round Results</h3>
          {results.map((result, index) => (
            <RoundResultComponent
              key={index}
              result={result}
              distanceUnit={distanceUnit}
            />
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onPlayAgain} className="flex-1">
            Play Again
          </Button>
          <Button variant="outline" onClick={handleShare} className="flex-1">
            <Share className="w-4 h-4 mr-2" />
            Share Score
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
