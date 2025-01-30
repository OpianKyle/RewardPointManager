import { db } from "@db";
import { adminLogs, type User } from "@db/schema";

type AdminAction = {
  adminId: number;
  actionType: "POINT_ADJUSTMENT" | "ADMIN_CREATED" | "ADMIN_REMOVED" | "REWARD_CREATED" | "REWARD_UPDATED" | "REWARD_DELETED";
  targetUserId?: number;
  details: string;
};

export async function logAdminAction({
  adminId,
  actionType,
  targetUserId,
  details,
}: AdminAction) {
  try {
    console.log('Attempting to log admin action:', { adminId, actionType, targetUserId, details });
    const [result] = await db.insert(adminLogs).values({
      adminId,
      actionType,
      targetUserId,
      details,
    }).returning();

    console.log('Admin action logged successfully:', result);
    return result;
  } catch (error) {
    console.error("Failed to log admin action:", error);
    throw error; // Re-throw to handle in the route
  }
}

export async function getAdminLogs() {
  try {
    const logs = await db.query.adminLogs.findMany({
      with: {
        admin: true,
        targetUser: true,
      },
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });
    console.log('Retrieved admin logs:', logs.length);
    return logs;
  } catch (error) {
    console.error("Failed to fetch admin logs:", error);
    return [];
  }
}