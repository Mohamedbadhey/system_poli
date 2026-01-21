-- ============================================
-- AUDIT, SECURITY & SYSTEM TABLES
-- ============================================

-- Audit Logs (Immutable system-wide audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- User & Action
    user_id INT UNSIGNED,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    
    -- Target
    entity_type VARCHAR(50) NOT NULL COMMENT 'Table name or entity type',
    entity_id INT UNSIGNED,
    
    -- Details
    description TEXT NOT NULL,
    old_values JSON,
    new_values JSON,
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    
    -- Timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Digital Signatures Registry
CREATE TABLE IF NOT EXISTS digital_signatures (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Document Reference
    entity_type VARCHAR(50) NOT NULL COMMENT 'cases, investigation_reports, evidence, etc',
    entity_id INT UNSIGNED NOT NULL,
    
    -- Signature Data
    signature_hash VARCHAR(64) UNIQUE NOT NULL,
    signature_algorithm VARCHAR(50) DEFAULT 'SHA256-RSA',
    signature_data TEXT NOT NULL COMMENT 'Base64 encoded signature',
    
    -- Signer
    signed_by INT UNSIGNED NOT NULL,
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Certificate (if applicable)
    certificate_data TEXT,
    
    -- Verification
    is_verified TINYINT(1) DEFAULT 1,
    verified_at DATETIME,
    
    FOREIGN KEY (signed_by) REFERENCES users(id),
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_signature (signature_hash),
    INDEX idx_signer (signed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- File Encryption Registry
CREATE TABLE IF NOT EXISTS file_encryption_registry (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- File Reference
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT UNSIGNED NOT NULL,
    file_path VARCHAR(255) UNIQUE NOT NULL,
    
    -- Encryption Details
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-CBC',
    encryption_key_hash VARCHAR(64) NOT NULL COMMENT 'Hash of the encryption key',
    iv VARCHAR(32) NOT NULL COMMENT 'Initialization vector',
    
    -- Access Control
    access_level ENUM('public', 'internal', 'restricted', 'confidential', 'top_secret') DEFAULT 'internal',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_file_path (file_path),
    INDEX idx_access_level (access_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    
    -- Notification Details
    notification_type ENUM('case_assigned', 'deadline_warning', 'status_changed', 'approval_required', 
                           'custody_alert', 'system_alert', 'message') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Links
    link_entity_type VARCHAR(50),
    link_entity_id INT UNSIGNED,
    link_url VARCHAR(255),
    
    -- Status
    is_read TINYINT(1) DEFAULT 0,
    read_at DATETIME,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_type (notification_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public TINYINT(1) DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    FOREIGN KEY (updated_by) REFERENCES users(id),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Templates (for reports, letters, etc.)
CREATE TABLE IF NOT EXISTS document_templates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_type ENUM('investigation_report', 'court_submission', 'letter', 'form', 'other') NOT NULL,
    template_content LONGTEXT NOT NULL,
    variables JSON COMMENT 'Template variables for replacement',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_type (template_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Log (User actions for monitoring)
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (activity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments/Notes on Cases
CREATE TABLE IF NOT EXISTS case_comments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    comment_text TEXT NOT NULL,
    is_internal TINYINT(1) DEFAULT 1 COMMENT 'Internal notes vs official comments',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_case (case_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
