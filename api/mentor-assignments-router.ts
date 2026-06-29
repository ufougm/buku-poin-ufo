import { z } from "zod";
import { createRouter, mentorOrPsdmQuery, psdmQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { mentorAssignments, mentors, registrants } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export const mentorAssignmentsRouter = createRouter({
  // Assign mentor to registrant (PSDM only)
  assign: psdmQuery
    .input(
      z.object({
        mentorId: z.number(),
        registrantId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Check if already assigned
      const [existing] = await db
        .select()
        .from(mentorAssignments)
        .where(eq(mentorAssignments.registrantId, input.registrantId));

      if (existing) {
        // Reassign - update
        await db
          .update(mentorAssignments)
          .set({
            mentorId: input.mentorId,
            assignedBy: ctx.user.id,
            assignedAt: new Date(),
          })
          .where(eq(mentorAssignments.id, existing.id));
      } else {
        // New assignment
        await db.insert(mentorAssignments).values({
          mentorId: input.mentorId,
          registrantId: input.registrantId,
          assignedBy: ctx.user.id,
        });
      }

      return { success: true };
    }),

  // Bulk assign mentors to registrants
  bulkAssign: psdmQuery
    .input(
      z.array(
        z.object({
          mentorId: z.number(),
          registrantId: z.number(),
        })
      )
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      for (const assignment of input) {
        // Check if already assigned
        const [existing] = await db
          .select()
          .from(mentorAssignments)
          .where(eq(mentorAssignments.registrantId, assignment.registrantId));

        if (existing) {
          await db
            .update(mentorAssignments)
            .set({
              mentorId: assignment.mentorId,
              assignedBy: ctx.user.id,
              assignedAt: new Date(),
            })
            .where(eq(mentorAssignments.id, existing.id));
        } else {
          await db.insert(mentorAssignments).values({
            mentorId: assignment.mentorId,
            registrantId: assignment.registrantId,
            assignedBy: ctx.user.id,
          });
        }
      }

      return { count: input.length };
    }),

  // Remove assignment (PSDM only)
  remove: psdmQuery
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(mentorAssignments)
        .where(eq(mentorAssignments.id, input.assignmentId));
      return { success: true };
    }),

  // Get mentor's assigned mentees
  getMentees: mentorOrPsdmQuery.query(async ({ ctx }) => {
    const db = getDb();

    const [mentor] = await db
      .select()
      .from(mentors)
      .where(eq(mentors.userId, ctx.user.id));

    if (!mentor) return [];

    return db
      .select({
        assignmentId: mentorAssignments.id,
        registrantId: registrants.id,
        registrantName: registrants.fullName,
        registrantEmail: registrants.email,
        registrantYear: registrants.year,
        registrantMajor: registrants.major,
        assignedAt: mentorAssignments.assignedAt,
      })
      .from(mentorAssignments)
      .innerJoin(registrants, eq(mentorAssignments.registrantId, registrants.id))
      .where(eq(mentorAssignments.mentorId, mentor.id))
      .orderBy(registrants.fullName);
  }),

  // Get all assignments (PSDM only)
  listAll: psdmQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        assignmentId: mentorAssignments.id,
        mentorId: mentors.id,
        mentorName: mentors.fullName,
        mentorEmail: mentors.email,
        registrantId: registrants.id,
        registrantName: registrants.fullName,
        registrantEmail: registrants.email,
        registrantYear: registrants.year,
        registrantMajor: registrants.major,
        assignedAt: mentorAssignments.assignedAt,
      })
      .from(mentorAssignments)
      .innerJoin(mentors, eq(mentorAssignments.mentorId, mentors.id))
      .innerJoin(registrants, eq(mentorAssignments.registrantId, registrants.id))
      .orderBy(mentors.fullName, registrants.fullName);
  }),

  // Get unassigned registrants
  getUnassigned: psdmQuery.query(async () => {
    const db = getDb();
    
    // Get all registrant IDs that have assignments
    const assignedIds = await db
      .select({ registrantId: mentorAssignments.registrantId })
      .from(mentorAssignments);

    const assignedIdSet = new Set(assignedIds.map(a => a.registrantId));

    // Get all active registrants
    const allRegistrants = await db
      .select()
      .from(registrants)
      .where(eq(registrants.status, "active"))
      .orderBy(registrants.fullName);

    // Filter out assigned ones
    return allRegistrants.filter(r => !assignedIdSet.has(r.id));
  }),

  // Get mentor mentee count
  getMentorStats: psdmQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        mentorId: mentorAssignments.mentorId,
        mentorName: mentors.fullName,
        menteeCount: sql<number>`COUNT(${mentorAssignments.registrantId})`,
        maxMentees: mentors.maxMentees,
      })
      .from(mentorAssignments)
      .innerJoin(mentors, eq(mentorAssignments.mentorId, mentors.id))
      .groupBy(mentorAssignments.mentorId)
      .orderBy(mentors.fullName);
  }),
});
