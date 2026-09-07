import { authRouter } from "./auth-router";
import { activityTypesRouter } from "./activity-types-router";
import { registrantsRouter } from "./registrants-router";
import { mentorsRouter } from "./mentors-router";
import { activitiesRouter } from "./activities-router";
import { mentorAssignmentsRouter } from "./mentor-assignments-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  activityTypes: activityTypesRouter,
  registrants: registrantsRouter,
  mentors: mentorsRouter,
  activities: activitiesRouter,
  mentorAssignments: mentorAssignmentsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
