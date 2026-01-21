DROP TABLE IF EXISTS `saved_full_reports`;

CREATE TABLE `saved_full_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `case_id` int(11) NOT NULL,
  `case_number` varchar(100) DEFAULT NULL,
  `report_title` varchar(255) DEFAULT NULL,
  `report_language` varchar(5) DEFAULT 'en',
  `report_html` longtext DEFAULT NULL,
  `pdf_filename` varchar(255) DEFAULT NULL,
  `pdf_url` varchar(500) DEFAULT NULL,
  `verification_code` varchar(100) DEFAULT NULL,
  `qr_code` text DEFAULT NULL,
  `generated_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_accessed` datetime DEFAULT NULL,
  `access_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `verification_code` (`verification_code`),
  KEY `case_id` (`case_id`),
  KEY `generated_by` (`generated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
