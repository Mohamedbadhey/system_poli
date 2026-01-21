# OB Incident Entry - Direct Submission Fix

## Issue
OB officers were submitting cases "for approval" which required admin approval before investigator assignment. This added an unnecessary approval step.

## Solution
Changed the workflow so OB officers submit cases directly with **'approved'** status, bypassing the approval step. Admin can now directly assign investigators.

---

## Changes Made

### 1. Backend Controller (`app/Controllers/OB/CaseController.php`)

**Line 380-386: Changed initial status**
```php
// BEFORE:
if ($shouldSubmit) {
    if ($hasPartyData) {
        $initialStatus = 'submitted';  // Required approval
    } else {
        $initialStatus = 'pending_parties';
    }
}

// AFTER:
if ($shouldSubmit) {
    if ($hasPartyData) {
        // OB officers submit directly (no approval needed)
        $initialStatus = 'approved';  // Ready for assignment
    } else {
        // No parties - needs investigator to identify them
        $initialStatus = 'pending_parties';
    }
}
```

**Line 520-537: Updated notifications**
- Changed notification type from `'approval_required'` to `'case_submitted'`
- Changed title from "Incident Submitted for Approval" to "New Incident Case Submitted"
- Updated message to reflect direct submission workflow

### 2. Frontend JavaScript (`public/assets/js/incident-entry.js`)

**Line 179: Changed button text**
```html
<!-- BEFORE -->
<span data-i18n="submit_for_approval">Submit for Approval</span>

<!-- AFTER -->
<span data-i18n="submit_case">Submit Case</span>
```

**Line 441: Updated success dialog**
```javascript
// BEFORE:
const statusText = wasSubmitted 
    ? t('awaiting_approval_assignment')
    : t('draft_submit_later');

// AFTER:
const statusText = wasSubmitted 
    ? t('case_submitted_assignment')
    : t('draft_submit_later');
```

### 3. Translation Files

**Added new translation keys:**

#### English (`app/Language/en/App.php`)
```php
'submit_case' => 'Submit Case',
'case_submitted_assignment' => 'Submitted - Admin can now assign investigator',
```

#### Somali (`app/Language/so/App.php`)
```php
'submit_case' => 'Gudbi Kiiska',
'case_submitted_assignment' => 'La gudbiyay - Maamulaha hadda wuu qoondeyn karaa baarayaha',
```

---

## New Workflow

### For Cases WITH Party Information:
1. **OB Officer** → Fills incident details + adds victim/accused
2. **Clicks "Submit Case"** → Status = `'approved'`
3. **Admin** → Receives notification "New Incident Case Submitted"
4. **Admin** → Directly assigns investigator (no approval needed)

### For Cases WITHOUT Party Information:
1. **OB Officer** → Fills incident details only (no parties)
2. **Clicks "Submit Case"** → Status = `'pending_parties'`
3. **Admin** → Receives notification "Incident Reported (No Parties)"
4. **Admin** → Assigns investigator to identify parties

---

## Status Flow Comparison

### OLD Flow (With Approval):
```
draft → submitted → (admin approves) → approved → assigned → investigating
```

### NEW Flow (Direct Submission):
```
draft → approved → assigned → investigating
```

---

## Testing Checklist

- [ ] OB officer can submit incident with parties
- [ ] Button shows "Submit Case" (not "Submit for Approval")
- [ ] Case status becomes 'approved' after submission
- [ ] Admin receives "New Incident Case Submitted" notification
- [ ] Admin can directly assign investigator without approval step
- [ ] Success message shows "Admin can now assign investigator"
- [ ] Translations work in both English and Somali
- [ ] Draft functionality still works correctly

---

## Files Modified

1. `app/Controllers/OB/CaseController.php` - Backend status logic + validation
2. `public/assets/js/incident-entry.js` - Incident Entry button + category fix
3. `public/assets/js/app.js` - OB Entry button (line 3340 and 3959)
4. `app/Language/en/App.php` - English translations
5. `app/Language/so/App.php` - Somali translations

## Additional Fix - Crime Category Validation

The crime_category field validation issue was also fixed:
- Frontend now uses hardcoded ENUM values instead of dynamic database categories
- Backend validation enforces: 'violent','property','drug','cybercrime','sexual','juvenile','other'
- Database ENUM constraint matches the validation rules

---

**Date:** 2026-01-19
**Status:** ✅ Complete
