import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const activityTypes = ["ACTIVATE", "TIMELINE", "RENEWAL", "UPGRADE", "POS"] as const;

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  activities: z.array(z.object({
    type: z.enum(activityTypes),
    pointsValue: z.number().min(0, "Points value must be positive"),
  })),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductManagement() {
  const { data: products = [], refetch } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
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
      activities: activityTypes.map(type => ({ type, pointsValue: 0 })),
    },
  });

  const editForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      activities: activityTypes.map(type => ({ type, pointsValue: 0 })),
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

  const onEdit = (product: any) => {
    setEditingProduct(product);
    editForm.reset({
      name: product.name,
      description: product.description,
      activities: product.activities,
    });
    setIsEditOpen(true);
  };

  const renderActivitiesForm = (formContext: any, isEdit: boolean = false) => (
    <div className="space-y-4">
      {activityTypes.map((type, index) => (
        <div key={type} className="grid grid-cols-2 gap-4 items-center">
          <label className="font-medium">{type} Points:</label>
          <Input
            type="number"
            {...formContext.register(`activities.${index}.pointsValue`, { valueAsNumber: true })}
          />
        </div>
      ))}
    </div>
  );

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
          <DialogContent className="max-w-md">
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
                <Input {...form.register("description")} />
              </div>
              <Tabs defaultValue="activities">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="activities">Activity Points</TabsTrigger>
                </TabsList>
                <TabsContent value="activities">
                  {renderActivitiesForm(form)}
                </TabsContent>
              </Tabs>
              <Button type="submit">Create Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
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
              <Input {...editForm.register("description")} />
            </div>
            <Tabs defaultValue="activities">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="activities">Activity Points</TabsTrigger>
              </TabsList>
              <TabsContent value="activities">
                {renderActivitiesForm(editForm, true)}
              </TabsContent>
            </Tabs>
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
                <TableHead>Activities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>
                    <ScrollArea className="h-20">
                      {product.activities?.map((activity: any) => (
                        <div key={activity.type} className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline">{activity.type}</Badge>
                          <span>{activity.pointsValue} points</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </TableCell>
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