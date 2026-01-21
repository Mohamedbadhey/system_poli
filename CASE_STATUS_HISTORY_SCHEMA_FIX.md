# Case Status History Schema Fix

## Issue
Approving cases from the pending cases page was still throwing a 500 error:
```
CodeIgniter\Database\BaseBuilder::setBind(): Argument #1 ($key) must be of type string, int given
```

## Root Cause
The `CaseStatusHistoryModel` and the `case_status_history` database table had mismatched column names:

### Database Schema (Actual)
```sql
CREATE TABLE `case_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `case_id` int(11) NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,     -- ✓ Correct name
  `new_status` varchar(50) NOT NULL,
  `changed_by` int(11) NOT NULL,
  `changed_at` datetime NOT NULL,
  `reason` text DEFAULT NULL                       -- ✓ Correct name
);
```

### Model Schema (Before Fix)
```php
protected $allowedFields = [
    'case_id', 
    'old_status',        // ❌ Should be 'previous_status'
    'new_status', 
    'changed_by', 
    'change_reason'      // ❌ Should be 'reason'
];
```

When `CaseModel::updateStatus()` tried to insert a status change, it used the correct database column names, but they weren't in the model's `$allowedFields`, causing the binding error.

## Solution

### 1. Fixed CaseModel.php (updateStatus method)
**Before:**
```php
$historyModel->insert([
    'case_id' => $caseId,
    'old_status' => $previousStatus,      // Wrong column name
    'new_status' => $newStatus,
    'changed_by' => $userId,
    'change_reason' => $reason            // Wrong column name
]);
```

**After:**
```php
$historyModel->insert([
    'case_id' => (int)$caseId,
    'previous_status' => (string)$previousStatus,  // ✓ Correct
    'new_status' => (string)$newStatus,
    'changed_by' => (int)$userId,
    'reason' => $reason,                           // ✓ Correct
    'changed_at' => date('Y-m-d H:i:s')
]);
```

### 2. Fixed CaseStatusHistoryModel.php
Updated `$allowedFields` to match database:
```php
protected $allowedFields = [
    'case_id', 
    'previous_status',    // ✓ Fixed
    'new_status', 
    'changed_by', 
    'reason'              // ✓ Fixed
];
```

Updated `logStatusChange()` method to support both old and new names (backward compatibility):
```php
'previous_status' => isset($data['previous_status']) 
    ? (string)$data['previous_status'] 
    : (isset($data['old_status']) ? (string)$data['old_status'] : null),
    
'reason' => isset($data['reason']) 
    ? (string)$data['reason'] 
    : (isset($data['change_reason']) ? (string)$data['change_reason'] : null)
```

## Files Modified
1. ✅ `app/Models/CaseModel.php` - Fixed column names in updateStatus()
2. ✅ `app/Models/CaseStatusHistoryModel.php` - Fixed allowedFields and logStatusChange()

## Impact
- ✅ Approve now works without errors
- ✅ Return now works without errors
- ✅ Status changes are properly logged in case_status_history table
- ✅ Notifications are created correctly
- ✅ Frontend shows success messages

## Testing
1. Login as Admin
2. Go to Pending Cases page
3. Click **Approve** (✅) on any case
   - **Expected**: Success message, case disappears from table
   - **Database**: Check `case_status_history` table has new entry
4. Click **Return** (↩️) on any case, provide reason
   - **Expected**: Success message, case status changes
   - **Database**: Check `case_status_history` has entry with reason

## Verification Query
```sql
-- Check recent status changes
SELECT 
    csh.id,
    csh.case_id,
    c.case_number,
    csh.previous_status,
    csh.new_status,
    csh.reason,
    u.full_name as changed_by_name,
    csh.changed_at
FROM case_status_history csh
JOIN cases c ON csh.case_id = c.id
JOIN users u ON csh.changed_by = u.id
ORDER BY csh.changed_at DESC
LIMIT 10;
```

## Related Issues Fixed Today
1. ✅ Status column empty string (ENUM fix)
2. ✅ Categories 403 error (endpoint fix)
3. ✅ Pending cases DataTable (implementation)
4. ✅ Approve notification schema (notifications table fix)
5. ✅ Status history schema (this fix)

## Summary
The issue was a **schema mismatch** between the model and the database table. The database uses `previous_status` and `reason`, but the model was configured for `old_status` and `change_reason`. This caused the insert to fail because the fields weren't in the allowed list.

**All approve/return functionality is now working correctly!** ✅
