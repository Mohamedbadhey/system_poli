// Medical Examination Form - Enhanced with Auto-fill, Save/Load, and Digital Signature
// =====================================================================================

let currentCaseData = null;
let signaturePad = null;
let doctorSignaturePad = null;
let verifierSignaturePad = null;

// ============================================
// Initialize Form
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setupSignaturePads();
    
    // Check URL parameters for viewing a specific form
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    const viewMode = urlParams.get('view') || formId; // Support both ?id= and ?view=
    
    if (viewMode) {
        // Load medical form from database by ID in view-only mode
        console.log('📖 View-only mode for medical form ID:', viewMode);
        loadMedicalFormForView(viewMode);
    } else {
        // Check if user wants to auto-load last draft
        const autoLoadDraft = localStorage.getItem('medical_form_auto_load_draft');
        if (autoLoadDraft === 'true') {
            loadDraftIfExists();
        } else {
            // Show welcome message for new form
            showToast('Click "Select Case" to start a new form or "My Forms" to load saved', 'info');
        }
    }
    
    getCaseDataFromParent();
    loadReportHeaderImage();
    startAutoSave(); // Start auto-save every 10 seconds
});

// ============================================
// Get Case Data from Parent Window
// ============================================
function getCaseDataFromParent() {
    try {
        // Check if we're in an iframe and can access parent
        if (window.parent && window.parent !== window) {
            // Listen for case data from parent
            window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'CASE_DATA') {
                    currentCaseData = event.data.caseData;
                    autoFillCaseData(currentCaseData);
                }
            });
            
            // Request case data from parent
            window.parent.postMessage({ type: 'REQUEST_CASE_DATA' }, '*');
        }
    } catch (e) {
        console.log('Cannot access parent window - form will work standalone');
    }
}

// ============================================
// Auto-fill Case Data
// ============================================
function autoFillCaseData(caseData) {
    if (!caseData) return;
    
    // Store case ID for linking
    currentCaseData = caseData;
    
    // Auto-fill case number
    const caseNumberField = document.querySelector('input[name="case_number"]');
    if (caseNumberField && caseData.case_number) {
        caseNumberField.value = caseData.case_number;
    }
    
    // Auto-fill date
    const dateField = document.querySelector('input[name="report_date"]');
    if (dateField) {
        dateField.value = new Date().toISOString().split('T')[0];
    }
    
    // Auto-fill victim name
    const victimNameField = document.querySelector('input[name="victim_name"]');
    if (victimNameField && caseData.victim_name) {
        victimNameField.value = caseData.victim_name;
    }
    
    // Auto-fill accused name
    const accusedNameField = document.querySelector('input[name="accused_name"]');
    if (accusedNameField && caseData.accused_name) {
        accusedNameField.value = caseData.accused_name;
    }
    
    // Auto-fill location
    const locationField = document.querySelector('input[name="location"]');
    if (locationField && caseData.location) {
        locationField.value = caseData.location;
    }
    
    // Auto-fill incident date/time
    const incidentDateField = document.querySelector('input[name="incident_datetime"]');
    if (incidentDateField && caseData.incident_date) {
        incidentDateField.value = caseData.incident_date;
    }
    
    // Auto-fill police officer info from logged-in user
    const officerNameField = document.querySelector('input[name="officer_name"]');
    const officerRankField = document.querySelector('input[name="officer_rank"]');
    const officerPhoneField = document.querySelector('input[name="officer_phone"]');
    
    if (caseData.investigator) {
        if (officerNameField) officerNameField.value = caseData.investigator.name || '';
        if (officerRankField) officerRankField.value = caseData.investigator.rank || '';
        if (officerPhoneField) officerPhoneField.value = caseData.investigator.phone || '';
    }
    
    // Show party selection if persons available
    if (caseData.persons && caseData.persons.length > 0) {
        showPartySelection(caseData.persons);
    }
    
    showToast('Case information auto-filled successfully', 'success');
}

// ============================================
// Case Selection UI
// ============================================
function showCaseSelection() {
    document.getElementById('caseSelectionModal').style.display = 'block';
    loadAllCases();
}

function closeCaseSelection() {
    document.getElementById('caseSelectionModal').style.display = 'none';
}

function loadAllCases() {
    const container = document.getElementById('caseListContainer');
    container.innerHTML = '<div style="padding: 20px; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading cases...</div>';
    
    const baseUrl = window.location.origin;
    const endpoint = `${baseUrl}/investigation/cases`;
    
    fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success' && result.data) {
            displayCaseList(result.data);
        } else {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Failed to load cases</div>';
        }
    })
    .catch(error => {
        console.error('Error loading cases:', error);
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Error loading cases</div>';
    });
}

function displayCaseList(cases) {
    const container = document.getElementById('caseListContainer');
    
    console.log('Cases data:', cases); // Debug
    
    if (!cases || cases.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No cases found</div>';
        return;
    }
    
    let html = '<div style="padding: 0;">';
    
    cases.forEach((caseItem, index) => {
        // Handle different field names
        const caseNumber = caseItem.case_number || caseItem.case_no || caseItem.number || 'No Case Number';
        const title = caseItem.title || caseItem.description || caseItem.case_title || caseItem.incident_type || 'Untitled Case';
        const incidentDate = caseItem.incident_date || caseItem.date || caseItem.created_at || 'N/A';
        const location = caseItem.location || caseItem.incident_location || caseItem.place || 'N/A';
        const status = caseItem.status || 'unknown';
        
        const statusColor = status === 'open' || status === 'active' ? '#10b981' : 
                           status === 'closed' ? '#6b7280' : '#f59e0b';
        
        html += `
            <div class="case-item" data-case='${JSON.stringify(caseItem).replace(/'/g, "&apos;")}' style="
                padding: 15px 20px;
                border-bottom: 1px solid #e5e7eb;
                cursor: pointer;
                transition: background 0.2s;
            " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'" onclick="selectCase(this)">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 16px; color: #111; margin-bottom: 5px;">
                            <i class="fas fa-folder"></i> ${caseNumber}
                        </div>
                        <div style="color: #666; font-size: 14px; margin-bottom: 8px;">
                            ${title}
                        </div>
                        <div style="display: flex; gap: 15px; font-size: 13px; color: #888;">
                            <span><i class="fas fa-calendar"></i> ${incidentDate}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${location}</span>
                        </div>
                    </div>
                    <div>
                        <span style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${status.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function filterCases() {
    const searchTerm = document.getElementById('caseSearchInput').value.toLowerCase();
    const caseItems = document.querySelectorAll('.case-item');
    
    caseItems.forEach(item => {
        const caseData = JSON.parse(item.getAttribute('data-case'));
        const searchText = `${caseData.case_number} ${caseData.title} ${caseData.location}`.toLowerCase();
        
        if (searchText.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function selectCase(element) {
    const caseData = JSON.parse(element.getAttribute('data-case'));
    console.log('Selected case:', caseData);
    
    closeCaseSelection();
    
    // Load full case details including persons
    loadCaseWithPersons(caseData.id);
}

function loadCaseWithPersons(caseId) {
    const baseUrl = window.location.origin;
    const endpoint = `${baseUrl}/investigation/cases/${caseId}`;
    
    showToast('Loading case details...', 'info');
    
    fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success' && result.data) {
            currentCaseData = result.data;
            autoFillCaseData(result.data);
            
            // Load persons for this case
            loadCasePersons(caseId);
        } else {
            showToast('Failed to load case details', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading case:', error);
        showToast('Error loading case details', 'error');
    });
}

function loadCasePersons(caseId) {
    const baseUrl = window.location.origin;
    const endpoint = `${baseUrl}/investigation/persons`;
    
    fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success' && result.data && result.data.length > 0) {
            showPartySelectionModal(result.data);
        } else {
            showToast('No persons found for this case. Please add persons first.', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading persons:', error);
        showToast('Error loading case persons', 'error');
    });
}

// ============================================
// Party Selection UI
// ============================================
function showPartySelectionModal(persons) {
    const modal = document.getElementById('partySelectionModal');
    const container = document.getElementById('partyListContainer');
    
    console.log('Persons data:', persons); // Debug
    
    let html = '';
    
    persons.forEach((person, index) => {
        // Get name - try different field names
        const name = person.full_name || person.name || person.first_name + ' ' + person.last_name || 'Unknown';
        const age = person.age || person.date_of_birth || 'N/A';
        const gender = person.gender || person.sex || 'N/A';
        const phone = person.phone || person.phone_number || person.contact || 'N/A';
        const personType = person.person_type || person.role || person.type || 'other';
        
        const typeColor = personType.toLowerCase().includes('victim') || personType.toLowerCase().includes('accuser') ? '#10b981' : 
                         personType.toLowerCase().includes('suspect') || personType.toLowerCase().includes('accused') ? '#ef4444' : '#f59e0b';
        const typeIcon = personType.toLowerCase().includes('victim') || personType.toLowerCase().includes('accuser') ? 'fa-user-injured' : 
                        personType.toLowerCase().includes('suspect') || personType.toLowerCase().includes('accused') ? 'fa-user-secret' : 'fa-user';
        
        html += `
            <div onclick="selectParty(${index})" style="
                padding: 15px 20px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 15px;
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#f0f9ff';" 
               onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; font-size: 16px; color: #111; margin-bottom: 5px;">
                            <i class="fas ${typeIcon}"></i> ${name}
                        </div>
                        <div style="display: flex; gap: 15px; font-size: 13px; color: #666;">
                            <span><i class="fas fa-birthday-cake"></i> Age: ${age}</span>
                            <span><i class="fas fa-venus-mars"></i> ${gender}</span>
                            <span><i class="fas fa-phone"></i> ${phone}</span>
                        </div>
                    </div>
                    <div>
                        <span style="background: ${typeColor}; color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">
                            ${personType.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    modal.style.display = 'block';
    
    // Store persons for selection
    window.currentCasePersons = persons;
}

function selectParty(index) {
    const person = window.currentCasePersons[index];
    linkToParty(person);
    closePartySelection();
}

function closePartySelection() {
    document.getElementById('partySelectionModal').style.display = 'none';
}

function linkToParty(person) {
    console.log('Linking to party:', person); // Debug
    
    // Store party information
    if (!currentCaseData) currentCaseData = {};
    currentCaseData.linked_party = person;
    
    // Get name - try different field names
    const personName = person.full_name || person.name || (person.first_name ? person.first_name + ' ' + (person.last_name || '') : 'Unknown');
    const personAge = person.age || '';
    const personType = person.person_type || person.role || person.type || 'other';
    
    // Auto-fill patient name with selected party
    const patientNameField = document.querySelector('input[name="patient_name"]');
    if (patientNameField) {
        patientNameField.value = personName;
    }
    
    // Auto-fill age
    const ageField = document.querySelector('input[name="age"]');
    if (ageField && personAge) {
        ageField.value = personAge;
    }
    
    // Update victim/accused name based on person type
    if (personType.toLowerCase().includes('victim') || personType.toLowerCase().includes('accuser')) {
        const victimField = document.querySelector('input[name="victim_name"]');
        if (victimField) victimField.value = personName;
    } else if (personType.toLowerCase().includes('accused') || personType.toLowerCase().includes('suspect')) {
        const accusedField = document.querySelector('input[name="accused_name"]');
        if (accusedField) accusedField.value = personName;
    }
    
    // Show linked case info badge
    const linkedCaseInfo = document.getElementById('linkedCaseInfo');
    const linkedCaseText = document.getElementById('linkedCaseText');
    if (linkedCaseInfo && linkedCaseText && currentCaseData) {
        const caseNum = currentCaseData.case_number || currentCaseData.case_no || 'Unknown';
        linkedCaseText.textContent = `Case: ${caseNum} | ${personName} (${personType})`;
        linkedCaseInfo.style.display = 'inline-block';
    }
    
    showToast(`✓ Linked to: ${personName} (${personType})`, 'success');
    
    // Auto-save after linking
    autoSaveForm();
}

// ============================================
// Initialize Form Fields with Names
// ============================================
function initializeForm() {
    // Add IDs and names to form fields for easier access
    const formFields = [
        { selector: 'input:eq(0)', name: 'report_date', id: 'reportDate' },
        { selector: 'input:eq(1)', name: 'case_number', id: 'caseNumber' },
        { selector: 'input:eq(2)', name: 'hospital_name', id: 'hospitalName' },
        { selector: 'input:eq(3)', name: 'victim_name', id: 'victimName' },
        { selector: 'input:eq(4)', name: 'accused_name', id: 'accusedName' },
        { selector: 'input:eq(5)', name: 'age', id: 'age' },
        { selector: 'input:eq(6)', name: 'location', id: 'location' },
        { selector: 'input:eq(7)', name: 'incident_datetime', id: 'incidentDateTime' },
        { selector: 'input:eq(8)', name: 'police_report_datetime', id: 'policeReportDateTime' },
        { selector: 'textarea:eq(0)', name: 'crime_description', id: 'crimeDescription' },
        { selector: 'input:eq(9)', name: 'kidnapping_status', id: 'kidnappingStatus' },
        { selector: 'input:eq(10)', name: 'hospital_submission_date', id: 'hospitalSubmissionDate' },
        { selector: 'input:eq(11)', name: 'police_station', id: 'policeStation' },
        { selector: 'input:eq(12)', name: 'ob_number', id: 'obNumber' },
        { selector: 'input:eq(13)', name: 'officer_name', id: 'officerName' },
        { selector: 'input:eq(14)', name: 'officer_rank', id: 'officerRank' },
        { selector: 'input:eq(15)', name: 'officer_position', id: 'officerPosition' },
        { selector: 'input:eq(16)', name: 'officer_phone', id: 'officerPhone' },
    ];
    
    // Set current date automatically
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[name="report_date"], input[name="police_report_datetime"], input[name="hospital_submission_date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// ============================================
// Setup Event Listeners
// ============================================
function setupEventListeners() {
    // Auto-save on form change
    const formElements = document.querySelectorAll('input, textarea, select');
    formElements.forEach(element => {
        element.addEventListener('change', autoSaveForm);
        element.addEventListener('input', debounce(autoSaveForm, 1000));
    });
    
    // Load case from parent button
    const loadCaseBtn = document.getElementById('loadCaseBtn');
    if (loadCaseBtn) {
        loadCaseBtn.addEventListener('click', getCaseDataFromParent);
    }
    
    // Generate QR Code when case data is available
    generateQRCode();
}

// ============================================
// Save/Load Draft Functionality
// ============================================
let autoSaveInterval = null;

function startAutoSave() {
    // Auto-save every 10 seconds
    autoSaveInterval = setInterval(() => {
        autoSaveForm();
        console.log('Auto-saved at:', new Date().toLocaleTimeString());
    }, 10000); // 10 seconds
    
    console.log('Auto-save started - saving every 10 seconds');
}

function autoSaveForm() {
    const formData = collectFormData();
    localStorage.setItem('medical_exam_draft', JSON.stringify(formData));
    updateSaveStatus('Auto-saved at ' + new Date().toLocaleTimeString());
}

function collectFormData() {
    const formData = {};
    
    // Collect all input fields
    document.querySelectorAll('input[type="text"], input[type="date"], textarea').forEach(input => {
        if (input.name || input.id) {
            formData[input.name || input.id] = input.value;
        }
    });
    
    // Collect checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.name || checkbox.id) {
            formData[checkbox.name || checkbox.id] = checkbox.checked;
        }
    });
    
    // Save signature data
    if (signaturePad && !signaturePad.isEmpty()) {
        formData.officer_signature = signaturePad.toDataURL();
    }
    
    if (doctorSignaturePad && !doctorSignaturePad.isEmpty()) {
        formData.doctor_signature = doctorSignaturePad.toDataURL();
    }
    
    formData.saved_at = new Date().toISOString();
    formData.case_id = currentCaseData ? currentCaseData.id : null;
    
    return formData;
}

function loadDraftIfExists() {
    const draftData = localStorage.getItem('medical_exam_draft');
    if (draftData) {
        try {
            const formData = JSON.parse(draftData);
            loadFormData(formData);
            showToast('Draft loaded from ' + new Date(formData.saved_at).toLocaleString(), 'info');
        } catch (e) {
            console.error('Error loading draft:', e);
        }
    }
}

function loadFormData(formData) {
    // Load text inputs and textareas
    Object.keys(formData).forEach(key => {
        const element = document.querySelector(`[name="${key}"], #${key}`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = formData[key];
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = formData[key];
            }
        }
    });
    
    // Load signatures
    if (formData.officer_signature && signaturePad) {
        signaturePad.fromDataURL(formData.officer_signature);
    }
    
    if (formData.doctor_signature && doctorSignaturePad) {
        doctorSignaturePad.fromDataURL(formData.doctor_signature);
    }
}

function saveDraft() {
    const formData = collectFormData();
    
    // Save to localStorage with timestamp
    const savedForms = JSON.parse(localStorage.getItem('medical_exam_saved_forms') || '[]');
    
    // Create unique ID for this form
    const formId = Date.now();
    const caseNumber = document.getElementById('caseNumber')?.value || 'NO-CASE';
    const victimName = document.getElementById('victimName')?.value || 'Unknown';
    const patientName = document.querySelector('input[name="patient_name"]')?.value || 'Unknown';
    
    const savedForm = {
        id: formId,
        case_number: caseNumber,
        victim_name: victimName,
        patient_name: patientName,
        case_id: currentCaseData?.id || null,
        linked_party_id: currentCaseData?.linked_party?.id || null,
        linked_party_name: currentCaseData?.linked_party?.full_name || null,
        linked_party_type: currentCaseData?.linked_party?.person_type || null,
        saved_at: new Date().toISOString(),
        data: formData
    };
    
    savedForms.push(savedForm);
    localStorage.setItem('medical_exam_saved_forms', JSON.stringify(savedForms));
    
    // Also save as current draft
    localStorage.setItem('medical_exam_draft', JSON.stringify(formData));
    
    // Save to database via API if case is linked
    if (currentCaseData && currentCaseData.id) {
        saveMedicalFormToDatabase(savedForm).then(dbResult => {
            if (dbResult && dbResult.verification_code) {
                // QR code will be generated in saveMedicalFormToDatabase
                console.log('Form saved with verification code:', dbResult.verification_code);
            }
        });
    } else {
        console.log('Form saved to localStorage only - no case linked');
    }
    
    showToast(`Form saved! Case: ${caseNumber}`, 'success');
    updateSaveStatus('Saved at ' + new Date().toLocaleTimeString());
}

function loadDraft() {
    loadDraftIfExists();
}

// ============================================
// Start New Form
// ============================================
function startNewForm() {
    if (confirm('Start a new form? Any unsaved changes will be lost.')) {
        localStorage.removeItem('medical_exam_draft');
        localStorage.setItem('medical_form_auto_load_draft', 'false');
        location.reload();
    }
}

// ============================================
// Show Saved Forms Modal
// ============================================
function showSavedForms() {
    document.getElementById('savedFormsModal').style.display = 'block';
    loadSavedFormsList();
}

function closeSavedForms() {
    document.getElementById('savedFormsModal').style.display = 'none';
}

function loadSavedFormsList() {
    const container = document.getElementById('savedFormsListContainer');
    const savedForms = JSON.parse(localStorage.getItem('medical_exam_saved_forms') || '[]');
    
    if (savedForms.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <i class="fas fa-folder-open" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <p style="color: #999; font-size: 16px;">No saved forms yet</p>
                <p style="color: #ccc; font-size: 14px;">Click "Save Form" to save your work</p>
            </div>
        `;
        return;
    }
    
    let html = '<div style="padding: 0;">';
    
    savedForms.reverse().forEach((form, index) => {
        const actualIndex = savedForms.length - 1 - index; // Get original index
        const date = new Date(form.saved_at);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const caseNum = form.case_number || 'No Case Number';
        const patientName = form.patient_name || form.victim_name || 'Unknown Patient';
        const partyType = form.linked_party_type || 'Unknown';
        
        const typeColor = partyType.toLowerCase().includes('victim') || partyType.toLowerCase().includes('accuser') ? '#10b981' : 
                         partyType.toLowerCase().includes('accused') || partyType.toLowerCase().includes('suspect') ? '#ef4444' : '#f59e0b';
        
        html += `
            <div style="
                padding: 20px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 15px;
                transition: all 0.2s;
            " onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#f0f9ff';" 
               onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 18px; color: #111; margin-bottom: 8px;">
                            <i class="fas fa-folder"></i> ${caseNum}
                        </div>
                        <div style="color: #666; font-size: 14px; margin-bottom: 8px;">
                            <i class="fas fa-user"></i> Patient: ${patientName}
                        </div>
                        <div style="color: #888; font-size: 13px;">
                            <i class="fas fa-clock"></i> Saved: ${dateStr}
                        </div>
                    </div>
                    <div>
                        <span style="background: ${typeColor}; color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">
                            ${partyType.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="loadSavedFormByIndex(${actualIndex})" style="
                        flex: 1;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 600;
                    " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                        <i class="fas fa-edit"></i> Continue Editing
                    </button>
                    <button onclick="deleteSavedFormByIndex(${actualIndex})" style="
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 600;
                    " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function loadSavedFormByIndex(index) {
    const savedForms = JSON.parse(localStorage.getItem('medical_exam_saved_forms') || '[]');
    
    if (index >= 0 && index < savedForms.length) {
        // Set auto-load flag
        localStorage.setItem('medical_form_auto_load_draft', 'true');
        
        // Load the form data
        loadFormData(savedForms[index].data);
        
        // Also set as current draft
        localStorage.setItem('medical_exam_draft', JSON.stringify(savedForms[index].data));
        
        // Update linked case info if available
        if (savedForms[index].case_id) {
            currentCaseData = {
                id: savedForms[index].case_id,
                case_number: savedForms[index].case_number,
                linked_party: {
                    id: savedForms[index].linked_party_id,
                    full_name: savedForms[index].linked_party_name,
                    person_type: savedForms[index].linked_party_type
                }
            };
            
            // Show badge
            const linkedCaseInfo = document.getElementById('linkedCaseInfo');
            const linkedCaseText = document.getElementById('linkedCaseText');
            if (linkedCaseInfo && linkedCaseText) {
                linkedCaseText.textContent = `Case: ${savedForms[index].case_number} | ${savedForms[index].linked_party_name} (${savedForms[index].linked_party_type})`;
                linkedCaseInfo.style.display = 'inline-block';
            }
        }
        
        closeSavedForms();
        showToast('Form loaded! Continue editing...', 'success');
    } else {
        showToast('Invalid form selection', 'error');
    }
}

function deleteSavedFormByIndex(index) {
    if (confirm('Delete this saved form? This cannot be undone.')) {
        const savedForms = JSON.parse(localStorage.getItem('medical_exam_saved_forms') || '[]');
        savedForms.splice(index, 1);
        localStorage.setItem('medical_exam_saved_forms', JSON.stringify(savedForms));
        
        showToast('Form deleted', 'success');
        loadSavedFormsList(); // Refresh list
    }
}

function loadSavedForm() {
    showSavedForms();
}

function clearDraft() {
    startNewForm();
}

function viewSavedForms() {
    const savedForms = JSON.parse(localStorage.getItem('medical_exam_saved_forms') || '[]');
    
    if (savedForms.length === 0) {
        showToast('No saved forms found', 'info');
        return;
    }
    
    let formList = '=== SAVED MEDICAL EXAMINATION FORMS ===\n\n';
    savedForms.forEach((form, index) => {
        const date = new Date(form.saved_at).toLocaleString();
        formList += `${index + 1}. Case: ${form.case_number}\n`;
        formList += `   Victim: ${form.victim_name}\n`;
        formList += `   Saved: ${date}\n\n`;
    });
    
    alert(formList);
}

function deleteSavedForms() {
    if (confirm('Delete ALL saved forms? This cannot be undone!')) {
        localStorage.removeItem('medical_exam_saved_forms');
        showToast('All saved forms deleted', 'success');
    }
}

// ============================================
// Load Medical Form by ID from Database (View-Only Mode)
// ============================================
async function loadMedicalFormForView(formId) {
    console.log('📖 [VIEW] Loading medical form for viewing, ID:', formId);
    
    try {
        const baseUrl = window.location.origin;
        const endpoint = `${baseUrl}/investigation/medical-forms/${formId}`;
        
        showToast('Loading medical form...', 'info');
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('📖 [VIEW] Medical form API response:', result);
        
        if (result.status === 'success' && result.data) {
            const medicalForm = result.data;
            
            // Parse form_data JSON if it exists
            let formData = {};
            if (medicalForm.form_data) {
                try {
                    formData = typeof medicalForm.form_data === 'string' 
                        ? JSON.parse(medicalForm.form_data) 
                        : medicalForm.form_data;
                } catch (e) {
                    console.error('Error parsing form_data:', e);
                }
            }
            
            // Merge database fields with form_data
            const fullFormData = {
                ...formData,
                case_number: medicalForm.case_number || formData.case_number,
                patient_name: medicalForm.patient_name || formData.patient_name,
                hospital_name: medicalForm.hospital_name || formData.hospital_name,
                examination_date: medicalForm.examination_date || formData.examination_date,
                report_date: medicalForm.report_date || formData.report_date
            };
            
            // Load the form data
            loadFormData(fullFormData);
            
            // Set current case data if available
            if (medicalForm.case_id) {
                currentCaseData = {
                    id: medicalForm.case_id,
                    case_number: medicalForm.case_number,
                    linked_party: {
                        id: medicalForm.person_id,
                        full_name: medicalForm.patient_name,
                        person_type: medicalForm.party_type || 'Unknown'
                    }
                };
                
                // Show linked case badge
                const linkedCaseInfo = document.getElementById('linkedCaseInfo');
                const linkedCaseText = document.getElementById('linkedCaseText');
                if (linkedCaseInfo && linkedCaseText) {
                    linkedCaseText.textContent = `Case: ${medicalForm.case_number} | ${medicalForm.patient_name}`;
                    linkedCaseInfo.style.display = 'inline-block';
                }
            }
            
            // Make form read-only for viewing
            makeFormReadOnly();
            
            // Hide save buttons, show print button
            hideEditButtons();
            
            showToast('Medical form loaded in view-only mode', 'success');
            console.log('✅ [SUCCESS] View-only mode active');
            
        } else {
            throw new Error(result.message || 'Failed to load medical form');
        }
        
    } catch (error) {
        console.error('❌ [ERROR] Error loading medical form:', error);
        showToast('Error loading medical form: ' + error.message, 'error');
    }
}

// Make form read-only
function makeFormReadOnly() {
    // Disable all inputs
    const inputs = document.querySelectorAll('input, textarea, select, button');
    inputs.forEach(input => {
        // Don't disable print button
        if (!input.classList.contains('print-btn')) {
            input.disabled = true;
            input.style.backgroundColor = '#f9fafb';
            input.style.cursor = 'not-allowed';
        }
    });
    
    // Disable signature pads
    if (signaturePad) {
        signaturePad.off();
    }
    if (doctorSignaturePad) {
        doctorSignaturePad.off();
    }
    if (verifierSignaturePad) {
        verifierSignaturePad.off();
    }
    
    console.log('🔒 Form is now read-only');
}

// Hide edit buttons and show print button
function hideEditButtons() {
    // Hide save/edit buttons
    const saveButtons = document.querySelectorAll('button[onclick*="save"], button[onclick*="Save"]');
    saveButtons.forEach(btn => {
        if (!btn.classList.contains('print-btn')) {
            btn.style.display = 'none';
        }
    });
    
    // Add print button if not exists
    const controlsDiv = document.querySelector('.form-controls');
    if (controlsDiv) {
        const printBtn = document.createElement('button');
        printBtn.className = 'btn btn-primary print-btn';
        printBtn.innerHTML = '<i class="fas fa-print"></i> Print Form';
        printBtn.onclick = () => window.print();
        printBtn.style.cssText = `
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            margin: 20px auto;
            display: block;
        `;
        controlsDiv.appendChild(printBtn);
    }
}

// ============================================
// Load Medical Form by ID from Database (Edit Mode)
// ============================================
async function loadMedicalFormById(formId) {
    console.log('Loading medical form from database, ID:', formId);
    
    try {
        const baseUrl = window.location.origin;
        const endpoint = `${baseUrl}/investigation/medical-forms/${formId}`;
        
        showToast('Loading medical form...', 'info');
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('Medical form API response:', result);
        
        if (result.status === 'success' && result.data) {
            const medicalForm = result.data;
            
            // Parse form_data JSON if it exists
            let formData = {};
            if (medicalForm.form_data) {
                try {
                    formData = typeof medicalForm.form_data === 'string' 
                        ? JSON.parse(medicalForm.form_data) 
                        : medicalForm.form_data;
                } catch (e) {
                    console.error('Error parsing form_data:', e);
                }
            }
            
            // Merge database fields with form_data
            const fullFormData = {
                ...formData,
                case_number: medicalForm.case_number || formData.case_number,
                patient_name: medicalForm.patient_name || formData.patient_name,
                hospital_name: medicalForm.hospital_name || formData.hospital_name,
                examination_date: medicalForm.examination_date || formData.examination_date,
                report_date: medicalForm.report_date || formData.report_date
            };
            
            // Load the form data
            loadFormData(fullFormData);
            
            // Set current case data if available
            if (medicalForm.case_id) {
                currentCaseData = {
                    id: medicalForm.case_id,
                    case_number: medicalForm.case_number,
                    linked_party: {
                        id: medicalForm.person_id,
                        full_name: medicalForm.patient_name,
                        person_type: medicalForm.party_type || 'Unknown'
                    }
                };
                
                // Show linked case badge
                const linkedCaseInfo = document.getElementById('linkedCaseInfo');
                const linkedCaseText = document.getElementById('linkedCaseText');
                if (linkedCaseInfo && linkedCaseText) {
                    linkedCaseText.textContent = `Case: ${medicalForm.case_number} | ${medicalForm.patient_name}`;
                    linkedCaseInfo.style.display = 'inline-block';
                }
            }
            
            showToast('Medical form loaded successfully!', 'success');
            
        } else {
            throw new Error(result.message || 'Failed to load medical form');
        }
        
    } catch (error) {
        console.error('Error loading medical form:', error);
        showToast('Error loading medical form: ' + error.message, 'error');
    }
}

// ============================================
// Save Medical Form to Database
// ============================================
function saveMedicalFormToDatabase(formData) {
    console.log('Saving medical form to database...', formData);
    
    const baseUrl = window.location.origin;
    const endpoint = `${baseUrl}/investigation/medical-forms`;
    
    const payload = {
        case_id: formData.case_id,
        person_id: formData.linked_party_id,
        case_number: formData.case_number,
        patient_name: formData.patient_name,
        party_type: formData.linked_party_type,
        form_data: JSON.stringify(formData.data),
        report_date: formData.data.report_date || new Date().toISOString().split('T')[0],
        hospital_name: formData.data.hospital_name,
        examination_date: formData.data.examination_date
    };
    
    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('Medical form saved to database successfully');
            
            // Generate QR with direct link to view page using database ID
            if (result.data && result.data.id) {
                const viewUrl = `${baseUrl}/medical-forms/public/${result.data.id}`;
                generateQRCode(null, viewUrl);
                showToast('✓ Form saved with QR code!', 'success');
            } else {
                showToast('Form linked to case successfully!', 'success');
            }
            
            return result.data; // Return for promise chaining
        } else {
            console.error('Failed to save to database:', result.message);
            return null;
        }
    })
    .catch(error => {
        console.error('Error saving to database:', error);
        // Don't show error to user - localStorage save still works
        return null;
    });
}

// ============================================
// Digital Signature Pads
// ============================================
function setupSignaturePads() {
    // Officer signature pad
    const officerSigCanvas = document.getElementById('officerSignatureCanvas');
    if (officerSigCanvas) {
        signaturePad = new SignaturePad(officerSigCanvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        
        // Resize canvas
        resizeCanvas(officerSigCanvas);
        window.addEventListener('resize', () => resizeCanvas(officerSigCanvas));
    }
    
    // Doctor signature pad
    const doctorSigCanvas = document.getElementById('doctorSignatureCanvas');
    if (doctorSigCanvas) {
        doctorSignaturePad = new SignaturePad(doctorSigCanvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        
        // Resize canvas
        resizeCanvas(doctorSigCanvas);
        window.addEventListener('resize', () => resizeCanvas(doctorSigCanvas));
    }
    
    // Verifier signature pad
    const verifierSigCanvas = document.getElementById('verifierSignatureCanvas');
    if (verifierSigCanvas) {
        verifierSignaturePad = new SignaturePad(verifierSigCanvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        
        // Resize canvas
        resizeCanvas(verifierSigCanvas);
        window.addEventListener('resize', () => resizeCanvas(verifierSigCanvas));
    }
}

// ============================================
// Generate QR Code
// ============================================
function generateQRCode(verificationCode = null, qrUrl = null) {
    // If no QR URL provided, cannot generate
    if (!qrUrl) {
        console.log('No QR URL available - form needs to be saved to database first');
        return;
    }
    
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = ''; // Clear existing
        new QRCode(qrContainer, {
            text: qrUrl,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        console.log('QR Code generated with URL:', qrUrl);
    } else {
        // Fallback if QRCode library not available
        console.log('QR Code library not loaded, showing placeholder');
    }
}

function resizeCanvas(canvas) {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
}

function clearOfficerSignature() {
    if (signaturePad) {
        signaturePad.clear();
        autoSaveForm();
    }
}

function clearDoctorSignature() {
    if (doctorSignaturePad) {
        doctorSignaturePad.clear();
        autoSaveForm();
    }
}

function clearVerifierSignature() {
    if (verifierSignaturePad) {
        verifierSignaturePad.clear();
        autoSaveForm();
    }
}

// ============================================
// Load Report Header Image
// ============================================
function loadReportHeaderImage() {
    console.log('Loading report header image...');
    
    // Get the base URL from window location
    const baseUrl = window.location.origin;
    const endpoint = `${baseUrl}/api/report-settings/header-image`;
    
    console.log('Fetching from:', endpoint);
    
    fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('API Response:', result);
        if (result.status === 'success' && result.data && result.data.image_url) {
            console.log('Header image URL:', result.data.image_url);
            // Update header image
            const headerImageContainer = document.getElementById('headerImageContainer');
            if (headerImageContainer) {
                headerImageContainer.innerHTML = `<img src="${result.data.image_url}" alt="Header">`;
                console.log('Header image loaded successfully!');
            } else {
                console.log('Header image container not found');
            }
        } else {
            console.log('No header image data in response');
        }
    })
    .catch(error => {
        console.error('Error loading header image:', error);
    });
}

// ============================================
// Utility Functions
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updateSaveStatus(message) {
    const statusElement = document.getElementById('saveStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.opacity = '1';
        setTimeout(() => {
            statusElement.style.opacity = '0';
        }, 2000);
    }
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// Export Form Data
// ============================================
function exportFormAsJSON() {
    const formData = collectFormData();
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-exam-${formData.case_number || 'draft'}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importFormFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const formData = JSON.parse(event.target.result);
                loadFormData(formData);
                showToast('Form data imported successfully!', 'success');
            } catch (err) {
                showToast('Error importing form data', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================
// Print with Signatures
// ============================================
function printFormWithSignatures() {
    // Convert signatures to images before printing
    if (signaturePad && !signaturePad.isEmpty()) {
        const sigImage = signaturePad.toDataURL();
        const sigLine = document.querySelector('.signature-line');
        if (sigLine) {
            sigLine.style.backgroundImage = `url(${sigImage})`;
            sigLine.style.backgroundSize = 'contain';
            sigLine.style.backgroundRepeat = 'no-repeat';
        }
    }
    
    if (doctorSignaturePad && !doctorSignaturePad.isEmpty()) {
        const sigImage = doctorSignaturePad.toDataURL();
        const sigLines = document.querySelectorAll('.signature-line');
        if (sigLines[1]) {
            sigLines[1].style.backgroundImage = `url(${sigImage})`;
            sigLines[1].style.backgroundSize = 'contain';
            sigLines[1].style.backgroundRepeat = 'no-repeat';
        }
    }
    
    window.print();
}
