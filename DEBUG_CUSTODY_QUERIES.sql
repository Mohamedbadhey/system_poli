-- ============================================
-- DEBUG QUERIES FOR CUSTODY MANAGEMENT
-- ============================================

-- Query 1: Check all cases with their parties
-- This shows all cases and the accused/accuser information
SELECT 
    c.id AS case_id,
    c.case_number,
    c.ob_number,
    c.crime_type,
    c.status AS case_status,
    c.created_at,
    cp.party_role,
    p.id AS person_id,
    CONCAT(p.first_name, ' ', p.last_name) AS person_name,
    p.person_type
FROM cases c
LEFT JOIN case_parties cp ON c.id = cp.case_id
LEFT JOIN persons p ON cp.person_id = p.id
ORDER BY c.id DESC, cp.party_role;

-- Query 2: Check all accused persons
-- Shows all persons marked as accused
SELECT 
    p.id AS person_id,
    CONCAT(p.first_name, ' ', p.last_name) AS person_name,
    p.person_type,
    p.national_id,
    p.phone,
    cp.party_role,
    c.case_number,
    c.crime_type
FROM persons p
LEFT JOIN case_parties cp ON p.id = cp.person_id
LEFT JOIN cases c ON cp.case_id = c.id
WHERE p.person_type = 'accused' OR cp.party_role = 'accused'
ORDER BY p.id DESC;

-- Query 3: Check all custody records
-- Shows all custody records with person and case details
SELECT 
    cr.id AS custody_id,
    cr.custody_status,
    cr.custody_location,
    cr.cell_number,
    cr.custody_start,
    cr.custody_end,
    cr.custody_notes,
    CONCAT(p.first_name, ' ', p.last_name) AS person_name,
    p.id AS person_id,
    c.case_number,
    c.id AS case_id,
    cr.created_at
FROM custody_records cr
JOIN persons p ON cr.person_id = p.id
JOIN cases c ON cr.case_id = c.id
ORDER BY cr.id DESC;

-- Query 4: Check active custody (what the page should show)
-- This mimics what getActiveCustody() returns
SELECT 
    cr.*,
    p.first_name,
    p.last_name,
    c.case_number
FROM custody_records cr
JOIN persons p ON p.id = cr.person_id
JOIN cases c ON c.id = cr.case_id
WHERE cr.custody_status = 'in_custody'
ORDER BY cr.id DESC;

-- Query 5: Find accused persons WITHOUT custody records
-- These are accused that should have custody but don't
SELECT 
    p.id AS person_id,
    CONCAT(p.first_name, ' ', p.last_name) AS person_name,
    c.case_number,
    c.crime_type,
    cp.party_role,
    'NO CUSTODY RECORD' AS issue
FROM persons p
JOIN case_parties cp ON p.id = cp.person_id
JOIN cases c ON cp.case_id = c.id
WHERE cp.party_role = 'accused'
AND p.id NOT IN (SELECT person_id FROM custody_records)
ORDER BY p.id DESC;

-- Query 6: Check if OB Entry form submission created data
-- Shows recent cases and checks for custody
SELECT 
    c.id AS case_id,
    c.case_number,
    c.crime_type,
    c.created_at AS case_created,
    COUNT(DISTINCT cp.id) AS party_count,
    COUNT(DISTINCT CASE WHEN cp.party_role = 'accused' THEN cp.id END) AS accused_count,
    COUNT(DISTINCT cr.id) AS custody_count,
    GROUP_CONCAT(DISTINCT cp.party_role) AS roles_in_case
FROM cases c
LEFT JOIN case_parties cp ON c.id = cp.case_id
LEFT JOIN custody_records cr ON c.id = cr.case_id
GROUP BY c.id
ORDER BY c.id DESC
LIMIT 10;

-- Query 7: Detailed view of most recent cases
-- Shows everything about the last 5 cases
SELECT 
    c.id AS case_id,
    c.case_number,
    c.crime_type,
    c.created_at,
    CONCAT(accused.first_name, ' ', accused.last_name) AS accused_name,
    accused.id AS accused_person_id,
    cr.id AS custody_id,
    cr.custody_status,
    cr.custody_location,
    CASE 
        WHEN cr.id IS NULL THEN 'NO CUSTODY RECORD CREATED'
        WHEN cr.custody_status = 'in_custody' THEN 'IN CUSTODY - SHOULD SHOW IN LIST'
        ELSE CONCAT('STATUS: ', cr.custody_status)
    END AS custody_info
FROM cases c
LEFT JOIN case_parties cp_accused ON c.id = cp_accused.case_id AND cp_accused.party_role = 'accused'
LEFT JOIN persons accused ON cp_accused.person_id = accused.id
LEFT JOIN custody_records cr ON c.id = cr.case_id AND cr.person_id = accused.id
ORDER BY c.id DESC
LIMIT 5;

-- Query 8: Check your user's center_id
-- Important: Custody records are filtered by center_id
SELECT 
    u.id AS user_id,
    u.username,
    u.full_name,
    u.role,
    u.center_id,
    pc.center_name,
    pc.center_code
FROM users u
LEFT JOIN police_centers pc ON u.center_id = pc.id
WHERE u.role = 'ob_officer'
ORDER BY u.id DESC;

-- Query 9: Check custody records by center
-- See which center has which custody records
SELECT 
    cr.center_id,
    pc.center_name,
    COUNT(*) AS custody_count,
    COUNT(CASE WHEN cr.custody_status = 'in_custody' THEN 1 END) AS active_count
FROM custody_records cr
LEFT JOIN police_centers pc ON cr.center_id = pc.id
GROUP BY cr.center_id;

-- Query 10: Full diagnostic - Everything about your last case
-- Replace {case_id} with your actual case ID
-- SELECT 
--     c.id AS case_id,
--     c.case_number,
--     c.crime_type,
--     c.status,
--     '---PARTIES---' AS separator1,
--     GROUP_CONCAT(DISTINCT CONCAT(cp.party_role, ': ', p.first_name, ' ', p.last_name) SEPARATOR ' | ') AS parties,
--     '---CUSTODY---' AS separator2,
--     cr.id AS custody_record_id,
--     cr.custody_status,
--     cr.custody_location,
--     cr.center_id,
--     cr.created_at AS custody_created
-- FROM cases c
-- LEFT JOIN case_parties cp ON c.id = cp.case_id
-- LEFT JOIN persons p ON cp.person_id = p.id
-- LEFT JOIN custody_records cr ON c.id = cr.case_id
-- WHERE c.id = {case_id}
-- GROUP BY c.id;

-- ============================================
-- QUICK DIAGNOSTIC SUMMARY
-- ============================================

-- Run this to get a quick overview
SELECT 'Total Cases' AS metric, COUNT(*) AS count FROM cases
UNION ALL
SELECT 'Total Persons', COUNT(*) FROM persons
UNION ALL
SELECT 'Accused Persons', COUNT(*) FROM persons WHERE person_type = 'accused'
UNION ALL
SELECT 'Case Parties (Accused)', COUNT(*) FROM case_parties WHERE party_role = 'accused'
UNION ALL
SELECT 'Total Custody Records', COUNT(*) FROM custody_records
UNION ALL
SELECT 'Active Custody (in_custody)', COUNT(*) FROM custody_records WHERE custody_status = 'in_custody'
UNION ALL
SELECT 'Released Custody', COUNT(*) FROM custody_records WHERE custody_status = 'released';

-- ============================================
-- WHAT TO LOOK FOR
-- ============================================

/*
1. Run Query 6 first - Check if your cases have custody records
   - If custody_count = 0, then no custody was created

2. Run Query 5 - Find accused without custody
   - This shows which accused should have custody but don't

3. Run Query 7 - Detailed recent cases
   - See exactly what happened with your last 5 cases

4. Run Query 8 - Check your center_id
   - Make sure you know which center you're assigned to

5. Run Query 4 - Check active custody
   - This is what SHOULD appear in Custody Management

COMMON ISSUES:
- Custody record not created when submitting OB Entry
- center_id mismatch (record created for different center)
- custody_status not set to 'in_custody'
- Person created but not linked to custody
*/
