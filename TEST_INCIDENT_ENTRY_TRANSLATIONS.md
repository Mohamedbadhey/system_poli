# Incident Entry Translation Testing Guide

## Issue Fixed
The incident entry form was not translating to Somali when the language was changed.

## Root Cause
The `applyTranslations()` function was being called in incident-entry.js but it didn't exist globally. It needed to be an alias for `LanguageManager.translatePage()`.

## Changes Made

### 1. Added Global `applyTranslations()` Function
**File:** `public/assets/js/language.js`
- Added `window.applyTranslations()` as a global function that calls `LanguageManager.translatePage()`
- This allows dynamically loaded pages to trigger translation updates

### 2. Fixed Translation Keys
**Files:** `app/Language/en/App.php` and `app/Language/so/App.php`
- Added 37 new translation keys for incident entry
- All form elements now have proper translation support

### 3. Updated incident-entry.js
- Fixed "Select Gender" dropdown to use `data-i18n="select"`
- Converted all placeholders to use `data-i18n-placeholder`
- Converted all error messages to use `t()` function
- Converted SweetAlert dialog to use translation keys

## Translation Keys Used in Form

### Form Structure
- `incident_entry` - Page title
- `incident_entry_desc` - Page description
- `create_incident` - Card header
- `incident_entry_note` - Note about adding parties later
- `incident_details` - Section header
- `optional_party_info` - Party section header
- `crime_classification` - Classification section header

### Form Fields
- `incident_date` - Incident Date
- `incident_location` - Incident Location
- `incident_description` - Incident Description
- `incident_has_party` - Checkbox label
- `party_role` - Party Role
- `first_name`, `middle_name`, `last_name` - Name fields
- `gender` - Gender
- `phone` - Phone
- `national_id` - National ID
- `address` - Address
- `photo` - Photo
- `crime_type` - Crime Type
- `crime_category` - Crime Category
- `priority` - Priority
- `case_sensitivity` - Case Sensitivity
- `mark_as_sensitive` - Mark as Sensitive checkbox

### Dropdown Options
- `select` - Select option (for Gender)
- `select_role` - Select Role
- `select_category` - Select Category
- `male`, `female` - Gender options
- `victim`, `accused` - Role options
- `category_violent`, `category_property`, `category_drug`, `category_cybercrime`, `category_sexual`, `category_juvenile`, `category_other` - Category options
- `priority_low`, `priority_medium`, `priority_high`, `priority_critical` - Priority options

### Placeholders
- `incident_location_example` - "e.g., Main Street, City Center"
- `incident_description_example` - "Describe what happened in detail..."
- `crime_type_example` - "e.g., Traffic Accident, Lost Property, Public Disturbance"

### Buttons
- `submit_for_approval` - Submit for Approval
- `save_as_draft` - Save as Draft
- `cancel` - Cancel
- `reset_form` - Reset Form

### Messages
- `photo_upload_hint` - Photo upload instructions
- `min_10_chars` - Minimum 10 characters
- `sensitive_note` - Sensitive case note
- `incident_workflow_note` - Workflow note at bottom

### Error Messages (JavaScript)
- `photo_size_error` - Photo size must be less than 5MB
- `invalid_image_file` - Please select an image file (JPG/PNG)
- `required_party_fields` - Please fill all required party fields
- `required_fields_error` - Please fill all required fields
- `incident_description_min` - Incident description must be at least 10 characters
- `incident_submitted` - Incident report submitted successfully!
- `incident_saved_draft` - Incident report saved as draft
- `incident_failed` - Failed to create incident report

### Loading States
- `submitting` - Submitting...
- `saving` - Saving...

### Success Dialog
- `success` - Success!
- `submitted` - Submitted
- `saved_successfully` - Saved successfully
- `case_number` - Case Number
- `ob_number` - OB Number
- `status` - Status
- `awaiting_approval_assignment` - Status message for submitted
- `draft_submit_later` - Status message for draft
- `view_my_cases` - View My Cases button
- `create_another` - Create Another button
- `note` - Note

## How Translation Works

### 1. Form Load
When `loadIncidentEntryPage()` is called:
1. HTML with `data-i18n` attributes is injected into the page
2. `applyTranslations()` is called
3. All elements with translation attributes are updated

### 2. Language Change
When user changes language:
1. `changeLanguage(langCode)` is called
2. New translations are loaded from server
3. `LanguageManager.translatePage()` updates all elements
4. Page reloads to apply translations to dynamic content

### 3. Translation Attributes
- `data-i18n="key"` - Translates text content
- `data-i18n-placeholder="key"` - Translates placeholder attribute
- `data-i18n-title="key"` - Translates title attribute

## Testing Steps

### 1. Clear Browser Cache
- Press `Ctrl + Shift + Delete`
- Clear cached images and files
- Close and reopen browser

### 2. Login to System
- Navigate to the login page
- Login with your credentials

### 3. Navigate to Incident Entry
- Click on "Incident Entry" or "OB Entry" from the menu
- Or navigate directly to the page

### 4. Test English (Default)
- Verify all labels are in English
- Check placeholders are in English
- Verify all dropdown options are in English

### 5. Switch to Somali
- Click the language dropdown (🇬🇧 EN)
- Select Somali (🇸🇴 SO)
- Wait for page to reload

### 6. Verify Somali Translations
Check the following:

**Page Header:**
- Title should be "Qoraalka Dhacdada"
- Description should be in Somali

**Form Fields:**
- All labels should be in Somali
- "Incident Date" → "Taariikhda Dhacdada"
- "Incident Location" → "Goobta Dhacdada"
- "Incident Description" → "Sharaxaada Dhacdada"

**Party Section:**
- Checkbox: "This incident affects a person" → Somali translation
- "Party Role" dropdown with "Dooro Doorka" (Select Role)
- "Gender" dropdown with "Dooro" (Select)
- "Male" → "Lab"
- "Female" → "Dhedig"

**Crime Classification:**
- "Crime Category" dropdown options all in Somali
- Priority levels in Somali
- "Mark as Sensitive" → "Calaamadee Xasaasi ahaan"

**Placeholders:**
- Location placeholder should be in Somali
- Description placeholder should be in Somali
- Crime type placeholder should be in Somali

**Buttons:**
- "Submit for Approval" → "U Dir Ansixinta"
- "Save as Draft" → "Ku Keydi Qabyo"
- "Cancel" → "Jooji"
- "Reset Form" → "Dib u Deji Foomka"

### 7. Test Form Validation
- Try to submit empty form
- Check error messages are in Somali
- Upload large photo and check error is in Somali

### 8. Test Success Dialog
- Fill out form completely
- Submit the form
- Verify success dialog is in Somali:
  - Title: "Guul!"
  - "Case Number" → "Lambarka Kiiska"
  - "OB Number" → "Lambarka OB"
  - "Status" → "Xaalad"
  - Buttons in Somali

## Expected Results

### English Version
All text should be in clear, professional English.

### Somali Version (🇸🇴)
All text should be translated to Somali including:
- ✅ Page titles and headers
- ✅ Form labels
- ✅ Dropdown options (Select, Gender, Roles, Categories, Priority)
- ✅ Placeholder text
- ✅ Button labels
- ✅ Error messages
- ✅ Success messages
- ✅ Dialog boxes
- ✅ Help text and notes

## Troubleshooting

### Issue: Translations not showing
**Solution:**
1. Clear browser cache completely
2. Check browser console for errors
3. Verify `LanguageManager` is loaded
4. Check network tab for translation API calls

### Issue: Some fields not translated
**Solution:**
1. Check if the element has `data-i18n` attribute
2. Verify the translation key exists in language files
3. Manually call `applyTranslations()` in console

### Issue: Placeholders not translated
**Solution:**
1. Ensure attribute is `data-i18n-placeholder` not `data-i18n`
2. Check that the translation key exists
3. Verify `LanguageManager.translatePage()` is handling placeholders

### Issue: JavaScript messages not translated
**Solution:**
1. Check that `t()` function is being used
2. Verify translation keys exist in language files
3. Check browser console for errors

## Development Notes

### Adding New Translation Keys
1. Add to `app/Language/en/App.php`:
```php
'new_key' => 'English Text',
```

2. Add to `app/Language/so/App.php`:
```php
'new_key' => 'Somali Translation',
```

3. Use in HTML:
```html
<span data-i18n="new_key">English Text</span>
```

4. Use in JavaScript:
```javascript
const text = t('new_key');
```

### Testing Translation Function
Open browser console and test:
```javascript
// Check if t() function works
console.log(t('incident_entry'));

// Check current language
console.log(LanguageManager.currentLanguage);

// Check all translations
console.log(LanguageManager.translations);

// Apply translations manually
applyTranslations();
```

## Files Modified

1. **public/assets/js/language.js** - Added `applyTranslations()` function
2. **public/assets/js/incident-entry.js** - Updated to use translation keys
3. **app/Language/en/App.php** - Added 37 new translation keys
4. **app/Language/so/App.php** - Added 37 new Somali translations

## Summary

✅ All form fields are translatable
✅ All dropdown options are translatable  
✅ All placeholders are translatable
✅ All error messages are translatable
✅ All success messages are translatable
✅ All buttons are translatable
✅ Gender dropdown "Select" option is translatable
✅ Party section fully translatable
✅ Success dialog fully translatable

The incident entry form now has complete translation support for both English and Somali languages!
