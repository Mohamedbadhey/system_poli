// Medical Examination Form - Database Version (No localStorage)
// =====================================================================================

let currentCaseData = null;
let currentFormId = null; // Track if editing existing form
let signaturePad = null;
let doctorSignaturePad = null;
let verifierSignaturePad = null;
let autoSaveInterval = null;

// ============================================
// Initialize Form
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setupSignaturePads();
    
    // Check if editing existing form or viewing
    const urlParams = new URLSearchParams(window.location.search);
    const editFormId = urlParams.get('edit');
    const viewFormId = urlParams.get('view');
    
    if (editFormId) {
        // Load form for editing
        loadFormForEditing(editFormId);
    } else if (viewFormId) {
        // Load form for viewing/printing
        loadFormForViewing(viewFormId);
    } else {
        // Show welcome message for new form
        showToast('Click "Select Case" to start a new form or "My Forms" to load saved', 'info');
    }
    
    getCaseDataFromParent();
    loadReportHeaderImage();
    // Auto-save disabled - user must manually save
    // startAutoSave();
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
    if (officerNameField) {
        fetchCurrentUser().then(user => {
            if (user) {
                officerNameField.value = user.full_name || user.username;
                
                const badgeField = document.querySelector('input[name="officer_badge"]');
                if (badgeField && user.badge_number) {
                    badgeField.value = user.badge_number;
                }
            }
        }).catch(err => {
            console.log('Could not fetch user info:', err);
            // Not critical - user can manually enter
        });
    }
    
    // Show linked case badge
    const linkedCaseInfo = document.getElementById('linkedCaseInfo');
    const linkedCaseText = document.getElementById('linkedCaseText');
    if (linkedCaseInfo && linkedCaseText && caseData.linked_party) {
        linkedCaseText.textContent = `Case: ${caseData.case_number} | ${caseData.linked_party.full_name} (${caseData.linked_party.person_type})`;
        linkedCaseInfo.style.display = 'inline-block';
    }
    
    showToast(`Form linked to Case ${caseData.case_number}`, 'success');
}

// ============================================
// Fetch Current User
// ============================================
async function fetchCurrentUser() {
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.status === 'success') {
                return result.data;
            }
        } else {
            console.warn('Auth endpoint returned:', response.status);
        }
    } catch (error) {
        console.warn('Error fetching user (non-critical):', error.message);
    }
    return null;
}

// ============================================
// Initialize Form
// ============================================
function initializeForm() {
    // Set today's date as default
    const reportDateField = document.querySelector('input[name="report_date"]');
    if (reportDateField && !reportDateField.value) {
        reportDateField.value = new Date().toISOString().split('T')[0];
    }
    
    const examDateField = document.querySelector('input[name="examination_date"]');
    if (examDateField && !examDateField.value) {
        examDateField.value = new Date().toISOString().split('T')[0];
    }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Save button
    const saveBtn = document.getElementById('saveDraftBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveDraft);
    }
    
    // Load button
    const loadBtn = document.getElementById('loadSavedFormBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', showSavedForms);
    }
    
    // New form button
    const newFormBtn = document.getElementById('newFormBtn');
    if (newFormBtn) {
        newFormBtn.addEventListener('click', startNewForm);
    }
    
    // Print button
    const printBtn = document.getElementById('printFormBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printForm);
    }
    
    // Additional print button (if exists)
    const printFormWithSigBtn = document.querySelector('button[onclick="printFormWithSignatures()"]');
    if (printFormWithSigBtn) {
        printFormWithSigBtn.onclick = printForm;
    }
    
    // Select case button
    const selectCaseBtn = document.getElementById('selectCaseBtn');
    if (selectCaseBtn) {
        selectCaseBtn.addEventListener('click', openCaseSelector);
    }
}

// ============================================
// Setup Signature Pads
// ============================================
function setupSignaturePads() {
    // Officer signature
    const canvas1 = document.getElementById('signatureCanvas');
    if (canvas1) {
        signaturePad = new SignaturePad(canvas1, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
        
        const clearBtn1 = document.getElementById('clearSignature');
        if (clearBtn1) {
            clearBtn1.addEventListener('click', () => signaturePad.clear());
        }
    }
    
    // Doctor signature
    const canvas2 = document.getElementById('doctorSignatureCanvas');
    if (canvas2) {
        doctorSignaturePad = new SignaturePad(canvas2, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
        
        const clearBtn2 = document.getElementById('clearDoctorSignature');
        if (clearBtn2) {
            clearBtn2.addEventListener('click', () => doctorSignaturePad.clear());
        }
    }
    
    // Verifier signature
    const canvas3 = document.getElementById('verifierSignatureCanvas');
    if (canvas3) {
        verifierSignaturePad = new SignaturePad(canvas3, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
        
        const clearBtn3 = document.getElementById('clearVerifierSignature');
        if (clearBtn3) {
            clearBtn3.addEventListener('click', () => verifierSignaturePad.clear());
        }
    }
}

// ============================================
// Load Report Header Image
// ============================================
function loadReportHeaderImage() {
    const baseUrl = window.location.origin;
    const headerImg = document.getElementById('reportHeaderImage');
    
    if (headerImg) {
        fetch(`${baseUrl}/api/report-settings/header-image`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success' && result.data && result.data.image_url) {
                headerImg.src = result.data.image_url;
                headerImg.style.display = 'block';
                console.log('Header image loaded:', result.data.image_url);
            } else {
                console.log('No header image configured');
            }
        })
        .catch(error => {
            console.log('No custom header image set:', error);
        });
    }
}

// ============================================
// Open Case Selector Modal
// ============================================
function openCaseSelector() {
    const baseUrl = window.location.origin;
    
    // Fetch assigned cases for the investigator
    fetch(`${baseUrl}/investigation/cases`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            // Fetch full details for each case including parties
            fetchCasesWithParties(result.data);
        } else {
            showToast('Failed to load cases', 'error');
        }
    })
    .catch(error => {
        console.error('Error fetching cases:', error);
        showToast('Error loading cases', 'error');
    });
}

async function fetchCasesWithParties(cases) {
    const baseUrl = window.location.origin;
    
    // Fetch full details for each case
    const casesWithParties = await Promise.all(
        cases.map(async (caseItem) => {
            try {
                const response = await fetch(`${baseUrl}/investigation/cases/${caseItem.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();
                if (result.status === 'success') {
                    return result.data;
                }
            } catch (error) {
                console.error('Error fetching case details:', error);
            }
            return caseItem;
        })
    );
    
    displayCaseSelectorModal(casesWithParties);
}

function displayCaseSelectorModal(cases) {
    let modalHtml = `
        <div id="caseSelectorModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 8px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-bottom: 20px;">Select Case & Person for Medical Examination</h3>
                <div style="margin-bottom: 20px;">
                    <input type="text" id="caseSearchInput" placeholder="Search by case number..." 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div id="casesList">
    `;
    
    cases.forEach(caseItem => {
        const parties = caseItem.parties || [];
        
        modalHtml += `
            <div class="case-item" style="padding: 15px; margin-bottom: 15px; border: 2px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #007bff;">
                    <strong style="font-size: 16px; color: #007bff;">${caseItem.case_number}</strong><br>
                    <small style="color: #666;">Crime: ${caseItem.crime_type || 'N/A'}</small> | 
                    <small style="color: #666;">Status: ${caseItem.status}</small>
                </div>
                <div style="margin-top: 10px;">
                    <strong style="color: #333;">Select Person:</strong>
        `;
        
        if (parties.length > 0) {
            parties.forEach(party => {
                const fullName = `${party.first_name} ${party.middle_name || ''} ${party.last_name}`.trim();
                const typeColor = party.person_type === 'accused' ? '#dc3545' : 
                                 party.person_type === 'accuser' ? '#28a745' : '#6c757d';
                const typeIcon = party.person_type === 'accused' ? '⚠️' : 
                                party.person_type === 'accuser' ? '👤' : '👁️';
                
                modalHtml += `
                    <div onclick="selectCaseAndPerson(${caseItem.id}, ${party.person_id}, '${fullName}', '${party.person_type}')" 
                         style="padding: 10px; margin: 5px 0; border: 1px solid ${typeColor}; border-radius: 4px; cursor: pointer; background: white; transition: all 0.3s;"
                         onmouseover="this.style.backgroundColor='#e8f4f8'; this.style.transform='scale(1.02)'" 
                         onmouseout="this.style.backgroundColor='white'; this.style.transform='scale(1)'">
                        <span style="font-size: 18px;">${typeIcon}</span>
                        <strong style="color: ${typeColor}; text-transform: capitalize;">${party.person_type}</strong>: 
                        <span style="color: #333;">${fullName}</span>
                        <br>
                        <small style="color: #666;">DOB: ${party.date_of_birth || 'N/A'} | Gender: ${party.gender || 'N/A'}</small>
                    </div>
                `;
            });
        } else {
            modalHtml += `
                <div style="padding: 10px; margin: 5px 0; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
                    <small style="color: #856404;">No persons added to this case yet. Add persons first or select another case.</small>
                </div>
            `;
        }
        
        modalHtml += `
                </div>
            </div>
        `;
    });
    
    if (cases.length === 0) {
        modalHtml += `
            <div style="padding: 20px; text-align: center; color: #666;">
                <p>No cases found. Please check back later.</p>
            </div>
        `;
    }
    
    modalHtml += `
                </div>
                <button onclick="closeCaseSelector()" style="margin-top: 20px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add search functionality
    document.getElementById('caseSearchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.case-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

function selectCaseAndPerson(caseId, personId, personName, personType) {
    const baseUrl = window.location.origin;
    
    console.log('=== SELECT CASE AND PERSON ===');
    console.log('Case ID:', caseId);
    console.log('Person ID:', personId);
    console.log('Person Name:', personName);
    console.log('Person Type:', personType);
    
    fetch(`${baseUrl}/investigation/cases/${caseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        console.log('=== CASE DATA RECEIVED ===');
        console.log('Full result:', result);
        
        if (result.status === 'success') {
            currentCaseData = result.data;
            
            console.log('Case Data:', currentCaseData);
            console.log('Parties in case:', currentCaseData.parties);
            
            // Debug: Show first party structure if available
            if (currentCaseData.parties && currentCaseData.parties.length > 0) {
                console.log('First party structure:', currentCaseData.parties[0]);
                console.log('First party keys:', Object.keys(currentCaseData.parties[0]));
                console.log('Looking for person_id:', personId, 'type:', typeof personId);
                
                // Show all person IDs in parties
                currentCaseData.parties.forEach((p, idx) => {
                    console.log(`Party ${idx}:`, {
                        id: p.id,
                        person_id: p.person_id,
                        party_id: p.party_id,
                        first_name: p.first_name,
                        person_type: p.person_type
                    });
                });
            }
            
            // Try multiple possible ID field names
            let selectedPerson = currentCaseData.parties?.find(p => p.person_id === personId);
            
            // If not found, try with 'id' field
            if (!selectedPerson) {
                console.log('Not found with person_id, trying with id field...');
                selectedPerson = currentCaseData.parties?.find(p => p.id === personId);
            }
            
            // If still not found, try comparing as strings
            if (!selectedPerson) {
                console.log('Not found with id, trying string comparison...');
                selectedPerson = currentCaseData.parties?.find(p => 
                    String(p.person_id) === String(personId) || 
                    String(p.id) === String(personId)
                );
            }
            
            console.log('=== SELECTED PERSON DATA ===');
            console.log('Found person:', selectedPerson);
            console.log('Person fields:', selectedPerson ? Object.keys(selectedPerson) : 'NOT FOUND');
            
            if (selectedPerson) {
                console.log('Person Details:');
                console.log('  - first_name:', selectedPerson.first_name);
                console.log('  - middle_name:', selectedPerson.middle_name);
                console.log('  - last_name:', selectedPerson.last_name);
                console.log('  - date_of_birth:', selectedPerson.date_of_birth);
                console.log('  - gender:', selectedPerson.gender);
                console.log('  - address:', selectedPerson.address);
                console.log('  - phone:', selectedPerson.phone);
                console.log('  - national_id:', selectedPerson.national_id);
                console.log('  - person_id:', selectedPerson.person_id);
                console.log('  - person_type:', selectedPerson.person_type);
            }
            
            // Add selected person info to case data
            currentCaseData.selected_person = {
                id: personId,
                name: personName,
                type: personType,
                details: selectedPerson // Full person details
            };
            
            // Auto-fill form with case and person data
            autoFillCaseData(currentCaseData);
            
            // Auto-fill person details
            if (selectedPerson) {
                console.log('=== STARTING PERSON AUTO-FILL ===');
                populatePersonDetails(selectedPerson, personType);
            } else {
                console.warn('⚠️ Selected person not found in parties array!');
                showToast('Warning: Person details not fully loaded', 'warning');
            }
            
            // Update linked case badge
            const linkedCaseInfo = document.getElementById('linkedCaseInfo');
            const linkedCaseText = document.getElementById('linkedCaseText');
            if (linkedCaseInfo && linkedCaseText) {
                linkedCaseText.textContent = `Case: ${currentCaseData.case_number} | Patient: ${personName} (${personType})`;
                linkedCaseInfo.style.display = 'inline-block';
            }
            
            closeCaseSelector();
            showToast(`Medical form linked to ${personName}`, 'success');
        } else {
            console.error('Case fetch failed:', result);
        }
    })
    .catch(error => {
        console.error('Error fetching case:', error);
        showToast('Error loading case details', 'error');
    });
}

// New function to populate person details into form
function populatePersonDetails(person, personType) {
    // Full name
    const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.trim();
    
    // Patient name (multiple fields)
    const patientNameField = document.querySelector('input[name="patient_name"]');
    if (patientNameField) {
        patientNameField.value = fullName;
    }
    
    // Victim/Accused names based on person type
    if (personType === 'accuser' || personType === 'victim') {
        const victimNameField = document.querySelector('input[name="victim_name"]');
        if (victimNameField) {
            victimNameField.value = fullName;
        }
    } else if (personType === 'accused') {
        const accusedNameField = document.querySelector('input[name="accused_name"]');
        if (accusedNameField) {
            accusedNameField.value = fullName;
        }
    }
    
    // Age (calculate from date of birth)
    if (person.date_of_birth) {
        const dob = new Date(person.date_of_birth);
        const today = new Date();
        const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
        
        const ageField = document.querySelector('input[name="age"]');
        if (ageField) {
            ageField.value = age + ' years';
        }
    }
    
    // Gender
    if (person.gender) {
        // Note: The form doesn't have a specific gender field, but we can add it to notes
        console.log('Person gender:', person.gender);
    }
    
    // Address/Location
    if (person.address) {
        const locationField = document.querySelector('input[name="location"]');
        if (locationField && !locationField.value) {
            locationField.value = person.address;
        }
    }
    
    // Phone number
    if (person.phone) {
        // Add to notes or reference field
        const referenceField = document.querySelector('input[name="reference"]');
        if (referenceField && !referenceField.value) {
            referenceField.value = `Contact: ${person.phone}`;
        }
    }
    
    // National ID (add to admission number or reference)
    if (person.national_id) {
        const admissionField = document.querySelector('input[name="admission_number"]');
        if (admissionField && !admissionField.value) {
            admissionField.value = person.national_id;
        }
    }
    
    // Set examination date to today
    const examDateField = document.querySelector('input[name="examination_date"]');
    if (examDateField && !examDateField.value) {
        examDateField.value = new Date().toISOString().split('T')[0];
    }
    
    // Set examination time to now
    const examTimeField = document.querySelector('input[name="examination_time"]');
    if (examTimeField && !examTimeField.value) {
        const now = new Date();
        examTimeField.value = now.toTimeString().slice(0, 5); // HH:MM format
    }
    
    console.log('Populated person details:', {
        name: fullName,
        age: person.date_of_birth ? 'calculated' : 'N/A',
        gender: person.gender,
        address: person.address,
        phone: person.phone,
        national_id: person.national_id
    });
}

function closeCaseSelector() {
    const modal = document.getElementById('caseSelectorModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// Auto-save Form (Database) - DISABLED
// ============================================
// Auto-save has been disabled to prevent creating duplicate forms
// Users must manually click "Save Form" button
function startAutoSave() {
    console.log('Auto-save is disabled. Users must manually save the form.');
}

function autoSaveForm() {
    // Auto-save disabled
    return;
}

function collectFormData() {
    const formData = {};
    
    console.log('=== COLLECTING FORM DATA ===');
    
    // Collect all input fields (text, date, number, time)
    let textFieldCount = 0;
    document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], input[type="time"], textarea').forEach(input => {
        if (input.name || input.id) {
            const fieldName = input.name || input.id;
            formData[fieldName] = input.value;
            if (input.value) {
                textFieldCount++;
                console.log(`Text/Date field: ${fieldName} = "${input.value}"`);
            }
        }
    });
    console.log(`✓ Collected ${textFieldCount} text/date/textarea fields with values`);
    
    // Collect checkboxes
    let checkboxCount = 0;
    let checkedCount = 0;
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.name || checkbox.id) {
            const fieldName = checkbox.name || checkbox.id;
            formData[fieldName] = checkbox.checked;
            checkboxCount++;
            if (checkbox.checked) {
                checkedCount++;
                console.log(`Checkbox: ${fieldName} = CHECKED`);
            }
        }
    });
    console.log(`✓ Collected ${checkboxCount} checkboxes (${checkedCount} checked)`);
    
    // Collect radio buttons
    let radioCount = 0;
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        if (radio.name) {
            formData[radio.name] = radio.value;
            radioCount++;
            console.log(`Radio: ${radio.name} = "${radio.value}"`);
        }
    });
    console.log(`✓ Collected ${radioCount} radio button selections`);
    
    // Collect select dropdowns
    let selectCount = 0;
    document.querySelectorAll('select').forEach(select => {
        if (select.name || select.id) {
            const fieldName = select.name || select.id;
            formData[fieldName] = select.value;
            if (select.value) {
                selectCount++;
                console.log(`Select: ${fieldName} = "${select.value}"`);
            }
        }
    });
    console.log(`✓ Collected ${selectCount} select dropdowns with values`);
    
    // Save signature data
    let signatureCount = 0;
    if (signaturePad && !signaturePad.isEmpty()) {
        formData.officer_signature = signaturePad.toDataURL();
        signatureCount++;
        console.log('✓ Officer signature captured');
    }
    
    if (doctorSignaturePad && !doctorSignaturePad.isEmpty()) {
        formData.doctor_signature = doctorSignaturePad.toDataURL();
        signatureCount++;
        console.log('✓ Doctor signature captured');
    }
    
    if (verifierSignaturePad && !verifierSignaturePad.isEmpty()) {
        formData.verifier_signature = verifierSignaturePad.toDataURL();
        signatureCount++;
        console.log('✓ Verifier signature captured');
    }
    console.log(`✓ Collected ${signatureCount} signatures`);
    
    formData.saved_at = new Date().toISOString();
    formData.case_id = currentCaseData ? currentCaseData.id : null;
    
    console.log('=== COLLECTION COMPLETE ===');
    console.log(`TOTAL: ${Object.keys(formData).length} fields collected`);
    console.log('Full formData object:', formData);
    
    return formData;
}

function loadFormData(formData) {
    console.log('=== LOADING FORM DATA ===');
    console.log('Received formData:', formData);
    
    // Parse form_data if it's a string
    let parsedData = formData;
    if (typeof formData.form_data === 'string') {
        try {
            parsedData = JSON.parse(formData.form_data);
            console.log('Parsed form_data from JSON string');
        } catch (e) {
            console.error('Error parsing form data:', e);
            return;
        }
    } else if (formData.form_data && typeof formData.form_data === 'object') {
        parsedData = formData.form_data;
        console.log('Using form_data object directly');
    }
    
    console.log('Data to load:', parsedData);
    console.log('Field count:', Object.keys(parsedData).length);
    
    let loadedTextFields = 0;
    let loadedCheckboxes = 0;
    let loadedRadios = 0;
    let notFoundFields = [];
    
    // Load text inputs and textareas
    Object.keys(parsedData).forEach(key => {
        const element = document.querySelector(`[name="${key}"], #${key}`);
        
        // Debug: Log what we're trying to find
        if (key.includes('pregnant') || key.includes('eyes') || key.includes('intoxicated')) {
            console.log(`Looking for checkbox: ${key}, Found:`, element, 'Value:', parsedData[key]);
        }
        
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = parsedData[key];
                if (parsedData[key]) {
                    loadedCheckboxes++;
                    console.log(`✓ Loaded checkbox: ${key} = CHECKED`);
                } else {
                    console.log(`○ Loaded checkbox: ${key} = UNCHECKED`);
                }
            } else if (element.type === 'radio') {
                if (element.value === parsedData[key]) {
                    element.checked = true;
                    loadedRadios++;
                    console.log(`Loaded radio: ${key} = "${parsedData[key]}"`);
                }
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                element.value = parsedData[key];
                if (parsedData[key]) {
                    loadedTextFields++;
                    console.log(`Loaded field: ${key} = "${parsedData[key]}"`);
                }
            }
        } else {
            // Field not found in DOM
            if (key !== 'saved_at' && key !== 'case_id' && !key.includes('signature')) {
                notFoundFields.push(key);
                // Debug checkbox fields specifically
                if (key.includes('yes') || key.includes('no') || key.includes('checkbox')) {
                    console.warn(`❌ Checkbox field not found: ${key}`);
                }
            }
        }
    });
    
    console.log(`✓ Loaded ${loadedTextFields} text/date/textarea fields`);
    console.log(`✓ Loaded ${loadedCheckboxes} checked checkboxes`);
    console.log(`✓ Loaded ${loadedRadios} radio selections`);
    
    if (notFoundFields.length > 0) {
        console.warn(`⚠️ ${notFoundFields.length} fields not found in DOM:`, notFoundFields);
    }
    
    // Load signatures
    let loadedSignatures = 0;
    if (parsedData.officer_signature && signaturePad) {
        signaturePad.fromDataURL(parsedData.officer_signature);
        loadedSignatures++;
        console.log('✓ Loaded officer signature');
    }
    
    if (parsedData.doctor_signature && doctorSignaturePad) {
        doctorSignaturePad.fromDataURL(parsedData.doctor_signature);
        loadedSignatures++;
        console.log('✓ Loaded doctor signature');
    }
    
    if (parsedData.verifier_signature && verifierSignaturePad) {
        verifierSignaturePad.fromDataURL(parsedData.verifier_signature);
        loadedSignatures++;
        console.log('✓ Loaded verifier signature');
    }
    console.log(`✓ Loaded ${loadedSignatures} signatures`);
    
    console.log('=== LOAD COMPLETE ===');
}

// ============================================
// Save Form to Database
// ============================================
function saveDraft() {
    const formData = collectFormData();
    
    if (!currentCaseData || !currentCaseData.id) {
        showToast('Please select a case first', 'warning');
        openCaseSelector();
        return;
    }
    
    saveMedicalFormToDatabase(formData, false); // false = show success message
}

function saveMedicalFormToDatabase(formData, silent = false) {
    const baseUrl = window.location.origin;
    const endpoint = `${baseUrl}/investigation/medical-forms`;
    
    const patientName = document.querySelector('input[name="patient_name"]')?.value || 
                        document.querySelector('input[name="victim_name"]')?.value || 
                        '';
    
    console.log('=== SAVE TO DATABASE ===');
    console.log('currentCaseData:', currentCaseData);
    console.log('currentCaseData.id:', currentCaseData?.id);
    console.log('Patient name:', patientName);
    console.log('Silent mode:', silent);
    
    // Validate required fields before sending
    if (!currentCaseData || !currentCaseData.id) {
        console.error('❌ Validation failed: No case data or case ID');
        if (!silent) {
            showToast('Please select a case first', 'warning');
        }
        return;
    }
    
    if (!patientName || patientName.trim() === '') {
        console.error('❌ Validation failed: No patient name');
        if (!silent) {
            showToast('Please enter patient name', 'warning');
        }
        return;
    }
    
    console.log('✓ Validation passed - preparing payload...');
    
    // Get person info from selected person or fallback to linked_party
    const personId = currentCaseData.selected_person?.id || currentCaseData.linked_party?.id || null;
    const personType = currentCaseData.selected_person?.type || currentCaseData.linked_party?.person_type || 'accuser';
    
    const payload = {
        id: currentFormId, // Include if updating existing form
        case_id: currentCaseData.id,
        person_id: personId,
        case_number: currentCaseData.case_number,
        patient_name: patientName.trim(),
        party_type: personType,
        form_data: JSON.stringify(formData),
        report_date: formData.report_date || new Date().toISOString().split('T')[0],
        hospital_name: formData.hospital_name || null,
        examination_date: formData.examination_date || null
    };
    
    console.log('=== PAYLOAD BEING SENT ===');
    console.log('Full payload:', payload);
    console.log('payload.case_id:', payload.case_id, 'type:', typeof payload.case_id);
    console.log('payload.patient_name:', payload.patient_name, 'type:', typeof payload.patient_name);
    console.log('payload.person_id:', payload.person_id);
    console.log('payload.party_type:', payload.party_type);
    console.log('Endpoint:', endpoint);
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log('=== SERVER RESPONSE ===');
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        return response.json();
    })
    .then(result => {
        console.log('Response body:', result);
        
        if (result.status === 'success') {
            // Determine if this was an update or create BEFORE setting currentFormId
            const wasUpdate = currentFormId !== null;
            
            // Store the form ID for future updates
            currentFormId = result.data.id;
            
            // Display QR code if available
            if (result.data.qr_code && result.data.verification_code) {
                displayQRCode(result.data.qr_code, result.data.verification_code);
            }
            
            if (!silent) {
                // Show appropriate message based on whether it was create or update
                const actionText = wasUpdate ? 'updated' : 'saved';
                showToast(`Form ${actionText} successfully! Case: ${currentCaseData.case_number}`, 'success');
                updateSaveStatus(actionText.charAt(0).toUpperCase() + actionText.slice(1) + ' at ' + new Date().toLocaleTimeString());
                
                // Update button to show "Update Form" after first save
                if (!wasUpdate) {
                    const saveBtn = document.getElementById('saveDraftBtn');
                    if (saveBtn) {
                        saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Form';
                        saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    }
                }
            }
        } else {
            if (!silent) {
                showToast('Failed to save form: ' + result.message, 'error');
            }
            console.error('❌ Save failed:', result);
            console.error('Error message:', result.message);
        }
    })
    .catch(error => {
        if (!silent) {
            showToast('Error saving form', 'error');
        }
        console.error('Error saving to database:', error);
    });
}

// ============================================
// Show Saved Forms Modal
// ============================================
function showSavedForms() {
    const baseUrl = window.location.origin;
    
    fetch(`${baseUrl}/investigation/medical-forms/my-forms`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            displaySavedFormsModal(result.data);
        } else {
            showToast('Failed to load saved forms', 'error');
        }
    })
    .catch(error => {
        console.error('Error fetching saved forms:', error);
        showToast('Error loading saved forms', 'error');
    });
}

function displaySavedFormsModal(forms) {
    if (forms.length === 0) {
        showToast('No saved forms found', 'info');
        return;
    }
    
    let modalHtml = `
        <div id="savedFormsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 8px; max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-bottom: 20px;">My Saved Medical Forms</h3>
                <div id="savedFormsList">
    `;
    
    forms.forEach((form, index) => {
        const savedDate = new Date(form.updated_at).toLocaleString();
        modalHtml += `
            <div class="saved-form-item" 
                 style="padding: 15px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <strong>Case: ${form.case_number || 'N/A'}</strong><br>
                        <small>Patient: ${form.patient_name}</small><br>
                        <small style="color: #666;">Saved: ${savedDate}</small>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="loadSavedFormById(${form.id})" 
                                style="padding: 5px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Load
                        </button>
                        <button onclick="deleteSavedFormById(${form.id})" 
                                style="padding: 5px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    modalHtml += `
                </div>
                <button onclick="closeSavedForms()" style="margin-top: 20px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function loadSavedFormById(formId) {
    const baseUrl = window.location.origin;
    
    fetch(`${baseUrl}/investigation/medical-forms/${formId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            const form = result.data;
            
            // Set current form ID for updates
            currentFormId = form.id;
            
            // Load the case data
            currentCaseData = {
                id: form.case_id,
                case_number: form.case_number,
                linked_party: {
                    id: form.person_id,
                    person_type: form.party_type
                }
            };
            
            // Load form data
            loadFormData(form);
            
            // Display QR code if it exists
            if (form.qr_code && form.verification_code) {
                displayQRCode(form.qr_code, form.verification_code);
                console.log('QR code loaded for existing form');
            }
            
            // Show case badge
            const linkedCaseInfo = document.getElementById('linkedCaseInfo');
            const linkedCaseText = document.getElementById('linkedCaseText');
            if (linkedCaseInfo && linkedCaseText) {
                linkedCaseText.innerHTML = `<i class="fas fa-edit"></i> EDITING: ${form.case_number} | ${form.patient_name}`;
                linkedCaseInfo.style.display = 'inline-block';
                linkedCaseInfo.style.background = '#f59e0b';
            }
            
            // Change button text to "Update Form"
            const saveBtn = document.getElementById('saveDraftBtn');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Form';
                saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100())';
            }
            
            closeSavedForms();
            showToast('Form loaded! Continue editing...', 'success');
        } else {
            showToast('Failed to load form', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading form:', error);
        showToast('Error loading form', 'error');
    });
}

function deleteSavedFormById(formId) {
    if (!confirm('Delete this medical form? This cannot be undone.')) {
        return;
    }
    
    const baseUrl = window.location.origin;
    
    fetch(`${baseUrl}/investigation/medical-forms/${formId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            showToast('Form deleted successfully', 'success');
            // Refresh the list
            closeSavedForms();
            showSavedForms();
        } else {
            showToast('Failed to delete form', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting form:', error);
        showToast('Error deleting form', 'error');
    });
}

function closeSavedForms() {
    const modal = document.getElementById('savedFormsModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// Start New Form
// ============================================
function startNewForm() {
    if (confirm('Start a new form? Any unsaved changes will be lost.')) {
        currentFormId = null;
        currentCaseData = null;
        
        // Reset button text to "Save Form"
        const saveBtn = document.getElementById('saveDraftBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Form';
            saveBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        }
        
        location.reload();
    }
}

// ============================================
// Update Save Status
// ============================================
function updateSaveStatus(message) {
    const statusElement = document.getElementById('saveStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = '#28a745';
    }
}

// ============================================
// Print Form
// ============================================
function printForm() {
    window.print();
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info') {
    // Try to use SweetAlert if available
    if (typeof Swal !== 'undefined') {
        const icon = type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info';
        Swal.fire({
            icon: icon,
            title: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    } else {
        // Fallback to alert
        alert(message);
    }
}

// ============================================
// Load Form for Editing
// ============================================
async function loadFormForEditing(formId) {
    console.log('Loading form for editing:', formId);
    const baseUrl = window.location.origin;
    
    try {
        const response = await fetch(`${baseUrl}/investigation/medical-forms/${formId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const form = result.data;
            
            // Set current form ID for updates
            currentFormId = form.id;
            
            // Set case data
            currentCaseData = {
                id: form.case_id,
                case_number: form.case_number,
                selected_person: {
                    id: form.person_id,
                    name: form.patient_name,
                    type: form.party_type
                }
            };
            
            // Load form data
            loadFormData(form);
            
            // Display QR code if it exists
            if (form.qr_code && form.verification_code) {
                displayQRCode(form.qr_code, form.verification_code);
                console.log('QR code loaded for form in edit mode');
            }
            
            // Show edit mode badge
            const linkedCaseInfo = document.getElementById('linkedCaseInfo');
            const linkedCaseText = document.getElementById('linkedCaseText');
            if (linkedCaseInfo && linkedCaseText) {
                linkedCaseText.innerHTML = `<i class="fas fa-edit"></i> EDITING: ${form.case_number} | ${form.patient_name}`;
                linkedCaseInfo.style.display = 'inline-block';
                linkedCaseInfo.style.background = '#f59e0b';
            }
            
            // Change button text to "Update Form"
            const saveBtn = document.getElementById('saveDraftBtn');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Form';
                saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            }
            
            showToast('Form loaded for editing', 'success');
        } else {
            showToast('Failed to load form: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading form:', error);
        showToast('Error loading form', 'error');
    }
}

// ============================================
// Display QR Code (using QRCode.js library like certificate)
// ============================================
function displayQRCode(qrCodeUrl, verificationCode) {
    console.log('=== DISPLAYING QR CODE ===');
    console.log('QR Code URL:', qrCodeUrl);
    console.log('Verification Code:', verificationCode);
    
    // Find QR code container
    const qrContainer = document.getElementById('qrCodeContainer');
    console.log('QR Container found:', qrContainer);
    
    if (!qrContainer) {
        console.error('❌ QR Container not found in DOM!');
        return;
    }
    
    // Check if QRCode library is available
    if (typeof QRCode === 'undefined') {
        console.warn('QRCode library not available, using image fallback');
        // Fallback to image
        qrContainer.style.cssText = 'width: 100px; height: auto; margin: 0 auto; background: transparent; display: block; text-align: center;';
        qrContainer.innerHTML = `
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 100px; height: 100px; display: block; margin: 0 auto;">
            <div style="margin-top: 3px; font-size: 8px; font-weight: bold; word-break: break-all;">
                ${verificationCode}
            </div>
        `;
        return;
    }
    
    // Clear container and styles
    qrContainer.innerHTML = '';
    qrContainer.style.cssText = 'width: 100px; height: 100px; margin: 0 auto; display: block;';
    
    // Extract verification URL from qrCodeUrl (it's encoded in the Google Charts URL)
    const verificationUrl = decodeURIComponent(qrCodeUrl.match(/chl=([^&]+)/)[1]);
    console.log('Verification URL:', verificationUrl);
    
    // Generate QR code using QRCode.js library (same as certificate)
    try {
        new QRCode(qrContainer, {
            text: verificationUrl,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Add verification code text below
        const codeText = document.createElement('div');
        codeText.style.cssText = 'margin-top: 3px; font-size: 8px; font-weight: bold; text-align: center; word-break: break-all;';
        codeText.textContent = verificationCode;
        qrContainer.parentElement.appendChild(codeText);
        
        console.log('✓ QR Code generated successfully with QRCode.js');
    } catch (error) {
        console.error('Error generating QR code:', error);
        qrContainer.innerHTML = '<span style="font-size: 10px; color: #ef4444;">QR Error</span>';
    }
}

// ============================================
// Load Form for Viewing/Printing
// ============================================
async function loadFormForViewing(formId) {
    console.log('Loading form for viewing:', formId);
    const baseUrl = window.location.origin;
    
    try {
        const response = await fetch(`${baseUrl}/investigation/medical-forms/${formId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const form = result.data;
            
            // Load form data
            loadFormData(form);
            
            // Display QR code if it exists
            if (form.qr_code && form.verification_code) {
                displayQRCode(form.qr_code, form.verification_code);
                console.log('QR code loaded for print view');
            }
            
            // Hide action buttons
            const buttonContainer = document.querySelector('.print-button-container');
            if (buttonContainer) {
                buttonContainer.style.display = 'none';
            }
            
            // Show print view badge
            const linkedCaseInfo = document.getElementById('linkedCaseInfo');
            const linkedCaseText = document.getElementById('linkedCaseText');
            if (linkedCaseInfo && linkedCaseText) {
                linkedCaseText.innerHTML = `<i class="fas fa-eye"></i> VIEW MODE: ${form.case_number} | ${form.patient_name}`;
                linkedCaseInfo.style.display = 'inline-block';
                linkedCaseInfo.style.background = '#6366f1';
            }
            
            // Auto print after 1 second
            setTimeout(() => {
                window.print();
            }, 1000);
        } else {
            showToast('Failed to load form: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading form:', error);
        showToast('Error loading form', 'error');
    }
}
