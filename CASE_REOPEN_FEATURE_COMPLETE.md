# Case Reopening Feature - Implementation Complete

## Overview
The case reopening feature has been successfully implemented. This allows administrators and station admins to reopen closed cases for further investigation while preserving all previous case data and maintaining a complete audit trail.

## Features Implemented

### 1. **Database Schema**
- Added reopening fields to `cases` table:
  - `reopened_at` - Timestamp when case was reopened
  - `reopened_by` - User ID who reopened the case
  - `reopened_count` - Number of times case has been reopened
  - `reopen_reason` - Detailed reason for reopening
  - `previous_closure_date` - Date of previous closure
  - `previous_closure_type` - Type of previous closure
  - `previous_closure_reason` - Reason for previous closure

- Created `case_reopen_history` table to track all reopen events:
  - Complete reopen history with user information
  - Previous closure information
  - Assignment information if case was assigned during reopen
  - Full audit trail

- Added 'reopened' status to case status enum

### 2. **Backend Implementation**

#### CaseModel Methods:
- `reopenCase()` - Reopens a closed case with full transaction support
- `getReopenHistory()` - Retrieves complete reopen history
- `canReopen()` - Checks if case can be reopened with validation

#### CaseController Endpoints:
- `POST /investigation/cases/{id}/reopen` - Reopen a case
- `GET /investigation/cases/{id}/reopen-history` - Get reopen history
- `GET /investigation/cases/{id}/can-reopen` - Check if case can be reopened

#### Key Features:
- Role-based access control (admin, super_admin, station_admin only)
- Automatic investigator assignment during reopen
- Status history tracking
- Notification system for assigned investigators
- Transaction-based operations for data integrity
- Court-closed case protection

### 3. **Frontend Implementation**

#### Solved Cases Dashboard Updates:
- **Reopen Button**: Added for authorized users (not visible for court-solved cases)
- **Reopen Modal**: Rich form with:
  - Case information display
  - Reopen reason input (minimum 20 characters)
  - Investigator assignment dropdown
  - Assignment notes field
  - Warning message about case restoration
  
#### API Integration:
- `investigationAPI.reopenCase()` - Reopen case with data
- `investigationAPI.getReopenHistory()` - View reopen history
- `investigationAPI.canReopenCase()` - Check reopen eligibility

### 4. **Workflow**

#### Reopening Process:
1. **Authorization Check**: System verifies user has permission (admin/super_admin/station_admin)
2. **Eligibility Validation**: 
   - Case must be in 'closed' status
   - Cannot reopen court-closed cases
3. **Data Collection**:
   - Reopen reason (required, minimum 20 characters)
   - Optional investigator assignment
   - Optional assignment notes
4. **Transaction Execution**:
   - Update case status to 'reopened' (or 'assigned' if investigator assigned)
   - Store previous closure information
   - Increment reopen counter
   - Log in reopen history table
   - Log in case status history
   - Reactivate or create investigator assignment if specified
   - Send notification to assigned investigator
5. **Confirmation**: Display success message and reload cases table

#### Data Preservation:
- All previous case data remains intact
- Previous closure information is stored
- Complete audit trail maintained
- Case can be closed and reopened multiple times

### 5. **Translation Support**
Both English and Somali translations added for:
- All UI labels and messages
- Modal text and instructions
- Error messages
- Success confirmations
- History view labels

## Access Control

### Who Can Reopen Cases:
- ✅ **Super Admin** - Can reopen any closed case
- ✅ **Admin** - Can reopen any closed case
- ✅ **Station Admin** - Can reopen cases in their jurisdiction
- ❌ **Investigators** - Cannot reopen cases
- ❌ **OB Officers** - Cannot reopen cases
- ❌ **Court Users** - Cannot reopen cases

### Restrictions:
- Cases closed by court (court_solved) cannot be reopened without court approval
- Only cases with status 'closed' can be reopened
- Minimum 20 character reason required

## How to Use

### For Administrators:

1. **Navigate to Solved Cases Dashboard**
   - Go to Investigation → Solved Cases

2. **Find Closed Case**
   - Browse or filter closed cases
   - Identify case needing reopening

3. **Click Reopen Button**
   - Yellow "Reopen" button appears for eligible cases
   - Review case details shown in modal

4. **Provide Information**
   - Enter detailed reason (minimum 20 characters)
   - Optionally assign to investigator
   - Add assignment notes if needed

5. **Confirm Reopening**
   - Click "Reopen Case" button
   - System processes the request
   - Case status changes to 'reopened' or 'assigned'

6. **View History (Optional)**
   - View complete reopen history for any case
   - See who reopened, when, and why

### For Investigators:

When a case is reopened and assigned to you:
1. Receive notification about case assignment
2. Case appears in your "My Cases" list
3. Continue investigation with all previous data available
4. Access to all previous evidence, notes, and reports
5. Can see reopen reason and previous closure information

## Testing the Feature

### Prerequisites:
1. Apply database migration:
   ```bash
   APPLY_REOPEN_MIGRATION.bat
   ```

2. Login as admin or super_admin

### Test Scenarios:

#### Test 1: Basic Reopen
1. Open Solved Cases Dashboard
2. Find a closed case (not court-solved)
3. Click "Reopen" button
4. Enter reason: "New evidence has been discovered that requires further investigation"
5. Do not assign investigator
6. Submit
7. ✓ Case should reopen successfully
8. ✓ Case should appear in appropriate dashboard

#### Test 2: Reopen with Assignment
1. Find another closed case
2. Click "Reopen" button
3. Enter reason: "Witness has come forward with new testimony"
4. Select an investigator from dropdown
5. Add notes: "Please interview the new witness urgently"
6. Submit
7. ✓ Case should reopen and assign to investigator
8. ✓ Investigator should receive notification

#### Test 3: View Reopen History
1. Find a case that has been reopened
2. View case details
3. Check reopen history
4. ✓ Should show all reopen events with dates, users, and reasons

#### Test 4: Validation Tests
1. Try to reopen without entering reason
   - ✓ Should show validation error
2. Try to reopen with short reason (< 20 chars)
   - ✓ Should show validation error
3. Try to reopen court-closed case
   - ✓ Should show error message

#### Test 5: Permission Tests
1. Login as investigator
2. Navigate to Solved Cases
3. ✓ Reopen button should not appear

## Technical Details

### Database Migration File:
- `app/Database/case_reopen_migration.sql`
- Migration script: `APPLY_REOPEN_MIGRATION.bat`

### Modified Files:
1. **Backend**:
   - `app/Models/CaseModel.php` - Added reopen methods
   - `app/Controllers/Investigation/CaseController.php` - Added reopen endpoints
   - `app/Config/Routes.php` - Added reopen routes
   - `app/Database/case_reopen_migration.sql` - Database schema

2. **Frontend**:
   - `public/assets/js/api.js` - Added reopen API methods
   - `public/assets/js/solved-cases-dashboard.js` - Added reopen UI and logic

3. **Translations**:
   - `app/Language/en/App.php` - English translations
   - `app/Language/so/App.php` - Somali translations

### API Endpoints:

```
POST   /investigation/cases/{id}/reopen
GET    /investigation/cases/{id}/reopen-history
GET    /investigation/cases/{id}/can-reopen
```

### Status Flow:
```
closed → (reopen without assignment) → reopened
closed → (reopen with assignment) → assigned → investigating → closed
```

## Benefits

1. **Flexibility**: Cases can be reopened when new evidence emerges
2. **Audit Trail**: Complete history of all reopening events
3. **Data Integrity**: All previous data preserved
4. **Accountability**: Tracks who reopened and why
5. **Workflow Integration**: Seamless integration with existing case management
6. **Permission-Based**: Only authorized users can reopen cases
7. **Bilingual**: Full support in English and Somali

## Future Enhancements (Optional)

- Court approval workflow for court-closed cases
- Bulk reopen functionality
- Reopen request/approval system
- Advanced analytics on reopened cases
- Email notifications for reopening
- Reopen time limits or expiry

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify database migration applied correctly
3. Confirm user has appropriate role
4. Check case status and closure type
5. Review server logs for backend errors

---

**Implementation Date**: January 20, 2026
**Status**: ✅ Complete and Ready for Testing
**Version**: 1.0
