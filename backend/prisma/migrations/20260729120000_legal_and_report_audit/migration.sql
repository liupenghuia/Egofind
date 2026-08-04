-- AlterTable users: legal acceptance
ALTER TABLE `users` ADD COLUMN `legal_accepted_at` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `legal_version` VARCHAR(32) NULL;

-- AlterTable reports: admin audit
ALTER TABLE `reports` ADD COLUMN `resolved_by` VARCHAR(64) NULL;
ALTER TABLE `reports` ADD COLUMN `resolved_at` DATETIME(3) NULL;

CREATE INDEX `reports_reporter_id_created_at_idx` ON `reports`(`reporter_id`, `created_at`);
CREATE INDEX `reports_target_type_target_id_status_idx` ON `reports`(`target_type`, `target_id`, `status`);
