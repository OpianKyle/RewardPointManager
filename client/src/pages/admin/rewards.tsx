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
  type?: "CASH" | "STANDARD";
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
      type: "STANDARD" as "CASH" | "STANDARD",
    },
  });

  const editForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      pointsCost: 0,
      imageUrl: "",
      type: "STANDARD" as "CASH" | "STANDARD",
    },
  });

  const createRewardMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      description: string; 
      pointsCost: number; 
      imageUrl: string;
      type: "CASH" | "STANDARD";
    }) => {
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
    mutationFn: async ({ id, ...data }: { id: number; name: string; description: string; pointsCost: number; imageUrl: string; type: "CASH" | "STANDARD"; }) => {
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
      type: reward.type || "STANDARD",
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
        <h1 className="text-3xl font-bold text-white">Rewards Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#43EB3E] hover:bg-[#3AD936] text-black">
              <Plus className="h-4 w-4 mr-2" />
              Add New Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#011d3d] border border-[#022b5c] text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">Create New Reward</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createRewardMutation.mutate(data))} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Type</label>
                <select 
                  {...form.register("type")} 
                  className="w-full p-2 rounded-md border border-[#022b5c] bg-[#011d3d] text-white focus:ring-2 focus:ring-[#43EB3E] focus:border-transparent"
                >
                  <option value="STANDARD">Standard Reward</option>
                  <option value="CASH">Cash Redemption</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Name</label>
                <Input 
                  {...form.register("name")} 
                  className="bg-[#011d3d] border-[#022b5c] text-white focus:ring-[#43EB3E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Description</label>
                <Textarea 
                  {...form.register("description")} 
                  className="bg-[#011d3d] border-[#022b5c] text-white focus:ring-[#43EB3E] min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Points Cost</label>
                <Input 
                  type="number" 
                  {...form.register("pointsCost")} 
                  className="bg-[#011d3d] border-[#022b5c] text-white focus:ring-[#43EB3E]"
                />
                {form.watch("type") === "CASH" && (
                  <p className="text-sm text-[#43EB3E]">
                    Rand value: R{(Number(form.watch("pointsCost")) * 0.015).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Image URL</label>
                <Input 
                  {...form.register("imageUrl")} 
                  className="bg-[#011d3d] border-[#022b5c] text-white focus:ring-[#43EB3E]"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#43EB3E] hover:bg-[#3AD936] text-black"
              >
                Create Reward
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#011d3d] border border-[#022b5c] text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Edit Reward</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={editForm.handleSubmit((data) => 
              editingReward && updateRewardMutation.mutate({ id: editingReward.id, ...data })
            )} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Type</label>
              <select 
                {...editForm.register("type")} 
                className="w-full p-2 rounded-md border border-[#022b5c] bg-[#011d3d] text-white focus:ring-2 focus:ring-[#43EB3E] focus:border-transparent"
              >
                <option value="STANDARD">Standard Reward</option>
                <option value="CASH">Cash Redemption</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Name</label>
              <Input 
                {...editForm.register("name")} 
                className="bg-[#011d3d] border-[#022b5c] text-white focus:ring-[#43EB3E]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Description</label>
              <Textarea 
                {...editForm.register("description")} 
                className="bg-[#011d3d] border-[#022b5c] text-white focus:ring-[#43EB3E] min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Points Cost</label>
              <Input 
                type="number" 
                {...editForm.register("pointsCost")} 
                className="bg-[#011d3d] border-[#022b5c] text-white focus:ring-[#43EB3E]"
              />
              {editForm.watch("type") === "CASH" && (
                <p className="text-sm text-[#43EB3E]">
                  Rand value: R{(Number(editForm.watch("pointsCost")) * 0.015).toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Image URL</label>
              <Input 
                {...editForm.register("imageUrl")} 
                className="bg-[#011d3d] border-[#022b5c] text-white focus:ring-[#43EB3E]"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#43EB3E] hover:bg-[#3AD936] text-black"
            >
              Update Reward
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id} className="bg-[#011d3d] border-[#022b5c] text-white">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">{reward.name}</CardTitle>
                  {reward.type === "CASH" && (
                    <p className="text-sm text-[#43EB3E]">Cash Redemption</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onEdit(reward)}
                    className="border-[#022b5c] hover:bg-[#022b5c]"
                  >
                    <Pencil className="h-4 w-4 text-white" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onDelete(reward)}
                    className="border-[#022b5c] hover:bg-[#022b5c]"
                  >
                    <Trash className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300 mb-2">{reward.description}</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">{reward.pointsCost} points</p>
                {reward.type === "CASH" && (
                  <p className="text-sm text-[#43EB3E]">
                    (R{(reward.pointsCost * 0.015).toFixed(2)})
                  </p>
                )}
              </div>
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