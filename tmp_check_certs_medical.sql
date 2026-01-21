-- Check certificates
SELECT COUNT(*) as certificate_count FROM non_criminal_certificates;
SELECT * FROM non_criminal_certificates ORDER BY created_at DESC LIMIT 3;

-- Check medical forms
SELECT COUNT(*) as medical_form_count FROM medical_examination_forms;
SELECT * FROM medical_examination_forms ORDER BY created_at DESC LIMIT 3;
