-- ============================================
-- CUSTODY & PRISONER MANAGEMENT TABLES
-- ============================================

-- Custody Records (Accused in custody)
CREATE TABLE IF NOT EXISTS custody_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    person_id INT UNSIGNED NOT NULL,
    center_id INT UNSIGNED NOT NULL,
    
    -- Custody Details
    custody_status ENUM('in_custody', 'released', 'transferred', 'escaped', 'hospitalized', 'court_appearance') NOT NULL,
    custody_location VARCHAR(255) NOT NULL,
    cell_number VARCHAR(50),
    
    -- Timestamps
    custody_start DATETIME NOT NULL,
    custody_end DATETIME,
    expected_release_date DATETIME,
    
    -- Legal
    arrest_warrant_number VARCHAR(100),
    detention_order_path VARCHAR(255),
    legal_time_limit INT UNSIGNED COMMENT 'Hours allowed by law',
    
    -- Health & Welfare
    health_status ENUM('good', 'fair', 'poor', 'critical') DEFAULT 'good',
    medical_conditions TEXT,
    medications TEXT,
    last_health_check DATETIME,
    
    -- Notes
    custody_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(id),
    FOREIGN KEY (center_id) REFERENCES police_centers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_case (case_id),
    INDEX idx_person (person_id),
    INDEX idx_status (custody_status),
    INDEX idx_center (center_id),
    INDEX idx_custody_dates (custody_start, custody_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily Custody Logs
CREATE TABLE IF NOT EXISTS custody_daily_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    custody_record_id INT UNSIGNED NOT NULL,
    log_date DATE NOT NULL,
    log_time TIME NOT NULL,
    
    -- Daily Status
    custody_status ENUM('in_custody', 'released', 'transferred', 'escaped', 'hospitalized', 'court_appearance') NOT NULL,
    location VARCHAR(255) NOT NULL,
    
    -- Health & Welfare
    health_check_done TINYINT(1) DEFAULT 0,
    health_status ENUM('good', 'fair', 'poor', 'critical') DEFAULT 'good',
    health_notes TEXT,
    
    -- Activities
    meal_provided TINYINT(1) DEFAULT 0,
    exercise_allowed TINYINT(1) DEFAULT 0,
    visitor_allowed TINYINT(1) DEFAULT 0,
    visitor_names TEXT,
    
    -- Notes
    behavior_notes TEXT,
    incident_notes TEXT,
    
    logged_by INT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (custody_record_id) REFERENCES custody_records(id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by) REFERENCES users(id),
    
    INDEX idx_custody (custody_record_id),
    INDEX idx_log_date (log_date),
    UNIQUE KEY unique_daily_log (custody_record_id, log_date, log_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custody Movement Log (Transfers, court appearances, hospital visits)
CREATE TABLE IF NOT EXISTS custody_movement_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    custody_record_id INT UNSIGNED NOT NULL,
    movement_type ENUM('transfer', 'court_appearance', 'hospital_visit', 'interrogation', 'lineup', 'release') NOT NULL,
    
    -- Movement Details
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    movement_start DATETIME NOT NULL,
    movement_end DATETIME,
    
    -- Authorization
    authorized_by INT UNSIGNED NOT NULL,
    authorization_document VARCHAR(255),
    
    -- Escort
    escorted_by TEXT COMMENT 'Names of escorting officers',
    vehicle_details VARCHAR(255),
    
    -- Purpose & Outcome
    purpose TEXT NOT NULL,
    outcome TEXT,
    
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    
    FOREIGN KEY (custody_record_id) REFERENCES custody_records(id) ON DELETE CASCADE,
    FOREIGN KEY (authorized_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_custody (custody_record_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_movement_dates (movement_start, movement_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custody Alerts (Time limit warnings, health issues, etc.)
CREATE TABLE IF NOT EXISTS custody_alerts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    custody_record_id INT UNSIGNED NOT NULL,
    alert_type ENUM('time_limit_warning', 'time_limit_exceeded', 'health_critical', 'escape_attempt', 'behavior_incident', 'other') NOT NULL,
    alert_severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    alert_message TEXT NOT NULL,
    
    is_acknowledged TINYINT(1) DEFAULT 0,
    acknowledged_by INT UNSIGNED,
    acknowledged_at DATETIME,
    
    is_resolved TINYINT(1) DEFAULT 0,
    resolved_by INT UNSIGNED,
    resolved_at DATETIME,
    resolution_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (custody_record_id) REFERENCES custody_records(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    
    INDEX idx_custody (custody_record_id),
    INDEX idx_type (alert_type),
    INDEX idx_severity (alert_severity),
    INDEX idx_acknowledged (is_acknowledged),
    INDEX idx_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
