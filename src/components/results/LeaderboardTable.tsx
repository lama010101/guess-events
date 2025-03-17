
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/utils/gameUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardPlayer {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  dailyScore: number;
  totalScore: number;
  avgScore: number;
}

interface LeaderboardTableProps {
  totalScore: number;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ totalScore }) => {
  const [leaderboardSort, setLeaderboardSort] = useState<'daily' | 'total' | 'average'>('daily');
  
  // Mock leaderboard data - in a real app this would come from a database
  const mockLeaderboardData = [
    { rank: 1, userId: '1', username: 'HistoryBuff', avatar: "https://i.pravatar.cc/150?img=1", dailyScore: 45000, totalScore: 45000, avgScore: 9000 },
    { rank: 2, userId: '2', username: 'TimeTraveler', avatar: "https://i.pravatar.cc/150?img=2", dailyScore: 42500, totalScore: 42500, avgScore: 8500 },
    { rank: 3, userId: '3', username: 'MapMaster', avatar: "https://i.pravatar.cc/150?img=3", dailyScore: 40000, totalScore: 40000, avgScore: 8000 },
    { rank: 4, userId: '4', username: 'HistoryNerd', avatar: "https://i.pravatar.cc/150?img=4", dailyScore: 37500, totalScore: 37500, avgScore: 7500 },
    { rank: 5, userId: '5', username: 'You', avatar: "https://i.pravatar.cc/150?img=5", dailyScore: totalScore, totalScore: totalScore, avgScore: totalScore / 5 },
  ];

  const leaderboardData = [...mockLeaderboardData]
    .sort((a, b) => {
      if (leaderboardSort === 'daily') return b.dailyScore - a.dailyScore;
      if (leaderboardSort === 'total') return b.totalScore - a.totalScore;
      return b.avgScore - a.avgScore;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
  
  return (
    <>
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
    </>
  );
};

export default LeaderboardTable;
