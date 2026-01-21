# Feature: Evidence File Replacement with History Tracking

## Overview

Users can now **replace evidence files** and see the **complete change history** of file replacements.

---

## ✨ Features Implemented

### 1. View Current File Information
- **File name** displayed in edit modal
- **File size** shown in KB
- **File type** information
- **Visual file icon** for clarity

### 2. Replace File Functionality
- **"Replace File" button** in edit modal
- **File upload dialog** with validation
- **Warning message** about replacement
- **50MB file size limit**
- **Secure file handling**

### 3. Complete History Tracking
- **Old file name** recorded
- **New file name** recorded
- **File path changes** tracked
- **File size changes** tracked
- **File type changes** tracked
- **Custody log** updated

### 4. Security Features
- **Old file securely deleted** after replacement
- **New file automatically encrypted**
- **Permission checks** (only assigned investigators)
- **Complete audit trail**

---

## 🎯 How It Works

### User Flow

```
1. Click "Edit" on evidence
   ↓
2. See current file displayed
   ↓
3. Click "Replace File" button
   ↓
4. Select new file from computer
   ↓
5. Click "Upload"
   ↓
6. Old file deleted, new file encrypted
   ↓
7. Change tracked in history
   ↓
8. Success notification shown
```

---

## 🖼️ User Interface

### Edit Modal - File Section

```
┌─────────────────────────────────────────────────────┐
│ 🖊️ Edit Evidence                               [×] │
├─────────────────────────────────────────────────────┤
│ ℹ️ Evidence Number: CASE-001-E001                  │
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ Current File:                    [Replace File] ││
│ │ 📄 crime_scene_photo.jpg (245.32 KB)           ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ Title: *                                            │
│ [Crime Scene Photo                        ]         │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

### Replace File Dialog

```
┌─────────────────────────────────────────────────────┐
│ 📤 Replace Evidence File                       [×] │
├─────────────────────────────────────────────────────┤
│ ⚠️ Warning: Replacing the file will delete the     │
│ old file and track this change in history.         │
│                                                     │
│ Select New File: *                                  │
│ [Choose File]                                       │
│ Maximum file size: 50MB                             │
│                                                     │
│                           [Cancel]  [📤 Upload]    │
└─────────────────────────────────────────────────────┘
```

### History View - File Changes

```
┌──────────────────────────────────────────────────────┐
│ 🕐 Evidence Edit History                        [×] │
├──────────────────────────────────────────────────────┤
│ Date & Time    | Edited By | Field     | Old → New │
│ Jan 15 10:30AM | John Doe  | File Name | old → new │
│ Jan 15 10:30AM | John Doe  | File Size | 200→300KB │
└──────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Backend - New Endpoint

**Route:**
```php
POST /investigation/evidence/{id}/replace-file
```

**Controller Method:**
```php
public function replaceFile($id = null)
{
    // 1. Validate permissions
    // 2. Validate file upload
    // 3. Store old file info
    // 4. Upload and encrypt new file
    // 5. Track changes in history
    // 6. Delete old file
    // 7. Update custody log
}
```

**Key Features:**
- ✅ Permission checking
- ✅ File validation (50MB limit)
- ✅ Secure file encryption
- ✅ Old file deletion
- ✅ History tracking
- ✅ Custody logging

### Model Changes

**Updated Editable Fields:**
```php
$editableFields = [
    'title', 'description', 'evidence_type', 
    'location_collected', 'is_critical', 'tags',
    'file_name', 'file_path', 'file_type', 'file_size' // NEW
];
```

### Frontend - New Functions

**1. showReplaceFileDialog()**
- Opens file upload dialog
- Validates file size
- Shows warning message

**2. uploadReplacementFile()**
- Uploads file via FormData
- Shows loading spinner
- Handles success/error
- Refreshes evidence list

**3. Enhanced formatFieldValue()**
- Displays file sizes in KB
- Shows file icon for file names
- Formats file-related fields

---

## 📊 What Gets Tracked

### File Replacement History

| Field | Old Value | New Value |
|-------|-----------|-----------|
| file_name | crime_scene.jpg | crime_scene_v2.jpg |
| file_path | evidence/2024/10/abc.enc | evidence/2024/10/xyz.enc |
| file_type | image/jpeg | image/jpeg |
| file_size | 245320 bytes (245.32 KB) | 312450 bytes (312.45 KB) |

### Custody Log Entry

```
Action: analyzed
Notes: File replaced: crime_scene.jpg → crime_scene_v2.jpg
Performed by: John Doe
Date: 2024-01-15 10:30:00
```

---

## 🔐 Security Considerations

### File Handling
- ✅ New file automatically encrypted with AES-256
- ✅ Old file securely deleted from filesystem
- ✅ File paths use unique random names
- ✅ Files stored outside public directory

### Access Control
- ✅ Only assigned investigators can replace files
- ✅ Admins/super_admins can replace any evidence files
- ✅ All actions require valid authentication token
- ✅ Permission checks before file operations

### Audit Trail
- ✅ Every file replacement recorded in history
- ✅ Old and new file names tracked
- ✅ Custody log automatically updated
- ✅ Editor and timestamp recorded
- ✅ Cannot delete or modify history

---

## 🧪 Testing

### Test Scenario 1: Replace File
1. Login as investigator
2. Edit evidence with existing file
3. Click "Replace File"
4. Select new file (< 50MB)
5. Click Upload
6. **Expected:** Success notification, file replaced

### Test Scenario 2: View History
1. After replacing file
2. Click "View History" in edit modal
3. **Expected:** See file_name change in history
4. **Expected:** See old filename → new filename

### Test Scenario 3: File Size Validation
1. Try to upload file > 50MB
2. **Expected:** Error message: "File size must be less than 50MB"

### Test Scenario 4: Permission Check
1. Login as investigator not assigned to case
2. Try to replace file
3. **Expected:** 403 Forbidden error

### Test Scenario 5: View Replaced File
1. Replace file
2. Click "View" or "Download" evidence
3. **Expected:** New file downloads, not old file

---

## 📝 Files Modified

### Backend
```
app/Controllers/Investigation/EvidenceController.php
├── Added replaceFile() method
└── Handles file upload, encryption, deletion

app/Models/EvidenceModel.php
├── Updated editableFields array
└── Now tracks file-related changes

app/Config/Routes.php
└── Added POST /evidence/{id}/replace-file route
```

### Frontend
```
public/assets/js/evidence-edit.js
├── Added showReplaceFileDialog() method
├── Added uploadReplacementFile() method
├── Updated renderEditModal() - shows current file
├── Updated formatFieldName() - file field names
└── Updated formatFieldValue() - file value formatting
```

---

## 💡 Usage Examples

### Example 1: Replace Photo Evidence
```
User: Detective Smith
Action: Replace crime scene photo
Old File: scene_photo_001.jpg (2.3 MB)
New File: scene_photo_001_enhanced.jpg (3.1 MB)
Reason: Better quality photo available

History Recorded:
- file_name: scene_photo_001.jpg → scene_photo_001_enhanced.jpg
- file_size: 2.3 MB → 3.1 MB
```

### Example 2: Replace Document
```
User: Forensics Officer
Action: Replace lab report
Old File: lab_report_draft.pdf (450 KB)
New File: lab_report_final.pdf (520 KB)
Reason: Final version with signatures

History Recorded:
- file_name: lab_report_draft.pdf → lab_report_final.pdf
- file_type: application/pdf → application/pdf
- file_size: 450 KB → 520 KB
```

---

## 🎯 Benefits

### 1. Flexibility
- Update evidence files as investigation progresses
- Replace with better quality files
- Correct mistakenly uploaded files

### 2. Accountability
- Every replacement is tracked
- See who replaced the file
- See when it was replaced
- See what was replaced

### 3. Data Integrity
- Old files securely deleted
- New files automatically encrypted
- No orphaned files
- Complete audit trail

### 4. User-Friendly
- Simple "Replace File" button
- Clear file information displayed
- Easy to track changes
- Visual feedback

---

## ⚠️ Important Notes

1. **File Replacement is Irreversible**
   - Old file is permanently deleted
   - Cannot undo file replacement
   - Make sure you have backups if needed

2. **Permission Required**
   - Must be assigned to the case
   - Or have admin privileges

3. **File Size Limit**
   - Maximum 50MB per file
   - Larger files will be rejected

4. **History is Permanent**
   - All file replacements are logged
   - History cannot be deleted
   - Shows complete audit trail

---

## 🔮 Future Enhancements (Optional)

- [ ] Download old file versions (versioning)
- [ ] Compare before/after preview
- [ ] Bulk file replacement
- [ ] File replacement approval workflow
- [ ] Email notifications on file replacement
- [ ] File replacement reasons (required field)
- [ ] Automatic thumbnail generation for images

---

## 📞 Support

For questions about file replacement:
1. Check this documentation
2. View edit history for examples
3. Contact system administrator

---

**Status:** ✅ Complete and Ready to Use  
**Version:** 1.4 (File Replacement)  
**Date:** December 31, 2024  
**Tested:** Ready for production use
