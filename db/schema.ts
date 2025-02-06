import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const activityTypes = pgEnum("activity_type", [
  "ACTIVATE",
  "PAYMENT",
  "CARD_BALANCE",
  "RENEWAL",
  "UPGRADE"
]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const product_activities = pgTable("product_activities", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  type: activityTypes("type").notNull(),
  pointsValue: integer("points_value").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productAssignments = pgTable("product_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsCost: integer("points_cost").notNull(),
  imageUrl: text("image_url").notNull(),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionTypes = pgEnum("transaction_type", ["EARNED", "REDEEMED", "ADMIN_ADJUSTMENT"]);

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  points: integer("points").notNull(),
  type: transactionTypes("type").notNull(),
  description: text("description").notNull(),
  rewardId: integer("reward_id").references(() => rewards.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminActionTypes = pgEnum("admin_action_type", [
  "POINT_ADJUSTMENT",
  "ADMIN_CREATED",
  "ADMIN_REMOVED",
  "ADMIN_UPDATED",
  "ADMIN_ENABLED",
  "ADMIN_DISABLED",
  "USER_ENABLED",
  "USER_DISABLED",
  "USER_UPDATED",
  "REWARD_CREATED",
  "REWARD_UPDATED",
  "REWARD_DELETED",
  "PRODUCT_CREATED",
  "PRODUCT_UPDATED",
  "PRODUCT_DELETED",
  "PRODUCT_ASSIGNED",
  "PRODUCT_UNASSIGNED"
]);

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  targetUserId: integer("target_user_id").references(() => users.id),
  actionType: adminActionTypes("action_type").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productRelations = relations(products, ({ many }) => ({
    activities: many(product_activities),
    assignments: many(productAssignments),
}));

export const productActivityRelations = relations(product_activities, ({ one }) => ({
  product: one(products, {
    fields: [product_activities.productId],
    references: [products.id],
  }),
}));


export const userRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  adminLogsCreated: many(adminLogs, { relationName: "adminLogsCreated" }),
  adminLogsTarget: many(adminLogs, { relationName: "adminLogsTarget" }),
  productAssignments: many(productAssignments),
}));

export const productAssignmentRelations = relations(productAssignments, ({ one }) => ({
    user: one(users, {
        fields: [productAssignments.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [productAssignments.productId],
        references: [products.id],
    }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [transactions.rewardId],
    references: [rewards.id],
  }),
}));

export const adminLogRelations = relations(adminLogs, ({ one }) => ({
    admin: one(users, {
      fields: [adminLogs.adminId],
      references: [users.id],
      relationName: "adminLogsCreated"
    }),
    targetUser: one(users, {
      fields: [adminLogs.targetUserId],
      references: [users.id],
      relationName: "adminLogsTarget"
    }),
  }));

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export const insertProductActivitySchema = createInsertSchema(product_activities);
export const selectProductActivitySchema = createSelectSchema(product_activities);
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertRewardSchema = createInsertSchema(rewards);
export const selectRewardSchema = createSelectSchema(rewards);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);
export const insertAdminLogSchema = createInsertSchema(adminLogs);
export const selectAdminLogSchema = createSelectSchema(adminLogs);
export const insertProductAssignmentSchema = createInsertSchema(productAssignments);
export const selectProductAssignmentSchema = createSelectSchema(productAssignments);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductActivity = typeof product_activities.$inferSelect;
export type InsertProductActivity = typeof product_activities.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;
export type ProductAssignment = typeof productAssignments.$inferSelect;
export type InsertProductAssignment = typeof productAssignments.$inferInsert;