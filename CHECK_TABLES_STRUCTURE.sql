-- ============================================
-- Check Tables Structure for Certificates & Medical Forms
-- ============================================

-- 1. Check if tables exist
SHOW TABLES LIKE 'non_criminal_certificates';
SHOW TABLES LIKE 'medical_examination_forms';

-- 2. Check table structure
DESCRIBE non_criminal_certificates;
DESCRIBE medical_examination_forms;

-- 3. Count total records
SELECT 'Total Certificates:' as info, COUNT(*) as count FROM non_criminal_certificates;
SELECT 'Total Medical Forms:' as info, COUNT(*) as count FROM medical_examination_forms;

-- 4. Check recent records
SELECT 
    id, 
    certificate_number,
    person_name,
    purpose,
    issue_date,
    created_at,
    DATE(created_at) as creation_date,
    DATEDIFF(CURDATE(), DATE(created_at)) as days_ago
FROM non_criminal_certificates 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 
    id, 
    patient_name,
    case_id,
    hospital_name,
    examination_date,
    created_at,
    DATE(created_at) as creation_date,
    DATEDIFF(CURDATE(), DATE(created_at)) as days_ago
FROM medical_examination_forms 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check data for TODAY
SELECT 'Certificates TODAY:' as info, COUNT(*) as count 
FROM non_criminal_certificates 
WHERE DATE(created_at) = CURDATE();

SELECT 'Medical Forms TODAY:' as info, COUNT(*) as count 
FROM medical_examination_forms 
WHERE DATE(created_at) = CURDATE();

-- 6. Check data for THIS MONTH
SELECT 'Certificates THIS MONTH:' as info, COUNT(*) as count 
FROM non_criminal_certificates 
WHERE YEAR(created_at) = YEAR(CURDATE()) 
  AND MONTH(created_at) = MONTH(CURDATE());

SELECT 'Medical Forms THIS MONTH:' as info, COUNT(*) as count 
FROM medical_examination_forms 
WHERE YEAR(created_at) = YEAR(CURDATE()) 
  AND MONTH(created_at) = MONTH(CURDATE());

-- 7. Check data for THIS YEAR
SELECT 'Certificates THIS YEAR:' as info, COUNT(*) as count 
FROM non_criminal_certificates 
WHERE YEAR(created_at) = YEAR(CURDATE());

SELECT 'Medical Forms THIS YEAR:' as info, COUNT(*) as count 
FROM medical_examination_forms 
WHERE YEAR(created_at) = YEAR(CURDATE());
