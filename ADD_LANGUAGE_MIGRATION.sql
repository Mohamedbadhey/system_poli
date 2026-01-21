-- Add language column to users table
ALTER TABLE `users` ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT 'en' AFTER `badge_number`;

-- Update existing users to have default language
UPDATE `users` SET `language` = 'en' WHERE `language` IS NULL OR `language` = '';
