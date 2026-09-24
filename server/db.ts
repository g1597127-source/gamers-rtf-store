import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertOrder, InsertOrderItem, orders, orderItems, User, users, InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

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
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createOrderWithItems(order: InsertOrder, items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  return db.transaction(async (tx) => {
    const orderResult = await tx.insert(orders).values(order);
    const orderId = Number(orderResult[0].insertId);
    if (items.length > 0) {
      await tx.insert(orderItems).values(items.map((item) => ({ ...item, orderId })));
    }
    return orderId;
  });
}

export async function getOrderByExternalReference(externalReference: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.externalReference, externalReference)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function listRecentOrders(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function updateOrderPayment(input: {
  externalReference: string;
  status: "pending" | "in_process" | "approved" | "rejected" | "cancelled" | "refunded" | "unknown";
  paymentId?: string;
  paymentStatus?: string;
  paymentStatusDetail?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  await db.update(orders).set({
    status: input.status,
    paymentId: input.paymentId,
    paymentStatus: input.paymentStatus,
    paymentStatusDetail: input.paymentStatusDetail,
    updatedAt: new Date(),
  }).where(eq(orders.externalReference, input.externalReference));
}
