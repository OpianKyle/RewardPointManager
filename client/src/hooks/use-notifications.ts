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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000;

  const connect = useCallback(() => {
    if (!user) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`, ['app-protocol']);

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

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setReconnectAttempts(0); // Reset reconnect attempts on successful connection
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);

        // Don't attempt to reconnect if it was a normal closure or we've exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts(prev => prev + 1);
          setTimeout(connect, reconnectDelay);
        }
      };

      setSocket(ws);

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'User logout or component unmount');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      if (reconnectAttempts < maxReconnectAttempts) {
        setReconnectAttempts(prev => prev + 1);
        setTimeout(connect, reconnectDelay);
      }
    }
  }, [user, toast, reconnectAttempts]);

  useEffect(() => {
    const cleanup = connect();
    return () => cleanup?.();
  }, [connect]);

  return { 
    isConnected: socket?.readyState === WebSocket.OPEN,
    reconnectAttempts 
  };
}