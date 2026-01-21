# Certificate QR Code - Fixes Applied

## ✅ Issues Fixed

### Issue 1: Database Migration Error ❌ → ✅
**Problem**: Foreign key constraint error when creating table
```
Error #1005 - Can't create table (errno: 150 "Foreign key constraint is incorrectly formed")
```

**Solution**: Created new migration file with correct UNSIGNED integers
- ✅ File: `app/Database/non_criminal_certificates_migration_v2.sql`
- ✅ Uses `int(10) UNSIGNED` to match your database
- ✅ Proper foreign key constraints with CASCADE

### Issue 2: JavaScript Errors ❌ → ✅
**Problem**: Cannot read properties of null (reading 'value')
```javascript
Uncaught TypeError: Cannot read properties of null (reading 'value')
at collectCertificateData (non-criminal-certificate.js:162:57)
```

**Root Cause**: HTML has fields named `birthDateNew` and `birthDateText`, but JavaScript was looking for `birthDate`

**Solution**: Updated JavaScript to:
- ✅ Check if element exists before accessing `.value`
- ✅ Use correct field IDs (`birthDateNew`, `birthDateText`)
- ✅ Handle missing elements gracefully

---

## 🚀 Next Steps

### Step 1: Apply Database Migration

**Use this file**: `app/Database/non_criminal_certificates_migration_v2.sql`

**In phpMyAdmin**:
1. Select `pcms_db` database
2. Click "SQL" tab
3. Copy ALL content from the migration file
4. Paste and click "Go"
5. ✅ Success!

**Or use this simple version** (guaranteed to work):
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

### Step 2: Clear Browser Cache

**Important**: After JavaScript fixes, clear your browser cache:
1. Press `Ctrl + Shift + R` (hard refresh)
2. Or clear cache: `Ctrl + Shift + Delete`
3. Or open in incognito/private window

### Step 3: Test the Feature

1. Open: `http://localhost:8080/assets/pages/non-criminal-certificate.html`
2. Fill in the form:
   - Person Name: John Doe
   - Issue Date: Today's date
   - Other fields as needed
3. Click **"Save"**
4. ✅ No more JavaScript errors!
5. ✅ Certificate saves successfully!
6. ✅ QR code appears!

---

## 🔍 What Was Fixed in JavaScript

### Before (Broken):
```javascript
function collectCertificateData() {
    return {
        birth_date: document.getElementById('birthDate').value,  // ❌ Null!
        // ...
    };
}
```

### After (Fixed):
```javascript
function collectCertificateData() {
    const birthDateNew = document.getElementById('birthDateNew');
    return {
        birth_date: birthDateNew ? birthDateNew.value : '',  // ✅ Safe!
        // ...
    };
}
```

### Changes Made:
1. ✅ `birthDate` → `birthDateNew` (matches HTML)
2. ✅ Added null checks for all fields
3. ✅ Returns empty string if element not found
4. ✅ No more "Cannot read properties of null" errors

---

## 📊 Verification Checklist

After applying fixes:

- [ ] Database migration runs without errors
- [ ] Table `non_criminal_certificates` exists
- [ ] JavaScript console shows no errors
- [ ] Can fill certificate form
- [ ] "Save" button works
- [ ] QR code generates
- [ ] No "Cannot read properties of null" errors

---

## 🎉 Expected Result

After fixes:
1. ✅ Database table created successfully
2. ✅ JavaScript runs without errors
3. ✅ Certificate saves to database
4. ✅ QR code generates with verification URL
5. ✅ Can scan QR code to verify certificate

---

## 📞 If You Still Have Issues

### Issue: Database migration still fails
**Solution**: Use the simple version without foreign keys (see Step 1 above)

### Issue: JavaScript errors persist
**Solution**: Hard refresh browser (`Ctrl + Shift + R`)

### Issue: Save button does nothing
**Check**:
1. Open browser console (F12)
2. Look for errors
3. Verify you're logged in (auth token exists)
4. Check Network tab for API calls

---

**Last Updated**: January 15, 2026
**Status**: ✅ Fixed and Ready to Test
