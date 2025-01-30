import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export default function AdminCustomers() {
  const { data: customers } = useQuery({
    queryKey: ["/api/admin/customers"],
  });

  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      points: 0,
      description: "",
    },
  });

  const adjustPointsMutation = useMutation({
    mutationFn: async ({ userId, points, description }: any) => {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, points: Number(points), description }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "Success", description: "Points adjusted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    },
  });

  const onSubmit = (userId: number) => form.handleSubmit((data) => {
    adjustPointsMutation.mutate({ 
      userId,
      points: data.points,
      description: data.description
    });
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
                <TableHead>Username</TableHead>
                <TableHead>Current Points</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.username}</TableCell>
                  <TableCell>{customer.points}</TableCell>
                  <TableCell>
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Adjust Points
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adjust Points for {customer.username}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={onSubmit(customer.id)} className="space-y-4">
                          <div className="space-y-2">
                            <label>Points (use negative for deduction)</label>
                            <Input
                              type="number"
                              {...form.register("points")}
                            />
                          </div>
                          <div className="space-y-2">
                            <label>Description</label>
                            <Input {...form.register("description")} />
                          </div>
                          <Button type="submit">Submit</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
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
