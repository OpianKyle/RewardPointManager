import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { loginMutation, user, isLoading } = useUser();
  const { toast } = useToast();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = await loginMutation.mutateAsync(data);
      // Redirect based on user type
      navigate(user.isAdmin ? '/admin' : '/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    }
  };

  // Show loading spinner while checking auth status
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-2">
          <img
            src="/Assets/opian-rewards-logo (R).png"
            alt="OPIAN Rewards"
            className="h-12 w-auto mb-4"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.onerror = null;
              img.src = '/logo-fallback.png';
            }}
          />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to OPIAN Rewards</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        disabled={loginMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={loginMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}