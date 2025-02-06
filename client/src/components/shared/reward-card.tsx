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
    type?: "CASH" | "STANDARD";
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
      const message = reward.type === "CASH" 
        ? `Successfully redeemed R${(reward.pointsCost * 0.015).toFixed(2)}!`
        : "Reward redeemed successfully!";
      toast({ title: "Success", description: message });
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

  const renderValue = () => {
    if (reward.type === "CASH") {
      const randValue = (reward.pointsCost * 0.015).toFixed(2);
      return (
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold">R{randValue}</div>
          <div className="text-sm text-muted-foreground">
            <PointsDisplay points={reward.pointsCost} size="small" />
          </div>
        </div>
      );
    }
    return <PointsDisplay points={reward.pointsCost} size="medium" />;
  };

  return (
    <Card className="overflow-hidden">
      {reward.imageUrl && (
        <div className="aspect-video relative">
          <img
            src={reward.imageUrl}
            alt={reward.name}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle>{reward.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{reward.description}</p>
        <div className="mt-4">
          {renderValue()}
        </div>
      </CardContent>
      {!isAdmin && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => redeemMutation.mutate()}
            disabled={!canRedeem}
          >
            {canRedeem ? `Redeem ${reward.type === "CASH" ? "Cash" : "Reward"}` : "Insufficient Points"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}