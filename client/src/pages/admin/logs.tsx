import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield, UserMinus, Coins, Gift } from "lucide-react";

type AdminLog = {
  id: number;
  actionType: "POINT_ADJUSTMENT" | "ADMIN_CREATED" | "ADMIN_REMOVED" | "REWARD_CREATED" | "REWARD_UPDATED" | "REWARD_DELETED";
  details: string;
  createdAt: string;
  admin: { username: string };
  targetUser?: { username: string };
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "POINT_ADJUSTMENT":
      return <Coins className="h-4 w-4" />;
    case "ADMIN_CREATED":
      return <Shield className="h-4 w-4" />;
    case "ADMIN_REMOVED":
      return <UserMinus className="h-4 w-4" />;
    case "REWARD_CREATED":
    case "REWARD_UPDATED":
    case "REWARD_DELETED":
      return <Gift className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export default function AdminLogs() {
  const { data: logs = [] } = useQuery<AdminLog[]>({
    queryKey: ["/api/admin/logs"],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Logs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Action History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.admin.username}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {getActionIcon(log.actionType)}
                    {log.actionType.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    {log.targetUser?.username || "N/A"}
                  </TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}