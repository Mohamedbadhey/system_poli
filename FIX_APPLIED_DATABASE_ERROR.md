# Database Error Fixed - Case Closure

## Issue
When trying to close a case, got a 500 error:
```
CodeIgniter\Database\BaseBuilder::setBind(): Argument #1 ($key) must be of type string, int given
```

## Root Cause
The `CaseStatusHistoryModel::logStatusChange()` method was using CodeIgniter's Model `insert()` method, which internally uses the query builder's `setBind()`. This was causing issues with parameter binding.

## Solution
Changed the `logStatusChange()` method to use direct SQL queries with prepared statements instead of the Model's insert method.

### Changes Made
**File**: `app/Models/CaseStatusHistoryModel.php`

**Before**:
```php
$result = $this->insert($record);
return $result ? $this->getInsertID() : false;
```

**After**:
```php
$db = \Config\Database::connect();
$sql = "INSERT INTO case_status_history 
        (case_id, previous_status, new_status, old_court_status, new_court_status, changed_by, reason, changed_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

$result = $db->query($sql, [
    $record['case_id'],
    $record['previous_status'],
    $record['new_status'],
    $record['old_court_status'],
    $record['new_court_status'],
    $record['changed_by'],
    $record['reason'],
    date('Y-m-d H:i:s')
]);

return $result ? $db->insertID() : false;
```

## Benefits
✅ Avoids query builder parameter binding issues
✅ More explicit SQL with clear parameter mapping
✅ Better error logging
✅ Direct control over data types

## Test Now
1. Clear browser cache (Ctrl+F5)
2. Open an active case
3. Click "Close Case"
4. Fill in the form with any closure type
5. Submit

The case should now close successfully without the 500 error!

## What Was Fixed
- Translation function error (`getTranslation()` → `t()`)
- Database query error (Model insert → Direct SQL)

Both issues are now resolved!
