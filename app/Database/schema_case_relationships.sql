-- Case Relationships Table
-- Tracks connections between related cases

CREATE TABLE IF NOT EXISTS case_relationships (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    case_id INT UNSIGNED NOT NULL,
    related_case_id INT UNSIGNED NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'related' COMMENT 'related, duplicate, continuation, series',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    
    -- Foreign keys (removed to avoid constraint issues)
    -- Manually enforce referential integrity in application code
    -- FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    -- FOREIGN KEY (related_case_id) REFERENCES cases(id) ON DELETE CASCADE,
    -- FOREIGN KEY (created_by) REFERENCES users(id),
    
    -- Ensure we don't have duplicate relationships
    UNIQUE KEY unique_relationship (case_id, related_case_id),
    
    -- Index for faster lookups
    INDEX idx_case_id (case_id),
    INDEX idx_related_case_id (related_case_id),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Relationships are bidirectional
-- If case A is related to case B, then case B is related to case A
