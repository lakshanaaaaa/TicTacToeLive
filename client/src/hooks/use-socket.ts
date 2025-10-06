import { useEffect, useState, useCallback, useRef } from 'react';
import {
  type RoomCreatedResponse,
  type JoinRoomResponse,
  type GameStateUpdate,
  type PlayerDisconnectedEvent,
  type CreateRoomData,
  type JoinRoomData,
  type MakeMoveData,
  type ResetGameData,
} from '@shared/schema';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseSocketReturn {
  connectionStatus: ConnectionStatus;
  createRoom: () => void;
  joinRoom: (roomCode: string) => void;
  makeMove: (roomCode: string, cellIndex: number) => void;
  resetGame: (roomCode: string) => void;
  leaveRoom: () => void;
  
  // Event handlers - return cleanup functions
  onRoomCreated: (handler: (data: RoomCreatedResponse) => void) => () => void;
  onJoinRoomResponse: (handler: (data: JoinRoomResponse) => void) => () => void;
  onGameStateUpdate: (handler: (data: GameStateUpdate) => void) => () => void;
  onPlayerDisconnected: (handler: (data: PlayerDisconnectedEvent) => void) => () => void;
  onError: (handler: (data: { message: string }) => void) => () => void;
}

export function useSocket(): UseSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const eventHandlersRef = useRef<{[key: string]: ((data: any) => void)[]}>();

  // Initialize event handlers storage
  if (!eventHandlersRef.current) {
    eventHandlersRef.current = {};
  }

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    // Construct WebSocket URL using the correct protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to:', wsUrl);
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      socketRef.current = null;
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (socketRef.current === null) {
          connect();
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;
        
        // Trigger registered handlers
        const handlers = eventHandlersRef.current?.[type];
        if (handlers) {
          handlers.forEach(handler => handler(payload));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, []);

  // Socket actions
  const createRoom = useCallback(() => {
    const payload: CreateRoomData = {};
    sendMessage('createRoom', payload);
  }, [sendMessage]);

  const joinRoom = useCallback((roomCode: string) => {
    const payload: JoinRoomData = { roomCode: roomCode.toUpperCase() };
    sendMessage('joinRoom', payload);
  }, [sendMessage]);

  const makeMove = useCallback((roomCode: string, cellIndex: number) => {
    const payload: MakeMoveData = { roomCode, cellIndex };
    sendMessage('makeMove', payload);
  }, [sendMessage]);

  const resetGame = useCallback((roomCode: string) => {
    const payload: ResetGameData = { roomCode };
    sendMessage('resetGame', payload);
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage('leaveRoom');
  }, [sendMessage]);

  // Event handler registration
  const registerHandler = useCallback((eventType: string, handler: (data: any) => void) => {
    if (!eventHandlersRef.current) {
      eventHandlersRef.current = {};
    }
    
    if (!eventHandlersRef.current[eventType]) {
      eventHandlersRef.current[eventType] = [];
    }
    
    eventHandlersRef.current[eventType].push(handler);
    
    // Return cleanup function
    return () => {
      if (eventHandlersRef.current?.[eventType]) {
        const index = eventHandlersRef.current[eventType].indexOf(handler);
        if (index > -1) {
          eventHandlersRef.current[eventType].splice(index, 1);
        }
      }
    };
  }, []);

  const onRoomCreated = useCallback((handler: (data: RoomCreatedResponse) => void) => {
    return registerHandler('roomCreated', handler);
  }, [registerHandler]);

  const onJoinRoomResponse = useCallback((handler: (data: JoinRoomResponse) => void) => {
    return registerHandler('joinRoomResponse', handler);
  }, [registerHandler]);

  const onGameStateUpdate = useCallback((handler: (data: GameStateUpdate) => void) => {
    return registerHandler('gameStateUpdate', handler);
  }, [registerHandler]);

  const onPlayerDisconnected = useCallback((handler: (data: PlayerDisconnectedEvent) => void) => {
    return registerHandler('playerDisconnected', handler);
  }, [registerHandler]);

  const onError = useCallback((handler: (data: { message: string }) => void) => {
    return registerHandler('error', handler);
  }, [registerHandler]);

  return {
    connectionStatus,
    createRoom,
    joinRoom,
    makeMove,
    resetGame,
    leaveRoom,
    onRoomCreated,
    onJoinRoomResponse,
    onGameStateUpdate,
    onPlayerDisconnected,
    onError,
  };
}
