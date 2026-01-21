# Testing the Reports System

## 🧪 Quick Test Guide

### Prerequisites
1. ✅ Database migrations applied
2. ✅ Server running (`php spark serve`)
3. ✅ At least one case in the database

---

## Test 1: Access Reports Dashboard

**URL**: `http://localhost:8080/reports-dashboard.html`

**Expected Result**:
- Dashboard loads successfully
- "Select Case" button visible
- Login credentials work

**Login as Investigator**:
- Username: `baare`
- Password: `Admin123`

---

## Test 2: Select a Case

**Steps**:
1. Click "Select Case" button
2. Modal opens with case list
3. Click on any case (e.g., Case #10)

**Expected Result**:
- Case information displays
- Statistics cards show (0 reports initially)
- Report generation cards appear

---

## Test 3: Generate Preliminary Report

**Steps**:
1. Find "Preliminary Investigation Report (PIR)" card
2. Click "Generate PIR" button
3. Wait for modal to load

**Expected Result**:
- Modal opens with "Preliminary Investigation Report"
- Report title auto-filled
- Report content auto-populated with:
  - Case number
  - Crime type
  - Parties involved
  - Evidence list
  - Investigator details

**Actions**:
- Edit content if needed
- Click "Preview" to see PDF version
- Click "Save Report"

**Success Indicators**:
- Toast: "Report saved successfully"
- Modal closes
- Report appears in "Existing Reports" tab

---

## Test 4: View Saved Report

**Steps**:
1. Click "Existing Reports" tab
2. Find your saved report

**Expected Result**:
- Report listed in table
- Status badge: "Draft"
- Action buttons visible:
  - 👁️ View
  - ⬇️ Download
  - ✏️ Edit
  - 📤 Submit

---

## Test 5: Preview Report

**Steps**:
1. Click 👁️ View button
2. New window/tab opens

**Expected Result**:
- Professional PDF layout
- Case information box
- Report content formatted
- Signature block at bottom
- "DRAFT" watermark visible

---

## Test 6: Submit for Approval

**Steps**:
1. Click 📤 Submit button
2. Confirm in dialog

**Expected Result**:
- Status changes to "Pending Approval"
- Edit button disappears
- Toast: "Report submitted for approval"

---

## Test 7: Approve Report (As Commander)

**Steps**:
1. Logout from investigator account
2. Login as admin/commander:
   - Username: `moha`
   - Password: `Admin123`
3. Select same case
4. Go to "Pending Approvals" tab

**Expected Result**:
- Report appears in pending list
- ✅ Approve and ❌ Reject buttons visible

**Actions**:
1. Click ✅ Approve
2. Add optional comments
3. Confirm

**Success Indicators**:
- Status changes to "Approved"
- Toast: "Report approved successfully"

---

## Test 8: Generate Final Report

**Steps**:
1. Login as investigator again
2. Select case
3. Click "Generate FIR" (Final Investigation Report)

**Expected Result**:
- More comprehensive content than PIR
- Includes:
  - Complete evidence list
  - All witnesses
  - Case conclusions
  - Case strength assessment
- Metadata fields for case strength and recommended action

**Test Data**:
- Case Strength: "Strong"
- Recommended Action: "Prosecute"

---

## Test 9: Sign Final Report

**Steps**:
1. Save FIR as draft
2. Submit for approval
3. Get it approved (as commander)
4. Return as investigator
5. Click 🖊️ Sign button

**Expected Result**:
- Confirmation dialog appears
- After signing:
  - Status badge shows "Signed"
  - Report becomes immutable
  - Signature hash displayed in preview

---

## Test 10: Generate Court Submission

**Steps**:
1. Ensure FIR is signed
2. Click "Generate Docket" (Court Submission)

**Expected Result**:
- Only works if FIR is signed
- Template includes:
  - Formal court format
  - Charges field
  - Complete parties list
  - Evidence summary
  - Witness list

---

## Test 11: Download PDF

**Steps**:
1. Click ⬇️ Download button on any report

**Expected Result**:
- PDF file downloads
- Filename format: `report_{id}_{timestamp}.pdf`
- Opens in PDF viewer
- Professional formatting maintained

---

## Test 12: Generate Multiple Report Types

**Test All Report Types**:

✅ Preliminary Investigation Report (PIR)
✅ Interim Progress Report
✅ Final Investigation Report (FIR)
✅ Court Submission Docket
✅ Evidence Presentation Report
✅ Supplementary Report
✅ Case Closure Report

**For Each Report**:
- Generate template
- Verify auto-population
- Preview
- Save
- View in list

---

## Test 13: Batch PDF Generation

**API Test** (Use Postman/curl):

```bash
POST http://localhost:8080/api/investigation/reports/pdf/batch-generate
Authorization: Bearer {your_token}
Content-Type: application/json

{
    "report_ids": [1, 2, 3]
}
```

**Expected Result**:
- Multiple PDFs generated
- Success/failure count returned

---

## Test 14: Report Statistics

**Verify Statistics Cards Update**:
1. Generate multiple reports
2. Check statistics cards:
   - Total Reports: Should increment
   - Draft Reports: Count of drafts
   - Approved Reports: Count of approved
   - Signed Reports: Count of signed

---

## Test 15: Court Communications

**API Test**:

```bash
POST http://localhost:8080/api/court/reports/communications
Authorization: Bearer {your_token}
Content-Type: application/json

{
    "case_id": 10,
    "communication_type": "hearing_notice",
    "communication_date": "2026-01-15",
    "subject": "Hearing Scheduled",
    "summary": "Hearing scheduled for January 20, 2026"
}
```

**Expected Result**:
- Communication recorded
- Retrievable via GET endpoint

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to load reports"
**Solution**: Check if migrations ran
```bash
php spark migrate:status
```

### Issue 2: "Report not found"
**Solution**: Verify case has reports
```sql
SELECT * FROM investigation_reports WHERE case_id = 10;
```

### Issue 3: PDF not generating
**Solution**: Check folder permissions
```bash
chmod -R 775 writable/uploads/reports/
```

### Issue 4: Templates not showing
**Solution**: Re-run template migration
```bash
php spark migrate:rollback
php spark migrate
```

### Issue 5: "Cannot edit report"
**Solution**: Check approval status
- Only drafts can be edited
- Approved/Signed reports are immutable

---

## ✅ Success Checklist

After testing, verify:

- [ ] All 7 report types generate successfully
- [ ] Auto-population works correctly
- [ ] Preview displays formatted content
- [ ] Save creates database record
- [ ] Approval workflow functions
- [ ] Digital signature works
- [ ] PDF downloads properly
- [ ] Statistics update correctly
- [ ] Role permissions enforced
- [ ] Court communications record

---

## 📊 Test Data Recommendations

**Best Test Case**: Case #10 (CASE/kcjd-r/2025/0001)
- Has multiple accusers and accused
- Has 10 evidence items
- Has witnesses
- Has investigation notes
- Complete for testing

**Test Users**:
- Investigator: `baare` / `Admin123`
- Commander: `moha` / `Admin123`
- Court User: `court` / `Admin123`

---

## 🎯 Performance Tests

### Test Response Times

**Expected Performance**:
- Report generation: < 2 seconds
- PDF generation: < 3 seconds
- Report list load: < 1 second
- Preview render: < 2 seconds

**Test Load**:
1. Generate 10 reports rapidly
2. Batch generate 5 PDFs
3. Load reports list with 20+ reports

---

## 🔒 Security Tests

### Test Authentication

1. **Logout and try to access**:
   ```
   http://localhost:8080/api/investigation/reports/10
   ```
   Expected: 401 Unauthorized

2. **Try to approve as investigator**:
   - Should fail with 403 Forbidden

3. **Try to edit another user's report**:
   - Should respect ownership

### Test Authorization

1. **Investigator permissions**:
   - ✅ Create, Edit own drafts
   - ❌ Approve reports
   - ✅ Sign own reports

2. **Commander permissions**:
   - ✅ All investigator permissions
   - ✅ Approve/Reject reports
   - ✅ View all reports

---

## 📝 Test Report Template

Use this template to document your testing:

```markdown
## Test Session: [Date]

**Tester**: [Name]
**Environment**: Development
**Browser**: [Chrome/Firefox/Safari]

### Tests Completed:
- [x] Test 1: Dashboard Access - PASS
- [x] Test 2: Case Selection - PASS
- [ ] Test 3: Generate PIR - FAIL (Issue: ...)

### Issues Found:
1. [Description]
   - Severity: High/Medium/Low
   - Steps to reproduce:
   - Expected vs Actual:

### Notes:
[Any additional observations]
```

---

## 🎉 All Tests Passing?

If all tests pass, your reports system is **production-ready**!

You can now:
1. Train users on the system
2. Import real case data
3. Generate professional reports
4. Submit cases to court with proper documentation

---

**Happy Testing!** 🚀
