-- Fix max_allowed_packet error for large photos
-- This allows MySQL to accept larger packets (up to 64MB)

-- Check current value
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Increase to 64MB (temporary - for current session)
SET GLOBAL max_allowed_packet=67108864;

-- Or increase to 128MB if you have very large photos
-- SET GLOBAL max_allowed_packet=134217728;

-- After running this, RESTART your PHP server!
-- The setting takes effect on new connections.

-- To make permanent, add to my.ini or my.cnf:
-- [mysqld]
-- max_allowed_packet=64M
