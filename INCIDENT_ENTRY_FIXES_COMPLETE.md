# Incident Entry - Complete Fix Summary

## Issues Fixed

### 1. ✅ Status Column Saved as Empty String

**Problem**: The `status` column was being saved as empty string (`''`) instead of proper values like `'draft'`, `'submitted'`, or `'pending_parties'`.

**Root Cause**: The `status` field is an ENUM in MySQL, and `'pending_parties'` was NOT in the allowed values list. When trying to insert an invalid ENUM value, MySQL automatically inserts an empty string.

**Solution**:
1. Added `'pending_parties'` to the status ENUM:
   ```sql
   ALTER TABLE `cases` 
   MODIFY COLUMN `status` ENUM(
       'draft',
       'submitted',
       'pending_parties',  -- ✅ ADDED
       'approved',
       'assigned',
       'investigating',
       'evidence_collected',
       'suspect_identified',
       'under_review',
       'closed',
       'returned',
       'pending_court',
       'archived'
   ) DEFAULT 'draft';
   ```

2. Fixed all 15 existing cases with empty status (changed to `'submitted'`)

3. Added safeguards in code:
   - Controller explicitly casts status to string
   - Added validation before insert
   - Model has `ensureStatusDefault` callback

**Files Modified**:
- ✅ Database: `cases` table status ENUM
- ✅ `app/Controllers/OB/CaseController.php`
- ✅ `app/Models/CaseModel.php`

---

### 2. ✅ Categories Loading Failed with 403 Error

**Problem**: When loading the incident-entry page, categories failed to load with error:
```
403 Forbidden: Insufficient permissions
```

**Root Cause**: The JavaScript was calling `/admin/categories` endpoint, which requires `admin` or `super_admin` role. OB officers don't have access to this endpoint.

**Solution**: Changed the endpoint to `/ob/categories` which is accessible to OB officers (defined in Routes.php line 81).

**Files Modified**:
- ✅ `public/assets/js/incident-entry.js` (line 476)

---

## Database Changes Applied

### 1. Status ENUM Update
```sql
ALTER TABLE `cases` 
MODIFY COLUMN `status` ENUM(
    'draft',
    'submitted',
    'pending_parties',
    'approved',
    'assigned',
    'investigating',
    'evidence_collected',
    'suspect_identified',
    'under_review',
    'closed',
    'returned',
    'pending_court',
    'archived'
) DEFAULT 'draft';
```

### 2. Fixed Existing Empty Status Cases
```sql
UPDATE cases 
SET status = CASE 
    WHEN submitted_at IS NOT NULL THEN 'submitted'
    ELSE 'draft'
END
WHERE status = '' OR status IS NULL;
```

**Result**: Fixed 15 cases with empty status

---

## Code Changes

### 1. CaseController.php - createIncident() Method

**Added**:
- Type casting for all input values
- Explicit status determination before insert
- Validation to ensure status is never empty
- Better logging for debugging

**Key Changes**:
```php
// Set initial status (default to draft if nothing matches)
$initialStatus = 'draft';

if ($shouldSubmit) {
    if ($hasPartyData) {
        $initialStatus = 'submitted';
    } else {
        $initialStatus = 'pending_parties';  // ✅ Now works!
    }
}

$data = [
    'center_id' => (int)$centerId,
    // ... other fields ...
    'is_sensitive' => (int)($input['is_sensitive'] ?? 0),
    'status' => (string)$initialStatus,  // ✅ Explicit cast
    'created_by' => (int)$userId
];

// CRITICAL FIX: Ensure status is never empty before insert
if (empty($data['status']) || $data['status'] === '' || $data['status'] === null) {
    log_message('warning', 'Status was empty/null before insert, forcing to draft');
    $data['status'] = 'draft';
}
```

### 2. CaseModel.php - Added ensureStatusDefault Callback

```php
protected $beforeInsert = ['generateCaseNumbers', 'ensureStatusDefault'];

protected function ensureStatusDefault(array $data)
{
    log_message('debug', 'ensureStatusDefault called - status before: ' . json_encode($data['data']['status'] ?? 'NOT SET'));
    
    if (!isset($data['data']['status']) || $data['data']['status'] === '' || $data['data']['status'] === null) {
        log_message('debug', 'ensureStatusDefault - Setting status to draft');
        $data['data']['status'] = 'draft';
    }
    
    log_message('debug', 'ensureStatusDefault called - status after: ' . json_encode($data['data']['status']));
    
    return $data;
}
```

### 3. incident-entry.js - Fixed Categories Endpoint

**Before**:
```javascript
const response = await api.get('/admin/categories');
```

**After**:
```javascript
// Use /ob/categories for OB officers (has proper access control)
const response = await api.get('/ob/categories');
```

---

## Testing Instructions

### Test 1: Create Incident as Draft
1. Go to incident-entry page
2. Fill in required fields
3. Click "Save as Draft"
4. **Expected**: Status = `'draft'` ✅

### Test 2: Submit Incident Without Party
1. Go to incident-entry page
2. Fill in required fields (do NOT check "Add Party")
3. Click "Submit for Approval"
4. **Expected**: Status = `'pending_parties'` ✅

### Test 3: Submit Incident With Party
1. Go to incident-entry page
2. Fill in required fields
3. Check "Add Party" and fill party details
4. Click "Submit for Approval"
5. **Expected**: Status = `'submitted'` ✅

### Test 4: Categories Load Successfully
1. Go to incident-entry page
2. Check browser console for errors
3. **Expected**: No 403 errors, categories dropdown populated ✅

---

## Verification Queries

```sql
-- Check recent cases and their status
SELECT id, case_number, status, submitted_at, created_at 
FROM cases 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if any cases still have empty status
SELECT COUNT(*) as empty_status_count
FROM cases 
WHERE status = '' OR status IS NULL;

-- Should return 0 ✅
```

---

## Files to Clean Up (Optional)

The following temporary test files can be deleted:
- `check_cases.php`
- `check_table_structure.php`
- `apply_enum_fix.php`
- `fix_status_enum.sql`
- `tmp_rovodev_*.php` (all temp files)
- `tmp_rovodev_*.sql` (all temp SQL files)

---

## Summary

✅ **Status column issue**: FIXED - Added `'pending_parties'` to ENUM  
✅ **Empty status cases**: FIXED - Updated 15 existing cases  
✅ **Categories loading**: FIXED - Changed endpoint to `/ob/categories`  
✅ **Code safeguards**: ADDED - Multiple validation layers  
✅ **Logging**: ENHANCED - Better debugging capability  

All incidents created from now on will have proper status values.
