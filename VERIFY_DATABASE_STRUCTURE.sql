-- ========================================
-- VERIFY REPORTS SYSTEM DATABASE STRUCTURE
-- Run this to check if everything is set up correctly
-- ========================================

-- 1. Check if investigation_reports table exists
SHOW TABLES LIKE 'investigation_reports';

-- 2. Check investigation_reports table structure
DESCRIBE investigation_reports;

-- 3. Check if report_approvals table exists
SHOW TABLES LIKE 'report_approvals';

-- 4. Check report_approvals structure
DESCRIBE report_approvals;

-- 5. Check if court_communications table exists
SHOW TABLES LIKE 'court_communications';

-- 6. Check court_communications structure
DESCRIBE court_communications;

-- 7. Check document_templates table
DESCRIBE document_templates;

-- 8. Count report templates
SELECT COUNT(*) as template_count, report_category 
FROM document_templates 
WHERE report_category IS NOT NULL 
GROUP BY report_category;

-- 9. List all report templates
SELECT id, template_name, template_type, report_category, is_active 
FROM document_templates 
WHERE report_category IS NOT NULL;

-- 10. Check if we have any existing reports
SELECT COUNT(*) as total_reports FROM investigation_reports;

-- 11. Check cases data availability
SELECT 
    COUNT(*) as total_cases,
    COUNT(DISTINCT created_by) as investigators,
    SUM(CASE WHEN status = 'investigating' THEN 1 ELSE 0 END) as investigating_cases
FROM cases;

-- 12. Check if cases have enough data for reports
SELECT 
    c.id,
    c.case_number,
    c.crime_type,
    c.status,
    COUNT(DISTINCT cp.id) as parties_count,
    COUNT(DISTINCT e.id) as evidence_count,
    COUNT(DISTINCT n.id) as notes_count
FROM cases c
LEFT JOIN case_parties cp ON c.id = cp.case_id
LEFT JOIN evidence e ON c.id = e.case_id
LEFT JOIN investigation_notes n ON c.id = n.case_id
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 13. Verify all required fields exist in investigation_reports
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'investigation_reports'
ORDER BY ORDINAL_POSITION;

-- ========================================
-- IF investigation_reports TABLE DOESN'T EXIST, CREATE IT
-- ========================================

-- Check and create if missing
CREATE TABLE IF NOT EXISTS `investigation_reports` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `case_id` INT(10) UNSIGNED NOT NULL,
  `report_type` VARCHAR(50) NOT NULL,
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

-- ========================================
-- TEST DATA AVAILABILITY FOR REPORTS
-- ========================================

-- Show a sample case with all its related data
SELECT 'SAMPLE CASE DATA FOR REPORTS' as info;

SELECT 
    'Case Information' as section,
    c.id,
    c.case_number,
    c.ob_number,
    c.crime_type,
    c.crime_category,
    c.incident_date,
    c.incident_location,
    c.incident_description,
    c.status,
    c.priority
FROM cases c 
LIMIT 1;

SELECT 
    'Parties (Accusers, Accused, Witnesses)' as section,
    cp.party_role,
    p.first_name,
    p.last_name,
    p.national_id,
    p.phone
FROM cases c
JOIN case_parties cp ON c.id = cp.case_id
JOIN persons p ON cp.person_id = p.id
LIMIT 1;

SELECT 
    'Evidence Items' as section,
    e.evidence_number,
    e.title,
    e.evidence_type,
    e.description,
    e.collected_at,
    e.is_critical
FROM cases c
JOIN evidence e ON c.id = e.case_id
LIMIT 1;

SELECT 
    'Investigation Notes' as section,
    n.note_type,
    n.content,
    n.created_at
FROM cases c
JOIN investigation_notes n ON c.id = n.case_id
LIMIT 1;

SELECT 
    'Investigator Information' as section,
    u.full_name,
    u.badge_number,
    u.email,
    u.role
FROM cases c
JOIN users u ON c.created_by = u.id
LIMIT 1;

SELECT 
    'Police Center Information' as section,
    pc.center_name,
    pc.center_code,
    pc.location
FROM cases c
JOIN police_centers pc ON c.center_id = pc.id
LIMIT 1;

-- ========================================
-- RESULTS SUMMARY
-- ========================================

SELECT '========================================' as '';
SELECT 'DATABASE VERIFICATION COMPLETE' as '';
SELECT '========================================' as '';
SELECT 'Check the results above to ensure:' as '';
SELECT '1. All tables exist' as '';
SELECT '2. All columns are present' as '';
SELECT '3. Case data is available' as '';
SELECT '4. Templates are loaded' as '';
SELECT '' as '';
SELECT 'If any checks fail, run: reports_system_migration.sql' as '';
