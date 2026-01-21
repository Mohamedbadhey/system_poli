# Testing Guide: Non-Criminal Certificate QR Code Feature

## 📋 Pre-Testing Checklist

Before testing, ensure:
- ✅ Database migration has been applied
- ✅ PHP server is running
- ✅ You have valid authentication token
- ✅ Browser console is open for debugging

## 🗄️ Step 1: Apply Database Migration

### Option A: Using Batch Script (Windows)
```bash
# Double-click or run from command prompt
APPLY_CERTIFICATE_QR_MIGRATION.bat
```

### Option B: Manual MySQL Command
```bash
# If you have MySQL in PATH
mysql -u root pcms_db < app/Database/non_criminal_certificates_migration.sql

# Or connect to MySQL first
mysql -u root -p
use pcms_db;
source app/Database/non_criminal_certificates_migration.sql;
```

### Option C: Using phpMyAdmin
1. Open phpMyAdmin
2. Select `pcms_db` database
3. Go to "SQL" tab
4. Copy and paste content from `app/Database/non_criminal_certificates_migration.sql`
5. Click "Go"

### Verify Migration Success
```sql
-- Run this query to check table exists
SHOW TABLES LIKE 'non_criminal_certificates';

-- Check table structure
DESCRIBE non_criminal_certificates;

-- Should show 19 columns including:
-- id, certificate_number, verification_token, etc.
```

## 🧪 Step 2: Test Certificate Creation

### 2.1 Open Non-Criminal Certificate Page
1. Login to PCMS
2. Navigate to: `public/assets/pages/non-criminal-certificate.html`
   - Or use the menu if it's been added to navigation

### 2.2 Fill Certificate Form
Fill in the following fields:
- **Person Name**: Test Person Name
- **Mother Name**: Test Mother Name
- **Gender**: Select MALE or FEMALE
- **Birth Date**: Select any date
- **Birth Place**: Kismaio, Somalia
- **Purpose**: Visa Application
- **Director Name**: (should be pre-filled)
- **Issue Date**: Today's date

### 2.3 Add Photo (Optional)
1. Click on photo upload area
2. Select an image file
3. Verify preview appears

### 2.4 Add Director Signature
1. Sign in the signature canvas
2. Verify signature appears

### 2.5 Save Certificate
1. Click "Save" button
2. **Expected Results**:
   - Toast notification: "Saving certificate..."
   - Then: "Certificate saved successfully!"
   - QR code appears in bottom right
   - Console shows: "Certificate saved with verification URL: ..."

### 2.6 Check Console Output
Open browser console (F12) and verify:
```javascript
// Should see:
Certificate saved with verification URL: http://localhost:8080/verify-certificate/abc123...
QR Code generated with data: http://localhost:8080/verify-certificate/abc123...
```

## 📱 Step 3: Test QR Code Scanning

### 3.1 Using Smartphone
1. Open QR scanner app on your phone
2. Scan the QR code on the certificate
3. **Expected**: Browser opens verification page
4. **Verify**: Certificate details display correctly

### 3.2 Using QR Reader Website (Alternative)
1. Take screenshot of QR code
2. Go to: https://webqr.com or https://qrcodescanner.org
3. Upload screenshot
4. Copy the URL from result
5. Open URL in browser
6. **Verify**: Verification page loads

### 3.3 Manual URL Test
1. Copy verification URL from console
2. Open in new browser tab (or incognito window)
3. **Expected**: Verification page loads without login
4. **Verify**: All certificate details display

## ✅ Step 4: Verify Backend Data

### 4.1 Check Database Record
```sql
-- View created certificate
SELECT * FROM non_criminal_certificates ORDER BY id DESC LIMIT 1;

-- Verify fields:
-- certificate_number: Should match form
-- person_name: Should match form
-- verification_token: Should be 64 characters
-- is_active: Should be 1
-- verification_count: Should be 0 initially
-- created_at: Recent timestamp
```

### 4.2 Test API Endpoint (Using Postman or curl)
```bash
# Get all certificates (requires auth)
curl -X GET "http://localhost:8080/investigation/certificates" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected Response:
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "certificate_number": "JPFHQ/CID/NC:...",
      "verification_token": "abc123...",
      ...
    }
  ]
}
```

## 🔍 Step 5: Test Verification Page Features

### 5.1 Valid Certificate Test
1. Scan QR code or open verification URL
2. **Verify displays**:
   - ✅ Green badge: "VALID CERTIFICATE"
   - Certificate number
   - Person name
   - All form details
   - Issue date
   - Photo (if uploaded)
   - Verification count
   - Current timestamp

### 5.2 Print Test
1. On verification page, click "Print Certificate"
2. **Expected**: Print dialog opens
3. **Verify**: Page prints cleanly

### 5.3 Mobile Responsive Test
1. Open verification page on mobile
2. **Verify**:
   - Page is responsive
   - Text is readable
   - No horizontal scrolling
   - Buttons are touchable

## 🔒 Step 6: Test Security Features

### 6.1 Invalid Token Test
1. Modify verification URL token (change a character)
2. Open modified URL
3. **Expected**:
   - ❌ Red error icon
   - "Certificate Not Found"
   - Error message

### 6.2 Verification Count Test
1. Scan same QR code multiple times
2. **Expected**: verification_count increments
3. **Verify in database**:
```sql
SELECT verification_count, last_verified_at 
FROM non_criminal_certificates 
WHERE id = 1;
```

### 6.3 Certificate Revocation Test
1. In database, revoke certificate:
```sql
UPDATE non_criminal_certificates 
SET is_active = 0 
WHERE id = 1;
```
2. Scan QR code again
3. **Expected**:
   - ⚠️ Orange badge: "REVOKED CERTIFICATE"
   - Warning message
   - "No longer valid"
   - Contact button

## 📊 Step 7: Test Multiple Certificates

### 7.1 Create Second Certificate
1. Click "New Certificate" button
2. Fill different person details
3. Save
4. **Verify**: New QR code generated

### 7.2 Test "My Certificates" Feature
1. Click "My Certificates" button
2. **Verify**:
   - Both certificates listed
   - Can load each one
   - Can delete certificates

### 7.3 Verify Unique Tokens
```sql
-- Check all certificates have unique tokens
SELECT id, certificate_number, verification_token 
FROM non_criminal_certificates;

-- Tokens should all be different
```

## 🐛 Troubleshooting Common Issues

### Issue 1: QR Code Not Appearing
**Symptoms**: Certificate saves but no QR code displays

**Solutions**:
1. Check console for JavaScript errors
2. Verify `qrcodejs` library loaded:
```javascript
console.log(typeof QRCode); // Should output "function"
```
3. Check if verification URL received:
```javascript
// In console after saving
localStorage.getItem('nc_cert_draft') // Check if verification_url exists
```

### Issue 2: Verification Page Shows Error
**Symptoms**: "Certificate Not Found" on valid QR code

**Solutions**:
1. Check route is defined in `app/Config/Routes.php`:
```php
$routes->get('verify-certificate/(:any)', 'Investigation\CertificateController::verify/$1');
```
2. Verify controller file exists:
   - `app/Controllers/Investigation/CertificateController.php`
3. Check database table exists
4. Verify token in database matches URL

### Issue 3: Certificate Not Saving to Database
**Symptoms**: "Certificate saved locally only" warning

**Solutions**:
1. Check authentication token is valid
2. Verify API endpoint accessible:
```javascript
// Test in console
fetch('/investigation/certificates', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
}).then(r => r.json()).then(console.log);
```
3. Check server logs for errors
4. Verify database connection

### Issue 4: QR Code Scans but Wrong URL
**Symptoms**: QR code scans to localhost instead of live URL

**Solution**: Update `base_url()` in CodeIgniter config:
```php
// app/Config/App.php
public string $baseURL = 'https://your-domain.com/';
```

## 📸 Expected Screenshots

### Certificate with QR Code
- Certificate form filled
- QR code visible in bottom right
- Signature present
- Photo displayed

### Verification Page (Valid)
- Green "VALID CERTIFICATE" badge
- All details displayed
- Verification statistics shown
- Print button visible

### Verification Page (Invalid)
- Red error icon
- "Certificate Not Found" message
- Try again button

### Verification Page (Revoked)
- Orange "REVOKED CERTIFICATE" badge
- Warning message
- Contact button

## ✅ Test Completion Checklist

Mark each item when successfully tested:

- [ ] Database migration applied successfully
- [ ] Table structure verified
- [ ] Certificate creation works
- [ ] QR code generates automatically
- [ ] QR code contains verification URL
- [ ] QR code can be scanned
- [ ] Verification page loads without authentication
- [ ] Valid certificate displays correctly
- [ ] All certificate details shown
- [ ] Photo displays if uploaded
- [ ] Verification count increments
- [ ] Invalid token shows error
- [ ] Revoked certificate shows warning
- [ ] Print functionality works
- [ ] Mobile responsive design works
- [ ] Multiple certificates can be created
- [ ] Each certificate has unique QR code
- [ ] API endpoints work with authentication
- [ ] "My Certificates" list displays
- [ ] Certificate can be deleted

## 🎉 Success Criteria

All tests pass when:
1. ✅ Certificate saves to database with unique token
2. ✅ QR code generates automatically
3. ✅ QR code scans to verification page
4. ✅ Verification page displays certificate details
5. ✅ No authentication required for verification
6. ✅ Verification count tracks properly
7. ✅ System works on mobile and desktop
8. ✅ Print functionality works

## 📝 Test Results Log

**Date**: _______________
**Tester**: _______________
**Environment**: Development / Production

### Test Results:
- Database Migration: ✅ / ❌
- Certificate Creation: ✅ / ❌
- QR Code Generation: ✅ / ❌
- QR Code Scanning: ✅ / ❌
- Verification Page: ✅ / ❌
- API Endpoints: ✅ / ❌
- Security Features: ✅ / ❌
- Mobile Responsive: ✅ / ❌

### Issues Found:
1. _____________________________________
2. _____________________________________
3. _____________________________________

### Overall Status: ✅ PASS / ❌ FAIL

---

**Last Updated**: January 15, 2026
**Version**: 1.0.0
