# Test Case Closure Feature

## Quick Test Steps

### Prerequisites
1. Apply the database migration:
   ```bash
   APPLY_CASE_CLOSURE_MIGRATION.bat
   ```

2. Start the server:
   ```bash
   START_SERVER.bat
   ```

3. Login as an investigator who has an active case assigned

### Test Scenario 1: Investigator Closed (No Court)
**Steps:**
1. Navigate to "My Cases" or "Investigations"
2. Open any active case
3. Click the "Close Case" button
4. In the modal:
   - Select **"Closed by Investigator (No Court Acknowledgment)"**
   - Enter a detailed closure reason (minimum 20 characters)
   - Example: "Case resolved through mediation. Both parties agreed to settle the matter amicably with no further legal action required."
5. Click "Close Case"

**Expected Result:**
- Success message displayed
- Case status changes to "closed"
- Case court_status is "not_sent"
- Case appears in "Solved by Investigator" section

### Test Scenario 2: Closed with Court Acknowledgment
**Steps:**
1. Open another active case
2. Click "Close Case"
3. In the modal:
   - Select **"Closed with Court Acknowledgment"**
   - Court acknowledgment section appears
   - Fill in:
     - **Acknowledgment Number**: "ACK-XGD-2026-001"
     - **Acknowledgment Date**: Select today's date
     - **Court Deadline**: Select a date 30 days from now
     - **Document**: Upload a test PDF or image (optional)
     - **Notes**: "Court acknowledged the case resolution and provided reference number."
   - Enter closure reason: "Case closed as per court acknowledgment. All evidence submitted and court confirmed resolution."
4. Click "Close Case"

**Expected Result:**
- Success message displayed
- Case status changes to "closed"
- Case court_status is "court_assigned_back"
- All court acknowledgment details are saved
- Document uploaded to `public/uploads/court-acknowledgments/`

### Test Scenario 3: Court Solved the Case
**Steps:**
1. Open another active case
2. Click "Close Case"
3. In the modal:
   - Select **"Court Solved the Case"**
   - Enter closure reason: "Case was resolved by the court. Court issued judgment in favor of the complainant with compensation awarded."
4. Click "Close Case"

**Expected Result:**
- Success message displayed
- Case status changes to "closed"
- Case court_status is "court_closed"
- Case resolution attributed to court

### Validation Tests

#### Test 4: Missing Closure Type
1. Click "Close Case"
2. Leave closure type unselected
3. Enter closure reason
4. Click "Close Case"

**Expected**: Error message "Please select a closure type"

#### Test 5: Short Closure Reason
1. Click "Close Case"
2. Select any closure type
3. Enter only "Test" (less than 20 characters)
4. Click "Close Case"

**Expected**: Error message "Closure reason must be at least 20 characters"

#### Test 6: Missing Court Acknowledgment Fields
1. Click "Close Case"
2. Select "Closed with Court Acknowledgment"
3. Leave acknowledgment number empty
4. Enter valid closure reason
5. Click "Close Case"

**Expected**: Error message "Acknowledgment number is required"

### Verify in Database

After testing, check the database:

```sql
-- View all closed cases with closure types
SELECT 
    id,
    case_number,
    status,
    court_status,
    closure_type,
    closure_reason,
    court_acknowledgment_number,
    closed_date
FROM cases 
WHERE status = 'closed'
ORDER BY closed_date DESC
LIMIT 10;
```

### Language Test

1. Switch language to Somali
2. Click "Close Case"
3. Verify all labels are translated:
   - "Nooca Xirista" (Closure Type)
   - "Waxaa Xiray Baadhaha" (Closed by Investigator)
   - "Sababta Xirista" (Closure Reason)
   - etc.

### File Upload Test

For court acknowledgment document:

1. Try uploading a PDF file < 10MB → Should work
2. Try uploading an image (JPG/PNG) < 10MB → Should work
3. Try uploading a file > 10MB → Should show error
4. Try uploading a .txt or .docx file → Should show error
5. Check uploaded file appears in `public/uploads/court-acknowledgments/`

## Troubleshooting

### Issue: "Column not found" error
**Solution**: Run the migration script: `APPLY_CASE_CLOSURE_MIGRATION.bat`

### Issue: File upload fails
**Solution**: 
- Check `public/uploads/court-acknowledgments/` folder exists and is writable
- Verify file size is under 10MB
- Ensure file type is PDF or image

### Issue: Modal doesn't show court acknowledgment fields
**Solution**: 
- Clear browser cache
- Check browser console for JavaScript errors
- Verify `court-workflow.js` is loaded

## Success Criteria

✅ All three closure types work correctly
✅ Court acknowledgment fields show/hide based on selection
✅ Validation prevents incomplete submissions
✅ Files upload successfully
✅ Database fields populated correctly
✅ Translations work in both languages
✅ Case status and court_status set appropriately
✅ Notifications sent based on closure type
