CREATE TABLE `rentals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`property_type` text DEFAULT 'apartment' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`street` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`zip` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`max_guests` integer NOT NULL,
	`bedrooms` integer DEFAULT 1 NOT NULL,
	`beds` integer DEFAULT 1 NOT NULL,
	`bathrooms` integer DEFAULT 1 NOT NULL,
	`check_in_from` text DEFAULT '16:00' NOT NULL,
	`check_in_to` text DEFAULT '22:00' NOT NULL,
	`check_out_until` text DEFAULT '10:00' NOT NULL,
	`min_nights` integer DEFAULT 1 NOT NULL,
	`max_nights` integer DEFAULT 365 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rentals_slug_unique` ON `rentals` (`slug`);