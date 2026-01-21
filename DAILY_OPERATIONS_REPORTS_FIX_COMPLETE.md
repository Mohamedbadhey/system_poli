# Daily Operations Reports Fix - Complete ✅

## 🔍 Root Cause Identified

### The Problem
The Daily Operations Dashboard was querying the **wrong table** for basic and full reports.

**What We Thought:**
- Basic Reports → `investigation_reports` table
- Full Reports → `saved_full_reports` table

**Reality:**
- **BOTH** Basic and Full Reports → `saved_full_reports` table
- They are differentiated by the `report_title` field:
  - Basic Report: `"Basic Report - CASE/XGD-01/2026/0001"`
  - Full Report: `"Full Report - CASE/XGD-01/2026/0001"`
  - Custom Report: `"Custom Report - CASE/XGD-01/2026/0001"`

### How Reports Are Actually Saved

**Location:** `app/Controllers/Investigation/SavedHTMLReportController.php`

```php
// Line 82 - Report title includes type
'report_title' => $json['report_title'] ?? ucfirst($reportType) . ' Case Report',

// $reportType can be: 'basic', 'full', or 'custom'
```

**Frontend:** `public/assets/js/case-report.js`

```javascript
// Line 96 - Basic Report saves with report_type: 'basic'
const htmlResponse = await saveHTMLReport(caseId, reportData, htmlWithQR, language, 'basic');

// Line 371 - Full Report saves with report_type: 'full' (default)
const htmlResponse = await saveHTMLReport(caseId, reportData, htmlContent, language);

// Line 4024 - All go to same endpoint
const response = await fetch(`${API_BASE_URL}/investigation/saved-html-report`, {
    ...
    body: JSON.stringify({
        report_type: reportType,  // 'basic', 'full', or 'custom'
        ...
    })
});
```

---

## ✅ Fix Applied

### Changed From (WRONG):
```php
// Looking at non-existent investigation_reports table
$basicReportsIssued = $db->table('investigation_reports')
    ->where(...)
    ->get();
```

### Changed To (CORRECT):
```php
// Looking at saved_full_reports and filtering by title
$basicReportsIssued = $db->table('saved_full_reports')
    ->where($whereClause)
    ->like('saved_full_reports.report_title', 'Basic', 'both')  // ← KEY FIX
    ->get();

$fullReportsIssued = $db->table('saved_full_reports')
    ->where($whereClause)
    ->like('saved_full_reports.report_title', 'Full', 'both')   // ← KEY FIX
    ->get();
```

---

## 📁 Files Modified

### 1. `app/Controllers/Admin/DailyOperationsController.php`

**Changes in `index()` method (Lines 171-212):**
- Changed Basic Reports query from `investigation_reports` to `saved_full_reports`
- Added filter: `->like('saved_full_reports.report_title', 'Basic', 'both')`
- Changed user column from `created_by` to `generated_by`
- Added debug logging for Full Reports

**Changes in `fetchOperationsData()` method (Lines 548-577):**
- Same changes as above for PDF/Excel export

---

## 🎯 How It Works Now

### Report Lifecycle

1. **User Generates Basic Report:**
   ```
   Case Details Modal → Click "Basic Report" → Select Language
   → viewReportInBrowser() → saveHTMLReport(..., 'basic')
   → POST /investigation/saved-html-report
   → Saves to saved_full_reports with:
      - report_title: "Basic Report - CASE/..."
      - report_type: 'basic'
   ```

2. **User Generates Full Report:**
   ```
   Case Details Modal → Click "Full Report" → Select Language
   → viewFullReportInBrowser() → saveHTMLReport(..., 'full')
   → POST /investigation/saved-html-report
   → Saves to saved_full_reports with:
      - report_title: "Full Report - CASE/..."
      - report_type: 'full'
   ```

3. **Daily Operations Dashboard Queries:**
   ```sql
   -- Basic Reports
   SELECT * FROM saved_full_reports
   WHERE DATE(created_at) = '2026-01-19'
   AND report_title LIKE '%Basic%';
   
   -- Full Reports
   SELECT * FROM saved_full_reports
   WHERE DATE(created_at) = '2026-01-19'
   AND report_title LIKE '%Full%';
   ```

---

## 🧪 Testing

### Test 1: Generate a Basic Report
1. Go to a case details page
2. Click "Basic Report" button
3. Select language (English or Somali)
4. Click "View in Browser (Printable)"
5. Report opens and is saved to database

**Expected:** Daily Operations Dashboard should show count increased by 1 for "Basic Reports"

### Test 2: Generate a Full Report
1. Go to a case details page
2. Click "Full Report" button  
3. Select language
4. Click "View Full Report (Printable)"
5. Report opens and is saved

**Expected:** Daily Operations Dashboard should show count increased by 1 for "Full Reports"

### Test 3: Check Database
```sql
-- See all reports
SELECT id, case_number, report_title, report_language, created_at 
FROM saved_full_reports 
ORDER BY created_at DESC;

-- Count by type
SELECT 
    CASE 
        WHEN report_title LIKE '%Basic%' THEN 'Basic'
        WHEN report_title LIKE '%Full%' THEN 'Full'
        WHEN report_title LIKE '%Custom%' THEN 'Custom'
        ELSE 'Other'
    END as report_type,
    COUNT(*) as count
FROM saved_full_reports
GROUP BY report_type;
```

---

## 📊 Expected Results

### After Generating Reports

If you generate reports today (2026-01-19), the Daily Operations Dashboard should show:

| Statistic | Count | Explanation |
|-----------|-------|-------------|
| Basic Reports | 1+ | Number of basic reports generated today |
| Full Reports | 1+ | Number of full reports generated today |
| Court Acknowledgments | 0 | None uploaded today (2 exist from Jan 14 & 17) |

### For "This Week"

Should include any reports generated between Jan 13-19, 2026.

---

## 🐛 Why It Was Showing 0

1. **Wrong Table**: Code was looking at `investigation_reports` which exists but is **never used**
2. **Empty Table**: That table has 0 records because all reports go to `saved_full_reports`
3. **No Filtering**: Even when querying `saved_full_reports`, we weren't filtering by report type

---

## ✅ Verification Checklist

- [x] Identified correct table (`saved_full_reports`)
- [x] Added report type filtering (`LIKE 'Basic'` / `LIKE 'Full'`)
- [x] Updated both `index()` and `fetchOperationsData()` methods
- [x] Changed column names (`created_by` → `generated_by`)
- [x] Added debug logging
- [x] Documented the fix

---

## 💡 Additional Notes

### About `investigation_reports` Table

The `investigation_reports` table exists in the database schema but is **NOT currently used** by the application. It was likely part of an older design that was replaced by the `saved_full_reports` approach.

**Options:**
1. **Keep it** - In case you want to use it in the future for structured report data
2. **Remove it** - If you're sure you'll never use it
3. **Migrate to it** - If you want a separate table for investigation reports

### Report Title Patterns

The current system uses these patterns:
- `"Basic Report - {case_number}"`
- `"Full Report - {case_number}"`
- `"Custom Report - {case_number}"`
- Or custom titles like: `"Basic Case Report"`, `"Full Case Report"`

Our `LIKE` filter with `'both'` parameter matches any of these patterns.

---

## 🚀 Next Steps

1. **Clear browser cache** and refresh (Ctrl+F5)
2. **Generate a test basic report** on any case
3. **Generate a test full report** on any case
4. **View Daily Operations Dashboard**
5. **Verify counts** are now showing correctly

---

## 📝 Summary

**The Fix:**
- ✅ Changed from querying `investigation_reports` (wrong table)
- ✅ To querying `saved_full_reports` (correct table)
- ✅ Added filtering by `report_title` to differentiate types
- ✅ Updated for both dashboard display and PDF/Excel export

**Why It Works:**
- All reports (basic, full, custom) save to the same table
- Report type is embedded in the `report_title` field
- We filter using SQL `LIKE` to separate them

**Status:** ✅ Fix Complete - Ready for Testing

---

**Fixed by:** Rovo Dev AI Assistant  
**Date:** January 19, 2026  
**Issue:** Daily Operations showing 0 for Basic/Full Reports  
**Root Cause:** Querying wrong table  
**Solution:** Query `saved_full_reports` with title filtering
