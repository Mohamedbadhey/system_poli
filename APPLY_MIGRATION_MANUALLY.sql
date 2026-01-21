-- If the migration wasn't applied, run this to apply it manually

USE pcms_db;

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

-- Step 4: Verify the change
DESCRIBE cases;

-- Step 5: Confirm crime_category is now varchar(100)
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'pcms_db'
AND TABLE_NAME = 'cases'
AND COLUMN_NAME = 'crime_category';
