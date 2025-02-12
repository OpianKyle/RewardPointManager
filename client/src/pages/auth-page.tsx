import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Schema definitions remain unchanged
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { loginMutation, registerMutation, user, isLoading } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Handle referral code from URL
  useEffect(() => {
    const referralCode = new URLSearchParams(window.location.search).get('ref');
    if (referralCode) {
      setMode("register");
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.isAdmin ? "/admin" : "/dashboard");
    }
  }, [user, isLoading, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
      });
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    try {
      const referralCode = new URLSearchParams(window.location.search).get('ref');
      await registerMutation.mutateAsync({
        ...data,
        referral_code: referralCode || undefined,
      });
      toast({
        title: "Success",
        description: "Registration successful",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register",
      });
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-2xl space-y-8">
          <div className="flex flex-col items-center space-y-2">
            <img
              src="/Assets/opian-rewards-logo (R).png"
              alt="OPIAN Rewards"
              className="h-12 w-auto object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = '/logo-fallback.png';
              }}
            />
            <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-white">
              Welcome to OPIAN Rewards
            </h2>
            <p className="text-center text-sm text-[#43EB3E]">
              {mode === "login"
                ? "Sign in to your account to manage your rewards"
                : "Create an account to start earning rewards"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "register")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="px-8 py-6">
              {mode === "login" ? (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="h-10 text-white bg-[#011d3d] border-[#022b5c]" />
                          </FormControl>
                          <FormMessage className="text-[#43EB3E]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className="h-10 text-white bg-[#011d3d] border-[#022b5c]"
                            />
                          </FormControl>
                          <FormMessage className="text-[#43EB3E]" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-10 font-semibold bg-[#43eb3e] text-white hover:opacity-90 transition-opacity"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="h-10 text-white bg-[#011d3d] border-[#022b5c]" />
                          </FormControl>
                          <FormMessage className="text-[#43EB3E]" />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">First Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-10 text-white bg-[#011d3d] border-[#022b5c]" />
                            </FormControl>
                            <FormMessage className="text-[#43EB3E]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-10 text-white bg-[#011d3d] border-[#022b5c]" />
                            </FormControl>
                            <FormMessage className="text-[#43EB3E]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" className="h-10 text-white bg-[#011d3d] border-[#022b5c]" />
                          </FormControl>
                          <FormMessage className="text-[#43EB3E]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className="h-10 text-white bg-[#011d3d] border-[#022b5c]"
                            />
                          </FormControl>
                          <FormMessage className="text-[#43EB3E]" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-10 font-semibold bg-[#43eb3e] text-white hover:opacity-90 transition-opacity"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div
        className="hidden lg:block flex-1"
        style={{
          backgroundImage: 'url("/Assets/oracle-hero-slider-03 (1).png")',
          backgroundSize: 'cover',
          backgroundPosition: 'left',
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '100%',
          zIndex: 0
        }}
      />
    </div>
  );
}