
import React from 'react';
import { Share2, Twitter, Facebook, Link } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

interface ShareResultsButtonProps {
  totalScore: number;
}

const ShareResultsButton: React.FC<ShareResultsButtonProps> = ({ totalScore }) => {
  const { toast } = useToast();

  const handleShare = (platform: 'twitter' | 'facebook' | 'copy') => {
    const shareText = `I scored ${totalScore} points in HistoryGuess! Can you beat my score?`;
    const url = window.location.href;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText} ${url}`)
          .then(() => {
            toast({
              title: "Link copied!",
              description: "Share link copied to clipboard",
            });
          })
          .catch(() => {
            toast({
              title: "Failed to copy",
              description: "Could not copy to clipboard",
              variant: "destructive",
            });
          });
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share Score
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer">
          <Link className="h-4 w-4 mr-2" />
          Copy Share Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareResultsButton;
