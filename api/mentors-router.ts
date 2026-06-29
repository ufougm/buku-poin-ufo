import { z } from "zod";
import { createRouter, authedQuery, psdmQuery, mentorOrPsdmQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { mentors, users } from "@db/schema";
import { eq } from "drizzle-orm";

export const mentorsRouter = createRouter({
  // Create mentor (PSDM only)
  create: psdmQuery
    .input(
      z.object({
        userId: z.number(),
        fullName: z.string().min(1),
        email: z.string().email(),
        nip: z.string().optional(),
        expertise: z.string().optional(),
        maxMentees: z.number().default(10),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Update user role to mentor
      await db
        .update(users)
        .set({ role: "mentor" })
        .where(eq(users.id, input.userId));

      const [mentor] = await db.insert(mentors).values({
        userId: input.userId,
        fullName: input.fullName,
        email: input.email,
        nip: input.nip,
        expertise: input.expertise,
        maxMentees: input.maxMentees,
      });
      return mentor;
    }),

  // List all mentors
  list: psdmQuery.query(async () => {
    const db = getDb();
    return db.select().from(mentors).orderBy(mentors.fullName);
  }),

  // Get mentor by user ID
  getByUserId: authedQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [mentor] = await db
        .select()
        .from(mentors)
        .where(eq(mentors.userId, input.userId));
      return mentor || null;
    }),

  // Get current mentor's profile
  me: mentorOrPsdmQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [mentor] = await db
      .select()
      .from(mentors)
      .where(eq(mentors.userId, ctx.user.id));
    return mentor || null;
  }),

  // Update mentor
  update: psdmQuery
    .input(
      z.object({
        id: z.number(),
        fullName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        nip: z.string().optional(),
        expertise: z.string().optional(),
        maxMentees: z.number().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(mentors).set(data).where(eq(mentors.id, id));
      return { success: true };
    }),

  // Delete mentor
  delete: psdmQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(mentors).where(eq(mentors.id, input.id));
      return { success: true };
    }),
});
