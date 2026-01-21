-- Run these queries to check versioning status

-- 1. Check if evidence_file_versions table exists
SELECT COUNT(*) as total_versions 
FROM evidence_file_versions;
-- Expected: Number of old file versions stored

-- 2. View all stored versions
SELECT 
    id,
    evidence_id,
    version_number,
    file_name,
    replaced_at,
    notes
FROM evidence_file_versions
ORDER BY replaced_at DESC
LIMIT 10;
-- Expected: List of old file versions (may be empty if no replacements since migration)

-- 3. Check if edit history has file path columns
DESCRIBE evidence_edit_history;
-- Look for: old_file_path, new_file_path columns

-- 4. Check if file path changes are being tracked
SELECT 
    eh.id,
    eh.evidence_id,
    eh.field_name,
    eh.old_value as old_filename,
    eh.new_value as new_filename,
    eh.old_file_path,
    eh.new_file_path,
    eh.edited_at,
    u.full_name as editor
FROM evidence_edit_history eh
LEFT JOIN users u ON u.id = eh.edited_by
WHERE eh.field_name IN ('file_name', 'file_path')
ORDER BY eh.edited_at DESC
LIMIT 10;
-- Expected: Should show old_file_path and new_file_path values

-- 5. Check a specific evidence that had file replaced
-- Replace '1' with actual evidence ID
SELECT 
    e.id,
    e.evidence_number,
    e.file_name as current_filename,
    e.is_edited,
    COUNT(v.id) as version_count
FROM evidence e
LEFT JOIN evidence_file_versions v ON v.evidence_id = e.id
WHERE e.id = 1
GROUP BY e.id;
-- Expected: Shows if this evidence has old versions stored

-- 6. Find evidence with file changes
SELECT DISTINCT
    eh.evidence_id,
    e.evidence_number,
    e.file_name as current_file,
    COUNT(DISTINCT v.id) as stored_versions
FROM evidence_edit_history eh
JOIN evidence e ON e.id = eh.evidence_id
LEFT JOIN evidence_file_versions v ON v.evidence_id = eh.evidence_id
WHERE eh.field_name = 'file_name'
GROUP BY eh.evidence_id
ORDER BY eh.evidence_id;
-- Shows which evidence has file changes and how many versions are stored
