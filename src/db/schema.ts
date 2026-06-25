import { pgTable, serial, text, integer, boolean, timestamp, uuid, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users Profile Table (links to Supabase auth.users)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull(), // Linked to auth.users.id
  name: text("name").notNull(),
  nim: text("nim").unique().notNull(),
  role: text("role", { enum: ["admin", "student"] }).default("student").notNull(),
  faculty: text("faculty"),
  major: text("major"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_role").on(table.role),
]);

// 2. Activities (Ormawa / Student Organizations)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"), // Nullable for empty seeders
  category: text("category").default("Akademik"), // Default for compatibility
  quota: integer("quota").default(0).notNull(), // Ormawa membership quota
  status: text("status", { 
    enum: ["open", "closed"] 
  }).default("closed").notNull(), // Open/closed for membership registration
  registered: integer("registered").default(0).notNull(), // Total approved members
  registrationStart: timestamp("registration_start"),
  registrationEnd: timestamp("registration_end"),
  whatsappLink: text("whatsapp_link"),
  imageUrl: text("image_url"),
  orgType: text("org_type", { 
    enum: ["BEM Universitas", "BEM Fakultas", "BPM", "Himpunan Mahasiswa", "UKM"] 
  }).default("UKM").notNull(),
  organizationLevel: text("organization_level").default("Universitas").notNull(),
  scopeName: text("scope_name"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_activities_created_by").on(table.createdBy),
  index("idx_activities_status").on(table.status),
  index("idx_activities_org_type").on(table.orgType),
]);

// 3. Activity User Registration Pivot Table (Ormawa Membership)
export const activityUser = pgTable("activity_user", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }).notNull(),
  activityRole: text("activity_role", { 
    enum: ["member", "manager", "leader"] 
  }).default("member").notNull(),
  status: text("status", { 
    enum: ["pending", "approved", "rejected"] 
  }).default("pending").notNull(),
  motivation: text("motivation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_activity_user_user").on(table.userId),
  index("idx_activity_user_activity").on(table.activityId),
  index("idx_activity_user_status").on(table.status),
  index("idx_activity_user_composite").on(table.userId, table.activityId),
  unique("activity_user_user_activity_unique").on(table.userId, table.activityId),
]);

// 4. Events (Kegiatan / Program Kerja / Delegasi Lomba)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category", { 
    enum: ["Program Kerja", "Delegasi/Lomba"] 
  }).default("Program Kerja").notNull(),
  location: text("location"),
  externalOrganizer: text("external_organizer"),
  quota: integer("quota"), // Nullable for Delegasi/Lomba
  registered: integer("registered").default(0).notNull(), // Participants registered
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status", { 
    enum: ["draft", "pending_advisor", "pending_dean", "open", "closed", "rejected"] 
  }).default("draft").notNull(), // Proposal approval & event state
  eventState: text("event_state", {
    enum: ["Akan Datang", "Sedang Berlangsung", "Selesai"]
  }).default("Akan Datang").notNull(), // Actual execution phase
  isAchieved: boolean("is_achieved").default(false).notNull(),
  achievementPhoto: text("achievement_photo"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_events_activity").on(table.activityId),
  index("idx_events_status").on(table.status),
  index("idx_events_state").on(table.eventState),
  index("idx_events_created_by").on(table.createdBy),
]);

// 5. Event User Pivot Table (Event Participant Registrations)
export const eventUser = pgTable("event_user", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  status: text("status", { 
    enum: ["pending", "approved", "rejected"] 
  }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_event_user_user").on(table.userId),
  index("idx_event_user_event").on(table.eventId),
  index("idx_event_user_status").on(table.status),
  index("idx_event_user_composite").on(table.userId, table.eventId),
  unique("event_user_user_event_unique").on(table.userId, table.eventId),
]);

// 6. Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isUrgent: boolean("is_urgent").default(false).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_announcements_activity").on(table.activityId),
]);

// 7. Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  rank: text("rank").notNull(),
  year: integer("year").notNull(),
  achievementDate: timestamp("achievement_date"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_achievements_activity").on(table.activityId),
]);

// 8. Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_is_read").on(table.isRead),
]);

// ---- Relations Config ----

export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(activityUser),
  eventRegistrations: many(eventUser),
  createdActivities: many(activities),
  createdEvents: many(events),
  announcements: many(announcements),
  notifications: many(notifications),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  creator: one(users, {
    fields: [activities.createdBy],
    references: [users.id],
  }),
  registrations: many(activityUser),
  events: many(events),
  announcements: many(announcements),
  achievements: many(achievements),
}));

export const activityUserRelations = relations(activityUser, ({ one }) => ({
  user: one(users, {
    fields: [activityUser.userId],
    references: [users.id],
  }),
  activity: one(activities, {
    fields: [activityUser.activityId],
    references: [activities.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  activity: one(activities, {
    fields: [events.activityId],
    references: [activities.id],
  }),
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  registrations: many(eventUser),
}));

export const eventUserRelations = relations(eventUser, ({ one }) => ({
  user: one(users, {
    fields: [eventUser.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventUser.eventId],
    references: [events.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  activity: one(activities, {
    fields: [announcements.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [announcements.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  activity: one(activities, {
    fields: [achievements.activityId],
    references: [activities.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
