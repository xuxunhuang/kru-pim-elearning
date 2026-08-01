CREATE TABLE `site_settings` (
  `setting_key` text PRIMARY KEY NOT NULL,
  `value_json` text NOT NULL,
  `updated_by` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
