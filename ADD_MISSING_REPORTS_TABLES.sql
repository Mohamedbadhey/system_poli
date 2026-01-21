-- ========================================
-- ADD MISSING REPORTS TABLES TO YOUR DATABASE
-- Based on: pcms_db (2).sql
-- ========================================

-- Check if investigation_reports table exists
SELECT 'Checking for investigation_reports table...' as status;

-- Create investigation_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS `investigation_reports` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `case_id` INT(10) UNSIGNED NOT NULL,
  `report_type` VARCHAR(50) NOT NULL COMMENT 'preliminary, interim, final, court_submission, etc.',
  `report_subtype` VARCHAR(50) NULL,
  `report_title` VARCHAR(255) NOT NULL,
  `report_content` LONGTEXT NOT NULL,
  `report_file_path` VARCHAR(255) NULL,
  `is_signed` TINYINT(1) DEFAULT 0,
  `signature_hash` VARCHAR(255) NULL,
  `signed_by` INT(10) UNSIGNED NULL,
  `signed_at` DATETIME NULL,
  `period_covered_from` DATE NULL,
  `period_covered_to` DATE NULL,
  `court_reference_number` VARCHAR(100) NULL,
  `charges_preferred` JSON NULL,
  `case_strength` ENUM('weak', 'moderate', 'strong', 'conclusive') NULL,
  `recommended_action` VARCHAR(100) NULL,
  `approval_status` ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft',
  `approved_by` INT(10) UNSIGNED NULL,
  `approved_at` DATETIME NULL,
  `court_order_reference` VARCHAR(100) NULL,
  `metadata` JSON NULL COMMENT 'Additional structured data for specific report types',
  `created_by` INT(10) UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_case_id` (`case_id`),
  INDEX `idx_report_type` (`report_type`),
  INDEX `idx_approval_status` (`approval_status`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_reports_case_type` (`case_id`, `report_type`),
  INDEX `idx_reports_created_at` (`created_at`),
  CONSTRAINT `fk_reports_case` 
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_created_by` 
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_approved_by` 
    FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_signed_by` 
    FOREIGN KEY (`signed_by`) REFERENCES `users`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create report_approvals table
CREATE TABLE IF NOT EXISTS `report_approvals` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_id` INT(10) UNSIGNED NOT NULL,
  `approver_id` INT(10) UNSIGNED NOT NULL,
  `approval_level` ENUM('investigator', 'supervisor', 'commander', 'prosecutor') DEFAULT 'supervisor',
  `status` ENUM('pending', 'approved', 'rejected', 'revision_requested') DEFAULT 'pending',
  `comments` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_report_id` (`report_id`),
  INDEX `idx_approver_id` (`approver_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_approvals_created_at` (`created_at`),
  CONSTRAINT `fk_report_approvals_report` 
    FOREIGN KEY (`report_id`) REFERENCES `investigation_reports`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_report_approvals_approver` 
    FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update document_templates table structure (add columns if they don't exist)
ALTER TABLE `document_templates` 
ADD COLUMN IF NOT EXISTS `report_category` VARCHAR(50) NULL AFTER `template_type`,
ADD COLUMN IF NOT EXISTS `required_sections` JSON NULL AFTER `variables`,
ADD COLUMN IF NOT EXISTS `optional_sections` JSON NULL AFTER `required_sections`;

-- Update existing templates with proper report_category if empty
UPDATE `document_templates` 
SET `report_category` = 'investigation' 
WHERE `template_name` LIKE '%Investigation%' AND (`report_category` IS NULL OR `report_category` = '');

UPDATE `document_templates` 
SET `report_category` = 'court' 
WHERE `template_name` LIKE '%Court%' AND (`report_category` IS NULL OR `report_category` = '');

UPDATE `document_templates` 
SET `report_category` = 'closure' 
WHERE `template_name` LIKE '%Closure%' AND (`report_category` IS NULL OR `report_category` = '');

-- Verify tables were created
SELECT 'Verifying tables...' as status;

SHOW TABLES LIKE '%report%';

-- Show table structures
DESCRIBE investigation_reports;
DESCRIBE report_approvals;
DESCRIBE document_templates;

-- Show template count
SELECT COUNT(*) as total_templates, report_category 
FROM document_templates 
GROUP BY report_category;

SELECT '========================================' as '';
SELECT 'MIGRATION COMPLETE!' as '';
SELECT '========================================' as '';
SELECT 'Tables created:' as '';
SELECT '  - investigation_reports' as '';
SELECT '  - report_approvals' as '';
SELECT '  - court_communications (already exists)' as '';
SELECT '' as '';
SELECT 'Your database is now ready for reports!' as '';
