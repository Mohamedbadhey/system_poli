-- Fix Case #34 with undefined category and submitted status

USE pcms_db;

-- Check the case first
SELECT id, case_number, crime_category, status 
FROM cases 
WHERE id = 34;

-- Fix both the category and status
UPDATE cases 
SET 
    crime_category = 'Other',
    status = 'approved'
WHERE id = 34;

-- Verify the fix
SELECT id, case_number, crime_category, status 
FROM cases 
WHERE id = 34;
