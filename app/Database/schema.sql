-- ============================================
-- POLICE CASE MANAGEMENT SYSTEM (PCMS)
-- DATABASE SCHEMA
-- ============================================

-- DROP EXISTING TABLES (Use carefully in production)
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- CORE SYSTEM TABLES
-- ============================================

-- Police Centers/Stations
CREATE TABLE IF NOT EXISTS police_centers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    center_code VARCHAR(20) UNIQUE NOT NULL,
    center_name VARCHAR(200) NOT NULL,
    location VARCHAR(255) NOT NULL,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_center_code (center_code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users (All system users)
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    center_id INT UNSIGNED NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    role ENUM('super_admin', 'admin', 'ob_officer', 'investigator', 'court_user') NOT NULL,
    badge_number VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME,
    failed_login_attempts TINYINT DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    FOREIGN KEY (center_id) REFERENCES police_centers(id),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_center (center_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions (JWT token management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    refresh_token_hash VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PERSON MANAGEMENT (Biometric & Criminal Records)
-- ============================================

-- Master person registry (accusers, accused, witnesses)
CREATE TABLE IF NOT EXISTS persons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_type ENUM('accused', 'accuser', 'witness', 'other') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    national_id VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    photo_path VARCHAR(255),
    fingerprint_hash VARCHAR(64) UNIQUE,
    fingerprint_data MEDIUMBLOB,
    is_repeat_offender TINYINT(1) DEFAULT 0,
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_fingerprint (fingerprint_hash),
    INDEX idx_national_id (national_id),
    INDEX idx_name (last_name, first_name),
    INDEX idx_type (person_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Person aliases (alternative names)
CREATE TABLE IF NOT EXISTS person_aliases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_id INT UNSIGNED NOT NULL,
    alias_name VARCHAR(200) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    INDEX idx_person (person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
