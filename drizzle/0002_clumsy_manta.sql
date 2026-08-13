CREATE TABLE `budget_items` (
	`id` text PRIMARY KEY NOT NULL,
	`budget_id` text NOT NULL,
	`catalog_item_id` text,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`sku` text DEFAULT '' NOT NULL,
	`unit` text DEFAULT 'un' NOT NULL,
	`environment` text DEFAULT 'Geral' NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`purchase_price_cents` integer DEFAULT 0 NOT NULL,
	`sale_price_cents` integer DEFAULT 0 NOT NULL,
	`discount_percent` real DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`client` text DEFAULT 'Novo cliente' NOT NULL,
	`project` text DEFAULT 'Novo projeto' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`validity_days` integer DEFAULT 10 NOT NULL,
	`discount_percent` real DEFAULT 0 NOT NULL,
	`adjustment_cents` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by` text DEFAULT 'Equipe Sona' NOT NULL,
	`updated_by` text DEFAULT 'Equipe Sona' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_code_unique` ON `budgets` (`code`);