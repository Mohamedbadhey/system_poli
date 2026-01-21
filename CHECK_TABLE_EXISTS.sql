-- Check if non_criminal_certificates table exists
SHOW TABLES LIKE 'non_criminal_certificates';

-- If it exists, check its structure
DESCRIBE non_criminal_certificates;

-- Check if it has any data
SELECT COUNT(*) as total_records FROM non_criminal_certificates;
