# How Investigator Closes a Case - Complete Flow

## 📋 Step-by-Step Flow

### **Step 1: Investigator Opens Case Details**
- **File:** `public/dashboard.html`
- **Component:** Investigator clicks on a case to view details
- **Script Loaded:** `case-details-modal.js`

### **Step 2: "Close Case" Button Appears**
- **File:** `public/assets/js/case-details-modal.js` (Line 307)
- **Button Code:**
```javascript
<button class="btn btn-success" 
        onclick="showCloseCaseModal(${caseData.id}, '${caseData.case_number}')" 
        style="padding: 8px 16px;" 
        data-i18n="close_case">
    Close Case
</button>
```
- **When Shown:** Only for cases assigned to the investigator and in appropriate status

### **Step 3: Close Case Modal Opens**
- **File:** `public/assets/js/court-workflow.js` (Line 8)
- **Function:** `showCloseCaseModal(caseId, caseNumber)`
- **Modal Shows:**
  - **Closure Type Dropdown** (Required):
    - Option 1: `investigator_closed` - "Closed by Investigator (No Court Acknowledgment)"
    - Option 2: `closed_with_court_ack` - "Closed with Court Acknowledgment"
    - Option 3: `court_solved` - "Court Solved the Case"
  
  - **Closure Reason** (Required, minimum 20 characters)
  
  - **Conditional Fields** (Only if `closed_with_court_ack` selected):
    - Court Acknowledgment Number (Required)
    - Acknowledgment Date (Required)
    - Court Deadline (Required)
    - Acknowledgment Notes (Optional)
    - Upload Acknowledgment Document (Optional, PDF/Image)

### **Step 4: Investigator Fills Form and Submits**
- **File:** `public/assets/js/court-workflow.js` (Line 157)
- **Function:** `submitCloseCase(caseId, closureData)`
- **Two Paths:**

#### **Path A: Without Document Upload**
```javascript
investigationAPI.closeCase(caseId, dataWithoutFile)
```
- Uses: `POST /investigation/cases/{id}/close`
- Sends: JSON data

#### **Path B: With Document Upload**
```javascript
fetch(`${API_BASE_URL}/investigation/cases/${id}/close`, {
    method: 'POST',
    body: formData  // FormData with file
})
```
- Uses: Same endpoint
- Sends: FormData (multipart)

### **Step 5: API Endpoint Receives Request**
- **File:** `app/Controllers/Investigation/CaseController.php` (Line 268)
- **Method:** `closeCase($id)`
- **Route:** `POST /investigation/cases/{id}/close`

### **Step 6: Validation**
- **Required Fields:**
  - ✅ `closure_reason` (min 20 chars)
  - ✅ `closure_type` (must be: investigator_closed, closed_with_court_ack, court_solved)
  
- **Conditional Validation** (if `closed_with_court_ack`):
  - ✅ `court_acknowledgment_number`
  - ✅ `court_acknowledgment_date`
  - ✅ `court_acknowledgment_deadline`

### **Step 7: Database Update**
- **File:** `app/Controllers/Investigation/CaseController.php` (Lines 330-337)
- **Data Prepared:**
```php
$updateData = [
    'status' => 'closed',
    'closed_date' => date('Y-m-d H:i:s'),           // ✅ Current timestamp
    'closed_by' => $userId,                          // ✅ Investigator's user ID
    'closure_reason' => $input['closure_reason'],    // ✅ From form
    'closure_type' => $closureType,                  // ✅ From dropdown
    'investigation_completed_at' => date('Y-m-d H:i:s')
];
```

- **Court Status Set Based on Closure Type:**
  - `court_solved` → `court_status = 'court_closed'`
  - `closed_with_court_ack` → `court_status = 'court_assigned_back'`
  - `investigator_closed` → `court_status = 'not_sent'`

### **Step 8: Model Update**
- **File:** `app/Models/CaseModel.php` (Line 390 in controller)
- **Method:** `$caseModel->update($id, $updateData)`
- **Critical:** Fields MUST be in `$allowedFields` array (Line 8-27 in model)
- **✅ NOW FIXED:** Added closure fields to `$allowedFields`

### **Step 9: Additional Actions**
1. **Log Status Change** (Line 400-409)
   - Inserts into `case_status_history` table
   - Records: old status, new status, changed_by, reason

2. **Complete Case Assignments** (Line 412-418)
   - Updates `case_assignments` table
   - Sets status to 'completed'

3. **Handle Court Assignment** (Line 421-448)
   - If case was sent to court, completes court assignment
   - Sends notification to court user

4. **Transaction Complete** (Line 450-454)
   - Commits all changes
   - Returns success response

### **Step 10: Success Response**
```json
{
    "status": "success",
    "message": "Case closed successfully",
    "data": {
        "closure_type": "investigator_closed",
        "closure_reason": "..."
    }
}
```

### **Step 11: UI Updates**
- **File:** `public/assets/js/court-workflow.js` (Line 195-202)
- **Actions:**
  - Shows success message with SweetAlert
  - Reloads case details if modal is open
  - Updates dashboard to reflect case closure

---

## 🔍 Database Fields Updated

### **Always Set:**
| Field | Value | Source |
|-------|-------|--------|
| `status` | 'closed' | Hardcoded |
| `closed_date` | Current timestamp | `date('Y-m-d H:i:s')` |
| `closed_by` | User ID | From `$userId` |
| `closure_reason` | Text from form | User input |
| `closure_type` | Enum value | User selection |
| `court_status` | Based on type | Logic |
| `investigation_completed_at` | Current timestamp | `date('Y-m-d H:i:s')` |

### **Conditionally Set** (if `closed_with_court_ack`):
| Field | Value | Source |
|-------|-------|--------|
| `court_acknowledgment_number` | Text | User input |
| `court_acknowledgment_date` | Date | User input |
| `court_acknowledgment_deadline` | Date | User input |
| `court_acknowledgment_notes` | Text | User input (optional) |
| `court_acknowledgment_document` | File path | Uploaded file |

---

## 🎯 Key Points

1. **Entry Point:** Case details modal → "Close Case" button
2. **UI Logic:** `court-workflow.js` handles the modal and form
3. **API Endpoint:** `POST /investigation/cases/{id}/close`
4. **Controller:** `Investigation\CaseController::closeCase()`
5. **Model:** `CaseModel->update()` - **MUST have fields in $allowedFields**
6. **Database:** All closure fields are updated in a single transaction

---

## ⚠️ What Was Wrong

**Before Fix:**
```php
// CaseModel.php - $allowedFields array
protected $allowedFields = [
    ...,
    'closed_at',  // ❌ This exists but is legacy
    // ❌ MISSING: 'closed_date', 'closed_by', 'closure_reason', 'closure_type'
];
```

**Result:** Controller passed correct data → Model silently ignored it → Database never updated

**After Fix:**
```php
protected $allowedFields = [
    ...,
    'closed_at',
    'closed_date', 'closed_by', 'closure_reason', 'closure_type',  // ✅ Added
    'court_status', ...  // ✅ Added all court fields
];
```

**Result:** Controller passes data → Model accepts it → Database updates successfully ✅

---

## 📝 Summary

**The investigator closes a case through:**
1. Dashboard → View Case Details → Close Case Button
2. Fills modal form with closure type and reason
3. Submits → `investigationAPI.closeCase()`
4. Backend validates and updates via `CaseModel->update()`
5. **Success depends on:** `$allowedFields` in CaseModel containing all closure fields

**Fix Applied:** Added missing fields to `$allowedFields` in `CaseModel.php`

**Now:** Everything works end-to-end! ✅
