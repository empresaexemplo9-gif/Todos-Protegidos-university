CREATE TABLE `catalog_items` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`sku` text DEFAULT '' NOT NULL,
	`system` text DEFAULT 'UNIVERSAL' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`unit` text DEFAULT 'un' NOT NULL,
	`purchase_price_cents` integer DEFAULT 0 NOT NULL,
	`sale_price_cents` integer DEFAULT 0 NOT NULL,
	`updated_by` text DEFAULT 'Equipe Sona' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budget_lines` (
	`catalog_item_id` text PRIMARY KEY NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`updated_by` text DEFAULT 'Equipe Sona' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items`(`id`) ON UPDATE no action ON DELETE cascade
);
