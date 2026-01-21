/**
 * Modal Helper Functions
 */

// Show modal
function showModal(title, bodyHtml, footerButtons = [], size = 'medium') {
    const sizeClass = size === 'large' ? 'modal-large' : '';
    const modalHtml = `
        <div class="modal-overlay" onclick="closeModalOnOverlay(event)">
            <div class="modal ${sizeClass}" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    ${bodyHtml}
                </div>
                ${footerButtons.length > 0 ? `
                <div class="modal-footer">
                    ${footerButtons.map(btn => `<button class="${btn.class}" onclick="${btn.onclick}">${btn.text}</button>`).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    $('#modalContainer').html(modalHtml);
    
    // Apply translations to modal content if translation system is available
    if (window.translateContainer && typeof translateContainer === 'function') {
        translateContainer('#modalContainer');
    }
}

// Close modal
function closeModal() {
    $('#modalContainer').html('');
}

// Close modal when clicking overlay
function closeModalOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

// View Case Details Modal
async function viewCaseDetails(caseId) {
    try {
        const response = await obAPI.getCase(caseId);
        if (response.status === 'success') {
            const caseData = response.data;
            
            const bodyHtml = `
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label" data-i18n="case_number">${t('case_number')}</span>
                        <span class="info-value">${caseData.case_number}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="ob_number">${t('ob_number')}</span>
                        <span class="info-value">${caseData.ob_number}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="crime_type">${t('crime_type')}</span>
                        <span class="info-value">${caseData.crime_type}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="category">${t('category')}</span>
                        <span class="info-value">${caseData.crime_category}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="priority">${t('priority')}</span>
                        <span class="info-value">${getPriorityBadge(caseData.priority)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="status">${t('status')}</span>
                        <span class="info-value">${getStatusBadge(caseData.status)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="incident_date">${t('incident_date')}</span>
                        <span class="info-value">${new Date(caseData.incident_date).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="report_date">${t('report_date')}</span>
                        <span class="info-value">${new Date(caseData.report_date).toLocaleString()}</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 data-i18n="incident_location">${t('incident_location')}</h3>
                    <p>${caseData.incident_location}</p>
                    ${caseData.incident_gps_latitude ? `<small>GPS: ${caseData.incident_gps_latitude}, ${caseData.incident_gps_longitude}</small>` : ''}
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 data-i18n="description">${t('description')}</h3>
                    <p>${caseData.incident_description}</p>
                </div>
                
                ${caseData.is_sensitive ? '<div class="alert alert-warning" style="margin-top: 20px;" data-i18n="sensitive_case_warning">⚠️ ' + t('sensitive_case_warning') + '</div>' : ''}
            `;
            
            showModal(t('case_details'), bodyHtml, [
                { text: t('close'), class: 'btn btn-secondary', onclick: 'closeModal()' }
            ]);
        }
    } catch (error) {
        alert(t('failed_load_case_details') + ': ' + error.message);
    }
}

// Show Create User Form
async function showCreateUserModal() {
    // Load centers for the dropdown
    let centersOptions = `<option value="">${t('select_police_center')}</option>`;
    try {
        const centersResponse = await adminAPI.getCenters();
        console.log('Centers response:', centersResponse);
        
        if (centersResponse.status === 'success' && centersResponse.data) {
            centersOptions = `<option value="">${t('select_police_center')}</option>` + 
                centersResponse.data.map(center => 
                    `<option value="${center.id}">${center.name || center.center_name || 'Unnamed Center'}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Failed to load centers:', error);
        centersOptions = `<option value="">${t('error_loading_centers')}</option>`;
    }
    
    const bodyHtml = `
        <form id="createUserForm">
            <div class="form-row">
                <div class="form-group">
                    <label data-i18n="username">${t('username')} *</label>
                    <input type="text" name="username" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label data-i18n="email">${t('email')} *</label>
                    <input type="email" name="email" required autocomplete="email">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label data-i18n="full_name">${t('full_name')} *</label>
                    <input type="text" name="full_name" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label data-i18n="phone">${t('phone')}</label>
                    <input type="tel" name="phone" autocomplete="tel">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label data-i18n="user_role">${t('user_role')} *</label>
                    <select name="role" id="userRole" required onchange="toggleCenterField()">
                        <option value="">${t('select_role')}</option>
                        <option value="ob_officer">${t('ob_officer')}</option>
                        <option value="investigator">${t('investigator')}</option>
                        <option value="court_user">${t('court_user')}</option>
                        <option value="admin">${t('admin')}</option>
                        <option value="super_admin">${t('super_admin')}</option>
                    </select>
                </div>
                <div class="form-group" id="centerFieldGroup">
                    <label data-i18n="police_center">${t('police_center')} *</label>
                    <select name="center_id" id="centerSelect" required>
                        ${centersOptions}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label data-i18n="badge_number">${t('badge_number')}</label>
                <input type="text" name="badge_number">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label data-i18n="password">${t('password')} * <small style="color: #6b7280;">(${t('min_8_chars')})</small></label>
                    <input type="password" name="password" required minlength="8" autocomplete="new-password">
                </div>
                <div class="form-group">
                    <label data-i18n="confirm_password">${t('confirm_password')} *</label>
                    <input type="password" name="password_confirm" required minlength="8" autocomplete="new-password">
                </div>
            </div>
        </form>
    `;
    
    showModal(t('create_new_user'), bodyHtml, [
        { text: t('cancel'), class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: t('create_user'), class: 'btn btn-primary', onclick: 'submitCreateUser()' }
    ]);
}

// Toggle center field based on role
function toggleCenterField() {
    const role = $('#userRole').val();
    const centerField = $('#centerFieldGroup');
    const centerSelect = $('#centerSelect');
    
    if (role === 'super_admin') {
        centerField.hide();
        centerSelect.removeAttr('required');
    } else {
        centerField.show();
        centerSelect.attr('required', 'required');
    }
}

async function submitCreateUser() {
    const form = $('#createUserForm')[0];
    
    // Check form validity
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate password length
    if (data.password.length < 8) {
        await showError(t('validation_error'), t('password_min_8_chars'));
        return;
    }
    
    // Check password match
    if (data.password !== data.password_confirm) {
        await showError(t('validation_error'), t('passwords_do_not_match'));
        return;
    }
    
    delete data.password_confirm;
    
    // Remove center_id if super_admin
    if (data.role === 'super_admin') {
        delete data.center_id;
    }
    
    try {
        showLoading(t('creating_user'), t('please_wait'));
        const response = await adminAPI.createUser(data);
        
        closeAlert();
        if (response.status === 'success') {
            await showSuccess(t('success'), t('user_created_successfully'));
            closeModal();
            loadUsersTable();
        }
    } catch (error) {
        closeAlert();
        console.error('Create user error:', error);
        
        // Handle validation errors
        if (error.status === 400 && error.response && error.response.messages) {
            const messages = error.response.messages;
            let errorText = '';
            
            // Format validation errors
            if (typeof messages === 'object') {
                errorText = Object.values(messages).join('\n');
            } else {
                errorText = messages;
            }
            
            await Swal.fire({
                icon: 'error',
                title: t('validation_error'),
                html: errorText.replace(/\n/g, '<br>'),
                confirmButtonColor: '#ef4444'
            });
        } else {
            await showError(t('error'), t('failed_create_user') + ': ' + error.message);
        }
    }
}

// Edit User
async function editUser(userId) {
    try {
        showLoading(t('loading_user'), t('please_wait'));
        const response = await adminAPI.getUser(userId);
        
        closeAlert();
        if (response.status === 'success') {
            const user = response.data;
            
            // Load centers for dropdown
            let centersOptions = `<option value="">${t('select_police_center')}</option>`;
            try {
                const centersResponse = await adminAPI.getCenters();
                if (centersResponse.status === 'success' && centersResponse.data) {
                    centersOptions = `<option value="">${t('select_police_center')}</option>` + 
                        centersResponse.data.map(center => 
                            `<option value="${center.id}" ${user.center_id == center.id ? 'selected' : ''}>${center.name || center.center_name}</option>`
                        ).join('');
                }
            } catch (error) {
                console.error('Failed to load centers:', error);
            }
            
            const bodyHtml = `
                <form id="editUserForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="username">${t('username')} *</label>
                            <input type="text" name="username" value="${user.username}" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label data-i18n="email">${t('email')} *</label>
                            <input type="email" name="email" value="${user.email}" required autocomplete="email">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="full_name">${t('full_name')} *</label>
                            <input type="text" name="full_name" value="${user.full_name}" required autocomplete="name">
                        </div>
                        <div class="form-group">
                            <label data-i18n="phone">${t('phone')}</label>
                            <input type="tel" name="phone" value="${user.phone || ''}" autocomplete="tel">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="user_role">${t('user_role')} *</label>
                            <select name="role" id="editUserRole" required onchange="toggleEditCenterField()">
                                <option value="ob_officer" ${user.role === 'ob_officer' ? 'selected' : ''}>${t('ob_officer')}</option>
                                <option value="investigator" ${user.role === 'investigator' ? 'selected' : ''}>${t('investigator')}</option>
                                <option value="court_user" ${user.role === 'court_user' ? 'selected' : ''}>${t('court_user')}</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>${t('admin')}</option>
                                <option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>${t('super_admin')}</option>
                            </select>
                        </div>
                        <div class="form-group" id="editCenterFieldGroup">
                            <label data-i18n="police_center">${t('police_center')} *</label>
                            <select name="center_id" id="editCenterSelect" required>
                                ${centersOptions}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="badge_number">${t('badge_number')}</label>
                        <input type="text" name="badge_number" value="${user.badge_number || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="is_active" ${user.is_active ? 'checked' : ''}> <span data-i18n="active">${t('active')}</span>
                        </label>
                    </div>
                    
                    <hr style="margin: 20px 0;">
                    
                    <h4 data-i18n="change_password_optional">${t('change_password_optional')}</h4>
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;" data-i18n="leave_blank_keep_password">${t('leave_blank_keep_password')}</p>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="new_password">${t('new_password')} <small style="color: #6b7280;">(${t('min_8_chars')})</small></label>
                            <input type="password" name="password" minlength="8" autocomplete="new-password">
                        </div>
                        <div class="form-group">
                            <label data-i18n="confirm_new_password">${t('confirm_new_password')}</label>
                            <input type="password" name="password_confirm" minlength="8" autocomplete="new-password">
                        </div>
                    </div>
                </form>
            `;
            
            showModal(t('edit_user'), bodyHtml, [
                { text: t('cancel'), class: 'btn btn-secondary', onclick: 'closeModal()' },
                { text: t('save_changes'), class: 'btn btn-primary', onclick: `submitEditUser(${userId})` }
            ]);
            
            // Toggle center field on load
            toggleEditCenterField();
        }
    } catch (error) {
        closeAlert();
        await showError('Error', 'Failed to load user: ' + error.message);
    }
}

function toggleEditCenterField() {
    const role = $('#editUserRole').val();
    const centerField = $('#editCenterFieldGroup');
    const centerSelect = $('#editCenterSelect');
    
    if (role === 'super_admin') {
        centerField.hide();
        centerSelect.removeAttr('required');
    } else {
        centerField.show();
        centerSelect.attr('required', 'required');
    }
}

async function submitEditUser(userId) {
    const form = $('#editUserForm')[0];
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = {};
    
    // Manually build the data object - include all fields even if empty (except password)
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Handle checkbox separately (not in FormData if unchecked)
    data.is_active = form.querySelector('input[name="is_active"]').checked ? 1 : 0;
    
    // Check passwords
    if (data.password || data.password_confirm) {
        if (data.password.length < 8) {
            await showError('Validation Error', 'Password must be at least 8 characters long');
            return;
        }
        
        if (data.password !== data.password_confirm) {
            await showError('Validation Error', 'Passwords do not match!');
            return;
        }
    } else {
        // Remove password fields if empty
        delete data.password;
    }
    
    delete data.password_confirm;
    
    // Remove center_id if super_admin
    if (data.role === 'super_admin') {
        delete data.center_id;
    }
    
    try {
        // Debug: Log the data being sent
        console.log('Updating user with data:', data);
        
        showLoading(t('updating_user'), t('please_wait'));
        const response = await adminAPI.updateUser(userId, data);
        
        closeAlert();
        if (response.status === 'success') {
            await showSuccess(t('success'), t('user_updated_successfully'));
            closeModal();
            loadUsersTable();
        }
    } catch (error) {
        closeAlert();
        console.error('Update user error:', error);
        
        if (error.status === 400 && error.response && error.response.messages) {
            const messages = error.response.messages;
            let errorText = '';
            
            if (typeof messages === 'object') {
                errorText = Object.values(messages).join('\n');
            } else {
                errorText = messages;
            }
            
            await Swal.fire({
                icon: 'error',
                title: t('validation_error'),
                html: errorText.replace(/\n/g, '<br>'),
                confirmButtonColor: '#ef4444'
            });
        } else {
            await showError(t('error'), t('failed_update_user') + ': ' + error.message);
        }
    }
}

// Manage Case Assignment Modal
function manageCaseAssignment(caseId) {
    const bodyHtml = `
        <p>Assign investigators to Case #${caseId}</p>
        <div class="form-group">
            <label>Select Investigator(s)</label>
            <select id="investigatorSelect" multiple style="height: 150px;">
                <option value="1">Investigator 1</option>
                <option value="2">Investigator 2</option>
                <option value="3">Investigator 3</option>
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
        </div>
        
        <div class="form-group">
            <label>Set Deadline</label>
            <input type="date" id="assignmentDeadline">
        </div>
        
        <div class="form-group">
            <label>Notes</label>
            <textarea id="assignmentNotes" rows="3"></textarea>
        </div>
    `;
    
    showModal('Assign Case', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Assign', class: 'btn btn-primary', onclick: `submitCaseAssignment(${caseId})` }
    ]);
}

function submitCaseAssignment(caseId) {
    const investigators = $('#investigatorSelect').val();
    const deadline = $('#assignmentDeadline').val();
    const notes = $('#assignmentNotes').val();
    
    alert(`Assigning case ${caseId} to investigators: ${investigators.join(', ')}`);
    closeModal();
}
