import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { activityTypes } from "@db/schema";

export const activityTypesRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(activityTypes).orderBy(activityTypes.number);
  }),
});
