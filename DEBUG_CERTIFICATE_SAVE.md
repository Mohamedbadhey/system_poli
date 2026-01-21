# Debug: Certificate Not Saving (500 Error)

## 🔍 Current Issue

Getting 500 Internal Server Error when trying to save certificate.

## 🚨 Most Likely Cause

**The database table was NOT created!**

The error is happening because the `non_criminal_certificates` table doesn't exist in your database.

---

## ✅ SOLUTION: Create the Table Now

### Step 1: Check if Table Exists

Run this in phpMyAdmin:
```sql
SHOW TABLES LIKE 'non_criminal_certificates';
```

**If it returns empty** → Table doesn't exist (this is the problem!)

---

### Step 2: Create the Table

Copy this ENTIRE SQL and run it in phpMyAdmin:

```sql
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

### Step 3: Verify Table Was Created

Run this:
```sql
DESCRIBE non_criminal_certificates;
```

Should show 22 columns.

---

## 🎯 After Creating the Table

1. **Don't refresh anything**
2. Just go back to the certificate page
3. Click "Save" again
4. ✅ **Should work now!**

---

## 📝 How to Apply in phpMyAdmin

1. **Open phpMyAdmin** in browser
2. **Click** on `pcms_db` database (left sidebar)
3. **Click** "SQL" tab (top menu)
4. **Copy** the entire CREATE TABLE SQL above
5. **Paste** into the text box
6. **Click** "Go" button (bottom right)
7. **Success message** should appear

---

## ✅ Verification Steps

After creating table:

### 1. Check in phpMyAdmin
- Look at left sidebar
- Should see `non_criminal_certificates` in table list

### 2. Test the Save Button
- Go back to certificate page
- Fill form
- Click "Save"
- Should work!

### 3. Check Database
```sql
SELECT * FROM non_criminal_certificates;
```
Should show your saved certificate!

---

## 🐛 Other Possible Issues (if table exists)

If table already exists but still getting 500 error:

### Check 1: Server Logs
```sql
-- Run this to enable query logging
SET GLOBAL general_log = 'ON';
```

### Check 2: Column Names
```sql
-- Verify all columns exist
DESCRIBE non_criminal_certificates;
```

### Check 3: Data Types
Make sure:
- `id` is `int(10) UNSIGNED`
- `issued_by` is `int(10) UNSIGNED`
- `person_id` is `int(10) UNSIGNED`

---

## 💡 Quick Test

After creating table, test with this:
```sql
-- Try manual insert to test table
INSERT INTO non_criminal_certificates 
(certificate_number, person_name, gender, issue_date, issued_by, verification_token)
VALUES
('TEST-001', 'Test Person', 'MALE', '2026-01-15', 26, 'test123456789');

-- Check if it worked
SELECT * FROM non_criminal_certificates;
```

If manual insert works, then the code will work too!

---

## 🎉 Expected Result After Fix

Console should show:
```
✅ Certificate saved with verification URL: http://localhost:8080/verify-certificate/abc123...
✅ QR Code generated with data: http://localhost:8080/verify-certificate/abc123...
```

Database should show:
```
1 row inserted with verification_token
```

---

**DO THIS NOW:**
1. Go to phpMyAdmin
2. Run the CREATE TABLE SQL
3. Try saving certificate again
4. Should work! ✅
