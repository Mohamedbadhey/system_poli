-- ============================================
-- Fix saved_full_reports Table
-- Add missing updated_at column
-- ============================================

-- Check current structure
DESCRIBE saved_full_reports;

-- Add updated_at column if it doesn't exist
ALTER TABLE saved_full_reports 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
AFTER created_at;

-- Verify the change
DESCRIBE saved_full_reports;

SELECT 'Table structure updated successfully!' AS status;
