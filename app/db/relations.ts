import { relations } from "drizzle-orm";
import {
  users,
  activityTypes,
  registrants,
  mentors,
  mentorAssignments,
  activities,
  activityVerifications,
} from "./schema";

// ─── Users Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ one }) => ({
  mentorProfile: one(mentors, {
    fields: [users.id],
    references: [mentors.userId],
  }),
  registrantProfile: one(registrants, {
    fields: [users.id],
    references: [registrants.userId],
  }),
}));

// ─── Registrants Relations ────────────────────────────────────────
export const registrantsRelations = relations(registrants, ({ one, many }) => ({
  user: one(users, {
    fields: [registrants.userId],
    references: [users.id],
  }),
  mentorAssignment: one(mentorAssignments, {
    fields: [registrants.id],
    references: [mentorAssignments.registrantId],
  }),
  activities: many(activities),
}));

// ─── Mentors Relations ────────────────────────────────────────────
export const mentorsRelations = relations(mentors, ({ one, many }) => ({
  user: one(users, {
    fields: [mentors.userId],
    references: [users.id],
  }),
  assignments: many(mentorAssignments),
  verifications: many(activityVerifications),
}));

// ─── Mentor Assignments Relations ─────────────────────────────────
export const mentorAssignmentsRelations = relations(mentorAssignments, ({ one }) => ({
  mentor: one(mentors, {
    fields: [mentorAssignments.mentorId],
    references: [mentors.id],
  }),
  registrant: one(registrants, {
    fields: [mentorAssignments.registrantId],
    references: [registrants.id],
  }),
}));

// ─── Activity Types Relations ─────────────────────────────────────
export const activityTypesRelations = relations(activityTypes, ({ many }) => ({
  activities: many(activities),
}));

// ─── Activities Relations ─────────────────────────────────────────
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  registrant: one(registrants, {
    fields: [activities.registrantId],
    references: [registrants.id],
  }),
  activityType: one(activityTypes, {
    fields: [activities.activityTypeId],
    references: [activityTypes.id],
  }),
  verifications: many(activityVerifications),
}));

// ─── Activity Verifications Relations ─────────────────────────────
export const activityVerificationsRelations = relations(activityVerifications, ({ one }) => ({
  activity: one(activities, {
    fields: [activityVerifications.activityId],
    references: [activities.id],
  }),
  mentor: one(mentors, {
    fields: [activityVerifications.mentorId],
    references: [mentors.id],
  }),
}));
