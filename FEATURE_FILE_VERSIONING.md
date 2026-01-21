# Feature: File Versioning & History with Download

## Overview

Complete file versioning system that **preserves old files** when replaced and allows **downloading any version** from the edit history.

---

## 🎉 **What's New**

### **1. File Versioning**
- Old files are **preserved**, not deleted
- Each version is **numbered** (v1, v2, v3, etc.)
- Stored in secure **versions directory**
- Complete **metadata** tracked in database

### **2. Enhanced Edit History**
- **File changes highlighted** with red badge
- Shows **old and new filenames**
- **Download buttons** for both versions
- Visual distinction from other edits

### **3. Download Old Versions**
- Download any previous version
- Download current version
- Files named with version number
- All downloads logged in custody log

---

## 🗂️ **Database Structure**

### **New Table: evidence_file_versions**
```sql
CREATE TABLE evidence_file_versions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    evidence_id INT UNSIGNED NOT NULL,
    version_number INT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INT UNSIGNED,
    replaced_by INT UNSIGNED NOT NULL,
    replaced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

### **Updated: evidence_edit_history**
```sql
ALTER TABLE evidence_edit_history 
ADD COLUMN old_file_path VARCHAR(500) NULL,
ADD COLUMN new_file_path VARCHAR(500) NULL;
```

---

## 📁 **File Storage Structure**

```
writable/uploads/evidence/
├── 2024/
│   ├── 10/
│   │   ├── abc123.jpg.enc       (current file)
│   │   └── def456.jpg.enc
│   └── 11/
│       └── ghi789.pdf.enc
└── versions/
    ├── 1/                        (evidence ID)
    │   ├── v1_old_file.jpg.enc  (version 1)
    │   ├── v2_old_file2.jpg.enc (version 2)
    │   └── v3_old_file3.jpg.enc (version 3)
    └── 2/
        └── v1_document.pdf.enc
```

---

## 🎨 **Visual Example**

### **Edit History with File Changes**

```
┌────────────────────────────────────────────────────────────┐
│  🕐 Evidence Edit History                             [×]  │
├────────────────────────────────────────────────────────────┤
│ Date & Time    | Edited By  | Field      | Old → New      │
├────────────────────────────────────────────────────────────┤
│ Jan 15 10:30AM | John Doe   | 🔄 File    | 📄 old.jpg     │
│                |            | (RED)      | [Download Old] │
│                |            |            | 📄 new.jpg     │
│                |            |            | [Download New] │
├────────────────────────────────────────────────────────────┤
│ Jan 15 10:25AM | John Doe   | Title      | Old → New      │
├────────────────────────────────────────────────────────────┤
│ Jan 14 03:15PM | Jane Smith | 🔄 File    | 📄 draft.pdf   │
│                |            | (RED)      | [Download Old] │
│                |            |            | 📄 final.pdf   │
│                |            |            | [Download New] │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 **How It Works**

### **When You Replace a File:**

1. **Version Number Generated**
   - System checks existing versions
   - Assigns next number (v1, v2, v3, etc.)

2. **Old File Preserved**
   - Copied to `versions/{evidence_id}/` folder
   - Renamed with version prefix: `v1_filename.ext.enc`
   - Original encrypted state maintained

3. **Version Metadata Saved**
   - File name, path, type, size
   - Who replaced it and when
   - Notes about replacement

4. **New File Uploaded**
   - Encrypted and stored
   - Becomes the current version
   - Old file removed from main location

5. **History Tracked**
   - Change recorded in edit history
   - Both old and new file paths stored
   - Version ID linked for downloads

---

## 📥 **Download Process**

### **Download Old Version**
```javascript
// User clicks "Download Old" in history
1. Fetch version_id from history entry
2. Call: GET /evidence/{id}/download-version/{versionId}
3. Backend decrypts version file
4. File served with version prefix
5. Download logged in custody log
```

### **Download Current Version**
```javascript
// User clicks "Download New" in history
1. Call: GET /evidence/{id}/download
2. Backend decrypts current file
3. File served with original name
4. Download logged in custody log
```

---

## 🔐 **Security Features**

### **File Security**
- ✅ All versions remain encrypted
- ✅ Stored outside public directory
- ✅ Requires authentication to download
- ✅ Permission checks enforced

### **Access Control**
- ✅ Only assigned investigators can download
- ✅ Admins can download any version
- ✅ All downloads logged
- ✅ Custody chain maintained

### **Data Integrity**
- ✅ Old files never lost
- ✅ Complete version history
- ✅ Audit trail for all downloads
- ✅ Cannot delete old versions

---

## 💡 **Use Cases**

### **Case 1: Quality Improvement**
```
Initial: low_res_photo.jpg (500 KB)
  ↓
Replace: high_res_photo.jpg (2.5 MB)
  ↓
Later: Need original for comparison
  ↓
Download: v1_low_res_photo.jpg ✅
```

### **Case 2: Document Updates**
```
Initial: report_draft.pdf
  ↓
Replace: report_v2.pdf
  ↓
Replace: report_final.pdf
  ↓
History: Can download all 3 versions
  - v1_report_draft.pdf
  - v2_report_v2.pdf
  - report_final.pdf (current)
```

### **Case 3: Evidence Correction**
```
Mistake: wrong_file.jpg uploaded
  ↓
Replace: correct_file.jpg
  ↓
Supervisor Review: Wants to see what was originally uploaded
  ↓
Download: v1_wrong_file.jpg ✅
```

---

## 🧪 **Testing Checklist**

### **Setup**
- [ ] Run migration: `evidence_file_versions_migration.sql`
- [ ] Verify table created
- [ ] Check edit_history table updated

### **File Replacement**
- [ ] Replace a file
- [ ] Check old file in versions folder
- [ ] Verify version entry in database
- [ ] Confirm new file is current

### **History View**
- [ ] Open edit history
- [ ] See file change with red badge
- [ ] See both old and new filenames
- [ ] See download buttons

### **Download Old Version**
- [ ] Click "Download Old"
- [ ] File downloads with version prefix
- [ ] File decrypts correctly
- [ ] Download logged

### **Download Current Version**
- [ ] Click "Download New"
- [ ] Current file downloads
- [ ] File is correct version
- [ ] Download logged

### **Multiple Versions**
- [ ] Replace file 3 times
- [ ] Check 3 versions stored
- [ ] Download each version
- [ ] All versions accessible

---

## 🎯 **Benefits**

### **1. Complete History**
- Never lose old files
- Full audit trail
- Compare versions

### **2. Error Recovery**
- Retrieve accidentally replaced files
- Review original uploads
- Restore if needed

### **3. Evidence Integrity**
- Maintain chain of custody
- Track all file changes
- Legal compliance

### **4. Investigation Support**
- Compare different versions
- Track evidence evolution
- Support case reviews

---

## 📊 **Technical Details**

### **Version Numbering**
```php
// Get next version number
$lastVersion = DB::table('evidence_file_versions')
    ->where('evidence_id', $id)
    ->orderBy('version_number', 'DESC')
    ->first();

$versionNumber = $lastVersion ? $lastVersion['version_number'] + 1 : 1;
```

### **File Preservation**
```php
// Copy old file to versions
$versionsPath = WRITEPATH . "uploads/evidence/versions/{$id}/";
$versionFileName = "v{$versionNumber}_" . basename($oldFilePath);
copy($oldFileFullPath, $versionsPath . $versionFileName);

// Store metadata
DB::table('evidence_file_versions')->insert([
    'evidence_id' => $id,
    'version_number' => $versionNumber,
    'file_name' => $oldFileName,
    'file_path' => "evidence/versions/{$id}/{$versionFileName}",
    // ... other fields
]);
```

### **Download Handler**
```php
public function downloadVersion($id, $versionId)
{
    // Get version info
    $version = DB::table('evidence_file_versions')
        ->where('id', $versionId)
        ->where('evidence_id', $id)
        ->first();
    
    // Decrypt and serve
    $decrypted = decryptFile($version['file_path']);
    
    // Log access
    logCustodyAction($id, 'accessed', "Downloaded v{$version['version_number']}");
    
    // Serve file
    return response()->download($decrypted, "v{$version['version_number']}_{$version['file_name']}");
}
```

---

## 📝 **Files Modified**

### **Backend**
```
app/Controllers/Investigation/EvidenceController.php
├── replaceFile() - File versioning logic
└── downloadVersion() - Download old versions

app/Models/EvidenceModel.php
├── editEvidenceWithFilePaths() - Track file paths
└── getEditHistory() - Include version IDs

app/Config/Routes.php
└── Added download-version route
```

### **Frontend**
```
public/assets/js/evidence-edit.js
├── renderEditHistoryModal() - Show file changes
├── downloadOldVersion() - Download old file
└── downloadCurrentVersion() - Download current file
```

### **Database**
```
app/Database/evidence_file_versions_migration.sql
└── New versioning schema
```

---

## ⚙️ **Setup Instructions**

### **1. Apply Database Migration**
```bash
# Windows
mysql -u root police_case_management < app/Database/evidence_file_versions_migration.sql

# Or via phpMyAdmin
# Import evidence_file_versions_migration.sql
```

### **2. Verify Setup**
```sql
-- Check tables exist
SHOW TABLES LIKE 'evidence_file_versions';

-- Check columns added
DESCRIBE evidence_edit_history;
```

### **3. Test**
1. Clear browser cache (Ctrl+F5)
2. Edit evidence and replace file
3. View edit history
4. Try downloading both versions

---

## 🔮 **Future Enhancements**

- [ ] Visual file preview in history (thumbnails)
- [ ] Compare two versions side-by-side
- [ ] Restore old version as current
- [ ] Bulk download all versions
- [ ] Version comments/notes
- [ ] File diff for documents

---

**Status:** ✅ Complete  
**Version:** 1.6 (File Versioning)  
**Date:** December 31, 2024  
**Critical Feature:** Evidence integrity and audit trail
