# Non-Criminal Certificate QR Code Implementation Guide

## 📋 Overview

This implementation adds automatic QR code generation to non-criminal certificates. Each certificate gets a unique QR code that, when scanned, directs to a verification page displaying the certificate details.

## 🎯 Features Implemented

### 1. **Backend Implementation**
- ✅ Database table for certificate storage with unique verification tokens
- ✅ RESTful API endpoints for CRUD operations
- ✅ Public verification endpoint (no authentication required)
- ✅ Automatic verification tracking (count and timestamps)

### 2. **Frontend Implementation**
- ✅ Automatic QR code generation with verification URL
- ✅ Certificate saving to database with unique tokens
- ✅ Beautiful verification page for scanned certificates
- ✅ Certificate validation and status display

### 3. **Security Features**
- ✅ Unique 64-character verification tokens (cryptographically secure)
- ✅ Certificate revocation support
- ✅ Verification count tracking
- ✅ Role-based access control

## 📁 Files Created/Modified

### New Files
1. **`app/Database/non_criminal_certificates_migration.sql`** - Database schema
2. **`app/Models/NonCriminalCertificateModel.php`** - Model for certificates
3. **`app/Controllers/Investigation/CertificateController.php`** - API controller
4. **`public/verify-certificate.html`** - Public verification page
5. **`APPLY_CERTIFICATE_QR_MIGRATION.bat`** - Migration script

### Modified Files
1. **`app/Config/Routes.php`** - Added certificate routes
2. **`public/assets/js/non-criminal-certificate.js`** - Updated to save to backend and generate QR codes

## 🗄️ Database Schema

### Table: `non_criminal_certificates`

```sql
CREATE TABLE `non_criminal_certificates` (
  `id` int(11) PRIMARY KEY AUTO_INCREMENT,
  `certificate_number` varchar(100) UNIQUE NOT NULL,
  `person_id` int(11) - Link to persons table
  `person_name` varchar(255) NOT NULL,
  `mother_name` varchar(255),
  `gender` enum('MALE','FEMALE') NOT NULL,
  `birth_date` date,
  `birth_place` varchar(255),
  `photo_path` varchar(255),
  `purpose` text,
  `validity_period` varchar(50) DEFAULT '6 months',
  `issue_date` date NOT NULL,
  `director_name` varchar(255),
  `director_signature` text - Base64 encoded signature
  `issued_by` int(11) NOT NULL - User ID
  `verification_token` varchar(64) UNIQUE NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `verification_count` int(11) DEFAULT 0,
  `last_verified_at` datetime,
  `notes` text,
  `created_at` datetime,
  `updated_at` datetime
);
```

## 🔌 API Endpoints

### Protected Routes (Require Authentication)

#### Create Certificate
```http
POST /investigation/certificates
Authorization: Bearer {token}
Content-Type: application/json

{
  "certificate_number": "JPFHQ/CID/NC:1234/2026",
  "person_name": "John Doe",
  "mother_name": "Jane Doe",
  "gender": "MALE",
  "birth_date": "1990-01-01",
  "birth_place": "Kismaio",
  "purpose": "visa application",
  "validity_period": "6 months",
  "issue_date": "2026-01-15",
  "director_name": "Omar Hujale Abdi"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Certificate created successfully",
  "data": {
    "certificate": {...},
    "verification_url": "https://yourdomain.com/verify-certificate/abc123...",
    "verification_token": "abc123..."
  }
}
```

#### List All Certificates
```http
GET /investigation/certificates
Authorization: Bearer {token}
```

#### Get Single Certificate
```http
GET /investigation/certificates/{id}
Authorization: Bearer {token}
```

#### Update Certificate
```http
PUT /investigation/certificates/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "person_name": "Updated Name",
  "notes": "Updated notes"
}
```

#### Delete Certificate
```http
DELETE /investigation/certificates/{id}
Authorization: Bearer {token}
```

#### Get Verification URL
```http
GET /investigation/certificates/{id}/verification-url
Authorization: Bearer {token}
```

### Public Routes (No Authentication Required)

#### Verify Certificate
```http
GET /verify-certificate/{token}
```

**Response (Valid):**
```json
{
  "status": "success",
  "message": "Certificate verified successfully",
  "valid": true,
  "data": {
    "id": 1,
    "certificate_number": "JPFHQ/CID/NC:1234/2026",
    "person_name": "John Doe",
    "verification_count": 5,
    ...
  }
}
```

**Response (Invalid/Revoked):**
```json
{
  "status": "warning",
  "message": "This certificate has been revoked or is no longer active",
  "valid": false,
  "data": {...}
}
```

## 🚀 Installation Steps

### Step 1: Apply Database Migration
```bash
# Run the migration script
APPLY_CERTIFICATE_QR_MIGRATION.bat

# Or manually:
mysql -u root pcms_db < app/Database/non_criminal_certificates_migration.sql
```

### Step 2: Verify Routes
The routes are already added to `app/Config/Routes.php`:
- Protected routes under `/investigation/certificates`
- Public verification route: `/verify-certificate/{token}`

### Step 3: Clear Cache (if needed)
```bash
php spark cache:clear
```

### Step 4: Restart Server
```bash
# Stop and restart your PHP development server
php spark serve
```

## 🎨 How It Works

### Certificate Creation Flow

1. **User fills certificate form** in `non-criminal-certificate.html`
2. **User clicks "Save"** button
3. **JavaScript collects data** and sends POST request to `/investigation/certificates`
4. **Backend generates** unique 64-character verification token
5. **Backend creates** verification URL: `https://domain.com/verify-certificate/{token}`
6. **Backend saves** certificate to database
7. **Frontend receives** verification URL in response
8. **JavaScript generates QR code** containing the verification URL
9. **QR code displayed** on the certificate

### Verification Flow

1. **User scans QR code** with mobile device
2. **Browser opens** `https://domain.com/verify-certificate/{token}`
3. **Verification page loads** and extracts token from URL
4. **JavaScript sends GET request** to `/verify-certificate/{token}`
5. **Backend validates token** and increments verification count
6. **Backend returns** certificate details if valid
7. **Frontend displays** certificate information beautifully
8. **User sees** verified certificate with all details

## 🔒 Security Features

### Token Generation
```php
// Cryptographically secure random token
$verificationToken = bin2hex(random_bytes(32)); // 64 characters
```

### Certificate Revocation
```php
// Revoke a certificate
$model->revokeCertificate($id, 'Reason for revocation');

// Reactivate
$model->reactivateCertificate($id);
```

### Access Control
- Only authenticated users can create/update certificates
- Public can verify certificates (read-only)
- Admins can see all certificates
- Users see only their own certificates

## 📱 QR Code Details

### QR Code Content
The QR code contains the full verification URL:
```
https://yourdomain.com/verify-certificate/abc123def456...
```

### QR Code Library
Using `qrcodejs` (already included in HTML):
```javascript
new QRCode(container, {
    text: verificationUrl,
    width: 120,
    height: 120,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H // High error correction
});
```

## 🎯 User Experience

### Certificate Creation
1. Navigate to non-criminal certificate page
2. Fill in person details
3. Upload photo (optional)
4. Add director signature
5. Click "Save"
6. QR code automatically generates
7. Print certificate with QR code

### Certificate Verification
1. Scan QR code with smartphone
2. Browser opens verification page
3. See beautiful display with:
   - ✅ Valid/Invalid badge
   - Person details
   - Photo (if available)
   - Issue date
   - Verification count
   - Last verified timestamp
4. Option to print verification page

## 🎨 Verification Page Design

### Features
- ✅ Responsive mobile-first design
- ✅ Beautiful gradient header
- ✅ Status badges (Valid/Invalid/Revoked)
- ✅ Organized detail rows
- ✅ Photo display
- ✅ Verification statistics
- ✅ Print functionality
- ✅ Professional styling

### Color Scheme
- **Valid**: Green (#10b981)
- **Invalid**: Red (#ef4444)
- **Revoked**: Orange/Yellow (#f59e0b)
- **Primary**: Purple gradient (#667eea to #764ba2)

## 📊 Model Methods

```php
// Get certificate with issuer info
$model->getCertificateWithIssuer($id);

// Search certificates
$model->searchCertificates('John');

// Get by date range
$model->getCertificatesByDateRange('2026-01-01', '2026-12-31');

// Get active count
$model->getActiveCertificatesCount();

// Get by issuer
$model->getCertificatesByIssuer($userId);

// Revoke/Reactivate
$model->revokeCertificate($id, 'notes');
$model->reactivateCertificate($id);

// Get verification stats
$model->getVerificationStats($id);
```

## 🧪 Testing

### Test Certificate Creation
1. Open browser to non-criminal certificate page
2. Fill in details:
   - Name: "Test Person"
   - Issue Date: Today
   - Other fields
3. Click "Save"
4. Check console for success message
5. Verify QR code appears

### Test QR Code Scanning
1. Use smartphone QR scanner app
2. Scan generated QR code
3. Should open verification page
4. Verify all details display correctly

### Test Verification Tracking
1. Scan QR code multiple times
2. Check verification count increments
3. Check last_verified_at updates

### Test Certificate Revocation
```php
// In backend, revoke certificate
$model->revokeCertificate(1, 'Test revocation');
```
1. Scan QR code
2. Should show "REVOKED" status
3. Should display warning message

## 🐛 Troubleshooting

### QR Code Not Generating
- Check console for JavaScript errors
- Verify `qrcodejs` library is loaded
- Ensure certificate was saved successfully
- Check verification URL is returned from backend

### Verification Page Not Loading
- Check route is defined in `Routes.php`
- Verify token is in URL path
- Check backend controller exists
- Verify database connection

### Certificate Not Saving
- Check auth token is valid
- Verify all required fields are filled
- Check network tab for API errors
- Verify database table exists

### Database Migration Failed
- Check MySQL is running
- Verify database name is correct
- Check user permissions
- Run SQL manually to see specific error

## 📞 Support

For issues or questions:
- **Email**: info@cidpolice.jls.so
- **Location**: Marine, taliska booliska jubada hoose
- **Phone**: +252616755541

## 🎉 Success Criteria

✅ QR code automatically generates when certificate is saved
✅ Each certificate has unique verification URL
✅ QR code can be scanned with any QR reader
✅ Verification page displays certificate details beautifully
✅ Verification count is tracked
✅ Certificate can be revoked
✅ System works on mobile and desktop
✅ No authentication required for verification
✅ Print functionality works

---

**Implementation Date**: January 15, 2026
**Version**: 1.0.0
**Status**: ✅ Complete and Ready for Testing
