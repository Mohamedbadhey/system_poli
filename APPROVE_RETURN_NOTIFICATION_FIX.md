# Approve/Return Notification Fix

## Issue
When approving or returning a case from the pending cases page, the action worked in the database but returned a 500 error to the frontend.

### Error Message
```
CodeIgniter\Database\BaseBuilder::setBind(): Argument #1 ($key) must be of type string, int given
```

## Root Cause
The `CaseReviewController` was using incorrect notification table schema:

**Wrong Schema (Old Code)**:
```php
$notificationModel->insert([
    'user_id' => $case['created_by'],
    'case_id' => $id,              // ❌ Column doesn't exist
    'type' => 'status_changed',    // ❌ Should be 'notification_type'
    'title' => 'Case Approved',
    'message' => "...",
    'link' => '/cases/' . $id      // ❌ Should be 'link_url'
]);
```

**Correct Schema**:
```php
$db->table('notifications')->insert([
    'user_id' => (int)$case['created_by'],          // ✅ Type cast to int
    'notification_type' => 'status_changed',        // ✅ Correct column name
    'title' => 'Case Approved',
    'message' => "...",
    'link_entity_type' => 'cases',                  // ✅ Entity type
    'link_entity_id' => (int)$id,                   // ✅ Entity ID (type cast)
    'link_url' => '/cases/' . $id,                  // ✅ Correct column name
    'priority' => 'medium',                         // ✅ Added
    'is_read' => 0,                                 // ✅ Added
    'created_at' => date('Y-m-d H:i:s')            // ✅ Added
]);
```

## Solution
Fixed both approve and return methods in `CaseReviewController.php`:

### 1. Approve Method (Line 136-148)
- Changed to use `$db->table('notifications')->insert()` instead of NotificationModel
- Fixed column names to match actual database schema
- Added type casting to ensure integers are passed correctly
- Added missing required fields

### 2. Return Method (Line 188-200)
- Applied same fixes as approve method
- Set priority to 'high' for returned cases (more urgent)

## Files Modified
- ✅ `app/Controllers/Station/CaseReviewController.php`

## Testing
1. Login as Admin
2. Go to Pending Cases
3. Click Approve (✅) on any case
4. **Expected**: Success message appears, case disappears from table
5. Click Return (↩️) on any case, provide reason
6. **Expected**: Success message appears, case status changes to 'returned'

## Verification
```sql
-- Check if notifications were created
SELECT * FROM notifications 
WHERE notification_type = 'status_changed' 
ORDER BY created_at DESC 
LIMIT 5;

-- Should show notifications with correct schema
```

## Impact
- ✅ Approve now works without errors
- ✅ Return now works without errors
- ✅ OB officers receive notifications when their cases are approved/returned
- ✅ Frontend shows success messages correctly
- ✅ DataTable refreshes automatically after action

## Related Issues
This is the same issue we encountered earlier with:
- Incident creation notifications (fixed in OB/CaseController.php)
- Court workflow notifications (need to check if same issue exists)

## Recommendation
**Search for all uses of NotificationModel** and verify they're using the correct schema:
```bash
grep -r "NotificationModel" app/Controllers/
```

If other controllers have similar issues, apply the same fix pattern.
