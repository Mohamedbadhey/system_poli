# Debug Guide - Certificate Updates & Photo Upload

## 🔍 Comprehensive Debugging Added

I've added detailed console logs with emojis to track everything:

### Debug Log Types:
- 🔍 `[DEBUG]` - General debugging info
- 📸 `[DEBUG]` - Photo upload related
- 📂 `[DEBUG]` - Certificate loading
- ✅ `[SUCCESS]` - Successful operations
- ❌ `[ERROR]` - Errors

---

## 🧪 Testing Steps with Console Open

### Step 1: Open Console
```
Press F12 → Click "Console" tab
```

### Step 2: Test Photo Upload

1. Click photo upload area
2. Select an image
3. **Check Console:**
```
📸 [DEBUG] Photo upload triggered
📸 [DEBUG] File selected: image.jpg Size: 54321
📸 [DEBUG] Photo loaded, data length: 123456
📸 [SUCCESS] Photo saved to localStorage
```
4. **Look for**: "Photo uploaded successfully!" toast

---

### Step 3: Test Save (New Certificate)

1. Fill form with data
2. Click "Save" button
3. **Check Console:**
```
🔍 [DEBUG] Save Certificate Called
🔍 [DEBUG] isEditMode: false
🔍 [DEBUG] currentCertificateId: null
🔍 [DEBUG] Collected data: {person_name: "...", ...}
🔍 [DEBUG] isUpdate: false
🔍 [DEBUG] Method: POST
🔍 [DEBUG] Endpoint: http://localhost:8080/investigation/certificates
🔍 [DEBUG] Form values:
  - motherName: "..."
  - gender: "MALE"
  - birthDateNew: "2026-01-15"
  - birthPlaceNew: "..."
🔍 [DEBUG] Photo data exists: true
🔍 [DEBUG] Photo data length: 123456
🔍 [DEBUG] Certificate data being sent: {...}
🔍 [DEBUG] Response status: 201
🔍 [DEBUG] Response result: {...}
✅ [SUCCESS] Created certificate
✅ [SUCCESS] Certificate ID: 123
✅ [SUCCESS] Verification URL: http://...
```

---

### Step 4: Test Update (Edit Existing)

1. Click "My Certificates"
2. Click "Continue Editing" on a certificate
3. **Check Console:**
```
📂 [DEBUG] Loading certificate at index: 0
📂 [DEBUG] Total certificates: 1
📂 [DEBUG] Certificate data: {...}
📂 [DEBUG] Set edit mode - ID: 123
📂 [DEBUG] Loading photo from certificate
📂 [SUCCESS] Photo displayed in preview
✅ [SUCCESS] Edit mode active - ID: 123
```

4. Change some fields (name, date, etc.)
5. Click "Update" button
6. **Check Console:**
```
🔍 [DEBUG] Save Certificate Called
🔍 [DEBUG] isEditMode: true
🔍 [DEBUG] currentCertificateId: 123
🔍 [DEBUG] isUpdate: true
🔍 [DEBUG] Method: PUT
🔍 [DEBUG] Endpoint: http://localhost:8080/investigation/certificates/123
🔍 [DEBUG] Form values:
  - motherName: "NEW VALUE"  ← Should show your changes
  - gender: "FEMALE"  ← If you changed it
🔍 [DEBUG] Certificate data being sent: {...}  ← Check this has new values
🔍 [DEBUG] Response status: 200
✅ [SUCCESS] Updated certificate
✅ [SUCCESS] Certificate ID: 123
```

---

## 🐛 What to Look For

### Issue 1: Update Not Working

**Look in Console for:**
```
🔍 [DEBUG] isEditMode: false  ← Should be TRUE when editing!
🔍 [DEBUG] currentCertificateId: null  ← Should have an ID!
```

**If you see false/null**: Edit mode didn't set correctly
- Refresh page and try "Continue Editing" again

### Issue 2: Changed Values Not Saving

**Look in Console for:**
```
🔍 [DEBUG] Form values:
  - motherName: "OLD VALUE"  ← Should show NEW value!
```

**If shows old value**: Form not updating
- Check that you're typing in the correct fields
- Verify field IDs match

### Issue 3: Photo Not Saving

**Look in Console for:**
```
🔍 [DEBUG] Photo data exists: false  ← Should be TRUE if photo uploaded!
🔍 [DEBUG] Photo data length: 0  ← Should be > 0!
```

**If false/0**: Photo not in localStorage
- Try uploading photo again
- Check for photo upload errors

---

## 📊 Console Output Examples

### ✅ GOOD - Everything Working:
```
📸 [SUCCESS] Photo saved to localStorage
🔍 [DEBUG] isEditMode: true
🔍 [DEBUG] currentCertificateId: 123
🔍 [DEBUG] Photo data exists: true
🔍 [DEBUG] Photo data length: 45678
✅ [SUCCESS] Updated certificate
✅ [SUCCESS] Certificate ID: 123
```

### ❌ BAD - Edit Mode Not Set:
```
🔍 [DEBUG] isEditMode: false  ← PROBLEM!
🔍 [DEBUG] currentCertificateId: null  ← PROBLEM!
🔍 [DEBUG] Method: POST  ← Should be PUT!
```

### ❌ BAD - Photo Missing:
```
🔍 [DEBUG] Photo data exists: false  ← PROBLEM!
🔍 [DEBUG] Photo data length: 0  ← PROBLEM!
```

---

## 🎯 Quick Checklist

After refresh, test each:

- [ ] Upload photo → See 📸 SUCCESS message
- [ ] Save new certificate → See POST method
- [ ] Load existing certificate → See edit mode TRUE
- [ ] Button says "Update" (not Save)
- [ ] Change form values
- [ ] Click Update
- [ ] Console shows PUT method
- [ ] Console shows changed values in "Form values"
- [ ] Console shows SUCCESS Updated
- [ ] Check "My Certificates" → Changes saved

---

## 🔧 Testing Checklist with Expected Console Output

### Test A: Photo Upload
```
1. Click photo area
   Expected: 📸 [DEBUG] Photo upload triggered
2. Select image
   Expected: 📸 [DEBUG] File selected: ...
   Expected: 📸 [SUCCESS] Photo saved to localStorage
   Expected: Toast: "Photo uploaded successfully!"
```

### Test B: Edit Mode
```
1. Click "Continue Editing"
   Expected: 📂 [DEBUG] Loading certificate at index: 0
   Expected: 📂 [DEBUG] Set edit mode - ID: [number]
   Expected: ✅ [SUCCESS] Edit mode active - ID: [number]
   Expected: Button text changes to "Update"
```

### Test C: Update Certificate
```
1. Change name from "John" to "Jane"
2. Click "Update"
   Expected: 🔍 [DEBUG] isEditMode: true
   Expected: 🔍 [DEBUG] Method: PUT
   Expected: 🔍 [DEBUG] Form values: ... motherName: "Jane"
   Expected: ✅ [SUCCESS] Updated certificate
```

---

## 📞 What to Tell Me

After testing, copy and paste from console:

1. **Edit Mode Status:**
```
🔍 [DEBUG] isEditMode: [value]
🔍 [DEBUG] currentCertificateId: [value]
```

2. **Form Values Being Sent:**
```
🔍 [DEBUG] Form values:
  - motherName: [value]
  - gender: [value]
```

3. **Photo Status:**
```
🔍 [DEBUG] Photo data exists: [value]
🔍 [DEBUG] Photo data length: [value]
```

4. **Any Errors:**
```
❌ [ERROR] ... (if any)
```

This will help me see exactly what's happening!

---

**Ready to Test!**
1. Refresh page (Ctrl + Shift + R)
2. Open Console (F12)
3. Follow steps above
4. Share console output!
