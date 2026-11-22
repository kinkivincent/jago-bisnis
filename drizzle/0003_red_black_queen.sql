CREATE TABLE `sales_monthly_metrics` (
	`userId` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`targetRevenue` bigint NOT NULL DEFAULT 0,
	`actualRevenue` bigint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_monthly_metrics_userId_period_pk` PRIMARY KEY(`userId`,`period`)
);
--> statement-breakpoint
CREATE TABLE `sales_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`targetAudience` varchar(220),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`dueDate` varchar(10) NOT NULL,
	`status` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `marketing_projects` ADD `status` enum('draft','active','paused','completed') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_monthly_metrics` ADD CONSTRAINT `sales_monthly_metrics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_products` ADD CONSTRAINT `sales_products_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_tasks` ADD CONSTRAINT `sales_tasks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sales_products_user_created_idx` ON `sales_products` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `sales_tasks_user_due_idx` ON `sales_tasks` (`userId`,`dueDate`);