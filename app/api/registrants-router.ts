import { z } from "zod";
import { createRouter, publicQuery, authedQuery, psdmQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { registrants } from "@db/schema";
import { eq } from "drizzle-orm";

export const registrantsRouter = createRouter({
  // Create a new registrant (used during initial registration)
  create: publicQuery
    .input(
      z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        year: z.string().min(1),
        major: z.string().min(1),
        faculty: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [registrant] = await db.insert(registrants).values({
        fullName: input.fullName,
        email: input.email,
        year: input.year,
        major: input.major,
        faculty: input.faculty,
        phone: input.phone,
      });
      return registrant;
    }),

  // Get registrant by email
  getByEmail: publicQuery
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [registrant] = await db
        .select()
        .from(registrants)
        .where(eq(registrants.email, input.email));
      return registrant || null;
    }),

  // List all registrants (PSDM only)
  list: psdmQuery.query(async () => {
    const db = getDb();
    return db.select().from(registrants).orderBy(registrants.fullName);
  }),

  // Get registrant by user ID
  getByUserId: authedQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [registrant] = await db
        .select()
        .from(registrants)
        .where(eq(registrants.userId, input.userId));
      return registrant || null;
    }),

  // Update registrant's userId (when account is linked)
  linkUser: publicQuery
    .input(
      z.object({
        registrantId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(registrants)
        .set({ userId: input.userId })
        .where(eq(registrants.id, input.registrantId));
      return { success: true };
    }),

  // Bulk create registrants (for CSV/spreadsheet import)
  bulkCreate: psdmQuery
    .input(
      z.array(
        z.object({
          fullName: z.string().min(1),
          email: z.string().email(),
          year: z.string().min(1),
          major: z.string().min(1),
          faculty: z.string().optional(),
          phone: z.string().optional(),
        })
      )
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(registrants).values(input);
      return { count: input.length };
    }),

  // Get unassigned registrants (no mentor)
  getUnassigned: psdmQuery.query(async () => {
    const db = getDb();
    // This requires a left join with mentorAssignments - handled in a more complex query
    // For now, return all active registrants
    return db
      .select()
      .from(registrants)
      .where(eq(registrants.status, "active"))
      .orderBy(registrants.fullName);
  }),
});
