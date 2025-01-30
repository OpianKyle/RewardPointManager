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

  const { toast } = useToast();
  const form = useForm({
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
      // Invalidate both rewards and logs queries
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({ title: "Success", description: "Reward created successfully" });
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

  const onSubmit = form.handleSubmit((data) => {
    createRewardMutation.mutate({
      ...data,
      pointsCost: Number(data.pointsCost),
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rewards Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Reward</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reward</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            isAdmin
          />
        ))}
      </div>
    </div>
  );
}