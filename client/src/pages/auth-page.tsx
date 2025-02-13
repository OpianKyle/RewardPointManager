import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginMutation, user, isLoading } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    navigate(user.isAdmin ? '/admin' : '/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const user = await loginMutation.mutateAsync({
        email,
        password
      });

      toast({
        title: "Success",
        description: "Login successful",
      });

      navigate(user.isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      setError("Invalid email or password");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid email or password",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img
            src="/Assets/opian-rewards-logo (R).png"
            alt="Logo"
            className="h-12 w-auto"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.onerror = null;
              img.src = '/logo-fallback.png';
            }}
          />
          <h2 className="mt-6 text-2xl font-semibold">Welcome Back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </div>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}