# Debug Daily Operations - Certificates & Medical Forms Not Showing

## Possible Causes

### 1. **No Data in Database**
- Tables might be empty
- No certificates/medical forms created yet

### 2. **Date Filter Too Restrictive**
- If viewing "Today" but data was created yesterday/last week
- Date filter might not match when data was created

### 3. **Frontend Not Receiving Data**
- Backend sends empty arrays
- Frontend displays "No data" message

## How to Debug

### Step 1: Check if Data Exists (Run in phpMyAdmin)

```sql
-- Check certificates
SELECT 
    id, 
    certificate_number, 
    person_name, 
    created_at,
    DATE(created_at) as creation_date
FROM non_criminal_certificates 
ORDER BY created_at DESC 
LIMIT 5;

-- Check medical forms  
SELECT 
    id, 
    patient_name, 
    case_id,
    created_at,
    DATE(created_at) as creation_date
FROM medical_examination_forms 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 2: Check What Daily Operations is Querying

The backend uses date filters based on the selected period:

**Today:**
```sql
WHERE DATE(non_criminal_certificates.created_at) = '2026-01-19'
```

**This Month:**
```sql
WHERE DATE(non_criminal_certificates.created_at) BETWEEN '2026-01-01' AND '2026-01-31'
```

**This Year:**
```sql
WHERE DATE(non_criminal_certificates.created_at) BETWEEN '2026-01-01' AND '2026-12-31'
```

### Step 3: Test with Broader Date Range

1. Go to **Daily Operations**
2. Change filter from **"Today"** to **"This Year"**
3. Check if certificates/medical forms appear

If they appear with "This Year" but not "Today", it means:
- ✅ Data exists
- ✅ Backend query works
- ❌ Data was created on a different date

## Quick Fix Options

### Option 1: Use Broader Date Filter
Just select "This Year" to see all data regardless of when it was created.

### Option 2: Check Browser Console
1. Open browser console (F12)
2. Go to Daily Operations page
3. Look for API response:
```javascript
{
  "certificates_issued": [...],  // Should have data
  "medical_forms_issued": [...]  // Should have data
}
```

### Option 3: Check Backend Logs
Look in `writable/logs/log-2026-01-19.log` for:
```
Certificates count: X
Medical forms count: Y
```

## Expected Behavior

### When Data Exists:
```
✅ Certificates Issued (2)
   | Cert # | Person Name | Purpose | Date | View |
   |--------|-------------|---------|------|------|
   | ...    | ...         | ...     | ...  | 👁   |

✅ Medical Forms Issued (1)
   | Case # | Patient | Hospital | Date | View |
   |--------|---------|----------|------|------|
   | ...    | ...     | ...      | ...  | 👁   |
```

### When No Data:
```
❌ Certificates Issued (0)
   No certificates issued

❌ Medical Forms Issued (0)
   No medical forms issued
```

## Solution

If no data exists, you need to:

1. **Create a certificate:**
   - Go to OB Officer/Investigation dashboard
   - Issue a non-criminal certificate

2. **Create a medical form:**
   - Go to Medical Forms dashboard
   - Fill out a medical examination form

3. **Refresh Daily Operations:**
   - Should now appear in the lists

## Test Query

Run this to see ALL certificates regardless of date:

```sql
-- See all certificates ever created
SELECT 
    COUNT(*) as total_certificates,
    MIN(DATE(created_at)) as oldest_date,
    MAX(DATE(created_at)) as newest_date
FROM non_criminal_certificates;

-- See all medical forms ever created
SELECT 
    COUNT(*) as total_forms,
    MIN(DATE(created_at)) as oldest_date,
    MAX(DATE(created_at)) as newest_date
FROM medical_examination_forms;
```

This will tell you:
- If any data exists at all
- When the oldest/newest records were created
- Why they might not show up with current date filter
