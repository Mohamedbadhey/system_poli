// ============================================
// Incident Entry Page (Cases without immediate parties)
// For natural incidents, public disturbances, lost property, etc.
// ============================================

/**
 * Load Incident Entry Page
 */
async function loadIncidentEntryPage() {
    const html = `
        <div class="page-header">
            <h2 data-i18n="incident_entry">Incident Entry</h2>
            <p data-i18n="incident_entry_desc">Record incidents without immediate victim or accused (natural incidents, public disturbances, lost property, etc.)</p>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 data-i18n="create_incident">Create New Incident Report</h3>
                <p class="text-muted" data-i18n="incident_entry_note">Parties (victim/accused) can be added later during investigation</p>
            </div>
            <div class="card-body">
                <form id="incidentEntryForm">
                    
                    <!-- Incident Details -->
                    <div class="form-section">
                        <h4 data-i18n="incident_details">Incident Details</h4>
                        
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="incident_date" data-i18n="incident_date">Incident Date <span class="text-danger">*</span></label>
                                <input type="datetime-local" class="form-control" id="incident_date" name="incident_date" required>
                            </div>
                            
                            <div class="form-group col-md-6">
                                <label for="incident_location" data-i18n="incident_location">Incident Location <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="incident_location" name="incident_location" required data-i18n-placeholder="incident_location_example">
                            </div>
                        </div>
                        
                        
                        <div class="form-group">
                            <label for="incident_description" data-i18n="incident_description">Incident Description <span class="text-danger">*</span></label>
                            <textarea class="form-control" id="incident_description" name="incident_description" rows="5" required 
                                data-i18n-placeholder="incident_description_example"></textarea>
                            <small class="form-text text-muted" data-i18n="min_10_chars">Minimum 10 characters</small>
                        </div>
                    </div>
                    
                    <!-- Optional Party Information -->
                    <div class="form-section">
                        <h4 data-i18n="optional_party_info">Optional Party Information (if incident affects someone)</h4>
                        <div class="form-check mb-3">
                            <input type="checkbox" class="form-check-input" id="hasParty" name="hasParty">
                            <label class="form-check-label" for="hasParty" data-i18n="incident_has_party">
                                This incident affects a person (victim or accused)
                            </label>
                        </div>
                        
                        <div id="partySection" style="display: none;">
                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="party_role" data-i18n="party_role">Party Role <span class="text-danger">*</span></label>
                                    <select class="form-control" id="party_role" name="party_role">
                                        <option value="" data-i18n="select_role">Select Role</option>
                                        <option value="victim" data-i18n="victim">Victim</option>
                                        <option value="accused" data-i18n="accused">Accused</option>
                                    </select>
                                </div>
                                
                                <div class="form-group col-md-6">
                                    <label for="party_first_name" data-i18n="first_name">First Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="party_first_name" name="party_first_name">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="party_middle_name" data-i18n="middle_name">Middle Name</label>
                                    <input type="text" class="form-control" id="party_middle_name" name="party_middle_name">
                                </div>
                                
                                <div class="form-group col-md-6">
                                    <label for="party_last_name" data-i18n="last_name">Last Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="party_last_name" name="party_last_name">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group col-md-4">
                                    <label for="party_gender" data-i18n="gender">Gender</label>
                                    <select class="form-control" id="party_gender" name="party_gender">
                                        <option value="" data-i18n="select">Select</option>
                                        <option value="male" data-i18n="male">Male</option>
                                        <option value="female" data-i18n="female">Female</option>
                                    </select>
                                </div>
                                
                                <div class="form-group col-md-4">
                                    <label for="party_phone" data-i18n="phone">Phone</label>
                                    <input type="text" class="form-control" id="party_phone" name="party_phone">
                                </div>
                                
                                <div class="form-group col-md-4">
                                    <label for="party_national_id" data-i18n="national_id">National ID</label>
                                    <input type="text" class="form-control" id="party_national_id" name="party_national_id">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="party_address" data-i18n="address">Address</label>
                                <textarea class="form-control" id="party_address" name="party_address" rows="2"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="party_photo" data-i18n="photo">Photo (Optional)</label>
                                <input type="file" class="form-control" id="party_photo" name="party_photo" accept="image/*">
                                <small class="form-text text-muted" data-i18n="photo_upload_hint">Upload a photo of the person (max 5MB, JPG/PNG)</small>
                                <div id="party_photo_preview" style="display: none; margin-top: 10px;">
                                    <img src="" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #ddd;">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Crime Classification -->
                    <div class="form-section">
                        <h4 data-i18n="crime_classification">Crime Classification</h4>
                        
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="crime_type" data-i18n="crime_type">Crime Type <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="crime_type" name="crime_type" required 
                                    data-i18n-placeholder="crime_type_example">
                            </div>
                            
                            <div class="form-group col-md-6">
                                <label for="crime_category" data-i18n="crime_category">Crime Category <span class="text-danger">*</span></label>
                                <select class="form-control" id="crime_category" name="crime_category" required>
                                    <option value="" data-i18n="select_category">Select Category</option>
                                    <option value="violent" data-i18n="category_violent">Violent</option>
                                    <option value="property" data-i18n="category_property">Property</option>
                                    <option value="drug" data-i18n="category_drug">Drug</option>
                                    <option value="cybercrime" data-i18n="category_cybercrime">Cybercrime</option>
                                    <option value="sexual" data-i18n="category_sexual">Sexual</option>
                                    <option value="juvenile" data-i18n="category_juvenile">Juvenile</option>
                                    <option value="other" data-i18n="category_other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="priority" data-i18n="priority">Priority <span class="text-danger">*</span></label>
                                <select class="form-control" id="priority" name="priority" required>
                                    <option value="low" data-i18n="priority_low">Low</option>
                                    <option value="medium" selected data-i18n="priority_medium">Medium</option>
                                    <option value="high" data-i18n="priority_high">High</option>
                                    <option value="critical" data-i18n="priority_critical">Critical</option>
                                </select>
                            </div>
                            
                            <div class="form-group col-md-6">
                                <label class="d-block" data-i18n="case_sensitivity">Case Sensitivity</label>
                                <div class="custom-control custom-checkbox mt-2">
                                    <input type="checkbox" class="custom-control-input" id="is_sensitive" name="is_sensitive">
                                    <label class="custom-control-label" for="is_sensitive" data-i18n="mark_as_sensitive">
                                        Mark as Sensitive
                                    </label>
                                    <small class="form-text text-muted" data-i18n="sensitive_note">
                                        Restrict access to authorized personnel only
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button type="submit" name="action" value="submit" class="btn btn-primary" id="submitBtn">
                            <i class="fas fa-paper-plane"></i> <span data-i18n="submit_case">Submit Case</span>
                        </button>
                        <button type="submit" name="action" value="draft" class="btn btn-success" id="draftBtn">
                            <i class="fas fa-save"></i> <span data-i18n="save_as_draft">Save as Draft</span>
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="loadPage('my-cases')">
                            <i class="fas fa-times"></i> <span data-i18n="cancel">Cancel</span>
                        </button>
                        <button type="reset" class="btn btn-outline-secondary">
                            <i class="fas fa-redo"></i> <span data-i18n="reset_form">Reset Form</span>
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
        
        <div class="alert alert-info mt-3">
            <i class="fas fa-info-circle"></i>
            <strong data-i18n="note">Note:</strong>
            <span data-i18n="incident_workflow_note">
                This incident will be created in DRAFT status. After the case is assigned to an investigator, 
                they can add victim, accused, and witness information as the investigation progresses.
            </span>
        </div>
    `;
    
    $('#pageContent').html(html);
    
    // Apply translations
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
    
    // Disable submit button until categories load
    $('#submitBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading categories...');
    
    // Load categories from database
    await loadIncidentCategories();
    
    // Re-enable submit button after categories load
    $('#submitBtn').prop('disabled', false).html('<i class="fas fa-paper-plane"></i> <span data-i18n="submit_case">Submit Case</span>');
    
    // Setup form submission
    $('#incidentEntryForm').on('submit', handleIncidentSubmission);
    
    // Toggle party section
    $('#hasParty').on('change', function() {
        if ($(this).is(':checked')) {
            $('#partySection').slideDown();
            // Make party fields required when section is shown
            $('#party_role, #party_first_name, #party_last_name').prop('required', true);
        } else {
            $('#partySection').slideUp();
            // Remove required attribute when section is hidden
            $('#party_role, #party_first_name, #party_last_name').prop('required', false);
            // Clear party fields
            $('#partySection input, #partySection select, #partySection textarea').val('');
            $('#party_photo_preview').hide();
        }
    });
    
    // Photo preview
    $('#party_photo').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('error', t('photo_size_error'));
                $(this).val('');
                return;
            }
            
            // Validate file type
            if (!file.type.match('image.*')) {
                showToast('error', t('invalid_image_file'));
                $(this).val('');
                return;
            }
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#party_photo_preview img').attr('src', e.target.result);
                $('#party_photo_preview').show();
            };
            reader.readAsDataURL(file);
        } else {
            $('#party_photo_preview').hide();
        }
    });
    
    // Set default incident date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#incident_date').val(now.toISOString().slice(0, 16));
}

/**
 * Handle Incident Form Submission
 */
async function handleIncidentSubmission(e) {
    e.preventDefault();
    
    // Determine which button was clicked
    const clickedButton = $(document.activeElement);
    const action = clickedButton.val(); // 'submit' or 'draft'
    const shouldSubmit = action === 'submit';
    
    const submitBtn = clickedButton;
    const originalText = submitBtn.html();
    const loadingText = shouldSubmit 
        ? '<i class="fas fa-spinner fa-spin"></i> ' + t('submitting')
        : '<i class="fas fa-spinner fa-spin"></i> ' + t('saving');
    
    submitBtn.prop('disabled', true).html(loadingText);
    
    // Disable both buttons during submission
    $('#submitBtn, #draftBtn').prop('disabled', true);
    
    try {
        // Check if we have a photo to upload
        const hasPhoto = $('#hasParty').is(':checked') && $('#party_photo')[0].files.length > 0;
        
        if (hasPhoto) {
            // Use FormData for file upload
            const formData = new FormData();
            
            // Add incident data
            formData.append('incident_date', $('#incident_date').val());
            formData.append('incident_location', $('#incident_location').val());
            formData.append('incident_description', $('#incident_description').val());
            formData.append('crime_type', $('#crime_type').val());
            formData.append('crime_category', $('#crime_category').val());
            formData.append('priority', $('#priority').val());
            formData.append('is_sensitive', $('#is_sensitive').is(':checked') ? 1 : 0);
            formData.append('should_submit', shouldSubmit ? 1 : 0);
            
            // Add party data
            formData.append('party[role]', $('#party_role').val());
            formData.append('party[first_name]', $('#party_first_name').val());
            formData.append('party[middle_name]', $('#party_middle_name').val() || '');
            formData.append('party[last_name]', $('#party_last_name').val());
            formData.append('party[gender]', $('#party_gender').val() || '');
            formData.append('party[phone]', $('#party_phone').val() || '');
            formData.append('party[national_id]', $('#party_national_id').val() || '');
            formData.append('party[address]', $('#party_address').val() || '');
            
            // Add photo file
            formData.append('party_photo', $('#party_photo')[0].files[0]);
            
            // Validate party required fields
            if (!$('#party_role').val() || !$('#party_first_name').val() || !$('#party_last_name').val()) {
                showToast('error', t('required_party_fields'));
                submitBtn.prop('disabled', false).html(originalText);
                return;
            }
            
            // Submit with FormData (multipart)
            const response = await api.upload('/ob/cases/incident', formData);
            
            if (response.status === 'success') {
                const successMessage = shouldSubmit 
                    ? (response.message || t('incident_submitted'))
                    : t('incident_saved_draft');
                showToast('success', successMessage);
                showSuccessDialog(response.data, shouldSubmit);
            } else {
                showToast('error', response.message || t('incident_failed'));
                $('#submitBtn, #draftBtn').prop('disabled', false);
                submitBtn.html(originalText);
            }
            
        } else {
            // Use JSON for regular submission (no photo)
            const data = {
                incident_date: $('#incident_date').val(),
                incident_location: $('#incident_location').val(),
                incident_description: $('#incident_description').val(),
                crime_type: $('#crime_type').val(),
                crime_category: $('#crime_category').val(),
                priority: $('#priority').val(),
                is_sensitive: $('#is_sensitive').is(':checked') ? 1 : 0,
                should_submit: shouldSubmit ? 1 : 0
            };
            
            // Add party data if checkbox is checked
            if ($('#hasParty').is(':checked')) {
                data.party = {
                    role: $('#party_role').val(),
                    first_name: $('#party_first_name').val(),
                    middle_name: $('#party_middle_name').val() || null,
                    last_name: $('#party_last_name').val(),
                    gender: $('#party_gender').val() || null,
                    phone: $('#party_phone').val() || null,
                    national_id: $('#party_national_id').val() || null,
                    address: $('#party_address').val() || null
                };
                
                // Validate party required fields
                if (!data.party.role || !data.party.first_name || !data.party.last_name) {
                    showToast('error', t('required_party_fields'));
                    submitBtn.prop('disabled', false).html(originalText);
                    return;
                }
            }
            
            // Validate required fields
            if (!data.incident_date || !data.incident_location || !data.incident_description ||
                !data.crime_type || !data.crime_category || !data.priority) {
                showToast('error', t('required_fields_error'));
                $('#submitBtn, #draftBtn').prop('disabled', false);
                submitBtn.html(originalText);
                return;
            }
            
            // Additional validation: Prevent "undefined" or invalid category
            if (data.crime_category === 'undefined' || data.crime_category === '' || data.crime_category === 'null') {
                showToast('error', 'Please select a valid crime category');
                $('#submitBtn, #draftBtn').prop('disabled', false);
                submitBtn.html(originalText);
                return;
            }
            
            // Validate description length
            if (data.incident_description.length < 10) {
                showToast('error', t('incident_description_min'));
                $('#submitBtn, #draftBtn').prop('disabled', false);
                submitBtn.html(originalText);
                return;
            }
            
            console.log('Submitting incident data:', data);
            
            // Submit to API
            const response = await api.post('/ob/cases/incident', data);
        
            if (response.status === 'success') {
                const successMessage = shouldSubmit 
                    ? (response.message || t('incident_submitted'))
                    : t('incident_saved_draft');
                showToast('success', successMessage);
                showSuccessDialog(response.data, shouldSubmit);
            } else {
                showToast('error', response.message || t('incident_failed'));
                $('#submitBtn, #draftBtn').prop('disabled', false);
                submitBtn.html(originalText);
            }
        }
        
    } catch (error) {
        console.error('Error creating incident:', error);
        let errorMessage = t('incident_failed');
        
        if (error.response && error.response.data) {
            if (typeof error.response.data === 'object') {
                const errors = error.response.data;
                errorMessage = Object.values(errors).flat().join('<br>');
            } else {
                errorMessage = error.response.data;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast('error', errorMessage);
        $('#submitBtn, #draftBtn').prop('disabled', false);
        submitBtn.html(originalText);
    }
}

/**
 * Show success dialog after incident creation
 */
async function showSuccessDialog(caseData, wasSubmitted) {
    const statusText = wasSubmitted 
        ? t('case_submitted_assignment')
        : t('draft_submit_later');
    
    const message = wasSubmitted ? t('submitted') : t('saved_successfully');
    
    const result = await Swal.fire({
        icon: 'success',
        title: t('success'),
        html: `
            <p>${message}</p>
            <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; text-align: left;">
                <strong>${t('case_number')}:</strong> ${caseData.case_number || 'N/A'}<br>
                <strong>${t('ob_number')}:</strong> ${caseData.ob_number || 'N/A'}<br>
                <strong>${t('status')}:</strong> ${statusText}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-folder-open"></i> ' + t('view_my_cases'),
        cancelButtonText: '<i class="fas fa-plus"></i> ' + t('create_another'),
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        allowOutsideClick: false
    });
    
    if (result.isConfirmed) {
        loadPage('my-cases');
    } else if (result.isDismissed) {
        resetIncidentForm();
    }
}

/**
 * Load categories from database for incident entry form
 */
async function loadIncidentCategories() {
    try {
        // Load dynamic categories from database
        const response = await api.get('/ob/categories');
        
        if (response.status === 'success' && response.data) {
            const categorySelect = $('#crime_category');
            
            // Clear existing options except the first one (Select Category)
            categorySelect.find('option:not(:first)').remove();
            
            // Add categories from database
            response.data.forEach(category => {
                if (category.is_active == 1) {
                    const currentLang = LanguageManager.currentLanguage || 'en';
                    
                    // Use category name directly
                    const categoryName = category.name || '';
                    
                    // Only add if we have a valid name
                    if (categoryName && categoryName !== 'undefined') {
                        categorySelect.append(
                            `<option value="${categoryName}">${categoryName}</option>`
                        );
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        // Keep the default hardcoded categories if API fails
    }
}

/**
 * Reset incident form for creating another incident
 */
function resetIncidentForm() {
    $('#incidentEntryForm')[0].reset();
    $('#party_photo_preview').hide();
    $('#partySection').hide();
    $('#hasParty').prop('checked', false);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#incident_date').val(now.toISOString().slice(0, 16));
    
    // Close any open modals
    $('.modal').removeClass('show').css('display', 'none');
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open').css('padding-right', '');
}
