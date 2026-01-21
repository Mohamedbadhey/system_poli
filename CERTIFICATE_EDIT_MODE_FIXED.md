# Certificate Edit Mode - Fixed! ✅

## 🐛 Issues Fixed

### Issue 1: Duplicate Certificates on Edit ❌ → ✅
**Problem**: Every time you edited a certificate and clicked Save, it created a NEW certificate instead of updating the existing one.

**Root Cause**: The code always used POST method and never tracked which certificate was being edited.

**Solution**: 
- Added `currentCertificateId` to track the certificate being edited
- Added `isEditMode` flag to know if we're editing vs creating new
- Changed logic to use PUT method when editing existing certificate
- Updates the existing certificate in localStorage instead of creating duplicate

### Issue 2: Autosave Interference ❌ → ✅
**Problem**: Autosave was running every 10 seconds even in edit mode, causing confusion.

**Root Cause**: Autosave ran regardless of whether you were editing or creating new.

**Solution**: 
- Autosave now skips when `isEditMode = true`
- Only saves drafts for NEW certificates
- Existing certificates are only saved when you click "Save" button

### Issue 3: Photo Handling ❌ → ✅
**Problem**: Photo was stored as base64 in localStorage but needs proper handling.

**Solution**:
- Photo is stored in localStorage temporarily
- Sent to backend when saving
- Reloaded when editing existing certificate

---

## 🎯 How It Works Now

### Creating New Certificate:
```
1. Open page → isEditMode = false
2. Fill form
3. Autosave runs every 10 seconds (draft only)
4. Click "Save" → Creates NEW certificate (POST)
5. Gets certificate ID from server
6. Sets isEditMode = true, currentCertificateId = ID
7. Future saves will UPDATE this certificate
```

### Editing Existing Certificate:
```
1. Click "My Certificates"
2. Click "Continue Editing" on a certificate
3. isEditMode = true, currentCertificateId = [certificate ID]
4. Form loads with certificate data
5. Autosave is DISABLED (won't interfere)
6. Make changes
7. Click "Save" → UPDATES existing certificate (PUT)
8. No duplicate created!
```

### Starting New Certificate:
```
1. Click "New Certificate" button
2. isEditMode = false, currentCertificateId = null
3. Form clears
4. Ready for new certificate
```

---

## 📝 Key Changes Made

### 1. Added Tracking Variables
```javascript
let currentCertificateId = null; // Track which certificate we're editing
let isEditMode = false; // Are we editing or creating new?
```

### 2. Smart Save Logic
```javascript
// Determine if UPDATE or CREATE
const isUpdate = isEditMode && currentCertificateId;
const endpoint = isUpdate 
    ? `/investigation/certificates/${currentCertificateId}` // UPDATE
    : `/investigation/certificates`; // CREATE
const method = isUpdate ? 'PUT' : 'POST';
```

### 3. No Duplicate in localStorage
```javascript
if (isUpdate) {
    // Find and UPDATE existing certificate
    const index = savedCerts.findIndex(c => c.backend_id === certId);
    if (index !== -1) {
        savedCerts[index] = data; // Update, don't add
    }
} else {
    // Add NEW certificate
    savedCerts.push(data);
}
```

### 4. Autosave Disabled in Edit Mode
```javascript
function autoSaveCertificate() {
    // Only auto-save draft if NOT in edit mode
    if (!isEditMode) {
        // Save draft
    }
}
```

### 5. Edit Mode Setup
```javascript
function loadCertificateByIndex(index) {
    // Set edit mode
    isEditMode = true;
    currentCertificateId = cert.backend_id;
    
    // Load data
    loadCertificateData(cert);
    
    // Load photo
    if (cert.photo_path) {
        localStorage.setItem('nc_cert_photo', cert.photo_path);
    }
}
```

---

## ✅ Testing Steps

### Test 1: Create New Certificate
1. Open certificate page
2. Fill form with test data
3. Click "Save"
4. ✅ Certificate created
5. Note the reference number
6. Click "Save" again
7. ✅ Should UPDATE, not create duplicate!

### Test 2: Edit Existing Certificate
1. Click "My Certificates"
2. Click "Continue Editing" on any certificate
3. Check console: Should show `Edit mode: true`
4. Change person name
5. Click "Save"
6. ✅ Certificate updated
7. Click "My Certificates" again
8. ✅ Should show ONE certificate with new name (no duplicate!)

### Test 3: New After Edit
1. While editing, click "New Certificate"
2. Confirm dialog
3. ✅ Form clears
4. Fill new data
5. Click "Save"
6. ✅ Creates NEW certificate
7. Click "My Certificates"
8. ✅ Should show TWO certificates now

### Test 4: Autosave Behavior
1. Create new certificate
2. Start typing
3. Wait 10 seconds
4. ✅ See "Auto-saved" message
5. Click "Continue Editing" on existing certificate
6. Make changes
7. Wait 10 seconds
8. ✅ NO auto-save message (disabled in edit mode)

---

## 🎉 Expected Behavior Now

### Creating New:
- ✅ First save creates certificate
- ✅ Subsequent saves UPDATE the same certificate
- ✅ No duplicates created

### Editing Existing:
- ✅ Loads certificate data
- ✅ Updates when you save
- ✅ No duplicates created
- ✅ Autosave doesn't interfere

### My Certificates List:
- ✅ Shows each certificate once
- ✅ "Continue Editing" loads for editing
- ✅ Updates reflect immediately

---

## 📊 Console Messages to Look For

### When Creating New:
```
✅ Certificate created with verification URL: http://...
```

### When Editing:
```
✅ Edit mode: true Certificate ID: 123
✅ Certificate updated with verification URL: http://...
```

### When Saving Again:
```
✅ Certificate updated successfully!
```

---

## 🔍 How to Verify

### Check Database:
```sql
-- Should show ONE certificate, updated
SELECT * FROM non_criminal_certificates WHERE id = [your_certificate_id];
```

### Check localStorage:
```javascript
// In browser console
const certs = JSON.parse(localStorage.getItem('nc_certificates'));
console.log('Total certificates:', certs.length);
console.log('Certificates:', certs);
// Should NOT have duplicates!
```

---

## 💡 Quick Test Checklist

- [ ] Create new certificate - works
- [ ] Save again - updates instead of duplicate
- [ ] My Certificates shows it once
- [ ] Edit existing certificate
- [ ] Save changes - updates not duplicate
- [ ] My Certificates still shows it once
- [ ] Start new certificate - creates separate one
- [ ] My Certificates shows both (2 total)
- [ ] No autosave messages when editing
- [ ] Photo is saved and displayed

---

**Status**: ✅ All Edit Mode Issues Fixed!
**Date**: January 15, 2026
**Ready to Test**: YES!
