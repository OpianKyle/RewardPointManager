import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Gift, 
  DollarSign, 
  UserCog,
  ScrollText,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useUser();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { label: "Customers", href: "/admin/customers", icon: <Users className="h-4 w-4 mr-2" /> },
    { label: "Products", href: "/admin/products", icon: <Package className="h-4 w-4 mr-2" /> },
    { label: "Rewards", href: "/admin/rewards", icon: <Gift className="h-4 w-4 mr-2" /> },
    { label: "Cash Redemptions", href: "/admin/cash-redemptions", icon: <DollarSign className="h-4 w-4 mr-2" /> },
    { label: "Admin Management", href: "/admin/manage-users", icon: <UserCog className="h-4 w-4 mr-2" /> },
    { label: "Action Logs", href: "/admin/logs", icon: <ScrollText className="h-4 w-4 mr-2" /> },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        className={cn(
          "border-r fixed inset-y-0 left-0 z-50 w-64 lg:w-72 bg-background",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          "lg:relative lg:translate-x-0",
          !sidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 md:p-6 border-b">
            <img 
              src="/Assets/opian-rewards-logo (R).png" 
              alt="OPIAN Rewards"
              className="h-8 md:h-12 w-auto object-contain mx-auto"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = '/logo-fallback.png';
              }}
            />
          </div>
          <div className="px-2 md:px-3 py-4 flex-1 overflow-y-auto">
            <h2 className="mb-2 px-3 md:px-4 text-base md:text-lg font-semibold text-[#1b75bc]">
              Admin Portal
            </h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.href}
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start text-sm md:text-base capitalize"
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="p-3 md:p-4 border-t mt-auto">
            <Button variant="outline" className="w-full text-sm md:text-base" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </Sidebar>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}