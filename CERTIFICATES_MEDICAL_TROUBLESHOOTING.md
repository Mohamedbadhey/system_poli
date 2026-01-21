# Certificates & Medical Forms Not Showing - Troubleshooting

## Problem
Certificates and Medical Forms sections in Daily Operations are not populated with data.

## Backend Query Analysis

The backend queries look **correct**:

### Certificates Query (Lines 122-132):
```php
$certificatesIssued = $db->table('non_criminal_certificates')
    ->select('non_criminal_certificates.*, persons.first_name, persons.middle_name, 
             persons.last_name, persons.photo_path, persons.gender, persons.date_of_birth,
             users.full_name as issued_by_name')
    ->join('persons', 'persons.id = non_criminal_certificates.person_id', 'left')
    ->join('users', 'users.id = non_criminal_certificates.issued_by', 'left')
    ->where(str_replace('cases.created_at', 'non_criminal_certificates.created_at', $dateFilters['where']))
    ->orderBy('non_criminal_certificates.created_at', 'DESC')
    ->get()
    ->getResultArray();
```

### Medical Forms Query (Lines 144-158):
```php
if (in_array('medical_examination_forms', $db->listTables())) {
    $medicalFormsIssued = $db->table('medical_examination_forms')
        ->select('medical_examination_forms.*, persons.first_name, persons.middle_name, 
                 persons.last_name, persons.photo_path, cases.case_number, cases.ob_number,
                 users.full_name as created_by_name')
        ->join('persons', 'persons.id = medical_examination_forms.person_id', 'left')
        ->join('cases', 'cases.id = medical_examination_forms.case_id', 'left')
        ->join('users', 'users.id = medical_examination_forms.created_by', 'left')
        ->where(str_replace('cases.created_at', 'medical_examination_forms.created_at', $dateFilters['where']))
        ->orderBy('medical_examination_forms.created_at', 'DESC')
        ->get()
        ->getResultArray();
}
```

## Most Likely Causes

### Cause 1: No Data Exists ⚠️
**Check:** Run `CHECK_TABLES_STRUCTURE.sql` in phpMyAdmin

If count = 0:
- No certificates have been issued yet
- No medical forms have been created yet
- **Solution:** Create test data

### Cause 2: Date Filter Mismatch ⚠️
**Check:** When were the records created?

If data exists but not showing:
- Data created on different date than filter selected
- Example: Data from last week, but viewing "Today"
- **Solution:** Change filter to "This Year"

### Cause 3: Table Doesn't Exist ⚠️
**Check:** Run `SHOW TABLES LIKE 'non_criminal_certificates';`

If table missing:
- Migration not run
- **Solution:** Run database migrations

## How to Test

### Test 1: Check if Tables Exist
```bash
# Run in phpMyAdmin:
CHECK_TABLES_STRUCTURE.sql
```

**Expected Output:**
- Both tables should exist
- Should show structure
- Should show counts

### Test 2: Open Browser Console
```javascript
// In Daily Operations page, check Network tab
// Look for response from: /admin/daily-operations?period=today

// Response should show:
{
  "certificates_issued": [...],  // Check if empty or has data
  "medical_forms_issued": [...]  // Check if empty or has data
}
```

### Test 3: Test Different Date Ranges

1. **Today** - Shows data from today only
2. **This Week** - Shows data from this week
3. **This Month** - Shows data from this month
4. **This Year** - Shows ALL data from 2026

If data appears in "This Year" but not "Today", the data exists but was created on a different date.

## Quick Solutions

### Solution 1: Use Broader Date Filter
1. Go to Daily Operations
2. Change filter to **"This Year"**
3. Check if data appears

### Solution 2: Create Test Data

#### Create a Certificate:
1. Go to OB Officer dashboard or Investigation
2. Navigate to certificates page
3. Issue a non-criminal certificate
4. Refresh Daily Operations → Should appear

#### Create a Medical Form:
1. Go to Medical Forms dashboard
2. Fill out a medical examination form
3. Link to a case
4. Save form
5. Refresh Daily Operations → Should appear

### Solution 3: Check API Response in Browser

1. Open Daily Operations
2. Press F12 (Developer Tools)
3. Go to **Network** tab
4. Reload page
5. Find request: `daily-operations?period=today`
6. Check **Response** tab:

```json
{
  "status": "success",
  "data": {
    "certificates_issued": [],  // ← Check if empty
    "medical_forms_issued": []  // ← Check if empty
  }
}
```

If arrays are empty `[]`, then:
- ✅ Backend query works
- ❌ No data for selected date range

## Expected Behavior

### When Data Exists:
- Section shows table with data
- View buttons appear
- Counts show in statistics cards

### When No Data:
- Section shows "No data" message
- Empty state displayed
- Count = 0 in statistics

## Files to Run

1. **CHECK_TABLES_STRUCTURE.sql** - Comprehensive table check
2. **tmp_check_certs_medical.sql** - Quick data check
3. **DEBUG_DAILY_OPERATIONS.md** - Debug guide

## Next Steps

1. ✅ Run `CHECK_TABLES_STRUCTURE.sql` in phpMyAdmin
2. ✅ Tell me what counts you see
3. ✅ Try changing date filter to "This Year"
4. ✅ Check browser console for API response

Then I can help you either:
- Create test data if tables are empty
- Fix date filtering if data exists but doesn't show
- Fix table structure if something is wrong
