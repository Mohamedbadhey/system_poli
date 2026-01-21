-- Fix case with crime_category = 'undefined'
-- Case ID 33: CASE/XGD-01/2026/0021

USE pcms_db;

-- Check the case first
SELECT id, case_number, crime_category, crime_type, status 
FROM cases 
WHERE crime_category = 'undefined';

-- Option 1: Set to 'Other' as default
UPDATE cases 
SET crime_category = 'Other' 
WHERE crime_category = 'undefined';

-- Option 2: Set to the first available category from categories table
-- UPDATE cases 
-- SET crime_category = (SELECT name FROM categories WHERE is_active = 1 LIMIT 1)
-- WHERE crime_category = 'undefined';

-- Verify the fix
SELECT id, case_number, crime_category, crime_type, status 
FROM cases 
WHERE id = 33;

-- Check if there are any other invalid categories
SELECT id, case_number, crime_category 
FROM cases 
WHERE crime_category IS NULL 
   OR crime_category = '' 
   OR crime_category = 'undefined'
   OR crime_category = 'null';
