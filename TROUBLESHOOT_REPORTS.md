# Troubleshooting: "Can't See Reports" Issue

## 🔍 Step-by-Step Debugging Guide

### Step 1: Check Browser Console

1. Open the reports dashboard: `http://localhost:8080/reports-dashboard.html`
2. Open Browser Developer Tools (F12)
3. Go to **Console** tab
4. Select a case
5. Look for these console logs:

**Expected logs:**
```
Loading reports for case: 10
Reports loaded: {status: "success", data: Array(X)}
Displaying reports: Array(X)
```

**If you see errors**, copy them and we'll fix them!

---

### Step 2: Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Select a case
3. Look for the request: `api/investigation/reports/10`
4. Click on it

**Check:**
- Status Code: Should be **200 OK**
- Response: Should contain `{"status":"success","data":[...]}`

**If Status is 404 or 500:**
- Copy the error message
- Check server logs

**If Status is 401 (Unauthorized):**
- Your token might be expired
- Try logging out and logging back in

---

### Step 3: Test API Directly

Open a new browser tab and try:

```
http://localhost:8080/api/investigation/reports/10
```

Replace `10` with your case ID.

**Expected Result:**
```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "report_type": "preliminary",
            "report_title": "...",
            ...
        }
    ]
}
```

**If you get an error:**
- The route might not be configured
- The migration might not have run

---

### Step 4: Check Database

Run this SQL query:

```sql
-- Check if reports exist
SELECT * FROM investigation_reports WHERE case_id = 10;

-- If empty, create a test report
INSERT INTO investigation_reports 
(case_id, report_type, report_title, report_content, created_by, created_at) 
VALUES 
(10, 'preliminary', 'Test Report', 'This is a test report content.', 26, NOW());
```

---

### Step 5: Verify Routes

Check if routes are loaded:

```bash
php spark routes | grep reports
```

**Expected output:**
```
GET     api/investigation/reports/(:num)
GET     api/investigation/reports/show/(:num)
GET     api/investigation/reports/generate/preliminary/(:num)
...
```

**If routes are missing:**
- Routes might not be saved properly
- Run: `php spark cache:clear`

---

### Step 6: Check Authentication

1. Open Developer Tools → Application/Storage
2. Check **Local Storage**
3. Look for: `authToken`

**If missing:**
- Login again
- Token might have expired

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to load reports: Not Found"
**Cause:** Routes not configured
**Solution:**
```bash
# Clear cache
php spark cache:clear

# Restart server
# Stop current server (Ctrl+C)
php spark serve
```

### Issue 2: "Failed to load reports: Unauthorized"
**Cause:** Token expired or missing
**Solution:**
1. Logout
2. Login again
3. Try accessing reports

### Issue 3: Empty array returned `{"status":"success","data":[]}`
**Cause:** No reports created yet OR wrong case ID
**Solution:**
1. Generate a new report
2. Verify you're on the correct case
3. Check database for reports: `SELECT * FROM investigation_reports WHERE case_id = 10;`

### Issue 4: "Cannot read property 'length' of undefined"
**Cause:** Reports data is null/undefined
**Solution:** Already fixed in the updated code! Clear browser cache.

### Issue 5: Statistics showing 0 even with reports
**Cause:** Statistics not updating
**Solution:** Already fixed! The `updateStatistics()` function is now called after loading reports.

---

## 🔧 Quick Fix Commands

### Clear All Caches
```bash
# Clear CodeIgniter cache
php spark cache:clear

# Clear browser cache
# In browser: Ctrl+Shift+Delete → Clear cache
```

### Restart Server
```bash
# Stop server (Ctrl+C)
# Start again
php spark serve
```

### Verify Database Migration
```bash
# Check migration status
php spark migrate:status

# If reports tables not created, run:
php spark migrate
```

### Test Report Creation Manually
```sql
-- Create a test report
INSERT INTO investigation_reports 
(case_id, report_type, report_title, report_content, approval_status, created_by, created_at) 
VALUES 
(10, 'preliminary', 'Test PIR - ' || NOW(), 'This is a test preliminary investigation report.', 'draft', 26, NOW());

-- Verify it was created
SELECT id, case_id, report_type, report_title, approval_status, created_at 
FROM investigation_reports 
WHERE case_id = 10 
ORDER BY created_at DESC;
```

---

## 📝 What to Send Me for Help

If still not working, send me:

1. **Browser Console Output:**
   - Copy all console logs after selecting a case
   - Include any errors (red text)

2. **Network Tab Info:**
   - Request URL
   - Status Code
   - Response body

3. **Database Check:**
   ```sql
   SELECT COUNT(*) as total FROM investigation_reports;
   SELECT * FROM investigation_reports LIMIT 5;
   ```

4. **Route Check:**
   ```bash
   php spark routes | grep reports
   ```

5. **Server Logs:**
   - Check `writable/logs/log-2026-01-10.php`
   - Look for errors related to reports

---

## ✅ Verification Checklist

After troubleshooting, verify:

- [ ] Migration ran successfully
- [ ] Routes are configured (check Routes.php)
- [ ] Server is running
- [ ] You're logged in as investigator
- [ ] Case is selected
- [ ] Browser console shows no errors
- [ ] API returns 200 OK status
- [ ] Reports table has data

---

## 🎯 Quick Test

**Test if everything works:**

1. Login as investigator (`baare` / `Admin123`)
2. Select Case #10
3. Click "Generate PIR"
4. Fill in details and save
5. Go to "Existing Reports" tab
6. Report should appear!

**If it works:** ✅ System is working!  
**If it doesn't:** Send me the console output from Step 1 above.

---

## 💡 Tips

- Always check browser console first
- Clear cache after code changes
- Use Chrome/Firefox for better debugging
- Check Network tab for API responses
- Test with a simple case that has evidence

---

**Let me know what you find! I'm here to help.** 🚀
