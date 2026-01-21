-- Evidence File Versions Table
-- Stores backup copies of replaced files for history and download

CREATE TABLE IF NOT EXISTS evidence_file_versions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    evidence_id INT UNSIGNED NOT NULL,
    version_number INT UNSIGNED NOT NULL DEFAULT 1,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INT UNSIGNED,
    replaced_by INT UNSIGNED NULL,
    replaced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
    FOREIGN KEY (replaced_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_evidence (evidence_id),
    INDEX idx_version (evidence_id, version_number),
    INDEX idx_replaced_at (replaced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add old_file_path to evidence_edit_history for file changes
ALTER TABLE evidence_edit_history 
ADD COLUMN old_file_path VARCHAR(500) NULL AFTER old_value,
ADD COLUMN new_file_path VARCHAR(500) NULL AFTER new_value;
