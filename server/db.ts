import { and, count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { generationHistory, InsertUser, marketingProjects, salesAgentWorkspaces, salesMonthlyMetrics, salesProducts, salesTasks, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import {
  SALES_AGENT_DEFAULTS,
  SALES_DAILY_BRIEF_STAGE,
  SALES_DAILY_BRIEF_SOURCE_STAGES,
  type SalesAgentKey,
  type SalesDailyBriefSourceStage,
  type SalesWorkflowStage,
} from "../shared/salesAgents";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "businessName", "businessCategory"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, profile: { name: string; businessName: string; businessCategory: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(users).set(profile).where(eq(users.id, userId));
  return db.select().from(users).where(eq(users.id, userId)).limit(1).then(rows => rows[0]);
}

export async function createProject(userId: number, input: { name: string; businessName: string; businessCategory: string; objective: string; status?: "draft" | "active" | "paused" | "completed" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const inserted = await db.insert(marketingProjects).values({ userId, ...input });
  const id = Number(inserted[0].insertId);
  return getProject(userId, id);
}

export async function updateProject(userId: number, id: number, input: { name?: string; businessName?: string; businessCategory?: string; objective?: string; status?: "draft" | "active" | "paused" | "completed" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(marketingProjects).set(input).where(and(eq(marketingProjects.id, id), eq(marketingProjects.userId, userId)));
  return getProject(userId, id);
}

export async function getProject(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(marketingProjects).where(and(eq(marketingProjects.id, id), eq(marketingProjects.userId, userId))).limit(1);
  return rows[0];
}

export async function listProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select({
    id: marketingProjects.id,
    name: marketingProjects.name,
    businessName: marketingProjects.businessName,
    businessCategory: marketingProjects.businessCategory,
    objective: marketingProjects.objective,
    status: marketingProjects.status,
    createdAt: marketingProjects.createdAt,
    updatedAt: marketingProjects.updatedAt,
    generationCount: count(generationHistory.id),
  }).from(marketingProjects)
    .leftJoin(generationHistory, eq(generationHistory.projectId, marketingProjects.id))
    .where(eq(marketingProjects.userId, userId))
    .groupBy(marketingProjects.id)
    .orderBy(desc(marketingProjects.updatedAt))
    .limit(50);
}

export async function createGeneration(input: {
  userId: number; projectId?: number; salesAgentKey?: SalesAgentKey; salesProductId?: number; workflowStage?: SalesWorkflowStage | typeof SALES_DAILY_BRIEF_STAGE; category: string; tool: string; title: string; data: string; result: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const inserted = await db.insert(generationHistory).values({
    userId: input.userId,
    projectId: input.projectId ?? null,
    salesAgentKey: input.salesAgentKey ?? null,
    salesProductId: input.salesProductId ?? null,
    workflowStage: input.workflowStage ?? null,
    category: input.category,
    tool: input.tool,
    title: input.title,
    input: input.data,
    result: input.result,
  });
  const id = Number(inserted[0].insertId);
  if (input.projectId) await db.update(marketingProjects).set({ updatedAt: new Date() }).where(and(eq(marketingProjects.id, input.projectId), eq(marketingProjects.userId, input.userId)));
  const rows = await db.select().from(generationHistory).where(eq(generationHistory.id, id)).limit(1);
  return rows[0];
}

export async function listGenerations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(generationHistory).where(eq(generationHistory.userId, userId)).orderBy(desc(generationHistory.createdAt)).limit(40);
}

export async function getGeneration(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(generationHistory).where(and(eq(generationHistory.userId, userId), eq(generationHistory.id, id))).limit(1);
  return rows[0];
}

export async function getAnalytics(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const [generations, projects] = await Promise.all([
    db.select({ total: count() }).from(generationHistory).where(eq(generationHistory.userId, userId)),
    db.select({ total: count() }).from(marketingProjects).where(eq(marketingProjects.userId, userId)),
  ]);
  const totalGenerations = Number(generations[0]?.total ?? 0);
  const totalProjects = Number(projects[0]?.total ?? 0);
  if (totalGenerations === 0) {
    return { totalGenerations, totalProjects, byAgent: [], activity: [] };
  }
  const activityDay = sql<string>`DATE(generation_history.createdAt)`;
  const [byAgent, activity] = await Promise.all([
    db.select({ category: generationHistory.category, total: count() }).from(generationHistory).where(eq(generationHistory.userId, userId)).groupBy(generationHistory.category),
    db.select({ day: activityDay, total: count() }).from(generationHistory)
      .where(and(eq(generationHistory.userId, userId), gte(generationHistory.createdAt, start)))
      .groupBy(activityDay).orderBy(activityDay),
  ]);
  return {
    totalGenerations,
    totalProjects,
    byAgent: byAgent.map(row => ({ category: row.category, total: Number(row.total) })),
    activity: activity.map(row => ({ day: String(row.day).slice(0, 10), total: Number(row.total) })),
  };
}

export async function setProjectStatus(userId: number, id: number, status: "draft" | "active" | "paused" | "completed") {
 const db=await getDb(); if(!db) throw new Error("Database is not available");
 await db.update(marketingProjects).set({status}).where(and(eq(marketingProjects.id,id),eq(marketingProjects.userId,userId))); return getProject(userId,id);
}
export async function getSalesOverview(userId:number, period:string, today:string) {
 const db=await getDb(); if(!db) throw new Error("Database is not available");
 const [m,products,tasks]=await Promise.all([
 db.select({targetRevenue:salesMonthlyMetrics.targetRevenue,actualRevenue:salesMonthlyMetrics.actualRevenue}).from(salesMonthlyMetrics).where(and(eq(salesMonthlyMetrics.userId,userId),eq(salesMonthlyMetrics.period,period))).limit(1),
 db.select({id:salesProducts.id,name:salesProducts.name,targetAudience:salesProducts.targetAudience,isActive:salesProducts.isActive}).from(salesProducts).where(eq(salesProducts.userId,userId)).orderBy(desc(salesProducts.updatedAt)),
 db.select({id:salesTasks.id,title:salesTasks.title,dueDate:salesTasks.dueDate,status:salesTasks.status}).from(salesTasks).where(and(eq(salesTasks.userId,userId),eq(salesTasks.dueDate,today))).orderBy(desc(salesTasks.createdAt))]);
 return {targetRevenue:Number(m[0]?.targetRevenue??0),actualRevenue:Number(m[0]?.actualRevenue??0),products:products.map(p=>({...p,isActive:Boolean(p.isActive)})),tasks};
}
export async function setMonthlyMetrics(userId:number,input:{period:string;targetRevenue:number;actualRevenue:number}) {
 const db=await getDb(); if(!db) throw new Error("Database is not available");
 await db.insert(salesMonthlyMetrics).values({userId,...input}).onDuplicateKeyUpdate({set:{targetRevenue:input.targetRevenue,actualRevenue:input.actualRevenue,updatedAt:new Date()}}); return input;
}
export async function createSalesProduct(userId:number,input:{name:string;targetAudience?:string|null}) {
 const db=await getDb(); if(!db) throw new Error("Database is not available");
 const r=await db.insert(salesProducts).values({userId,name:input.name,targetAudience:input.targetAudience??null}); const rows=await db.select({id:salesProducts.id,name:salesProducts.name,targetAudience:salesProducts.targetAudience,isActive:salesProducts.isActive}).from(salesProducts).where(and(eq(salesProducts.userId,userId),eq(salesProducts.id,Number(r[0].insertId)))).limit(1); return {...rows[0],isActive:Boolean(rows[0]?.isActive)};
}
export async function setSalesProductActive(userId:number,id:number,isActive:boolean) { const db=await getDb(); if(!db) throw new Error("Database is not available"); await db.update(salesProducts).set({isActive:isActive?1:0}).where(and(eq(salesProducts.id,id),eq(salesProducts.userId,userId))); return {success:true}; }
export async function createSalesTask(userId:number,input:{title:string;dueDate:string}) { const db=await getDb(); if(!db) throw new Error("Database is not available"); const r=await db.insert(salesTasks).values({userId,...input}); const rows=await db.select({id:salesTasks.id,title:salesTasks.title,dueDate:salesTasks.dueDate,status:salesTasks.status}).from(salesTasks).where(and(eq(salesTasks.id,Number(r[0].insertId)),eq(salesTasks.userId,userId))).limit(1); return rows[0]; }
export async function setSalesTaskCompleted(userId:number,id:number,completed:boolean) { const db=await getDb(); if(!db) throw new Error("Database is not available"); await db.update(salesTasks).set({status:completed?"completed":"pending"}).where(and(eq(salesTasks.id,id),eq(salesTasks.userId,userId))); return {success:true}; }


export async function getSalesAgentOverview(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [savedConfigs, productRows] = await Promise.all([
    db.select().from(salesAgentWorkspaces).where(eq(salesAgentWorkspaces.userId, userId)),
    db.select({
      id: salesProducts.id,
      name: salesProducts.name,
      targetAudience: salesProducts.targetAudience,
      salesAgentKey: salesProducts.salesAgentKey,
      isActive: salesProducts.isActive,
      createdAt: salesProducts.createdAt,
    }).from(salesProducts).where(eq(salesProducts.userId, userId)).orderBy(desc(salesProducts.updatedAt)),
  ]);
  const latestOpportunityRows = await db.select({
    id: generationHistory.id,
    salesAgentKey: generationHistory.salesAgentKey,
    salesProductId: generationHistory.salesProductId,
    title: generationHistory.title,
    result: generationHistory.result,
    createdAt: generationHistory.createdAt,
  }).from(generationHistory).where(and(
    eq(generationHistory.userId, userId),
    eq(generationHistory.workflowStage, "opportunity_report"),
    isNotNull(generationHistory.salesProductId),
  )).orderBy(desc(generationHistory.createdAt)).limit(1);
  const jakartaToday = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());
  const jakartaDayStart = new Date(`${jakartaToday}T00:00:00+07:00`);
  const dailyBriefRowsByTrack = await Promise.all(SALES_AGENT_DEFAULTS.map(defaults => db.select({
    id: generationHistory.id,
    salesAgentKey: generationHistory.salesAgentKey,
    salesProductId: generationHistory.salesProductId,
    title: generationHistory.title,
    result: generationHistory.result,
    createdAt: generationHistory.createdAt,
  }).from(generationHistory).where(and(
    eq(generationHistory.userId, userId),
    eq(generationHistory.salesAgentKey, defaults.key),
    eq(generationHistory.workflowStage, SALES_DAILY_BRIEF_STAGE),
    gte(generationHistory.createdAt, jakartaDayStart),
    isNotNull(generationHistory.salesProductId),
  )).orderBy(desc(generationHistory.createdAt)).limit(1)));
  const workspaces = SALES_AGENT_DEFAULTS.map(defaults => {
    const saved = savedConfigs.find(row => row.agentKey === defaults.key);
    const products = productRows
      .filter(product => product.salesAgentKey === defaults.key)
      .map(product => ({ ...product, isActive: Boolean(product.isActive) }));
    return {
      id: saved?.id ?? null,
      key: defaults.key,
      name: defaults.name,
      category: defaults.category,
      targetRevenue: Number(saved?.targetRevenue ?? defaults.targetRevenue),
      targetRevenueRecorded: saved?.targetRevenue != null,
      actualRevenue: saved?.actualRevenue == null ? null : Number(saved.actualRevenue),
      destinationUrl: saved?.destinationUrl ?? "",
      products,
    };
  });
  return {
    workspaces,
    products: productRows.map(product => ({ ...product, isActive: Boolean(product.isActive) })),
    latestOpportunityReport: latestOpportunityRows[0] ? {
      ...latestOpportunityRows[0],
      workspaceName: SALES_AGENT_DEFAULTS.find(item => item.key === latestOpportunityRows[0].salesAgentKey)?.name ?? null,
      productName: productRows.find(item => item.id === latestOpportunityRows[0].salesProductId)?.name ?? "Produk tidak tersedia",
    } : null,
    dailyBriefs: dailyBriefRowsByTrack.flatMap(rows => rows).map(row => ({
      ...row,
      workspaceName: SALES_AGENT_DEFAULTS.find(item => item.key === row.salesAgentKey)?.name ?? null,
      productName: productRows.find(item => item.id === row.salesProductId)?.name ?? "Produk tidak tersedia",
    })),
  };
}

export async function getSalesAgentWorkspace(userId: number, agentKey: SalesAgentKey) {
  const overview = await getSalesAgentOverview(userId);
  return overview.workspaces.find(workspace => workspace.key === agentKey);
}

export async function updateSalesAgentWorkspace(userId: number, input: {
  agentKey: SalesAgentKey;
  targetRevenue: number;
  actualRevenue: number | null;
  destinationUrl: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(salesAgentWorkspaces).values({ userId, ...input })
    .onDuplicateKeyUpdate({ set: {
      targetRevenue: input.targetRevenue,
      actualRevenue: input.actualRevenue,
      destinationUrl: input.destinationUrl,
      updatedAt: new Date(),
    } });
  return getSalesAgentWorkspace(userId, input.agentKey);
}

export async function createSalesAgentProduct(userId: number, input: {
  name: string;
  targetAudience?: string | null;
  salesAgentKey: SalesAgentKey;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const inserted = await db.insert(salesProducts).values({
    userId,
    name: input.name,
    targetAudience: input.targetAudience ?? null,
    salesAgentKey: input.salesAgentKey,
  });
  const rows = await db.select({
    id: salesProducts.id,
    name: salesProducts.name,
    targetAudience: salesProducts.targetAudience,
    salesAgentKey: salesProducts.salesAgentKey,
    isActive: salesProducts.isActive,
    createdAt: salesProducts.createdAt,
  }).from(salesProducts).where(and(
    eq(salesProducts.id, Number(inserted[0].insertId)),
    eq(salesProducts.userId, userId),
  )).limit(1);
  return rows[0] ? { ...rows[0], isActive: Boolean(rows[0].isActive) } : undefined;
}

export async function assignSalesProduct(userId: number, productId: number, agentKey: SalesAgentKey | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(salesProducts).set({ salesAgentKey: agentKey, updatedAt: new Date() })
    .where(and(eq(salesProducts.id, productId), eq(salesProducts.userId, userId)));
  const rows = await db.select({ id: salesProducts.id }).from(salesProducts)
    .where(and(eq(salesProducts.id, productId), eq(salesProducts.userId, userId))).limit(1);
  return rows[0];
}

export async function getSalesAgentProduct(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({
    id: salesProducts.id,
    name: salesProducts.name,
    targetAudience: salesProducts.targetAudience,
    salesAgentKey: salesProducts.salesAgentKey,
    isActive: salesProducts.isActive,
  }).from(salesProducts).where(and(
    eq(salesProducts.id, productId),
    eq(salesProducts.userId, userId),
  )).limit(1);
  return rows[0] ? { ...rows[0], isActive: Boolean(rows[0].isActive) } : undefined;
}

export async function listSalesAgentGenerations(userId: number, agentKey: SalesAgentKey, productId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (productId === null) return [];
  return db.select().from(generationHistory).where(and(
    eq(generationHistory.userId, userId),
    eq(generationHistory.salesAgentKey, agentKey),
    eq(generationHistory.salesProductId, productId),
  )).orderBy(desc(generationHistory.createdAt)).limit(60);
}

export async function getDailyBriefSources(userId: number, agentKey: SalesAgentKey, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rowsByStage = await Promise.all(SALES_DAILY_BRIEF_SOURCE_STAGES.map(async stage => {
    const rows = await db.select({
      id: generationHistory.id,
      result: generationHistory.result,
      createdAt: generationHistory.createdAt,
    }).from(generationHistory).where(and(
      eq(generationHistory.userId, userId),
      eq(generationHistory.salesAgentKey, agentKey),
      eq(generationHistory.salesProductId, productId),
      eq(generationHistory.workflowStage, stage),
    )).orderBy(desc(generationHistory.createdAt)).limit(1);
    return rows[0] ? [{ ...rows[0], stage: stage as SalesDailyBriefSourceStage }] : [];
  }));
  return rowsByStage.flat();
}
