import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Pencil, UserX, Power, PowerOff, TrendingUp, Plus, Package } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  selectedActivities: z.array(z.number()).optional(),
  posPoints: z.number().min(0).optional(),
});

type UserFormData = z.infer<typeof userSchema>;
type PointsFormData = z.infer<typeof pointsSchema>;

const getTierInfo = (points: number): { name: string; color: string; nextTier?: { name: string; pointsNeeded: number } } => {
  if (points >= 150000) {
    return {
      name: 'Platinum',
      color: 'bg-gradient-to-r from-purple-400 to-gray-300 text-white'
    };
  }
  if (points >= 100000) {
    return {
      name: 'Gold',
      color: 'bg-yellow-500 text-white',
      nextTier: { name: 'Platinum', pointsNeeded: 150000 - points }
    };
  }
  if (points >= 50000) {
    return {
      name: 'Purple',
      color: 'bg-purple-500 text-white',
      nextTier: { name: 'Gold', pointsNeeded: 100000 - points }
    };
  }
  if (points >= 10000) {
    return {
      name: 'Silver',
      color: 'bg-gray-400 text-white',
      nextTier: { name: 'Purple', pointsNeeded: 50000 - points }
    };
  }
  return {
    name: 'Bronze',
    color: 'bg-amber-600 text-white',
    nextTier: { name: 'Silver', pointsNeeded: 10000 - points }
  };
};

export default function AdminCustomers() {
  const { data: customers } = useQuery({
    queryKey: ["/api/admin/customers"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    select: (data) => {
      return data?.map((product: any) => ({
        ...product,
        activities: product.activities || []
      }));
    }
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
      selectedActivities: [],
      posPoints: 0,
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

  const assignProductMutation = useMutation({
    mutationFn: async ({ productId, userId }: { productId: number; userId: number }) => {
      const res = await fetch(`/api/products/${productId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "Product assigned successfully" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const unassignProductMutation = useMutation({
    mutationFn: async ({ productId, userId }: { productId: number; userId: number }) => {
      const res = await fetch(`/api/products/${productId}/unassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "Product unassigned successfully" });
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
                <TableHead>Tier</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Products</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((customer: any) => {
                const tierInfo = getTierInfo(customer.points);
                return (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.firstName} {customer.lastName}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={`${tierInfo.color}`}>
                          {tierInfo.name}
                        </Badge>
                        {tierInfo.nextTier && (
                          <p className="text-xs text-muted-foreground">
                            {tierInfo.nextTier.pointsNeeded.toLocaleString()} points to {tierInfo.nextTier.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.points.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ScrollArea className="h-[100px]">
                        <div className="space-x-1">
                          {customer.productAssignments?.map((assignment: any) => (
                            <Badge
                              key={assignment.id}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive/20"
                              onClick={() => {
                                if (confirm('Are you sure you want to unassign this product?')) {
                                  unassignProductMutation.mutate({
                                    productId: assignment.product.id,
                                    userId: customer.id
                                  });
                                }
                              }}
                            >
                              {assignment.product.name} ×
                            </Badge>
                          ))}
                          {(!customer.productAssignments || customer.productAssignments.length === 0) && (
                            <span className="text-sm text-muted-foreground">No products assigned</span>
                          )}
                        </div>
                      </ScrollArea>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Package className="h-4 w-4 mr-2" />
                              Assign Product
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Products to {customer.firstName}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4">
                              {products?.map((product: any) => {
                                const isAssigned = customer.productAssignments?.some(
                                  (a: any) => a.product.id === product.id
                                );
                                return (
                                  <div
                                    key={product.id}
                                    className="flex items-center justify-between p-4 rounded-lg border"
                                  >
                                    <div>
                                      <h3 className="font-medium">{product.name}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {product.description}
                                      </p>
                                    </div>
                                    <Button
                                      variant={isAssigned ? "secondary" : "default"}
                                      onClick={() => {
                                        if (isAssigned) {
                                          if (confirm('Are you sure you want to unassign this product?')) {
                                            unassignProductMutation.mutate({
                                              productId: product.id,
                                              userId: customer.id
                                            });
                                          }
                                        } else {
                                          assignProductMutation.mutate({
                                            productId: product.id,
                                            userId: customer.id
                                          });
                                        }
                                      }}
                                    >
                                      {isAssigned ? 'Unassign' : 'Assign'}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Assign Points
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl">
                            <DialogHeader>
                              <DialogTitle>Assign Points to {customer.firstName}</DialogTitle>
                              {(() => {
                                const tierInfo = getTierInfo(customer.points);
                                return (
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge className={`${tierInfo.color}`}>
                                        {tierInfo.name} Tier
                                      </Badge>
                                      <span className="text-sm">
                                        Current Points: {customer.points.toLocaleString()}
                                      </span>
                                    </div>
                                    {tierInfo.nextTier && (
                                      <p className="text-sm text-muted-foreground">
                                        {tierInfo.nextTier.pointsNeeded.toLocaleString()} points needed to reach {tierInfo.nextTier.name} Tier
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left Column - Product Activities */}
                              <div className="space-y-6">
                                <h3 className="text-lg font-semibold">Product Activities</h3>
                                <ScrollArea className="h-[400px] pr-4">
                                  <div className="space-y-4">
                                    {customer.productAssignments?.map((assignment: any) => (
                                      <Accordion type="single" collapsible key={assignment.id}>
                                        <AccordionItem value="activities">
                                          <AccordionTrigger className="p-3 bg-accent/50 rounded-lg hover:no-underline">
                                            <div className="flex justify-between items-center w-full pr-4">
                                              <div className="text-left">
                                                <p className="font-medium">{assignment.product.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {assignment.product.description}
                                                </p>
                                              </div>
                                              {pointsForm.watch("selectedActivities")?.some(id =>
                                                assignment.product.activities?.some((a: any) => a.id === id)
                                              ) && (
                                                <Badge variant="secondary" className="ml-2">
                                                  {assignment.product.activities?.filter((a: any) =>
                                                    pointsForm.watch("selectedActivities")?.includes(a.id)
                                                  ).length} selected
                                                </Badge>
                                              )}
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent>
                                            <div className="space-y-2 pt-2">
                                              {assignment.product.activities?.map((activity: any) => {
                                                const isSystemActivity = activity.type === "SYSTEM_ACTIVATION";
                                                if (isSystemActivity) return null; // Skip system activation activities

                                                const isPremiumOrCard = activity.type === "PREMIUM_PAYMENT" || activity.type === "CARD_BALANCE";
                                                return (
                                                  <div
                                                    key={activity.id}
                                                    className="flex items-center justify-between p-2 pl-6 border rounded-lg"
                                                  >
                                                    <div className="flex items-center space-x-2">
                                                      <input
                                                        type="checkbox"
                                                        id={`activity-${activity.id}`}
                                                        className="w-4 h-4 rounded border-gray-300"
                                                        checked={pointsForm.watch("selectedActivities")?.includes(activity.id)}
                                                        onChange={(e) => {
                                                          const currentSelected = pointsForm.getValues("selectedActivities") || [];
                                                          const currentPoints = pointsForm.getValues("points") || 0;

                                                          if (e.target.checked) {
                                                            pointsForm.setValue("selectedActivities", [...currentSelected, activity.id]);
                                                            if (!isPremiumOrCard) {
                                                              pointsForm.setValue("points", currentPoints + activity.pointsValue);
                                                            }
                                                            const description = `Points for ${activity.type.toLowerCase().replace('_', ' ')} activity`;
                                                            if (!pointsForm.getValues("description")) {
                                                              pointsForm.setValue("description", description);
                                                            }
                                                          } else {
                                                            pointsForm.setValue(
                                                              "selectedActivities",
                                                              currentSelected.filter(id => id !== activity.id)
                                                            );
                                                            if (!isPremiumOrCard) {
                                                              pointsForm.setValue("points", currentPoints - activity.pointsValue);
                                                            }
                                                          }
                                                        }}
                                                      />
                                                      <label
                                                        htmlFor={`activity-${activity.id}`}
                                                        className="text-sm font-medium"
                                                      >
                                                        {activity.type.replace('_', ' ')}
                                                      </label>
                                                    </div>
                                                    {isPremiumOrCard ? (
                                                      <Input
                                                        type="number"
                                                        className="w-32"
                                                        placeholder="Enter points"
                                                        disabled={!pointsForm.watch("selectedActivities")?.includes(activity.id)}
                                                        onChange={(e) => {
                                                          const newValue = parseInt(e.target.value) || 0;
                                                          const currentPoints = pointsForm.getValues("points") || 0;
                                                          const oldValue = activity.currentValue || 0;
                                                          pointsForm.setValue("points", currentPoints - oldValue + newValue);
                                                          activity.currentValue = newValue;
                                                        }}
                                                      />
                                                    ) : (
                                                      <span className="text-sm font-semibold">
                                                        {activity.pointsValue} points
                                                      </span>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    ))}
                                  </div>
                                </ScrollArea>

                                <div className="pt-4 border-t">
                                  <h3 className="text-lg font-semibold mb-4">POS Points Allocation</h3>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">POS Points</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Enter POS points"
                                        onChange={(e) => {
                                          const posPoints = parseInt(e.target.value) || 0;
                                          const currentPoints = pointsForm.getValues("points") || 0;
                                          const oldPosPoints = pointsForm.getValues("posPoints") || 0;
                                          pointsForm.setValue("points", currentPoints - oldPosPoints + posPoints);
                                          pointsForm.setValue("posPoints", posPoints);
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column - Points Summary */}
                              <div className="space-y-6">
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Points Summary</h3>

                                  <div className="space-y-4 bg-accent/20 p-4 rounded-lg">
                                    {customer.productAssignments?.map((assignment: any) => (
                                      <div key={assignment.id}>
                                        {assignment.product.activities
                                          ?.filter((activity: any) => pointsForm.watch("selectedActivities")?.includes(activity.id))
                                          .map((activity: any) => (
                                            <div key={activity.id} className="flex justify-between items-center py-2">
                                              <span className="text-sm">
                                                {assignment.product.name} - {activity.type.replace('_', ' ')}
                                              </span>
                                              <span className="font-medium">
                                                {activity.type === "PREMIUM_PAYMENT" || activity.type === "CARD_BALANCE"
                                                  ? `${activity.currentValue || 0} points`
                                                  : `${activity.pointsValue} points`
                                                }
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    ))}

                                    {pointsForm.watch("posPoints") > 0 && (
                                      <div className="flex justify-between items-center py-2 border-t">
                                        <span className="text-sm">POS Points</span>
                                        <span className="font-medium">{pointsForm.watch("posPoints")} points</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4 border-t border-t-2">
                                      <span className="font-semibold">Total Points</span>
                                      <span className="text-2xl font-bold">
                                        {pointsForm.watch("points")}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label>Description <span className="text-red-500">*</span></label>
                                    <Input
                                      {...pointsForm.register("description")}
                                      placeholder="Enter description for points allocation"
                                    />
                                    {pointsForm.formState.errors.description && (
                                      <p className="text-sm text-red-500">
                                        {pointsForm.formState.errors.description.message}
                                      </p>
                                    )}
                                  </div>

                                  <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={!pointsForm.watch("points") || !pointsForm.watch("description")}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const formData = pointsForm.getValues();
                                      if (!formData.description) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Please provide a description for the points adjustment"
                                        });
                                        return;
                                      }
                                      assignPointsMutation.mutate({
                                        userId: customer.id,
                                        data: {
                                          points: formData.points,
                                          description: formData.description,
                                          selectedActivities: formData.selectedActivities
                                        }
                                      });
                                    }}
                                  >
                                    Assign {pointsForm.watch("points")} Points
                                  </Button>
                                </div>
                              </div>
                            </div>
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}