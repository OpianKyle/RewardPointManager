import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { data: customers } = useQuery({
    queryKey: ["/api/admin/customers"],
  });

  const { data: rewards } = useQuery({
    queryKey: ["/api/rewards"],
  });

  const stats = [
    {
      title: "Total Customers",
      value: customers?.length || 0,
    },
    {
      title: "Active Rewards",
      value: rewards?.filter((r: any) => r.available).length || 0,
    },
    {
      title: "Total Points Issued",
      value: customers?.reduce((acc: number, c: any) => acc + c.points, 0) || 0,
    },
  ];

  const transactionData = customers?.flatMap((c: any) => 
    c.transactions.map((t: any) => ({
      date: new Date(t.createdAt).toLocaleDateString(),
      points: Math.abs(t.points),
      type: t.type,
    }))
  ) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="points" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
