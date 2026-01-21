// Non-Criminal Certificate JavaScript
// =========================================

let currentPersonData = null;
let directorSignaturePad = null;
let autoSaveInterval = null;
let currentCertificateId = null; // Track if editing existing certificate
let isEditMode = false; // Track edit mode

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeCertificate();
    setupSignaturePad();
    loadHeaderImage();
    startAutoSave();
    
    // Check URL parameters for view or edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');
    const editId = urlParams.get('edit');
    
    if (viewId) {
        // View-only mode
        console.log('📖 View-only mode for certificate ID:', viewId);
        loadCertificateForView(viewId);
    } else if (editId) {
        // Edit mode
        console.log('✏️ Edit mode for certificate ID:', editId);
        loadCertificateById(editId);
    } else {
        // New certificate mode
        // Clear any draft data on page load - always start fresh
        localStorage.removeItem('nc_cert_auto_load');
        localStorage.removeItem('nc_cert_draft');
        localStorage.removeItem('nc_cert_photo');
        console.log('🆕 Starting fresh certificate - localStorage cleared');
        
        // Set default values
        document.getElementById('issueDate').value = new Date().toISOString().split('T')[0];
        generateRefNumber();
    }
    
    // Setup auto-update for person name references
    document.getElementById('personName').addEventListener('input', updatePersonNameReferences);
});

// Initialize Certificate
function initializeCertificate() {
    // No auto-save to localStorage - removed to always start fresh
    console.log('Certificate initialized - no auto-save enabled');
}

// Setup Signature Pad
function setupSignaturePad() {
    const canvas = document.getElementById('directorSignatureCanvas');
    if (canvas) {
        directorSignaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        
        // Resize canvas
        resizeCanvas(canvas);
        window.addEventListener('resize', () => resizeCanvas(canvas));
    }
}

function resizeCanvas(canvas) {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
}

function clearDirectorSignature() {
    if (directorSignaturePad) {
        directorSignaturePad.clear();
    }
}

// Load Header Image
function loadHeaderImage() {
    const baseUrl = window.location.origin;
    const endpoint = `${baseUrl}/api/report-settings/header-image`;
    
    fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success' && result.data && result.data.image_url) {
            const container = document.getElementById('headerImageContainer');
            if (container) {
                container.innerHTML = `<img src="${result.data.image_url}" alt="Header">`;
            }
        }
    })
    .catch(error => {
        console.log('Could not load header image:', error);
    });
}

// Generate Reference Number
function generateRefNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    document.getElementById('refNumber').value = `JPFHQ/CID/NC:${random}/${year}`;
}

// Update Person Name References
function updatePersonNameReferences() {
    const name = document.getElementById('personName').value;
    const refs = document.querySelectorAll('.person-name-ref');
    refs.forEach(ref => {
        ref.textContent = name || '[Name]';
    });
    
    // No need to update display name since input is now the display
}

// Handle Photo Upload
function handlePhotoUpload(event) {
    console.log('📸 [DEBUG] Photo upload triggered');
    const file = event.target.files[0];
    console.log('📸 [DEBUG] File selected:', file?.name, 'Size:', file?.size);
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoData = e.target.result;
            console.log('📸 [DEBUG] Photo loaded, data length:', photoData.length);
            
            const preview = document.getElementById('photoPreview');
            preview.innerHTML = `<img src="${photoData}" style="width: 100%; height: 100%; object-fit: cover;">`;
            
            // Save to localStorage
            localStorage.setItem('nc_cert_photo', photoData);
            console.log('📸 [SUCCESS] Photo saved to localStorage');
            
            showToast('Photo uploaded successfully!', 'success');
        };
        reader.onerror = function(error) {
            console.error('📸 [ERROR] Failed to read photo:', error);
            showToast('Failed to upload photo', 'error');
        };
        reader.readAsDataURL(file);
    } else {
        console.warn('📸 [WARNING] Invalid file type:', file?.type);
        showToast('Please select a valid image file', 'error');
    }
}

// Auto-Save - DISABLED
function startAutoSave() {
    // Auto-save is now disabled to prevent interference
    console.log('Auto-save is disabled');
    return;
    
    // Old code kept for reference but not executed
    /*
    autoSaveInterval = setInterval(() => {
        autoSaveCertificate();
    }, 10000);
    */
}

function autoSaveCertificate() {
    // Auto-save disabled
    return;
}

function updateSaveStatus(message) {
    const status = document.getElementById('saveStatus');
    if (status) {
        status.textContent = message;
        status.style.opacity = '1';
        setTimeout(() => {
            status.style.opacity = '0';
        }, 2000);
    }
}

// Collect Certificate Data
function collectCertificateData() {
    const refNumber = document.getElementById('refNumber');
    const issueDate = document.getElementById('issueDate');
    const personName = document.getElementById('personName');
    const birthDateNew = document.getElementById('birthDateNew');
    const birthDateText = document.getElementById('birthDateText');
    const birthPlace = document.getElementById('birthPlace');
    const purpose = document.getElementById('purpose');
    const validityPeriod = document.getElementById('validityPeriod');
    const directorName = document.getElementById('directorName');
    
    return {
        ref_number: refNumber ? refNumber.value : '',
        issue_date: issueDate ? issueDate.value : '',
        person_name: personName ? personName.value : '',
        birth_date: birthDateNew ? birthDateNew.value : '',
        birth_date_text: birthDateText ? birthDateText.value : '',
        birth_place: birthPlace ? birthPlace.value : '',
        purpose: purpose ? purpose.value : '',
        validity_period: validityPeriod ? validityPeriod.value : '6 months',
        director_name: directorName ? directorName.value : '',
        director_signature: directorSignaturePad && !directorSignaturePad.isEmpty() ? directorSignaturePad.toDataURL() : null,
        person_id: currentPersonData ? currentPersonData.id : null,
        saved_at: new Date().toISOString()
    };
}

// Load Draft
function loadDraftIfExists() {
    const draft = localStorage.getItem('nc_cert_draft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            loadCertificateData(data);
            showToast('Draft loaded', 'info');
        } catch (e) {
            console.error('Error loading draft:', e);
        }
    }
}

function loadCertificateData(data) {
    if (data.ref_number && document.getElementById('refNumber')) {
        document.getElementById('refNumber').value = data.ref_number;
    }
    if (data.issue_date && document.getElementById('issueDate')) {
        document.getElementById('issueDate').value = data.issue_date;
    }
    if (data.person_name && document.getElementById('personName')) {
        document.getElementById('personName').value = data.person_name;
        updatePersonNameReferences();
    }
    
    // Load mother name
    if (data.mother_name && document.getElementById('motherName')) {
        document.getElementById('motherName').value = data.mother_name;
        console.log('📋 [LOAD] Mother name loaded:', data.mother_name);
    }
    
    // Load gender
    if (data.gender && document.getElementById('gender')) {
        document.getElementById('gender').value = data.gender;
        console.log('📋 [LOAD] Gender loaded:', data.gender);
    }
    
    if (data.birth_date && document.getElementById('birthDateNew')) {
        document.getElementById('birthDateNew').value = data.birth_date;
    }
    if (data.birth_date_text && document.getElementById('birthDateText')) {
        document.getElementById('birthDateText').value = data.birth_date_text;
    }
    if (data.birth_place && document.getElementById('birthPlace')) {
        document.getElementById('birthPlace').value = data.birth_place;
    }
    
    // Load photo
    if (data.photo_path) {
        const preview = document.getElementById('photoPreview');
        if (preview) {
            preview.innerHTML = `<img src="${data.photo_path}" style="width: 100%; height: 100%; object-fit: cover;">`;
            localStorage.setItem('nc_cert_photo', data.photo_path);
            console.log('📋 [LOAD] Photo loaded, size:', data.photo_path.length);
        }
    }
    
    if (data.purpose && document.getElementById('purpose')) {
        document.getElementById('purpose').value = data.purpose;
    }
    if (data.validity_period && document.getElementById('validityPeriod')) {
        document.getElementById('validityPeriod').value = data.validity_period;
    }
    if (data.director_name && document.getElementById('directorName')) {
        document.getElementById('directorName').value = data.director_name;
    }
    
    if (data.director_signature && directorSignaturePad) {
        directorSignaturePad.fromDataURL(data.director_signature);
    }
    
    // Generate QR Code
    generateQRCode();
}

// Start New Certificate
function startNewCertificate() {
    if (confirm('Start a new certificate? Any unsaved changes will be lost.')) {
        // Reset edit mode
        isEditMode = false;
        currentCertificateId = null;
        
        // Clear everything
        localStorage.removeItem('nc_cert_draft');
        localStorage.removeItem('nc_cert_photo');
        localStorage.removeItem('nc_cert_auto_load');
        
        // Update button text back to "Save"
        updateSaveButtonText();
        
        location.reload();
    }
}

// Save Certificate
async function saveCertificate() {
    console.log('🔍 [DEBUG] Save Certificate Called');
    console.log('🔍 [DEBUG] isEditMode:', isEditMode);
    console.log('🔍 [DEBUG] currentCertificateId:', currentCertificateId);
    
    const data = collectCertificateData();
    console.log('🔍 [DEBUG] Collected data:', data);
    
    // Validate
    if (!data.person_name) {
        showToast('Please enter person name', 'error');
        return;
    }
    
    if (!data.issue_date) {
        showToast('Please enter issue date', 'error');
        return;
    }
    
    // Show loading
    showToast('Saving certificate...', 'info');
    
    try {
        const baseUrl = window.location.origin;
        
        // Determine if we're creating new or updating existing
        const isUpdate = isEditMode && currentCertificateId;
        const endpoint = isUpdate 
            ? `${baseUrl}/investigation/certificates/${currentCertificateId}`
            : `${baseUrl}/investigation/certificates`;
        const method = isUpdate ? 'PUT' : 'POST';
        
        console.log('🔍 [DEBUG] isUpdate:', isUpdate);
        console.log('🔍 [DEBUG] Method:', method);
        console.log('🔍 [DEBUG] Endpoint:', endpoint);
        
        // Get fresh values from form
        const motherName = document.getElementById('motherName');
        const gender = document.getElementById('gender');
        const birthDateNew = document.getElementById('birthDateNew');
        const birthPlaceNew = document.getElementById('birthPlaceNew');
        const birthPlace = document.getElementById('birthPlace');
        const birthDateText = document.getElementById('birthDateText');
        
        console.log('🔍 [DEBUG] Form values:');
        console.log('  - motherName:', motherName?.value);
        console.log('  - gender:', gender?.value);
        console.log('  - birthDateNew:', birthDateNew?.value);
        console.log('  - birthPlaceNew:', birthPlaceNew?.value);
        console.log('  - birthPlace:', birthPlace?.value);
        console.log('  - birthDateText:', birthDateText?.value);
        
        // Get photo from localStorage
        const photoData = localStorage.getItem('nc_cert_photo');
        console.log('🔍 [DEBUG] Photo data exists:', !!photoData);
        console.log('🔍 [DEBUG] Photo data length:', photoData ? photoData.length : 0);
        
        // Prepare data for backend
        const certificateData = {
            certificate_number: data.ref_number,
            person_id: data.person_id,
            person_name: data.person_name,
            mother_name: motherName?.value || null,
            gender: gender?.value || 'MALE',
            birth_date: birthDateNew?.value || null,
            birth_place: birthPlaceNew?.value || birthPlace?.value || null,
            photo_path: photoData || null,
            purpose: data.purpose,
            validity_period: data.validity_period,
            issue_date: data.issue_date,
            director_name: data.director_name,
            director_signature: data.director_signature,
            notes: data.notes || null
        };
        
        console.log('🔍 [DEBUG] Certificate data being sent:', certificateData);
        
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(certificateData)
        });
        
        console.log('🔍 [DEBUG] Response status:', response.status);
        
        const result = await response.json();
        console.log('🔍 [DEBUG] Response result:', result);
        console.log('🔍 [DEBUG] Response result.message:', result.message);
        console.log('🔍 [DEBUG] Response result.errors:', result.errors);
        
        if (result.status === 'success') {
            // Save certificate ID and verification info
            const certId = result.data.certificate?.id || currentCertificateId;
            
            // Update currentCertificateId for future edits
            currentCertificateId = certId;
            isEditMode = true;
            
            // Update button text to "Update" after first save
            updateSaveButtonText();
            
            // Don't use localStorage - everything from backend
            
            const message = isUpdate ? 'Certificate updated successfully!' : 'Certificate saved successfully!';
            showToast(message, 'success');
            updateSaveStatus('Saved at ' + new Date().toLocaleTimeString());
            
            // Generate QR Code with verification URL
            generateQRCode(result.data.verification_url);
            
            console.log('✅ [SUCCESS]', isUpdate ? 'Updated' : 'Created', 'certificate');
            console.log('✅ [SUCCESS] Certificate ID:', certId);
            console.log('✅ [SUCCESS] Verification URL:', result.data.verification_url);
        } else {
            const errorMsg = result.message || 'Failed to save certificate';
            const errorDetails = result.errors ? JSON.stringify(result.errors) : 'No additional error details';
            console.error('❌ [ERROR] Server returned error:', errorMsg);
            console.error('❌ [ERROR] Error details:', errorDetails);
            throw new Error(errorMsg + ' - ' + errorDetails);
        }
        
    } catch (error) {
        console.error('❌ [ERROR] Error saving certificate:', error);
        console.error('❌ [ERROR] Error message:', error.message);
        console.error('❌ [ERROR] Error stack:', error.stack);
        showToast('Error: ' + error.message, 'error');
        
        // Don't use localStorage - everything from backend
        
        showToast('Certificate saved locally only', 'warning');
    }
}

// Show Person Selection
function showPersonSelection() {
    document.getElementById('personSelectionModal').style.display = 'block';
    loadAllPersons();
}

function closePersonSelection() {
    document.getElementById('personSelectionModal').style.display = 'none';
}

function loadAllPersons() {
    const container = document.getElementById('personListContainer');
    container.innerHTML = '<div style="padding: 20px; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading persons...</div>';
    
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
        if (result.status === 'success' && result.data) {
            displayPersonList(result.data);
        } else {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Failed to load persons</div>';
        }
    })
    .catch(error => {
        console.error('Error loading persons:', error);
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Error loading persons</div>';
    });
}

function displayPersonList(persons) {
    const container = document.getElementById('personListContainer');
    
    if (!persons || persons.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No persons found</div>';
        return;
    }
    
    let html = '';
    persons.forEach((person) => {
        const name = person.full_name || person.name || 'Unknown';
        const age = person.age || 'N/A';
        const gender = person.gender || 'N/A';
        const phone = person.phone || 'N/A';
        
        html += `
            <div onclick='selectPerson(${JSON.stringify(person).replace(/'/g, "&apos;")})' style="
                padding: 15px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#f0f9ff';" 
               onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 5px;">
                    <i class="fas fa-user"></i> ${name}
                </div>
                <div style="font-size: 13px; color: #666;">
                    Age: ${age} | Gender: ${gender} | Phone: ${phone}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function selectPerson(person) {
    currentPersonData = person;
    
    // Auto-fill person data
    const name = person.full_name || person.name || '';
    const birthDate = person.date_of_birth || person.birth_date || '';
    const birthPlace = person.birth_place || person.address || 'Kismaio';
    
    if (document.getElementById('personName')) {
        document.getElementById('personName').value = name;
    }
    if (document.getElementById('birthDateNew')) {
        document.getElementById('birthDateNew').value = birthDate;
    }
    if (document.getElementById('birthPlace')) {
        document.getElementById('birthPlace').value = birthPlace;
    }
    
    updatePersonNameReferences();
    closePersonSelection();
    
    showToast(`Selected: ${name}`, 'success');
    autoSaveCertificate();
}

function filterPersons() {
    const search = document.getElementById('personSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('#personListContainer > div');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'block' : 'none';
    });
}

// Show My Certificates
function showMyCertificates() {
    document.getElementById('myCertificatesModal').style.display = 'block';
    loadMyCertificatesList();
}

function closeMyCertificates() {
    document.getElementById('myCertificatesModal').style.display = 'none';
}

async function loadMyCertificatesList() {
    const container = document.getElementById('certificatesListContainer');
    
    // Show loading
    container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #3b82f6; margin-bottom: 15px;"></i>
            <p style="color: #666;">Loading certificates from database...</p>
        </div>
    `;
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/investigation/certificates`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('📋 [DEBUG] Certificates from backend:', result);
        
        if (result.status === 'success' && result.data) {
            const certs = result.data;
            
            if (certs.length === 0) {
                container.innerHTML = `
                    <div style="padding: 40px; text-align: center;">
                        <i class="fas fa-certificate" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                        <p style="color: #999;">No saved certificates</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            certs.forEach((cert) => {
                const date = new Date(cert.created_at).toLocaleString();
                
                html += `
                    <div style="padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 15px;">
                        <div style="margin-bottom: 15px;">
                            <div style="font-weight: 600; font-size: 18px; margin-bottom: 5px;">
                                ${cert.person_name}
                            </div>
                            <div style="font-size: 13px; color: #666;">
                                Ref: ${cert.certificate_number} | Created: ${date}
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="loadCertificateById(${cert.id})" style="
                                flex: 1; background: #3b82f6; color: white; border: none;
                                padding: 10px; border-radius: 5px; cursor: pointer; font-weight: 600;
                            "><i class="fas fa-edit"></i> Continue Editing</button>
                            <button onclick="deleteCertificateById(${cert.id})" style="
                                background: #ef4444; color: white; border: none;
                                padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: 600;
                            "><i class="fas fa-trash"></i> Delete</button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } else {
            throw new Error('Failed to load certificates');
        }
        
    } catch (error) {
        console.error('❌ [ERROR] Loading certificates:', error);
        container.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 15px;"></i>
                <p style="color: #ef4444;">Error loading certificates</p>
                <p style="color: #666; font-size: 14px;">${error.message}</p>
            </div>
        `;
    }
}

async function loadCertificateById(id) {
    console.log('📂 [DEBUG] Loading certificate ID:', id);
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/investigation/certificates/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('📂 [DEBUG] Backend response:', result);
        
        if (result.status === 'success' && result.data) {
            // Set edit mode
            isEditMode = true;
            currentCertificateId = result.data.id;
            
            // Map backend data to form format
            const certificateToLoad = {
                ref_number: result.data.certificate_number,
                person_name: result.data.person_name,
                mother_name: result.data.mother_name,
                gender: result.data.gender,
                birth_date: result.data.birth_date,
                birth_place: result.data.birth_place,
                photo_path: result.data.photo_path,
                purpose: result.data.purpose,
                validity_period: result.data.validity_period,
                issue_date: result.data.issue_date,
                director_name: result.data.director_name,
                director_signature: result.data.director_signature,
                backend_id: result.data.id,
                verification_token: result.data.verification_token
            };
            
            console.log('✅ [SUCCESS] Loaded certificate from backend');
            
            // Load certificate data
            loadCertificateData(certificateToLoad);
            
            // Load photo if exists
            if (certificateToLoad.photo_path) {
                console.log('📂 [DEBUG] Saving photo to localStorage for current session');
                localStorage.setItem('nc_cert_photo', certificateToLoad.photo_path);
            }
            
            // Update button text to "Update"
            updateSaveButtonText();
            
            closeMyCertificates();
            showToast('Certificate loaded for editing!', 'info');
            console.log('✅ [SUCCESS] Edit mode active - ID:', currentCertificateId);
        } else {
            throw new Error('Certificate not found');
        }
        
    } catch (error) {
        console.error('❌ [ERROR] Failed to load certificate:', error);
        showToast('Error loading certificate: ' + error.message, 'error');
    }
}

async function loadCertificateForView(id) {
    console.log('📖 [VIEW] Loading certificate ID for view:', id);
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/investigation/certificates/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('📖 [VIEW] Backend response:', result);
        
        if (result.status === 'success' && result.data) {
            // Map backend data to form format
            const certificateToLoad = {
                ref_number: result.data.certificate_number,
                person_name: result.data.person_name,
                mother_name: result.data.mother_name,
                gender: result.data.gender,
                birth_date: result.data.birth_date,
                birth_place: result.data.birth_place,
                photo_path: result.data.photo_path,
                purpose: result.data.purpose,
                validity_period: result.data.validity_period,
                issue_date: result.data.issue_date,
                director_name: result.data.director_name,
                director_signature: result.data.director_signature,
                backend_id: result.data.id,
                verification_token: result.data.verification_token
            };
            
            console.log('✅ [SUCCESS] Loaded certificate for viewing');
            
            // Load certificate data
            loadCertificateData(certificateToLoad);
            
            // Load photo if exists
            if (certificateToLoad.photo_path) {
                localStorage.setItem('nc_cert_photo', certificateToLoad.photo_path);
            }
            
            // Make all inputs read-only
            makeFormReadOnly();
            
            // Hide save/update button, show print button
            const saveBtn = document.querySelector('button[onclick*="saveCertificate"]');
            if (saveBtn) {
                saveBtn.style.display = 'none';
            }
            
            // Add print and close buttons
            addViewModeButtons();
            
            showToast('Certificate loaded in view-only mode', 'info');
            console.log('✅ [SUCCESS] View-only mode active');
        } else {
            throw new Error('Certificate not found');
        }
        
    } catch (error) {
        console.error('❌ [ERROR] Failed to load certificate:', error);
        showToast('Error loading certificate: ' + error.message, 'error');
    }
}

function makeFormReadOnly() {
    // Disable all inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.disabled = true;
        input.style.backgroundColor = '#f9fafb';
        input.style.cursor = 'not-allowed';
    });
    
    // Disable signature pads
    if (directorSignaturePad) {
        directorSignaturePad.off();
    }
    
    // Disable photo upload
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.disabled = true;
    }
    
    console.log('🔒 Form is now read-only');
}

function addViewModeButtons() {
    // Find the save button container or create one
    const saveBtn = document.querySelector('button[onclick*="saveCertificate"]');
    if (saveBtn && saveBtn.parentElement) {
        const container = saveBtn.parentElement;
        
        // Create button group
        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = 'display: flex; gap: 15px; justify-content: center; margin-top: 30px;';
        
        // Print button
        const printBtn = document.createElement('button');
        printBtn.innerHTML = '<i class="fas fa-print"></i> Print Certificate';
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
        `;
        printBtn.onclick = () => window.print();
        
        // Close/Back button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Dashboard';
        closeBtn.style.cssText = `
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        `;
        closeBtn.onclick = () => window.location.href = 'certificates-dashboard.html';
        
        buttonGroup.appendChild(printBtn);
        buttonGroup.appendChild(closeBtn);
        
        // Replace save button with new buttons
        container.replaceChild(buttonGroup, saveBtn);
    }
}

// Update Save button text based on mode
function updateSaveButtonText() {
    const saveButtons = document.querySelectorAll('.ctrl-btn');
    saveButtons.forEach(btn => {
        if (btn.textContent.includes('Save')) {
            if (isEditMode) {
                btn.innerHTML = '<i class="fas fa-sync-alt"></i> Update';
                btn.style.background = '#f59e0b'; // Orange for update
            } else {
                btn.innerHTML = '<i class="fas fa-save"></i> Save';
                btn.style.background = '#f59e0b';
            }
        }
    });
}

async function deleteCertificateById(id) {
    if (!confirm('Delete this certificate from database?\n\nThis action cannot be undone.')) {
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/investigation/certificates/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast('Certificate deleted successfully', 'success');
            loadMyCertificatesList(); // Reload list
        } else {
            throw new Error(result.message || 'Failed to delete');
        }
        
    } catch (error) {
        console.error('❌ [ERROR] Failed to delete certificate:', error);
        showToast('Error deleting certificate: ' + error.message, 'error');
    }
}

// Generate QR Code
function generateQRCode(verificationUrl = null) {
    const container = document.getElementById('qrCodeContainer');
    
    if (!container || typeof QRCode === 'undefined') {
        console.warn('QR Code container or library not available');
        return;
    }
    
    // Use verification URL if available, otherwise create fallback
    let qrData;
    if (verificationUrl) {
        qrData = verificationUrl;
    } else {
        // Fallback: Check if we have saved verification URL
        const draft = localStorage.getItem('nc_cert_draft');
        if (draft) {
            try {
                const draftData = JSON.parse(draft);
                if (draftData.verification_url) {
                    qrData = draftData.verification_url;
                }
            } catch (e) {
                console.error('Error parsing draft:', e);
            }
        }
        
        // If still no URL, create a placeholder
        if (!qrData) {
            const refNumber = document.getElementById('refNumber').value;
            const personName = document.getElementById('personName').value;
            const issueDate = document.getElementById('issueDate').value;
            qrData = `PENDING-VERIFICATION:${refNumber}:${personName}:${issueDate}`;
        }
    }
    
    // Clear previous QR code
    container.innerHTML = '';
    
    // Generate new QR code
    try {
        new QRCode(container, {
            text: qrData,
            width: 120,
            height: 120,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        console.log('QR Code generated with data:', qrData);
    } catch (error) {
        console.error('Error generating QR code:', error);
        container.innerHTML = '<span style="font-size: 10px; color: #ef4444;">QR Error</span>';
    }
}

// Print Certificate
function printCertificate() {
    // Generate QR before printing
    generateQRCode();
    
    setTimeout(() => {
        window.print();
    }, 500);
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000; animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
