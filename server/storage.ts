import { GameRoom, Player, GamePlayer } from "@shared/schema";
import { createEmptyBoard } from "./game-logic";

export interface IStorage {
  // Room management
  createRoom(roomCode: string): Promise<GameRoom>;
  getRoom(roomCode: string): Promise<GameRoom | undefined>;
  updateRoom(roomCode: string, updates: Partial<GameRoom>): Promise<void>;
  deleteRoom(roomCode: string): Promise<void>;
  
  // Player management
  addPlayer(socketId: string): Promise<void>;
  getPlayer(socketId: string): Promise<Player | undefined>;
  updatePlayer(socketId: string, updates: Partial<Player>): Promise<void>;
  removePlayer(socketId: string): Promise<void>;
  
  // Room operations
  addPlayerToRoom(socketId: string, roomCode: string): Promise<GamePlayer | null>;
  removePlayerFromRoom(socketId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, GameRoom>;
  private players: Map<string, Player>;

  constructor() {
    this.rooms = new Map();
    this.players = new Map();
  }

  async createRoom(roomCode: string): Promise<GameRoom> {
    const room: GameRoom = {
      id: roomCode,
      code: roomCode,
      players: {},
      board: createEmptyBoard(),
      currentTurn: 'X',
      status: 'waiting',
      winner: null,
      winningLine: null,
      createdAt: new Date(),
    };
    
    this.rooms.set(roomCode, room);
    return room;
  }

  async getRoom(roomCode: string): Promise<GameRoom | undefined> {
    return this.rooms.get(roomCode);
  }

  async updateRoom(roomCode: string, updates: Partial<GameRoom>): Promise<void> {
    const room = this.rooms.get(roomCode);
    if (room) {
      Object.assign(room, updates);
    }
  }

  async deleteRoom(roomCode: string): Promise<void> {
    this.rooms.delete(roomCode);
  }

  async addPlayer(socketId: string): Promise<void> {
    const player: Player = {
      socketId,
    };
    this.players.set(socketId, player);
  }

  async getPlayer(socketId: string): Promise<Player | undefined> {
    return this.players.get(socketId);
  }

  async updatePlayer(socketId: string, updates: Partial<Player>): Promise<void> {
    const player = this.players.get(socketId);
    if (player) {
      Object.assign(player, updates);
    }
  }

  async removePlayer(socketId: string): Promise<void> {
    const player = this.players.get(socketId);
    if (player && player.roomCode) {
      await this.removePlayerFromRoom(socketId);
    }
    this.players.delete(socketId);
  }

  async addPlayerToRoom(socketId: string, roomCode: string): Promise<GamePlayer | null> {
    const room = this.rooms.get(roomCode);
    const player = this.players.get(socketId);
    
    if (!room || !player) {
      return null;
    }

    // Assign player symbol
    let symbol: GamePlayer;
    if (!room.players.X) {
      symbol = 'X';
      room.players.X = socketId;
    } else if (!room.players.O) {
      symbol = 'O';
      room.players.O = socketId;
    } else {
      return null; // Room is full
    }

    // Update player
    player.roomCode = roomCode;
    player.symbol = symbol;

    // Start game if both players joined
    if (room.players.X && room.players.O) {
      room.status = 'playing';
    }

    return symbol;
  }

  async removePlayerFromRoom(socketId: string): Promise<void> {
    const player = this.players.get(socketId);
    if (!player || !player.roomCode) {
      return;
    }

    const room = this.rooms.get(player.roomCode);
    if (room) {
      // Remove player from room
      if (room.players.X === socketId) {
        delete room.players.X;
      } else if (room.players.O === socketId) {
        delete room.players.O;
      }

      // Reset room status if no players left
      if (!room.players.X && !room.players.O) {
        room.status = 'waiting';
        room.board = createEmptyBoard();
        room.currentTurn = 'X';
        room.winner = null;
        room.winningLine = null;
      } else if (room.status === 'playing') {
        // If game was in progress, set status back to waiting
        room.status = 'waiting';
      }
    }

    // Clear player room info
    player.roomCode = undefined;
    player.symbol = undefined;
  }
}

export const storage = new MemStorage();
