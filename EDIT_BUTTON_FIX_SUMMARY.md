# Edit Button - Only Show for Editable Cases

## Problem
Edit button was showing for ALL cases in "My Cases", but the backend only allows editing cases with status `'draft'` or `'returned'`. This caused a 400 error when trying to edit submitted cases.

---

## Root Cause
**Backend restriction (OB/CaseController.php, lines 173-175):**
```php
// Can only update if in draft or returned status
if (!in_array($case['status'], ['draft', 'returned'])) {
    return $this->fail('Cannot update case after submission', 400);
}
```

**Frontend issue (app.js, line 4017):**
Edit button was always shown, regardless of case status.

---

## Solution Applied

### File: `app.js` (Line 4015-4019)

**Before:**
```javascript
<td>
    <button onclick="viewCaseDetails(${caseItem.id})">${t('view')}</button>
    <button onclick="editCase(${caseItem.id})">${t('edit')}</button>  // Always shown
    ${(caseItem.status === 'draft' || caseItem.status === 'returned') ? '...' : ''}
</td>
```

**After:**
```javascript
<td>
    <button onclick="viewCaseDetails(${caseItem.id})">${t('view')}</button>
    ${(caseItem.status === 'draft' || caseItem.status === 'returned') ? '<button onclick="editCase(' + caseItem.id + ')">' + t('edit') + '</button>' : ''}  // Conditional
    ${(caseItem.status === 'draft' || caseItem.status === 'returned') ? '<button onclick="submitCase(' + caseItem.id + ')">' + t('submit') + '</button>' : ''}
</td>
```

---

## Result

### ✅ Now Edit button only shows for:
- Cases with status = `'draft'`
- Cases with status = `'returned'`

### ✅ View button always shows:
- All cases can be viewed

### ✅ Submit button only shows for:
- Cases with status = `'draft'` or `'returned'`

---

## Case Status Workflow

| Status | View | Edit | Submit |
|--------|------|------|--------|
| **draft** | ✅ | ✅ | ✅ |
| **returned** | ✅ | ✅ | ✅ |
| **submitted** | ✅ | ❌ | ❌ |
| **approved** | ✅ | ❌ | ❌ |
| **assigned** | ✅ | ❌ | ❌ |
| **investigating** | ✅ | ❌ | ❌ |
| **concluded** | ✅ | ❌ | ❌ |
| **closed** | ✅ | ❌ | ❌ |

---

## Why This Design?

### Draft/Returned Cases:
- **OB Officer created** but hasn't submitted yet
- **OR Admin returned** for corrections
- **Can be edited** and resubmitted

### Submitted Cases:
- **Under review** by admin
- **Cannot be edited** to maintain data integrity
- **Admin can approve or return** for corrections

### Approved/Assigned/Investigating Cases:
- **In the workflow** with investigators
- **Cannot be edited** by OB officer
- **Investigators add evidence**, notes, conclusions

---

## Testing

1. **Clear browser cache** (`Ctrl + Shift + R`)
2. Go to **My Cases** page
3. **Check each case row:**
   - Draft cases → Should show View, Edit, Submit buttons
   - Returned cases → Should show View, Edit, Submit buttons
   - Submitted/Approved/etc. → Should show ONLY View button
4. **Try editing:**
   - Draft case → Should open edit modal successfully
   - Submitted case → Edit button should not appear

---

**Status:** ✅ Complete
**Date:** 2026-01-19
