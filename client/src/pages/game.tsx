import { useEffect, useState } from "react";
import { UseSocketReturn } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GameResultModal from "@/components/game-result-modal";
import { LogOut } from "lucide-react";
import { GamePlayer, GameBoard, GameStateUpdate } from "@shared/schema";

interface GameProps {
  socket: UseSocketReturn;
  roomCode: string;
  playerSymbol: GamePlayer | null;
  onViewChange: (view: 'home' | 'waiting' | 'playing') => void;
}

export default function Game({ socket, roomCode, playerSymbol, onViewChange }: GameProps) {
  const [gameState, setGameState] = useState<GameStateUpdate>({
    board: Array(9).fill(null) as GameBoard,
    currentTurn: 'X',
    status: 'waiting',
    winner: null,
    winningLine: null,
    players: { X: false, O: false },
  });
  const [showResultModal, setShowResultModal] = useState(false);
  
  const { toast } = useToast();

  // Setup socket event handlers
  useEffect(() => {
    const cleanupHandlers: (() => void)[] = [];

    cleanupHandlers.push(
      socket.onGameStateUpdate((data) => {
        console.log('Game state update:', data);
        setGameState(data);
        
        if (data.status === 'finished' && data.winner) {
          setShowResultModal(true);
        }
      })
    );

    cleanupHandlers.push(
      socket.onPlayerDisconnected((data) => {
        toast({
          title: "Player Disconnected",
          description: `Player ${data.disconnectedPlayer} left the game`,
          variant: "destructive",
        });
        // Optionally return to home or waiting room
        setTimeout(() => onViewChange('home'), 3000);
      })
    );

    cleanupHandlers.push(
      socket.onError((data) => {
        toast({
          variant: "destructive",
          title: "Game Error",
          description: data.message,
        });
      })
    );

    return () => {
      cleanupHandlers.forEach(cleanup => cleanup());
    };
  }, [socket, onViewChange, toast]);

  const handleCellClick = (cellIndex: number) => {
    // Check if it's the player's turn and the cell is empty
    if (gameState.currentTurn !== playerSymbol) {
      toast({
        title: "Not your turn",
        description: "Wait for your opponent to make their move",
        variant: "destructive",
      });
      return;
    }

    if (gameState.board[cellIndex] !== null) {
      toast({
        title: "Invalid move",
        description: "This cell is already occupied",
        variant: "destructive",
      });
      return;
    }

    if (gameState.status !== 'playing') {
      toast({
        title: "Game not active",
        description: "The game is not currently in progress",
        variant: "destructive",
      });
      return;
    }

    socket.makeMove(roomCode, cellIndex);
  };

  const handleLeaveGame = () => {
    socket.leaveRoom();
    onViewChange('home');
  };

  const handlePlayAgain = () => {
    socket.resetGame(roomCode);
    setShowResultModal(false);
  };

  const handleExitToHome = () => {
    socket.leaveRoom();
    setShowResultModal(false);
    onViewChange('home');
  };

  const renderCell = (cellIndex: number) => {
    const cellValue = gameState.board[cellIndex];
    const isWinningCell = gameState.winningLine?.includes(cellIndex);
    const isEmpty = cellValue === null;
    const isMyTurn = gameState.currentTurn === playerSymbol && gameState.status === 'playing';
    
    return (
      <button 
        key={cellIndex}
        onClick={() => handleCellClick(cellIndex)}
        disabled={!isEmpty || !isMyTurn || gameState.status !== 'playing'}
        className={`
          game-cell bg-background border-2 border-border rounded-lg flex items-center justify-center text-5xl md:text-6xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring aspect-square
          ${isEmpty ? (isMyTurn ? 'hover:bg-accent cursor-pointer' : 'cursor-not-allowed') : 'occupied cursor-not-allowed'}
          ${isWinningCell ? 'winning-cell' : ''}
        `}
        data-testid={`cell-${cellIndex}`}
      >
        {cellValue && (
          <span className={cellValue === 'X' ? 'player-x' : 'player-o'}>
            {cellValue}
          </span>
        )}
      </button>
    );
  };

  const getTurnStatusText = () => {
    if (gameState.status === 'finished') {
      if (gameState.winner === 'draw') {
        return "Game Over - Draw";
      } else if (gameState.winner === playerSymbol) {
        return "You Won! 🎉";
      } else {
        return "You Lost 😔";
      }
    }
    
    if (gameState.status === 'waiting') {
      return "Waiting for players...";
    }
    
    if (gameState.currentTurn === playerSymbol) {
      return `Your turn (${playerSymbol})`;
    } else {
      return `Opponent's turn (${gameState.currentTurn})`;
    }
  };

  const getPlayerName = (symbol: GamePlayer) => {
    return symbol === playerSymbol ? 'You' : 'Opponent';
  };

  return (
    <div className="max-w-2xl mx-auto fade-in">
      
      {/* Game Status Bar */}
      <Card className="shadow-lg border-border mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Room Info */}
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Room:</span>
                <span className="font-mono font-semibold ml-2" data-testid="text-game-room-code">{roomCode}</span>
              </div>
            </div>
            
            {/* Turn Indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg border border-border">
                <div className={`w-2 h-2 rounded-full ${gameState.status === 'playing' ? 'bg-primary pulse-animation' : 'bg-muted'}`}></div>
                <span className="text-sm font-medium" data-testid="text-turn-status">
                  {getTurnStatusText()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Player Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Player X Card */}
        <Card className={`border-2 shadow-sm ${gameState.players.X ? 'border-success/20' : 'border-border'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold player-x">X</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Player 1</p>
                <p className="font-semibold truncate" data-testid="text-player-x-name">
                  {getPlayerName('X')}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${gameState.players.X ? 'bg-success' : 'bg-muted'}`}></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Player O Card */}
        <Card className={`border-2 shadow-sm ${gameState.players.O ? 'border-destructive/20' : 'border-border'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold player-o">O</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Player 2</p>
                <p className="font-semibold truncate" data-testid="text-player-o-name">
                  {getPlayerName('O')}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${gameState.players.O ? 'bg-success' : 'bg-muted'}`}></div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Game Grid */}
      <Card className="shadow-lg border-border mb-6">
        <CardContent className="p-6 md:p-8">
          <div className="aspect-square max-w-lg mx-auto">
            <div className="grid grid-cols-3 gap-3 h-full" data-testid="game-board">
              {Array.from({ length: 9 }, (_, index) => renderCell(index))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Game Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline"
          onClick={handleLeaveGame}
          className="flex-1 flex items-center justify-center gap-2"
          data-testid="button-leave-game"
        >
          <LogOut className="w-5 h-5" />
          Leave Game
        </Button>
      </div>

      {/* Game Result Modal */}
      <GameResultModal 
        isOpen={showResultModal}
        winner={gameState.winner}
        playerSymbol={playerSymbol}
        onPlayAgain={handlePlayAgain}
        onExitToHome={handleExitToHome}
      />
    </div>
  );
}
