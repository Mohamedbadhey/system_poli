# Court Acknowledgment & Custody Documentation Tabs - Implementation Plan

## Requirements
Add two new tabs to the investigator case details modal:

### 1. Court Acknowledgment Tab
**Purpose**: Upload image of court permit/letter allowing investigation to continue

**Features**:
- Image upload field
- Display uploaded court letter/permit
- Upload date
- Delete/replace functionality

### 2. Custody Documentation Tab  
**Purpose**: Document when accused is taken into custody

**Features**:
- Upload accused photo
- Custody start date/time
- Custody location
- Upload court letter/evidence showing custody period
- Custody end date (if released)
- Notes

## Files to Modify

### 1. Frontend: `public/assets/js/case-details-modal.js`

**Location**: Lines 110-141 (tab buttons section)

**Add after line 140 (after conclusion tab)**:
```javascript
<button class="case-tab" onclick="switchCaseTab('court-acknowledgment')" data-i18n="court_acknowledgment">
    <i class="fas fa-file-contract"></i> ${t('court_acknowledgment')}
</button>
<button class="case-tab" onclick="switchCaseTab('custody-docs')" data-i18n="custody_documentation">
    <i class="fas fa-user-lock"></i> ${t('custody_documentation')}
</button>
```

**Location**: Lines 147-200 (tab content divs)

**Add before closing of case-tab-content div**:
```javascript
<!-- Court Acknowledgment Tab -->
<div id="tab-court-acknowledgment" class="tab-pane">
    <div class="tab-loading">
        <i class="fas fa-spinner fa-spin"></i> <span data-i18n="loading_data">${t('loading_data')}</span>
    </div>
</div>

<!-- Custody Documentation Tab -->
<div id="tab-custody-docs" class="tab-pane">
    <div class="tab-loading">
        <i class="fas fa-spinner fa-spin"></i> <span data-i18n="loading_data">${t('loading_data')}</span>
    </div>
</div>
```

### 2. Tab Switch Handler

**Find**: `function switchCaseTab(tabName)` (around line 750)

**Add cases for new tabs**:
```javascript
} else if (tabName === 'court-acknowledgment') {
    loadCourtAcknowledgment(window.currentCaseData.id);
} else if (tabName === 'custody-docs') {
    loadCustodyDocumentation(window.currentCaseData.id);
}
```

### 3. New Functions to Add

**Add to case-details-modal.js**:

```javascript
/**
 * Load Court Acknowledgment Tab
 */
async function loadCourtAcknowledgment(caseId) {
    try {
        const response = await api.get(`/investigation/cases/${caseId}/court-acknowledgment`);
        const data = response.data;
        
        let html = `
            <div class="court-acknowledgment-section">
                <div class="section-header">
                    <h3><i class="fas fa-file-contract"></i> Court Acknowledgment/Permit</h3>
                    <p>Upload the court letter or permit authorizing investigation</p>
                </div>
                
                ${data ? `
                    <div class="acknowledgment-display">
                        <img src="${data.file_path}" alt="Court Acknowledgment" style="max-width: 100%; border: 2px solid #ddd; border-radius: 8px;">
                        <p><strong>Uploaded:</strong> ${formatDateTime(data.uploaded_at)}</p>
                        <button class="btn btn-danger btn-sm" onclick="deleteCourtAcknowledgment(${caseId})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="showCourtAcknowledgmentUpload(${caseId})">
                            <i class="fas fa-upload"></i> Replace
                        </button>
                    </div>
                ` : `
                    <div class="upload-section">
                        <form id="courtAcknowledgmentForm" enctype="multipart/form-data">
                            <div class="form-group">
                                <label>Court Letter/Permit Image</label>
                                <input type="file" class="form-control" id="court_acknowledgment_file" accept="image/*" required>
                                <small>Max 10MB, JPG/PNG/PDF</small>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-upload"></i> Upload
                            </button>
                        </form>
                    </div>
                `}
            </div>
        `;
        
        $('#tab-court-acknowledgment').html(html);
        
        // Handle form submission
        $('#courtAcknowledgmentForm').on('submit', async function(e) {
            e.preventDefault();
            await uploadCourtAcknowledgment(caseId);
        });
        
    } catch (error) {
        console.error('Error loading court acknowledgment:', error);
        $('#tab-court-acknowledgment').html('<div class="alert alert-error">Failed to load</div>');
    }
}

/**
 * Upload Court Acknowledgment
 */
async function uploadCourtAcknowledgment(caseId) {
    const fileInput = document.getElementById('court_acknowledgment_file');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('error', 'Please select a file');
        return;
    }
    
    const formData = new FormData();
    formData.append('court_acknowledgment', file);
    
    try {
        const response = await api.upload(`/investigation/cases/${caseId}/court-acknowledgment`, formData);
        if (response.status === 'success') {
            showToast('success', 'Court acknowledgment uploaded successfully');
            loadCourtAcknowledgment(caseId);
        }
    } catch (error) {
        showToast('error', 'Failed to upload');
        console.error(error);
    }
}

/**
 * Load Custody Documentation Tab
 */
async function loadCustodyDocumentation(caseId) {
    try {
        const response = await api.get(`/investigation/cases/${caseId}/custody-documentation`);
        const docs = response.data || [];
        
        let html = `
            <div class="custody-docs-section">
                <div class="section-header">
                    <h3><i class="fas fa-user-lock"></i> Custody Documentation</h3>
                    <button class="btn btn-primary" onclick="showAddCustodyDocModal(${caseId})">
                        <i class="fas fa-plus"></i> Add Custody Record
                    </button>
                </div>
                
                <div class="custody-records">
                    ${docs.length === 0 ? '<p>No custody records yet</p>' : ''}
                    ${docs.map(doc => `
                        <div class="custody-record-card">
                            <div class="custody-header">
                                <h4>${doc.accused_name}</h4>
                                <span class="badge ${doc.custody_status === 'released' ? 'badge-success' : 'badge-warning'}">
                                    ${doc.custody_status}
                                </span>
                            </div>
                            <div class="custody-details">
                                ${doc.accused_photo ? `
                                    <img src="${doc.accused_photo}" alt="Accused Photo" class="accused-photo">
                                ` : ''}
                                <div class="custody-info">
                                    <p><strong>Custody Start:</strong> ${formatDateTime(doc.custody_start)}</p>
                                    <p><strong>Location:</strong> ${doc.custody_location}</p>
                                    ${doc.custody_end ? `<p><strong>Released:</strong> ${formatDateTime(doc.custody_end)}</p>` : ''}
                                    ${doc.court_order_image ? `
                                        <a href="${doc.court_order_image}" target="_blank" class="btn btn-sm btn-info">
                                            <i class="fas fa-file"></i> View Court Order
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                            ${doc.notes ? `<p><strong>Notes:</strong> ${doc.notes}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        $('#tab-custody-docs').html(html);
        
    } catch (error) {
        console.error('Error loading custody documentation:', error);
        $('#tab-custody-docs').html('<div class="alert alert-error">Failed to load</div>');
    }
}

/**
 * Show Add Custody Documentation Modal
 */
function showAddCustodyDocModal(caseId) {
    const modalHtml = `
        <div class="modal fade show" id="addCustodyModal" style="display: block;">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Custody Documentation</h3>
                        <button class="close" onclick="$('#addCustodyModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="custodyDocForm" enctype="multipart/form-data">
                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label>Select Accused Person *</label>
                                    <select class="form-control" id="accused_person_id" required>
                                        <option value="">Select...</option>
                                        <!-- Will be populated -->
                                    </select>
                                </div>
                                <div class="form-group col-md-6">
                                    <label>Custody Start Date/Time *</label>
                                    <input type="datetime-local" class="form-control" id="custody_start" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Custody Location *</label>
                                <input type="text" class="form-control" id="custody_location" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Accused Photo</label>
                                <input type="file" class="form-control" id="accused_photo" accept="image/*">
                            </div>
                            
                            <div class="form-group">
                                <label>Court Order/Evidence Image</label>
                                <input type="file" class="form-control" id="court_order_image" accept="image/*,application/pdf">
                            </div>
                            
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea class="form-control" id="custody_notes" rows="3"></textarea>
                            </div>
                            
                            <button type="submit" class="btn btn-primary">Save Custody Record</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHtml);
    
    // Load accused persons for the case
    loadAccusedForCustody(caseId);
    
    // Handle form submission
    $('#custodyDocForm').on('submit', async function(e) {
        e.preventDefault();
        await saveCustodyDocumentation(caseId);
    });
}

async function saveCustodyDocumentation(caseId) {
    const formData = new FormData();
    formData.append('accused_person_id', $('#accused_person_id').val());
    formData.append('custody_start', $('#custody_start').val());
    formData.append('custody_location', $('#custody_location').val());
    formData.append('notes', $('#custody_notes').val());
    
    const accusedPhoto = document.getElementById('accused_photo').files[0];
    if (accusedPhoto) formData.append('accused_photo', accusedPhoto);
    
    const courtOrder = document.getElementById('court_order_image').files[0];
    if (courtOrder) formData.append('court_order_image', courtOrder);
    
    try {
        const response = await api.upload(`/investigation/cases/${caseId}/custody-documentation`, formData);
        if (response.status === 'success') {
            showToast('success', 'Custody documentation saved');
            $('#addCustodyModal').remove();
            loadCustodyDocumentation(caseId);
        }
    } catch (error) {
        showToast('error', 'Failed to save');
        console.error(error);
    }
}
```

### 4. Backend API Endpoints

**File**: `app/Controllers/Investigation/CaseController.php`

**Add methods**:
```php
/**
 * Get court acknowledgment for case
 */
public function getCourtAcknowledgment($caseId)
{
    $db = \Config\Database::connect();
    $acknowledgment = $db->table('court_acknowledgments')
        ->where('case_id', $caseId)
        ->get()
        ->getRowArray();
    
    return $this->respond([
        'status' => 'success',
        'data' => $acknowledgment
    ]);
}

/**
 * Upload court acknowledgment
 */
public function uploadCourtAcknowledgment($caseId)
{
    $file = $this->request->getFile('court_acknowledgment');
    
    if ($file && $file->isValid()) {
        $newName = $file->getRandomName();
        $uploadPath = WRITEPATH . 'uploads/court-acknowledgments';
        
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        
        $file->move($uploadPath, $newName);
        
        $db = \Config\Database::connect();
        $db->table('court_acknowledgments')->insert([
            'case_id' => $caseId,
            'file_path' => 'writable/uploads/court-acknowledgments/' . $newName,
            'uploaded_at' => date('Y-m-d H:i:s'),
            'uploaded_by' => $this->request->userId
        ]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Court acknowledgment uploaded'
        ]);
    }
    
    return $this->fail('Invalid file');
}

/**
 * Get custody documentation for case
 */
public function getCustodyDocumentation($caseId)
{
    $db = \Config\Database::connect();
    $docs = $db->table('custody_documentation cd')
        ->select('cd.*, p.first_name, p.last_name')
        ->join('persons p', 'p.id = cd.accused_person_id')
        ->where('cd.case_id', $caseId)
        ->get()
        ->getResultArray();
    
    return $this->respond([
        'status' => 'success',
        'data' => $docs
    ]);
}

/**
 * Save custody documentation
 */
public function saveCustodyDocumentation($caseId)
{
    $input = $this->request->getPost();
    
    // Handle file uploads
    $accusedPhoto = null;
    $courtOrderImage = null;
    
    if ($file = $this->request->getFile('accused_photo')) {
        if ($file->isValid()) {
            $newName = $file->getRandomName();
            $uploadPath = WRITEPATH . 'uploads/custody-photos';
            if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
            $file->move($uploadPath, $newName);
            $accusedPhoto = 'writable/uploads/custody-photos/' . $newName;
        }
    }
    
    if ($file = $this->request->getFile('court_order_image')) {
        if ($file->isValid()) {
            $newName = $file->getRandomName();
            $uploadPath = WRITEPATH . 'uploads/court-orders';
            if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
            $file->move($uploadPath, $newName);
            $courtOrderImage = 'writable/uploads/court-orders/' . $newName;
        }
    }
    
    $db = \Config\Database::connect();
    $db->table('custody_documentation')->insert([
        'case_id' => $caseId,
        'accused_person_id' => $input['accused_person_id'],
        'custody_start' => $input['custody_start'],
        'custody_location' => $input['custody_location'],
        'accused_photo' => $accusedPhoto,
        'court_order_image' => $courtOrderImage,
        'notes' => $input['notes'] ?? null,
        'custody_status' => 'in_custody',
        'created_at' => date('Y-m-d H:i:s'),
        'created_by' => $this->request->userId
    ]);
    
    return $this->respond([
        'status' => 'success',
        'message' => 'Custody documentation saved'
    ]);
}
```

### 5. Routes

**File**: `app/Config/Routes.php`

**Add to investigation routes**:
```php
$routes->get('cases/(:num)/court-acknowledgment', 'Investigation\\CaseController::getCourtAcknowledgment/$1');
$routes->post('cases/(:num)/court-acknowledgment', 'Investigation\\CaseController::uploadCourtAcknowledgment/$1');
$routes->get('cases/(:num)/custody-documentation', 'Investigation\\CaseController::getCustodyDocumentation/$1');
$routes->post('cases/(:num)/custody-documentation', 'Investigation\\CaseController::saveCustodyDocumentation/$1');
```

### 6. Database Tables

**Create migration SQL**:

```sql
-- Court Acknowledgments Table
CREATE TABLE IF NOT EXISTS `court_acknowledgments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `case_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` datetime NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `case_id` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Custody Documentation Table
CREATE TABLE IF NOT EXISTS `custody_documentation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `case_id` int(11) NOT NULL,
  `accused_person_id` int(11) NOT NULL,
  `custody_start` datetime NOT NULL,
  `custody_end` datetime DEFAULT NULL,
  `custody_location` varchar(255) NOT NULL,
  `accused_photo` varchar(255) DEFAULT NULL,
  `court_order_image` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `custody_status` enum('in_custody','released') DEFAULT 'in_custody',
  `created_at` datetime NOT NULL,
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `case_id` (`case_id`),
  KEY `accused_person_id` (`accused_person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7. Translations

**Add to `app/Language/en/App.php` and `app/Language/so/App.php`**:
- `court_acknowledgment`
- `custody_documentation`
- Plus other labels

## Summary
This implementation adds complete court acknowledgment and custody documentation tracking to the investigator case details modal with image uploads and comprehensive record keeping.
