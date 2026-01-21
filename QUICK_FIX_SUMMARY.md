# Quick Fix Summary - Status Column Issue

## ❌ Problem
The `status` column in the `cases` table was being saved as an **empty string (`''`)** instead of proper values like `'draft'` or `'submitted'`.

Example from database:
```sql
-- Case ID 15 and 24 had empty status
(15, 'CASE/XGD-01/2026/0003', ..., '', 'not_sent', ...)
(24, 'CASE/XGD-01/2026/0012', ..., '', 'not_sent', ...)
```

## ✅ Solution

### 1. Fixed `app/Controllers/OB/CaseController.php`
- **Line 369-404**: Status is now determined BEFORE insert based on submission intent
- **Logic**: 
  - If submitting WITH parties → `status = 'submitted'`
  - If submitting WITHOUT parties → `status = 'pending_parties'`
  - If saving as draft → `status = 'draft'`
- **Removed**: Unnecessary UPDATE operation after insert that was causing the issue

### 2. Added Safety in `app/Models/CaseModel.php`
- **Line 34**: Added `ensureStatusDefault` to `beforeInsert` callbacks
- **Line 37-47**: New method that prevents empty status values
- **Purpose**: Acts as a safeguard - any empty/null status automatically becomes `'draft'`

## 🔧 How to Fix Existing Cases

Run this SQL query to fix cases that already have empty status:

```sql
UPDATE cases 
SET status = CASE 
    WHEN submitted_at IS NOT NULL THEN 'submitted'
    ELSE 'draft'
END,
status_changed_at = NOW()
WHERE status = '' OR status IS NULL;
```

Or use the provided script:
```bash
mysql -u your_user -p pcms_db < tmp_rovodev_fix_empty_status.sql
```

## 🧪 Testing

### Manual Test:
1. Go to Incident Entry page
2. Create an incident (with or without parties)
3. Click either "Save as Draft" or "Submit for Approval"
4. Check database: `SELECT id, case_number, status FROM cases ORDER BY id DESC LIMIT 5;`
5. **Expected**: Status should be `'draft'`, `'submitted'`, or `'pending_parties'` - never empty string

### Automated Test:
```bash
php tmp_rovodev_test_status_fix.php
```

## 📋 Verification Checklist

- [x] Code fix applied to CaseController.php
- [x] Safety callback added to CaseModel.php
- [x] Test script created (tmp_rovodev_test_status_fix.php)
- [x] SQL fix script created (tmp_rovodev_fix_empty_status.sql)
- [ ] SQL fix executed on database (Run when ready)
- [ ] Manual testing completed
- [ ] All existing empty status cases fixed

## 🎯 Result

**Before**: Cases could have empty string status (`''`)  
**After**: All cases will have valid status values (`'draft'`, `'submitted'`, `'pending_parties'`, etc.)

The fix is **backward compatible** and will not affect existing functionality.
