-- Migrate old 'submitted' cases to 'approved' status
-- Since OB officers now submit directly (no approval step needed)

USE pcms_db;

-- Check how many cases have 'submitted' status
SELECT COUNT(*) as submitted_cases_count
FROM cases 
WHERE status = 'submitted';

-- View these cases
SELECT id, case_number, crime_category, status, created_at, submitted_at
FROM cases
WHERE status = 'submitted'
ORDER BY id DESC;

-- Migrate 'submitted' status to 'approved' 
-- (since there's no approval step anymore)
UPDATE cases 
SET status = 'approved'
WHERE status = 'submitted';

-- Verify the migration
SELECT COUNT(*) as approved_cases_count
FROM cases 
WHERE status = 'approved';

-- Show all case statuses
SELECT status, COUNT(*) as count
FROM cases
GROUP BY status
ORDER BY count DESC;
