# Debug 500 Error - Enhanced Error Logging

## 🔍 Changes Made

I've added more detailed error logging to see the EXACT error message from the server.

## 🧪 Test Again

1. **Refresh page** (Ctrl + Shift + R)
2. **Open Console** (F12)
3. **Load certificate for editing**
4. **Upload photo**
5. **Click Update**
6. **Look for these NEW lines in console:**

```
🔍 [DEBUG] Response result.message: [detailed error message]
🔍 [DEBUG] Response result.errors: [specific errors]
❌ [ERROR] Server returned error: [error]
❌ [ERROR] Error details: [details]
```

---

## 📊 What to Look For

The server should now tell us EXACTLY what's wrong:

### Possible Errors:

#### Error 1: Column Too Small
```
Response result.message: "Data too long for column 'photo_path'"
```
**Fix**: Run the ALTER TABLE SQL to change column size

#### Error 2: Missing Required Field
```
Response result.errors: {"issue_date":["required"],...}
```
**Fix**: Make sure issue_date is filled

#### Error 3: Validation Error
```
Response result.errors: {"gender":["invalid value"],...}
```
**Fix**: Check form field values

---

## ✅ Did You Run the SQL?

**CHECK THIS FIRST!**

Run this in phpMyAdmin SQL tab to check column size:
```sql
SHOW COLUMNS FROM non_criminal_certificates WHERE Field='photo_path';
```

**Expected Result:**
- If it shows `varchar(255)` → ❌ You need to run the ALTER TABLE
- If it shows `longtext` → ✅ Column is correct

**If NOT longtext, run this:**
```sql
ALTER TABLE `non_criminal_certificates` 
MODIFY COLUMN `photo_path` LONGTEXT DEFAULT NULL;
```

---

## 🎯 Test Steps

1. **First**: Check if column was changed (run SQL above)
2. **If not changed**: Run ALTER TABLE SQL
3. **Then**: Refresh certificate page
4. **Try Update again**
5. **Check console** for new detailed error messages
6. **Copy and paste** the error details here

---

**The new console logs will tell us the EXACT error!** 

Test now and share what `Response result.message` and `Response result.errors` show!
