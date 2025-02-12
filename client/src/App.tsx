import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNotifications } from "@/hooks/use-notifications";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCustomers from "@/pages/admin/customers";
import AdminRewards from "@/pages/admin/rewards";
import AdminLayout from "@/components/layout/admin-layout";
import ManageUsers from "@/pages/admin/manage-users";
import AdminLogs from "@/pages/admin/logs";
import AdminProducts from "@/pages/admin/products";
import CashRedemptions from "@/pages/admin/cash-redemptions";

// Customer pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerRewards from "@/pages/customer/rewards";
import CustomerLayout from "@/components/layout/customer-layout";
import ReferralsPage from "@/pages/customer/referrals";
import ProfilePage from "@/pages/customer/profile";

import { Component, ErrorInfo, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button
              className="px-4 py-2 bg-primary text-white rounded"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/auth';
              }}
            >
              Return to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function AuthRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useUser();

  if (isLoading) return <Loading />;

  // Only redirect if we have a valid user
  if (user && user.id) {
    return <Redirect to={user.isAdmin ? "/admin" : "/dashboard"} />;
  }

  return <Component {...rest} />;
}

function PrivateRoute({ component: Component, admin = false, ...rest }: any) {
  const { user, isLoading } = useUser();

  if (isLoading) return <Loading />;

  // If no user or the user object is invalid, redirect to auth
  if (!user || !user.id) {
    return <Redirect to="/auth" />;
  }

  // Check admin access
  if (admin && !user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  if (!admin && user.isAdmin) {
    return <Redirect to="/admin" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useUser();
  useNotifications();

  if (isLoading) return <Loading />;

  if (window.location.pathname === "/") {
    return <Redirect to={user ? (user.isAdmin ? "/admin" : "/dashboard") : "/auth"} />;
  }

  return (
    <SidebarProvider>
      <ErrorBoundary>
        <Switch>
          {/* Auth Route */}
          <Route path="/auth">
            <AuthRoute component={AuthPage} />
          </Route>

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
          <Route path="/admin/products">
            <AdminLayout>
              <PrivateRoute component={AdminProducts} admin />
            </AdminLayout>
          </Route>
          <Route path="/admin/rewards">
            <AdminLayout>
              <PrivateRoute component={AdminRewards} admin />
            </AdminLayout>
          </Route>
          <Route path="/admin/cash-redemptions">
            <AdminLayout>
              <PrivateRoute component={CashRedemptions} admin />
            </AdminLayout>
          </Route>
          <Route path="/admin/manage-users">
            <AdminLayout>
              <PrivateRoute component={ManageUsers} admin />
            </AdminLayout>
          </Route>
          <Route path="/admin/logs">
            <AdminLayout>
              <PrivateRoute component={AdminLogs} admin />
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
          <Route path="/referrals">
            <CustomerLayout>
              <PrivateRoute component={ReferralsPage} />
            </CustomerLayout>
          </Route>
          <Route path="/profile">
            <CustomerLayout>
              <PrivateRoute component={ProfilePage} />
            </CustomerLayout>
          </Route>

          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;