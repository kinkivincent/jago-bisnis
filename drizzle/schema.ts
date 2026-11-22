import { bigint, index, int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  businessName: varchar("businessName", { length: 160 }),
  businessCategory: varchar("businessCategory", { length: 120 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const marketingProjects = mysqlTable(
  "marketing_projects",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    businessName: varchar("businessName", { length: 160 }).notNull(),
    businessCategory: varchar("businessCategory", { length: 120 }),
    objective: varchar("objective", { length: 240 }),
    status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ userUpdatedIdx: index("marketing_projects_user_updated_idx").on(table.userId, table.updatedAt) })
);

export const salesMonthlyMetrics = mysqlTable("sales_monthly_metrics", {
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  period: varchar("period", { length: 7 }).notNull(),
  targetRevenue: bigint("targetRevenue", { mode: "number" }).notNull().default(0),
  actualRevenue: bigint("actualRevenue", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ pk: primaryKey({ columns: [table.userId, table.period] }) }));

export const salesAgentWorkspaces = mysqlTable("sales_agent_workspaces", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentKey: mysqlEnum("agentKey", ["A", "B", "C"]).notNull(),
  targetRevenue: bigint("targetRevenue", { mode: "number" }).notNull(),
  actualRevenue: bigint("actualRevenue", { mode: "number" }),
  destinationUrl: varchar("destinationUrl", { length: 2048 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userAgentIdx: uniqueIndex("sales_agent_user_agent_uidx").on(table.userId, table.agentKey),
  userUpdatedIdx: index("sales_agent_user_updated_idx").on(table.userId, table.updatedAt),
}));

export const salesProducts = mysqlTable("sales_products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  targetAudience: varchar("targetAudience", { length: 220 }),
  salesAgentKey: mysqlEnum("salesAgentKey", ["A", "B", "C"]),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userCreatedIdx: index("sales_products_user_created_idx").on(table.userId, table.createdAt),
  userAgentIdx: index("sales_products_user_agent_idx").on(table.userId, table.salesAgentKey),
}));

export const salesTasks = mysqlTable("sales_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  dueDate: varchar("dueDate", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ userDueIdx: index("sales_tasks_user_due_idx").on(table.userId, table.dueDate) }));

export const generationHistory = mysqlTable(
  "generation_history",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    projectId: int("projectId").references(() => marketingProjects.id, { onDelete: "set null" }),
    salesAgentKey: mysqlEnum("salesAgentKey", ["A", "B", "C"]),
    salesProductId: int("salesProductId").references(() => salesProducts.id, { onDelete: "set null" }),
    workflowStage: varchar("workflowStage", { length: 32 }),
    category: varchar("category", { length: 32 }).notNull(),
    tool: varchar("tool", { length: 64 }).notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    input: text("input").notNull(),
    result: text("result").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userCreatedIdx: index("generation_history_user_created_idx").on(table.userId, table.createdAt),
    projectCreatedIdx: index("generation_history_project_created_idx").on(table.projectId, table.createdAt),
    userAgentStageIdx: index("generation_history_user_agent_stage_idx").on(table.userId, table.salesAgentKey, table.workflowStage, table.createdAt),
    userAgentProductStageIdx: index("generation_history_user_agent_product_stage_idx").on(table.userId, table.salesAgentKey, table.salesProductId, table.workflowStage, table.createdAt),
    salesProductIdx: index("generation_history_sales_product_idx").on(table.salesProductId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MarketingProject = typeof marketingProjects.$inferSelect;
export type SalesMonthlyMetric = typeof salesMonthlyMetrics.$inferSelect;
export type SalesAgentWorkspace = typeof salesAgentWorkspaces.$inferSelect;
export type SalesProduct = typeof salesProducts.$inferSelect;
export type SalesTask = typeof salesTasks.$inferSelect;
export type Generation = typeof generationHistory.$inferSelect;
