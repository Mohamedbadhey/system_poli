-- ============================================
-- Create saved_full_reports Table
-- ============================================

-- Check if table exists first
SELECT 'Checking if table exists...' AS status;

-- Drop if exists (CAUTION: This will delete all data!)
-- DROP TABLE IF EXISTS saved_full_reports;

-- Create the table
CREATE TABLE IF NOT EXISTS saved_full_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    case_number VARCHAR(100),
    report_title VARCHAR(255) NOT NULL,
    report_language VARCHAR(5) DEFAULT 'en',
    report_html LONGTEXT,
    pdf_filename VARCHAR(255),
    pdf_url VARCHAR(500),
    verification_code VARCHAR(100) UNIQUE,
    qr_code TEXT,
    generated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP NULL,
    access_count INT DEFAULT 0,
    
    INDEX idx_case_id (case_id),
    INDEX idx_verification_code (verification_code),
    INDEX idx_created_at (created_at),
    INDEX idx_report_title (report_title),
    
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table was created
SELECT 'Table created successfully!' AS status;
DESCRIBE saved_full_reports;

-- Check if table is empty
SELECT COUNT(*) as total_records FROM saved_full_reports;
