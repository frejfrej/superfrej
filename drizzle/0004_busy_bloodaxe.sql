CREATE TABLE `rental_pricing` (
	`rental_id` text PRIMARY KEY NOT NULL,
	`base_cents` integer DEFAULT 10000 NOT NULL,
	`weekend_cents` integer,
	`cleaning_fee_cents` integer DEFAULT 0 NOT NULL,
	`city_tax_cents` integer DEFAULT 0 NOT NULL,
	`weekly_discount_pct` integer DEFAULT 0 NOT NULL,
	`monthly_discount_pct` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rental_seasons` (
	`id` text PRIMARY KEY NOT NULL,
	`rental_id` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`nightly_cents` integer NOT NULL,
	`weekend_cents` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON UPDATE no action ON DELETE no action
);
