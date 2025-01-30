import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PointsDisplay from "./points-display";

interface RewardCardProps {
  reward: {
    id: number;
    name: string;
    description: string;
    pointsCost: number;
    imageUrl: string;
  };
  userPoints?: number;
  isAdmin?: boolean;
}

export default function RewardCard({ reward, userPoints, isAdmin }: RewardCardProps) {
  const { toast } = useToast();

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/transactions"] });
      toast({ title: "Success", description: "Reward redeemed successfully!" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const canRedeem = userPoints !== undefined && userPoints >= reward.pointsCost;

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <img
          src={reward.imageUrl}
          alt={reward.name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardHeader>
        <CardTitle>{reward.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{reward.description}</p>
        <div className="mt-4">
          <PointsDisplay points={reward.pointsCost} size="medium" />
        </div>
      </CardContent>
      {!isAdmin && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => redeemMutation.mutate()}
            disabled={!canRedeem}
          >
            {canRedeem ? "Redeem Reward" : "Insufficient Points"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
