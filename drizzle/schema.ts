import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  externalReference: varchar("externalReference", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "in_process", "approved", "rejected", "cancelled", "refunded", "unknown"]).default("pending").notNull(),
  totalAmountCents: int("totalAmountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  payerEmail: varchar("payerEmail", { length: 320 }),
  preferenceId: varchar("preferenceId", { length: 128 }),
  paymentId: varchar("paymentId", { length: 128 }),
  paymentStatus: varchar("paymentStatus", { length: 64 }),
  paymentStatusDetail: varchar("paymentStatusDetail", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPriceCents: int("unitPriceCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
