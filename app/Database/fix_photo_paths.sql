-- Fix Photo Paths in Database
-- This updates old paths from writable/ to uploads/
-- Run this once to fix existing records

UPDATE persons 
SET photo_path = REPLACE(photo_path, 'writable/uploads/persons/', 'uploads/persons/') 
WHERE photo_path LIKE 'writable/%';

-- Check the results
SELECT id, first_name, last_name, photo_path 
FROM persons 
WHERE photo_path IS NOT NULL;
