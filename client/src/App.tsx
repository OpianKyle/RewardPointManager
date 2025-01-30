import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCustomers from "@/pages/admin/customers";
import AdminRewards from "@/pages/admin/rewards";
import AdminLayout from "@/components/layout/admin-layout";

// Customer pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerRewards from "@/pages/customer/rewards";
import CustomerLayout from "@/components/layout/customer-layout";

function PrivateRoute({ component: Component, admin = false, ...rest }: any) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (admin && !user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  if (!admin && user.isAdmin) {
    return <Redirect to="/admin" />;
  }

  return Component;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <Route path="/admin">
        <AdminLayout>
          <PrivateRoute component={AdminDashboard} admin />
        </AdminLayout>
      </Route>
      <Route path="/admin/customers">
        <AdminLayout>
          <PrivateRoute component={AdminCustomers} admin />
        </AdminLayout>
      </Route>
      <Route path="/admin/rewards">
        <AdminLayout>
          <PrivateRoute component={AdminRewards} admin />
        </AdminLayout>
      </Route>

      {/* Customer Routes */}
      <Route path="/dashboard">
        <CustomerLayout>
          <PrivateRoute component={CustomerDashboard} />
        </CustomerLayout>
      </Route>
      <Route path="/rewards">
        <CustomerLayout>
          <PrivateRoute component={CustomerRewards} />
        </CustomerLayout>
      </Route>

      {/* Redirect root to appropriate dashboard */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
