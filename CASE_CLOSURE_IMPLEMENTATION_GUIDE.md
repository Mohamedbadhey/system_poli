# Case Closure Enhancement Implementation Guide

## Overview
Investigators can now close cases using three different closure types, with full support for court acknowledgment details.

## Database Migration

### Apply the Migration
Run the batch file to apply database changes:
```bash
APPLY_CASE_CLOSURE_MIGRATION.bat
```

### New Fields Added
The migration adds the following fields to the `cases` table:

1. **closure_type** (ENUM)
   - `investigator_closed` - Investigator closed without court involvement
   - `closed_with_court_ack` - Investigator closed with court acknowledgment
   - `court_solved` - Court solved the case

2. **Court Acknowledgment Fields**
   - `court_acknowledgment_number` - The acknowledgment reference number
   - `court_acknowledgment_date` - Date of acknowledgment
   - `court_acknowledgment_deadline` - Court-set deadline
   - `court_acknowledgment_document` - Uploaded document path
   - `court_acknowledgment_notes` - Additional notes

## Backend Changes

### Updated Controller Method
**File**: `app/Controllers/Investigation/CaseController.php`

The `closeCase()` method now:
- Accepts `closure_type` as a required parameter
- Validates court acknowledgment fields when `closure_type` is `closed_with_court_ack`
- Handles file upload for court acknowledgment documents
- Sets appropriate `court_status` based on closure type
- Logs detailed closure information in case history

### API Changes
**File**: `public/assets/js/api.js`

The `investigationAPI.closeCase()` method now accepts:
- **Object format** (new): `{ closure_type, closure_reason, court_acknowledgment_* }`
- **String format** (backward compatible): Defaults to `investigator_closed`

## Frontend Changes

### Enhanced Close Case Modal
**File**: `public/assets/js/court-workflow.js`

The `showCloseCaseModal()` function now displays:

1. **Closure Type Selector**
   - Three options with clear descriptions
   - Dynamic form that shows/hides court acknowledgment fields

2. **Court Acknowledgment Section** (shown when type is `closed_with_court_ack`)
   - Acknowledgment Number (required)
   - Acknowledgment Date (required)
   - Court Deadline (required)
   - Document Upload (optional - PDF or image, max 10MB)
   - Additional Notes (optional)

3. **Closure Reason** (always required, min 20 characters)

### Translation Support
New translation keys added to both English and Somali:
- `closure_type`, `select_closure_type`
- `investigator_closed`, `closed_with_court_ack`, `court_solved`
- `court_acknowledgment_details`
- `acknowledgment_number`, `acknowledgment_date`, `acknowledgment_deadline`
- And more...

## Usage Flow

### 1. Investigator Closes Without Court (investigator_closed)
- Investigator selects "Closed by Investigator (No Court Acknowledgment)"
- Enters closure reason
- Case status → `closed`
- Court status → `not_sent`

### 2. Investigator Closes With Court Acknowledgment (closed_with_court_ack)
- Investigator selects "Closed with Court Acknowledgment"
- Fills in all court acknowledgment fields:
  - Acknowledgment number
  - Acknowledgment date
  - Court deadline
  - Optional: Upload document, add notes
- Enters closure reason
- Case status → `closed`
- Court status → `court_assigned_back`
- All court acknowledgment data is saved

### 3. Court Solved the Case (court_solved)
- Investigator selects "Court Solved the Case"
- Enters closure reason explaining how court resolved it
- Case status → `closed`
- Court status → `court_closed`

## File Uploads
Court acknowledgment documents are stored in:
- **Writable**: `writable/uploads/court-acknowledgments/`
- **Public**: `public/uploads/court-acknowledgments/`

Supported formats: PDF, JPG, JPEG, PNG (max 10MB)

## Testing Scenarios

### Test 1: Simple Investigator Closure
1. Open a case in investigation
2. Click "Close Case"
3. Select "Closed by Investigator (No Court Acknowledgment)"
4. Enter closure reason (min 20 chars)
5. Submit
6. Verify case status is `closed` and court_status is `not_sent`

### Test 2: Closure With Court Acknowledgment
1. Open a case in investigation
2. Click "Close Case"
3. Select "Closed with Court Acknowledgment"
4. Fill all required fields:
   - Acknowledgment number: "ACK-2026-001"
   - Acknowledgment date: Select date
   - Court deadline: Select future date
   - Upload a PDF document (optional)
   - Add notes (optional)
5. Enter closure reason
6. Submit
7. Verify all court acknowledgment data is saved
8. Check document is uploaded to `public/uploads/court-acknowledgments/`

### Test 3: Court Solved Case
1. Open a case in investigation
2. Click "Close Case"
3. Select "Court Solved the Case"
4. Enter closure reason explaining court resolution
5. Submit
6. Verify case status is `closed` and court_status is `court_closed`

### Test 4: Validation
- Try submitting without selecting closure type → Should show error
- Try submitting with closure reason < 20 chars → Should show error
- Select "Closed with Court Acknowledgment" but leave fields empty → Should show errors
- Upload file > 10MB → Should show error
- Upload non-PDF/image file → Should show error

## Database Queries

### Check Closure Types Distribution
```sql
SELECT 
    closure_type,
    COUNT(*) as count
FROM cases 
WHERE status = 'closed'
GROUP BY closure_type;
```

### View Cases with Court Acknowledgment
```sql
SELECT 
    case_number,
    closure_type,
    court_acknowledgment_number,
    court_acknowledgment_date,
    court_acknowledgment_deadline,
    closure_reason
FROM cases 
WHERE closure_type = 'closed_with_court_ack';
```

### Check Court Status After Closure
```sql
SELECT 
    case_number,
    status,
    court_status,
    closure_type,
    closed_date
FROM cases 
WHERE status = 'closed'
ORDER BY closed_date DESC
LIMIT 10;
```

## Benefits

1. **Clear Closure Types**: Distinguishes between investigator-only closures, court-acknowledged closures, and court resolutions
2. **Full Documentation**: Court acknowledgment details are captured including reference numbers and deadlines
3. **Document Trail**: Ability to upload court acknowledgment documents
4. **Backward Compatible**: Old code still works with default closure type
5. **Bilingual Support**: Full translation in English and Somali
6. **Validation**: Ensures all required data is provided based on closure type

## Notes for Administrators

- Monitor court acknowledgment deadlines for reporting purposes
- Court acknowledgment documents are accessible via web path
- All closure actions are logged in case status history
- Notifications are sent based on closure type
