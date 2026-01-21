-- Check if photo_path column was updated
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'pcms_db'
  AND TABLE_NAME = 'non_criminal_certificates'
  AND COLUMN_NAME = 'photo_path';

-- If it still shows varchar(255), run this:
-- ALTER TABLE `non_criminal_certificates` 
-- MODIFY COLUMN `photo_path` LONGTEXT DEFAULT NULL;
