import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { Express } from "express";

interface NotificationPayload {
  type: "POINTS_ALLOCATION";
  userId: number;
  points: number;
  description: string;
  timestamp: string;
}

const clients = new Map<number, WebSocket>();

export function setupWebSocket(server: Server, app: Express) {
  const wss = new WebSocketServer({ 
    server,
    verifyClient: (info, cb) => {
      // Skip verification for Vite HMR WebSocket connections
      if (info.req.headers['sec-websocket-protocol'] === 'vite-hmr') {
        return cb(true);
      }

      // For all other connections, accept them
      // Session handling will be done in the connection handler
      return cb(true);
    }
  });

  wss.on("connection", (ws: WebSocket, req: any) => {
    try {
      // Get user ID from the session
      const userId = req.session?.passport?.user;

      if (userId) {
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
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  };
}