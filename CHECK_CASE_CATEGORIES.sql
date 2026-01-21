-- Check the crime_category values in existing cases

USE pcms_db;

-- Check all cases and their categories
SELECT 
    id,
    case_number,
    crime_category,
    CASE 
        WHEN crime_category IS NULL THEN 'NULL'
        WHEN crime_category = '' THEN 'EMPTY STRING'
        ELSE crime_category
    END as category_status,
    status,
    created_at
FROM cases
ORDER BY id DESC
LIMIT 20;

-- Count cases by category
SELECT 
    crime_category,
    COUNT(*) as count,
    CASE 
        WHEN crime_category IS NULL THEN 'NULL VALUES'
        WHEN crime_category = '' THEN 'EMPTY VALUES'
        ELSE 'HAS VALUE'
    END as status
FROM cases
GROUP BY crime_category
ORDER BY count DESC;

-- Check if any categories don't match the categories table
SELECT DISTINCT 
    c.crime_category,
    cat.name as matching_category
FROM cases c
LEFT JOIN categories cat ON c.crime_category = cat.name
WHERE c.crime_category IS NOT NULL 
AND c.crime_category != ''
ORDER BY c.crime_category;
