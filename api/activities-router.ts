import { z } from "zod";
import { createRouter, authedQuery, mentorOrPsdmQuery, psdmQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { activities, activityVerifications, mentors, registrants, activityTypes, mentorAssignments } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const activitiesRouter = createRouter({
  // ─── CRUD Operations ──────────────────────────────────────────

  // Create activity (prospective member)
  create: authedQuery
    .input(
      z.object({
        registrantId: z.number(),
        activityTypeId: z.number(),
        activityName: z.string().min(1),
        activityDate: z.string(), // ISO date string
        activityDateEnd: z.string().optional(),
        role: z.string().optional(),
        location: z.string().min(1),
        documentationUrl: z.string().optional(),
        points: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [activity] = await db.insert(activities).values({
        registrantId: input.registrantId,
        activityTypeId: input.activityTypeId,
        activityName: input.activityName,
        activityDate: new Date(input.activityDate),
        activityDateEnd: input.activityDateEnd ? new Date(input.activityDateEnd) : null,
        role: input.role || null,
        location: input.location,
        documentationUrl: input.documentationUrl || null,
        points: input.points,
        status: "pending",
      });
      return activity;
    }),

  // Get activity by ID
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [activity] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, input.id));
      return activity || null;
    }),

  // List activities by registrant
  listByRegistrant: authedQuery
    .input(z.object({ registrantId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          id: activities.id,
          registrantId: activities.registrantId,
          activityTypeId: activities.activityTypeId,
          activityName: activities.activityName,
          activityDate: activities.activityDate,
          activityDateEnd: activities.activityDateEnd,
          role: activities.role,
          location: activities.location,
          documentationUrl: activities.documentationUrl,
          points: activities.points,
          status: activities.status,
          notes: activities.notes,
          submittedAt: activities.submittedAt,
          verifiedAt: activities.verifiedAt,
          activityTypeName: activityTypes.name,
        })
        .from(activities)
        .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
        .where(eq(activities.registrantId, input.registrantId))
        .orderBy(desc(activities.submittedAt));
    }),

  // List pending activities for a mentor's mentees
  listPendingForMentor: mentorOrPsdmQuery.query(async ({ ctx }) => {
    const db = getDb();
    
    // Get mentor ID from user ID
    const [mentor] = await db
      .select()
      .from(mentors)
      .where(eq(mentors.userId, ctx.user.id));

    if (!mentor) return [];

    // Get assigned mentee IDs
    const assignments = await db
      .select({ registrantId: mentorAssignments.registrantId })
      .from(mentorAssignments)
      .where(eq(mentorAssignments.mentorId, mentor.id));

    const menteeIds = assignments.map(a => a.registrantId);
    if (menteeIds.length === 0) return [];

    // Get pending activities for mentees
    const results = await db
      .select({
        id: activities.id,
        registrantId: activities.registrantId,
        activityTypeId: activities.activityTypeId,
        activityName: activities.activityName,
        activityDate: activities.activityDate,
        activityDateEnd: activities.activityDateEnd,
        role: activities.role,
        location: activities.location,
        documentationUrl: activities.documentationUrl,
        points: activities.points,
        status: activities.status,
        notes: activities.notes,
        submittedAt: activities.submittedAt,
        activityTypeName: activityTypes.name,
        registrantName: registrants.fullName,
      })
      .from(activities)
      .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
      .leftJoin(registrants, eq(activities.registrantId, registrants.id))
      .where(
        and(
          eq(activities.status, "pending"),
          sql`${activities.registrantId} IN (${menteeIds.join(",")})`
        )
      )
      .orderBy(desc(activities.submittedAt));

    return results;
  }),

  // List all activities (verified + pending) for a registrant with type info
  listWithDetails: authedQuery
    .input(z.object({ registrantId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          id: activities.id,
          activityName: activities.activityName,
          activityDate: activities.activityDate,
          activityDateEnd: activities.activityDateEnd,
          role: activities.role,
          location: activities.location,
          points: activities.points,
          status: activities.status,
          notes: activities.notes,
          submittedAt: activities.submittedAt,
          verifiedAt: activities.verifiedAt,
          activityTypeName: activityTypes.name,
        })
        .from(activities)
        .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
        .where(eq(activities.registrantId, input.registrantId))
        .orderBy(desc(activities.submittedAt));
    }),

  // Update activity
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        activityName: z.string().min(1).optional(),
        activityDate: z.string().optional(),
        activityDateEnd: z.string().optional(),
        role: z.string().optional(),
        location: z.string().optional(),
        documentationUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db
        .update(activities)
        .set({
          ...data,
          activityDate: data.activityDate ? new Date(data.activityDate) : undefined,
          activityDateEnd: data.activityDateEnd ? new Date(data.activityDateEnd) : null,
        })
        .where(eq(activities.id, id));
      return { success: true };
    }),

  // Delete activity (only if pending)
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(activities).where(eq(activities.id, input.id));
      return { success: true };
    }),

  // ─── Approval Workflow ────────────────────────────────────────

  // Verify activity (mentor approves/rejects)
  verify: mentorOrPsdmQuery
    .input(
      z.object({
        activityId: z.number(),
        action: z.enum(["approved", "rejected"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Get mentor record
      const [mentor] = await db
        .select()
        .from(mentors)
        .where(eq(mentors.userId, ctx.user.id));

      if (!mentor) {
        throw new Error("Mentor profile not found");
      }

      // Update activity status
      await db
        .update(activities)
        .set({
          status: input.action === "approved" ? "verified" : "rejected",
          notes: input.notes || null,
          verifiedAt: input.action === "approved" ? new Date() : null,
          verifiedBy: mentor.id,
        })
        .where(eq(activities.id, input.activityId));

      // Create verification log
      await db.insert(activityVerifications).values({
        activityId: input.activityId,
        mentorId: mentor.id,
        action: input.action,
        notes: input.notes || null,
      });

      return { success: true, action: input.action };
    }),

  // ─── Statistics ──────────────────────────────────────────────

  // Get point summary for a registrant
  getPointSummary: authedQuery
    .input(z.object({ registrantId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          total: sql<number>`COALESCE(SUM(${activities.points}), 0)`,
          count: sql<number>`COUNT(*)`,
          verified: sql<number>`SUM(CASE WHEN ${activities.status} = 'verified' THEN ${activities.points} ELSE 0 END)`,
          pending: sql<number>`SUM(CASE WHEN ${activities.status} = 'pending' THEN ${activities.points} ELSE 0 END)`,
        })
        .from(activities)
        .where(eq(activities.registrantId, input.registrantId));

      return result[0] || { total: 0, count: 0, verified: 0, pending: 0 };
    }),

  // Get all activities for PDF generation (verified only)
  getVerifiedActivities: authedQuery
    .input(z.object({ registrantId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          id: activities.id,
          activityName: activities.activityName,
          activityDate: activities.activityDate,
          activityDateEnd: activities.activityDateEnd,
          role: activities.role,
          location: activities.location,
          points: activities.points,
          status: activities.status,
          submittedAt: activities.submittedAt,
          verifiedAt: activities.verifiedAt,
          activityTypeName: activityTypes.name,
        })
        .from(activities)
        .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
        .where(
          and(
            eq(activities.registrantId, input.registrantId),
            eq(activities.status, "verified")
          )
        )
        .orderBy(desc(activities.verifiedAt));
    }),

  // ─── Admin: All Activities ──────────────────────────────────

  listAll: psdmQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: activities.id,
        activityName: activities.activityName,
        activityDate: activities.activityDate,
        role: activities.role,
        location: activities.location,
        points: activities.points,
        status: activities.status,
        submittedAt: activities.submittedAt,
        verifiedAt: activities.verifiedAt,
        registrantName: registrants.fullName,
        activityTypeName: activityTypes.name,
      })
      .from(activities)
      .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
      .leftJoin(registrants, eq(activities.registrantId, registrants.id))
      .orderBy(desc(activities.submittedAt));
  }),
});
