# Test Decryption Issue

## Problem
Downloaded images can't be viewed (appear corrupted or encoded)

## Possible Causes

### 1. Decryption Failure
- Files are encrypted but not being decrypted properly
- Wrong encryption key
- Corrupted encrypted files

### 2. File Format Issues
- Files don't have proper IV separator (`::`)
- Encryption format changed

### 3. Encryption Key Mismatch
- Files encrypted with one key
- Trying to decrypt with different key

## Current Setup

**Encryption Key:** Using default (not set in .env)
```
change-this-encryption-key-in-production-32chars!!
```

**Encryption Method:** AES-256-CBC with random IV

**File Format:** 
```
[base64_encoded_iv]::[encrypted_data]
```

## Testing Steps

### Test 1: Check File Size
1. Download a file
2. Check file size
3. **Expected:** Should be similar to original size
4. **If 0 bytes or very small:** Download failed
5. **If huge:** Not decrypted (encrypted data)

### Test 2: Check File Content
1. Open downloaded file in text editor
2. **If you see:** Random characters/gibberish → Still encrypted
3. **If you see:** Normal data → Decryption worked

### Test 3: Check Logs
```
Check: writable/logs/log-2024-12-31.php
Look for: "Decryption failed"
```

### Test 4: Manual Test
Try this PHP script to test decryption:

```php
<?php
// Test decryption
$key = 'change-this-encryption-key-in-production-32chars!!';
$filePath = 'writable/uploads/evidence/versions/1/v3_1767190176_19c17dda3c79fba9a587.jpeg.enc';

$encryptedData = file_get_contents($filePath);
list($iv, $encrypted) = explode('::', $encryptedData, 2);

$iv = base64_decode($iv);
$decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);

if ($decrypted === false) {
    echo "DECRYPTION FAILED!\n";
    echo "Error: " . openssl_error_string() . "\n";
} else {
    echo "Decryption successful! File size: " . strlen($decrypted) . " bytes\n";
    file_put_contents('test_output.jpg', $decrypted);
    echo "Saved to test_output.jpg\n";
}
```

## What to Report

Please provide:

1. **Downloaded file size:** ___ KB
2. **Can you open it?** Yes/No
3. **If no, what error?** ___
4. **Check log file for errors:** writable/logs/log-2024-12-31.php
5. **Console errors:** Any JavaScript errors?

## Quick Checks

Run these:

```sql
-- Check if files have reasonable sizes
SELECT id, file_name, file_size, file_path 
FROM evidence_file_versions 
WHERE evidence_id = 1;
```

Expected output:
- v1: ~66KB (WhatsApp Image)
- v2: ~52KB (sidebar-logo)
- v3: ~274KB (licensed-image)

---

**Added error handling to decryptFile() - now it will log errors if decryption fails!**
