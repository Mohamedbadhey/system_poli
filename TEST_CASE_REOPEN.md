# Testing Case Reopen Feature

## Quick Test Guide

### Step 1: Apply Database Migration
```bash
APPLY_REOPEN_MIGRATION.bat
```

This will add the necessary columns and tables to your `pcms_db` database.

### Step 2: Verify Migration
Check that these were added successfully:

**New columns in `cases` table:**
- `reopened_at`
- `reopened_by`
- `reopened_count`
- `reopen_reason`
- `previous_closure_date`
- `previous_closure_type`
- `previous_closure_reason`

**New table:**
- `case_reopen_history`

**Updated enum:**
- `status` now includes 'reopened'

### Step 3: Login and Test

1. **Login as Admin/Super Admin**
   - Use an admin account (user role: admin, super_admin, or station_admin)

2. **Navigate to Solved Cases**
   - Go to: **Investigation → Solved Cases Dashboard**
   - Or directly: `http://localhost/dashboard.html` → Load "Solved Cases Dashboard" page

3. **Find a Closed Case**
   - Look at the table of closed cases
   - You should see cases with status 'closed'
   - Note: Case ID 30 and 35 are closed in your database

4. **Test Reopen Button**
   - You should see a yellow **"Reopen"** button next to the "View" button
   - Click the "Reopen" button on case ID 30 or 35

5. **Fill Reopen Form**
   - Enter reason: "New evidence has been discovered requiring further investigation"
   - Optionally select an investigator from dropdown
   - Add notes if assigning to investigator
   - Click "Reopen Case"

6. **Verify Success**
   - You should see success message
   - Case should disappear from closed cases table (or refresh the page)
   - Case status should change to 'reopened' or 'assigned'

### Step 4: Verify in Database

Run this SQL query to see reopened cases:
```sql
-- Check reopened cases
SELECT id, case_number, status, reopened_at, reopened_by, reopened_count, reopen_reason 
FROM cases 
WHERE status = 'reopened' OR reopened_at IS NOT NULL;

-- Check reopen history
SELECT * FROM case_reopen_history ORDER BY reopened_at DESC;
```

### Step 5: Test as Investigator

If case was assigned to an investigator:

1. **Login as Investigator**
   - Use investigator account (e.g., user ID 26 - baare)

2. **Check My Cases**
   - Go to: **Investigation → My Cases**
   - The reopened case should appear in your cases list

3. **View Case**
   - All previous data should be intact
   - Case should show it was reopened

### Expected Results

✅ **Reopen button visible** for admin/super_admin/station_admin only
✅ **Reopen button hidden** for court-solved cases (closure_type = 'court_solved')
✅ **Reopen modal opens** with case details
✅ **Validation works** - requires minimum 20 characters
✅ **Case reopens successfully** - status changes
✅ **Data preserved** - all previous evidence, notes, reports intact
✅ **History tracked** - reopen_history table populated
✅ **Investigator notified** - if assigned during reopen
✅ **Case appears** in investigator's dashboard if assigned

### Troubleshooting

**Problem: Reopen button not showing**
- Check you're logged in as admin/super_admin/station_admin
- Check case closure_type is not 'court_solved'
- Check browser console for JavaScript errors

**Problem: Migration fails**
- Check database connection in `env` file
- Ensure MySQL is running
- Check you have ALTER TABLE permissions

**Problem: "Cannot reopen case"**
- Case must have status 'closed'
- Court-closed cases cannot be reopened
- Check case status in database

**Problem: Investigator not in dropdown**
- Make sure investigators exist in users table with role='investigator'
- Check they are active (is_active=1)

### Test Cases in Your Database

Based on your `pcms_db.sql`, you have these closed cases:

1. **Case ID 30** (CASE/XGD-01/2026/0018)
   - Status: closed
   - Good for testing!

2. **Case ID 35** (CASE/XGD-01/2026/0023)
   - Status: closed
   - Good for testing!

### Sample Test Scenarios

**Scenario 1: Simple Reopen**
- Case: 30
- Reason: "Witness has come forward with new information that contradicts the initial findings"
- Assignment: None
- Expected: Case status → 'reopened'

**Scenario 2: Reopen with Assignment**
- Case: 35
- Reason: "Additional evidence discovered at the crime scene requires forensic analysis and further investigation"
- Assignment: Select investigator (e.g., baare - ID 26)
- Notes: "Please prioritize this case and conduct immediate follow-up interviews"
- Expected: Case status → 'assigned', investigator receives notification

**Scenario 3: Multiple Reopens**
- Reopen case 30
- Close it again (using normal close case feature)
- Reopen it again
- Expected: reopened_count = 2, both entries in case_reopen_history

### Verification Queries

```sql
-- See all reopen data for a case
SELECT 
    c.id, 
    c.case_number, 
    c.status,
    c.reopened_at,
    u.full_name as reopened_by_name,
    c.reopened_count,
    c.reopen_reason,
    c.previous_closure_date,
    c.previous_closure_type
FROM cases c
LEFT JOIN users u ON u.id = c.reopened_by
WHERE c.id = 30;  -- Change to your case ID

-- See reopen history
SELECT 
    crh.*,
    u1.full_name as reopened_by_name,
    u2.full_name as assigned_to_name
FROM case_reopen_history crh
LEFT JOIN users u1 ON u1.id = crh.reopened_by
LEFT JOIN users u2 ON u2.id = crh.assigned_to_investigator
WHERE crh.case_id = 30  -- Change to your case ID
ORDER BY crh.reopened_at DESC;
```

---

## Next Steps After Testing

Once testing is successful, you can:

1. **Train staff** on using the reopen feature
2. **Document policies** for when cases should be reopened
3. **Set up monitoring** to track reopen frequency
4. **Consider adding** approval workflow if needed
5. **Add email notifications** for stakeholders

## Support

If you encounter issues, check:
- Browser console (F12) for JavaScript errors
- PHP error logs for backend errors
- Database query logs
- Network tab to see API responses

Happy testing! 🎉
