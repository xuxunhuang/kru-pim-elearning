CREATE TABLE `policy_versions` (`id` text PRIMARY KEY NOT NULL,`scope` text NOT NULL,`version` integer NOT NULL,`title` text NOT NULL,`body` text NOT NULL,`published_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `policy_scope_version_unique` ON `policy_versions` (`scope`,`version`);
--> statement-breakpoint
CREATE TABLE `policy_acceptances` (`id` text PRIMARY KEY NOT NULL,`user_id` text NOT NULL,`policy_version_id` text NOT NULL,`course_id` text,`lesson_id` text,`session_id` text,`ip_hash` text NOT NULL,`accepted_at` text NOT NULL,FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),FOREIGN KEY (`policy_version_id`) REFERENCES `policy_versions`(`id`),FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`),FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`),FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`));
--> statement-breakpoint
CREATE INDEX `acceptance_user_course_idx` ON `policy_acceptances` (`user_id`,`course_id`,`accepted_at`);
--> statement-breakpoint
CREATE TABLE `usage_events` (`id` text PRIMARY KEY NOT NULL,`user_id` text NOT NULL,`lesson_id` text,`session_id` text,`event_type` text NOT NULL,`detail_json` text,`ip_hash` text NOT NULL,`occurred_at` text NOT NULL,FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`),FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`));
--> statement-breakpoint
CREATE INDEX `usage_user_time_idx` ON `usage_events` (`user_id`,`occurred_at`);
--> statement-breakpoint
CREATE INDEX `usage_lesson_time_idx` ON `usage_events` (`lesson_id`,`occurred_at`);
