import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Pencil, UserX, Power, PowerOff, TrendingUp } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  password: z.string().optional(),
});

const pointsSchema = z.object({
  points: z.number().min(1, "Points must be greater than 0"),
  description: z.string().min(1, "Description is required"),
});

type UserFormData = z.infer<typeof userSchema>;
type PointsFormData = z.infer<typeof pointsSchema>;

export default function AdminCustomers() {
  const { data: customers } = useQuery({
    queryKey: ["/api/admin/customers"],
  });

  const { toast } = useToast();
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
    },
  });

  const pointsForm = useForm<PointsFormData>({
    resolver: zodResolver(pointsSchema),
    defaultValues: {
      points: 0,
      description: "",
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number, data: UserFormData }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "User updated successfully" });
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

  const assignPointsMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number, data: PointsFormData }) => {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          points: data.points,
          description: data.description,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "Points assigned successfully" });
      pointsForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, enabled }: { userId: number; enabled: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "User status updated successfully" });
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
      <h1 className="text-3xl font-bold">Customer Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.firstName} {customer.lastName}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phoneNumber}</TableCell>
                  <TableCell>{customer.points}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      customer.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Assign Points
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Points to {customer.firstName}</DialogTitle>
                          </DialogHeader>
                          <form 
                            onSubmit={pointsForm.handleSubmit((data) => 
                              assignPointsMutation.mutate({ userId: customer.id, data })
                            )} 
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <label>Points</label>
                              <Input 
                                type="number" 
                                {...pointsForm.register("points", { valueAsNumber: true })} 
                              />
                            </div>
                            <div className="space-y-2">
                              <label>Description</label>
                              <Input {...pointsForm.register("description")} />
                            </div>
                            <Button type="submit">Assign Points</Button>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Customer</DialogTitle>
                          </DialogHeader>
                          <form 
                            onSubmit={form.handleSubmit((data) => 
                              updateUserMutation.mutate({ userId: customer.id, data })
                            )} 
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <label>Email</label>
                              <Input {...form.register("email")} defaultValue={customer.email} />
                            </div>
                            <div className="space-y-2">
                              <label>First Name</label>
                              <Input {...form.register("firstName")} defaultValue={customer.firstName} />
                            </div>
                            <div className="space-y-2">
                              <label>Last Name</label>
                              <Input {...form.register("lastName")} defaultValue={customer.lastName} />
                            </div>
                            <div className="space-y-2">
                              <label>Phone Number</label>
                              <Input {...form.register("phoneNumber")} defaultValue={customer.phoneNumber} />
                            </div>
                            <div className="space-y-2">
                              <label>New Password (leave empty to keep current)</label>
                              <Input type="password" {...form.register("password")} />
                            </div>
                            <Button type="submit">Update Customer</Button>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(
                            customer.isEnabled
                              ? "Are you sure you want to disable this user?"
                              : "Are you sure you want to enable this user?"
                          )) {
                            toggleUserStatusMutation.mutate({
                              userId: customer.id,
                              enabled: !customer.isEnabled,
                            });
                          }
                        }}
                      >
                        {customer.isEnabled ? (
                          <PowerOff className="h-4 w-4 mr-2" />
                        ) : (
                          <Power className="h-4 w-4 mr-2" />
                        )}
                        {customer.isEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
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