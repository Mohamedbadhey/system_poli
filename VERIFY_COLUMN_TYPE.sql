-- Copy and paste this into your MySQL client to verify the migration

USE pcms_db;

-- Check the current column type
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'pcms_db'
AND TABLE_NAME = 'cases'
AND COLUMN_NAME = 'crime_category';

-- Expected result AFTER migration:
-- COLUMN_TYPE should be: varchar(100)

-- Expected result BEFORE migration:
-- COLUMN_TYPE should be: enum('violent','property','drug','cybercrime','sexual','juvenile','other')
