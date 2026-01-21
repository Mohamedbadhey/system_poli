-- Fix Mother Name and Photo in Non-Criminal Certificates
-- Issue: photo_path column is VARCHAR(255) but needs LONGTEXT for Base64 images
-- Issue: Mother name field is present but may not be saving properly

-- 1. Fix photo_path column size (change from VARCHAR(255) to LONGTEXT)
ALTER TABLE `non_criminal_certificates`
MODIFY COLUMN `photo_path` LONGTEXT DEFAULT NULL COMMENT 'Base64 encoded photo or file path';

-- 2. Verify mother_name column exists and is properly configured
ALTER TABLE `non_criminal_certificates`
MODIFY COLUMN `mother_name` VARCHAR(255) DEFAULT NULL COMMENT 'Mother full name';

-- 3. Verify the table structure
DESCRIBE non_criminal_certificates;

-- 4. Check if any existing records have truncated photo data
SELECT 
    id, 
    certificate_number, 
    person_name,
    mother_name,
    CASE 
        WHEN photo_path IS NULL THEN 'No photo'
        WHEN LENGTH(photo_path) < 255 THEN 'Possibly file path'
        ELSE 'Base64 data'
    END as photo_status,
    LENGTH(photo_path) as photo_data_length
FROM non_criminal_certificates
ORDER BY created_at DESC
LIMIT 10;
