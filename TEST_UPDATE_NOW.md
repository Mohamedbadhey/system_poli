# Test Certificate Update - With Detailed Logs

## ✅ Backend Logging Enhanced

I've added detailed server-side logging to the UPDATE method. Now we can see exactly what's happening on the backend.

---

## 🧪 Test Steps

### Step 1: Clear Everything
```
1. Close browser
2. Reopen and go to certificate page
3. Press Ctrl + Shift + R (hard refresh)
4. Open Console (F12)
```

### Step 2: Load a Certificate for Editing
```
1. Click "My Certificates"
2. Click "Continue Editing" on any certificate
3. Watch console for:
   📂 [DEBUG] Set edit mode - ID: [number]
   ✅ [SUCCESS] Edit mode active - ID: [number]
```

### Step 3: Make Changes
```
1. Change person name (e.g., "John" to "Jane")
2. Change mother's name
3. Upload a photo if you haven't
```

### Step 4: Click Update and Watch Console
```
Click "Update" button

In Console, you should see:
🔍 [DEBUG] Save Certificate Called
🔍 [DEBUG] isEditMode: true
🔍 [DEBUG] currentCertificateId: [ID]
🔍 [DEBUG] Method: PUT
🔍 [DEBUG] Endpoint: http://localhost:8080/investigation/certificates/[ID]
🔍 [DEBUG] Response status: [200 or 500]
```

---

## 🔍 What We're Looking For

### If It Works (200):
```
🔍 [DEBUG] Response status: 200
🔍 [DEBUG] Response result: {status: "success", ...}
✅ [SUCCESS] Updated certificate
```

### If It Fails (500):
```
🔍 [DEBUG] Response status: 500
❌ [ERROR] Error saving certificate: Error: Failed to update certificate
```

---

## 📊 Server Logs (Backend)

The PHP server now logs everything. Check your PHP server console window for:

### Success Path:
```
INFO - Certificate UPDATE request for ID: 123
INFO - Found certificate: 123
INFO - Update data received: {"person_name":"Jane",...}
INFO - Updating with data: {"person_name":"Jane",...}
INFO - Certificate updated successfully
```

### Error Path:
```
ERROR - Certificate update exception: [error message]
ERROR - Stack trace: [detailed trace]
```

---

## 🐛 Common 500 Error Causes

### Error 1: Database Field Mismatch
**Symptom**: 500 error with database column error
**Check**: Does `non_criminal_certificates` table exist?
**Fix**: Run the migration SQL again

### Error 2: Invalid Data Type
**Symptom**: 500 error with type error
**Check**: Is photo_path too long? (base64 images can be huge)
**Fix**: We might need to save photos as files instead

### Error 3: Missing Required Field
**Symptom**: 500 error about NULL values
**Check**: Server logs show which field
**Fix**: Make sure issue_date and person_name are filled

---

## 🎯 Test Checklist

After clicking Update, check:

- [ ] Console shows `Method: PUT` (not POST)
- [ ] Console shows correct certificate ID in endpoint
- [ ] Console shows `Response status: 200` (not 500)
- [ ] See success message
- [ ] Click "My Certificates" again
- [ ] Changes are saved

---

## 📞 What to Share

After testing, copy and paste:

### 1. From Browser Console:
```
🔍 [DEBUG] isEditMode: ???
🔍 [DEBUG] currentCertificateId: ???
🔍 [DEBUG] Method: ???
🔍 [DEBUG] Response status: ???
```

### 2. From PHP Server Console:
```
(Copy any ERROR or INFO messages related to certificate update)
```

### 3. What Happened:
- [ ] Got 200 success
- [ ] Got 500 error
- [ ] Toast message said: "???"
- [ ] Changes saved: Yes / No

---

**Test now and let me know what the console and server logs show!**

If you get 500 error, the server logs will tell us exactly why!
