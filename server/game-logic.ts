import { GameBoard, GamePlayer } from "@shared/schema";

// Winning combinations (indices on the 3x3 board)
const WINNING_COMBINATIONS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

/**
 * Check if there's a winner on the current board
 * Returns the winner ('X' or 'O'), 'draw', or null if game continues
 */
export function checkWinner(board: GameBoard): {
  winner: GamePlayer | 'draw' | null;
  winningLine: number[] | null;
} {
  // Check for winning combinations
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a] as GamePlayer,
        winningLine: combination,
      };
    }
  }

  // Check for draw (board full with no winner)
  const isBoardFull = board.every(cell => cell !== null);
  if (isBoardFull) {
    return {
      winner: 'draw',
      winningLine: null,
    };
  }

  // Game continues
  return {
    winner: null,
    winningLine: null,
  };
}

/**
 * Check if a move is valid
 */
export function isValidMove(board: GameBoard, cellIndex: number): boolean {
  if (cellIndex < 0 || cellIndex > 8) {
    return false;
  }
  return board[cellIndex] === null;
}

/**
 * Make a move on the board
 */
export function makeMove(
  board: GameBoard,
  cellIndex: number,
  player: GamePlayer
): GameBoard {
  if (!isValidMove(board, cellIndex)) {
    throw new Error('Invalid move');
  }

  const newBoard = [...board] as GameBoard;
  newBoard[cellIndex] = player;
  return newBoard;
}

/**
 * Create an empty game board
 */
export function createEmptyBoard(): GameBoard {
  return [null, null, null, null, null, null, null, null, null];
}

/**
 * Get the next player's turn
 */
export function getNextPlayer(currentPlayer: GamePlayer): GamePlayer {
  return currentPlayer === 'X' ? 'O' : 'X';
}

/**
 * Generate a unique room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
