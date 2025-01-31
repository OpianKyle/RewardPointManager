import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { Express } from "express";
import session from "express-session";
import memorystore from "memorystore";

interface NotificationPayload {
  type: "POINTS_ALLOCATION";
  userId: number;
  points: number;
  description: string;
  timestamp: string;
}

const clients = new Map<number, WebSocket>();

export function setupWebSocket(server: Server, app: Express) {
  const MemoryStore = memorystore(session);
  const sessionParser = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  });

  const wss = new WebSocketServer({ 
    server,
    verifyClient: (info, cb) => {
      // Skip verification for Vite HMR WebSocket connections
      if (info.req.headers['sec-websocket-protocol'] === 'vite-hmr') {
        return cb(true);
      }

      try {
        // Parse session for all other connections
        sessionParser(info.req, {} as any, () => {
          try {
            const userId = (info.req as any).session?.passport?.user;
            if (!userId) {
              return cb(false, 401, 'Unauthorized');
            }
            return cb(true);
          } catch (error) {
            console.error('Session parsing error:', error);
            return cb(false, 500, 'Internal server error');
          }
        });
      } catch (error) {
        console.error('WebSocket verification error:', error);
        return cb(false, 500, 'Internal server error');
      }
    },
    handleProtocols: (protocols: Set<string>) => {
      // Accept vite-hmr protocol for Vite's HMR
      if (protocols.has('vite-hmr')) {
        return 'vite-hmr';
      }
      // Accept our application protocol or return false for standard WebSocket
      return protocols.has('app-protocol') ? 'app-protocol' : false;
    }
  });

  wss.on("connection", (ws: WebSocket, req: any) => {
    try {
      // Skip handling for Vite HMR connections
      if (req.headers['sec-websocket-protocol'] === 'vite-hmr') {
        return;
      }

      // Get user ID from the session
      const userId = req.session?.passport?.user;

      if (userId) {
        // Remove any existing connection for this user
        const existingConnection = clients.get(userId);
        if (existingConnection) {
          existingConnection.close();
          clients.delete(userId);
        }

        // Store the new connection
        clients.set(userId, ws);

        ws.on("close", () => {
          clients.delete(userId);
        });

        ws.on("error", (error) => {
          console.error(`WebSocket error for user ${userId}:`, error);
          clients.delete(userId);
        });

        // Send a test message to verify connection
        ws.send(JSON.stringify({
          type: "POINTS_ALLOCATION",
          userId,
          points: 0,
          description: "Connection established",
          timestamp: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error("Error in WebSocket connection handler:", error);
    }
  });

  // Add error handler for the server
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  return {
    notifyPointsAllocation: (payload: NotificationPayload) => {
      try {
        const client = clients.get(payload.userId);
        if (client?.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  };
}