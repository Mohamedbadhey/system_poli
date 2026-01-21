-- Note Edit History Table
-- Tracks all edits made to investigation notes

CREATE TABLE IF NOT EXISTS note_edit_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    note_id INT UNSIGNED NOT NULL,
    edited_by INT UNSIGNED NOT NULL,
    old_text TEXT NOT NULL,
    new_text TEXT NOT NULL,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (note_id) REFERENCES investigation_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_note (note_id),
    INDEX idx_edited_at (edited_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Also add is_edited flag to investigation_notes table
ALTER TABLE investigation_notes 
ADD COLUMN is_edited TINYINT(1) DEFAULT 0 AFTER note_text,
ADD COLUMN last_edited_at TIMESTAMP NULL AFTER is_edited,
ADD COLUMN last_edited_by INT UNSIGNED NULL AFTER last_edited_at,
ADD FOREIGN KEY (last_edited_by) REFERENCES users(id) ON DELETE SET NULL;
