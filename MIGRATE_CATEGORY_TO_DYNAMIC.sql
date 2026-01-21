-- ============================================================================
-- Migration: Convert crime_category from ENUM to Dynamic Categories
-- Purpose: Allow dynamic categories from the categories table
-- Date: 2026-01-19
-- ============================================================================

-- Step 1: Check current data
SELECT DISTINCT crime_category, COUNT(*) as count 
FROM cases 
GROUP BY crime_category;

-- Step 2: Alter the cases table - Remove ENUM constraint
ALTER TABLE `cases` 
MODIFY COLUMN `crime_category` VARCHAR(100) NOT NULL 
COMMENT 'Crime category - references categories.name or custom value';

-- Step 3: Add index for better performance
ALTER TABLE `cases` 
ADD INDEX `idx_crime_category` (`crime_category`);

-- Step 4: Optionally add a foreign key to categories table (if you want strict referential integrity)
-- Note: Only uncomment this if ALL crime_category values must exist in categories.name
-- ALTER TABLE `cases` 
-- ADD CONSTRAINT `fk_cases_category` 
-- FOREIGN KEY (`crime_category`) 
-- REFERENCES `categories`(`name`) 
-- ON UPDATE CASCADE 
-- ON DELETE RESTRICT;

-- Step 5: Verify the change
DESCRIBE cases;

-- Step 6: Check if any existing data needs mapping
SELECT 
    c.crime_category,
    cat.name as matching_category,
    COUNT(*) as case_count
FROM cases c
LEFT JOIN categories cat ON LOWER(c.crime_category) = LOWER(cat.name)
GROUP BY c.crime_category, cat.name;

-- ============================================================================
-- NOTES:
-- 1. The ENUM values (violent, property, drug, etc.) will remain as strings
-- 2. New cases can now use ANY value from the categories table
-- 3. Frontend should load categories dynamically and use category.name
-- 4. Existing case data is preserved
-- ============================================================================
