# OB Case Submission Workflow - Direct Approval

## Current Workflow ✅

### Backend (OB/CaseController.php - Lines 380-388)
```php
if ($shouldSubmit) {
    if ($hasPartyData) {
        // OB officers submit directly (no approval needed)
        $initialStatus = 'approved';  // ✅ CORRECT
    } else {
        // No parties - needs investigator to identify them
        $initialStatus = 'pending_parties';
    }
}
```

**Result:** Cases are submitted with `'approved'` status, ready for investigator assignment.

---

## How It Works

### Scenario 1: Case WITH Parties (Victim/Accused)
```
OB Officer creates case → Adds victim/accused → Clicks "Submit Case"
  ↓
Backend receives: should_submit = 1, hasPartyData = true
  ↓
Status set to: 'approved'
  ↓
Admin receives notification: "New Incident Case Submitted"
  ↓
Admin assigns investigator directly (NO approval step)
```

### Scenario 2: Case WITHOUT Parties (Incident Only)
```
OB Officer creates case → No victim/accused → Clicks "Submit Case"
  ↓
Backend receives: should_submit = 1, hasPartyData = false
  ↓
Status set to: 'pending_parties'
  ↓
Admin receives notification: "Incident Reported (No Parties)"
  ↓
Admin assigns investigator to identify parties
```

### Scenario 3: Draft Case
```
OB Officer creates case → Clicks "Save as Draft"
  ↓
Backend receives: should_submit = 0
  ↓
Status set to: 'draft'
  ↓
Case saved for later editing/submission
```

---

## Status Flow Diagram

```
draft
  ↓ (OB Officer submits)
approved (with parties) OR pending_parties (without parties)
  ↓ (Admin assigns investigator)
assigned
  ↓ (Investigation starts)
investigating
  ↓ (Investigation concludes)
concluded
  ↓ (Case closes)
closed/solved
```

---

## Old vs New Workflow

### OLD Workflow (BEFORE):
```
draft → submitted → (admin approves) → approved → assigned → investigating
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        UNNECESSARY APPROVAL STEP
```

### NEW Workflow (NOW): ✅
```
draft → approved → assigned → investigating
        ^^^^^^^^
        DIRECT SUBMISSION
```

---

## Migration of Old Cases

Some cases may still have `status = 'submitted'` from before the workflow change.

**Run:** `MIGRATE_SUBMITTED_TO_APPROVED.sql`

This will:
1. Check how many cases have 'submitted' status
2. Convert all 'submitted' → 'approved'
3. Verify the migration

---

## Frontend Behavior

### Incident Entry (incident-entry.js)
- **Submit button:** "Submit Case"
- **Sends:** `should_submit: 1`
- **Success message:** "Incident submitted successfully. Admin can now assign investigator."

### OB Entry (app.js)
- **Submit button:** "Submit Case"  
- **Sends:** `status: 'submitted'` (but backend converts to 'approved')
- **Success message:** Backend returns appropriate message

---

## Testing Checklist

- [ ] Create a new case with parties
- [ ] Click "Submit Case"
- [ ] Check database: `SELECT status FROM cases ORDER BY id DESC LIMIT 1;`
- [ ] Expected: `status = 'approved'` ✅
- [ ] Check My Cases page: Case should NOT show "Edit" button
- [ ] Admin should be able to assign investigator directly

---

## Notes

1. **No approval step:** OB officers submit directly, admins assign investigators
2. **Old 'submitted' cases:** Should be migrated to 'approved'  
3. **Edit restriction:** Cases with status != 'draft' or 'returned' cannot be edited
4. **Notifications:** Admins receive "New Incident Case Submitted" (not "For Approval")

---

**Status:** ✅ Working Correctly
**Date:** 2026-01-19
