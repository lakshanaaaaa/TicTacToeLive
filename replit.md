# Tic-Tac-Toe Multiplayer Game

## Overview

This is a real-time multiplayer Tic-Tac-Toe game built with React, Express, and WebSockets. Players can create game rooms, share room codes with friends, and play against each other in real-time. The application features a modern UI built with shadcn/ui components and Tailwind CSS, with WebSocket-based communication for instant game state updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for the UI layer
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query for server state management
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens

**Component Structure:**
- Page-based routing with three main views: Home, Waiting Room, and Game
- Shared UI components from shadcn/ui for consistent design
- Custom game components (GameResultModal) for game-specific UI
- Toast notifications for user feedback

**State Management:**
- Local React state for view management and app-level state
- Custom WebSocket hook (`useSocket`) for real-time communication
- Event-driven architecture with subscription-based socket event handlers

### Backend Architecture

**Technology Stack:**
- Express.js HTTP server
- WebSocket server (ws library) for real-time communication
- TypeScript with ES modules
- In-memory storage implementation (MemStorage class)

**Server Design Patterns:**
- WebSocket connections managed on dedicated `/ws` path (separate from Vite HMR)
- Socket-to-player mapping for connection tracking
- Message-based protocol with typed schemas (create room, join room, make move, reset game)
- Game logic separated into pure functions for winner detection and move validation

**Game Logic:**
- Board represented as array of 9 cells (3x3 grid)
- Winner detection using predefined winning combinations
- Turn-based gameplay with player symbol assignment (X/O)
- Game states: waiting, playing, finished

### Data Storage

**Current Implementation:**
- In-memory storage (`MemStorage` class) for development/demo purposes
- Stores game rooms and player connections in Map structures
- No persistence - data lost on server restart

**Database Configuration (Drizzle ORM):**
- Configured for PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts`
- Migrations output to `./migrations` directory
- Connection via `DATABASE_URL` environment variable
- Note: Database setup present but not actively used for game state

### External Dependencies

**UI Component Libraries:**
- Radix UI primitives for accessible component foundations
- shadcn/ui for pre-built, customizable components
- class-variance-authority for component variant management
- Tailwind CSS with custom theme configuration

**Database & ORM:**
- Drizzle ORM configured for PostgreSQL
- Neon Database serverless driver (`@neondatabase/serverless`)
- drizzle-zod for schema validation integration

**Real-time Communication:**
- WebSocket (ws) for bidirectional client-server communication
- Custom protocol with Zod schema validation for type safety

**Form & Data Handling:**
- React Hook Form with Zod resolvers for form validation
- date-fns for date manipulation

**Development Tools:**
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal)
- esbuild for production server bundling
- tsx for TypeScript execution in development

**Session Management:**
- connect-pg-simple configured for PostgreSQL session store (not actively used)