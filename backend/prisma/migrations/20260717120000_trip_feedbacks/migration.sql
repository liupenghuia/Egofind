-- CreateTable
CREATE TABLE `trip_feedbacks` (
    `id` VARCHAR(191) NOT NULL,
    `driver_trip_id` VARCHAR(191) NOT NULL,
    `driver_id` VARCHAR(191) NOT NULL,
    `passenger_id` VARCHAR(191) NOT NULL,
    `reason` ENUM('DRIVER_REASON', 'PASSENGER_REASON') NOT NULL,
    `remark` VARCHAR(100) NULL,
    `year_month` VARCHAR(7) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `trip_feedbacks_driver_trip_id_passenger_id_key`(`driver_trip_id`, `passenger_id`),
    INDEX `trip_feedbacks_driver_id_year_month_reason_idx`(`driver_id`, `year_month`, `reason`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `trip_feedbacks` ADD CONSTRAINT `trip_feedbacks_driver_trip_id_fkey` FOREIGN KEY (`driver_trip_id`) REFERENCES `driver_trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `trip_feedbacks` ADD CONSTRAINT `trip_feedbacks_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `trip_feedbacks` ADD CONSTRAINT `trip_feedbacks_passenger_id_fkey` FOREIGN KEY (`passenger_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
