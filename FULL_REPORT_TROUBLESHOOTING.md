# Full Report Error - Troubleshooting Guide

## Error: "Failed to generate report"

### Most Common Cause: Table Not Created

The `investigator_conclusions` table likely doesn't exist in your database.

---

## ✅ Solution:

### Step 1: Check if Table Exists
1. Open **phpMyAdmin**
2. Select database: `pcms_db`
3. Look in the left sidebar for table: `investigator_conclusions`

### Step 2: If Table DOESN'T Exist, Run This SQL:

```sql
DROP TABLE IF EXISTS investigator_conclusions;

CREATE TABLE investigator_conclusions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    investigator_id INT NOT NULL,
    conclusion_title VARCHAR(255) NOT NULL,
    findings TEXT NOT NULL,
    recommendations TEXT,
    conclusion_summary TEXT NOT NULL,
    status ENUM('draft', 'submitted', 'reviewed') DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at DATETIME NULL,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    review_notes TEXT NULL,
    
    INDEX idx_case_id (case_id),
    INDEX idx_investigator_id (investigator_id),
    INDEX idx_status (status),
    INDEX idx_reviewed_by (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 3: Test Again
1. **Refresh browser** (Ctrl+F5)
2. Open any case
3. Click **"Full Report"** button
4. ✅ Should work now!

---

## Other Possible Issues:

### Issue 2: Permission Error
**Symptom**: "You do not have permission..."

**Solution**: 
- Make sure you're logged in as **investigator**
- The case must be **assigned to you**
- Check with: http://localhost:8080/test_user_role.html

### Issue 3: Case Not Found
**Symptom**: "Case not found"

**Solution**:
- Make sure the case ID is valid
- Case must exist in database
- Try a different case

### Issue 4: Authentication Error
**Symptom**: No error, just blank page

**Solution**:
- Clear browser cache (Ctrl+Shift+Delete)
- Logout and login again
- Check if token is valid

---

## 🧪 Debug Tools Created:

### 1. Test Page
**URL**: http://localhost:8080/test_full_report.php

**Features**:
- Check if table exists
- Test report generation
- View logs
- Clear diagnostic messages

### 2. Enhanced Logging
All errors now logged to: `writable/logs/log-YYYY-MM-DD.log`

Look for messages containing:
- "Full report request"
- "Full report generation failed"
- Error details with stack traces

### 3. User Role Checker
**URL**: http://localhost:8080/test_user_role.html

**Shows**:
- Your current user role
- Whether Conclusion tab will appear
- Debugging information

---

## 🔍 Manual Debug Steps:

### Check Database:
```sql
-- Check if table exists
SHOW TABLES LIKE 'investigator_conclusions';

-- Check table structure
DESCRIBE investigator_conclusions;

-- Check for any conclusions
SELECT * FROM investigator_conclusions;
```

### Check Logs:
```bash
# Windows
type writable\logs\log-2026-01-05.log

# Look for lines with "Full report"
```

### Test API Directly:
Open in browser (while logged in):
```
http://localhost:8080/investigation/cases/1/report/full
```

Should either:
- ✅ Show the full report HTML
- ❌ Show specific error message

---

## ✅ Expected Behavior:

When working correctly:

1. **Click "Full Report" button** (red button, investigators only)
2. **Dialog appears** showing report options
3. **Click "View Full Report"**
4. **New tab opens** with loading spinner
5. **Full report displays** with:
   - Case details
   - All parties
   - Evidence
   - **Conclusions section** (if you've saved one)
   - Professional formatting
6. **"Print Full Report" button** at top-right

---

## 🎯 Quick Checklist:

- [ ] Database migration run (table created)
- [ ] Logged in as investigator
- [ ] Case assigned to you
- [ ] Browser cache cleared
- [ ] No console errors (F12)

---

## 📞 Still Not Working?

1. **Open test page**: http://localhost:8080/test_full_report.php
2. **Run all tests**
3. **Copy error messages**
4. **Check the log file**

The test page will tell you exactly what's failing!

---

## 🎉 Success Indicators:

You'll know it's working when:
- ✅ Test page shows all green checkmarks
- ✅ Full report opens in new tab
- ✅ Conclusion section appears (if saved)
- ✅ No console errors
- ✅ Print button works

---

*Last Updated: January 5, 2026*
