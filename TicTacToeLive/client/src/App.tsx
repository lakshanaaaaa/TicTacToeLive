import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useCallback } from "react";
import { useSocket } from "@/hooks/use-socket";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import WaitingRoom from "@/pages/waiting-room";
import Game from "@/pages/game";
import { GamePlayer } from "@shared/schema";

export interface AppState {
  currentView: 'home' | 'waiting' | 'playing';
  roomCode: string;
  playerSymbol: 'X' | 'O' | null;
}

function Router() {
  // Initialize WebSocket at the Router level to persist across page transitions
  const socket = useSocket();
  
  const [appState, setAppState] = useState<AppState>({
    currentView: 'home',
    roomCode: '',
    playerSymbol: null,
  });

  // Memoize updateAppState to prevent recreation on every render
  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);

  // Memoize onViewChange callbacks with stable references
  const handleViewChange = useCallback((
    view: 'home' | 'waiting' | 'playing', 
    roomCode?: string, 
    symbol?: GamePlayer
  ) => {
    updateAppState({ 
      currentView: view, 
      roomCode: roomCode || '', 
      playerSymbol: symbol || null 
    });
  }, [updateAppState]);

  const handleSimpleViewChange = useCallback((view: 'home' | 'waiting' | 'playing') => {
    updateAppState({ currentView: view });
  }, [updateAppState]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-primary-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Tic-Tac-Toe</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Switch>
          {appState.currentView === 'home' && (
            <Route>
              <Home 
                socket={socket}
                onViewChange={handleViewChange}
              />
            </Route>
          )}
          {appState.currentView === 'waiting' && (
            <Route>
              <WaitingRoom 
                socket={socket}
                roomCode={appState.roomCode}
                onViewChange={handleSimpleViewChange}
              />
            </Route>
          )}
          {appState.currentView === 'playing' && (
            <Route>
              <Game 
                socket={socket}
                roomCode={appState.roomCode}
                playerSymbol={appState.playerSymbol}
                onViewChange={handleSimpleViewChange}
              />
            </Route>
          )}
          <Route component={NotFound} />
        </Switch>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Multiplayer Tic-Tac-Toe. Built with Socket.io
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">How to Play</a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
