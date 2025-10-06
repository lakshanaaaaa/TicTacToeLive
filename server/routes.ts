import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  createRoomSchema, 
  joinRoomSchema, 
  makeMoveSchema, 
  resetGameSchema,
  type JoinRoomResponse,
  type RoomCreatedResponse,
  type GameStateUpdate,
  type PlayerDisconnectedEvent,
  GamePlayer
} from "@shared/schema";
import { 
  generateRoomCode, 
  checkWinner, 
  isValidMove, 
  makeMove, 
  getNextPlayer,
  createEmptyBoard
} from "./game-logic";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server on distinct path to avoid conflict with Vite HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map to track socket connections
  const socketMap = new Map<string, WebSocket>();

  wss.on('connection', async (ws: WebSocket, req) => {
    const socketId = generateSocketId();
    socketMap.set(socketId, ws);
    
    // Add player to storage
    await storage.addPlayer(socketId);
    
    console.log(`Player connected: ${socketId}`);

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;

        switch (type) {
          case 'createRoom':
            await handleCreateRoom(socketId, ws);
            break;
          
          case 'joinRoom':
            await handleJoinRoom(socketId, ws, payload);
            break;
          
          case 'makeMove':
            await handleMakeMove(socketId, ws, payload);
            break;
          
          case 'resetGame':
            await handleResetGame(socketId, ws, payload);
            break;
          
          case 'leaveRoom':
            await handleLeaveRoom(socketId);
            break;
          
          default:
            sendError(ws, 'Unknown message type');
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', async () => {
      console.log(`Player disconnected: ${socketId}`);
      
      const player = await storage.getPlayer(socketId);
      if (player && player.roomCode) {
        // Notify other players in the room
        await notifyPlayerDisconnected(player.roomCode, player.symbol!, socketId);
      }
      
      await storage.removePlayer(socketId);
      socketMap.delete(socketId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${socketId}:`, error);
    });
  });

  // Handler functions
  async function handleCreateRoom(socketId: string, ws: WebSocket) {
    try {
      let roomCode: string;
      let attempts = 0;
      
      // Generate unique room code
      do {
        roomCode = generateRoomCode();
        attempts++;
      } while (await storage.getRoom(roomCode) && attempts < 10);
      
      if (attempts >= 10) {
        sendError(ws, 'Unable to create room. Please try again.');
        return;
      }

      // Create room and add player
      await storage.createRoom(roomCode);
      const symbol = await storage.addPlayerToRoom(socketId, roomCode);
      
      if (!symbol) {
        sendError(ws, 'Failed to create room');
        return;
      }

      const response: RoomCreatedResponse = {
        roomCode,
        symbol,
      };

      sendMessage(ws, 'roomCreated', response);
      console.log(`Room created: ${roomCode} by player ${socketId}`);
    } catch (error) {
      console.error('Create room error:', error);
      sendError(ws, 'Failed to create room');
    }
  }

  async function handleJoinRoom(socketId: string, ws: WebSocket, payload: any) {
    try {
      const { roomCode } = joinRoomSchema.parse(payload);
      const room = await storage.getRoom(roomCode);
      
      if (!room) {
        const response: JoinRoomResponse = {
          success: false,
          error: 'Room not found',
        };
        sendMessage(ws, 'joinRoomResponse', response);
        return;
      }

      const symbol = await storage.addPlayerToRoom(socketId, roomCode);
      
      if (!symbol) {
        const response: JoinRoomResponse = {
          success: false,
          error: 'Room is full',
        };
        sendMessage(ws, 'joinRoomResponse', response);
        return;
      }

      const response: JoinRoomResponse = {
        success: true,
        symbol,
      };

      sendMessage(ws, 'joinRoomResponse', response);
      
      // Broadcast game state to all players in room
      await broadcastGameState(roomCode);
      
      console.log(`Player ${socketId} joined room ${roomCode} as ${symbol}`);
    } catch (error) {
      console.error('Join room error:', error);
      const response: JoinRoomResponse = {
        success: false,
        error: 'Invalid room code',
      };
      sendMessage(ws, 'joinRoomResponse', response);
    }
  }

  async function handleMakeMove(socketId: string, ws: WebSocket, payload: any) {
    try {
      const { roomCode, cellIndex } = makeMoveSchema.parse(payload);
      const room = await storage.getRoom(roomCode);
      const player = await storage.getPlayer(socketId);
      
      if (!room || !player || player.roomCode !== roomCode) {
        sendError(ws, 'Invalid room or player');
        return;
      }

      if (room.status !== 'playing') {
        sendError(ws, 'Game is not in progress');
        return;
      }

      if (room.currentTurn !== player.symbol) {
        sendError(ws, 'Not your turn');
        return;
      }

      if (!isValidMove(room.board, cellIndex)) {
        sendError(ws, 'Invalid move');
        return;
      }

      // Make the move
      const newBoard = makeMove(room.board, cellIndex, player.symbol!);
      const { winner, winningLine } = checkWinner(newBoard);
      
      // Update room state
      const updates: Partial<typeof room> = {
        board: newBoard,
        currentTurn: getNextPlayer(room.currentTurn),
      };

      if (winner) {
        updates.status = 'finished';
        updates.winner = winner;
        updates.winningLine = winningLine;
      }

      await storage.updateRoom(roomCode, updates);

      // Broadcast updated game state
      await broadcastGameState(roomCode);
      
      console.log(`Move made in room ${roomCode}: player ${player.symbol} at position ${cellIndex}`);
    } catch (error) {
      console.error('Make move error:', error);
      sendError(ws, 'Failed to make move');
    }
  }

  async function handleResetGame(socketId: string, ws: WebSocket, payload: any) {
    try {
      const { roomCode } = resetGameSchema.parse(payload);
      const room = await storage.getRoom(roomCode);
      const player = await storage.getPlayer(socketId);
      
      if (!room || !player || player.roomCode !== roomCode) {
        sendError(ws, 'Invalid room or player');
        return;
      }

      if (room.status !== 'finished') {
        sendError(ws, 'Game is not finished');
        return;
      }

      // Reset game state
      await storage.updateRoom(roomCode, {
        board: createEmptyBoard(),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null,
      });

      // Broadcast updated game state
      await broadcastGameState(roomCode);
      
      console.log(`Game reset in room ${roomCode}`);
    } catch (error) {
      console.error('Reset game error:', error);
      sendError(ws, 'Failed to reset game');
    }
  }

  async function handleLeaveRoom(socketId: string) {
    try {
      const player = await storage.getPlayer(socketId);
      if (player && player.roomCode) {
        await notifyPlayerDisconnected(player.roomCode, player.symbol!, socketId);
        await storage.removePlayerFromRoom(socketId);
      }
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }

  async function broadcastGameState(roomCode: string) {
    const room = await storage.getRoom(roomCode);
    if (!room) return;

    const gameState: GameStateUpdate = {
      board: room.board,
      currentTurn: room.currentTurn,
      status: room.status,
      winner: room.winner,
      winningLine: room.winningLine,
      players: {
        X: !!room.players.X,
        O: !!room.players.O,
      },
    };

    // Send to all players in the room
    [room.players.X, room.players.O].forEach(socketId => {
      if (socketId) {
        const socket = socketMap.get(socketId);
        if (socket && socket.readyState === WebSocket.OPEN) {
          sendMessage(socket, 'gameStateUpdate', gameState);
        }
      }
    });
  }

  async function notifyPlayerDisconnected(roomCode: string, symbol: GamePlayer, disconnectedSocketId: string) {
    const room = await storage.getRoom(roomCode);
    if (!room) return;

    const event: PlayerDisconnectedEvent = {
      disconnectedPlayer: symbol,
    };

    // Notify remaining players
    [room.players.X, room.players.O].forEach(socketId => {
      if (socketId && socketId !== disconnectedSocketId) {
        const socket = socketMap.get(socketId);
        if (socket && socket.readyState === WebSocket.OPEN) {
          sendMessage(socket, 'playerDisconnected', event);
        }
      }
    });
  }

  function sendMessage(ws: WebSocket, type: string, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  function sendError(ws: WebSocket, message: string) {
    sendMessage(ws, 'error', { message });
  }

  function generateSocketId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  return httpServer;
}
