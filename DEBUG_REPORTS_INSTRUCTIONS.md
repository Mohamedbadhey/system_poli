# Debug Instructions for Reports Issue

## Step 1: Refresh the Dashboard

1. Go to Daily Operations Dashboard
2. Hard refresh: **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)
3. Wait for it to load

## Step 2: Check the Logs

Run this PowerShell command:

```powershell
Get-Content writable/logs/log-*.php -Tail 200 | Select-String "BASIC REPORTS|FULL REPORTS|saved_full_reports|Total records"
```

## Step 3: Check Database Directly

Run this SQL query in your database:

```sql
-- See all reports
SELECT 
    id, 
    case_id, 
    case_number, 
    report_title, 
    report_language,
    DATE(created_at) as created_date,
    created_at 
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

## Step 4: Test Report Generation

1. Go to any case (e.g., case ID 13)
2. Click "Basic Report" button
3. Select "English"
4. Click "View in Browser (Printable)"
5. Check if report displays
6. Check browser console (F12) for any errors

## Step 5: Share Results

Please share:
1. Output from the PowerShell log command
2. Output from the SQL queries
3. Any errors from browser console
4. What date/period you're viewing in the dashboard
