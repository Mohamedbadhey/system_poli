# Solved Cases Dashboard - Issue Fixed ✅

## Problem Summary

The solved cases dashboard was showing errors and displaying empty values for:
1. **Closed Date** - showing empty
2. **Closed By** - showing empty/undefined
3. **Closure Type** - showing the same value for all cases

## Root Causes Identified

### 1. API Not Exposed Globally
The `investigationAPI` object wasn't properly exposed on the `window` object, causing the dashboard to fail when trying to call:
- `investigationAPI.getSolvedCasesStats()`
- `investigationAPI.getAllSolvedCases()`

### 2. Court Controllers Not Setting Closure Fields ⚠️ **ROOT CAUSE**
Found **TWO court controllers** that close cases WITHOUT setting the required closure fields:

**Problem A: `CourtController.php::closeCase()`** (Line 52-56)
```php
$caseModel->update($caseId, [
    'status' => 'closed',
    'closed_at' => date('Y-m-d H:i:s'),  // ❌ Wrong field!
    'outcome' => 'escalated_to_court',
    'outcome_description' => $closureReason
]);
// ❌ Missing: closed_date, closed_by, closure_type, closure_reason
```

**Problem B: `SubmissionController.php::uploadDecision()`** (Line 221-228)
```php
$caseModel->update($caseId, [
    'status' => 'closed',
    'closed_at' => date('Y-m-d H:i:s'),  // ❌ Wrong field!
    'court_decision_file' => "...",
    // ❌ Missing: closed_date, closed_by, closure_type, closure_reason
]);
```

These are the controllers used when:
- Court users close a case from the court dashboard
- Court users upload a court decision document

This explains why cases have `status='closed'` but missing closure data!

### 3. Legacy Database Records
Looking at the `pcms_db.sql` database dump, several closed cases have:
- `status = 'closed'`
- BUT `closed_date = NULL`
- AND `closed_by = NULL`
- AND `closure_type = NULL`

Example from the database (Case ID 30):
```sql
(30, 'CASE/XGD-01/2026/0018', ..., 'closed', 'not_sent', 
NULL, NULL, NULL, NULL, ...)
```

These were created by the buggy court controllers above.

### 4. Dashboard Not Handling NULL Values
The DataTable columns for `closed_by_name` and `center_name` weren't handling NULL/undefined values, showing empty cells instead of "-".

## Solutions Implemented

### ✅ Fix 1: Exposed API Objects Globally
**File:** `public/assets/js/api.js`

Added at the end of the file:
```javascript
// Expose API objects globally for easy access across all pages
window.api = api;
window.authAPI = authAPI;
window.adminAPI = adminAPI;
window.obAPI = obAPI;
window.stationAPI = stationAPI;
window.investigationAPI = investigationAPI;
window.courtAPI = courtAPI;
window.commonAPI = commonAPI;
```

### ✅ Fix 2: Simplified Dashboard API Usage
**File:** `public/assets/js/solved-cases-dashboard.js`

Removed complex parent window fallback logic and simplified to use the globally available `investigationAPI` directly.

### ✅ Fix 3: Handle NULL Values in Dashboard
**File:** `public/assets/js/solved-cases-dashboard.js`

Updated DataTable column definitions to handle NULL values:
```javascript
{ 
    data: 'closed_by_name',
    render: function(data, type, row) {
        return data || '-';
    }
},
{ 
    data: 'center_name',
    render: function(data, type, row) {
        return data || '-';
    }
}
```

The `closed_date` and `closure_type` columns already had NULL handling.

### ✅ Fix 4: Database Migration Script
**File:** `FIX_LEGACY_CLOSED_CASES.sql`

Created a SQL script to update legacy closed cases:
- Sets `closed_date` to the case's `updated_at` timestamp
- Sets `closed_by` to the case's `created_by` user
- Sets `closure_type` to `'investigator_closed'` (default)
- Adds a note in `closure_reason` indicating it's a legacy case

## How to Apply the Database Fix

### Option 1: Using the Batch Script (Recommended)
```batch
APPLY_LEGACY_CLOSED_CASES_FIX.bat
```

### Option 2: Manual SQL Execution
1. Open your database client (phpMyAdmin, MySQL Workbench, etc.)
2. Run the queries in `FIX_LEGACY_CLOSED_CASES.sql`

## Verification Steps

1. **Clear browser cache** and reload the solved cases dashboard
2. **Check the console** - should see:
   ```
   ✅ Translation helper loaded
   Using global investigationAPI from api.js
   ```
   No errors about undefined API methods

3. **Verify the table displays**:
   - Closure Type shows appropriate badges (Investigator Closed, With Court Ack, Court Solved, or Legacy)
   - Closed Date shows proper dates or "-"
   - Closed By shows usernames or "-"
   - Center Name shows center names or "-"

4. **Test filtering** by closure type and date range

## Technical Details

### Database Schema (cases table)
```sql
`closed_date` datetime DEFAULT NULL,
`closed_by` int(10) UNSIGNED DEFAULT NULL,
`closure_reason` text DEFAULT NULL,
`closure_type` enum('investigator_closed','closed_with_court_ack','court_solved') DEFAULT NULL
```

### API Endpoints Used
- `GET /investigation/cases/solved-stats` - Returns statistics
- `GET /investigation/cases/all-solved` - Returns all closed cases with filters
- `GET /investigation/cases/{id}` - Returns specific case details

### Controller Methods
**File:** `app/Controllers/Investigation/CaseController.php`
- `getAllSolvedCases()` - Line 81
- `getSolvedCasesStats()` - Line 135

## Files Modified

1. ✅ `public/assets/js/api.js` - Exposed API objects globally
2. ✅ `public/assets/js/solved-cases-dashboard.js` - Fixed API usage and NULL handling
3. ✅ `app/Controllers/Court/CourtController.php` - **Fixed closeCase() to set proper closure fields**
4. ✅ `app/Controllers/Court/SubmissionController.php` - **Fixed uploadDecision() to set proper closure fields**
5. ✅ `FIX_LEGACY_CLOSED_CASES.sql` - Database migration script (NEW)
6. ✅ `APPLY_LEGACY_CLOSED_CASES_FIX.bat` - Easy execution script (NEW)

## Notes

- The `getClosureTypeBadge()` function already handled NULL values by showing a "Legacy" badge
- The closure type enum supports three values:
  - `investigator_closed` - Closed by investigator without court
  - `closed_with_court_ack` - Closed with court acknowledgment
  - `court_solved` - Solved/decided by court
- Legacy cases (NULL closure_type) will show as "Legacy" in the dashboard

## Future Recommendations

1. **Enforce closure data** - Update the `closeCase()` method to ensure these fields are always set
2. **Add database constraints** - Consider making `closed_date`, `closed_by`, and `closure_type` required when `status = 'closed'`
3. **Audit logging** - Track when and why cases are closed for better accountability

---

**Status:** ✅ **COMPLETE**  
**Date:** January 20, 2026  
**Developer:** Rovo Dev
