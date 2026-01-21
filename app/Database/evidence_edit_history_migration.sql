-- Evidence Edit History Table
-- Tracks all edits made to evidence records

CREATE TABLE IF NOT EXISTS evidence_edit_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    evidence_id INT UNSIGNED NOT NULL,
    edited_by INT UNSIGNED NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_evidence (evidence_id),
    INDEX idx_edited_at (edited_at),
    INDEX idx_edited_by (edited_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add edit tracking fields to evidence table
ALTER TABLE evidence 
ADD COLUMN is_edited TINYINT(1) DEFAULT 0 AFTER tags,
ADD COLUMN last_edited_at TIMESTAMP NULL AFTER is_edited,
ADD COLUMN last_edited_by INT UNSIGNED NULL AFTER last_edited_at,
ADD FOREIGN KEY (last_edited_by) REFERENCES users(id) ON DELETE SET NULL;
