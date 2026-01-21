# 🔧 How to Fix Certificate Mother Name & Photo Issues

## Quick Diagnosis

If you're experiencing issues where mother's name or photo aren't showing up in saved certificates, follow these steps:

---

## ✅ Good News: The System is Working!

Based on investigation of your database, **both mother name and photo ARE being saved correctly**. The most recent certificate shows:
- ✅ Mother Name: "ruqiyo hassan arax" 
- ✅ Photo: 3.4MB Base64 image (complete)

---

## Common Issues & Solutions

### Issue 1: Browser Cache 🌐

**Symptoms:**
- Old version of JavaScript is running
- Changes don't appear after refresh

**Solution:**
```
1. Clear browser cache: Ctrl + Shift + Delete
2. Select "Cached images and files"
3. Click "Clear data"
4. Hard refresh the page: Ctrl + F5
```

### Issue 2: Form Fields Not Being Filled 📝

**Symptoms:**
- Mother name field is empty when saving
- Photo box is empty

**Solution:**
1. **Mother Name Field**: 
   - Located directly below the person name field
   - Label: "Magaca hooyada/ mothers name:"
   - Fill it before clicking Save

2. **Photo Field**:
   - Click on the photo preview box (150x180px)
   - Select an image file from your computer
   - Wait for preview to appear before saving

### Issue 3: Viewing Old Certificates 📅

**Symptoms:**
- Some certificates have data, others don't
- Photo appears truncated (only 255 characters)

**Solution:**
- Certificate #2 in your database has truncated photo (saved before database fix)
- All NEW certificates (like #1 and #3) have complete data
- Old certificates cannot be automatically fixed - create new ones

### Issue 4: Photo Too Large 📷

**Symptoms:**
- Save fails silently
- Error in console

**Solution:**
- Maximum recommended photo size: 5MB
- Resize photo before uploading if larger
- Use image compression tool if needed

---

## Step-by-Step Testing Guide

### Test Creating a New Certificate:

1. **Open the Certificate Page**
   ```
   http://localhost:8080/assets/pages/non-criminal-certificate.html
   ```

2. **Fill Required Fields:**
   - Person Name: Enter full name
   - **Mother Name: Enter mother's full name** ⬅️ Don't skip!
   - Gender: Select MALE or FEMALE
   - Issue Date: Select date

3. **Upload Photo:**
   - Click on the photo preview box
   - Select an image file (JPG, PNG)
   - **Wait for preview to appear** ⬅️ Important!

4. **Click Save Button**
   - Look for success message
   - QR code should generate

5. **Verify in Console (F12):**
   ```javascript
   // Should see logs like:
   🔍 [DEBUG] Form values:
     - motherName: [the value you entered]
     - photo data exists: true
   ✅ [SUCCESS] Certificate saved
   ```

6. **Check Database:**
   ```sql
   SELECT 
       person_name, 
       mother_name, 
       LENGTH(photo_path) as photo_size,
       CASE 
           WHEN photo_path IS NULL THEN '❌ No photo'
           WHEN LENGTH(photo_path) < 1000 THEN '⚠️ Truncated'
           ELSE '✅ Complete'
       END as photo_status
   FROM non_criminal_certificates 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

---

## Technical Details

### Database Status ✅

```sql
-- Photo column (already fixed):
photo_path: LONGTEXT (can store 4GB)

-- Mother name column (working):
mother_name: VARCHAR(255) (sufficient)
```

### JavaScript Data Flow ✅

```javascript
// 1. Photo uploaded via file input
handlePhotoUpload(event) → localStorage.setItem('nc_cert_photo', photoData)

// 2. Mother name captured from form
document.getElementById('motherName').value

// 3. Data sent to backend
saveCertificate() → {
    mother_name: motherName?.value || null,
    photo_path: photoData || null
}
```

### Backend Processing ✅

```php
// CertificateController.php
$certificateData = [
    'mother_name' => $data['mother_name'] ?? null,  // ✅
    'photo_path' => $data['photo_path'] ?? null,    // ✅
];
$this->model->insert($certificateData);
```

---

## If Issues Persist

### Check Console Logs:

1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. Look for debug messages starting with:
   - 🔍 [DEBUG]
   - ❌ [ERROR]
   - ✅ [SUCCESS]

### Common Error Messages:

**Error: "Please enter person name"**
- Solution: Fill the person name field

**Error: "Please enter issue date"**
- Solution: Fill the issue date field

**Error: "Failed to save certificate"**
- Check console for detailed error
- Verify you're logged in (auth token exists)
- Check network tab for API response

### Network Issues:

1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Click "Save" button
4. Look for POST request to `/investigation/certificates`
5. Check:
   - Status code (should be 200 or 201)
   - Response body (should show success)
   - Request payload (should include mother_name and photo_path)

---

## Contact Support

If you've tried all the above and still have issues, provide:

1. **Screenshot** of the filled form
2. **Console logs** (F12 → Console tab)
3. **Network request** details (F12 → Network tab)
4. **Certificate ID** that's having issues
5. **Browser** and version you're using

---

**Last Updated:** January 15, 2026  
**Status:** System Working Correctly ✅  
**Database:** Fixed (photo_path = LONGTEXT)  
**Code:** All components properly configured  
