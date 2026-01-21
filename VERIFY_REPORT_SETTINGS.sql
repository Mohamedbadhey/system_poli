-- ========================================
-- Verification Script for Report Settings
-- ========================================

-- Check if table exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ report_settings table exists'
        ELSE '✗ report_settings table NOT FOUND'
    END AS 'Table Status'
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'report_settings';

-- Show table structure
DESC report_settings;

-- Check default settings
SELECT 
    '--- Default Settings ---' AS '';

SELECT 
    setting_key,
    setting_type,
    CASE 
        WHEN setting_value IS NULL THEN 'NULL (not configured yet)'
        WHEN setting_type = 'json' THEN CONCAT('JSON (', JSON_LENGTH(setting_value), ' sections)')
        ELSE SUBSTRING(setting_value, 1, 50)
    END AS setting_value_preview,
    is_active,
    created_at
FROM report_settings
ORDER BY id;

-- Show full report sections
SELECT 
    '--- Full Report Sections ---' AS '';

SELECT 
    JSON_UNQUOTE(JSON_EXTRACT(setting_value, CONCAT('$.', section_key, '.title'))) AS section_title,
    JSON_UNQUOTE(JSON_EXTRACT(setting_value, CONCAT('$.', section_key, '.order'))) AS section_order,
    JSON_UNQUOTE(JSON_EXTRACT(setting_value, CONCAT('$.', section_key, '.enabled'))) AS enabled
FROM report_settings
CROSS JOIN JSON_TABLE(
    setting_value,
    '$.*' COLUMNS(
        section_key VARCHAR(100) PATH '$'
    )
) AS sections
WHERE setting_key = 'full_report_sections'
ORDER BY CAST(JSON_UNQUOTE(JSON_EXTRACT(setting_value, CONCAT('$.', section_key, '.order'))) AS UNSIGNED);

-- Show basic report sections
SELECT 
    '--- Basic Report Sections ---' AS '';

SELECT 
    JSON_UNQUOTE(JSON_EXTRACT(setting_value, CONCAT('$.', section_key, '.title'))) AS section_title,
    JSON_UNQUOTE(JSON_EXTRACT(setting_value, CONCAT('$.', section_key, '.order'))) AS section_order,
    JSON_UNQUOTE(JSON_EXTRACT(setting_value, CONCAT('$.', section_key, '.enabled'))) AS enabled
FROM report_settings
CROSS JOIN JSON_TABLE(
    setting_value,
    '$.*' COLUMNS(
        section_key VARCHAR(100) PATH '$'
    )
) AS sections
WHERE setting_key = 'basic_report_sections'
ORDER BY CAST(JSON_UNQUOTE(JSON_EXTRACT(setting_value, CONCAT('$.', section_key, '.order'))) AS UNSIGNED);

-- Summary
SELECT 
    '--- Summary ---' AS '';

SELECT 
    COUNT(*) AS total_settings,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_settings,
    SUM(CASE WHEN setting_type = 'json' THEN 1 ELSE 0 END) AS json_settings,
    SUM(CASE WHEN setting_type = 'image' THEN 1 ELSE 0 END) AS image_settings
FROM report_settings;
