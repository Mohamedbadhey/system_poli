-- Investigation Notes Table
-- Stores notes added by investigators for each person in a case

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
