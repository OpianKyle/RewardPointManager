import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@db/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register: registerUser, user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

  // Get referral code from URL if present
  const referralCode = new URLSearchParams(window.location.search).get('ref');

  // Switch to register mode if referral code is present
  useEffect(() => {
    if (referralCode) {
      setMode("register");
    }
  }, [referralCode]);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      // Include referral code in registration data if present
      const submitData = mode === "register" && referralCode 
        ? { ...data, referralCode } 
        : data;

      const result = await (mode === "login" ? login(data) : registerUser(submitData));
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      } else {
        toast({
          title: "Success",
          description: mode === "login" ? "Logged in successfully" : "Registration successful",
        });
        if (user?.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    if (user.isAdmin) {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4 sm:p-8">
      <div className="w-full max-w-xl space-y-8">
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
          <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-gray-900">
            Welcome to OPIAN Rewards
          </h2>
          <p className="text-center text-sm text-gray-600">
            {mode === "login" 
              ? "Sign in to your account to manage your rewards"
              : "Create an account to start earning rewards"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="px-6 py-4">
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
                          autoComplete="email"
                          className="h-10" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {mode === "register" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          className="h-10"
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-10 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    mode === "login" ? "Sign In" : "Create Account"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}