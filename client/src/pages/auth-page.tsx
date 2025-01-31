import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@db/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register: registerUser, user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

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
      console.log("Attempting auth:", mode, data.email);
      const result = await (mode === "login" ? login(data) : registerUser(data));
      if (!result.ok) {
        console.error("Auth error:", result.message);
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
        // Redirect based on user role
        if (user?.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already logged in
  if (user) {
    if (user.isAdmin) {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-3xl font-bold text-center">
            Reward Points System
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="text-lg py-3">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-lg py-3">Register</TabsTrigger>
            </TabsList>
            <TabsContent value={mode}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" autoComplete="email" className="h-12 text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {mode === "register" && (
                    <>
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">First Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-12 text-lg" />
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
                            <FormLabel className="text-base">Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-12 text-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" className="h-12 text-lg" />
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
                        <FormLabel className="text-base">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            {...field} 
                            className="h-12 text-lg"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-semibold mt-8" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    {mode === "login" ? "Login" : "Register"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}