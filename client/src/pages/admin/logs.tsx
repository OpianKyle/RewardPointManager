import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield, UserMinus, Coins, Gift, Package, Power, PowerOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type AdminLog = {
  id: number;
  actionType: 
    | "POINT_ADJUSTMENT" 
    | "ADMIN_CREATED" 
    | "ADMIN_REMOVED" 
    | "REWARD_CREATED" 
    | "REWARD_UPDATED" 
    | "REWARD_DELETED"
    | "PRODUCT_CREATED"
    | "PRODUCT_UPDATED"
    | "PRODUCT_DELETED"
    | "PRODUCT_ASSIGNED"
    | "PRODUCT_UNASSIGNED";
  details: string;
  createdAt: string;
  admin: { username: string };
  targetUser?: { username: string };
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "POINT_ADJUSTMENT":
      return <Coins className="h-4 w-4 text-yellow-500" />;
    case "ADMIN_CREATED":
      return <Shield className="h-4 w-4 text-green-500" />;
    case "ADMIN_REMOVED":
      return <UserMinus className="h-4 w-4 text-red-500" />;
    case "REWARD_CREATED":
    case "REWARD_UPDATED":
    case "REWARD_DELETED":
      return <Gift className="h-4 w-4 text-purple-500" />;
    case "PRODUCT_CREATED":
    case "PRODUCT_UPDATED":
    case "PRODUCT_DELETED":
      return <Package className="h-4 w-4 text-blue-500" />;
    case "PRODUCT_ASSIGNED":
      return <Power className="h-4 w-4 text-green-500" />;
    case "PRODUCT_UNASSIGNED":
      return <PowerOff className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getActionCategory = (actionType: string) => {
  if (actionType.startsWith("POINT")) return "Points";
  if (actionType.startsWith("ADMIN")) return "Admin";
  if (actionType.startsWith("REWARD")) return "Rewards";
  if (actionType.startsWith("PRODUCT")) return "Products";
  return "Other";
};

export default function AdminLogs() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const { data: logs = [] } = useQuery<AdminLog[]>({
    queryKey: ["/api/admin/logs"],
  });

  const filteredLogs = selectedCategory === "all"
    ? logs
    : logs.filter(log => getActionCategory(log.actionType) === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Logs</h1>
        <div className="flex items-center gap-4">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="Points">Points</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Rewards">Rewards</SelectItem>
              <SelectItem value="Products">Products</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline"
            onClick={() => setSelectedCategory("all")}
          >
            Reset Filter
          </Button>
        </div>
      </div>

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
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.admin.username}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {getActionIcon(log.actionType)}
                    <span className="whitespace-nowrap">
                      {log.actionType.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.targetUser?.username || "N/A"}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No logs found for the selected category
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}