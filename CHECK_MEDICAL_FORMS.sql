-- ============================================
-- Medical Examination Forms - Database Queries
-- ============================================

-- 1. CHECK IF TABLE EXISTS
-- ============================================
SHOW TABLES LIKE 'medical_examination_forms';


-- 2. VIEW TABLE STRUCTURE
-- ============================================
DESCRIBE medical_examination_forms;


-- 3. COUNT ALL MEDICAL FORMS
-- ============================================
SELECT COUNT(*) as total_forms 
FROM medical_examination_forms;


-- 4. VIEW ALL MEDICAL FORMS (BASIC INFO)
-- ============================================
SELECT 
    id,
    case_id,
    case_number,
    patient_name,
    hospital_name,
    verification_code,
    report_date,
    created_at
FROM medical_examination_forms
ORDER BY created_at DESC;


-- 5. VIEW ALL FORMS WITH VERIFICATION CODES
-- ============================================
SELECT 
    id,
    case_number,
    patient_name,
    verification_code,
    qr_code,
    created_at
FROM medical_examination_forms
WHERE verification_code IS NOT NULL
ORDER BY created_at DESC;


-- 6. VIEW SPECIFIC FORM BY ID (Replace 28 with your form ID)
-- ============================================
SELECT * 
FROM medical_examination_forms 
WHERE id = 28;


-- 7. VIEW FORM BY VERIFICATION CODE
-- ============================================
SELECT * 
FROM medical_examination_forms 
WHERE verification_code = 'MED-00000028-ABC123';  -- Replace with your code


-- 8. VIEW FORMS WITH CASE DETAILS
-- ============================================
SELECT 
    mef.id,
    mef.case_number,
    mef.patient_name,
    mef.verification_code,
    mef.report_date,
    mef.created_at,
    c.incident_description,
    c.status as case_status
FROM medical_examination_forms mef
LEFT JOIN cases c ON c.id = mef.case_id
ORDER BY mef.created_at DESC;


-- 9. VIEW FORMS WITH PERSON DETAILS
-- ============================================
SELECT 
    mef.id,
    mef.case_number,
    mef.patient_name,
    mef.verification_code,
    mef.hospital_name,
    mef.report_date,
    p.full_name as person_name,
    p.person_type,
    mef.created_at
FROM medical_examination_forms mef
LEFT JOIN persons p ON p.id = mef.person_id
ORDER BY mef.created_at DESC;


-- 10. COUNT FORMS BY HOSPITAL
-- ============================================
SELECT 
    hospital_name,
    COUNT(*) as form_count
FROM medical_examination_forms
GROUP BY hospital_name
ORDER BY form_count DESC;


-- 11. VIEW RECENT FORMS (LAST 10)
-- ============================================
SELECT 
    id,
    case_number,
    patient_name,
    hospital_name,
    verification_code,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_time
FROM medical_examination_forms
ORDER BY created_at DESC
LIMIT 10;


-- 12. CHECK FORMS WITHOUT VERIFICATION CODES
-- ============================================
SELECT 
    id,
    case_number,
    patient_name,
    created_at
FROM medical_examination_forms
WHERE verification_code IS NULL
ORDER BY created_at DESC;


-- 13. VIEW FORM DATA (JSON CONTENT)
-- ============================================
SELECT 
    id,
    case_number,
    patient_name,
    form_data,
    verification_code
FROM medical_examination_forms
WHERE id = 28;  -- Replace with your form ID


-- 14. SEARCH FORMS BY PATIENT NAME
-- ============================================
SELECT 
    id,
    case_number,
    patient_name,
    verification_code,
    created_at
FROM medical_examination_forms
WHERE patient_name LIKE '%Ahmed%'  -- Replace Ahmed with search term
ORDER BY created_at DESC;


-- 15. SEARCH FORMS BY CASE NUMBER
-- ============================================
SELECT 
    id,
    case_number,
    patient_name,
    verification_code,
    created_at
FROM medical_examination_forms
WHERE case_number LIKE '%CASE-001%'  -- Replace with case number
ORDER BY created_at DESC;


-- 16. VIEW FORMS BY DATE RANGE
-- ============================================
SELECT 
    id,
    case_number,
    patient_name,
    report_date,
    verification_code,
    created_at
FROM medical_examination_forms
WHERE created_at BETWEEN '2026-01-01' AND '2026-01-31'
ORDER BY created_at DESC;


-- 17. GET VERIFICATION URL FOR A FORM
-- ============================================
SELECT 
    id,
    case_number,
    patient_name,
    verification_code,
    CONCAT('http://localhost:8080/verify-medical-form?code=', verification_code) as verification_url
FROM medical_examination_forms
WHERE id = 28;  -- Replace with your form ID


-- 18. COUNT FORMS BY DATE
-- ============================================
SELECT 
    DATE(created_at) as date,
    COUNT(*) as forms_created
FROM medical_examination_forms
GROUP BY DATE(created_at)
ORDER BY date DESC;


-- 19. DELETE TEST FORMS (BE CAREFUL!)
-- ============================================
-- DELETE FROM medical_examination_forms WHERE patient_name = 'Test Patient';


-- 20. GENERATE VERIFICATION CODE FOR FORMS WITHOUT ONE
-- ============================================
-- UPDATE medical_examination_forms
-- SET verification_code = CONCAT('MED-', LPAD(id, 8, '0'), '-', UPPER(SUBSTRING(MD5(CONCAT(id, case_number, created_at)), 1, 6)))
-- WHERE verification_code IS NULL;
