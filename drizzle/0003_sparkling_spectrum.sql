CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`client` text DEFAULT 'Novo cliente' NOT NULL,
	`project` text DEFAULT 'Novo projeto' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`data_json` text NOT NULL,
	`manual_html` text DEFAULT '' NOT NULL,
	`public_token` text,
	`accepted_by` text DEFAULT '' NOT NULL,
	`accepted_email` text DEFAULT '' NOT NULL,
	`accepted_document` text DEFAULT '' NOT NULL,
	`accepted_at` text,
	`created_by` text DEFAULT 'Equipe Sona' NOT NULL,
	`updated_by` text DEFAULT 'Equipe Sona' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposals_code_unique` ON `proposals` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `proposals_public_token_unique` ON `proposals` (`public_token`);