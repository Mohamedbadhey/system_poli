# Evidence Edit and Change Tracking Feature

## Overview
This feature allows investigators to edit evidence metadata while maintaining a complete audit trail of all changes made to evidence records.

## Features Implemented

### 1. Evidence Editing
- ✅ Edit evidence title
- ✅ Edit evidence description  
- ✅ Change evidence type
- ✅ Update collection location
- ✅ Modify tags
- ✅ Toggle critical status
- ✅ Automatic tracking of who edited and when

### 2. Edit History Tracking
- ✅ Records all changes to evidence
- ✅ Tracks field name, old value, and new value
- ✅ Records editor and timestamp
- ✅ Displays complete audit trail
- ✅ Visual indicator (badge) for edited evidence

### 3. Security & Permissions
- ✅ Only investigators assigned to the case can edit evidence
- ✅ Admins and super_admins can edit any evidence
- ✅ Cannot change evidence file after upload (security)
- ✅ Cannot change auto-generated evidence number
- ✅ All edits are immutable (stored in history)

## Database Schema

### Evidence Table (Updated)
```sql
ALTER TABLE evidence 
ADD COLUMN is_edited TINYINT(1) DEFAULT 0 AFTER tags,
ADD COLUMN last_edited_at TIMESTAMP NULL AFTER is_edited,
ADD COLUMN last_edited_by INT UNSIGNED NULL AFTER last_edited_at,
ADD FOREIGN KEY (last_edited_by) REFERENCES users(id) ON DELETE SET NULL;
```

### Evidence Edit History Table
```sql
CREATE TABLE IF NOT EXISTS evidence_edit_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    evidence_id INT UNSIGNED NOT NULL,
    edited_by INT UNSIGNED NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_evidence (evidence_id),
    INDEX idx_edited_at (edited_at),
    INDEX idx_edited_by (edited_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API Endpoints

### Update Evidence
**Endpoint:** `PUT /investigation/evidence/{id}`

**Request Body:**
```json
{
    "title": "Updated Evidence Title",
    "description": "Updated description",
    "evidence_type": "digital",
    "location_collected": "Updated location",
    "tags": "updated, tags",
    "is_critical": 1
}
```

**Response:**
```json
{
    "status": "success",
    "message": "Evidence updated successfully",
    "data": {
        "id": 1,
        "evidence_number": "CASE-2024-001-E001",
        "title": "Updated Evidence Title",
        "is_edited": 1,
        "last_edited_at": "2024-01-15 10:30:00",
        "last_edited_by": 5,
        "last_editor_name": "John Doe"
    }
}
```

### Get Edit History
**Endpoint:** `GET /investigation/evidence/{id}/history`

**Response:**
```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "evidence_id": 1,
            "edited_by": 5,
            "editor_name": "John Doe",
            "field_name": "title",
            "old_value": "Original Title",
            "new_value": "Updated Title",
            "edited_at": "2024-01-15 10:30:00"
        },
        {
            "id": 2,
            "evidence_id": 1,
            "edited_by": 5,
            "editor_name": "John Doe",
            "field_name": "is_critical",
            "old_value": "0",
            "new_value": "1",
            "edited_at": "2024-01-15 10:30:05"
        }
    ]
}
```

## Frontend Components

### Files Modified/Created
1. **`public/assets/js/evidence-edit.js`** (NEW)
   - `EvidenceEditManager` class
   - `showEditModal()` - Display edit form
   - `saveChanges()` - Submit changes to API
   - `showEditHistory()` - Display edit history
   - `renderEditHistoryModal()` - Show history in modal

2. **`public/assets/js/app.js`** (MODIFIED)
   - Added edit buttons to evidence tables
   - Added edit history buttons
   - Added `refreshEvidenceList()` function
   - Added visual indicators for edited evidence

3. **`public/assets/js/api.js`** (MODIFIED)
   - Added `updateEvidence()` endpoint
   - Added `getEvidenceHistory()` endpoint

4. **`public/dashboard.html`** (MODIFIED)
   - Added evidence-edit.js script reference

5. **`app/Config/Routes.php`** (MODIFIED)
   - Added route: `GET /investigation/evidence/{id}/history`

## Backend Components

### Files Modified
1. **`app/Controllers/Investigation/EvidenceController.php`**
   - `update()` method - Updates evidence with change tracking
   - `getEditHistory()` method - Retrieves edit history

2. **`app/Models/EvidenceModel.php`**
   - `editEvidence()` method - Edits evidence and tracks changes
   - `getEditHistory()` method - Gets edit history with editor names
   - Updated `$allowedFields` to include edit tracking fields

## Usage Instructions

### For Investigators

#### Editing Evidence
1. Navigate to **Evidence Management** page
2. Find the evidence you want to edit
3. Click the **Edit** button (pencil icon)
4. Modify the fields you want to change
5. Click **Save Changes**
6. A success notification will appear
7. The evidence list will refresh automatically

#### Viewing Edit History
1. Navigate to **Evidence Management** page
2. Find the evidence with the edited badge (📝)
3. Click the **History** button (clock icon)
4. View all changes made to the evidence
5. See who made each change and when

### For Administrators

Administrators have the same capabilities as investigators but can edit evidence from any case, not just assigned cases.

## Testing

### Prerequisites
1. Database migration applied (evidence_edit_history table created)
2. User logged in as investigator or admin
3. At least one evidence record exists

### Test Scenarios

#### Test 1: Edit Evidence Title
1. Go to Evidence Management
2. Click Edit on any evidence
3. Change title to "Test Updated Title"
4. Click Save
5. **Expected:** Evidence updates, success message shown, edited badge appears

#### Test 2: Multiple Field Changes
1. Edit an evidence item
2. Change title, description, and location
3. Save changes
4. Click History button
5. **Expected:** Three separate entries in history, one for each field

#### Test 3: Critical Status Toggle
1. Edit evidence
2. Toggle "Mark as Critical Evidence" checkbox
3. Save
4. **Expected:** Badge changes from "Normal" to "Critical" in list

#### Test 4: View Edit History
1. Find evidence with edited badge
2. Click History button
3. **Expected:** Modal shows all changes with old/new values, editor names, timestamps

#### Test 5: Permission Check
1. Login as investigator not assigned to case
2. Try to edit evidence from that case
3. **Expected:** 403 Forbidden error

## Visual Indicators

### Evidence List
- **📝 Badge:** Appears next to evidence number if edited
- **Critical Badge:** Red badge for critical evidence
- **Normal Badge:** Gray badge for normal evidence

### Edit Modal
- **Warning Alert:** Informs user that changes are tracked
- **Last Edited Info:** Shows who edited last and when (if previously edited)

### History Modal
- **Color Coding:** Old values in gray, new values in green
- **Field Names:** Formatted for readability (e.g., "is_critical" → "Critical Status")
- **Timestamps:** Human-readable format

## Editable Fields

The following fields can be edited:
- ✅ `title` - Evidence title
- ✅ `description` - Evidence description
- ✅ `evidence_type` - Type of evidence
- ✅ `location_collected` - Collection location
- ✅ `tags` - Comma-separated tags
- ✅ `is_critical` - Critical status flag

### Non-Editable Fields (Security)
- ❌ `evidence_number` - Auto-generated, immutable
- ❌ `file_path` - Cannot change uploaded file
- ❌ `collected_by` - Original collector
- ❌ `collected_at` - Original collection date
- ❌ `case_id` - Cannot move evidence between cases

## Change Tracking Details

### What Gets Tracked
- Field name being changed
- Old value before change
- New value after change
- User ID who made the change
- Timestamp of the change

### What Doesn't Get Tracked
- Fields that haven't changed (no entry created)
- Read operations (only writes)
- Failed update attempts

## Error Handling

### Client-Side
- Form validation before submission
- Loading indicators during save
- User-friendly error messages
- Auto-dismiss notifications

### Server-Side
- Permission checks (assigned investigator or admin)
- Field validation (evidence_type in allowed list)
- Database transaction safety
- Detailed error responses

## Performance Considerations

- Edit history indexed by evidence_id for fast retrieval
- Only changed fields are logged (not entire record)
- Lazy loading of history (only when requested)
- Efficient JOIN queries for editor names

## Future Enhancements

Potential improvements for future versions:
- [ ] Ability to revert to previous values
- [ ] Comparison view (side-by-side old vs new)
- [ ] Export edit history to PDF
- [ ] Email notifications on critical evidence edits
- [ ] Bulk edit multiple evidence items
- [ ] Advanced filtering in history view
- [ ] Evidence edit approval workflow

## Troubleshooting

### Issue: Edit button doesn't appear
**Solution:** Check user role and case assignment. Only assigned investigators and admins can edit.

### Issue: Changes don't save
**Solution:** Check browser console for errors. Verify token is valid and not expired.

### Issue: History shows empty
**Solution:** Ensure database migration was applied correctly. Check evidence_edit_history table exists.

### Issue: Permission denied error
**Solution:** Verify user is assigned to the case or has admin role.

## Support

For issues or questions about this feature, please contact the development team or check the system documentation.

---

**Version:** 1.0  
**Last Updated:** December 31, 2024  
**Author:** Police Case Management System Development Team
