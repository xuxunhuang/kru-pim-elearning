import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleSub: text("google_sub").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name_admin").notNull(),
  role: text("role", { enum: ["student", "owner", "admin", "teacher", "assistant", "recovery"] }).notNull().default("student"),
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
  type: text("type", { enum: ["video", "pdf", "quiz"] }).notNull(),
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

export const policyVersions = sqliteTable("policy_versions", { id:text("id").primaryKey(), scope:text("scope").notNull(), version:integer("version").notNull(), title:text("title").notNull(), body:text("body").notNull(), publishedAt:text("published_at").notNull() }, t => [uniqueIndex("policy_scope_version_unique").on(t.scope,t.version)]);
export const policyAcceptances = sqliteTable("policy_acceptances", { id:text("id").primaryKey(), userId:text("user_id").notNull().references(()=>users.id), policyVersionId:text("policy_version_id").notNull().references(()=>policyVersions.id), courseId:text("course_id").references(()=>courses.id), lessonId:text("lesson_id").references(()=>lessons.id), sessionId:text("session_id").references(()=>sessions.id), ipHash:text("ip_hash").notNull(), acceptedAt:text("accepted_at").notNull() }, t => [index("acceptance_user_course_idx").on(t.userId,t.courseId,t.acceptedAt)]);
export const usageEvents = sqliteTable("usage_events", { id:text("id").primaryKey(), userId:text("user_id").notNull().references(()=>users.id), lessonId:text("lesson_id").references(()=>lessons.id), sessionId:text("session_id").references(()=>sessions.id), eventType:text("event_type").notNull(), detailJson:text("detail_json"), ipHash:text("ip_hash").notNull(), occurredAt:text("occurred_at").notNull() }, t => [index("usage_user_time_idx").on(t.userId,t.occurredAt),index("usage_lesson_time_idx").on(t.lessonId,t.occurredAt)]);

export const siteSettings = sqliteTable("site_settings", {
  settingKey: text("setting_key").primaryKey(),
  valueJson: text("value_json").notNull(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: text("updated_at").notNull(),
});


export const quizzes = sqliteTable("quizzes", {
  id:text("id").primaryKey(), lessonId:text("lesson_id").notNull().references(()=>lessons.id), pdfAssetId:text("pdf_asset_id").notNull(), durationMinutes:integer("duration_minutes").notNull().default(60), maxAttempts:integer("max_attempts").notNull().default(1), passPercent:integer("pass_percent").notNull().default(50), showResultMode:text("show_result_mode",{enum:["hidden","score","review"]}).notNull().default("score"), shuffleQuestions:integer("shuffle_questions",{mode:"boolean"}).notNull().default(false), shuffleOptions:integer("shuffle_options",{mode:"boolean"}).notNull().default(false), instructions:text("instructions").notNull().default(""), createdAt:text("created_at").notNull(), updatedAt:text("updated_at").notNull(),
},t=>[uniqueIndex("quizzes_lesson_unique").on(t.lessonId)]);
export const quizQuestions = sqliteTable("quiz_questions", { id:text("id").primaryKey(),quizId:text("quiz_id").notNull().references(()=>quizzes.id),position:integer("position").notNull(),pdfPage:integer("pdf_page"),prompt:text("prompt").notNull().default(""),questionType:text("question_type").notNull(),labelStyle:text("label_style").notNull().default("latin"),optionsJson:text("options_json").notNull().default("[]"),correctAnswersJson:text("correct_answers_json").notNull().default("[]"),points:integer("points").notNull().default(1),explanation:text("explanation").notNull().default(""),manualGrading:integer("manual_grading",{mode:"boolean"}).notNull().default(false),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull() },t=>[uniqueIndex("quiz_question_position_unique").on(t.quizId,t.position)]);
export const quizAttempts = sqliteTable("quiz_attempts", { id:text("id").primaryKey(),quizId:text("quiz_id").notNull().references(()=>quizzes.id),userId:text("user_id").notNull().references(()=>users.id),sessionId:text("session_id").notNull().references(()=>sessions.id),attemptNumber:integer("attempt_number").notNull(),status:text("status",{enum:["in_progress","submitted","pending_review","graded"]}).notNull().default("in_progress"),startedAt:text("started_at").notNull(),expiresAt:text("expires_at").notNull(),submittedAt:text("submitted_at"),score:integer("score"),maxScore:integer("max_score"),percent:integer("percent"),suspiciousCount:integer("suspicious_count").notNull().default(0),teacherRemark:text("teacher_remark").notNull().default(""),deletedAt:text("deleted_at"),deletedBy:text("deleted_by"),deleteReason:text("delete_reason"),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull() },t=>[uniqueIndex("quiz_attempt_number_unique").on(t.quizId,t.userId,t.attemptNumber),index("quiz_attempt_report_idx").on(t.quizId,t.deletedAt,t.status)]);
export const quizAnswers = sqliteTable("quiz_answers", { id:text("id").primaryKey(),attemptId:text("attempt_id").notNull().references(()=>quizAttempts.id),questionId:text("question_id").notNull().references(()=>quizQuestions.id),answerJson:text("answer_json").notNull().default("null"),awardedPoints:integer("awarded_points"),isCorrect:integer("is_correct",{mode:"boolean"}),gradedBy:text("graded_by"),gradedAt:text("graded_at"),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull() },t=>[uniqueIndex("quiz_answer_unique").on(t.attemptId,t.questionId)]);
export const quizSecurityEvents = sqliteTable("quiz_security_events", { id:text("id").primaryKey(),attemptId:text("attempt_id").notNull().references(()=>quizAttempts.id),userId:text("user_id").notNull().references(()=>users.id),eventType:text("event_type").notNull(),detailJson:text("detail_json"),occurredAt:text("occurred_at").notNull() },t=>[index("quiz_security_attempt_idx").on(t.attemptId,t.occurredAt)]);
