import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@db/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phoneNumber: user?.phoneNumber || "",
      password: "", // Empty by default, only filled if user wants to change it
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = async (data: any) => {
    // Only include password in the update if it was changed
    const updateData = {
      ...data,
      password: data.password || undefined,
    };
    await updateProfileMutation.mutateAsync(updateData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
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
                    <FormLabel>New Password (leave empty to keep current)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        {...field} 
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
