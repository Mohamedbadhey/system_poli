-- ============================================
-- FIX LEGACY CLOSED CASES
-- This script updates closed cases that are missing closure data
-- ============================================

-- First, let's see what we're dealing with
SELECT 
    id,
    case_number,
    status,
    closed_date,
    closed_by,
    closure_type,
    updated_at
FROM cases 
WHERE status = 'closed' 
    AND (closed_date IS NULL OR closed_by IS NULL OR closure_type IS NULL)
ORDER BY id;

-- Update legacy closed cases with missing closure data
-- We'll set:
-- 1. closed_date = updated_at (when the case was last modified)
-- 2. closed_by = created_by (best guess - the officer who created it)
-- 3. closure_type = 'investigator_closed' (default legacy type)

UPDATE cases 
SET 
    closed_date = COALESCE(closed_date, updated_at),
    closed_by = COALESCE(closed_by, created_by),
    closure_type = COALESCE(closure_type, 'investigator_closed'),
    closure_reason = COALESCE(closure_reason, 'Legacy case - closed before closure tracking was implemented')
WHERE status = 'closed' 
    AND (closed_date IS NULL OR closed_by IS NULL OR closure_type IS NULL);

-- Verify the update
SELECT 
    id,
    case_number,
    status,
    closed_date,
    closed_by,
    closure_type,
    closure_reason
FROM cases 
WHERE status = 'closed'
ORDER BY id;
