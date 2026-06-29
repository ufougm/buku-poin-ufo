import { z } from "zod";
import { createRouter, psdmQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  users,
  mentors,
  registrants,
  activities,
  activityTypes,
  mentorAssignments,
  activityVerifications,
} from "@db/schema";
import { eq, sql, desc } from "drizzle-orm";

export const adminRouter = createRouter({
  // ─── Dashboard Statistics ─────────────────────────────────────

  stats: psdmQuery.query(async () => {
    const db = getDb();

    const [userCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);
    
    const [mentorCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(mentors);

    const [registrantCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(registrants);

    const [activityCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(activities);

    const [pendingCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(activities)
      .where(eq(activities.status, "pending"));

    const [verifiedCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(activities)
      .where(eq(activities.status, "verified"));

    const [totalPoints] = await db
      .select({ total: sql<number>`COALESCE(SUM(${activities.points}), 0)` })
      .from(activities)
      .where(eq(activities.status, "verified"));

    const [assignmentCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(mentorAssignments);

    return {
      users: userCount.count || 0,
      mentors: mentorCount.count || 0,
      registrants: registrantCount.count || 0,
      activities: activityCount.count || 0,
      pendingActivities: pendingCount.count || 0,
      verifiedActivities: verifiedCount.count || 0,
      totalPoints: totalPoints.total || 0,
      mentorAssignments: assignmentCount.count || 0,
    };
  }),

  // ─── Recent Activities ────────────────────────────────────────

  recentActivities: psdmQuery
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit || 10;
      return db
        .select({
          id: activities.id,
          activityName: activities.activityName,
          status: activities.status,
          points: activities.points,
          submittedAt: activities.submittedAt,
          registrantName: registrants.fullName,
          activityTypeName: activityTypes.name,
        })
        .from(activities)
        .leftJoin(registrants, eq(activities.registrantId, registrants.id))
        .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
        .orderBy(desc(activities.submittedAt))
        .limit(limit);
    }),

  // ─── Top Registrants by Points ────────────────────────────────

  topRegistrants: psdmQuery
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit || 10;
      return db
        .select({
          registrantId: registrants.id,
          registrantName: registrants.fullName,
          totalPoints: sql<number>`COALESCE(SUM(${activities.points}), 0)`,
          activityCount: sql<number>`COUNT(${activities.id})`,
        })
        .from(registrants)
        .leftJoin(activities, eq(registrants.id, activities.registrantId))
        .where(eq(activities.status, "verified"))
        .groupBy(registrants.id)
        .orderBy(sql`totalPoints DESC`)
        .limit(limit);
    }),

  // ─── Activity Distribution by Type ────────────────────────────

  activityDistribution: psdmQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        activityTypeName: activityTypes.name,
        count: sql<number>`COUNT(${activities.id})`,
        totalPoints: sql<number>`COALESCE(SUM(${activities.points}), 0)`,
      })
      .from(activities)
      .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
      .where(eq(activities.status, "verified"))
      .groupBy(activities.activityTypeId)
      .orderBy(sql`totalPoints DESC`);
  }),

  // ─── Mentor Performance ───────────────────────────────────────

  mentorPerformance: psdmQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        mentorId: mentors.id,
        mentorName: mentors.fullName,
        menteeCount: sql<number>`COUNT(DISTINCT ${mentorAssignments.registrantId})`,
        verifiedCount: sql<number>`COUNT(DISTINCT CASE WHEN ${activities.status} = 'verified' THEN ${activities.id} END)`,
      })
      .from(mentors)
      .leftJoin(mentorAssignments, eq(mentors.id, mentorAssignments.mentorId))
      .leftJoin(activities, eq(mentorAssignments.registrantId, activities.registrantId))
      .groupBy(mentors.id)
      .orderBy(mentors.fullName);
  }),

  // ─── Verification Log ─────────────────────────────────────────

  verificationLog: psdmQuery
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit || 20;
      return db
        .select({
          id: activityVerifications.id,
          action: activityVerifications.action,
          notes: activityVerifications.notes,
          createdAt: activityVerifications.createdAt,
          activityName: activities.activityName,
          mentorName: mentors.fullName,
          registrantName: registrants.fullName,
        })
        .from(activityVerifications)
        .leftJoin(activities, eq(activityVerifications.activityId, activities.id))
        .leftJoin(mentors, eq(activityVerifications.mentorId, mentors.id))
        .leftJoin(registrants, eq(activities.registrantId, registrants.id))
        .orderBy(desc(activityVerifications.createdAt))
        .limit(limit);
    }),

  // ─── User Management ──────────────────────────────────────────

  listUsers: psdmQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }),

  updateUserRole: psdmQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "mentor", "psdm"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),
});
