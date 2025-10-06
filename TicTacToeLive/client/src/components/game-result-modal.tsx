import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { GamePlayer } from "@shared/schema";

interface GameResultModalProps {
  isOpen: boolean;
  winner: GamePlayer | 'draw' | null;
  playerSymbol: GamePlayer | null;
  onPlayAgain: () => void;
  onExitToHome: () => void;
}

export default function GameResultModal({ 
  isOpen, 
  winner, 
  playerSymbol, 
  onPlayAgain, 
  onExitToHome 
}: GameResultModalProps) {
  const getResultContent = () => {
    if (winner === 'draw') {
      return {
        icon: <AlertTriangle className="w-10 h-10 text-muted-foreground" />,
        iconBg: 'bg-muted',
        title: "It's a Draw!",
        description: "The game ended in a tie. Well played!",
      };
    }

    const isWinner = winner === playerSymbol;
    
    if (isWinner) {
      return {
        icon: <CheckCircle className="w-10 h-10 text-success" />,
        iconBg: 'bg-success/10',
        title: `Player ${winner} Wins!`,
        description: "Congratulations on your victory!",
      };
    } else {
      return {
        icon: <AlertTriangle className="w-10 h-10 text-muted-foreground" />,
        iconBg: 'bg-muted',
        title: `Player ${winner} Wins!`,
        description: "Better luck next time!",
      };
    }
  };

  const result = getResultContent();

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md slide-down" data-testid="modal-game-result">
        <div className="text-center p-6">
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 ${result.iconBg} rounded-full mb-4`}>
              {result.icon}
            </div>
            <h3 className="text-2xl font-bold mb-2" data-testid="text-game-result-title">
              {result.title}
            </h3>
            <p className="text-muted-foreground" data-testid="text-game-result-description">
              {result.description}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={onPlayAgain}
              className="w-full"
              data-testid="button-play-again"
            >
              Play Again
            </Button>
            <Button 
              variant="outline"
              onClick={onExitToHome}
              className="w-full"
              data-testid="button-exit-to-home"
            >
              Exit to Home
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
