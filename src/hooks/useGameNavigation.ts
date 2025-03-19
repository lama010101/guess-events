
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';

interface GameNavigationProps {
  currentRound: number;
  sessionId: string;
  isGameActive: boolean;
  setCurrentRound: (round: number) => void;
}

export const useGameNavigation = ({
  currentRound,
  sessionId,
  isGameActive,
  setCurrentRound
}: GameNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Initialize round from URL if available
  useEffect(() => {
    if (isGameActive && params.round) {
      const roundFromUrl = parseInt(params.round);
      if (!isNaN(roundFromUrl) && roundFromUrl !== currentRound) {
        setCurrentRound(roundFromUrl);
      }
    }
  }, [params.round, isGameActive, currentRound, setCurrentRound]);
  
  // Update URL when current round changes
  useEffect(() => {
    if (isGameActive && sessionId && currentRound > 0) {
      // Construct path without the round number
      const basePath = location.pathname.replace(/\/round\/\d+$/, '');
      const newPath = `${basePath}/round/${currentRound}`;
      
      // Only navigate if the path is different
      if (location.pathname !== newPath) {
        navigate(newPath, { replace: true });
      }
    }
  }, [currentRound, sessionId, isGameActive, navigate, location.pathname]);
  
  // Function to navigate to a specific round
  const navigateToRound = (round: number) => {
    if (isGameActive && sessionId) {
      const basePath = location.pathname.replace(/\/round\/\d+$/, '');
      navigate(`${basePath}/round/${round}`);
    }
  };
  
  // Add the handleNextRound function that takes only the gameState argument
  const handleNextRound = (currentRound: number) => {
    const nextRound = currentRound + 1;
    navigateToRound(nextRound);
    return nextRound;
  };
  
  return { navigateToRound, handleNextRound };
};

export default useGameNavigation;
