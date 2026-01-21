-- Check if file versions are being created

-- 1. Check if any versions exist
SELECT COUNT(*) as total_versions 
FROM evidence_file_versions;

-- 2. View all versions (most recent first)
SELECT 
    id,
    evidence_id,
    version_number,
    file_name,
    file_path,
    replaced_by,
    replaced_at,
    notes
FROM evidence_file_versions
ORDER BY replaced_at DESC;

-- 3. Check if edit history has file paths
SELECT 
    id,
    evidence_id,
    field_name,
    old_value,
    new_value,
    old_file_path,
    new_file_path,
    edited_at
FROM evidence_edit_history
WHERE field_name IN ('file_name', 'file_path')
ORDER BY edited_at DESC
LIMIT 10;

-- 4. Check specific evidence (replace 1 with your evidence ID)
SELECT 
    e.id,
    e.evidence_number,
    e.file_name as current_file,
    e.is_edited,
    v.id as version_id,
    v.version_number,
    v.file_name as old_file_name,
    v.replaced_at
FROM evidence e
LEFT JOIN evidence_file_versions v ON v.evidence_id = e.id
WHERE e.id = 1;
