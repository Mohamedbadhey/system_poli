-- Non-Criminal Certificates Table Migration v2
-- Compatible with existing pcms_db structure

-- Drop table if exists (clean start)
DROP TABLE IF EXISTS `non_criminal_certificates`;

-- Create the table matching your database style
CREATE TABLE `non_criminal_certificates` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `certificate_number` varchar(100) NOT NULL COMMENT 'Unique certificate number',
  `person_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'Link to persons table',
  `person_name` varchar(255) NOT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','male','female') NOT NULL,
  `birth_date` date DEFAULT NULL,
  `birth_place` varchar(255) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `purpose` text DEFAULT NULL COMMENT 'Purpose of certificate',
  `validity_period` varchar(50) DEFAULT '6 months',
  `issue_date` date NOT NULL,
  `director_name` varchar(255) DEFAULT NULL,
  `director_signature` text DEFAULT NULL COMMENT 'Base64 encoded signature',
  `issued_by` int(10) UNSIGNED NOT NULL COMMENT 'User ID who issued',
  `verification_token` varchar(64) NOT NULL COMMENT 'Unique token for QR',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Certificate status',
  `verification_count` int(11) DEFAULT 0 COMMENT 'Times verified',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `non_criminal_certificates`
  ADD CONSTRAINT `fk_ncc_person` 
  FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `non_criminal_certificates`
  ADD CONSTRAINT `fk_ncc_issued_by` 
  FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) 
  ON DELETE RESTRICT ON UPDATE CASCADE;
