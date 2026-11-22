CREATE TABLE `generation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(32) NOT NULL,
	`tool` varchar(64) NOT NULL,
	`title` varchar(220) NOT NULL,
	`input` text NOT NULL,
	`result` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `businessName` varchar(160);--> statement-breakpoint
ALTER TABLE `users` ADD `businessCategory` varchar(120);--> statement-breakpoint
ALTER TABLE `generation_history` ADD CONSTRAINT `generation_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `generation_history_user_created_idx` ON `generation_history` (`userId`,`createdAt`);