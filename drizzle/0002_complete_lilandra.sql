CREATE TABLE `marketing_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`businessName` varchar(160) NOT NULL,
	`businessCategory` varchar(120),
	`objective` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `generation_history` ADD `projectId` int;--> statement-breakpoint
ALTER TABLE `marketing_projects` ADD CONSTRAINT `marketing_projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `marketing_projects_user_updated_idx` ON `marketing_projects` (`userId`,`updatedAt`);--> statement-breakpoint
ALTER TABLE `generation_history` ADD CONSTRAINT `generation_history_projectId_marketing_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `marketing_projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `generation_history_project_created_idx` ON `generation_history` (`projectId`,`createdAt`);