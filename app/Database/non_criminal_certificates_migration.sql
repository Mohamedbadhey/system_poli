-- Non-Criminal Certificates Table Migration
-- This table stores all issued non-criminal certificates with unique IDs for QR verification

-- First, check if the table exists and drop it if it does
DROP TABLE IF EXISTS `non_criminal_certificates`;

-- Create the table without foreign keys first
CREATE TABLE `non_criminal_certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_number` varchar(100) NOT NULL COMMENT 'Unique certificate number (e.g., JPFHQ/CID/NC:1234/2026)',
  `person_id` int(11) DEFAULT NULL COMMENT 'Link to persons table if exists',
  `person_name` varchar(255) NOT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','male','female') NOT NULL,
  `birth_date` date DEFAULT NULL,
  `birth_place` varchar(255) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `purpose` text DEFAULT NULL COMMENT 'Purpose of the certificate',
  `validity_period` varchar(50) DEFAULT '6 months',
  `issue_date` date NOT NULL,
  `director_name` varchar(255) DEFAULT NULL,
  `director_signature` text DEFAULT NULL COMMENT 'Base64 encoded signature',
  `issued_by` int(11) NOT NULL COMMENT 'User ID who issued the certificate',
  `verification_token` varchar(64) NOT NULL COMMENT 'Unique token for QR verification',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Certificate validity status',
  `verification_count` int(11) DEFAULT 0 COMMENT 'Number of times certificate was verified',
  `last_verified_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_certificate_number` (`certificate_number`),
  UNIQUE KEY `unique_verification_token` (`verification_token`),
  KEY `idx_person_id` (`person_id`),
  KEY `idx_issued_by` (`issued_by`),
  KEY `idx_issue_date` (`issue_date`),
  KEY `idx_active_certificates` (`is_active`, `issue_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Non-Criminal Certificates issued by CID';

-- Add foreign key constraints only if the referenced tables exist
-- This allows the table to be created even if foreign keys can't be added
SET @person_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'persons');
SET @users_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'users');

-- Add foreign key for person_id if persons table exists
SET @sql = IF(@person_table_exists > 0,
    'ALTER TABLE `non_criminal_certificates` ADD CONSTRAINT `fk_ncc_person` 
     FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`) ON DELETE SET NULL',
    'SELECT "Persons table not found, skipping foreign key" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for issued_by if users table exists
SET @sql = IF(@users_table_exists > 0,
    'ALTER TABLE `non_criminal_certificates` ADD CONSTRAINT `fk_ncc_issued_by` 
     FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT',
    'SELECT "Users table not found, skipping foreign key" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
