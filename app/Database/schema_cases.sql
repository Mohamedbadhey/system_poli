-- ============================================
-- CASE MANAGEMENT TABLES
-- ============================================

-- Main Cases Table (OB Entries)
CREATE TABLE IF NOT EXISTS cases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    ob_number VARCHAR(50) UNIQUE NOT NULL,
    center_id INT UNSIGNED NOT NULL,
    
    -- Case Details
    incident_date DATETIME NOT NULL,
    report_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    incident_location TEXT NOT NULL,
    incident_gps_latitude DECIMAL(10, 8),
    incident_gps_longitude DECIMAL(11, 8),
    incident_description TEXT NOT NULL,
    
    -- Case Classification
    crime_type VARCHAR(100) NOT NULL,
    crime_category ENUM('violent', 'property', 'drug', 'cybercrime', 'sexual', 'juvenile', 'other') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_sensitive TINYINT(1) DEFAULT 0,
    
    -- Status Management
    status ENUM('draft', 'submitted', 'returned', 'approved', 'assigned', 
                'investigating', 'solved', 'escalated', 'court_pending', 'closed') DEFAULT 'draft',
    status_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Workflow
    submitted_at DATETIME,
    approved_at DATETIME,
    assigned_at DATETIME,
    closed_at DATETIME,
    
    -- Investigation
    investigation_deadline DATETIME,
    investigation_started_at DATETIME,
    investigation_completed_at DATETIME,
    outcome ENUM('solved_internal', 'escalated_to_court', 'withdrawn', 'merged') DEFAULT NULL,
    outcome_description TEXT,
    
    -- Court Handover
    court_submitted_at DATETIME,
    court_decision_received_at DATETIME,
    court_decision_file VARCHAR(255),
    
    -- Timestamps and Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    approved_by INT UNSIGNED,
    
    -- Relationships
    FOREIGN KEY (center_id) REFERENCES police_centers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_case_number (case_number),
    INDEX idx_ob_number (ob_number),
    INDEX idx_center (center_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_incident_date (incident_date),
    INDEX idx_crime_type (crime_type),
    INDEX idx_sensitive (is_sensitive),
    FULLTEXT idx_description (incident_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case Parties (Accuser, Accused, Witnesses)
CREATE TABLE IF NOT EXISTS case_parties (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    person_id INT UNSIGNED NOT NULL,
    party_role ENUM('accuser', 'accused', 'witness', 'informant') NOT NULL,
    statement TEXT,
    statement_date DATETIME,
    statement_audio_path VARCHAR(255),
    statement_signed_document VARCHAR(255),
    is_primary TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(id),
    INDEX idx_case (case_id),
    INDEX idx_person (person_id),
    INDEX idx_role (party_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case Assignments (Investigators)
CREATE TABLE IF NOT EXISTS case_assignments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    investigator_id INT UNSIGNED NOT NULL,
    assigned_by INT UNSIGNED NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deadline DATETIME,
    is_lead_investigator TINYINT(1) DEFAULT 0,
    status ENUM('active', 'completed', 'reassigned') DEFAULT 'active',
    completed_at DATETIME,
    notes TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (investigator_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    INDEX idx_case (case_id),
    INDEX idx_investigator (investigator_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case Status History (Workflow tracking)
CREATE TABLE IF NOT EXISTS case_status_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_case (case_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evidence Management
CREATE TABLE IF NOT EXISTS evidence (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    evidence_number VARCHAR(50) UNIQUE NOT NULL,
    evidence_type ENUM('photo', 'video', 'audio', 'document', 'physical', 'digital') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- File Information
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size INT UNSIGNED,
    is_encrypted TINYINT(1) DEFAULT 1,
    encryption_key_hash VARCHAR(64),
    
    -- Chain of Custody
    collected_by INT UNSIGNED,
    collected_from ENUM('crime_scene', 'accuser', 'accused', 'witness', 'other'),
    collected_from_person_id INT UNSIGNED,
    collected_at DATETIME,
    location_collected TEXT,
    
    -- Metadata
    is_critical TINYINT(1) DEFAULT 0,
    is_digital_signed TINYINT(1) DEFAULT 0,
    signature_hash VARCHAR(64),
    tags VARCHAR(255),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by) REFERENCES users(id),
    FOREIGN KEY (collected_from_person_id) REFERENCES persons(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_case (case_id),
    INDEX idx_evidence_number (evidence_number),
    INDEX idx_type (evidence_type),
    INDEX idx_critical (is_critical)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evidence Chain of Custody Log
CREATE TABLE IF NOT EXISTS evidence_custody_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    evidence_id INT UNSIGNED NOT NULL,
    action ENUM('collected', 'stored', 'transferred', 'analyzed', 'returned', 'disposed') NOT NULL,
    performed_by INT UNSIGNED NOT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(255),
    notes TEXT,
    witness_id INT UNSIGNED,
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id),
    FOREIGN KEY (witness_id) REFERENCES users(id),
    INDEX idx_evidence (evidence_id),
    INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Investigation Timeline
CREATE TABLE IF NOT EXISTS investigation_timeline (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    investigator_id INT UNSIGNED NOT NULL,
    activity_type ENUM('interview', 'site_visit', 'evidence_collection', 'analysis', 'meeting', 'report', 'other') NOT NULL,
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    activity_date DATETIME NOT NULL,
    location VARCHAR(255),
    persons_involved TEXT,
    outcome TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (investigator_id) REFERENCES users(id),
    INDEX idx_case (case_id),
    INDEX idx_activity_date (activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Investigation Reports
CREATE TABLE IF NOT EXISTS investigation_reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    report_type ENUM('preliminary', 'interim', 'final', 'court_submission') NOT NULL,
    report_title VARCHAR(255) NOT NULL,
    report_content LONGTEXT NOT NULL,
    report_file_path VARCHAR(255),
    
    -- Digital Signature
    is_signed TINYINT(1) DEFAULT 0,
    signature_hash VARCHAR(64),
    signed_by INT UNSIGNED,
    signed_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (signed_by) REFERENCES users(id),
    
    INDEX idx_case (case_id),
    INDEX idx_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
