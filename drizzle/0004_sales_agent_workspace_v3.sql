CREATE TABLE `sales_agent_workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentKey` enum('A','B','C') NOT NULL,
	`targetRevenue` bigint NOT NULL,
	`actualRevenue` bigint,
	`destinationUrl` varchar(2048),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_agent_workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_agent_user_agent_uidx` UNIQUE(`userId`,`agentKey`)
);
--> statement-breakpoint
ALTER TABLE `generation_history` ADD `salesAgentKey` enum('A','B','C');--> statement-breakpoint
ALTER TABLE `generation_history` ADD `workflowStage` varchar(32);--> statement-breakpoint
ALTER TABLE `sales_products` ADD `salesAgentKey` enum('A','B','C');--> statement-breakpoint
ALTER TABLE `sales_agent_workspaces` ADD CONSTRAINT `sales_agent_workspaces_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sales_agent_user_updated_idx` ON `sales_agent_workspaces` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `generation_history_user_agent_stage_idx` ON `generation_history` (`userId`,`salesAgentKey`,`workflowStage`,`createdAt`);--> statement-breakpoint
CREATE INDEX `sales_products_user_agent_idx` ON `sales_products` (`userId`,`salesAgentKey`);