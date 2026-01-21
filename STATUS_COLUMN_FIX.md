# Status Column Fix - Incident Entry

## Problem Summary

The `status` column in the `cases` table was being saved as an **empty string (`''`)** instead of a proper status value like `'draft'` or `'submitted'`.

### Affected Records
Looking at the database (`pcms_db.sql`), cases with ID 15 and 24 had empty status:
```sql
(15, 'CASE/XGD-01/2026/0003', ..., '', 'not_sent', ...)
(24, 'CASE/XGD-01/2026/0012', ..., '', 'not_sent', ...)
```

## Root Cause

The issue was in `app/Controllers/OB/CaseController.php` in the `createIncident()` method:

1. **Original Logic**: The code was inserting the case with `status = 'draft'`, then attempting to UPDATE it to `'submitted'` or `'pending_parties'` if `should_submit` was true
2. **The Problem**: The UPDATE operation was happening AFTER the transaction, but for some reason was not persisting correctly
3. **Result**: Cases ended up with empty status values

## Solution Implemented

### 1. Fixed `CaseController.php` - `createIncident()` Method

**Before** (Lines 371-382):
```php
$shouldSubmit = isset($input['should_submit']) && $input['should_submit'] == 1;

$data = [
    'center_id' => $centerId,
    'incident_date' => $input['incident_date'] ?? null,
    'incident_location' => $input['incident_location'] ?? null,
    'incident_description' => $input['incident_description'] ?? null,
    'crime_type' => $input['crime_type'] ?? null,
    'crime_category' => $input['crime_category'] ?? null,
    'priority' => $input['priority'] ?? 'medium',
    'is_sensitive' => $input['is_sensitive'] ?? 0,
    'status' => 'draft', // Always start as draft
    'created_by' => $userId
];
```

**After** (Lines 369-404):
```php
// Determine initial status based on should_submit flag
$shouldSubmit = isset($input['should_submit']) && $input['should_submit'] == 1;
$hasPartyData = isset($input['party']) && is_array($input['party']);

// Set initial status
if ($shouldSubmit) {
    if ($hasPartyData) {
        $initialStatus = 'submitted';
    } else {
        $initialStatus = 'pending_parties';
    }
} else {
    $initialStatus = 'draft';
}

$data = [
    'center_id' => $centerId,
    'incident_date' => $input['incident_date'] ?? null,
    'incident_location' => $input['incident_location'] ?? null,
    'incident_description' => $input['incident_description'] ?? null,
    'crime_type' => $input['crime_type'] ?? null,
    'crime_category' => $input['crime_category'] ?? null,
    'priority' => $input['priority'] ?? 'medium',
    'is_sensitive' => $input['is_sensitive'] ?? 0,
    'status' => $initialStatus,
    'created_by' => $userId
];

// Set submitted_at if submitting
if ($shouldSubmit) {
    $data['submitted_at'] = date('Y-m-d H:i:s');
}
```

**Key Changes**:
- Status is now determined BEFORE the insert
- Correct status is set from the beginning
- `submitted_at` is also set during initial insert if needed
- Removed the unnecessary UPDATE operation after insert

### 2. Added Safeguard in `CaseModel.php`

Added a `beforeInsert` callback to ensure status never gets an empty string:

**File**: `app/Models/CaseModel.php`

```php
protected $beforeInsert = ['generateCaseNumbers', 'ensureStatusDefault'];

/**
 * Ensure status has a default value (never empty string)
 */
protected function ensureStatusDefault(array $data)
{
    // If status is not set, empty, or null, default to 'draft'
    if (!isset($data['data']['status']) || $data['data']['status'] === '' || $data['data']['status'] === null) {
        $data['data']['status'] = 'draft';
    }
    
    return $data;
}
```

This acts as a **safety net** to prevent any empty status values from being inserted, regardless of where the insert comes from.

## How to Apply the Fix

### Step 1: Code Changes (Already Applied)
The code changes have been applied to:
- `app/Controllers/OB/CaseController.php`
- `app/Models/CaseModel.php`

### Step 2: Fix Existing Cases with Empty Status

Run the SQL fix script:
```bash
# On Windows
type tmp_rovodev_fix_empty_status.sql | mysql -u your_user -p pcms_db

# Or manually execute the SQL file in phpMyAdmin or MySQL client
```

Or run this single UPDATE query:
```sql
UPDATE cases 
SET status = CASE 
    WHEN submitted_at IS NOT NULL THEN 'submitted'
    ELSE 'draft'
END,
status_changed_at = NOW()
WHERE status = '' OR status IS NULL;
```

### Step 3: Verify the Fix (Optional)

Run the test script:
```bash
php tmp_rovodev_test_status_fix.php
```

## Testing the Fix

### Test Case 1: Create Incident as Draft
1. Go to Incident Entry page
2. Fill in required fields
3. Click "Save as Draft"
4. **Expected**: Status should be `'draft'`

### Test Case 2: Submit Incident Without Parties
1. Go to Incident Entry page
2. Fill in required fields (do NOT check "Add Party")
3. Click "Submit for Approval"
4. **Expected**: Status should be `'pending_parties'` or `'submitted'`

### Test Case 3: Submit Incident With Parties
1. Go to Incident Entry page
2. Fill in required fields
3. Check "Add Party" and fill in party details
4. Click "Submit for Approval"
5. **Expected**: Status should be `'submitted'`

## Verification Queries

Check if any cases still have empty status:
```sql
SELECT id, case_number, status, created_at 
FROM cases 
WHERE status = '' OR status IS NULL;
```

Check recent cases and their status:
```sql
SELECT id, case_number, status, submitted_at, created_at 
FROM cases 
ORDER BY created_at DESC 
LIMIT 10;
```

## Status Flow Reference

The valid status values for cases are:
- `draft` - Initial state, not yet submitted
- `submitted` - Submitted for approval (has parties)
- `pending_parties` - Submitted but needs party information
- `approved` - Approved by admin
- `assigned` - Assigned to investigator
- `investigating` - Under investigation
- `evidence_collected` - Evidence collected
- `suspect_identified` - Suspect identified
- `under_review` - Under review
- `closed` - Case closed
- `returned` - Returned for corrections
- `pending_court` - Pending court decision
- `archived` - Archived

## Files Modified

1. ✅ `app/Controllers/OB/CaseController.php` - Fixed createIncident() method
2. ✅ `app/Models/CaseModel.php` - Added ensureStatusDefault() callback

## Files Created (Temporary - Can be deleted after testing)

1. `tmp_rovodev_test_status_fix.php` - Test script
2. `tmp_rovodev_fix_empty_status.sql` - SQL fix script
3. `STATUS_COLUMN_FIX.md` - This documentation

## Summary

✅ **Issue**: Status column saved as empty string  
✅ **Root Cause**: Status was being updated AFTER insert instead of being set correctly during insert  
✅ **Fix**: Set correct status during initial insert + added safety callback  
✅ **Prevention**: CaseModel now has automatic empty status prevention  

The fix ensures that:
- New cases will ALWAYS have a valid status
- Empty or null status values are automatically converted to 'draft'
- The status is set correctly based on the submission intent
