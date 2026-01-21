-- Fix Daily Operations View Issues
-- This ensures certificates and medical forms can display photos properly
-- Photos are stored as base64 in the database

-- =============================================
-- 1. FIX NON_CRIMINAL_CERTIFICATES TABLE
-- =============================================

-- Check current structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'non_criminal_certificates'
AND COLUMN_NAME IN ('photo_path', 'director_signature');

-- Fix photo_path to handle base64 images (can be several MB)
ALTER TABLE `non_criminal_certificates`
MODIFY COLUMN `photo_path` LONGTEXT DEFAULT NULL COMMENT 'Base64 encoded photo or file path';

-- Fix director_signature to handle base64 signatures
ALTER TABLE `non_criminal_certificates`
MODIFY COLUMN `director_signature` LONGTEXT DEFAULT NULL COMMENT 'Base64 encoded signature';

-- =============================================
-- 2. CHECK MEDICAL EXAMINATION FORMS TABLE
-- =============================================

-- Check if table exists
SELECT COUNT(*) as table_exists
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'medical_examination_forms';

-- Check current structure (if exists)
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'medical_examination_forms'
AND COLUMN_NAME = 'form_data';

-- Ensure form_data can hold large JSON data
ALTER TABLE `medical_examination_forms`
MODIFY COLUMN `form_data` LONGTEXT DEFAULT NULL COMMENT 'JSON encoded form data including signatures';

-- =============================================
-- 3. VERIFY FIXES
-- =============================================

-- Show updated structure for certificates
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'non_criminal_certificates'
AND COLUMN_NAME IN ('photo_path', 'director_signature', 'mother_name');

-- Show updated structure for medical forms
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'medical_examination_forms'
AND COLUMN_NAME = 'form_data';

-- =============================================
-- 4. TEST DATA RETRIEVAL
-- =============================================

-- Test certificate retrieval (same as API does)
SELECT 
    id,
    certificate_number,
    person_name,
    mother_name,
    gender,
    birth_date,
    birth_place,
    CASE 
        WHEN photo_path IS NULL THEN 'NO_PHOTO'
        WHEN photo_path LIKE 'data:image%' THEN 'BASE64_IMAGE'
        ELSE 'FILE_PATH'
    END as photo_type,
    LENGTH(photo_path) as photo_size_bytes,
    purpose,
    validity_period,
    issue_date,
    director_name,
    CASE 
        WHEN director_signature IS NULL THEN 'NO_SIGNATURE'
        ELSE 'HAS_SIGNATURE'
    END as signature_status
FROM non_criminal_certificates
ORDER BY created_at DESC
LIMIT 5;

-- Test medical form retrieval
SELECT 
    id,
    case_number,
    patient_name,
    hospital_name,
    examination_date,
    CASE 
        WHEN form_data IS NULL THEN 'NO_DATA'
        ELSE 'HAS_DATA'
    END as data_status,
    LENGTH(form_data) as data_size_bytes,
    created_at
FROM medical_examination_forms
ORDER BY created_at DESC
LIMIT 5;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Database columns updated successfully! Now test the view buttons in Daily Operations.' as status;
