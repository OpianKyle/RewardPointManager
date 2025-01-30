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
    await db.insert(adminLogs).values({
      adminId,
      actionType,
      targetUserId,
      details,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

export async function getAdminLogs() {
  try {
    return await db.query.adminLogs.findMany({
      with: {
        admin: true,
        targetUser: true,
      },
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });
  } catch (error) {
    console.error("Failed to fetch admin logs:", error);
    return [];
  }
}
