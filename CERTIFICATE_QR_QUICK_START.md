# Non-Criminal Certificate QR Code - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Database Migration (1 minute)

**Option A - Using phpMyAdmin (Recommended)**:
1. Open phpMyAdmin → Select `pcms_db`
2. Click "SQL" tab
3. Open file: `app/Database/non_criminal_certificates_migration.sql`
4. Copy all content and paste into SQL box
5. Click "Go"
6. ✅ Success message should appear

**Option B - Using MySQL Command Line**:
```bash
# Connect to MySQL
mysql -u root -p

# Select database
use pcms_db;

# Run migration file
source app/Database/non_criminal_certificates_migration.sql;

# Verify table created
SHOW TABLES LIKE 'non_criminal_certificates';
```

### Step 2: Restart Server (30 seconds)
```bash
# Stop current server (Ctrl+C)
# Restart
php spark serve
```

### Step 3: Test the Feature (3 minutes)

#### Create a Certificate:
1. Login to PCMS
2. Navigate to: `http://localhost:8080/assets/pages/non-criminal-certificate.html`
3. Fill in the form:
   - **Person Name**: John Doe
   - **Issue Date**: Today
   - Fill other fields as needed
4. Click **"Save"** button
5. ✅ **QR Code appears** in bottom right corner!

#### Test QR Code:
1. Use your smartphone to scan the QR code
2. Or copy the verification URL from browser console
3. Open in new browser tab
4. ✅ **Verification page displays** certificate details!

## 🎯 What You Get

### Automatic QR Code Generation
- ✅ Each certificate gets a unique QR code
- ✅ QR code contains verification URL
- ✅ Automatically generated on save

### Public Verification Page
- ✅ Beautiful verification page at `/verify-certificate/{token}`
- ✅ No login required
- ✅ Shows all certificate details
- ✅ Tracks verification count
- ✅ Mobile responsive

### Backend API
- ✅ RESTful endpoints for certificate management
- ✅ Secure verification tokens (64 characters)
- ✅ Certificate revocation support
- ✅ Verification tracking

## 📁 Files Created

```
app/
├── Controllers/Investigation/
│   └── CertificateController.php          # API Controller
├── Models/
│   └── NonCriminalCertificateModel.php    # Database Model
└── Database/
    └── non_criminal_certificates_migration.sql  # Schema

public/
├── verify-certificate.html                 # Verification Page
└── assets/js/
    └── non-criminal-certificate.js         # Updated with QR logic

app/Config/
└── Routes.php                              # Updated with routes
```

## 🔌 API Endpoints Added

### Protected (Require Authentication)
- `POST /investigation/certificates` - Create certificate
- `GET /investigation/certificates` - List certificates
- `GET /investigation/certificates/{id}` - Get single certificate
- `PUT /investigation/certificates/{id}` - Update certificate
- `DELETE /investigation/certificates/{id}` - Delete certificate
- `GET /investigation/certificates/{id}/verification-url` - Get URL

### Public (No Authentication)
- `GET /verify-certificate/{token}` - Verify certificate

## 🎨 How It Works

```
1. User fills certificate form
          ↓
2. Clicks "Save" button
          ↓
3. JavaScript sends POST to /investigation/certificates
          ↓
4. Backend generates unique verification token
          ↓
5. Backend creates verification URL
          ↓
6. Backend saves to database
          ↓
7. Backend returns URL to frontend
          ↓
8. JavaScript generates QR code with URL
          ↓
9. QR code displays on certificate
          ↓
10. User scans QR code
          ↓
11. Browser opens verification page
          ↓
12. Page displays certificate details ✅
```

## 📱 Verification Flow

```
Scan QR Code
     ↓
https://domain.com/verify-certificate/abc123...
     ↓
Verification Page Loads
     ↓
Displays:
- ✅ Valid/Invalid Badge
- Person Details
- Photo (if available)
- Issue Date
- Verification Count
- Print Button
```

## 🔒 Security Features

- ✅ **64-character cryptographic tokens** - Impossible to guess
- ✅ **Unique tokens per certificate** - No duplicates
- ✅ **Certificate revocation** - Can deactivate certificates
- ✅ **Verification tracking** - Know how many times scanned
- ✅ **Role-based access** - Only authorized users create certificates
- ✅ **Public verification** - Anyone can verify, but read-only

## 📊 Database Table

Table: `non_criminal_certificates`
- Stores all certificate data
- Unique verification token for each certificate
- Tracks verification count and timestamps
- Supports certificate revocation
- Links to persons table if person exists

## 🧪 Quick Test

### Test 1: Create Certificate
```
1. Open: http://localhost:8080/assets/pages/non-criminal-certificate.html
2. Fill form and click Save
3. ✅ QR code appears
```

### Test 2: Verify Certificate
```
1. Scan QR code with phone
2. Or open URL in browser
3. ✅ Certificate details display
```

### Test 3: Check Database
```sql
SELECT * FROM non_criminal_certificates;
-- ✅ Should see your certificate
```

## 🐛 Troubleshooting

### QR Code Not Showing?
- Check browser console for errors
- Verify certificate saved successfully (check console log)
- Ensure `qrcodejs` library loaded

### Verification Page Error?
- Check route exists in `Routes.php`
- Verify controller file exists
- Check database table created
- Verify token matches database

### Certificate Not Saving?
- Check you're logged in (valid token)
- Check network tab for API errors
- Verify database migration applied
- Check server logs

## 📞 Need Help?

1. **Check Console**: F12 → Console tab for errors
2. **Check Network**: F12 → Network tab for API calls
3. **Check Database**: phpMyAdmin → non_criminal_certificates table
4. **Read Full Guide**: `CERTIFICATE_QR_IMPLEMENTATION_GUIDE.md`
5. **Test Guide**: `TEST_CERTIFICATE_QR_FEATURE.md`

## 🎉 Success!

You now have:
- ✅ Automatic QR code generation
- ✅ Unique verification URL per certificate
- ✅ Beautiful public verification page
- ✅ Secure token-based system
- ✅ Mobile-friendly design
- ✅ Verification tracking

**Time to implementation**: ~5 minutes
**Complexity**: Low
**Maintenance**: Minimal

---

**Created**: January 15, 2026
**Status**: ✅ Ready to Use
**Version**: 1.0.0
