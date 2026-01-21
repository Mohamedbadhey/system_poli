-- Check if the migration was applied correctly
-- This will show the current structure of the crime_category column

DESCRIBE cases;

-- Specifically check the crime_category column
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'pcms_db'
AND TABLE_NAME = 'cases'
AND COLUMN_NAME = 'crime_category';

-- Show some sample data
SELECT id, case_number, crime_category 
FROM cases 
ORDER BY id DESC 
LIMIT 5;
