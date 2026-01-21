# Test Evidence Edit History Feature

## ✅ Pre-Checks

### 1. Database Migration Applied?
Run this SQL to check if columns exist:
```sql
DESCRIBE evidence_edit_history;
```

**Expected columns:**
- `id`
- `evidence_id`
- `edited_by`
- `field_name`
- `old_value`
- `new_value`
- `old_file_path` ← **Must exist!**
- `new_file_path` ← **Must exist!**
- `edited_at`

**If missing:** Run the migration again!
```bash
mysql -u root pcms_db < app/Database/evidence_file_versions_migration.sql
```

---

### 2. Test if Backend Returns File Paths

Open browser console and run:
```javascript
// Replace 1 with actual evidence ID that has file changes
fetch('/investigation/evidence/1/history', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
    }
})
.then(r => r.json())
.then(d => {
    console.log('Edit History Response:', d);
    
    // Check for file changes
    const fileChanges = d.data.filter(e => e.field_name === 'file_name');
    console.log('File Changes:', fileChanges);
    
    // Check if old_file_path and new_file_path exist
    fileChanges.forEach(fc => {
        console.log('Has old_file_path?', fc.old_file_path ? 'YES ✓' : 'NO ✗');
        console.log('Has new_file_path?', fc.new_file_path ? 'YES ✓' : 'NO ✗');
        console.log('Has version_id?', fc.version_id ? 'YES ✓' : 'NO ✗');
    });
});
```

---

## 🧪 Testing Steps

### Step 1: Replace a File
1. Login to dashboard
2. Go to any case with evidence
3. Click **Edit** on evidence
4. Click **Replace File**
5. Select a new file
6. Click **Upload**
7. Wait for success message

---

### Step 2: View Edit History
1. Click **Edit** on the same evidence
2. In the edit modal, click **View Edit History** button
3. Look for file change entry

**Expected:**
```
┌──────────────────────────────────────────────────┐
│ Date       | Editor   | Field         | Old→New │
├──────────────────────────────────────────────────┤
│ Jan 15 10:30| John Doe| 🔄 File Name | 📄 old.jpg│
│            |         | (RED BADGE)  | [Download Old]│
│            |         |              | 📄 new.jpg│
│            |         |              | [Download New]│
└──────────────────────────────────────────────────┘
```

**If you see this instead:**
```
Old Value: old.jpg
New Value: new.jpg
(No download buttons)
```

Then the issue is that `old_file_path` and `new_file_path` are not in the database or not being returned by the API.

---

### Step 3: Test Download Buttons

1. Click **Download Old** button
2. **Expected:** File downloads with name like `v1_old_file.jpg`

3. Click **Download New** button
4. **Expected:** Current file downloads

---

## 🐛 Troubleshooting

### Issue 1: No Download Buttons Show
**Cause:** `old_file_path` and `new_file_path` columns missing or NULL

**Fix:**
```sql
-- Check columns exist
DESCRIBE evidence_edit_history;

-- If missing, run migration
SOURCE app/Database/evidence_file_versions_migration.sql;

-- Or manually add columns
ALTER TABLE evidence_edit_history 
ADD COLUMN old_file_path VARCHAR(500) NULL AFTER old_value,
ADD COLUMN new_file_path VARCHAR(500) NULL AFTER new_value;
```

---

### Issue 2: Download Old Button Doesn't Work
**Cause:** `version_id` not found

**Check:**
```sql
-- See if versions are being stored
SELECT * FROM evidence_file_versions WHERE evidence_id = 1;

-- Check if version_id is in history response
-- (Use browser console test above)
```

**Fix:** Make sure file replacement creates version entry

---

### Issue 3: Files Not Being Versioned
**Cause:** `evidence_file_versions` table doesn't exist

**Check:**
```sql
SHOW TABLES LIKE 'evidence_file_versions';
```

**Fix:**
```sql
-- Run migration
SOURCE app/Database/evidence_file_versions_migration.sql;
```

---

## 📊 Manual Database Check

### Check Edit History Table Structure
```sql
DESCRIBE evidence_edit_history;
```

### Check File Versions Table
```sql
DESCRIBE evidence_file_versions;
```

### View Edit History for Evidence ID 1
```sql
SELECT 
    h.*,
    u.full_name as editor_name,
    v.id as version_id,
    v.version_number
FROM evidence_edit_history h
LEFT JOIN users u ON u.id = h.edited_by
LEFT JOIN evidence_file_versions v ON v.evidence_id = h.evidence_id 
    AND v.file_path = h.old_file_path
WHERE h.evidence_id = 1
ORDER BY h.edited_at DESC;
```

This should show:
- All history entries
- Editor names
- For file changes: `old_file_path`, `new_file_path`, `version_id`

---

## ✅ Success Criteria

When working correctly, you should see:

1. **File changes have RED badge** with exchange icon (🔄)
2. **Old filename shown** with [Download Old] button
3. **New filename shown** with [Download New] button
4. **Clicking Download Old** downloads the previous version
5. **Clicking Download New** downloads the current version
6. **Browser console shows** `old_file_path` and `new_file_path` in API response

---

## 🔍 Debug Checklist

- [ ] Migration applied successfully
- [ ] `evidence_file_versions` table exists
- [ ] `old_file_path` column exists in `evidence_edit_history`
- [ ] `new_file_path` column exists in `evidence_edit_history`
- [ ] File replacement creates version entry
- [ ] API returns file paths in history
- [ ] Frontend detects file changes
- [ ] Download buttons appear
- [ ] Download Old works
- [ ] Download New works

---

## 📝 Quick Fix Commands

If migration failed or columns missing:

```sql
-- Drop and recreate (CAUTION: loses version data!)
DROP TABLE IF EXISTS evidence_file_versions;

-- Add columns if missing
ALTER TABLE evidence_edit_history 
ADD COLUMN IF NOT EXISTS old_file_path VARCHAR(500) NULL AFTER old_value,
ADD COLUMN IF NOT EXISTS new_file_path VARCHAR(500) NULL AFTER new_value;

-- Then run full migration
SOURCE app/Database/evidence_file_versions_migration.sql;
```

---

**After fixing, clear browser cache (Ctrl+F5) and test again!**
