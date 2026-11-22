ALTER TABLE `generation_history` ADD `salesProductId` int;--> statement-breakpoint
ALTER TABLE `generation_history` ADD CONSTRAINT `generation_history_salesProductId_sales_products_id_fk` FOREIGN KEY (`salesProductId`) REFERENCES `sales_products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `generation_history_user_agent_product_stage_idx` ON `generation_history` (`userId`,`salesAgentKey`,`salesProductId`,`workflowStage`,`createdAt`);--> statement-breakpoint
CREATE INDEX `generation_history_sales_product_idx` ON `generation_history` (`salesProductId`);