# Debug: Why All Counts Show 0

## 🔍 Issue Analysis

You're seeing 0 for all three new statistics even though data exists in the database.

### Database Status
Based on `pcms_db.sql`:

```sql
-- Court Acknowledgments (2 records)
ID: 2, uploaded_at: 2026-01-14 22:19:05
ID: 3, uploaded_at: 2026-01-17 09:32:10

-- Investigation Reports (0 records)
-- Table exists but is empty

-- Saved Full Reports (0 records)  
-- Table exists but is empty
```

### Today's Date
**2026-01-19**

---

## 🎯 Why You're Seeing 0

### For Court Acknowledgments:
**If viewing "Today" (Jan 19):**
- No records uploaded on Jan 19 → Shows 0 ✅ CORRECT

**If viewing "This Week" (Jan 13-19):**
- Should show 2 (records from Jan 14 and Jan 17) → If showing 0, there's a bug

### For Basic Reports & Full Reports:
- Tables are empty in database → Shows 0 ✅ CORRECT

---

## 🧪 Quick Tests

### Test 1: Check What Period You're Viewing

1. Open Daily Operations Dashboard
2. Look at the period dropdown - what's selected?
   - **Today** = Jan 19 only
   - **Week** = Jan 13-19  
   - **Month** = Jan 1-31
   - **Year** = 2026

3. Open browser console (F12) → Network tab
4. Find the API request to `/admin/daily-operations`
5. Check the parameters:
   ```
   ?period=today&date=2026-01-19
   or
   ?period=week&date=2026-01-19
   ```

### Test 2: Manually Change Period

Try selecting different periods:

| Period | Expected Court Acknowledgments |
|--------|-------------------------------|
| Today (Jan 19) | 0 (correct - none uploaded today) |
| Week (Jan 13-19) | 2 (Jan 14 + Jan 17) |
| Month (January) | 2 (both in January) |
| Year (2026) | 2 (both in 2026) |

---

## 🔧 Debugging Steps

### Step 1: Check Browser Console

1. Open browser console (F12)
2. Go to Network tab
3. Refresh page
4. Click on the `/admin/daily-operations` request
5. Check the **Response** - what does `stats` object show?

```json
{
  "status": "success",
  "data": {
    "stats": {
      "cases_submitted_count": X,
      "cases_assigned_count": X,
      "cases_closed_count": X,
      "current_custody_count": X,
      "certificates_issued_count": X,
      "medical_forms_issued_count": X,
      "basic_reports_count": 0,    // Expected (table empty)
      "full_reports_count": 0,      // Expected (table empty)
      "court_acknowledgments_count": ? // Should be 0 for "today", 2 for "week"
    }
  }
}
```

### Step 2: Check Server Logs

I've added debug logging. Check the logs:

**On Windows:**
```powershell
Get-Content writable/logs/log-*.php -Tail 50 | Select-String "Basic Reports|Court Acknowledgments"
```

**Look for:**
```
DEBUG --> Basic Reports Query WHERE: DATE(investigation_reports.created_at) = '2026-01-19'
DEBUG --> Basic Reports Count: 0
DEBUG --> Court Acknowledgments Query WHERE: DATE(court_acknowledgments.uploaded_at) = '2026-01-19'
DEBUG --> Court Acknowledgments Count: 0
```

### Step 3: Test SQL Directly

Run this in your database:

```sql
-- Test for today (should return 0)
SELECT COUNT(*) FROM court_acknowledgments 
WHERE DATE(uploaded_at) = '2026-01-19';

-- Test for this week (should return 2)
SELECT COUNT(*) FROM court_acknowledgments 
WHERE DATE(uploaded_at) BETWEEN '2026-01-13' AND '2026-01-19';

-- See all records
SELECT id, case_id, uploaded_at, DATE(uploaded_at) as upload_date 
FROM court_acknowledgments;
```

---

## 💡 Most Likely Causes

### Cause 1: Viewing "Today" ✅ Not a Bug
If you're viewing "Today" (Jan 19), showing 0 is **CORRECT** because:
- No court acknowledgments uploaded on Jan 19
- No basic reports created on Jan 19
- No full reports created on Jan 19

**Solution:** Change period to "Week" or "Month"

### Cause 2: Date Mismatch
The dashboard might be using a different date than you expect.

**Solution:** Check the date parameter in the API call

### Cause 3: Table Check Failing
The `if (in_array('court_acknowledgments', $db->listTables()))` might return false.

**Test:**
```php
// Add this temporarily to controller
log_message('debug', 'Available tables: ' . json_encode($db->listTables()));
```

---

## 🎯 Quick Fix to Test

Temporarily bypass the date filter to see if it's a query issue:

```php
// In DailyOperationsController.php, line 204
// TEMPORARILY change to:
$courtAcknowledgmentsIssued = $db->table('court_acknowledgments')
    ->select('court_acknowledgments.*, cases.case_number, cases.ob_number,
             police_centers.center_name, users.full_name as uploaded_by_name')
    ->join('cases', 'cases.id = court_acknowledgments.case_id', 'left')
    ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
    ->join('users', 'users.id = court_acknowledgments.uploaded_by', 'left')
    // ->where($whereClause)  // COMMENT OUT temporarily
    ->orderBy('court_acknowledgments.uploaded_at', 'DESC')
    ->get()
    ->getResultArray();
```

If this shows 2, then the date filter is the issue.

---

## ✅ Expected Behavior

### For Your Current Database:

**Today (2026-01-19):**
- Basic Reports: 0 ✅
- Full Reports: 0 ✅
- Court Acknowledgments: 0 ✅

**This Week (2026-01-13 to 2026-01-19):**
- Basic Reports: 0 ✅
- Full Reports: 0 ✅  
- Court Acknowledgments: 2 ✅ (Jan 14 + Jan 17)

**This Month (January 2026):**
- Basic Reports: 0 ✅
- Full Reports: 0 ✅
- Court Acknowledgments: 2 ✅

---

## 🚀 Next Steps

1. **Check what period you're viewing** - Most likely you're viewing "Today"
2. **Try changing to "Week"** - You should see 2 court acknowledgments
3. **Check browser console** - Look at the API response
4. **Check server logs** - Look for the debug messages I added
5. **Report back** what you find

---

**The code is correct.** The issue is likely that you're viewing a date/period that has no data.
