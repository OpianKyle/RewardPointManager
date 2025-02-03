import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { rewards, transactions, users, products, productAssignments, product_activities } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { logAdminAction, getAdminLogs } from "./admin-logger";

// Global notifications queue with timestamp-based cleanup
const notificationsQueue = new Map<number, Array<{
  type: string;
  userId: number;
  points: number;
  description: string;
  timestamp: string;
}>>(); 

// Configuration for polling
const POLLING_CONFIG = {
  maxQueueSize: 100, // Maximum notifications per user
  retentionPeriod: 5 * 60 * 1000, // 5 minutes retention for notifications
  cleanupInterval: 60 * 1000 // Cleanup every minute
};

// Cleanup old notifications periodically
setInterval(() => {
  const cutoffTime = new Date(Date.now() - POLLING_CONFIG.retentionPeriod);
  for (const [userId, notifications] of notificationsQueue.entries()) {
    const validNotifications = notifications.filter(
      n => new Date(n.timestamp) > cutoffTime
    );
    if (validNotifications.length === 0) {
      notificationsQueue.delete(userId);
    } else {
      notificationsQueue.set(userId, validNotifications);
    }
  }
}, POLLING_CONFIG.cleanupInterval);

// Helper function to add notification
function addNotification(notification: {
  type: string;
  userId: number;
  points: number;
  description: string;
}) {
  const userNotifications = notificationsQueue.get(notification.userId) || [];
  const newNotification = {
    ...notification,
    timestamp: new Date().toISOString()
  };

  // Add to queue, maintain max size
  userNotifications.push(newNotification);
  if (userNotifications.length > POLLING_CONFIG.maxQueueSize) {
    userNotifications.shift(); // Remove oldest
  }

  notificationsQueue.set(notification.userId, userNotifications);
}

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
  const httpServer = createServer(app);

  // New endpoint for polling notifications
  app.get("/api/notifications/poll", async (req, res) => {
    if (!req.user) return res.status(401).send("Unauthorized");

    const userNotifications = notificationsQueue.get(req.user.id) || [];
    // Clear notifications after sending
    notificationsQueue.set(req.user.id, []);

    res.json(userNotifications);
  });

  // Add new endpoint to fetch admin logs
  app.get("/api/admin/logs", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const logs = await getAdminLogs();
    res.json(logs);
  });

  // Modify points allocation to use new notification system
  app.post("/api/admin/points", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { userId, points, description, selectedActivities } = req.body;

    try {
      await db.transaction(async (tx) => {
        // First create the transaction record
        await tx.insert(transactions).values({
          userId,
          points,
          type: "ADMIN_ADJUSTMENT",
          description,
        });

        // Update user's points
        const [updatedUser] = await tx
          .update(users)
          .set({
            points: sql`${users.points} + ${points}`,
          })
          .where(eq(users.id, userId))
          .returning();

        // Fetch activity details if there are selected activities
        let activityDetails = "";
        if (selectedActivities?.length > 0) {
          // Convert the array to a proper SQL array
          const activityIds = selectedActivities.map(id => parseInt(id)).filter(id => !isNaN(id));

          if (activityIds.length > 0) {
            const activities = await tx
              .select({
                type: product_activities.type,
                pointsValue: product_activities.pointsValue,
              })
              .from(product_activities)
              .where(sql`${product_activities.id} = ANY(${activityIds})`);

            activityDetails = activities
              .map(activity => `${activity.type} (${activity.pointsValue} points)`)
              .join(', ');
          }
        }

        await logAdminAction({
          adminId: req.user!.id,
          actionType: "POINT_ADJUSTMENT",
          targetUserId: userId,
          details: `Adjusted points by ${points}. ${
            activityDetails ? `Activities: ${activityDetails}. ` : ''
          }Reason: ${description}`,
        });

        // Add notification using new system
        addNotification({
          type: "POINTS_ALLOCATION",
          userId,
          points,
          description,
        });

        return updatedUser;
      });

      res.json({ message: "Points adjusted successfully" });
    } catch (error) {
      console.error('Error adjusting points:', error);
      res.status(500).send('Failed to adjust points');
    }
  });

  // Admin Management Routes
  app.post("/api/admin/users/create", async (req, res) => {
    if (!req.user?.isSuperAdmin) return res.status(403).send("Only super admins can create new admins");
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    try {
      const hashedPassword = await crypto.hash(password);
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          isAdmin: true,
          isSuperAdmin: false,
          isEnabled: true,
          points: 0,
        })
        .returning();

      // Log admin creation
      await logAdminAction({
        adminId: req.user.id,
        actionType: "ADMIN_CREATED",
        targetUserId: newUser.id,
        details: `Created new admin user: ${email}`,
      });

      res.json(newUser);
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).send('Failed to create admin user');
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;
    const { email, firstName, lastName, phoneNumber, password } = req.body;

    try {
      const updates: any = {
        email,
        firstName,
        lastName,
        phoneNumber,
      };

      if (password) {
        updates.password = await crypto.hash(password);
      }

      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, parseInt(id)))
        .returning();

      if (!user) {
        return res.status(404).send("User not found");
      }

      // Log the user update
      await logAdminAction({
        adminId: req.user.id,
        actionType: "ADMIN_UPDATED",
        targetUserId: user.id,
        details: `Updated admin user: ${user.email}`,
      });

      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).send('Failed to update user');
    }
  });

  app.post("/api/admin/users/:id/toggle-status", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;
    const { enabled } = req.body;

    try {
      const [user] = await db
        .update(users)
        .set({ isEnabled: enabled })
        .where(eq(users.id, parseInt(id)))
        .returning();

      if (!user) {
        return res.status(404).send("User not found");
      }

      // Log the status change using a valid action type
      await logAdminAction({
        adminId: req.user.id,
        actionType: "ADMIN_REMOVED", // Using ADMIN_REMOVED as it's the closest valid action type
        targetUserId: user.id,
        details: `${enabled ? 'Enabled' : 'Disabled'} admin user: ${user.email}`,
      });

      res.json(user);
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).send('Failed to toggle user status');
    }
  });

  // Updated admin removal logic to handle foreign key constraints
  app.post("/api/admin/users/toggle-admin", async (req, res) => {
    if (!req.user?.isSuperAdmin) return res.status(403).send("Unauthorized");
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
        // Instead of deleting, we'll update the user to remove admin status and disable the account
        const [updatedUser] = await db
          .update(users)
          .set({
            isAdmin: false,
            isEnabled: false
          })
          .where(eq(users.id, userId))
          .returning();

        // Log admin removal
        await logAdminAction({
          adminId: req.user.id,
          actionType: "ADMIN_REMOVED",
          targetUserId: userId,
          details: `Removed admin user: ${targetUser.email}`,
        });

        res.json({ message: "Admin user removed successfully" });
      } else {
        // If adding admin status, update the user
        const [updatedUser] = await db
          .update(users)
          .set({ isAdmin })
          .where(eq(users.id, userId))
          .returning();

        // Log admin updated
        await logAdminAction({
          adminId: req.user.id,
          actionType: "ADMIN_ENABLED",
          targetUserId: userId,
          details: `${isAdmin ? 'Enabled' : 'Disabled'} admin user: ${targetUser.email}`,
        });

        res.json(updatedUser);
      }
    } catch (error) {
      console.error('Error modifying admin status:', error);
      res.status(500).send('Failed to modify admin status');
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const allUsers = await db.query.users.findMany({
      where: eq(users.isAdmin, true),
      orderBy: desc(users.createdAt),
    });
    res.json(allUsers);
  });

  // Add the customers endpoint right after the admin users endpoint
  app.get("/api/admin/customers", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const customers = await db.query.users.findMany({
      where: eq(users.isAdmin, false),
      orderBy: desc(users.createdAt),
      with: {
        transactions: true,
        productAssignments: {
          with: {
            product: {
              with: {
                activities: {
                  columns: {
                    id: true,
                    type: true,
                    pointsValue: true
                  }
                }
              }
            },
          },
        },
      },
    });
    res.json(customers);
  });

  // Product Management Routes
  app.get("/api/products", async (req, res) => {
    try {
      const allProducts = await db.query.products.findMany({
        with: {
          activities: {
            columns: {
              id: true,
              productId: true,
              type: true,
              pointsValue: true
            }
          }
        },
        orderBy: desc(products.createdAt),
      });
      res.json(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).send('Failed to fetch products');
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");

    try {
      const { name, description, activities } = req.body;

      const result = await db.transaction(async (tx) => {
        // Create the product first
        const [product] = await tx
          .insert(products)
          .values({
            name,
            description,
            isEnabled: true,
          })
          .returning();

        // Then create all activities for this product
        if (activities && Array.isArray(activities)) {
          await Promise.all(
            activities.map((activity) =>
              tx.insert(product_activities).values({
                productId: product.id,
                type: activity.type,
                pointsValue: activity.pointsValue,
              })
            )
          );
        }

        return product;
      });

      // Log the product creation
      await logAdminAction({
        adminId: req.user.id,
        actionType: "PRODUCT_CREATED",
        details: `Created new product: ${result.name}`,
      });

      // Fetch the complete product with activities
      const completeProduct = await db.query.products.findFirst({
        where: eq(products.id, result.id),
        with: {
          activities: {
            columns: {
              id: true,
              productId: true,
              type: true,
              pointsValue: true
            }
          }
        },
      });

      res.json(completeProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).send('Failed to create product');
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;
    const { name, description, activities } = req.body;

    try {
      const result = await db.transaction(async (tx) => {
        // Update the product
        const [product] = await tx
          .update(products)
          .set({
            name,
            description,
          })
          .where(eq(products.id, parseInt(id)))
          .returning();

        // Delete existing activities
        await tx
          .delete(product_activities)
          .where(eq(product_activities.productId, parseInt(id)));

        // Create new activities
        const activityPromises = activities.map(async (activity: any) => {
          return tx.insert(product_activities).values({
            productId: parseInt(id),
            type: activity.type,
            pointsValue: activity.pointsValue,
          });
        });

        await Promise.all(activityPromises);

        return product;
      });

      // Log the product update
      await logAdminAction({
        adminId: req.user.id,
        actionType: "PRODUCT_UPDATED",
        details: `Updated product: ${result.name}`,
      });

      // Fetch the complete product with activities
      const completeProduct = await db.query.products.findFirst({
        where: eq(products.id, parseInt(id)),
        with: {
          activities: true,
        },
      });

      res.json(completeProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).send('Failed to update product');
    }
  });

  app.post("/api/products/:id/toggle-status", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;
    const { enabled } = req.body;

    try {
      const [product] = await db
        .update(products)
        .set({ isEnabled: enabled })
        .where(eq(products.id, parseInt(id)))
        .returning();

      if (!product) {
        return res.status(404).send("Product not found");
      }

      // Log the status change
      await logAdminAction({
        adminId: req.user.id,
        actionType: enabled ? "PRODUCT_CREATED" : "PRODUCT_DELETED",
        details: `${enabled ? 'Enabled' : 'Disabled'} product: ${product.name}`,
      });

      res.json(product);
    } catch (error) {
      console.error('Error toggling product status:', error);
      res.status(500).send('Failed to toggle product status');
    }
  });

  app.post("/api/products/:id/assign", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;
    const { userId } = req.body;

    try {
      // Check if assignment already exists
      const existingAssignment = await db.query.productAssignments.findFirst({
        where: sql`${productAssignments.userId} = ${userId} AND ${productAssignments.productId} = ${parseInt(id)}`,
      });

      if (existingAssignment) {
        return res.status(400).json({ error: "Customer is already assigned to this product" });
      }

      const [assignment] = await db
        .insert(productAssignments)
        .values({
          userId,
          productId: parseInt(id),
        })
        .returning();

      // Log the product assignment
      await logAdminAction({
        adminId: req.user.id,
        actionType: "PRODUCT_ASSIGNED",
        targetUserId: userId,
        details: `Assigned product ID ${id} to user ID ${userId}`,
      });

      res.json(assignment);
    } catch (error) {
      console.error('Error assigning product:', error);
      res.status(500).send('Failed to assign product');
    }
  });

  app.post("/api/products/:id/unassign", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;
    const { userId } = req.body;

    try {
      const [deletedAssignment] = await db
        .delete(productAssignments)
        .where(sql`${productAssignments.userId} = ${userId} AND ${productAssignments.productId} = ${parseInt(id)}`)
        .returning();

      if (!deletedAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Log the product unassignment
      await logAdminAction({
        adminId: req.user.id,
        actionType: "PRODUCT_UNASSIGNED",
        targetUserId: userId,
        details: `Unassigned product ID ${id} from user ID ${userId}`,
      });

      res.json({ message: "Product unassigned successfully" });
    } catch (error) {
      console.error('Error unassigning product:', error);
      res.status(500).send('Failed to unassign product');
    }
  });
  
    
    app.get("/api/products/assignments/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized")
    const { id } = req.params;

    try {
      const assignment = await db.query.productAssignments.findFirst({
        where: eq(productAssignments.id, parseInt(id)),
        with: {
          product: true,
          user: true,
        }
      })
      if (!assignment) {
        return res.status(404).send("Assignment not found")
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).send("Failed to fetch assignment");
    }
  })


  app.delete("/api/products/assignments/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;

    try {
      const [assignment] = await db
        .delete(productAssignments)
        .where(eq(productAssignments.id, parseInt(id)))
        .returning();

      if (!assignment) {
        return res.status(404).send("Assignment not found");
      }

      // Log the product unassignment
      await logAdminAction({
        adminId: req.user.id,
        actionType: "PRODUCT_UNASSIGNED",
        targetUserId: assignment.userId,
        details: `Unassigned product ID ${assignment.productId} from user ID ${assignment.userId}`,
      });

      res.json({ message: "Product assignment removed successfully" });
    } catch (error) {
      console.error('Error removing product assignment:', error);
      res.status(500).send('Failed to remove product assignment');
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
    try {
      const [reward] = await db.insert(rewards).values(req.body).returning();

      // Log both the reward creation and the points cost setting
      await logAdminAction({
        adminId: req.user.id,
        actionType: "REWARD_CREATED",
        details: `Created new reward: ${reward.name} (Cost: ${reward.pointsCost} points)`,
      });

      res.json(reward);
    } catch (error) {
      console.error('Error creating reward:', error);
      res.status(500).send('Failed to create reward');
    }
  });

  app.put("/api/rewards/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;
    const { name, description, pointsCost, imageUrl, available } = req.body;

    try {
      const [reward] = await db
        .update(rewards)
        .set({
          name,
          description,
          pointsCost,
          imageUrl,
          available,
        })
        .where(eq(rewards.id, parseInt(id)))
        .returning();

      if (!reward) {
        return res.status(404).send("Reward not found");
      }

      // Log the reward update
      await logAdminAction({
        adminId: req.user.id,
        actionType: "REWARD_UPDATED",
        details: `Updated reward: ${reward.name} (New Cost: ${reward.pointsCost} points)`,
      });

      res.json(reward);
    } catch (error) {
      console.error('Error updating reward:', error);
      res.status(500).send('Failed to update reward');
    }
  });

  app.delete("/api/rewards/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send("Unauthorized");
    const { id } = req.params;

    try {
      const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, parseInt(id)))
        .limit(1);

      if (!reward) {
        return res.status(404).send("Reward not found");
      }

      await db
        .update(rewards)
        .set({ available: false })
        .where(eq(rewards.id, parseInt(id)));

      // Log the reward deletion
      await logAdminAction({
        adminId: req.user.id,
        actionType: "REWARD_DELETED",
        details: `Deleted reward: ${reward.name}`,
      });

      res.json({ message: "Reward deleted successfully" });
    } catch (error) {
      console.error('Error deleting reward:', error);
      res.status(500).send('Failed to delete reward');
    }
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

    try {
      await db.transaction(async (tx) => {
        // Create the transaction record
        await tx.insert(transactions).values({
          userId: user.id,
          points: -reward.pointsCost,
          type: "REDEEMED",
          description: `Redeemed ${reward.name}`,
          rewardId,
        });

        // Update user points
        await tx
          .update(users)
          .set({ points: user.points - reward.pointsCost })
          .where(eq(users.id, user.id));

        // Log the point adjustment
        await logAdminAction({
          adminId: user.id,
          actionType: "POINT_ADJUSTMENT",
          targetUserId: user.id,
          details: `Points deducted (-${reward.pointsCost}) for redeeming reward: ${reward.name}`,
        });
      });

      // Invalidate queries after successful transaction
      res.json({
        success: true,
        message: `Successfully redeemed ${reward.name} for ${reward.pointsCost} points`
      });
    } catch (error) {
      console.error('Error processing reward redemption:', error);
      res.status(500).send('Failed to process reward redemption');
    }
  });

  return httpServer;
}