-- AlterTable users
ALTER TABLE `users`
  ADD COLUMN `unionid` VARCHAR(64) NULL,
  ADD COLUMN `phone_enc` VARCHAR(512) NULL,
  ADD COLUMN `phone_mask` VARCHAR(32) NULL,
  ADD COLUMN `active_mode` ENUM('PASSENGER', 'DRIVER') NOT NULL DEFAULT 'PASSENGER',
  ADD COLUMN `credit_score` INTEGER NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE `driver_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plate_no` VARCHAR(32) NULL,
    `car_model` VARCHAR(64) NULL,
    `car_color` VARCHAR(32) NULL,
    `verify_status` ENUM('NONE', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NONE',
    `reject_reason` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `driver_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `driver_trips` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `origin_name` VARCHAR(255) NOT NULL,
    `origin_lat` DOUBLE NOT NULL,
    `origin_lng` DOUBLE NOT NULL,
    `origin_adcode` VARCHAR(12) NOT NULL,
    `dest_name` VARCHAR(255) NOT NULL,
    `dest_lat` DOUBLE NOT NULL,
    `dest_lng` DOUBLE NOT NULL,
    `dest_adcode` VARCHAR(12) NOT NULL,
    `depart_start` DATETIME(3) NOT NULL,
    `depart_end` DATETIME(3) NOT NULL,
    `seats_total` INTEGER NOT NULL,
    `seats_left` INTEGER NOT NULL,
    `price_cents` INTEGER NOT NULL DEFAULT 0,
    `vehicle_snap` JSON NULL,
    `remark` VARCHAR(500) NULL,
    `status` ENUM('PUBLISHED', 'MATCHING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PUBLISHED',
    `published_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `driver_trips_origin_adcode_status_depart_start_idx`(`origin_adcode`, `status`, `depart_start`),
    INDEX `driver_trips_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `passenger_requests` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `origin_name` VARCHAR(255) NOT NULL,
    `origin_lat` DOUBLE NOT NULL,
    `origin_lng` DOUBLE NOT NULL,
    `origin_adcode` VARCHAR(12) NOT NULL,
    `dest_name` VARCHAR(255) NOT NULL,
    `dest_lat` DOUBLE NOT NULL,
    `dest_lng` DOUBLE NOT NULL,
    `dest_adcode` VARCHAR(12) NOT NULL,
    `expect_start` DATETIME(3) NOT NULL,
    `expect_end` DATETIME(3) NOT NULL,
    `seats_needed` INTEGER NOT NULL,
    `remark` VARCHAR(500) NULL,
    `visibility` ENUM('PUBLIC', 'HIDDEN') NOT NULL DEFAULT 'PUBLIC',
    `status` ENUM('PUBLISHED', 'MATCHING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PUBLISHED',
    `published_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `passenger_requests_origin_adcode_status_visibility_expect_st_idx`(`origin_adcode`, `status`, `visibility`, `expect_start`),
    INDEX `passenger_requests_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `match_orders` (
    `id` VARCHAR(191) NOT NULL,
    `driver_trip_id` VARCHAR(191) NOT NULL,
    `passenger_request_id` VARCHAR(191) NOT NULL,
    `driver_id` VARCHAR(191) NOT NULL,
    `passenger_id` VARCHAR(191) NOT NULL,
    `seats` INTEGER NOT NULL,
    `status` ENUM('CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `confirmed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `match_orders_driver_trip_id_passenger_request_id_key`(`driver_trip_id`, `passenger_request_id`),
    INDEX `match_orders_driver_id_status_idx`(`driver_id`, `status`),
    INDEX `match_orders_passenger_id_status_idx`(`passenger_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `driver_verifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `real_name` VARCHAR(64) NULL,
    `id_card_mask` VARCHAR(32) NULL,
    `license_img` VARCHAR(512) NULL,
    `vehicle_img` VARCHAR(512) NULL,
    `plate_no` VARCHAR(32) NULL,
    `car_model` VARCHAR(64) NULL,
    `car_color` VARCHAR(32) NULL,
    `status` ENUM('NONE', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reject_reason` VARCHAR(255) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `reviewer_id` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `driver_verifications_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporter_id` VARCHAR(191) NOT NULL,
    `target_user_id` VARCHAR(191) NULL,
    `target_type` ENUM('USER', 'DRIVER_TRIP', 'PASSENGER_REQUEST', 'MATCH') NOT NULL,
    `target_id` VARCHAR(64) NOT NULL,
    `reason_code` VARCHAR(64) NOT NULL,
    `detail` VARCHAR(1000) NULL,
    `status` ENUM('OPEN', 'REVIEWING', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `admin_note` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `reports_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `match_order_id` VARCHAR(191) NOT NULL,
    `from_user_id` VARCHAR(191) NOT NULL,
    `to_user_id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `tags` JSON NULL,
    `content` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `reviews_match_order_id_from_user_id_key`(`match_order_id`, `from_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `body` VARCHAR(512) NOT NULL,
    `payload` JSON NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `notifications_user_id_read_at_idx`(`user_id`, `read_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `phone_access_logs` (
    `id` VARCHAR(191) NOT NULL,
    `viewer_id` VARCHAR(191) NOT NULL,
    `target_user_id` VARCHAR(191) NOT NULL,
    `match_order_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `phone_access_logs_viewer_id_created_at_idx`(`viewer_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- FKs
ALTER TABLE `driver_profiles` ADD CONSTRAINT `driver_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `driver_trips` ADD CONSTRAINT `driver_trips_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `passenger_requests` ADD CONSTRAINT `passenger_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `match_orders` ADD CONSTRAINT `match_orders_driver_trip_id_fkey` FOREIGN KEY (`driver_trip_id`) REFERENCES `driver_trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `match_orders` ADD CONSTRAINT `match_orders_passenger_request_id_fkey` FOREIGN KEY (`passenger_request_id`) REFERENCES `passenger_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `match_orders` ADD CONSTRAINT `match_orders_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `match_orders` ADD CONSTRAINT `match_orders_passenger_id_fkey` FOREIGN KEY (`passenger_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `driver_verifications` ADD CONSTRAINT `driver_verifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reports` ADD CONSTRAINT `reports_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_match_order_id_fkey` FOREIGN KEY (`match_order_id`) REFERENCES `match_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_to_user_id_fkey` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `phone_access_logs` ADD CONSTRAINT `phone_access_logs_viewer_id_fkey` FOREIGN KEY (`viewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `phone_access_logs` ADD CONSTRAINT `phone_access_logs_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `phone_access_logs` ADD CONSTRAINT `phone_access_logs_match_order_id_fkey` FOREIGN KEY (`match_order_id`) REFERENCES `match_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
