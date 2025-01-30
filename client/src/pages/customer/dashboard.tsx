import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import PointsDisplay from "@/components/shared/points-display";

export default function CustomerDashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/customer/points"],
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/customer/transactions"],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Points Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <PointsDisplay points={user?.points || 0} size="large" />
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
                    <div>
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
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
