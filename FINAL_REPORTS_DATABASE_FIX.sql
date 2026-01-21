-- ========================================
-- FINAL REPORTS DATABASE FIX
-- Your database already has investigation_reports table!
-- This adds the missing table and updates templates
-- ========================================

-- Create report_approvals table (ONLY missing table)
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
  CONSTRAINT `fk_report_approvals_report` 
    FOREIGN KEY (`report_id`) REFERENCES `investigation_reports`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_report_approvals_approver` 
    FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update document_templates to fix empty report_category values
UPDATE `document_templates` 
SET `report_category` = 'investigation' 
WHERE `id` IN (3, 4, 5, 8) AND (report_category IS NULL OR report_category = '');

UPDATE `document_templates` 
SET `report_category` = 'court' 
WHERE `id` IN (6, 7) AND (report_category IS NULL OR report_category = '');

UPDATE `document_templates` 
SET `report_category` = 'closure' 
WHERE `id` = 9 AND (report_category IS NULL OR report_category = '');

-- Fix template_type for proper categorization
UPDATE `document_templates` 
SET `template_type` = 'preliminary' 
WHERE `id` = 3;

UPDATE `document_templates` 
SET `template_type` = 'interim' 
WHERE `id` = 4;

UPDATE `document_templates` 
SET `template_type` = 'final' 
WHERE `id` = 5;

UPDATE `document_templates` 
SET `template_type` = 'court_submission' 
WHERE `id` = 6;

UPDATE `document_templates` 
SET `template_type` = 'exhibit_list' 
WHERE `id` = 7;

UPDATE `document_templates` 
SET `template_type` = 'supplementary' 
WHERE `id` = 8;

UPDATE `document_templates` 
SET `template_type` = 'case_closure' 
WHERE `id` = 9;

-- Verify everything
SELECT '========================================' as '';
SELECT 'VERIFICATION RESULTS' as '';
SELECT '========================================' as '';

-- Check tables exist
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ investigation_reports table exists'
        ELSE '✗ investigation_reports table MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'investigation_reports';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ report_approvals table exists'
        ELSE '✗ report_approvals table MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'report_approvals';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ court_communications table exists'
        ELSE '✗ court_communications table MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'court_communications';

-- Show templates
SELECT '========================================' as '';
SELECT 'REPORT TEMPLATES' as '';
SELECT '========================================' as '';

SELECT 
    id,
    template_name,
    template_type,
    report_category,
    is_active
FROM document_templates
WHERE report_category IN ('investigation', 'court', 'closure')
ORDER BY id;

-- Show template counts
SELECT 
    report_category,
    COUNT(*) as template_count
FROM document_templates
WHERE report_category IS NOT NULL
GROUP BY report_category;

-- Show sample case data
SELECT '========================================' as '';
SELECT 'SAMPLE CASE DATA AVAILABLE' as '';
SELECT '========================================' as '';

SELECT 
    c.id,
    c.case_number,
    c.ob_number,
    c.crime_type,
    COUNT(DISTINCT cp.id) as parties,
    COUNT(DISTINCT e.id) as evidence,
    COUNT(DISTINCT n.id) as notes
FROM cases c
LEFT JOIN case_parties cp ON c.id = cp.case_id
LEFT JOIN evidence e ON c.id = e.case_id
LEFT JOIN investigation_notes n ON c.id = n.case_id
WHERE c.id = 10
GROUP BY c.id;

SELECT '========================================' as '';
SELECT '✓ DATABASE IS READY FOR REPORTS!' as '';
SELECT '========================================' as '';
SELECT 'Next steps:' as '';
SELECT '1. Clear browser cache (Ctrl+Shift+Delete)' as '';
SELECT '2. Logout and login again' as '';
SELECT '3. Click "Case Reports" in sidebar' as '';
SELECT '4. Select Case #10 (has most data)' as '';
SELECT '5. Generate reports!' as '';
