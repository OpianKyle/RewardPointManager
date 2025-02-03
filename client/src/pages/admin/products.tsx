import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Pencil, Power, PowerOff, UserPlus, UserX, Activity } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  pointsAllocation: z.number().min(0, "Points allocation must be positive"),
});

type ProductFormData = z.infer<typeof productSchema>;

const activitySchema = z.object({
  activityType: z.enum(["ACTIVATE", "TIMELINE", "RENEWAL", "UPGRADE", "POS"]),
  pointsAllocation: z.number().min(0, "Points allocation must be positive"),
  isEnabled: z.boolean().default(true),
});

type ActivityFormData = z.infer<typeof activitySchema>;

export default function ProductManagement() {
  const { data: products = [], refetch } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/admin/customers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { toast } = useToast();
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsAllocation: 0,
    },
  });

  const editForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsAllocation: 0,
    },
  });

    const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isActivityEditOpen, setIsActivityEditOpen] = useState(false);

  const activityForm = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activityType: "ACTIVATE",
      pointsAllocation: 0,
      isEnabled: true,
    },
  });

  const editActivityForm = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activityType: "ACTIVATE",
      pointsAllocation: 0,
      isEnabled: true,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product created successfully" });
      form.reset();
      setIsCreateOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & ProductFormData) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product updated successfully" });
      editForm.reset();
      setIsEditOpen(false);
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await fetch(`/api/products/${id}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product status updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const assignCustomerMutation = useMutation({
    mutationFn: async ({ productId, userId }: { productId: number; userId: number }) => {
      console.log('Assigning customer:', { productId, userId });
      try {
        const res = await fetch(`/api/products/${productId}/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Assignment failed:', errorText);
          throw new Error(errorText);
        }

        const data = await res.json();
        console.log('Assignment response:', data);
        return data;
      } catch (error) {
        console.error('Assignment error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "Success", description: "Customer assigned successfully" });
    },
    onError: (error: Error) => {
      console.error('Assignment error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const unassignCustomerMutation = useMutation({
    mutationFn: async ({ productId, userId }: { productId: number; userId: number }) => {
      try {
        const res = await fetch(`/api/products/${productId}/unassign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Unassignment failed:', errorText);
          throw new Error(errorText);
        }

        const data = await res.json();
        console.log('Unassignment response:', data);
        return data;
      } catch (error) {
        console.error('Unassignment error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "Success", description: "Customer unassigned successfully" });
    },
    onError: (error: Error) => {
      console.error('Unassignment error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

    const { data: activities = [] } = useQuery({
    queryKey: ["/api/products", selectedProduct?.id, "activities"],
    queryFn: async () => {
      if (!selectedProduct?.id) return [];
      const response = await fetch(`/api/products/${selectedProduct.id}/activities`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    enabled: !!selectedProduct?.id,
  });

    const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const res = await fetch(`/api/products/${selectedProduct.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProduct?.id, "activities"] });
      toast({ title: "Success", description: "Activity created successfully" });
      activityForm.reset();
      setIsActivityOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<ActivityFormData>) => {
      const res = await fetch(`/api/products/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", selectedProduct?.id, "activities"] });
      toast({ title: "Success", description: "Activity updated successfully" });
      setIsActivityEditOpen(false);
      setSelectedActivity(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const completeActivityMutation = useMutation({
    mutationFn: async ({ activityId, userId, customPoints }: { activityId: number; userId: number; customPoints?: number }) => {
      const res = await fetch(`/api/products/activities/${activityId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, customPoints }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "Success", description: "Activity completed and points awarded successfully" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const isCustomerAssigned = (customer: any, productId: number) => {
    return customer.productAssignments?.some(
      (assignment: any) => assignment.productId === productId
    );
  };

  const onEdit = (product: any) => {
    setEditingProduct(product);
    editForm.reset({
      name: product.name,
      description: product.description,
      pointsAllocation: product.pointsAllocation,
    });
    setIsEditOpen(true);
  };

  const onEditActivity = (activity: any) => {
    setSelectedActivity(activity);
    editActivityForm.reset({
      activityType: activity.activityType,
      pointsAllocation: activity.pointsAllocation,
      isEnabled: activity.isEnabled,
    });
    setIsActivityEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((data) => createProductMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label>Name</label>
                <Input {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <label>Description</label>
                <Textarea {...form.register("description")} />
              </div>
              <div className="space-y-2">
                <label>Points Allocation</label>
                <Input
                  type="number"
                  {...form.register("pointsAllocation", { valueAsNumber: true })}
                />
              </div>
              <Button type="submit">Create Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              editingProduct && updateProductMutation.mutate({ id: editingProduct.id, ...data })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label>Name</label>
              <Input {...editForm.register("name")} />
            </div>
            <div className="space-y-2">
              <label>Description</label>
              <Textarea {...editForm.register("description")} />
            </div>
            <div className="space-y-2">
              <label>Points Allocation</label>
              <Input
                type="number"
                {...editForm.register("pointsAllocation", { valueAsNumber: true })}
              />
            </div>
            <Button type="submit">Update Product</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Points Allocation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{product.pointsAllocation}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(product)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(
                            product.isEnabled
                              ? "Are you sure you want to disable this product?"
                              : "Are you sure you want to enable this product?"
                          )) {
                            toggleStatusMutation.mutate({
                              id: product.id,
                              enabled: !product.isEnabled,
                            });
                          }
                        }}
                      >
                        {product.isEnabled ? (
                          <PowerOff className="h-4 w-4 mr-2" />
                        ) : (
                          <Power className="h-4 w-4 mr-2" />
                        )}
                        {product.isEnabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Manage Assignments
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Customer Assignments for {product.name}</DialogTitle>
                            <DialogDescription>
                              Assign or unassign customers to this product. Assigned customers will receive points based on the product's allocation.
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                              {customers.map((customer: any) => {
                                const assigned = isCustomerAssigned(customer, product.id);
                                return (
                                  <div key={customer.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-lg">
                                    <div>
                                      <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                                      {assigned && (
                                        <Badge variant="secondary" className="mt-1">
                                          Assigned
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      variant={assigned ? "destructive" : "outline"}
                                      size="sm"
                                      onClick={() => {
                                        if (assigned) {
                                          unassignCustomerMutation.mutate({
                                            productId: product.id,
                                            userId: customer.id,
                                          });
                                        } else {
                                          assignCustomerMutation.mutate({
                                            productId: product.id,
                                            userId: customer.id,
                                          });
                                        }
                                      }}
                                    >
                                      {assigned ? (
                                        <>
                                          <UserX className="h-4 w-4 mr-2" />
                                          Unassign
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="h-4 w-4 mr-2" />
                                          Assign
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsActivityOpen(true);
                            }}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Manage Activities
                          </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Activities for {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Configure activities and their point values for this product
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Activity Creation Form */}
            <form
              onSubmit={activityForm.handleSubmit((data) => createActivityMutation.mutate(data))}
              className="space-y-4 border-b pb-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Activity Type</label>
                  <Select
                    onValueChange={(value) => activityForm.setValue("activityType", value as any)}
                    defaultValue={activityForm.getValues("activityType")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVATE">Activate</SelectItem>
                      <SelectItem value="TIMELINE">Timeline</SelectItem>
                      <SelectItem value="RENEWAL">Renewal</SelectItem>
                      <SelectItem value="UPGRADE">Upgrade</SelectItem>
                      <SelectItem value="POS">Point of Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label>Points Allocation</label>
                  <Input
                    type="number"
                    {...activityForm.register("pointsAllocation", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <Button type="submit">Add Activity</Button>
            </form>

            {/* Activities List */}
            <div className="space-y-4">
              <h3 className="font-semibold">Configured Activities</h3>
              {activities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{activity.activityType}</p>
                    <p className="text-sm text-muted-foreground">
                      Points: {activity.pointsAllocation}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditActivity(activity)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isActivityEditOpen} onOpenChange={setIsActivityEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editActivityForm.handleSubmit((data) =>
              selectedActivity && updateActivityMutation.mutate({ id: selectedActivity.id, ...data })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label>Activity Type</label>
              <Input disabled value={selectedActivity?.activityType || ''} />
            </div>
            <div className="space-y-2">
              <label>Points Allocation</label>
              <Input
                type="number"
                {...editActivityForm.register("pointsAllocation", { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEnabled"
                checked={editActivityForm.watch("isEnabled")}
                onCheckedChange={(checked) => editActivityForm.setValue("isEnabled", !!checked)}
              />
              <label htmlFor="isEnabled">Enabled</label>
            </div>
            <Button type="submit">Update Activity</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Activities for {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {activities.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div>
                    <p className="font-medium">{activity.activityType}</p>
                    <p className="text-sm text-muted-foreground">Default Points: {activity.pointsAllocation}</p>
                  </div>
                  <div className="space-x-2">
                    <Input
                      type="number"
                      className="w-24"
                      placeholder="Custom points"
                      onChange={(e) => {
                        const customPoints = parseInt(e.target.value);
                        // Store custom points in state if needed
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const customPoints = parseInt(
                          (document.querySelector(`input[data-activity="${activity.id}"]`) as HTMLInputElement)?.value
                        );
                        completeActivityMutation.mutate({
                          activityId: activity.id,
                          userId: customer.id,
                          customPoints: isNaN(customPoints) ? undefined : customPoints,
                        });
                      }}
                    >
                      Complete Activity
                    </Button>
                  </div>
                </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}