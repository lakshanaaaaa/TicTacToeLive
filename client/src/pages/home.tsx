import { useState, useEffect, useRef } from "react";
import { UseSocketReturn } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ExternalLink, Info } from "lucide-react";
import { GamePlayer } from "@shared/schema";

interface HomeProps {
  socket: UseSocketReturn;
  onViewChange: (view: 'home' | 'waiting' | 'playing', roomCode?: string, symbol?: GamePlayer) => void;
}

export default function Home({ socket, onViewChange }: HomeProps) {
  const [roomCode, setRoomCode] = useState("");
  const roomCodeRef = useRef(roomCode);
  const { toast } = useToast();

  // Keep ref in sync with state
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  // Setup socket event handlers once per mount, deriving values from event data or refs
  useEffect(() => {
    const cleanupHandlers: (() => void)[] = [];

    cleanupHandlers.push(
      socket.onRoomCreated((data) => {
        console.log('Room created:', data);
        onViewChange('waiting', data.roomCode, data.symbol);
      })
    );

    cleanupHandlers.push(
      socket.onJoinRoomResponse((data) => {
        console.log('Join room response:', data);
        if (data.success && data.symbol) {
          // Use ref to access current roomCode without causing re-registration
          onViewChange('playing', roomCodeRef.current, data.symbol);
        } else {
          toast({
            variant: "destructive",
            title: "Failed to join room",
            description: data.error || "Unknown error occurred",
          });
        }
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
  }, [socket, onViewChange]);

  const handleCreateRoom = () => {
    if (socket.connectionStatus !== 'connected') {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Not connected to server. Please wait...",
      });
      return;
    }
    
    socket.createRoom();
  };

  const handleJoinRoom = () => {
    const code = roomCode.trim().toUpperCase();
    
    if (code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Room Code",
        description: "Please enter a valid 6-character room code",
      });
      return;
    }

    if (socket.connectionStatus !== 'connected') {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Not connected to server. Please wait...",
      });
      return;
    }

    socket.joinRoom(code);
  };

  const handleRoomCodeChange = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    const formatted = value.toUpperCase().slice(0, 6);
    setRoomCode(formatted);
  };

  const getConnectionStatusColor = () => {
    switch (socket.connectionStatus) {
      case 'connected': return 'bg-success';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-muted-foreground';
      case 'error': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  const getConnectionStatusText = () => {
    switch (socket.connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="max-w-md mx-auto fade-in">
      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
        <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()} ${socket.connectionStatus === 'connected' ? 'pulse-animation' : ''}`}></div>
        <span data-testid="connection-status">{getConnectionStatusText()}</span>
      </div>

      {/* Welcome Section */}
      <Card className="shadow-lg border-border mb-6">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
            <p className="text-muted-foreground">Play Tic-Tac-Toe with friends in real-time</p>
          </div>
          
          {/* Create Room Card */}
          <div className="mb-6 p-6 bg-accent rounded-lg border border-border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Create New Game</h3>
                <p className="text-sm text-muted-foreground mb-4">Start a new room and share the code with a friend</p>
                <Button 
                  onClick={handleCreateRoom}
                  disabled={socket.connectionStatus !== 'connected'}
                  className="w-full"
                  data-testid="button-create-room"
                >
                  Create Room
                </Button>
              </div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">or</span>
            </div>
          </div>
          
          {/* Join Room Card */}
          <div className="p-6 bg-accent rounded-lg border border-border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Join Existing Game</h3>
                <p className="text-sm text-muted-foreground mb-4">Enter a room code to join a friend's game</p>
                
                <div className="mb-4">
                  <Label htmlFor="roomCode" className="block text-sm font-medium mb-2">Room Code</Label>
                  <Input 
                    id="roomCode"
                    type="text" 
                    value={roomCode}
                    onChange={(e) => handleRoomCodeChange(e.target.value)}
                    placeholder="e.g., ABC123"
                    className="font-mono uppercase text-center text-lg tracking-wider"
                    maxLength={6}
                    data-testid="input-room-code"
                  />
                </div>
                
                <Button 
                  onClick={handleJoinRoom}
                  disabled={socket.connectionStatus !== 'connected' || roomCode.length !== 6}
                  variant="secondary"
                  className="w-full"
                  data-testid="button-join-room"
                >
                  Join Room
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Info Section */}
      <Card className="bg-muted border-border">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            How to Play
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Create a room or join using a room code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Wait for another player to join</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Take turns placing X or O on the grid</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Get three in a row to win!</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
