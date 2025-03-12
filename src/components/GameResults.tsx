
import React, { useState } from 'react';
import { RoundResult } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/utils/gameUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, RotateCcw, Medal, Trophy, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AuthButton from './AuthButton';
import { useAuth } from '@/contexts/AuthContext';

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
  const [leaderboardSort, setLeaderboardSort] = useState<'daily' | 'total' | 'average'>('daily');
  
  // Check if we're in daily mode by examining the first result's event properties
  const isDailyMode = results.length > 0 && results[0].event.gameMode === 'daily';
  
  // Placeholder leaderboard data
  const leaderboardData = [
    { rank: 1, userId: '1', username: 'HistoryBuff', avatar: "https://i.pravatar.cc/150?img=1", dailyScore: 45000, totalScore: 45000, avgScore: 9000 },
    { rank: 2, userId: '2', username: 'TimeTraveler', avatar: "https://i.pravatar.cc/150?img=2", dailyScore: 42500, totalScore: 42500, avgScore: 8500 },
    { rank: 3, userId: '3', username: 'MapMaster', avatar: "https://i.pravatar.cc/150?img=3", dailyScore: 40000, totalScore: 40000, avgScore: 8000 },
    { rank: 4, userId: '4', username: 'HistoryNerd', avatar: "https://i.pravatar.cc/150?img=4", dailyScore: 37500, totalScore: 37500, avgScore: 7500 },
    { rank: 5, userId: '5', username: 'You', avatar: "https://i.pravatar.cc/150?img=5", dailyScore: totalScore, totalScore: totalScore, avgScore: totalScore / 5 },
  ].sort((a, b) => {
    if (leaderboardSort === 'daily') return b.dailyScore - a.dailyScore;
    if (leaderboardSort === 'total') return b.totalScore - a.totalScore;
    return b.avgScore - a.avgScore;
  }).map((item, index) => ({ ...item, rank: index + 1 }));
  
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
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Your Total Score</h3>
            <p className="text-4xl font-bold">{formatNumber(totalScore)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              out of {formatNumber(results.length * 10000)} possible points
            </p>
          </div>
          
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round</TableHead>
                    <TableHead>Event Description</TableHead>
                    <TableHead className="text-right">Location</TableHead>
                    <TableHead className="text-right">Year</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="max-w-xs truncate">{result.event.description}</TableCell>
                      <TableCell className="text-right">{formatNumber(result.locationScore)}</TableCell>
                      <TableCell className="text-right">{formatNumber(result.timeScore)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(result.totalScore)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="leaderboard">
              <div className="mb-4 flex justify-center space-x-2">
                <Button 
                  variant={leaderboardSort === 'daily' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setLeaderboardSort('daily')}
                >
                  Daily Highest
                </Button>
                <Button 
                  variant={leaderboardSort === 'total' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setLeaderboardSort('total')}
                >
                  Total Score
                </Button>
                <Button 
                  variant={leaderboardSort === 'average' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setLeaderboardSort('average')}
                >
                  Average Score
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">
                      {leaderboardSort === 'daily' ? 'Daily Score' : 
                       leaderboardSort === 'total' ? 'Total Score' : 'Avg Score/Round'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((player) => (
                    <TableRow key={player.userId} className={player.username === 'You' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                      <TableCell className="font-medium">{player.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {player.avatar ? 
                              <AvatarImage src={player.avatar} /> :
                              <AvatarFallback>{player.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            }
                          </Avatar>
                          <span>{player.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(
                          leaderboardSort === 'daily' ? player.dailyScore : 
                          leaderboardSort === 'total' ? player.totalScore : player.avgScore
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          {!isDailyMode && (
            <Button onClick={onRestart} className="flex items-center gap-2 flex-1">
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
          )}
          <Button variant={isDailyMode ? "default" : "outline"} onClick={onHome} className="flex items-center gap-2 flex-1">
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameResults;
