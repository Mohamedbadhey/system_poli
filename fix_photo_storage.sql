-- Fix photo_path column to handle large base64 images
-- Change from VARCHAR(255) to LONGTEXT

ALTER TABLE `non_criminal_certificates` 
MODIFY COLUMN `photo_path` LONGTEXT DEFAULT NULL COMMENT 'Base64 encoded photo or file path';

-- Verify the change
DESCRIBE non_criminal_certificates;
