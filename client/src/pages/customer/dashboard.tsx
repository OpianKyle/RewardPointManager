import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import PointsDisplay from "@/components/shared/points-display";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import ReferralSection from "@/components/shared/referral-section";
import { formatTransactionType } from "@/lib/utils";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  points: number;
}

interface Transaction {
  id: number;
  points: number;
  description: string;
  createdAt: string;
  type?: string; // Added type property to Transaction interface
}

const getTierInfo = (points: number): { name: string; color: string; nextTier?: { name: string; pointsNeeded: number } } => {
  if (points >= 150000) {
    return {
      name: "Platinum",
      color: "bg-gradient-to-r from-purple-400 to-gray-300 text-white",
    };
  }
  if (points >= 100000) {
    return {
      name: "Gold",
      color: "bg-yellow-500 text-white",
      nextTier: { name: "Platinum", pointsNeeded: 150000 - points },
    };
  }
  if (points >= 50000) {
    return {
      name: "Purple",
      color: "bg-purple-500 text-white",
      nextTier: { name: "Gold", pointsNeeded: 100000 - points },
    };
  }
  if (points >= 10000) {
    return {
      name: "Silver",
      color: "bg-gray-400 text-white",
      nextTier: { name: "Purple", pointsNeeded: 50000 - points },
    };
  }
  return {
    name: "Bronze",
    color: "bg-amber-600 text-white",
    nextTier: { name: "Silver", pointsNeeded: 10000 - points },
  };
};

export default function CustomerDashboard() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/customer/points"],
    queryFn: async () => {
      const response = await fetch("/api/customer/points", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user points");
      }
      return response.json();
    }
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/customer/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/customer/transactions", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    }
  });

  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const { toast } = useToast();

  const redeemCashMutation = useMutation({
    mutationFn: async (points: number) => {
      const res = await fetch("/api/rewards/redeem-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/transactions"] });
      toast({
        title: "Success",
        description: `Successfully redeemed R${(pointsToRedeem * 0.015).toFixed(2)}`,
      });
      setPointsToRedeem(0);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const tierInfo = getTierInfo(user?.points || 0);
  const randValue = (pointsToRedeem * 0.015).toFixed(2);
  const canRedeem = pointsToRedeem > 0 && pointsToRedeem <= (user?.points || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Points & Tier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PointsDisplay points={user?.points || 0} size="large" />
            <div className="space-y-4">
              <Badge className={`${tierInfo.color} text-lg px-4 py-2`}>
                {tierInfo.name} Tier
              </Badge>
              {tierInfo.nextTier && (
                <div className="space-y-2">
                  <Progress
                    value={((user?.points || 0) / tierInfo.nextTier.pointsNeeded) * 100}
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {tierInfo.nextTier.pointsNeeded.toLocaleString()} points needed to reach{" "}
                    {tierInfo.nextTier.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Redemption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Points to Redeem</label>
              <Input
                type="number"
                min="0"
                max={user?.points || 0}
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                placeholder="Enter points amount"
              />
              <p className="text-sm text-muted-foreground">
                Conversion rate: 1 point = R0.015
              </p>
              {pointsToRedeem > 0 && (
                <p className="text-sm font-medium">
                  You will receive: R{randValue}
                </p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={() => redeemCashMutation.mutate(pointsToRedeem)}
              disabled={!canRedeem}
            >
              {canRedeem ? "Redeem for Cash" : "Insufficient Points"}
            </Button>
          </CardContent>
        </Card>

        <ReferralSection />

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {transactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg transaction-item"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {transaction.type ? formatTransactionType(transaction.type) : ''} - {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <PointsDisplay
                      points={transaction.points}
                      showSign
                      size="small"
                    />
                  </div>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

<style jsx>{`
  .transaction-item {
    border-color: #43eb3e; /*Applies green border to each transaction item*/
  }
`}</style>