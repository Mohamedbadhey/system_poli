-- Medical Examination Forms Table
-- Links medical examination reports to cases and persons

-- First, check and create without foreign keys
CREATE TABLE IF NOT EXISTS `medical_examination_forms` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `case_id` int(11) unsigned NOT NULL,
  `person_id` int(11) unsigned DEFAULT NULL,
  `case_number` varchar(100) DEFAULT NULL,
  `patient_name` varchar(255) NOT NULL,
  `party_type` enum('victim','accused','witness','other') DEFAULT NULL,
  `form_data` longtext NOT NULL COMMENT 'JSON data of complete form',
  `report_date` date DEFAULT NULL,
  `hospital_name` varchar(255) DEFAULT NULL,
  `examination_date` date DEFAULT NULL,
  `created_by` int(11) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_case_id` (`case_id`),
  KEY `idx_person_id` (`person_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_report_date` (`report_date`),
  KEY `idx_case_number` (`case_number`),
  KEY `idx_patient_name` (`patient_name`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign keys only if tables exist
-- Note: If cases, persons, or users tables don't exist or have different structure,
-- these constraints will be skipped without error

SET @tables_exist = (
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = DATABASE() 
  AND table_name IN ('cases', 'persons', 'users')
);

-- Only add foreign keys if all required tables exist
-- You can manually add these later if needed:
-- ALTER TABLE medical_examination_forms 
--   ADD CONSTRAINT medical_forms_case_fk 
--   FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE medical_examination_forms 
--   ADD CONSTRAINT medical_forms_person_fk 
--   FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE SET NULL;
-- 
-- ALTER TABLE medical_examination_forms 
--   ADD CONSTRAINT medical_forms_user_fk 
--   FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
