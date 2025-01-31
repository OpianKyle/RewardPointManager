import { useEffect, useCallback, useState } from "react";
import { useUser } from "./use-user";
import { useToast } from "./use-toast";

interface PointsNotification {
  type: "POINTS_ALLOCATION";
  points: number;
  description: string;
  timestamp: string;
}

export function useNotifications() {
  const { user } = useUser();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      try {
        const notification: PointsNotification = JSON.parse(event.data);

        if (notification.type === "POINTS_ALLOCATION" && notification.points !== 0) {
          toast({
            title: "Points Update",
            description: `${notification.points > 0 ? '+' : ''}${notification.points} points - ${notification.description}`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Attempt to reconnect on error
      setTimeout(connect, 5000);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user, toast]);

  useEffect(() => {
    const cleanup = connect();
    return () => cleanup?.();
  }, [connect]);

  return { isConnected: socket?.readyState === WebSocket.OPEN };
}