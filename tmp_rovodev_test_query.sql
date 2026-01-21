-- Test query to check court acknowledgments
SELECT * FROM court_acknowledgments;

-- Test with today's date
SELECT * FROM court_acknowledgments 
WHERE DATE(uploaded_at) = '2026-01-19';

-- Test with week range
SELECT * FROM court_acknowledgments 
WHERE DATE(uploaded_at) BETWEEN '2026-01-13' AND '2026-01-19';

-- Check all dates
SELECT id, case_id, uploaded_at, DATE(uploaded_at) as upload_date 
FROM court_acknowledgments;
