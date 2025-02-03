import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import PointsDisplay from "@/components/shared/points-display";
import { Badge } from "@/components/ui/badge";

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

export default function CustomerDashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/customer/points"],
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/customer/transactions"],
  });

  const tierInfo = getTierInfo(user?.points || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Points & Tier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PointsDisplay points={user?.points || 0} size="large" />
            <div className="space-y-2">
              <Badge className={`${tierInfo.color} text-lg px-4 py-2`}>
                {tierInfo.name} Tier
              </Badge>
              {tierInfo.nextTier && (
                <p className="text-sm text-muted-foreground">
                  {tierInfo.nextTier.pointsNeeded.toLocaleString()} points needed to reach {tierInfo.nextTier.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {transactions?.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{transaction.description}</p>
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