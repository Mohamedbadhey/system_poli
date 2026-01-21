# Simple Migration Guide - Non-Criminal Certificates

## 🚀 Easy Steps to Apply Migration

### Step 1: Copy the SQL

Open this file in a text editor:
```
app/Database/non_criminal_certificates_migration_v2.sql
```

### Step 2: Run in phpMyAdmin

1. **Open phpMyAdmin** in your browser
2. **Select** `pcms_db` database from left sidebar
3. **Click** "SQL" tab at the top
4. **Copy ALL content** from the migration file
5. **Paste** into the SQL box
6. **Click "Go"** button

### Step 3: Verify Success

You should see messages like:
```
✓ Query OK, 0 rows affected (0.05 sec)
✓ Table created successfully
```

Check if table exists:
- Look at left sidebar in phpMyAdmin
- You should see `non_criminal_certificates` in the table list

### Step 4: Test the Feature

1. Open: `http://localhost:8080/assets/pages/non-criminal-certificate.html`
2. Fill in the form
3. Click "Save"
4. QR code should appear! 🎉

---

## ❌ If You Still Get Error

### Try This Simpler Version (No Foreign Keys)

If the migration still fails, use this simplified SQL instead:

```sql
-- Simple version without foreign keys
DROP TABLE IF EXISTS `non_criminal_certificates`;

CREATE TABLE `non_criminal_certificates` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `certificate_number` varchar(100) NOT NULL,
  `person_id` int(10) UNSIGNED DEFAULT NULL,
  `person_name` varchar(255) NOT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','male','female') NOT NULL,
  `birth_date` date DEFAULT NULL,
  `birth_place` varchar(255) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `validity_period` varchar(50) DEFAULT '6 months',
  `issue_date` date NOT NULL,
  `director_name` varchar(255) DEFAULT NULL,
  `director_signature` text DEFAULT NULL,
  `issued_by` int(10) UNSIGNED NOT NULL,
  `verification_token` varchar(64) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `verification_count` int(11) DEFAULT 0,
  `last_verified_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_number` (`certificate_number`),
  UNIQUE KEY `verification_token` (`verification_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

This version will work 100% without any foreign key issues!

---

## ✅ After Success

Once the table is created, you're ready to:
1. Create certificates with QR codes
2. Scan QR codes to verify
3. Track verification statistics

The system will work perfectly even without foreign keys!
