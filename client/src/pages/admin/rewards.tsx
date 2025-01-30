import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import RewardCard from "@/components/shared/reward-card";
import { useState } from "react";
import { Plus, Pencil, Trash } from "lucide-react";

type Reward = {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  available: boolean;
  createdAt: string;
};

export default function AdminRewards() {
  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      pointsCost: 0,
      imageUrl: "",
    },
  });

  const editForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      pointsCost: 0,
      imageUrl: "",
    },
  });

  const createRewardMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; pointsCost: number; imageUrl: string }) => {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "Reward created successfully" });
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

  const updateRewardMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name: string; description: string; pointsCost: number; imageUrl: string }) => {
      const res = await fetch(`/api/rewards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "Reward updated successfully" });
      editForm.reset();
      setIsEditOpen(false);
      setEditingReward(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/rewards/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "Reward deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onEdit = (reward: Reward) => {
    setEditingReward(reward);
    editForm.reset({
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      imageUrl: reward.imageUrl,
    });
    setIsEditOpen(true);
  };

  const onDelete = (reward: Reward) => {
    if (confirm(`Are you sure you want to delete ${reward.name}?`)) {
      deleteRewardMutation.mutate(reward.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rewards Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Reward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reward</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createRewardMutation.mutate(data))} className="space-y-4">
              <div className="space-y-2">
                <label>Name</label>
                <Input {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <label>Description</label>
                <Textarea {...form.register("description")} />
              </div>
              <div className="space-y-2">
                <label>Points Cost</label>
                <Input type="number" {...form.register("pointsCost")} />
              </div>
              <div className="space-y-2">
                <label>Image URL</label>
                <Input {...form.register("imageUrl")} />
              </div>
              <Button type="submit">Create Reward</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reward</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={editForm.handleSubmit((data) => 
              editingReward && updateRewardMutation.mutate({ id: editingReward.id, ...data })
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
              <label>Points Cost</label>
              <Input type="number" {...editForm.register("pointsCost")} />
            </div>
            <div className="space-y-2">
              <label>Image URL</label>
              <Input {...editForm.register("imageUrl")} />
            </div>
            <Button type="submit">Update Reward</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{reward.name}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onEdit(reward)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onDelete(reward)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
              <p className="font-semibold">{reward.pointsCost} points</p>
              {reward.imageUrl && (
                <img 
                  src={reward.imageUrl} 
                  alt={reward.name}
                  className="mt-2 rounded-md w-full h-32 object-cover"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}