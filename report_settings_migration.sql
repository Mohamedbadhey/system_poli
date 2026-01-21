-- ========================================
-- Report Settings Migration SQL
-- ========================================
-- This creates the report_settings table and inserts default configurations
-- Run this script in your MySQL database

-- Check if table already exists
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'report_settings'
);

-- Drop table if it exists (for clean re-run)
DROP TABLE IF EXISTS `report_settings`;

-- Create report_settings table
CREATE TABLE `report_settings` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `center_id` INT(11) UNSIGNED NULL DEFAULT NULL COMMENT 'If NULL, applies to all centers (system-wide)',
    `setting_key` VARCHAR(100) NOT NULL COMMENT 'e.g., header_image, full_report_sections, basic_report_sections',
    `setting_value` TEXT NULL DEFAULT NULL COMMENT 'JSON or text value',
    `setting_type` ENUM('text', 'json', 'image', 'file') NOT NULL DEFAULT 'text',
    `description` TEXT NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_by` INT(11) UNSIGNED NULL DEFAULT NULL,
    `updated_by` INT(11) UNSIGNED NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_center_setting` (`center_id`, `setting_key`),
    CONSTRAINT `fk_report_settings_center` FOREIGN KEY (`center_id`) REFERENCES `police_centers` (`id`) ON DELETE CASCADE ON UPDATE SET NULL,
    CONSTRAINT `fk_report_settings_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE SET NULL,
    CONSTRAINT `fk_report_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clear any existing data (in case of re-run)
DELETE FROM `report_settings`;

-- Insert default settings
INSERT INTO `report_settings` (`center_id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_active`, `created_at`) VALUES
-- Header Image (shared by all reports)
(NULL, 'header_image', NULL, 'image', 'Report header image/logo (shared by all reports)', 1, NOW()),

-- Full Report Statement 1
(NULL, 'full_statement1', 'This is to certify that the information contained in this comprehensive investigation report is true and accurate to the best of my knowledge.', 'text', 'Full Report Statement 1 - Appears after case numbers', 1, NOW()),

-- Full Report Statement 2
(NULL, 'full_statement2', 'This full investigation report has been prepared in accordance with standard police procedures and protocols, with comprehensive documentation of all findings.', 'text', 'Full Report Statement 2 - Appears below statement 1', 1, NOW()),

-- Full Report Statement 3
(NULL, 'full_statement3', 'The following sections contain detailed and comprehensive information regarding this investigation, including all evidence, parties, and conclusions.', 'text', 'Full Report Statement 3 - Appears before report sections', 1, NOW()),

-- Full Report Footer Text
(NULL, 'full_footer_text', 'Prepared By:\nName: _______________________________\nSignature: __________________________\nDate: _______________\n\nReviewed By:\nName: _______________________________\nSignature: __________________________\nDate: _______________\n\nApproved By:\nName: _______________________________\nSignature: __________________________\nDate: _______________', 'text', 'Full Report Footer text with signature section', 1, NOW()),

-- Basic Report Statement 1
(NULL, 'basic_statement1', 'This preliminary report contains initial findings of the investigation.', 'text', 'Basic Report Statement 1 - Appears after case numbers', 1, NOW()),

-- Basic Report Statement 2
(NULL, 'basic_statement2', 'This report provides a basic overview of the case status and initial investigation activities.', 'text', 'Basic Report Statement 2 - Appears below statement 1', 1, NOW()),

-- Basic Report Statement 3
(NULL, 'basic_statement3', 'The following sections contain basic information gathered during the initial investigation.', 'text', 'Basic Report Statement 3 - Appears before report sections', 1, NOW()),

-- Basic Report Footer Text
(NULL, 'basic_footer_text', 'Prepared By:\nName: _______________________________\nSignature: __________________________\nDate: _______________', 'text', 'Basic Report Footer text with signature section', 1, NOW()),

-- Customized Report Statement 1
(NULL, 'custom_statement1', 'This customized report contains selected sections as per user requirements.', 'text', 'Customized Report Statement 1 - Appears after case numbers', 1, NOW()),

-- Customized Report Statement 2
(NULL, 'custom_statement2', 'The sections included in this report have been specifically selected for this investigation.', 'text', 'Customized Report Statement 2 - Appears below statement 1', 1, NOW()),

-- Customized Report Statement 3
(NULL, 'custom_statement3', 'The following sections have been included based on the case requirements.', 'text', 'Customized Report Statement 3 - Appears before report sections', 1, NOW()),

-- Customized Report Footer Text
(NULL, 'custom_footer_text', 'Prepared By:\nName: _______________________________\nSignature: __________________________\nDate: _______________\n\nVerified By:\nName: _______________________________\nSignature: __________________________\nDate: _______________', 'text', 'Customized Report Footer text with signature section', 1, NOW()),

-- Full Report Sections (comprehensive reports)
(NULL, 'full_report_sections', '{
    "case_overview": {
        "title": "Case Overview",
        "enabled": true,
        "order": 1,
        "template": "This section provides a comprehensive overview of the case including all relevant details."
    },
    "parties_involved": {
        "title": "Parties Involved",
        "enabled": true,
        "order": 2,
        "template": "Detailed information about all parties involved including accusers, accused, and witnesses."
    },
    "evidence_summary": {
        "title": "Evidence Summary",
        "enabled": true,
        "order": 3,
        "template": "Complete catalog of all evidence collected during the investigation."
    },
    "investigation_details": {
        "title": "Investigation Details",
        "enabled": true,
        "order": 4,
        "template": "Detailed account of investigation activities, interviews, and findings."
    },
    "investigator_conclusions": {
        "title": "Investigator Conclusions",
        "enabled": true,
        "order": 5,
        "template": "Professional conclusions and recommendations based on investigation findings."
    },
    "recommendations": {
        "title": "Recommendations",
        "enabled": true,
        "order": 6,
        "template": "Recommended next steps and actions for case resolution."
    }
}', 'json', 'Text sections configuration for Full Investigation Report', 1, NOW()),

-- Basic Report Sections (simple reports)
(NULL, 'basic_report_sections', '{
    "case_overview": {
        "title": "Case Overview",
        "enabled": true,
        "order": 1,
        "template": "Brief overview of the case and key details."
    },
    "summary": {
        "title": "Summary",
        "enabled": true,
        "order": 2,
        "template": "Summary of the investigation and key findings."
    },
    "conclusion": {
        "title": "Conclusion",
        "enabled": true,
        "order": 3,
        "template": "Brief conclusion and recommendation."
    }
}', 'json', 'Text sections configuration for Basic Investigation Report', 1, NOW());

-- Verification Query
SELECT 
    setting_key,
    setting_type,
    CASE 
        WHEN setting_value IS NULL THEN 'NULL (not configured yet)'
        WHEN setting_type = 'json' THEN CONCAT('JSON (', JSON_LENGTH(setting_value), ' sections)')
        ELSE SUBSTRING(setting_value, 1, 50)
    END AS setting_value_preview,
    description,
    is_active
FROM report_settings
ORDER BY id;

-- Success message
SELECT '========================================' AS '';
SELECT '✓ Report Settings Migration Complete!' AS '';
SELECT '========================================' AS '';
SELECT '' AS '';
SELECT 'Created:' AS '';
SELECT '  - report_settings table' AS '';
SELECT '  - 7 default settings records' AS '';
SELECT '' AS '';
SELECT 'Settings:' AS '';
SELECT '  1. header_image - Shared header for all reports' AS '';
SELECT '  2. statement1 - Text after case numbers' AS '';
SELECT '  3. statement2 - Text below statement 1' AS '';
SELECT '  4. statement3 - Text before report sections' AS '';
SELECT '  5. footer_text - Signature section' AS '';
SELECT '  6. full_report_sections - 6 sections for comprehensive reports' AS '';
SELECT '  7. basic_report_sections - 3 sections for basic reports' AS '';
SELECT '' AS '';
SELECT 'Next Steps:' AS '';
SELECT '  1. Access Report Settings in investigator dashboard' AS '';
SELECT '  2. Upload your header image' AS '';
SELECT '  3. Customize statements and sections' AS '';
SELECT '  4. Generate a report to test' AS '';
SELECT '' AS '';
SELECT '========================================' AS '';
