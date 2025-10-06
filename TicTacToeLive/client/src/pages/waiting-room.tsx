import { useEffect, useState } from "react";
import { UseSocketReturn } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Loader2 } from "lucide-react";

interface WaitingRoomProps {
  socket: UseSocketReturn;
  roomCode: string;
  onViewChange: (view: 'home' | 'waiting' | 'playing') => void;
}

export default function WaitingRoom({ socket, roomCode, onViewChange }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Setup socket event handlers
  useEffect(() => {
    const cleanupHandlers: (() => void)[] = [];

    cleanupHandlers.push(
      socket.onGameStateUpdate((data) => {
        console.log('Game state update:', data);
        if (data.status === 'playing') {
          onViewChange('playing');
        }
      })
    );

    cleanupHandlers.push(
      socket.onPlayerDisconnected((data) => {
        toast({
          title: "Player Disconnected",
          description: `Player ${data.disconnectedPlayer} left the room`,
          variant: "destructive",
        });
      })
    );

    cleanupHandlers.push(
      socket.onError((data) => {
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: data.message,
        });
      })
    );

    return () => {
      cleanupHandlers.forEach(cleanup => cleanup());
    };
  }, [socket, onViewChange, toast]);

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast({
        title: "Room code copied!",
        description: "Share this code with your friend to start playing",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy room code to clipboard",
      });
    }
  };

  const handleLeaveRoom = () => {
    socket.leaveRoom();
    onViewChange('home');
  };

  return (
    <div className="max-w-md mx-auto fade-in">
      <Card className="shadow-lg border-border">
        <CardContent className="p-8 text-center">
          
          {/* Room Code Display */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Room Code</p>
            <div className="inline-flex items-center gap-3 bg-accent px-6 py-3 rounded-lg border border-border">
              <span 
                className="text-3xl font-bold font-mono tracking-widest" 
                data-testid="text-room-code"
              >
                {roomCode}
              </span>
              <Button 
                onClick={handleCopyRoomCode}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-background rounded transition-colors"
                title="Copy room code"
                data-testid="button-copy-room-code"
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-success">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Waiting Animation */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-full mb-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Waiting for opponent...</h3>
            <p className="text-muted-foreground">Share the room code with a friend to start playing</p>
          </div>
          
          {/* Player Info */}
          <div className="bg-accent p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-sm font-medium" data-testid="text-player-status">You're in the room</span>
            </div>
          </div>
          
          {/* Cancel Button */}
          <Button 
            variant="ghost"
            onClick={handleLeaveRoom}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            data-testid="button-leave-room"
          >
            Cancel and go back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
