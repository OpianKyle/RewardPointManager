import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { Home, Gift, Users, User } from "lucide-react";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useUser();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: <Home className="h-4 w-4 mr-2" /> },
    { label: "Rewards", href: "/rewards", icon: <Gift className="h-4 w-4 mr-2" /> },
    { label: "Referrals", href: "/referrals", icon: <Users className="h-4 w-4 mr-2" /> },
    { label: "Profile", href: "/profile", icon: <User className="h-4 w-4 mr-2" /> },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-[#1b75bc]/10 to-[#1b75bc]/5">
      <Sidebar className="border-r backdrop-blur-sm bg-white/70">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b bg-white/80 backdrop-blur-sm">
            <img 
              src="/Assets/opian-rewards-logo (R).png" 
              alt="OPIAN Rewards"
              className="h-8 w-auto object-contain mx-auto"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = '/logo-fallback.png';
              }}
            />
          </div>
          <div className="px-3 py-4 flex-1 overflow-y-auto">
            <h2 className="mb-2 px-4 text-lg font-semibold text-[#1b75bc]">Rewards Portal</h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.href}
                  variant={location === item.href ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    location === item.href 
                      ? "bg-[#1b75bc]/10 text-[#1b75bc] hover:bg-[#1b75bc]/20"
                      : "hover:bg-[#1b75bc]/5"
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="p-4 border-t mt-auto bg-white/80 backdrop-blur-sm">
            <Button variant="outline" className="w-full hover:bg-[#1b75bc]/5" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Sidebar>
      <main className="flex-1 p-8 overflow-y-auto backdrop-blur-[2px] bg-white/50">{children}</main>
    </div>
  );
}