import { z } from "zod";

// Game state types
export type GamePlayer = 'X' | 'O';
export type GameCell = GamePlayer | null;
export type GameBoard = [
  GameCell, GameCell, GameCell,
  GameCell, GameCell, GameCell,
  GameCell, GameCell, GameCell
];

export interface GameRoom {
  id: string;
  code: string;
  players: {
    X?: string; // socket ID
    O?: string; // socket ID
  };
  board: GameBoard;
  currentTurn: GamePlayer;
  status: 'waiting' | 'playing' | 'finished';
  winner: GamePlayer | 'draw' | null;
  winningLine: number[] | null;
  createdAt: Date;
}

export interface Player {
  socketId: string;
  roomCode?: string;
  symbol?: GamePlayer;
}

// Socket event schemas
export const createRoomSchema = z.object({});

export const joinRoomSchema = z.object({
  roomCode: z.string().length(6).regex(/^[A-Z0-9]{6}$/),
});

export const makeMoveSchema = z.object({
  roomCode: z.string().length(6).regex(/^[A-Z0-9]{6}$/),
  cellIndex: z.number().min(0).max(8),
});

export const resetGameSchema = z.object({
  roomCode: z.string().length(6).regex(/^[A-Z0-9]{6}$/),
});

// Client event types
export type CreateRoomData = z.infer<typeof createRoomSchema>;
export type JoinRoomData = z.infer<typeof joinRoomSchema>;
export type MakeMoveData = z.infer<typeof makeMoveSchema>;
export type ResetGameData = z.infer<typeof resetGameSchema>;

// Server response types
export interface RoomCreatedResponse {
  roomCode: string;
  symbol: GamePlayer;
}

export interface JoinRoomResponse {
  success: boolean;
  symbol?: GamePlayer;
  error?: string;
}

export interface GameStateUpdate {
  board: GameBoard;
  currentTurn: GamePlayer;
  status: 'waiting' | 'playing' | 'finished';
  winner: GamePlayer | 'draw' | null;
  winningLine: number[] | null;
  players: {
    X?: boolean;
    O?: boolean;
  };
}

export interface PlayerDisconnectedEvent {
  disconnectedPlayer: GamePlayer;
}
