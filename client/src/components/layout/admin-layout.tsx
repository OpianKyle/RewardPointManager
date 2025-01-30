import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useUser();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Customers", href: "/admin/customers" },
    { label: "Rewards", href: "/admin/rewards" },
    { label: "Manage Users", href: "/admin/manage-users" },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar>
        <div className="px-3 py-4">
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
        <div className="mt-auto p-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Sidebar>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}