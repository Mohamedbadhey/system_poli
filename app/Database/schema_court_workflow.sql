-- ============================================
-- COURT WORKFLOW SCHEMA UPDATES
-- ============================================

-- Add court-related fields to cases table (with error handling)
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS court_status ENUM('not_sent', 'sent_to_court', 'court_review', 'court_assigned_back', 'court_closed') DEFAULT 'not_sent' AFTER status;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS sent_to_court_date DATETIME NULL AFTER court_status;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS sent_to_court_by INT UNSIGNED NULL AFTER sent_to_court_date;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS court_assigned_date DATETIME NULL AFTER sent_to_court_by;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS court_assigned_by INT UNSIGNED NULL AFTER court_assigned_date;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS court_deadline DATE NULL AFTER court_assigned_by;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS court_notes TEXT NULL AFTER court_deadline;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS closed_date DATETIME NULL AFTER court_notes;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS closed_by INT UNSIGNED NULL AFTER closed_date;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS closure_reason TEXT NULL AFTER closed_by;

-- Add indexes (check if not exists)
SET @exist_court_status := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() AND table_name = 'cases' AND index_name = 'idx_court_status');
SET @sqlstmt := IF(@exist_court_status = 0, 'ALTER TABLE cases ADD INDEX idx_court_status (court_status)', 'SELECT "Index idx_court_status already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_court_deadline := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() AND table_name = 'cases' AND index_name = 'idx_court_deadline');
SET @sqlstmt := IF(@exist_court_deadline = 0, 'ALTER TABLE cases ADD INDEX idx_court_deadline (court_deadline)', 'SELECT "Index idx_court_deadline already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_sent_to_court := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() AND table_name = 'cases' AND index_name = 'idx_sent_to_court_date');
SET @sqlstmt := IF(@exist_sent_to_court = 0, 'ALTER TABLE cases ADD INDEX idx_sent_to_court_date (sent_to_court_date)', 'SELECT "Index idx_sent_to_court_date already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create court assignments tracking table
CREATE TABLE IF NOT EXISTS court_assignments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    assigned_to INT UNSIGNED NOT NULL,
    assigned_by INT UNSIGNED NOT NULL,
    assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    deadline DATE NULL,
    notes TEXT NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    completed_date DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create case status history table for tracking workflow
CREATE TABLE IF NOT EXISTS case_status_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    old_court_status VARCHAR(50) NULL,
    new_court_status VARCHAR(50) NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    change_reason TEXT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create notifications table for court assignments and deadlines
CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    case_id INT UNSIGNED NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255) NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing case statuses enum if needed
-- Note: This is handled separately to avoid conflicts with existing data
ALTER TABLE cases MODIFY COLUMN status ENUM(
    'draft', 
    'submitted', 
    'approved', 
    'assigned', 
    'investigating', 
    'evidence_collected',
    'suspect_identified',
    'under_review',
    'closed', 
    'returned',
    'pending_court',
    'archived'
) DEFAULT 'draft';
