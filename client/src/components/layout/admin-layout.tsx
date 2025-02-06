import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useUser();
  const [location, navigate] = useLocation();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Poll for notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications/poll"],
    refetchInterval: 4000,
  });

  // Set notification indicator when new notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      setHasNewNotifications(true);
    }
  }, [notifications]);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Customers", href: "/admin/customers" },
    { label: "Products", href: "/admin/products" },
    { label: "Rewards", href: "/admin/rewards" },
    { label: "Admin Management", href: "/admin/manage-users" },
    { label: "Action Logs", href: "/admin/logs" },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar className="border-r">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <img 
              src="/Assets/opian-rewards-logo (R).png" 
              alt="OPIAN Rewards"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = '/logo-fallback.png';
              }}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setHasNewNotifications(false)}
                >
                  <Bell className="h-5 w-5" />
                  {hasNewNotifications && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Notifications</h4>
                  <div className="space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map((notification: any, index: number) => (
                        <div
                          key={index}
                          className="p-2 rounded-lg bg-muted text-sm"
                        >
                          {notification.type === "CASH_REDEMPTION" && (
                            <p className="font-medium text-primary">
                              Cash Redemption: {notification.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No new notifications
                      </p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="px-3 py-4 flex-1 overflow-y-auto">
            <h2 className="mb-2 px-4 text-lg font-semibold">Admin Portal</h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.href}
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate(item.href)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="p-4 border-t mt-auto">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Sidebar>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}