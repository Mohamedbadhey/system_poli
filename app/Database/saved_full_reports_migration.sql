-- ============================================
-- Saved Full Reports Table
-- Stores generated full case reports for permanent access
-- ============================================

CREATE TABLE IF NOT EXISTS `saved_full_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `case_id` int(11) NOT NULL,
  `case_number` varchar(100) DEFAULT NULL,
  `report_title` varchar(255) DEFAULT NULL,
  `report_language` varchar(5) DEFAULT 'en',
  `report_html` longtext DEFAULT NULL COMMENT 'Optional - not saved for PDF-only reports',
  `pdf_filename` varchar(255) DEFAULT NULL COMMENT 'PDF filename',
  `pdf_url` varchar(500) DEFAULT NULL COMMENT 'Relative PDF URL',
  `verification_code` varchar(100) DEFAULT NULL,
  `qr_code` text DEFAULT NULL,
  `generated_by` int(11) DEFAULT NULL COMMENT 'User ID who generated the report',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_accessed` datetime DEFAULT NULL,
  `access_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `verification_code` (`verification_code`),
  KEY `case_id` (`case_id`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `fk_saved_reports_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_saved_reports_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster lookups
CREATE INDEX idx_verification_code ON saved_full_reports(verification_code);
CREATE INDEX idx_created_at ON saved_full_reports(created_at);
