CREATE TABLE `quizzes` (
  `id` text PRIMARY KEY NOT NULL,
  `lesson_id` text NOT NULL,
  `pdf_asset_id` text NOT NULL,
  `duration_minutes` integer NOT NULL DEFAULT 60,
  `max_attempts` integer NOT NULL DEFAULT 1,
  `pass_percent` integer NOT NULL DEFAULT 50,
  `show_result_mode` text NOT NULL DEFAULT 'score',
  `shuffle_questions` integer NOT NULL DEFAULT 0,
  `shuffle_options` integer NOT NULL DEFAULT 0,
  `instructions` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quizzes_lesson_unique` ON `quizzes` (`lesson_id`);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
  `id` text PRIMARY KEY NOT NULL,
  `quiz_id` text NOT NULL,
  `position` integer NOT NULL,
  `pdf_page` integer,
  `prompt` text NOT NULL DEFAULT '',
  `question_type` text NOT NULL,
  `label_style` text NOT NULL DEFAULT 'latin',
  `options_json` text NOT NULL DEFAULT '[]',
  `correct_answers_json` text NOT NULL DEFAULT '[]',
  `points` integer NOT NULL DEFAULT 1,
  `explanation` text NOT NULL DEFAULT '',
  `manual_grading` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_question_position_unique` ON `quiz_questions` (`quiz_id`,`position`);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
  `id` text PRIMARY KEY NOT NULL,
  `quiz_id` text NOT NULL,
  `user_id` text NOT NULL,
  `session_id` text NOT NULL,
  `attempt_number` integer NOT NULL,
  `status` text NOT NULL DEFAULT 'in_progress',
  `started_at` text NOT NULL,
  `expires_at` text NOT NULL,
  `submitted_at` text,
  `score` integer,
  `max_score` integer,
  `percent` integer,
  `suspicious_count` integer NOT NULL DEFAULT 0,
  `deleted_at` text,
  `deleted_by` text,
  `delete_reason` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_attempt_number_unique` ON `quiz_attempts` (`quiz_id`,`user_id`,`attempt_number`);
--> statement-breakpoint
CREATE INDEX `quiz_attempt_report_idx` ON `quiz_attempts` (`quiz_id`,`deleted_at`,`status`);
--> statement-breakpoint
CREATE TABLE `quiz_answers` (
  `id` text PRIMARY KEY NOT NULL,
  `attempt_id` text NOT NULL,
  `question_id` text NOT NULL,
  `answer_json` text NOT NULL DEFAULT 'null',
  `awarded_points` integer,
  `is_correct` integer,
  `graded_by` text,
  `graded_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts`(`id`),
  FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_answer_unique` ON `quiz_answers` (`attempt_id`,`question_id`);
--> statement-breakpoint
CREATE TABLE `quiz_security_events` (
  `id` text PRIMARY KEY NOT NULL,
  `attempt_id` text NOT NULL,
  `user_id` text NOT NULL,
  `event_type` text NOT NULL,
  `detail_json` text,
  `occurred_at` text NOT NULL,
  FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE INDEX `quiz_security_attempt_idx` ON `quiz_security_events` (`attempt_id`,`occurred_at`);
