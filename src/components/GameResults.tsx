
import React from 'react';
import { RoundResult } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Users } from 'lucide-react';
import AuthButton from './AuthButton';
import { useAuth } from '@/contexts/AuthContext';

// Import our newly created components
import TotalScoreDisplay from './results/TotalScoreDisplay';
import AchievementsSummary from './results/AchievementsSummary';
import HintsUsedSummary from './results/HintsUsedSummary';
import RoundsTable from './results/RoundsTable';
import LeaderboardTable from './results/LeaderboardTable';
import GameActionButtons from './results/GameActionButtons';

interface GameResultsProps {
  results: RoundResult[];
  onRestart: () => void;
  onHome: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ 
  results, 
  onRestart,
  onHome
}) => {
  const { user } = useAuth();
  const totalScore = results.reduce((sum, result) => sum + result.totalScore, 0);
  
  // Check if we're in daily mode by examining if gameMode is set to daily
  const isDailyMode = results.length > 0 && 
    results[0].event.gameMode === 'daily';
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-end mb-4">
        <AuthButton />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Game Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TotalScoreDisplay 
            totalScore={totalScore} 
            maxPossibleScore={results.length * 10000} 
          />
          
          <AchievementsSummary results={results} />
          <HintsUsedSummary results={results} />
          
          <Tabs defaultValue="rounds" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rounds" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Your Rounds
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Medal className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="rounds">
              <RoundsTable results={results} />
            </TabsContent>
            
            <TabsContent value="leaderboard">
              <LeaderboardTable totalScore={totalScore} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4 gap-4">
          <GameActionButtons 
            onRestart={onRestart} 
            onHome={onHome} 
            isDailyMode={isDailyMode} 
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameResults;
