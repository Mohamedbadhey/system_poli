-- ============================================
-- CASE CLOSURE ENHANCEMENT MIGRATION
-- Add fields to support three types of case closure by investigators
-- Works with existing pcms_db.sql database structure
-- ============================================

-- Check if columns already exist before adding them
SET @dbname = DATABASE();

-- Add closure_type field to cases table
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND column_name = 'closure_type');
SET @sqlstmt = IF(@col_exists = 0, 
    'ALTER TABLE cases ADD COLUMN closure_type ENUM(''investigator_closed'', ''closed_with_court_ack'', ''court_solved'') NULL AFTER closure_reason',
    'SELECT "Column closure_type already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add court acknowledgment number
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND column_name = 'court_acknowledgment_number');
SET @sqlstmt = IF(@col_exists = 0, 
    'ALTER TABLE cases ADD COLUMN court_acknowledgment_number VARCHAR(100) NULL',
    'SELECT "Column court_acknowledgment_number already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add court acknowledgment date
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND column_name = 'court_acknowledgment_date');
SET @sqlstmt = IF(@col_exists = 0, 
    'ALTER TABLE cases ADD COLUMN court_acknowledgment_date DATE NULL',
    'SELECT "Column court_acknowledgment_date already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add court acknowledgment deadline
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND column_name = 'court_acknowledgment_deadline');
SET @sqlstmt = IF(@col_exists = 0, 
    'ALTER TABLE cases ADD COLUMN court_acknowledgment_deadline DATE NULL',
    'SELECT "Column court_acknowledgment_deadline already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add court acknowledgment document path
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND column_name = 'court_acknowledgment_document');
SET @sqlstmt = IF(@col_exists = 0, 
    'ALTER TABLE cases ADD COLUMN court_acknowledgment_document VARCHAR(255) NULL',
    'SELECT "Column court_acknowledgment_document already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add court acknowledgment notes
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND column_name = 'court_acknowledgment_notes');
SET @sqlstmt = IF(@col_exists = 0, 
    'ALTER TABLE cases ADD COLUMN court_acknowledgment_notes TEXT NULL',
    'SELECT "Column court_acknowledgment_notes already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for better query performance
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND index_name = 'idx_closure_type');
SET @sqlstmt = IF(@idx_exists = 0, 
    'ALTER TABLE cases ADD INDEX idx_closure_type (closure_type)', 
    'SELECT "Index idx_closure_type already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND index_name = 'idx_court_acknowledgment_date');
SET @sqlstmt = IF(@idx_exists = 0, 
    'ALTER TABLE cases ADD INDEX idx_court_acknowledgment_date (court_acknowledgment_date)', 
    'SELECT "Index idx_court_acknowledgment_date already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = @dbname AND table_name = 'cases' AND index_name = 'idx_court_ack_deadline');
SET @sqlstmt = IF(@idx_exists = 0, 
    'ALTER TABLE cases ADD INDEX idx_court_ack_deadline (court_acknowledgment_deadline)', 
    'SELECT "Index idx_court_ack_deadline already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Display success message
SELECT 'Case closure enhancement migration completed successfully!' AS Status;
