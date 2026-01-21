# ✅ Certificate Placeholder Fix

## Issues Fixed

### Issue 1: Old Name Showing in Field
**Problem**: When opening the certificate page, old name was appearing in the input field (from previous session/draft)

**Root Cause**: 
- `nc_cert_auto_load` flag was set to 'true' whenever ANY change was made
- Page would auto-load draft even for new certificates
- Browser autocomplete was also filling in old values

**Solution**:
1. **Smart Auto-Load**: Only auto-load drafts if they have a `backend_id` (meaning they're saved certificates being edited)
2. **Disable Autocomplete**: Added `autocomplete="off"` to prevent browser from filling old values
3. **Better Placeholder Text**: Changed from "Full Name" to "Enter Full Name" for clarity

### Issue 2: Placeholder Text Improvement
**Before**: 
- Person Name: placeholder="Full Name"
- Mother Name: placeholder="Mother's Full Name"

**After**:
- Person Name: placeholder="Enter Full Name" + autocomplete="off"
- Mother Name: placeholder="Enter Mother's Full Name" + autocomplete="off"

---

## Changes Made

### File: `public/assets/pages/non-criminal-certificate.html`

```html
<!-- Before -->
<input type="text" id="personName" placeholder="Full Name" ...>
<input type="text" id="motherName" placeholder="Mother's Full Name" ...>

<!-- After -->
<input type="text" id="personName" placeholder="Enter Full Name" autocomplete="off" ...>
<input type="text" id="motherName" placeholder="Enter Mother's Full Name" autocomplete="off" ...>
```

### File: `public/assets/js/non-criminal-certificate.js`

```javascript
// Before: Auto-loaded any draft
if (autoLoad === 'true') {
    loadDraftIfExists();
}

// After: Only auto-load if it's a saved certificate
if (autoLoad === 'true' && draft) {
    const draftData = JSON.parse(draft);
    // Only auto-load if it's an existing certificate (has backend_id)
    if (draftData.backend_id) {
        loadDraftIfExists();
    } else {
        // New certificate - clear the auto-load flag
        localStorage.setItem('nc_cert_auto_load', 'false');
    }
}
```

---

## How It Works Now

### Scenario 1: Opening Page Fresh (New Certificate)
1. Page loads
2. Checks for auto-load flag
3. Sees NO backend_id in draft → Starts fresh
4. Fields show placeholder text: "Enter Full Name", "Enter Mother's Full Name"
5. No old data appears ✅

### Scenario 2: Continuing Existing Certificate
1. User clicks "Continue Editing" on saved certificate
2. `loadCertificateByIndex()` is called
3. Fetches data from backend
4. Loads all fields including mother name and photo
5. Fields show actual data (not placeholders) ✅

### Scenario 3: After Saving New Certificate
1. User fills form and clicks Save
2. Certificate is saved with backend_id
3. `nc_cert_auto_load` is set to 'true'
4. If user refreshes page, it will auto-load this saved certificate ✅

---

## Testing

### Test 1: Fresh Start
1. **Clear localStorage** (if needed):
   - Press F12 → Console
   - Run: `localStorage.clear()`
   - Refresh page

2. **Expected Result**:
   - ✅ Person Name field shows: "Enter Full Name" (placeholder)
   - ✅ Mother Name field shows: "Enter Mother's Full Name" (placeholder)
   - ✅ No old data appears
   - ✅ Fields are empty and ready for input

### Test 2: Browser Autocomplete Disabled
1. Type a name in Person Name field
2. Save the certificate
3. Start a new certificate (click "New Certificate" or clear draft)
4. Click in Person Name field

5. **Expected Result**:
   - ✅ Browser does NOT suggest previous names
   - ✅ Field stays empty with placeholder

### Test 3: Continue Editing Works
1. Click "My Certificates"
2. Click "Continue Editing" on any certificate
3. **Expected Result**:
   - ✅ Person Name shows actual name (not placeholder)
   - ✅ Mother Name shows actual name (not placeholder)
   - ✅ Photo appears
   - ✅ All fields populated correctly

---

## Technical Details

### Auto-Load Logic Flow

```
Page Loads
    ↓
Check nc_cert_auto_load === 'true'?
    ↓ YES
Check draft exists in localStorage?
    ↓ YES
Parse draft JSON
    ↓
Check draft.backend_id exists?
    ↓ YES → Load the draft (existing certificate)
    ↓ NO  → Clear auto-load flag (new certificate)
```

### Autocomplete Attribute

```html
autocomplete="off"
```
- Prevents browser from suggesting previous entries
- Prevents browser from auto-filling the field
- Works across all modern browsers

---

## Files Modified

1. **public/assets/pages/non-criminal-certificate.html**
   - Added `autocomplete="off"` to personName field
   - Added `autocomplete="off"` to motherName field
   - Changed placeholders to "Enter..." format

2. **public/assets/js/non-criminal-certificate.js**
   - Enhanced auto-load logic to check for backend_id
   - Only auto-loads saved certificates, not drafts

---

## Summary

### Before:
- ❌ Old name appeared in field when opening page
- ❌ Browser autocomplete suggested old entries
- ❌ Unclear placeholder text

### After:
- ✅ Fresh start shows empty fields with clear placeholders
- ✅ Browser autocomplete disabled
- ✅ Only auto-loads when editing saved certificates
- ✅ Clear placeholder text: "Enter Full Name"

---

**Status**: ✅ Complete  
**Date**: January 15, 2026  
**Impact**: Improved user experience - no more confusion with old data
