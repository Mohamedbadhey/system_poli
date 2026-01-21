# Case Report QR Code - Backend Implementation Guide

## 🎯 Quick Setup Guide

Follow these steps to complete the backend implementation for report QR codes.

---

## Step 1: Add Database Column

Run this SQL to add verification code column:

```sql
-- Add verification_code column to cases table
ALTER TABLE cases 
ADD COLUMN verification_code VARCHAR(64) UNIQUE NULL AFTER case_number;

-- Generate verification codes for existing cases
UPDATE cases 
SET verification_code = SHA2(CONCAT(case_number, created_at, RAND()), 256)
WHERE verification_code IS NULL;
```

---

## Step 2: Update CaseModel

Add to `app/Models/CaseModel.php`:

```php
protected $allowedFields = [
    // ... existing fields ...
    'verification_code',
];

protected $beforeInsert = ['generateCaseNumbers', 'ensureStatusDefault', 'generateVerificationCode'];

/**
 * Generate verification code before insert
 */
protected function generateVerificationCode(array $data)
{
    if (!isset($data['data']['verification_code']) || empty($data['data']['verification_code'])) {
        $data['data']['verification_code'] = bin2hex(random_bytes(16)); // 32 character code
    }
    
    return $data;
}
```

---

## Step 3: Create Verification Controller

Create new file: `app/Controllers/CaseVerificationController.php`

```php
<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class CaseVerificationController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Verify case report authenticity
     * GET /api/cases/verify?case=CASE-NUMBER&code=VERIFICATION-CODE
     */
    public function verify()
    {
        $caseNumber = $this->request->getGet('case');
        $verificationCode = $this->request->getGet('code');
        
        // Validate input
        if (empty($caseNumber) || empty($verificationCode)) {
            return $this->fail('Case number and verification code are required', 400);
        }
        
        // Find case with matching verification code
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel
            ->where('case_number', $caseNumber)
            ->where('verification_code', $verificationCode)
            ->first();
        
        if (!$case) {
            return $this->fail('Invalid verification code or case not found', 404);
        }
        
        // Return public case information (no sensitive data)
        return $this->respond([
            'status' => 'success',
            'message' => 'Report verified successfully',
            'data' => [
                'case_number' => $case['case_number'],
                'ob_number' => $case['ob_number'],
                'status' => $case['status'],
                'crime_type' => $case['crime_type'],
                'created_at' => $case['created_at'],
                'verified' => true,
                'verified_at' => date('Y-m-d H:i:s')
            ]
        ]);
    }
}
```

---

## Step 4: Add Route

Add to `app/Config/Routes.php`:

```php
// Public verification route (no auth required)
$routes->get('api/cases/verify', 'CaseVerificationController::verify');
```

---

## Step 5: Update Report Generation

Update report generation to include verification URL.

In `app/Controllers/Investigation/ReportController.php` or wherever reports are generated:

```php
// When generating report data
$verificationUrl = base_url("verify-report.html?case={$case['case_number']}&code={$case['verification_code']}");

$reportData = [
    'case' => [
        'case_number' => $case['case_number'],
        'verification_code' => $case['verification_code'],
        'verification_url' => $verificationUrl,
        // ... other case data
    ],
    // ... rest of report data
];
```

---

## Step 6: Test Implementation

### Test 1: Generate Verification Code
```sql
-- Check if codes are generated
SELECT id, case_number, verification_code 
FROM cases 
ORDER BY id DESC 
LIMIT 5;
```

### Test 2: Test Verification Endpoint
```bash
# Replace with actual case number and code
curl "http://localhost:8080/api/cases/verify?case=CASE/XGD-01/2026/0018&code=abc123xyz"
```

### Test 3: Test QR Code
1. Open a case report
2. Check if QR code appears
3. Scan QR code with phone
4. Should open verification page
5. Should show case details

---

## 🎯 Quick Checklist

- [ ] Run SQL to add verification_code column
- [ ] Update CaseModel with new field
- [ ] Add generateVerificationCode callback
- [ ] Create CaseVerificationController
- [ ] Add verification route
- [ ] Update report generation to include verification_url
- [ ] Test verification endpoint
- [ ] Test QR code scanning
- [ ] Deploy to production

---

## 🔐 Security Notes

1. **No Authentication Required**: Verification is public (by design)
2. **Limited Data**: Only return non-sensitive case info
3. **Unique Codes**: Each case has unique verification code
4. **No Private Details**: Don't expose victim/witness names
5. **Rate Limiting**: Consider adding rate limiting to prevent abuse

---

## 📱 Expected Behavior

### Success Flow:
```
1. User generates report → QR code appears
2. User scans QR code → Opens verify-report.html
3. Page calls API → Backend validates
4. API returns success → Shows case details
```

### Error Flow:
```
1. User scans invalid QR → Opens verify-report.html
2. Page calls API → Backend finds no match
3. API returns error → Shows error message
```

---

## ✅ That's It!

Once these steps are complete, the QR code verification system will be fully functional!

**Estimated Time**: 15-30 minutes
