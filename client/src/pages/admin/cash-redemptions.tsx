import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Transaction = {
  id: number;
  userId: number;
  points: number;
  description: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function CashRedemptions() {
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/cash-redemptions"],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Cash Redemptions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Cash Redemptions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {transaction.user?.firstName} {transaction.user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-500">
                      {transaction.points.toLocaleString()} points
                    </p>
                    <p className="text-sm text-muted-foreground">
                      R{(Math.abs(transaction.points) * 0.015).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No cash redemptions yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
