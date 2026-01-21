-- ============================================
-- CASE REOPENING FEATURE MIGRATION
-- Adds fields to track case reopening with history
-- ============================================

-- Add reopening fields to cases table
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS reopened_at DATETIME DEFAULT NULL COMMENT 'Date when case was reopened',
ADD COLUMN IF NOT EXISTS reopened_by INT UNSIGNED DEFAULT NULL COMMENT 'User ID who reopened the case',
ADD COLUMN IF NOT EXISTS reopened_count INT DEFAULT 0 COMMENT 'Number of times case has been reopened',
ADD COLUMN IF NOT EXISTS reopen_reason TEXT DEFAULT NULL COMMENT 'Reason for reopening the case',
ADD COLUMN IF NOT EXISTS previous_closure_date DATETIME DEFAULT NULL COMMENT 'Date of previous closure before reopen',
ADD COLUMN IF NOT EXISTS previous_closure_type VARCHAR(50) DEFAULT NULL COMMENT 'Previous closure type before reopen',
ADD COLUMN IF NOT EXISTS previous_closure_reason TEXT DEFAULT NULL COMMENT 'Previous closure reason before reopen';

-- Add foreign key for reopened_by
ALTER TABLE cases
ADD CONSTRAINT fk_cases_reopened_by 
FOREIGN KEY (reopened_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for reopened cases queries
ALTER TABLE cases
ADD INDEX idx_reopened_at (reopened_at),
ADD INDEX idx_reopened_by (reopened_by);

-- Create case reopen history table to track all reopen events
CREATE TABLE IF NOT EXISTS case_reopen_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    reopened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reopened_by INT UNSIGNED NOT NULL,
    reopen_reason TEXT NOT NULL,
    
    -- Previous closure information
    previous_status VARCHAR(50) NOT NULL,
    previous_closure_date DATETIME,
    previous_closure_type VARCHAR(50),
    previous_closure_reason TEXT,
    previous_closed_by INT UNSIGNED,
    
    -- New assignment information (if assigned during reopen)
    assigned_to_investigator INT UNSIGNED DEFAULT NULL,
    assigned_by INT UNSIGNED DEFAULT NULL,
    assignment_notes TEXT DEFAULT NULL,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (reopened_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (previous_closed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_investigator) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_case_id (case_id),
    INDEX idx_reopened_at (reopened_at),
    INDEX idx_reopened_by (reopened_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks complete history of case reopening events';

-- Update status enum to include 'reopened' status
-- Note: This will preserve existing data
-- Current status values in pcms_db.sql: 'draft','submitted','pending_parties','approved','assigned','investigating','evidence_collected','suspect_identified','under_review','closed','returned','pending_court','archived'
ALTER TABLE cases 
MODIFY COLUMN status ENUM(
    'draft', 'submitted', 'pending_parties', 'approved', 'assigned', 
    'investigating', 'evidence_collected', 'suspect_identified', 'under_review', 
    'closed', 'returned', 'pending_court', 'archived', 'reopened'
) DEFAULT 'draft'
COMMENT 'Case status - reopened indicates case was closed and then reopened for further investigation';
