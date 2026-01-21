-- ============================================
-- CATEGORIES MANAGEMENT TABLES
-- ============================================

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3498db',
    icon VARCHAR(50) DEFAULT 'fa-folder',
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_name (name),
    INDEX idx_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default categories
INSERT INTO categories (name, description, color, icon, display_order) VALUES
('Violent Crimes', 'Cases involving violence against persons', '#e74c3c', 'fa-hand-fist', 1),
('Property Crimes', 'Cases involving theft, burglary, vandalism', '#f39c12', 'fa-home', 2),
('Drug Related', 'Cases involving drug possession, trafficking', '#9b59b6', 'fa-pills', 3),
('Cybercrime', 'Cases involving computer and internet crimes', '#3498db', 'fa-laptop', 4),
('Sexual Offenses', 'Cases involving sexual assault and harassment', '#e91e63', 'fa-user-shield', 5),
('Juvenile Cases', 'Cases involving minors', '#00bcd4', 'fa-child', 6),
('Other', 'Miscellaneous cases', '#95a5a6', 'fa-folder', 7)
ON DUPLICATE KEY UPDATE name=name;
