import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldOff, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";

export default function AdminManagement() {
  const { data: admins } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const res = await fetch("/api/admin/users/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ 
        title: "Success", 
        description: data.message || "Admin status updated successfully" 
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

  const createAdminMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isAdmin: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "Admin user created successfully" });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
            </DialogHeader>
            <form 
              onSubmit={form.handleSubmit((data) => createAdminMutation.mutate(data))} 
              className="space-y-4"
            >
              <div className="space-y-2">
                <label>Username</label>
                <Input {...form.register("username")} />
              </div>
              <div className="space-y-2">
                <label>Password</label>
                <Input type="password" {...form.register("password")} />
              </div>
              <Button type="submit">Create Admin</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Administrators</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins?.map((admin: any) => (
                <TableRow key={admin.id}>
                  <TableCell>{admin.username}</TableCell>
                  <TableCell>
                    {admin.isSuperAdmin ? "Super Admin" : "Admin"}
                  </TableCell>
                  <TableCell>
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {!admin.isSuperAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure? This will permanently remove this admin user.")) {
                            toggleAdminMutation.mutate({
                              userId: admin.id,
                              isAdmin: false,
                            });
                          }
                        }}
                      >
                        <ShieldOff className="h-4 w-4 mr-2" />
                        Remove Admin
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}