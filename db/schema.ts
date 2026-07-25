import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleSub: text("google_sub").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name_admin").notNull(),
  role: text("role", { enum: ["student", "owner", "recovery"] }).notNull().default("student"),
  status: text("status", { enum: ["active", "suspended", "archived"] }).notNull().default("active"),
  maxDevices: integer("max_devices").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("users_google_sub_unique").on(table.googleSub),
  uniqueIndex("users_email_unique").on(table.email),
]);

export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicKey: text("public_key"),
  label: text("label").notNull(),
  userAgentHash: text("user_agent_hash").notNull(),
  status: text("status", { enum: ["pending", "approved", "revoked"] }).notNull().default("pending"),
  createdAt: text("created_at").notNull(),
  lastSeenAt: text("last_seen_at"),
  revokedAt: text("revoked_at"),
}, (table) => [index("devices_user_status_idx").on(table.userId, table.status)]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  deviceId: text("device_id").notNull().references(() => devices.id),
  tokenHash: text("token_hash").notNull(),
  generation: integer("generation").notNull().default(1),
  expiresAt: text("expires_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("sessions_token_unique").on(table.tokenHash), index("sessions_active_idx").on(table.userId, table.revokedAt)]);

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  visibilityMode: text("visibility_mode", { enum: ["show_locked", "hide_locked"] }).notNull().default("show_locked"),
  coverRef: text("cover_ref"),
  version: integer("version").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("courses_slug_unique").on(table.slug), index("courses_status_idx").on(table.status)]);

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  type: text("type", { enum: ["video", "pdf"] }).notNull(),
  providerAssetId: text("provider_asset_id").notNull(),
  position: integer("position").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("lessons_course_position_idx").on(table.courseId, table.position)]);

export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  status: text("status", { enum: ["active", "revoked", "expired"] }).notNull().default("active"),
  assignedBy: text("assigned_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("enrollment_user_course_unique").on(table.userId, table.courseId),
  index("enrollment_window_idx").on(table.userId, table.status, table.startsAt, table.endsAt),
]);

export const accessOverrides = sqliteTable("access_overrides", {
  id: text("id").primaryKey(),
  enrollmentId: text("enrollment_id").notNull().references(() => enrollments.id),
  lessonId: text("lesson_id").notNull().references(() => lessons.id),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("access_override_unique").on(table.enrollmentId, table.lessonId)]);

export const videoProgress = sqliteTable("video_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  lessonId: text("lesson_id").notNull().references(() => lessons.id),
  positionSeconds: integer("position_seconds").notNull().default(0),
  reachedEnd: integer("reached_end", { mode: "boolean" }).notNull().default(false),
  playCount: integer("play_count").notNull().default(0),
  lastPlayedAt: text("last_played_at").notNull(),
}, (table) => [uniqueIndex("progress_user_lesson_unique").on(table.userId, table.lessonId)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  ipHash: text("ip_hash").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("audit_entity_idx").on(table.entityType, table.entityId, table.createdAt)]);
