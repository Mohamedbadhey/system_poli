# Translation Function Fix Applied

## Issue
The `showCloseCaseModal()` function was calling `getTranslation()` which doesn't exist in the codebase, causing a JavaScript error:
```
ReferenceError: getTranslation is not defined
```

## Solution
Replaced all instances of `getTranslation()` with `t()` which is the correct translation helper function defined in `translation-helper.js`.

## Changes Made
**File**: `public/assets/js/court-workflow.js`

Replaced 13 instances of `getTranslation()` with `t()`:
- Modal title
- All form labels
- All placeholders
- All validation messages
- Button text

## Test Now
1. Clear your browser cache (Ctrl+Shift+Delete or Ctrl+F5)
2. Click "Close Case" button on any active case
3. The modal should now open without errors
4. You'll see three closure type options
5. All translations should work in both English and Somali

## Fixed
✅ Translation function error resolved
✅ Modal now opens correctly
✅ All labels display properly
✅ Validation messages work
✅ Bilingual support active
