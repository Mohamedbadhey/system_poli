-- Fix case_status_history table structure
-- Add missing columns for court status tracking

-- Check if old_court_status exists, add if not
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'case_status_history' AND column_name = 'old_court_status');
SET @sqlstmt = IF(@col_exists = 0, 
    'ALTER TABLE case_status_history ADD COLUMN old_court_status VARCHAR(50) NULL AFTER new_status',
    'SELECT "Column old_court_status already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if new_court_status exists, add if not
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'case_status_history' AND column_name = 'new_court_status');
SET @sqlstmt = IF(@col_exists = 0, 
    'ALTER TABLE case_status_history ADD COLUMN new_court_status VARCHAR(50) NULL AFTER old_court_status',
    'SELECT "Column new_court_status already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'case_status_history table updated successfully!' AS Status;
