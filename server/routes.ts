import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { rewards, transactions, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { logAdminAction, getAdminLogs } from "./admin-logger";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Add new endpoint to fetch admin logs
  app.get("/api/admin/logs", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const logs = await getAdminLogs();
    res.json(logs);
  });

  // Admin Routes
  app.get("/api/admin/customers", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const allUsers = await db.query.users.findMany({
      where: eq(users.isAdmin, false),
      with: {
        transactions: {
          limit: 5,
          orderBy: desc(transactions.createdAt),
        },
      },
    });
    res.json(allUsers);
  });

  // Update existing admin routes to include logging
  app.post("/api/admin/points", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { userId, points, description } = req.body;

    await db.transaction(async (tx) => {
      await tx.insert(transactions).values({
        userId,
        points,
        type: "ADMIN_ADJUSTMENT",
        description,
      });

      await tx
        .update(users)
        .set({ points: users.points + points })
        .where(eq(users.id, userId));

      // Log the point adjustment
      await logAdminAction({
        adminId: req.user.id,
        actionType: "POINT_ADJUSTMENT",
        targetUserId: userId,
        details: `Adjusted points by ${points}. Reason: ${description}`,
      });
    });

    res.json({ success: true });
  });

  // Admin Management Routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const allUsers = await db.query.users.findMany({
      where: eq(users.isAdmin, true), // Only fetch admin users
      orderBy: desc(users.createdAt),
    });
    res.json(allUsers);
  });

  app.post("/api/admin/users/create", async (req, res) => {
    if (!req.user?.isSuperAdmin) return res.status(403).send("Only super admins can create new admins");
    const { username, password } = req.body;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    try {
      const hashedPassword = await crypto.hash(password);
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          isAdmin: true,
          isSuperAdmin: false,
          points: 0,
        })
        .returning();

      // Log admin creation
      await logAdminAction({
        adminId: req.user.id,
        actionType: "ADMIN_CREATED",
        targetUserId: newUser.id,
        details: `Created new admin user: ${username}`,
      });

      res.json(newUser);
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).send('Failed to create admin user');
    }
  });

  app.post("/api/admin/users/toggle-admin", async (req, res) => {
    if (!req.user?.isSuperAdmin) return res.status(403).send("Only super admins can modify admin status");
    const { userId, isAdmin } = req.body;

    if (userId === req.user.id) {
      return res.status(400).send("Cannot change your own admin status");
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (targetUser?.isSuperAdmin) {
      return res.status(400).send("Cannot modify super admin status");
    }

    try {
      if (!isAdmin) {
        // Log admin removal before deleting
        await logAdminAction({
          adminId: req.user.id,
          actionType: "ADMIN_REMOVED",
          targetUserId: userId,
          details: `Removed admin user: ${targetUser.username}`,
        });

        // If removing admin status, delete the user
        await db.delete(users).where(eq(users.id, userId));
        res.json({ message: "Admin user removed successfully" });
      } else {
        // If adding admin status, update the user
        const [updatedUser] = await db
          .update(users)
          .set({ isAdmin })
          .where(eq(users.id, userId))
          .returning();
        res.json(updatedUser);
      }
    } catch (error) {
      console.error('Error modifying admin status:', error);
      res.status(500).send('Failed to modify admin status');
    }
  });

  // Customer Routes
  app.get("/api/customer/points", async (req, res) => {
    if (!req.user) return res.status(401).send("Unauthorized");
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });
    res.json(user);
  });

  app.get("/api/customer/transactions", async (req, res) => {
    if (!req.user) return res.status(401).send("Unauthorized");
    const userTransactions = await db.query.transactions.findMany({
      where: eq(transactions.userId, req.user.id),
      orderBy: desc(transactions.createdAt),
      with: {
        reward: true,
      },
    });
    res.json(userTransactions);
  });

  // Shared Routes
  app.get("/api/rewards", async (req, res) => {
    const allRewards = await db.query.rewards.findMany({
      where: eq(rewards.available, true),
    });
    res.json(allRewards);
  });

  app.post("/api/rewards", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const reward = await db.insert(rewards).values(req.body).returning();
    res.json(reward[0]);
  });

  app.post("/api/rewards/redeem", async (req, res) => {
    if (!req.user) return res.status(401).send("Unauthorized");
    const { rewardId } = req.body;

    const reward = await db.query.rewards.findFirst({
      where: eq(rewards.id, rewardId),
    });

    if (!reward) return res.status(404).send("Reward not found");

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    if (!user || user.points < reward.pointsCost) {
      return res.status(400).send("Insufficient points");
    }

    await db.transaction(async (tx) => {
      await tx.insert(transactions).values({
        userId: user.id,
        points: -reward.pointsCost,
        type: "REDEEMED",
        description: `Redeemed ${reward.name}`,
        rewardId,
      });

      await tx
        .update(users)
        .set({ points: user.points - reward.pointsCost })
        .where(eq(users.id, user.id));
    });

    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}