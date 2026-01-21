-- ============================================
-- FIX REPORT GENERATION DATABASE ISSUES
-- This script ensures all required tables and columns exist
-- ============================================

-- 1. Ensure investigation_notes table exists
CREATE TABLE IF NOT EXISTS investigation_notes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    person_id INT UNSIGNED NOT NULL,
    investigator_id INT UNSIGNED NOT NULL,
    note_type ENUM('investigation', 'statement', 'observation', 'interview') DEFAULT 'investigation',
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (investigator_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_case (case_id),
    INDEX idx_person (person_id),
    INDEX idx_investigator (investigator_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Ensure investigator_conclusions table exists
CREATE TABLE IF NOT EXISTS investigator_conclusions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    investigator_id INT UNSIGNED NOT NULL,
    findings TEXT,
    evidence_summary TEXT,
    recommendations TEXT,
    conclusion_status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (investigator_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_case (case_id),
    INDEX idx_investigator (investigator_id),
    INDEX idx_status (conclusion_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add witness affiliation columns to case_parties if they don't exist
SET @dbname = DATABASE();
SET @tablename = 'case_parties';
SET @columnname1 = 'witness_affiliation';
SET @columnname2 = 'affiliated_person_id';

-- Check and add witness_affiliation column
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname1)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE case_parties ADD COLUMN witness_affiliation ENUM(''accuser'', ''accused'', ''neutral'') DEFAULT ''neutral'' AFTER is_primary'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add affiliated_person_id column
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE case_parties ADD COLUMN affiliated_person_id INT(11) UNSIGNED NULL AFTER witness_affiliation'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes if they don't exist (will fail silently if they exist)
ALTER TABLE case_parties ADD INDEX idx_witness_affiliation (witness_affiliation);
ALTER TABLE case_parties ADD INDEX idx_affiliated_person (affiliated_person_id);

-- Add foreign key constraint if it doesn't exist (check first)
SET @fk_exists = (SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'case_parties' 
    AND CONSTRAINT_NAME = 'fk_affiliated_person');

SET @preparedStatement = IF(@fk_exists > 0,
    'SELECT 1',
    'ALTER TABLE case_parties ADD CONSTRAINT fk_affiliated_person FOREIGN KEY (affiliated_person_id) REFERENCES persons(id) ON DELETE SET NULL'
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing witnesses to be neutral by default
UPDATE case_parties 
SET witness_affiliation = 'neutral' 
WHERE party_role = 'witness' AND witness_affiliation IS NULL;

-- 4. Add badge_number to users table if it doesn't exist
SET @tablename = 'users';
SET @columnname = 'badge_number';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN badge_number VARCHAR(50) NULL AFTER email'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Show summary of what was done
SELECT 'Database structure updated successfully for report generation' as Result;
