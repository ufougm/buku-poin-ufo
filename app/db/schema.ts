import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  date,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  // Three roles: user (prospective member), mentor, psdm (admin)
  role: mysqlEnum("role", ["user", "mentor", "psdm"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Activity Types (Master Data) ─────────────────────────────────
export const activityTypes = mysqlTable("activity_types", {
  id: serial("id").primaryKey(),
  number: int("number").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  points: int("points").notNull(),
  requiresRole: mysqlEnum("requires_role", ["yes", "no"]).default("no").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityType = typeof activityTypes.$inferSelect;
export type InsertActivityType = typeof activityTypes.$inferInsert;

// ─── Registrants (Prospective Members) ────────────────────────────
export const registrants = mysqlTable("registrants", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }), // links to users when account is created
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  year: varchar("year", { length: 20 }).notNull(), // e.g. "2024"
  major: varchar("major", { length: 255 }).notNull(),
  faculty: varchar("faculty", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  status: mysqlEnum("status", ["active", "inactive", "graduated"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Registrant = typeof registrants.$inferSelect;
export type InsertRegistrant = typeof registrants.$inferInsert;

// ─── Mentors ──────────────────────────────────────────────────────
export const mentors = mysqlTable("mentors", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nip: varchar("nip", { length: 50 }), // NIP or identifier
  expertise: varchar("expertise", { length: 255 }),
  maxMentees: int("max_mentees").default(10).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Mentor = typeof mentors.$inferSelect;
export type InsertMentor = typeof mentors.$inferInsert;

// ─── Mentor Assignments ───────────────────────────────────────────
export const mentorAssignments = mysqlTable("mentor_assignments", {
  id: serial("id").primaryKey(),
  mentorId: bigint("mentor_id", { mode: "number", unsigned: true }).notNull(),
  registrantId: bigint("registrant_id", { mode: "number", unsigned: true }).notNull(),
  assignedBy: bigint("assigned_by", { mode: "number", unsigned: true }), // PSDM who assigned
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export type MentorAssignment = typeof mentorAssignments.$inferSelect;
export type InsertMentorAssignment = typeof mentorAssignments.$inferInsert;

// ─── Activities ───────────────────────────────────────────────────
export const activities = mysqlTable("activities", {
  id: serial("id").primaryKey(),
  registrantId: bigint("registrant_id", { mode: "number", unsigned: true }).notNull(),
  activityTypeId: bigint("activity_type_id", { mode: "number", unsigned: true }).notNull(),
  activityName: varchar("activity_name", { length: 255 }).notNull(),
  activityDate: date("activity_date").notNull(),
  activityDateEnd: date("activity_date_end"), // for multi-day events
  role: varchar("role", { length: 255 }), // conditional: only for committee/org activities
  location: varchar("location", { length: 255 }).notNull(),
  documentationUrl: text("documentation_url"), // file upload URL
  points: int("points").notNull(),
  status: mysqlEnum("status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  notes: text("notes"), // mentor notes on rejection
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: bigint("verified_by", { mode: "number", unsigned: true }),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// ─── Activity Verifications (Audit Log) ──────────────────────────
export const activityVerifications = mysqlTable("activity_verifications", {
  id: serial("id").primaryKey(),
  activityId: bigint("activity_id", { mode: "number", unsigned: true }).notNull(),
  mentorId: bigint("mentor_id", { mode: "number", unsigned: true }).notNull(),
  action: mysqlEnum("action", ["approved", "rejected"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityVerification = typeof activityVerifications.$inferSelect;
export type InsertActivityVerification = typeof activityVerifications.$inferInsert;
