-- Match cancel audit fields (U4)
ALTER TABLE `match_orders` ADD COLUMN `cancelled_at` DATETIME(3) NULL;
ALTER TABLE `match_orders` ADD COLUMN `cancel_reason` VARCHAR(255) NULL;
ALTER TABLE `match_orders` ADD COLUMN `cancelled_by` VARCHAR(64) NULL;
