import { useEffect, useCallback } from "react";
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

  const pollNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/poll');
      if (!response.ok) return;

      const notifications: PointsNotification[] = await response.json();

      notifications.forEach(notification => {
        if (notification.type === "POINTS_ALLOCATION" && notification.points !== 0) {
          toast({
            title: "Points Update",
            description: `${notification.points > 0 ? '+' : ''}${notification.points} points - ${notification.description}`,
            duration: 5000,
            className: "bg-background border-border",
          });
        }
      });
    } catch (error) {
      console.error('Error polling notifications:', error);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;

    // Initial poll
    pollNotifications();

    // Set up polling interval (every 5 seconds)
    const intervalId = setInterval(pollNotifications, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollNotifications]);
}