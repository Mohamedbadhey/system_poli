-- Check certificates in database to test the view functionality

-- 1. Show all certificates with basic info
SELECT 
    id,
    certificate_number,
    person_name,
    mother_name,
    gender,
    birth_date,
    purpose,
    issue_date,
    CASE 
        WHEN photo_path IS NULL THEN '❌ NO PHOTO'
        WHEN photo_path LIKE 'data:image%' THEN '✅ BASE64 PHOTO'
        WHEN LENGTH(photo_path) > 1000 THEN '✅ BASE64 PHOTO'
        ELSE '⚠️ FILE PATH'
    END as photo_status,
    LENGTH(photo_path) as photo_size_bytes,
    CASE 
        WHEN director_signature IS NULL THEN '❌ NO SIGNATURE'
        WHEN director_signature LIKE 'data:image%' THEN '✅ BASE64 SIGNATURE'
        WHEN LENGTH(director_signature) > 1000 THEN '✅ BASE64 SIGNATURE'
        ELSE '⚠️ FILE PATH'
    END as signature_status,
    created_at
FROM non_criminal_certificates
ORDER BY created_at DESC
LIMIT 10;

-- 2. Get a specific certificate ID to test with
SELECT 
    id as certificate_id,
    certificate_number,
    person_name,
    CONCAT('Test URL: http://localhost:8080/assets/pages/non-criminal-certificate.html?id=', id) as test_url
FROM non_criminal_certificates
ORDER BY created_at DESC
LIMIT 1;

-- 3. Check medical forms
SELECT 
    id,
    case_number,
    patient_name,
    hospital_name,
    examination_date,
    CASE 
        WHEN form_data IS NULL THEN '❌ NO DATA'
        WHEN form_data = '' THEN '❌ EMPTY'
        WHEN LENGTH(form_data) > 100 THEN '✅ HAS DATA'
        ELSE '⚠️ INCOMPLETE'
    END as data_status,
    LENGTH(form_data) as data_size_bytes,
    created_at,
    CONCAT('Test URL: http://localhost:8080/assets/pages/medical-examination-report.html?id=', id) as test_url
FROM medical_examination_forms
ORDER BY created_at DESC
LIMIT 10;

-- 4. Get one medical form ID to test with
SELECT 
    id as medical_form_id,
    case_number,
    patient_name,
    CONCAT('Test URL: http://localhost:8080/assets/pages/medical-examination-report.html?id=', id) as test_url
FROM medical_examination_forms
ORDER BY created_at DESC
LIMIT 1;

-- 5. Count total records
SELECT 
    (SELECT COUNT(*) FROM non_criminal_certificates) as total_certificates,
    (SELECT COUNT(*) FROM medical_examination_forms) as total_medical_forms;
