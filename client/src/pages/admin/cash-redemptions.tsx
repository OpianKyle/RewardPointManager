import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CheckCircle2, XCircle } from "lucide-react";

type Transaction = {
  id: number;
  userId: number;
  points: number;
  description: string;
  createdAt: string;
  status?: 'PENDING' | 'PROCESSED';
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function CashRedemptions() {
  const { toast } = useToast();
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/cash-redemptions"],
  });

  const markProcessedMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await fetch(`/api/admin/cash-redemptions/${transactionId}/process`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to mark redemption as processed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cash-redemptions"] });
      toast({
        title: "Success",
        description: "Cash redemption marked as processed",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
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
                  <div className="text-right space-y-2">
                    <p className="font-semibold text-red-500">
                      {transaction.points.toLocaleString()} points
                    </p>
                    <p className="text-sm text-muted-foreground">
                      R{(Math.abs(transaction.points) * 0.015).toFixed(2)}
                    </p>
                    {transaction.status === 'PROCESSED' ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Processed</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => markProcessedMutation.mutate(transaction.id)}
                        disabled={markProcessedMutation.isPending}
                      >
                        Mark as Processed
                      </Button>
                    )}
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