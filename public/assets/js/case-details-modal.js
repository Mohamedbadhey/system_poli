// ============================================
// Enhanced Case Details Modal - Full Page
// ============================================

/**
 * Helper Functions
 */

// Format date and time
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Format date only
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Get status badge HTML
function getStatusBadge(status) {
    if (!status) return '';
    const statusColors = {
        'draft': '#6b7280',
        'submitted': '#3b82f6',
        'approved': '#10b981',
        'assigned': '#f59e0b',
        'investigating': '#8b5cf6',
        'solved': '#059669',
        'escalated': '#ef4444',
        'court_pending': '#dc2626',
        'closed': '#374151'
    };
    const color = statusColors[status] || '#6b7280';
    return `<span class="badge-status" style="background: ${color}; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${status.replace('_', ' ').toUpperCase()}</span>`;
}

// Get priority badge HTML
function getPriorityBadge(priority) {
    if (!priority) return '';
    const colors = {
        low: '#6b7280',
        medium: '#3b82f6',
        high: '#f59e0b',
        critical: '#ef4444'
    };
    return `<span class="badge-status" style="background: ${colors[priority]}; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${priority.toUpperCase()}</span>`;
}

/**
 * Show full-page case details modal with comprehensive tabs
 * @param {number} caseId - The case ID to display
 * @param {boolean} readOnly - If true, hide all action buttons (for solved cases view)
 */
async function showFullCaseDetailsModal(caseId, readOnly = false) {
    try {
        showLoading(t('loading_data'), t('please_wait'));
        
        // Get user role to determine access
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const userRole = userData.role;
        
        // If not read-only mode, only allow investigators to use this full modal
        if (!readOnly && userRole !== 'investigator') {
            closeAlert();
            console.log('Full case modal is only for investigators. User role:', userRole);
            return null; // Return null to trigger fallback
        }
        
        // Use appropriate API based on role
        let response;
        if (userRole === 'investigator') {
            response = await investigationAPI.getCase(caseId);
        } else if (userRole === 'admin' || userRole === 'super_admin') {
            response = await stationAPI.getCase(caseId);
        } else {
            response = await obAPI.getCase(caseId);
        }
        
        closeAlert();
        
        if (response.status === 'success') {
            const caseData = response.data;
            
            // Create full-page modal
            const modalHtml = `
                <div id="fullCaseModal" class="full-page-modal">
                    <div class="full-modal-header">
                        <div class="modal-header-left">
                            <h2>${caseData.case_number}</h2>
                            <p>OB: ${caseData.ob_number}</p>
                        </div>
                        <div class="modal-header-right">
                            ${getStatusBadge(caseData.status)}
                            ${getPriorityBadge(caseData.priority)}
                            ${caseData.is_sensitive ? '<span class="badge-sensitive">SENSITIVE</span>' : ''}
                            <button class="btn-close-modal" onclick="closeFullCaseModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Court Workflow Actions -->
                    ${buildCourtWorkflowActions(caseData, readOnly)}
                    
                    <div class="full-modal-body">
                        <!-- Tab Navigation -->
                        <div class="case-tabs">
                            <button class="case-tab active" onclick="switchCaseTab('overview')" data-i18n="overview">
                                <i class="fas fa-info-circle"></i> ${t('overview')}
                            </button>
                            <button class="case-tab" onclick="switchCaseTab('accused')" data-i18n="accused">
                                <i class="fas fa-user-shield"></i> ${t('accused')}
                                <span class="tab-count" id="accusedCount">0</span>
                            </button>
                            <button class="case-tab" onclick="switchCaseTab('victims')">
                                <i class="fas fa-user-injured"></i> <span data-i18n="victim">${t('victim')}</span>/<span data-i18n="complainant">${t('complainant')}</span>
                                <span class="tab-count" id="victimsCount">0</span>
                            </button>
                            <button class="case-tab" onclick="switchCaseTab('witnesses')" data-i18n="witness">
                                <i class="fas fa-users"></i> ${t('witness')}
                                <span class="tab-count" id="witnessesCount">0</span>
                            </button>
                            <button class="case-tab" onclick="switchCaseTab('evidence')" data-i18n="evidence">
                                <i class="fas fa-folder-open"></i> ${t('evidence')}
                                <span class="tab-count" id="evidenceCount">0</span>
                            </button>
                            <button class="case-tab" onclick="switchCaseTab('timeline')" data-i18n="timeline">
                                <i class="fas fa-history"></i> ${t('timeline')}
                            </button>
                            ${(function() {
                                const user = getCurrentUser();
                                const isInvestigator = user && (user.userRole === 'investigator' || user.role === 'investigator');
                                console.log('Conclusion Tab Check:', { user, isInvestigator, userRole: user?.userRole, role: user?.role });
                                return isInvestigator;
                            })() ? `
                            <button class="case-tab" onclick="switchCaseTab('conclusion')" data-i18n="conclusion">
                                <i class="fas fa-clipboard-check"></i> ${t('conclusion')}
                            </button>
                            <button class="case-tab" onclick="switchCaseTab('court-acknowledgment')" data-i18n="court_acknowledgment">
                                <i class="fas fa-file-contract"></i> ${t('court_acknowledgment')}
                            </button>
                            <button class="case-tab" onclick="switchCaseTab('custody-docs')" data-i18n="custody_documentation">
                                <i class="fas fa-user-lock"></i> ${t('custody_documentation')}
                            </button>
                            ` : ''}
                        </div>
                        
                        <!-- Tab Content -->
                        <div class="case-tab-content">
                            <!-- Overview Tab -->
                            <div id="tab-overview" class="tab-pane active">
                                ${buildOverviewTab(caseData)}
                            </div>
                            
                            <!-- Accused Tab -->
                            <div id="tab-accused" class="tab-pane">
                                <div class="tab-loading">
                                    <i class="fas fa-spinner fa-spin"></i> <span data-i18n="loading_data">${t('loading_data')}</span>
                                </div>
                            </div>
                            
                            <!-- Victims Tab -->
                            <div id="tab-victims" class="tab-pane">
                                <div class="tab-loading">
                                    <i class="fas fa-spinner fa-spin"></i> <span data-i18n="loading_data">${t('loading_data')}</span>
                                </div>
                            </div>
                            
                            <!-- Witnesses Tab -->
                            <div id="tab-witnesses" class="tab-pane">
                                <div class="tab-loading">
                                    <i class="fas fa-spinner fa-spin"></i> <span data-i18n="loading_data">${t('loading_data')}</span>
                                </div>
                            </div>
                            
                            <!-- Evidence Tab -->
                            <div id="tab-evidence" class="tab-pane">
                                <div class="tab-loading">
                                    <i class="fas fa-spinner fa-spin"></i> <span data-i18n="loading_data">${t('loading_data')}</span>
                                </div>
                            </div>
                            
                            <!-- Timeline Tab -->
                            <div id="tab-timeline" class="tab-pane">
                                <div class="tab-loading">
                                    <i class="fas fa-spinner fa-spin"></i> <span data-i18n="loading_data">${t('loading_data')}</span>
                                </div>
                            </div>
                            
                            <!-- Conclusion Tab (Investigators only) -->
                            ${(function() {
                                const user = getCurrentUser();
                                return user && (user.userRole === 'investigator' || user.role === 'investigator');
                            })() ? `
                            <div id="tab-conclusion" class="tab-pane">
                                <div class="tab-loading">
                                    <i class="fas fa-spinner fa-spin"></i> <span data-i18n="loading_data">${t('loading_data')}</span>
                                </div>
                            </div>
                            
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
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Add to body
            $('body').append(modalHtml);
            
            // Store case data globally
            window.currentCaseData = caseData;
            window.currentCaseData.readOnly = readOnly; // Store readOnly flag
            
            // Pre-process and store parties for easy access
            const parties = caseData.parties || [];
            window.currentCaseData.accused = parties.filter(p => p.party_role === 'accused');
            window.currentCaseData.accusers = parties.filter(p => p.party_role === 'accuser');
            window.currentCaseData.witnesses = parties.filter(p => p.party_role === 'witness');
            
            // Load initial data
            loadCaseParties(caseId);
            
        } else {
            await showError(t('error'), t('failed_to_load'));
            return null;
        }
    } catch (error) {
        closeAlert();
        console.error('Error loading case:', error);
        await showError(t('error'), t('failed_to_load') + ': ' + error.message);
        return null;
    }
    
    return true; // Successfully opened modal
}

/**
 * Build Court Workflow Actions
 * @param {object} caseData - The case data
 * @param {boolean} readOnly - If true, hide action buttons (close case button)
 */
function buildCourtWorkflowActions(caseData, readOnly = false) {
    // Show court assignment alert if assigned back from court
    const courtAssignmentAlert = typeof showCourtAssignmentBadge === 'function' 
        ? showCourtAssignmentBadge(caseData) 
        : '';
    
    // Show court status badge if already sent to court
    const courtStatusBadge = (caseData.court_status && caseData.court_status !== 'not_sent' && typeof getCourtStatusBadge === 'function') 
        ? getCourtStatusBadge(caseData.court_status) 
        : '';
    
    // In read-only mode, only show report buttons
    const hasOtherActions = !readOnly;
    
    return `
        <div class="court-workflow-bar" style="padding: 15px 20px; background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            ${courtAssignmentAlert}
            ${courtStatusBadge}
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: ${courtStatusBadge || courtAssignmentAlert ? '10px' : '0'};">
                <div style="flex: 1; min-width: 200px;">
                    <span style="color: #6c757d;"><i class="fas fa-${readOnly ? 'eye' : 'info-circle'}"></i> ${readOnly ? 'View Case Details (Read-Only)' : (hasOtherActions ? 'Case Actions Available' : 'Case Report')}</span>
                    ${caseData.status === 'closed' ? '<span style="color: #28a745; margin-left: 10px;"><i class="fas fa-check-circle"></i> Case Closed</span>' : ''}
                </div>
                <div style="display: flex; gap: 10px;">
                    ${(function() {
                        const user = getCurrentUser();
                        return user && (user.userRole === 'investigator' || user.role === 'investigator');
                    })() ? `
                    <button class="btn btn-danger" onclick="console.log('🔴 Full Report button clicked for case:', ${caseData.id}); console.log('🔴 generateFullCaseReport function exists?', typeof generateFullCaseReport); generateFullCaseReport(${caseData.id})" style="padding: 8px 16px;" data-i18n="full_report">
                        <i class="fas fa-clipboard-check"></i> ${t('full_report')}
                    </button>
                    <button class="btn btn-warning" onclick="showCustomReportModal(${caseData.id})" style="padding: 8px 16px;" data-i18n="custom_report">
                        <i class="fas fa-sliders-h"></i> ${t('custom_report')}
                    </button>
                    <button class="btn btn-info" onclick="generateCaseReport(${caseData.id})" style="padding: 8px 16px;" data-i18n="basic_report">
                        <i class="fas fa-file-alt"></i> ${t('basic_report')}
                    </button>
                    ` : ''}
                    ${!readOnly ? `
                    <button class="btn btn-success" onclick="showCloseCaseModal(${caseData.id}, '${caseData.case_number}')" style="padding: 8px 16px;" data-i18n="close_case">
                        <i class="fas fa-check-circle"></i> ${t('close_case')}
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Build Overview Tab Content
 */
function buildOverviewTab(caseData) {
    return `
        <div class="overview-grid">
            <!-- Crime Information -->
            <div class="info-section">
                <h3 data-i18n="case_information"><i class="fas fa-gavel"></i> ${t('case_information')}</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label data-i18n="crime_type">${t('crime_type')}</label>
                        <p>${caseData.crime_type}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="crime_category">${t('crime_category')}</label>
                        <p>${caseData.crime_category}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="incident_date">${t('incident_date')}</label>
                        <p>${formatDate(caseData.incident_date)}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="incident_location">${t('incident_location')}</label>
                        <p>${caseData.incident_location || 'N/A'}</p>
                    </div>
                </div>
                <div class="info-item full-width">
                    <label data-i18n="incident_description">${t('incident_description')}</label>
                    <p>${caseData.incident_description || 'N/A'}</p>
                    </div>
            </div>
            
            <!-- Case Status -->
            <div class="info-section">
                <h3 data-i18n="case_status"><i class="fas fa-tasks"></i> ${t('case_status')}</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label data-i18n="status">${t('status')}</label>
                        <p>${getTranslatedStatusBadge(caseData.status)}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="priority">${t('priority')}</label>
                        <p>${getTranslatedPriorityBadge(caseData.priority)}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="court_status">${t('court_status')}</label>
                        <p>${caseData.court_status && typeof getCourtStatusBadge === 'function' ? getCourtStatusBadge(caseData.court_status) : `<span class="category-badge badge-secondary" style="display: inline-block; position: static;" data-i18n="not_sent">${t('not_sent') || 'Not Sent'}</span>`}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="created_at">${t('created_at')}</label>
                        <p>${formatDateTime(caseData.created_at)}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="created_by">${t('created_by')}</label>
                        <p>${caseData.created_by_name || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <!-- Investigation Info -->
            ${caseData.assigned_at ? `
            <div class="info-section">
                <h3 data-i18n="investigation_details"><i class="fas fa-search"></i> ${t('investigation_details') || 'Investigation Details'}</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label data-i18n="lead_investigator">${t('lead_investigator')}</label>
                        <p>${caseData.lead_investigator_name || 'N/A'}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="assigned_date">${t('assigned_date')}</label>
                        <p>${formatDateTime(caseData.assigned_at)}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="deadline">${t('deadline')}</label>
                        <p>${caseData.investigation_deadline ? formatDate(caseData.investigation_deadline) : t('no_deadline')}</p>
                    </div>
                    <div class="info-item">
                        <label data-i18n="team_size">${t('team_size')}</label>
                        <p id="investigatorCount">-</p>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Load case parties (accused, victims, witnesses)
 */
async function loadCaseParties(caseId) {
    try {
        const caseData = window.currentCaseData;
        const parties = caseData.parties || [];
        
        console.log('Case parties data:', parties); // Debug log
        
        // Separate by party_role (database column name)
        const accused = parties.filter(p => p.party_role === 'accused');
        const victims = parties.filter(p => p.party_role === 'accuser');
        const witnesses = parties.filter(p => p.party_role === 'witness');
        
        // Update counts
        $('#accusedCount').text(accused.length);
        $('#victimsCount').text(victims.length);
        $('#witnessesCount').text(witnesses.length);
        
        // Build accused tab
        $('#tab-accused').html(buildAccusedTab(accused, caseId));
        
        // Build victims tab
        $('#tab-victims').html(buildVictimsTab(victims, caseId));
        
        // Build witnesses tab
        $('#tab-witnesses').html(buildWitnessesTab(witnesses, caseId));
        
        // Load notes for each person
        accused.forEach(p => loadPersonNotes(caseId, p.person_id, 'accused'));
        victims.forEach(p => loadPersonNotes(caseId, p.person_id, 'victim'));
        witnesses.forEach(p => loadPersonNotes(caseId, p.person_id, 'witness'));
        
        // Load evidence for each person
        accused.forEach(p => loadPersonEvidence(caseId, p.person_id, 'accused'));
        victims.forEach(p => loadPersonEvidence(caseId, p.person_id, 'victim'));
        witnesses.forEach(p => loadPersonEvidence(caseId, p.person_id, 'witness'));
        
    } catch (error) {
        console.error('Error loading parties:', error);
    }
}

/**
 * Build Accused Tab
 */
function buildAccusedTab(accused, caseId) {
    const readOnly = window.currentCaseData?.readOnly || false;
    
    let html = '<div class="tab-header-actions">';
    if (!readOnly) {
        html += `<button class="btn btn-primary" onclick="showAddPartyModal(${caseId}, 'accused')" data-i18n="add_accused">
                    <i class="fas fa-plus"></i> ${t('add')} ${t('accused')}
                </button>`;
    }
    html += '</div>';
    
    if (accused.length === 0) {
        return html + `
            <div class="empty-state">
                <i class="fas fa-user-shield fa-3x"></i>
                <p data-i18n="no_accused">${t('no_accused') || 'No accused persons in this case'}</p>
            </div>
        `;
    }
    
    html += '<div class="persons-grid">';
    html += accused.map((person, index) => {
        const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Unknown';
        const photoUrl = person.photo_path ? `/${person.photo_path}` : null;
        
        return `
        <div class="person-card accused-card">
            <div class="person-header">
                <div class="person-photo">
                    ${photoUrl ? 
                        `<img src="${photoUrl}" alt="${fullName}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-user fa-3x\\'></i>'">` :
                        `<i class="fas fa-user fa-3x"></i>`
                    }
                </div>
                <div class="person-info">
                    <h3>${fullName}</h3>
                    <span class="role-badge accused-badge" data-i18n="accused">${t('accused').toUpperCase()}</span>
                    ${person.national_id ? `<p>ID: ${person.national_id}</p>` : ''}
                </div>
                ${!readOnly ? `
                <button class="btn btn-sm btn-warning person-edit-btn" onclick="showEditPartyModal(${caseId}, ${person.person_id}, 'accused')" data-i18n-title="edit" title="${t('edit')}">
                    <i class="fas fa-edit"></i>
                </button>
                ` : ''}
            </div>
            
            <div class="person-details">
                <div class="detail-row">
                    <span class="label" data-i18n="age">${t('age') || 'Age'}:</span>
                    <span>${person.age || calculateAge(person.date_of_birth) || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="gender">${t('gender')}:</span>
                    <span>${person.gender || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="phone">${t('phone')}:</span>
                    <span>${person.phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="address">${t('address')}:</span>
                    <span>${person.address || 'N/A'}</span>
                </div>
            </div>
            
            <!-- Investigation Notes Section -->
            <div class="investigation-section">
                <h4 data-i18n="investigation_notes"><i class="fas fa-clipboard-list"></i> ${t('investigation_notes')}</h4>
                
                <!-- Notes History -->
                <div id="accused-notes-history-${person.person_id}" class="notes-history">
                    <div class="loading-small" data-i18n="loading_data">${t('loading_data')}</div>
                </div>
                
                ${!readOnly ? `
                <!-- Add New Note -->
                <div id="accused-notes-${person.person_id}" class="add-note-section">
                    <textarea class="investigation-textarea" data-i18n-placeholder="add_investigation_note" placeholder="${t('add_investigation_note') || 'Add investigation note'}..."></textarea>
                    <button class="btn btn-sm btn-primary" onclick="saveInvestigationNotes(${caseId}, ${person.person_id}, 'accused')" data-i18n="save_note">
                        <i class="fas fa-save"></i> ${t('save_note')}
                    </button>
                </div>
                ` : ''}
            </div>
            
            <!-- Evidence Related to This Person -->
            <div class="person-evidence-section">
                <h4><i class="fas fa-folder"></i> <span data-i18n="evidence_related">${t('evidence_related') || 'Evidence Related to'}</span> ${fullName}</h4>
                <div id="accused-evidence-${person.person_id}" class="evidence-grid">
                    <div class="loading-small" data-i18n="loading_data">${t('loading_data')}</div>
                </div>
                ${!readOnly ? `
                <button class="btn btn-sm btn-secondary" onclick="showUploadEvidenceModal(${caseId}, ${person.person_id}, 'accused')">
                    <i class="fas fa-upload"></i> Upload Evidence
                </button>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
    
    html += '</div>';
    return html;
}

/**
 * Build Victims Tab
 */
function buildVictimsTab(victims, caseId) {
    const readOnly = window.currentCaseData?.readOnly || false;
    
    let html = '<div class="tab-header-actions">';
    if (!readOnly) {
        html += `<button class="btn btn-primary" onclick="showAddPartyModal(${caseId}, 'accuser')" data-i18n="add_victim">
                    <i class="fas fa-plus"></i> ${t('add_victim')}
                </button>`;
    }
    html += '</div>';
    
    if (victims.length === 0) {
        return html + `
            <div class="empty-state">
                <i class="fas fa-user-injured fa-3x"></i>
                <p data-i18n="no_victims">${t('no_victims')}</p>
            </div>
        `;
    }
    
    html += '<div class="persons-grid">';
    html += victims.map((person, index) => {
        const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Unknown';
        const photoUrl = person.photo_path ? `/${person.photo_path}` : null;
        
        return `
        <div class="person-card victim-card">
            <div class="person-header">
                <div class="person-photo">
                    ${photoUrl ? 
                        `<img src="${photoUrl}" alt="${fullName}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-user fa-3x\\'></i>'">` :
                        `<i class="fas fa-user fa-3x"></i>`
                    }
                </div>
                <div class="person-info">
                    <h3>${fullName}</h3>
                    <span class="role-badge victim-badge" data-i18n="victim">${t('victim').toUpperCase()}</span>
                    ${person.national_id ? `<p>ID: ${person.national_id}</p>` : ''}
                </div>
                ${!readOnly ? `
                <button class="btn btn-sm btn-warning person-edit-btn" onclick="showEditPartyModal(${caseId}, ${person.person_id}, 'accuser')" data-i18n-title="edit" title="${t('edit')}">
                    <i class="fas fa-edit"></i>
                </button>
                ` : ''}
            </div>
            
            <div class="person-details">
                <div class="detail-row">
                    <span class="label" data-i18n="age">${t('age')}:</span>
                    <span>${person.age || calculateAge(person.date_of_birth) || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="gender">${t('gender')}:</span>
                    <span>${person.gender || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="phone">${t('phone')}:</span>
                    <span>${person.phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="address">${t('address')}:</span>
                    <span>${person.address || 'N/A'}</span>
                </div>
            </div>
            
            <!-- Statement Section -->
            <div class="investigation-section">
                <h4 data-i18n="victim_statement"><i class="fas fa-file-alt"></i> ${t('victim_statement')}</h4>
                
                <!-- Statements History -->
                <div id="victim-notes-history-${person.person_id}" class="notes-history">
                    <div class="loading-small" data-i18n="loading_data">${t('loading_data')}</div>
                </div>
                
                ${!readOnly ? `
                <!-- Add New Statement -->
                <div id="victim-statement-${person.person_id}" class="add-note-section">
                    <textarea class="investigation-textarea" data-i18n-placeholder="record_statement" placeholder="${t('record_statement')}..."></textarea>
                    <button class="btn btn-sm btn-primary" onclick="saveStatement(${caseId}, ${person.person_id}, 'victim')" data-i18n="save_statement">
                        <i class="fas fa-save"></i> ${t('save_statement')}
                    </button>
                </div>
                ` : ''}
            </div>
            
            <!-- Evidence Related to This Person -->
            <div class="person-evidence-section">
                <h4 data-i18n="evidence"><i class="fas fa-folder"></i> ${t('evidence')}</h4>
                <div id="victim-evidence-${person.person_id}" class="evidence-grid">
                    <div class="loading-small" data-i18n="loading_data">${t('loading_data')}</div>
                </div>
                ${!readOnly ? `
                <button class="btn btn-sm btn-secondary" onclick="showUploadEvidenceModal(${caseId}, ${person.person_id}, 'victim')" data-i18n="upload_evidence">
                    <i class="fas fa-upload"></i> ${t('upload')} ${t('evidence')}
                </button>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
    
    html += '</div>';
    return html;
}

/**
 * Build Witnesses Tab
 */
function buildWitnessesTab(witnesses, caseId) {
    const readOnly = window.currentCaseData?.readOnly || false;
    
    let html = '<div class="tab-header-actions">';
    if (!readOnly) {
        html += `<button class="btn btn-primary" onclick="showAddPartyModal(${caseId}, 'witness')" data-i18n="add_witness">
                    <i class="fas fa-plus"></i> ${t('add_witness')}
                </button>`;
    }
    html += '</div>';
    
    if (witnesses.length === 0) {
        return html + `
            <div class="empty-state">
                <i class="fas fa-users fa-3x"></i>
                <p data-i18n="no_witnesses">${t('no_witnesses')}</p>
            </div>
        `;
    }
    
    html += '<div class="persons-grid">';
    
    html += witnesses.map((person, index) => {
        const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Unknown';
        const photoUrl = person.photo_path ? `/${person.photo_path}` : null;
        
        // Get affiliation badge with person name
        let affiliationBadge = '';
        const affiliation = person.witness_affiliation || 'neutral';
        
        if (affiliation === 'neutral') {
            affiliationBadge = `<span class="affiliation-badge neutral-badge" data-i18n="neutral"><i class="fas fa-balance-scale"></i> ${t('neutral')}</span>`;
        } else if (affiliation === 'accuser') {
            // Find the accuser name
            let accuserName = 'Accuser';
            if (person.affiliated_person_id && window.currentCaseData.accusers) {
                const accuser = window.currentCaseData.accusers.find(p => p.person_id == person.affiliated_person_id);
                if (accuser) {
                    accuserName = (accuser.first_name + ' ' + (accuser.middle_name || '') + ' ' + accuser.last_name).trim();
                }
            }
            affiliationBadge = `<span class="affiliation-badge accuser-badge"><i class="fas fa-hand-holding-heart"></i> <span data-i18n="supports">${t('supports')}</span> ${accuserName}</span>`;
        } else if (affiliation === 'accused') {
            // Find the accused name
            let accusedName = 'Accused';
            if (person.affiliated_person_id && window.currentCaseData.accused) {
                const accused = window.currentCaseData.accused.find(p => p.person_id == person.affiliated_person_id);
                if (accused) {
                    accusedName = (accused.first_name + ' ' + (accused.middle_name || '') + ' ' + accused.last_name).trim();
                }
            }
            affiliationBadge = `<span class="affiliation-badge accused-badge"><i class="fas fa-shield-alt"></i> <span data-i18n="supports">${t('supports')}</span> ${accusedName}</span>`;
        }
        
        return `
        <div class="person-card witness-card">
            <div class="person-header">
                <div class="person-photo">
                    ${photoUrl ? 
                        `<img src="${photoUrl}" alt="${fullName}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-user fa-3x\\'></i>'">` :
                        `<i class="fas fa-user fa-3x"></i>`
                    }
                </div>
                <div class="person-info">
                    <h3>${fullName}</h3>
                    <span class="role-badge witness-badge" data-i18n="witness">${t('witness').toUpperCase()}</span>
                    ${affiliationBadge}
                    ${person.national_id ? `<p>ID: ${person.national_id}</p>` : ''}
                </div>
                ${!readOnly ? `
                <button class="btn btn-sm btn-warning person-edit-btn" onclick="showEditPartyModal(${caseId}, ${person.person_id}, 'witness')" data-i18n-title="edit" title="${t('edit')}">
                    <i class="fas fa-edit"></i>
                </button>
                ` : ''}
            </div>
            
            <div class="person-details">
                <div class="detail-row">
                    <span class="label" data-i18n="age">${t('age')}:</span>
                    <span>${person.age || calculateAge(person.date_of_birth) || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="gender">${t('gender')}:</span>
                    <span>${person.gender || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="phone">${t('phone')}:</span>
                    <span>${person.phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label" data-i18n="address">${t('address')}:</span>
                    <span>${person.address || 'N/A'}</span>
                </div>
            </div>
            
            <!-- Witness Statement Section -->
            <div class="investigation-section">
                <h4 data-i18n="witness_statement"><i class="fas fa-comment-alt"></i> ${t('witness_statement')}</h4>
                
                <!-- Statements History -->
                <div id="witness-notes-history-${person.person_id}" class="notes-history">
                    <div class="loading-small" data-i18n="loading_data">${t('loading_data')}</div>
                </div>
                
                ${!readOnly ? `
                <!-- Add New Statement -->
                <div id="witness-statement-${person.person_id}" class="add-note-section">
                    <textarea class="investigation-textarea" data-i18n-placeholder="testimony" placeholder="${t('testimony')}..."></textarea>
                    <div class="statement-actions">
                        <button class="btn btn-sm btn-primary" onclick="saveStatement(${caseId}, ${person.person_id}, 'witness')" data-i18n="save_statement">
                            <i class="fas fa-save"></i> ${t('save_statement')}
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="recordAudioStatement(${caseId}, ${person.person_id})" data-i18n="record_audio">
                            <i class="fas fa-microphone"></i> ${t('record_audio')}
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <!-- Evidence Related to This Person -->
            <div class="person-evidence-section">
                <h4><i class="fas fa-folder"></i> <span data-i18n="evidence_related">${t('evidence_related') || 'Evidence Related to'}</span> ${fullName}</h4>
                <div id="witness-evidence-${person.person_id}" class="evidence-grid">
                    <div class="loading-small">Loading evidence...</div>
                </div>
                ${!readOnly ? `
                <button class="btn btn-sm btn-secondary" onclick="showUploadEvidenceModal(${caseId}, ${person.person_id}, 'witness')">
                    <i class="fas fa-upload"></i> Upload Evidence
                </button>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
    
    html += '</div>';
    
    return html;
}

/**
 * Switch between tabs
 */
function switchCaseTab(tabName) {
    // Update tab buttons
    $('.case-tab').removeClass('active');
    $(`.case-tab:contains('${tabName.charAt(0).toUpperCase() + tabName.slice(1)}')`).addClass('active');
    
    // Update tab content
    $('.tab-pane').removeClass('active');
    $(`#tab-${tabName}`).addClass('active');
    
    // Load data for specific tabs if not loaded yet
    const caseId = window.currentCaseData.id;
    
    if (tabName === 'evidence') {
        loadAllEvidence(caseId);
    } else if (tabName === 'timeline') {
        loadTimeline(caseId);
    } else if (tabName === 'court-acknowledgment') {
        loadCourtAcknowledgment(caseId);
    } else if (tabName === 'custody-docs') {
        loadCustodyDocumentation(caseId);
    }
    // Note: conclusion tab is handled by case-conclusion.js which extends this function
}

/**
 * Close full case modal
 */
function closeFullCaseModal() {
    $('#fullCaseModal').remove();
    window.currentCaseData = null;
}

/**
 * Load all evidence for the case
 */
async function loadAllEvidence(caseId) {
    try {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const userRole = userData.role;
        const readOnly = window.currentCaseData?.readOnly || false;
        
        let response;
        if (userRole === 'investigator') {
            response = await investigationAPI.getCaseEvidence(caseId);
        } else {
            // For now, use investigation API for all roles
            response = await investigationAPI.getCaseEvidence(caseId);
        }
        
        if (response.status === 'success') {
            const evidence = response.data;
            $('#evidenceCount').text(evidence.length);
            
            if (evidence.length === 0) {
                let emptyHtml = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open fa-3x"></i>
                        <p data-i18n="no_evidence_yet">${t('no_evidence_yet') || 'No evidence uploaded yet'}</p>`;
                if (!readOnly) {
                    emptyHtml += `
                        <button class="btn btn-primary" onclick="showUploadEvidenceModal(${caseId}, null, 'general')" data-i18n="upload_evidence">
                            <i class="fas fa-upload"></i> ${t('upload')} ${t('evidence')}
                        </button>`;
                }
                emptyHtml += `</div>`;
                $('#tab-evidence').html(emptyHtml);
            } else {
                let html = '<div class="evidence-list">';
                evidence.forEach(item => {
                    html += buildEvidenceCard(item, readOnly);
                });
                html += '</div>';
                if (!readOnly) {
                    html += `
                        <div class="add-evidence-btn-container">
                            <button class="btn btn-primary" onclick="showUploadEvidenceModal(${caseId}, null, 'general')">
                                <i class="fas fa-upload"></i> Upload More Evidence
                            </button>
                        </div>
                    `;
                }
                $('#tab-evidence').html(html);
            }
        }
    } catch (error) {
        console.error('Error loading evidence:', error);
        $('#tab-evidence').html(`
            <div class="error-state">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <p>Error loading evidence</p>
            </div>
        `);
    }
}

/**
 * Build evidence card
 */
function buildEvidenceCard(evidence, readOnly = false) {
    const typeIcons = {
        'photo': 'fa-image',
        'video': 'fa-video',
        'audio': 'fa-microphone',
        'document': 'fa-file-alt',
        'physical': 'fa-box',
        'digital': 'fa-laptop'
    };
    
    return `
        <div class="evidence-card">
            <div class="evidence-icon">
                <i class="fas ${typeIcons[evidence.evidence_type] || 'fa-file'} fa-2x"></i>
            </div>
            <div class="evidence-info">
                <h4>${evidence.title}</h4>
                <p class="evidence-type">${evidence.evidence_type}</p>
                <p class="evidence-desc">${evidence.description || 'No description'}</p>
                <p class="evidence-meta">
                    Collected by: ${evidence.collected_by_name || 'Unknown'}<br>
                    Date: ${formatDateTime(evidence.collected_at)}
                </p>
            </div>
            <div class="evidence-actions">
                <button class="btn btn-sm btn-secondary" onclick="downloadEvidence(${evidence.id})">
                    <i class="fas fa-download"></i>
                </button>
                ${!readOnly ? `
                <button class="btn btn-sm btn-primary" onclick="evidenceEditManager.showEditModal(${evidence.id})">
                    <i class="fas fa-edit"></i>
                </button>
                ` : ''}
                <button class="btn btn-sm btn-info" onclick="viewEvidenceDetails(${evidence.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * Load timeline for case
 */
async function loadTimeline(caseId) {
    try {
        $('#tab-timeline').html('<div class="tab-loading"><i class="fas fa-spinner fa-spin"></i> Loading timeline...</div>');
        
        // Load investigation notes for timeline
        const notesResponse = await api.get(`/investigation/cases/${caseId}/notes`);
        const notes = notesResponse.status === 'success' ? notesResponse.data : [];
        
        let timelineItems = [];
        
        // Add case events
        if (window.currentCaseData.created_at) {
            timelineItems.push({
                date: window.currentCaseData.created_at,
                title: 'Case Created',
                description: `By: ${window.currentCaseData.created_by_name || 'System'}`,
                type: 'case'
            });
        }
        
        if (window.currentCaseData.submitted_at) {
            timelineItems.push({
                date: window.currentCaseData.submitted_at,
                title: 'Case Submitted for Review',
                description: '',
                type: 'case'
            });
        }
        
        if (window.currentCaseData.approved_at) {
            timelineItems.push({
                date: window.currentCaseData.approved_at,
                title: 'Case Approved',
                description: '',
                type: 'case'
            });
        }
        
        if (window.currentCaseData.assigned_at) {
            timelineItems.push({
                date: window.currentCaseData.assigned_at,
                title: 'Assigned to Investigator',
                description: `Lead: ${window.currentCaseData.lead_investigator_name || 'N/A'}`,
                type: 'case'
            });
        }
        
        // Add investigation notes and their edits
        notes.forEach(note => {
            const personName = `${note.first_name} ${note.last_name}`;
            
            // Add original note
            timelineItems.push({
                date: note.created_at,
                title: note.note_type === 'statement' ? 'Statement Recorded' : 'Investigation Note Added',
                description: `${note.investigator_name} added ${note.note_type} for ${personName}`,
                detail: note.note_text,
                type: 'note'
            });
            
            // Add edit event if note was edited
            if (note.is_edited == 1 && note.last_edited_at) {
                timelineItems.push({
                    date: note.last_edited_at,
                    title: note.note_type === 'statement' ? 'Statement Edited' : 'Investigation Note Edited',
                    description: `${note.last_editor_name || 'Unknown'} edited ${note.note_type} for ${personName}`,
                    detail: `Updated: ${note.note_text}`,
                    type: 'edit'
                });
            }
        });
        
        // Sort by date (most recent first)
        timelineItems.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Build timeline HTML
        let timelineHtml = `
            <div class="timeline-container">
                <div class="info-section">
                    <h3><i class="fas fa-history"></i> Case Timeline</h3>
                    <div class="timeline">
                        ${timelineItems.map(item => {
                            let markerClass = '';
                            if (item.type === 'note') markerClass = 'timeline-marker-note';
                            else if (item.type === 'edit') markerClass = 'timeline-marker-edit';
                            
                            return `
                            <div class="timeline-item">
                                <div class="timeline-marker ${markerClass}"></div>
                                <div class="timeline-content">
                                    <h4>${item.title}</h4>
                                    <p>${formatDateTime(item.date)}</p>
                                    ${item.description ? `<p class="timeline-user">${item.description}</p>` : ''}
                                    ${item.detail ? `<p class="timeline-detail">${item.detail}</p>` : ''}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        $('#tab-timeline').html(timelineHtml);
    } catch (error) {
        console.error('Error loading timeline:', error);
        $('#tab-timeline').html(`
            <div class="error-state">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <p>Error loading timeline</p>
            </div>
        `);
    }
}

/**
 * Load notes for a person
 */
async function loadPersonNotes(caseId, personId, type) {
    try {
        const response = await api.get(`/investigation/cases/${caseId}/persons/${personId}/notes`);
        
        if (response.status === 'success') {
            const notes = response.data;
            const historyDiv = $(`#${type}-notes-history-${personId}`);
            
            if (notes.length === 0) {
                historyDiv.html(`<p style="color: #9ca3af; font-style: italic; font-size: 13px;" data-i18n="no_notes_yet">${t('no_notes_yet') || 'No notes yet'}</p>`);
            } else {
                let html = '';
                notes.forEach(note => {
                    const isEdited = note.is_edited == 1;
                    const escapedText = note.note_text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                    
                    // Check if this is an audio statement
                    const audioMatch = note.note_text.match(/\[AUDIO_STATEMENT:(\d+)\]/);
                    const isAudioStatement = audioMatch !== null;
                    const evidenceId = audioMatch ? audioMatch[1] : null;
                    
                    if (isAudioStatement) {
                        // Display audio statement with player
                        html += `
                            <div class="note-item audio-statement-item" id="note-${note.id}" data-note-text="${escapedText}">
                                <div class="note-header">
                                    <div>
                                        <i class="fas fa-microphone" style="color: #8b5cf6; margin-right: 5px;"></i>
                                        <strong>${note.investigator_name}</strong>
                                        <span class="badge" style="background: #8b5cf6; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-left: 5px;">AUDIO</span>
                                        ${isEdited ? '<span class="edited-badge" title="This note has been edited">edited</span>' : ''}
                                    </div>
                                    <div class="note-actions">
                                        <span class="note-time">${formatDateTime(note.created_at)}</span>
                                        <button class="btn-icon btn-play-audio" data-evidence-id="${evidenceId}" title="Play audio">
                                            <i class="fas fa-play"></i>
                                        </button>
                                        ${isEdited ? `
                                        <button class="btn-icon btn-history-note" data-note-id="${note.id}" title="View edit history">
                                            <i class="fas fa-history"></i>
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="note-content audio-note-content" id="note-content-${note.id}">
                                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                                        <div style="display: flex; align-items: center; justify-content: space-between;">
                                            <div>
                                                <i class="fas fa-volume-up" style="color: #8b5cf6; margin-right: 8px;"></i>
                                                <span style="font-weight: 600;">Audio Statement</span>
                                            </div>
                                            <button class="btn btn-sm" style="background: #8b5cf6; color: white; padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer;" onclick="playAudioStatement(${evidenceId})">
                                                <i class="fas fa-play"></i> Play Recording
                                            </button>
                                        </div>
                                        <div id="audio-player-${evidenceId}" style="margin-top: 10px; display: none;">
                                            <audio id="audio-element-${evidenceId}" controls style="width: 100%;">
                                                Your browser does not support the audio element.
                                            </audio>
                                        </div>
                                    </div>
                                </div>
                                ${isEdited ? `
                                <div class="note-footer">
                                    <small>Last edited by ${note.last_editor_name} on ${formatDateTime(note.last_edited_at)}</small>
                                </div>
                                ` : ''}
                            </div>
                        `;
                    } else {
                        // Display regular text note
                        html += `
                            <div class="note-item" id="note-${note.id}" data-note-text="${escapedText}">
                                <div class="note-header">
                                    <div>
                                        <strong>${note.investigator_name}</strong>
                                        ${isEdited ? '<span class="edited-badge" title="This note has been edited">edited</span>' : ''}
                                    </div>
                                    <div class="note-actions">
                                        <span class="note-time">${formatDateTime(note.created_at)}</span>
                                        ${!window.currentCaseData?.readOnly ? `
                                        <button class="btn-icon btn-edit-note" data-note-id="${note.id}" data-case-id="${note.case_id}" data-person-id="${note.person_id}" data-type="${type}" title="Edit note">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        ` : ''}
                                        ${isEdited ? `
                                        <button class="btn-icon btn-history-note" data-note-id="${note.id}" title="View edit history">
                                            <i class="fas fa-history"></i>
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="note-content" id="note-content-${note.id}">${note.note_text}</div>
                                ${isEdited ? `
                                <div class="note-footer">
                                    <small>Last edited by ${note.last_editor_name} on ${formatDateTime(note.last_edited_at)}</small>
                                </div>
                                ` : ''}
                            </div>
                        `;
                    }
                });
                historyDiv.html(html);
            }
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        $(`#${type}-notes-history-${personId}`).html('<p style="color: #ef4444;">Failed to load notes</p>');
    }
}

/**
 * Save investigation notes
 */
async function saveInvestigationNotes(caseId, personId, type) {
    const textarea = $(`#${type}-notes-${personId} textarea`);
    const noteText = textarea.val();
    
    if (!noteText.trim()) {
        await showError('Error', 'Please enter some notes');
        return;
    }
    
    try {
        showLoading('Saving Note', 'Please wait...');
        
        const response = await api.post(`/investigation/cases/${caseId}/persons/${personId}/notes`, {
            note_text: noteText,
            note_type: 'investigation'
        });
        
        closeAlert();
        
        if (response.status === 'success') {
            await showSuccess('Success', 'Note saved successfully');
            textarea.val(''); // Clear the textarea
            
            // Reload notes to show the new one
            loadPersonNotes(caseId, personId, type);
        }
    } catch (error) {
        closeAlert();
        console.error('Error saving notes:', error);
        await showError('Error', 'Failed to save note: ' + error.message);
    }
}

/**
 * Save statement
 */
async function saveStatement(caseId, personId, type) {
    const textarea = $(`#${type}-statement-${personId} textarea`);
    const statementText = textarea.val();
    
    if (!statementText.trim()) {
        await showError('Error', 'Please enter a statement');
        return;
    }
    
    try {
        showLoading('Saving Statement', 'Please wait...');
        
        const response = await api.post(`/investigation/cases/${caseId}/persons/${personId}/notes`, {
            note_text: statementText,
            note_type: 'statement'
        });
        
        closeAlert();
        
        if (response.status === 'success') {
            await showSuccess('Success', 'Statement saved successfully');
            textarea.val(''); // Clear the textarea
            
            // Reload notes to show the new one
            loadPersonNotes(caseId, personId, type);
        }
    } catch (error) {
        closeAlert();
        console.error('Error saving statement:', error);
        await showError('Error', 'Failed to save statement: ' + error.message);
    }
}

/**
 * Load evidence for a specific person
 */
async function loadPersonEvidence(caseId, personId, type) {
    try {
        const response = await investigationAPI.getCaseEvidence(caseId);
        
        if (response.status === 'success') {
            const allEvidence = response.data;
            // Filter evidence for this person
            const personEvidence = allEvidence.filter(e => e.collected_from_person_id == personId);
            
            const evidenceDiv = $(`#${type}-evidence-${personId}`);
            
            if (personEvidence.length === 0) {
                evidenceDiv.html(`<p style="color: #9ca3af; font-style: italic; font-size: 13px;" data-i18n="no_evidence_yet">${t('no_evidence_yet') || 'No evidence yet'}</p>`);
            } else {
                let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">';
                personEvidence.forEach(evidence => {
                    const icon = getEvidenceIcon(evidence.evidence_type);
                    const editedBadge = evidence.is_edited ? '<i class="fas fa-edit" style="color: #fbbf24; margin-left: 4px; font-size: 10px;" title="Edited"></i>' : '';
                    
                    // Show actual image for photos, icon for others
                    if (evidence.evidence_type === 'photo') {
                        html += `
                            <div class="evidence-thumb evidence-thumb-image" title="${evidence.title}">
                                <div class="evidence-thumb-preview" id="evidence-preview-${evidence.id}" onclick="viewEvidenceDetails(${evidence.id})" style="cursor: pointer;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </div>
                                <div class="evidence-thumb-title">${evidence.title.substring(0, 18)}${evidence.title.length > 18 ? '...' : ''}${editedBadge}</div>
                                <div class="evidence-thumb-type">${evidence.evidence_type}</div>
                                <div style="display: flex; gap: 4px; justify-content: center; margin-top: 4px;">
                                    ${!window.currentCaseData?.readOnly ? `
                                    <button class="btn btn-sm btn-primary" onclick="evidenceEditManager.showEditModal(${evidence.id})" style="padding: 2px 6px; font-size: 11px;" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-info" onclick="viewEvidenceDetails(${evidence.id})" style="padding: 2px 6px; font-size: 11px;" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    } else {
                        html += `
                            <div class="evidence-thumb" title="${evidence.title}">
                                <div class="evidence-thumb-icon" onclick="viewEvidenceDetails(${evidence.id})" style="cursor: pointer;">
                                    <i class="${icon} fa-2x"></i>
                                </div>
                                <div class="evidence-thumb-title">${evidence.title.substring(0, 18)}${evidence.title.length > 18 ? '...' : ''}${editedBadge}</div>
                                <div class="evidence-thumb-type">${evidence.evidence_type}</div>
                                <div style="display: flex; gap: 4px; justify-content: center; margin-top: 4px;">
                                    ${!window.currentCaseData?.readOnly ? `
                                    <button class="btn btn-sm btn-primary" onclick="evidenceEditManager.showEditModal(${evidence.id})" style="padding: 2px 6px; font-size: 11px;" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-info" onclick="viewEvidenceDetails(${evidence.id})" style="padding: 2px 6px; font-size: 11px;" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                });
                html += '</div>';
                evidenceDiv.html(html);
                
                // Load images with authentication
                personEvidence.forEach(evidence => {
                    if (evidence.evidence_type === 'photo') {
                        loadEvidenceImage(evidence.id);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading person evidence:', error);
        $(`#${type}-evidence-${personId}`).html('<p style="color: #ef4444;">Failed to load evidence</p>');
    }
}

/**
 * Load evidence image with authentication
 */
async function loadEvidenceImage(evidenceId) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidenceId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const preview = $(`#evidence-preview-${evidenceId}`);
            preview.html(`<img src="${url}" alt="Evidence" style="width: 100%; height: 100%; object-fit: cover;">`);
        } else {
            const preview = $(`#evidence-preview-${evidenceId}`);
            preview.html('<i class="fas fa-image fa-2x" style="color: #9ca3af;"></i>');
        }
    } catch (error) {
        console.error('Error loading evidence image:', error);
        const preview = $(`#evidence-preview-${evidenceId}`);
        preview.html('<i class="fas fa-exclamation-triangle fa-2x" style="color: #ef4444;"></i>');
    }
}

/**
 * Get icon for evidence type
 */
function getEvidenceIcon(type) {
    const icons = {
        'photo': 'fas fa-image',
        'video': 'fas fa-video',
        'audio': 'fas fa-microphone',
        'document': 'fas fa-file-alt',
        'physical': 'fas fa-box',
        'digital': 'fas fa-laptop'
    };
    return icons[type] || 'fas fa-file';
}

/**
 * Show upload evidence modal
 */
async function showUploadEvidenceModal(caseId, personId, type) {
    const result = await Swal.fire({
        title: 'Upload Evidence',
        html: `
            <div style="text-align: left;">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Evidence Type *</label>
                    <select id="evidenceType" class="swal2-input" style="width: 100%; padding: 10px;">
                        <option value="">Select Type</option>
                        <option value="photo">📷 Photo/Image</option>
                        <option value="video">🎥 Video</option>
                        <option value="audio">🎤 Audio Recording</option>
                        <option value="document">📄 Document</option>
                        <option value="physical">📦 Physical Evidence Photo</option>
                        <option value="digital">💻 Digital Evidence</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Title *</label>
                    <input id="evidenceTitle" class="swal2-input" placeholder="Brief description" style="width: 100%;">
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Description</label>
                    <textarea id="evidenceDesc" class="swal2-textarea" placeholder="Detailed description..." style="width: 100%; min-height: 80px;"></textarea>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">File *</label>
                    <input type="file" id="evidenceFile" class="swal2-file" accept="*/*" style="width: 100%;">
                    <small style="color: #6b7280;">Max size: 50MB. Supported: images, videos, audio, documents, PDFs</small>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Location Collected</label>
                    <input id="evidenceLocation" class="swal2-input" placeholder="Where was this collected?" style="width: 100%;">
                </div>
                
                <div class="form-group">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="evidenceCritical" style="margin-right: 8px;">
                        <span>Mark as Critical Evidence</span>
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Upload Evidence',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3b82f6',
        width: '600px',
        preConfirm: () => {
            const evidenceType = document.getElementById('evidenceType').value;
            const title = document.getElementById('evidenceTitle').value;
            const description = document.getElementById('evidenceDesc').value;
            const file = document.getElementById('evidenceFile').files[0];
            const location = document.getElementById('evidenceLocation').value;
            const isCritical = document.getElementById('evidenceCritical').checked;
            
            if (!evidenceType) {
                Swal.showValidationMessage('Please select evidence type');
                return false;
            }
            if (!title) {
                Swal.showValidationMessage('Please enter a title');
                return false;
            }
            if (!file) {
                Swal.showValidationMessage('Please select a file');
                return false;
            }
            if (file.size > 50 * 1024 * 1024) {
                Swal.showValidationMessage('File size must be less than 50MB');
                return false;
            }
            
            return { evidenceType, title, description, file, location, isCritical };
        }
    });
    
    if (result.isConfirmed) {
        const data = result.value;
        await submitUploadEvidence(caseId, personId, data, type);
    }
}

/**
 * Submit upload evidence
 */
async function submitUploadEvidence(caseId, personId, data, type) {
    try {
        Swal.fire({
            title: 'Uploading Evidence',
            html: 'Please wait while we upload your file...<br><br><div class="upload-progress"><div class="upload-bar"></div></div>',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('evidence_type', data.evidenceType);
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('location_collected', data.location);
        formData.append('is_critical', data.isCritical ? '1' : '0');
        formData.append('collected_from_person_id', personId);
        
        const response = await investigationAPI.uploadEvidence(caseId, formData);
        
        if (response.status === 'success') {
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Evidence uploaded successfully',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Reload evidence section
            loadPersonEvidence(caseId, personId, type);
            loadAllEvidence(caseId);
            
            // Also refresh main evidence list if it exists
            if (typeof refreshEvidenceList === 'function') {
                refreshEvidenceList();
            }
        }
    } catch (error) {
        console.error('Error uploading evidence:', error);
        Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: error.message || 'Failed to upload evidence. Please try again.'
        });
    }
}

/**
 * Download evidence
 */
async function downloadEvidence(evidenceId) {
    try {
        Swal.fire({
            title: 'Downloading',
            text: 'Preparing file...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidenceId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'evidence_file';
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'Downloaded!',
                text: 'File downloaded successfully',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to download evidence'
            });
        }
    } catch (error) {
        console.error('Error downloading evidence:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to download evidence'
        });
    }
}

/**
 * View evidence details
 */
async function viewEvidenceDetails(evidenceId) {
    try {
        Swal.fire({
            title: 'Loading Details',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await api.get(`/investigation/evidence/${evidenceId}`);
        
        if (response.status === 'success') {
            const evidence = response.data;
            
            // Load media (image, video, audio, or document) with authentication
            let mediaHtml = '';
            if (evidence.evidence_type === 'photo' || evidence.evidence_type === 'video' || evidence.evidence_type === 'audio' || evidence.evidence_type === 'document') {
                try {
                    const token = localStorage.getItem('auth_token');
                    const mediaResponse = await fetch(`${API_BASE_URL}/investigation/evidence/${evidenceId}/download`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (mediaResponse.ok) {
                        const blob = await mediaResponse.blob();
                        const url = URL.createObjectURL(blob);
                        
                        if (evidence.evidence_type === 'photo') {
                            mediaHtml = `
                                <div style="margin-bottom: 20px; text-align: center;">
                                    <img src="${url}" alt="${evidence.title}" style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                </div>
                            `;
                        } else if (evidence.evidence_type === 'video') {
                            mediaHtml = `
                                <div style="margin-bottom: 20px; text-align: center;">
                                    <video controls style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                        <source src="${url}" type="${blob.type}">
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            `;
                        } else if (evidence.evidence_type === 'audio') {
                            mediaHtml = `
                                <div style="margin-bottom: 20px; text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
                                    <i class="fas fa-microphone fa-4x" style="color: white; margin-bottom: 20px; opacity: 0.9;"></i>
                                    <h3 style="color: white; margin-bottom: 20px;">Audio Evidence</h3>
                                    <audio controls style="width: 100%; max-width: 500px;">
                                        <source src="${url}" type="${blob.type}">
                                        Your browser does not support the audio tag.
                                    </audio>
                                </div>
                            `;
                        } else if (evidence.evidence_type === 'document') {
                            // Check if it's a PDF
                            if (blob.type === 'application/pdf' || evidence.file_name.toLowerCase().endsWith('.pdf')) {
                                mediaHtml = `
                                    <div style="margin-bottom: 20px;">
                                        <iframe src="${url}" style="width: 100%; height: 500px; border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>
                                    </div>
                                `;
                            } else if (blob.type.includes('text') || evidence.file_name.match(/\.(txt|log|csv)$/i)) {
                                // For text files, read and display
                                const text = await blob.text();
                                mediaHtml = `
                                    <div style="margin-bottom: 20px;">
                                        <pre style="background: #f9fafb; padding: 15px; border-radius: 8px; max-height: 400px; overflow-y: auto; text-align: left; white-space: pre-wrap; word-wrap: break-word;">${text}</pre>
                                    </div>
                                `;
                            } else {
                                // For all other documents, show message with download option
                                // (iframe won't work for encrypted Word/Excel files - browser can't render them)
                                const fileName = evidence.file_name.toLowerCase();
                                let docIcon = 'fa-file-alt';
                                let docType = 'Document';
                                
                                if (fileName.match(/\.(doc|docx)$/i)) {
                                    docIcon = 'fa-file-word';
                                    docType = 'Word Document';
                                } else if (fileName.match(/\.(xls|xlsx)$/i)) {
                                    docIcon = 'fa-file-excel';
                                    docType = 'Excel Spreadsheet';
                                } else if (fileName.match(/\.(ppt|pptx)$/i)) {
                                    docIcon = 'fa-file-powerpoint';
                                    docType = 'PowerPoint Presentation';
                                }
                                
                                mediaHtml = `
                                    <div style="margin-bottom: 20px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; color: white;">
                                        <i class="fas ${docIcon} fa-4x" style="margin-bottom: 15px; opacity: 0.9;"></i>
                                        <h3 style="margin: 10px 0; color: white;">${docType}</h3>
                                        <p style="margin: 10px 0; opacity: 0.9;">${evidence.file_name}</p>
                                        <p style="margin: 15px 0; font-size: 14px; opacity: 0.85;">
                                            <i class="fas fa-lock"></i> This file is encrypted for security.
                                        </p>
                                        <p style="margin: 10px 0; font-size: 14px; opacity: 0.85;">
                                            Click <strong>Download</strong> below to open it with your local application.
                                        </p>
                                    </div>
                                `;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading media:', error);
                }
            }
            
            let contentHtml = `
                <div style="text-align: left;">
                    ${mediaHtml}
                    
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="margin: 8px 0;"><strong>Type:</strong> ${evidence.evidence_type}</p>
                        <p style="margin: 8px 0;"><strong>Description:</strong> ${evidence.description || 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>Collected By:</strong> ${evidence.collected_by_name || 'Unknown'}</p>
                        <p style="margin: 8px 0;"><strong>Collected At:</strong> ${formatDateTime(evidence.collected_at)}</p>
                        <p style="margin: 8px 0;"><strong>Location:</strong> ${evidence.location_collected || 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>File Size:</strong> ${formatFileSize(evidence.file_size)}</p>
                        ${evidence.is_critical ? '<p style="margin: 8px 0; color: #ef4444; font-weight: 600;">⚠️ CRITICAL EVIDENCE</p>' : ''}
                    </div>
                </div>
            `;
            
            const showFullSizeButton = (evidence.evidence_type === 'photo' || evidence.evidence_type === 'video' || evidence.evidence_type === 'audio' ||
                                        (evidence.evidence_type === 'document' && (evidence.file_name.toLowerCase().endsWith('.pdf') || mediaHtml.includes('iframe')))) && mediaHtml;
            
            Swal.fire({
                title: evidence.title,
                html: contentHtml,
                width: '700px',
                showCancelButton: true,
                showConfirmButton: true,
                showDenyButton: showFullSizeButton,
                confirmButtonText: '<i class="fas fa-download"></i> Download',
                denyButtonText: evidence.evidence_type === 'photo' ? '<i class="fas fa-search-plus"></i> View Full Size' : 
                               evidence.evidence_type === 'video' ? '<i class="fas fa-expand"></i> View Full Screen' :
                               evidence.evidence_type === 'audio' ? '<i class="fas fa-expand"></i> View Full Screen' :
                               '<i class="fas fa-expand"></i> View Full Page',
                cancelButtonText: 'Close',
                confirmButtonColor: '#3b82f6',
                denyButtonColor: '#10b981',
                customClass: {
                    container: 'evidence-details-modal'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    downloadEvidence(evidenceId);
                } else if (result.isDenied) {
                    if (evidence.evidence_type === 'photo') {
                        viewFullSizeImage(evidenceId, evidence.title);
                    } else if (evidence.evidence_type === 'video') {
                        viewFullSizeVideo(evidenceId, evidence.title);
                    } else if (evidence.evidence_type === 'audio') {
                        viewFullSizeAudio(evidenceId, evidence.title);
                    } else if (evidence.evidence_type === 'document') {
                        viewFullSizeDocument(evidenceId, evidence.title, evidence.file_name);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading evidence details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load evidence details'
        });
    }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

/**
 * Show add witness modal
 */
function showAddWitnessModal(caseId) {
    const bodyHtml = `
        <form id="addWitnessForm">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" name="full_name" required>
            </div>
            
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone">
            </div>
            
            <div class="form-group">
                <label>National ID</label>
                <input type="text" name="national_id">
            </div>
            
            <div class="form-group">
                <label>Address</label>
                <textarea name="address" rows="2"></textarea>
            </div>
        </form>
    `;
    
    showModal('Add Witness', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Add', class: 'btn btn-primary', onclick: `submitAddWitness(${caseId})` }
    ]);
}

/**
 * Submit add witness
 */
async function submitAddWitness(caseId) {
    const form = $('#addWitnessForm')[0];
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        showLoading('Adding Witness', 'Please wait...');
        
        const formData = new FormData(form);
        const witnessData = Object.fromEntries(formData);
        witnessData.role = 'witness';
        
        // TODO: Implement API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        closeAlert();
        await showSuccess('Success', 'Witness added successfully');
        closeModal();
        
        // Reload parties
        loadCaseParties(caseId);
        
    } catch (error) {
        closeAlert();
        console.error('Error adding witness:', error);
        await showError('Error', 'Failed to add witness: ' + error.message);
    }
}

/**
 * Show edit note modal
 */
function editNoteModal(noteId, caseId, personId, type) {
    console.log('editNoteModal called with:', { noteId, caseId, personId, type });
    
    // Get current note content from data attribute (unescaped)
    const noteItem = $(`#note-${noteId}`);
    
    console.log('Note item found:', noteItem.length);
    
    const currentContent = noteItem.attr('data-note-text') || noteItem.find('.note-content').text().trim();
    
    console.log('Current content:', currentContent);
    
    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = currentContent;
    const decodedContent = textarea.value;
    
    console.log('Decoded content:', decodedContent);
    
    const bodyHtml = `
        <form id="editNoteForm">
            <div class="form-group">
                <label>Update Note</label>
                <textarea id="editNoteTextarea" rows="6" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">${decodedContent}</textarea>
            </div>
        </form>
    `;
    
    console.log('Calling showModal...');
    console.log('Swal available?', typeof Swal !== 'undefined');
    
    // Check if Swal is available
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert (Swal) is not loaded!');
        alert('Note text:\n\n' + decodedContent + '\n\nPlease edit and we will implement proper modal.');
        return;
    }
    
    // Use SweetAlert instead for better overlay handling
    Swal.fire({
        title: 'Edit Note',
        html: `
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Update Note</label>
                <textarea id="editNoteTextarea" rows="6" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit;">${decodedContent}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update Note',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3b82f6',
        width: '600px',
        preConfirm: () => {
            const noteText = document.getElementById('editNoteTextarea').value;
            if (!noteText.trim()) {
                Swal.showValidationMessage('Note text cannot be empty');
                return false;
            }
            return noteText;
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const noteText = result.value;
            
            try {
                Swal.fire({
                    title: 'Saving Changes',
                    text: 'Please wait...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                const response = await api.put(`/investigation/notes/${noteId}`, {
                    note_text: noteText
                });
                
                if (response.status === 'success') {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Note updated successfully',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Reload notes to show the update
                    loadPersonNotes(caseId, personId, type);
                }
            } catch (error) {
                console.error('Error editing note:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to edit note: ' + error.message
                });
            }
        }
    });
}

// Add event delegation for edit and history buttons
$(document).on('click', '.btn-edit-note', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Edit button clicked');
    
    const noteId = $(this).data('note-id');
    const caseId = $(this).data('case-id');
    const personId = $(this).data('person-id');
    const type = $(this).data('type');
    
    console.log('Note data:', { noteId, caseId, personId, type });
    
    editNoteModal(noteId, caseId, personId, type);
});

$(document).on('click', '.btn-history-note', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const noteId = $(this).data('note-id');
    viewNoteHistory(noteId);
});

/**
 * Submit edit note
 */
async function submitEditNote(noteId, caseId, personId, type) {
    const noteText = $('#editNoteTextarea').val();
    
    if (!noteText.trim()) {
        await showError('Error', 'Note text cannot be empty');
        return;
    }
    
    try {
        showLoading('Saving Changes', 'Please wait...');
        
        const response = await api.put(`/investigation/notes/${noteId}`, {
            note_text: noteText
        });
        
        closeAlert();
        
        if (response.status === 'success') {
            await showSuccess('Success', 'Note updated successfully');
            closeModal();
            
            // Reload notes to show the update
            loadPersonNotes(caseId, personId, type);
        }
    } catch (error) {
        closeAlert();
        console.error('Error editing note:', error);
        await showError('Error', 'Failed to edit note: ' + error.message);
    }
}

/**
 * View note edit history
 */
async function viewNoteHistory(noteId) {
    try {
        showLoading('Loading History', 'Please wait...');
        
        const response = await api.get(`/investigation/notes/${noteId}/history`);
        
        closeAlert();
        
        if (response.status === 'success') {
            const history = response.data;
            
            let bodyHtml = '<div class="note-history-view">';
            
            if (history.length === 0) {
                bodyHtml += '<p style="color: #9ca3af;">No edit history</p>';
            } else {
                bodyHtml += '<div class="timeline" style="max-height: 400px; overflow-y: auto;">';
                history.forEach((edit, index) => {
                    bodyHtml += `
                        <div class="history-item" style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <strong style="color: #1f2937;">${edit.editor_name}</strong>
                                <span style="color: #9ca3af; font-size: 12px;">${formatDateTime(edit.edited_at)}</span>
                            </div>
                            <div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                                <div style="font-size: 11px; color: #6b7280; margin-bottom: 5px;">OLD:</div>
                                <div style="color: #ef4444; text-decoration: line-through;">${edit.old_text}</div>
                            </div>
                            <div style="background: #f0fdf4; padding: 10px; border-radius: 6px;">
                                <div style="font-size: 11px; color: #6b7280; margin-bottom: 5px;">NEW:</div>
                                <div style="color: #10b981;">${edit.new_text}</div>
                            </div>
                        </div>
                    `;
                });
                bodyHtml += '</div>';
            }
            
            bodyHtml += '</div>';
            
            Swal.fire({
                title: '<i class="fas fa-history"></i> Edit History',
                html: bodyHtml,
                width: '700px',
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Close',
                customClass: {
                    confirmButton: 'btn btn-secondary',
                    popup: 'high-z-index-modal'
                },
                didOpen: () => {
                    // Force this modal to appear on top
                    const containers = document.querySelectorAll('.swal2-container');
                    if (containers.length > 0) {
                        const lastContainer = containers[containers.length - 1];
                        lastContainer.style.zIndex = '9999999';
                        const popup = lastContainer.querySelector('.swal2-popup');
                        if (popup) {
                            popup.style.zIndex = '9999999';
                        }
                    }
                }
            });
        }
    } catch (error) {
        closeAlert();
        console.error('Error loading history:', error);
        await showError('Error', 'Failed to load edit history');
    }
}

/**
 * View full size image
 */
async function viewFullSizeImage(evidenceId, title) {
    try {
        Swal.fire({
            title: 'Loading Image',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidenceId}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            Swal.fire({
                title: title,
                html: `<img src="${url}" style="width: 100%; height: auto; max-height: 80vh; object-fit: contain;">`,
                width: '90%',
                showCloseButton: true,
                showConfirmButton: false,
                customClass: {
                    popup: 'fullsize-image-popup'
                }
            });
        }
    } catch (error) {
        console.error('Error loading full size image:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load full size image'
        });
    }
}

/**
 * View full size video
 */
async function viewFullSizeVideo(evidenceId, title) {
    try {
        Swal.fire({
            title: 'Loading Video',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidenceId}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            Swal.fire({
                title: title,
                html: `
                    <video controls autoplay style="width: 100%; max-height: 70vh;">
                        <source src="${url}" type="${blob.type}">
                        Your browser does not support the video tag.
                    </video>
                `,
                width: '90%',
                showCloseButton: true,
                showConfirmButton: false,
                customClass: {
                    popup: 'fullsize-video-popup'
                }
            });
        }
    } catch (error) {
        console.error('Error loading full size video:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load video'
        });
    }
}

/**
 * View full size audio
 */
async function viewFullSizeAudio(evidenceId, title) {
    try {
        Swal.fire({
            title: 'Loading Audio',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidenceId}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            Swal.fire({
                title: title,
                html: `
                    <div style="padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
                        <i class="fas fa-microphone fa-5x" style="color: white; margin-bottom: 30px; opacity: 0.9;"></i>
                        <h3 style="color: white; margin-bottom: 30px;">Audio Evidence</h3>
                        <audio controls autoplay style="width: 100%; max-width: 600px;">
                            <source src="${url}" type="${blob.type}">
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                `,
                width: '800px',
                showCloseButton: true,
                showConfirmButton: false,
                customClass: {
                    popup: 'fullsize-audio-popup'
                }
            });
        }
    } catch (error) {
        console.error('Error loading full size audio:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load audio'
        });
    }
}

/**
 * View full size document
 */
async function viewFullSizeDocument(evidenceId, title, fileName) {
    try {
        Swal.fire({
            title: 'Loading Document',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidenceId}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            let contentHtml = '';
            
            // Check document type
            if (blob.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
                contentHtml = `<iframe src="${url}" style="width: 100%; height: 80vh; border: none;"></iframe>`;
            } else if (blob.type.includes('text') || fileName.match(/\.(txt|log|csv)$/i)) {
                const text = await blob.text();
                contentHtml = `<pre style="background: #f9fafb; padding: 15px; border-radius: 8px; height: 70vh; overflow-y: auto; text-align: left; white-space: pre-wrap; word-wrap: break-word;">${text}</pre>`;
            } else {
                // Try to display any document type in iframe
                contentHtml = `
                    <div>
                        <iframe src="${url}" style="width: 100%; height: 80vh; border: none;"></iframe>
                        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 10px;">
                            <i class="fas fa-info-circle"></i> If the document doesn't display correctly above, please download it to view locally.
                        </p>
                    </div>
                `;
            }
            
            Swal.fire({
                title: title,
                html: contentHtml,
                width: '95%',
                showCloseButton: true,
                showConfirmButton: false,
                customClass: {
                    popup: 'fullsize-document-popup'
                }
            });
        }
    } catch (error) {
        console.error('Error loading full size document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load document'
        });
    }
}

/**
 * Record audio statement
 */
/**
 * Record audio statement
 */
async function recordAudioStatement(caseId, personId) {
    let mediaRecorder = null;
    let audioChunks = [];
    let recordingTimer = null;
    let recordingSeconds = 0;
    
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        await showError('Not Supported', 'Audio recording is not supported in your browser. Please use Chrome, Firefox, or Edge.');
        return;
    }
    
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Show recording modal
        const result = await Swal.fire({
            title: '<i class="fas fa-microphone"></i> Record Audio Statement',
            html: `
                <div style="text-align: center; padding: 20px;">
                    <div id="recordingStatus" style="margin-bottom: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">
                            <i class="fas fa-microphone" id="micIcon" style="color: #6b7280;"></i>
                        </div>
                        <div id="statusText" style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">
                            Ready to Record
                        </div>
                        <div id="recordingTime" style="font-size: 32px; font-weight: 700; color: #ef4444; display: none;">
                            00:00
                        </div>
                        <div id="instructions" style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                            Click "Start Recording" to begin
                        </div>
                    </div>
                    
                    <div id="audioPlayback" style="display: none; margin-top: 20px;">
                        <audio id="audioPreview" controls style="width: 100%; max-width: 400px;"></audio>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <button id="startRecBtn" class="btn btn-danger" style="padding: 12px 24px; font-size: 16px; margin: 5px;">
                            <i class="fas fa-circle"></i> Start Recording
                        </button>
                        <button id="stopRecBtn" class="btn btn-secondary" style="padding: 12px 24px; font-size: 16px; margin: 5px; display: none;">
                            <i class="fas fa-stop"></i> Stop Recording
                        </button>
                        <button id="playRecBtn" class="btn btn-info" style="padding: 12px 24px; font-size: 16px; margin: 5px; display: none;">
                            <i class="fas fa-play"></i> Play
                        </button>
                        <button id="retryRecBtn" class="btn btn-warning" style="padding: 12px 24px; font-size: 16px; margin: 5px; display: none;">
                            <i class="fas fa-redo"></i> Record Again
                        </button>
                    </div>
                </div>
            `,
            width: '600px',
            showCancelButton: true,
            showConfirmButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> Save Audio Statement',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#059669',
            allowOutsideClick: false,
            customClass: {
                popup: 'high-z-index-modal'
            },
            didOpen: () => {
                // Setup MediaRecorder
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    // Show playback
                    document.getElementById('audioPlayback').style.display = 'block';
                    document.getElementById('audioPreview').src = audioUrl;
                    
                    // Update UI
                    document.getElementById('statusText').textContent = 'Recording Complete';
                    document.getElementById('statusText').style.color = '#059669';
                    document.getElementById('recordingTime').style.display = 'none';
                    document.getElementById('micIcon').style.color = '#059669';
                    document.getElementById('instructions').textContent = 'Preview your recording or record again';
                    
                    // Show buttons
                    document.getElementById('playRecBtn').style.display = 'inline-block';
                    document.getElementById('retryRecBtn').style.display = 'inline-block';
                    
                    // Enable confirm button
                    Swal.getConfirmButton().disabled = false;
                    
                    // Store blob for upload
                    window.recordedAudioBlob = audioBlob;
                };
                
                // Start recording button
                document.getElementById('startRecBtn').onclick = () => {
                    audioChunks = [];
                    recordingSeconds = 0;
                    mediaRecorder.start();
                    
                    // Update UI
                    document.getElementById('statusText').textContent = 'Recording...';
                    document.getElementById('statusText').style.color = '#ef4444';
                    document.getElementById('recordingTime').style.display = 'block';
                    document.getElementById('micIcon').style.color = '#ef4444';
                    document.getElementById('micIcon').classList.add('fa-pulse');
                    document.getElementById('instructions').textContent = 'Speak clearly into your microphone';
                    
                    // Hide/show buttons
                    document.getElementById('startRecBtn').style.display = 'none';
                    document.getElementById('stopRecBtn').style.display = 'inline-block';
                    document.getElementById('audioPlayback').style.display = 'none';
                    
                    // Disable confirm button while recording
                    Swal.getConfirmButton().disabled = true;
                    
                    // Start timer
                    recordingTimer = setInterval(() => {
                        recordingSeconds++;
                        const minutes = Math.floor(recordingSeconds / 60);
                        const seconds = recordingSeconds % 60;
                        document.getElementById('recordingTime').textContent = 
                            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                    }, 1000);
                };
                
                // Stop recording button
                document.getElementById('stopRecBtn').onclick = () => {
                    mediaRecorder.stop();
                    clearInterval(recordingTimer);
                    
                    // Hide stop button
                    document.getElementById('stopRecBtn').style.display = 'none';
                    document.getElementById('micIcon').classList.remove('fa-pulse');
                };
                
                // Play button
                document.getElementById('playRecBtn').onclick = () => {
                    document.getElementById('audioPreview').play();
                };
                
                // Retry button
                document.getElementById('retryRecBtn').onclick = () => {
                    // Reset UI
                    document.getElementById('statusText').textContent = 'Ready to Record';
                    document.getElementById('statusText').style.color = '#1f2937';
                    document.getElementById('recordingTime').textContent = '00:00';
                    document.getElementById('recordingTime').style.display = 'none';
                    document.getElementById('micIcon').style.color = '#6b7280';
                    document.getElementById('instructions').textContent = 'Click "Start Recording" to begin';
                    document.getElementById('audioPlayback').style.display = 'none';
                    document.getElementById('startRecBtn').style.display = 'inline-block';
                    document.getElementById('playRecBtn').style.display = 'none';
                    document.getElementById('retryRecBtn').style.display = 'none';
                    
                    // Disable confirm button
                    Swal.getConfirmButton().disabled = true;
                    
                    // Clear chunks
                    audioChunks = [];
                    window.recordedAudioBlob = null;
                };
                
                // Initially disable confirm button
                Swal.getConfirmButton().disabled = true;
                
                // Force modal on top
                const containers = document.querySelectorAll('.swal2-container');
                if (containers.length > 0) {
                    const lastContainer = containers[containers.length - 1];
                    lastContainer.style.zIndex = '9999999';
                    const popup = lastContainer.querySelector('.swal2-popup');
                    if (popup) {
                        popup.style.zIndex = '9999999';
                    }
                }
            },
            preConfirm: () => {
                if (!window.recordedAudioBlob) {
                    Swal.showValidationMessage('Please record audio before saving');
                    return false;
                }
                return true;
            },
            willClose: () => {
                // Stop all tracks and cleanup
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                if (recordingTimer) {
                    clearInterval(recordingTimer);
                }
            }
        });
        
        if (result.isConfirmed && window.recordedAudioBlob) {
            // Upload audio and create statement
            try {
                showLoading('Saving Audio Statement', 'Please wait...');
                
                // First, upload the audio file as evidence
                const formData = new FormData();
                formData.append('title', `Audio Statement - ${new Date().toLocaleString()}`);
                formData.append('description', 'Recorded audio statement');
                formData.append('evidence_type', 'audio');
                formData.append('file', window.recordedAudioBlob, `audio_statement_${Date.now()}.webm`);
                formData.append('collected_from_person_id', personId);
                
                const token = localStorage.getItem('auth_token');
                const uploadResponse = await fetch(`${API_BASE_URL}/investigation/cases/${caseId}/evidence`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const evidenceData = await uploadResponse.json();
                
                if (evidenceData.status === 'success') {
                    // Now create a statement note with reference to the audio file
                    const evidenceId = evidenceData.data.id;
                    const audioUrl = evidenceData.data.file_path || evidenceData.data.file_name;
                    
                    const noteResponse = await api.post(`/investigation/cases/${caseId}/persons/${personId}/notes`, {
                        note_text: `[AUDIO_STATEMENT:${evidenceId}] Audio statement recorded on ${new Date().toLocaleString()}`,
                        note_type: 'statement'
                    });
                    
                    closeAlert();
                    
                    if (noteResponse.status === 'success') {
                        await showSuccess('Success', 'Audio statement saved successfully');
                        
                        // Cleanup
                        window.recordedAudioBlob = null;
                        
                        // Reload notes to show the new audio statement
                        const personType = window.currentCaseData.parties.find(p => p.person_id == personId)?.party_role;
                        if (personType) {
                            loadPersonNotes(caseId, personId, personType === 'accuser' ? 'victim' : personType);
                        }
                    } else {
                        throw new Error(noteResponse.message || 'Failed to create statement note');
                    }
                } else {
                    throw new Error(evidenceData.message || 'Upload failed');
                }
            } catch (error) {
                closeAlert();
                console.error('Error saving audio statement:', error);
                await showError('Error', 'Failed to save audio statement: ' + error.message);
            }
        } else {
            // Cleanup
            window.recordedAudioBlob = null;
        }
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        await showError('Microphone Access Denied', 'Please allow microphone access to record audio statements.');
    }
}

/**
 * Play audio statement
 */
async function playAudioStatement(evidenceId) {
    const playerDiv = document.getElementById(`audio-player-${evidenceId}`);
    const audioElement = document.getElementById(`audio-element-${evidenceId}`);
    
    // Show player
    playerDiv.style.display = 'block';
    
    // If audio source is not set, load it
    if (!audioElement.src || audioElement.src === window.location.href) {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidenceId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                audioElement.src = url;
                audioElement.play();
            } else {
                await showError('Error', 'Failed to load audio file');
            }
        } catch (error) {
            console.error('Error loading audio:', error);
            await showError('Error', 'Failed to load audio: ' + error.message);
        }
    } else {
        // Audio already loaded, just play it
        audioElement.play();
    }
}

/**
 * Toggle affiliated person dropdown based on witness affiliation selection
 */
function toggleAffiliatedPersonSelect() {
    const affiliation = document.getElementById('witness_affiliation').value;
    const container = document.getElementById('affiliated_person_container');
    const personSelect = document.getElementById('affiliated_person_id');
    
    if (affiliation === 'accuser' || affiliation === 'accused') {
        // Show the person selection dropdown
        container.style.display = 'block';
        
        // Populate with relevant persons from current case
        const caseData = window.currentCaseData;
        personSelect.innerHTML = '<option value="">-- Select Person --</option>';
        
        if (affiliation === 'accuser' && caseData.accusers) {
            caseData.accusers.forEach(person => {
                const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.trim();
                personSelect.innerHTML += `<option value="${person.person_id}">${fullName}</option>`;
            });
        } else if (affiliation === 'accused' && caseData.accused) {
            caseData.accused.forEach(person => {
                const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.trim();
                personSelect.innerHTML += `<option value="${person.person_id}">${fullName}</option>`;
            });
        }
    } else {
        // Hide for neutral witnesses
        container.style.display = 'none';
        personSelect.value = '';
    }
}

/**
 * Show modal to add a new party (accused/accuser/witness) to case
 */
async function showAddPartyModal(caseId, partyType) {
    const partyLabels = {
        'accused': 'Accused Person',
        'accuser': 'Victim/Accuser',
        'witness': 'Witness'
    };
    
    const result = await Swal.fire({
        title: `Add ${partyLabels[partyType]}`,
        html: `
            <form id="addPartyForm" style="text-align: left;">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-weight: 600; margin-bottom: 5px; display: block;">Photo</label>
                    <div style="text-align: center; margin-bottom: 10px;">
                        <div id="party_photo_preview" style="display: none; margin-bottom: 10px;">
                            <img src="" alt="Photo preview" style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 2px solid #e5e7eb;">
                        </div>
                        <input type="file" id="party_photo" accept="image/*" onchange="previewPartyPhoto(event)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        <small style="color: #6b7280; font-size: 12px;">Max 5MB (JPG, PNG, GIF, WebP)</small>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>First Name <span style="color: red;">*</span></label>
                    <input type="text" id="first_name" class="swal2-input" required style="width: 100%; margin: 5px 0;">
                </div>
                
                <div class="form-group">
                    <label>Middle Name</label>
                    <input type="text" id="middle_name" class="swal2-input" style="width: 100%; margin: 5px 0;">
                </div>
                
                <div class="form-group">
                    <label>Last Name <span style="color: red;">*</span></label>
                    <input type="text" id="last_name" class="swal2-input" required style="width: 100%; margin: 5px 0;">
                </div>
                
                <div class="form-group">
                    <label>Age</label>
                    <input type="number" id="age" class="swal2-input" placeholder="Enter age" min="0" max="150" style="width: 100%; margin: 5px 0;">
                </div>
                
                <div class="form-group">
                    <label>Gender</label>
                    <select id="gender" class="swal2-input" style="width: 100%; margin: 5px 0;">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                ${partyType === 'witness' ? `
                <div class="form-group" style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <label style="font-weight: 600; color: #1f2937;">Witness Affiliation <span style="color: red;">*</span></label>
                    <select id="witness_affiliation" class="swal2-input" required style="width: 100%; margin: 5px 0;" onchange="toggleAffiliatedPersonSelect()">
                        <option value="">Select Affiliation</option>
                        <option value="neutral">Neutral / General Witness</option>
                        <option value="accuser">Supports Accuser/Victim</option>
                        <option value="accused">Supports Accused</option>
                    </select>
                    <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 5px;">
                        <i class="fas fa-info-circle"></i> Select which party this witness supports, or neutral if independent
                    </small>
                    
                    <div id="affiliated_person_container" style="display: none; margin-top: 10px;">
                        <label style="font-weight: 600; color: #1f2937;">Select Specific Person <span style="color: red;">*</span></label>
                        <select id="affiliated_person_id" class="swal2-input" style="width: 100%; margin: 5px 0;">
                            <option value="">-- Select Person --</option>
                        </select>
                        <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 5px;">
                            <i class="fas fa-user"></i> Choose the specific person this witness supports
                        </small>
                    </div>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label>National ID</label>
                    <input type="text" id="national_id" class="swal2-input" style="width: 100%; margin: 5px 0;">
                </div>
                
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" id="phone" class="swal2-input" style="width: 100%; margin: 5px 0;">
                </div>
                
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" class="swal2-input" style="width: 100%; margin: 5px 0;">
                </div>
                
                <div class="form-group">
                    <label>Address</label>
                    <textarea id="address" class="swal2-textarea" style="width: 100%; margin: 5px 0; height: 80px;"></textarea>
                </div>
            </form>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: `Add ${partyLabels[partyType]}`,
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        preConfirm: () => {
            const firstName = document.getElementById('first_name').value;
            const lastName = document.getElementById('last_name').value;
            
            if (!firstName || !lastName) {
                Swal.showValidationMessage('First Name and Last Name are required');
                return false;
            }
            
            // Check witness affiliation for witnesses
            if (partyType === 'witness') {
                const affiliation = document.getElementById('witness_affiliation').value;
                if (!affiliation) {
                    Swal.showValidationMessage('Please select witness affiliation');
                    return false;
                }
                
                // If witness supports a party, must select specific person
                if ((affiliation === 'accuser' || affiliation === 'accused')) {
                    const affiliatedPersonId = document.getElementById('affiliated_person_id').value;
                    if (!affiliatedPersonId) {
                        Swal.showValidationMessage('Please select the specific person this witness supports');
                        return false;
                    }
                }
            }
            
            // Calculate date of birth from age if provided
            const age = document.getElementById('age').value;
            let dateOfBirth = null;
            if (age) {
                const currentYear = new Date().getFullYear();
                const birthYear = currentYear - parseInt(age);
                dateOfBirth = `${birthYear}-01-01`; // Use January 1st as approximate DOB
            }
            
            const witnessAffiliation = partyType === 'witness' ? document.getElementById('witness_affiliation').value : null;
            const affiliatedPersonId = (partyType === 'witness' && (witnessAffiliation === 'accuser' || witnessAffiliation === 'accused')) 
                ? document.getElementById('affiliated_person_id').value 
                : null;
            
            return {
                person_type: partyType,
                first_name: firstName,
                middle_name: document.getElementById('middle_name').value,
                last_name: lastName,
                date_of_birth: dateOfBirth,
                gender: document.getElementById('gender').value || null,
                national_id: document.getElementById('national_id').value || null,
                phone: document.getElementById('phone').value || null,
                email: document.getElementById('email').value || null,
                address: document.getElementById('address').value || null,
                witness_affiliation: witnessAffiliation,
                affiliated_person_id: affiliatedPersonId,
                photoFile: document.getElementById('party_photo').files[0] || null
            };
        }
    });
    
    if (result.isConfirmed) {
        try {
            showLoading('Adding Party', 'Please wait...');
            
            // Create FormData to handle file upload
            const formData = new FormData();
            formData.append('person_type', result.value.person_type);
            formData.append('first_name', result.value.first_name);
            if (result.value.middle_name) formData.append('middle_name', result.value.middle_name);
            formData.append('last_name', result.value.last_name);
            if (result.value.date_of_birth) formData.append('date_of_birth', result.value.date_of_birth);
            if (result.value.gender) formData.append('gender', result.value.gender);
            if (result.value.national_id) formData.append('national_id', result.value.national_id);
            if (result.value.phone) formData.append('phone', result.value.phone);
            if (result.value.email) formData.append('email', result.value.email);
            if (result.value.address) formData.append('address', result.value.address);
            if (result.value.witness_affiliation) formData.append('witness_affiliation', result.value.witness_affiliation);
            if (result.value.affiliated_person_id) formData.append('affiliated_person_id', result.value.affiliated_person_id);
            if (result.value.photoFile) formData.append('photo', result.value.photoFile);
            
            // Send FormData with auth token
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/investigation/cases/${caseId}/parties`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            closeAlert();
            
            if (data.status === 'success') {
                await showSuccess('Success', `${partyLabels[partyType]} added successfully`);
                
                // Reload case data and refresh the tab
                const caseResponse = await investigationAPI.getCase(caseId);
                if (caseResponse.status === 'success') {
                    window.currentCaseData = caseResponse.data;
                    
                    // Pre-process and store parties for easy access
                    const parties = caseResponse.data.parties || [];
                    window.currentCaseData.accused = parties.filter(p => p.party_role === 'accused');
                    window.currentCaseData.accusers = parties.filter(p => p.party_role === 'accuser');
                    window.currentCaseData.witnesses = parties.filter(p => p.party_role === 'witness');
                    
                    loadCaseParties(caseId);
                }
            } else {
                throw new Error(data.message || 'Failed to add party');
            }
        } catch (error) {
            closeAlert();
            console.error('Error adding party:', error);
            await showError('Error', 'Failed to add party: ' + (error.message || 'Unknown error'));
        }
    }
}

/**
 * Preview photo for party being added
 */
function previewPartyPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            Swal.showValidationMessage('File too large. Please select an image smaller than 5MB');
            event.target.value = '';
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            Swal.showValidationMessage('Invalid file type. Please select a valid image file');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#party_photo_preview img').attr('src', e.target.result);
            $('#party_photo_preview').show();
        };
        reader.readAsDataURL(file);
    } else {
        $('#party_photo_preview').hide();
    }
}

/**
 * Show modal to edit existing party information
 */
async function showEditPartyModal(caseId, personId, partyType) {
    const partyLabels = {
        'accused': 'Accused Person',
        'accuser': 'Victim/Accuser',
        'witness': 'Witness'
    };
    
    try {
        // Load person data first
        showLoading('Loading', 'Fetching person details...');
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/investigation/cases/${caseId}/parties/${personId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        closeAlert();
        
        if (data.status !== 'success') {
            throw new Error('Failed to load person data');
        }
        
        const person = data.data;
        
        // Calculate age from date of birth
        let age = '';
        if (person.date_of_birth) {
            const today = new Date();
            const birthDate = new Date(person.date_of_birth);
            age = today.getFullYear() - birthDate.getFullYear();
        }
        
        const result = await Swal.fire({
            title: `Edit ${partyLabels[partyType]}`,
            html: `
                <form id="editPartyForm" style="text-align: left;">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; margin-bottom: 5px; display: block;">Photo</label>
                        <div style="text-align: center; margin-bottom: 10px;">
                            <div id="party_photo_preview" style="margin-bottom: 10px;">
                                ${person.photo_path ? 
                                    `<img src="/${person.photo_path}" alt="Current photo" style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 2px solid #e5e7eb;">` :
                                    `<div style="color: #9ca3af;">No photo uploaded</div>`
                                }
                            </div>
                            <input type="file" id="party_photo" accept="image/*" onchange="previewPartyPhoto(event)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <small style="color: #6b7280; font-size: 12px;">Upload new photo to replace (Max 5MB)</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>First Name <span style="color: red;">*</span></label>
                        <input type="text" id="first_name" class="swal2-input" required style="width: 100%; margin: 5px 0;" value="${person.first_name || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Middle Name</label>
                        <input type="text" id="middle_name" class="swal2-input" style="width: 100%; margin: 5px 0;" value="${person.middle_name || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Last Name <span style="color: red;">*</span></label>
                        <input type="text" id="last_name" class="swal2-input" required style="width: 100%; margin: 5px 0;" value="${person.last_name || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" id="age" class="swal2-input" placeholder="Enter age" min="0" max="150" style="width: 100%; margin: 5px 0;" value="${age}">
                    </div>
                    
                    <div class="form-group">
                        <label>Gender</label>
                        <select id="gender" class="swal2-input" style="width: 100%; margin: 5px 0;">
                            <option value="">Select Gender</option>
                            <option value="male" ${person.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${person.gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${person.gender === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    ${partyType === 'witness' ? `
                    <div class="form-group" style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <label style="font-weight: 600; color: #1f2937;">Witness Affiliation <span style="color: red;">*</span></label>
                        <select id="witness_affiliation" class="swal2-input" required style="width: 100%; margin: 5px 0;" onchange="toggleAffiliatedPersonSelect()">
                            <option value="">Select Affiliation</option>
                            <option value="neutral" ${person.witness_affiliation === 'neutral' || !person.witness_affiliation ? 'selected' : ''}>Neutral / General Witness</option>
                            <option value="accuser" ${person.witness_affiliation === 'accuser' ? 'selected' : ''}>Supports Accuser/Victim</option>
                            <option value="accused" ${person.witness_affiliation === 'accused' ? 'selected' : ''}>Supports Accused</option>
                        </select>
                        <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 5px;">
                            <i class="fas fa-info-circle"></i> Select which party this witness supports, or neutral if independent
                        </small>
                        
                        <div id="affiliated_person_container" style="display: ${person.witness_affiliation === 'accuser' || person.witness_affiliation === 'accused' ? 'block' : 'none'}; margin-top: 10px;">
                            <label style="font-weight: 600; color: #1f2937;">Select Specific Person <span style="color: red;">*</span></label>
                            <select id="affiliated_person_id" class="swal2-input" style="width: 100%; margin: 5px 0;">
                                <option value="">-- Select Person --</option>
                                ${person.witness_affiliation === 'accuser' && window.currentCaseData.accusers ? 
                                    window.currentCaseData.accusers.map(p => {
                                        const fullName = (p.first_name + ' ' + (p.middle_name || '') + ' ' + p.last_name).trim();
                                        return `<option value="${p.person_id}" ${p.person_id == person.affiliated_person_id ? 'selected' : ''}>${fullName}</option>`;
                                    }).join('') : ''}
                                ${person.witness_affiliation === 'accused' && window.currentCaseData.accused ? 
                                    window.currentCaseData.accused.map(p => {
                                        const fullName = (p.first_name + ' ' + (p.middle_name || '') + ' ' + p.last_name).trim();
                                        return `<option value="${p.person_id}" ${p.person_id == person.affiliated_person_id ? 'selected' : ''}>${fullName}</option>`;
                                    }).join('') : ''}
                            </select>
                            <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 5px;">
                                <i class="fas fa-user"></i> Choose the specific person this witness supports
                            </small>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label>National ID</label>
                        <input type="text" id="national_id" class="swal2-input" style="width: 100%; margin: 5px 0;" value="${person.national_id || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="phone" class="swal2-input" style="width: 100%; margin: 5px 0;" value="${person.phone || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="email" class="swal2-input" style="width: 100%; margin: 5px 0;" value="${person.email || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="address" class="swal2-textarea" style="width: 100%; margin: 5px 0; height: 80px;">${person.address || ''}</textarea>
                    </div>
                </form>
            `,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: 'Update',
            cancelButtonText: 'Cancel',
            focusConfirm: false,
            preConfirm: () => {
                const firstName = document.getElementById('first_name').value;
                const lastName = document.getElementById('last_name').value;
                
                if (!firstName || !lastName) {
                    Swal.showValidationMessage('First Name and Last Name are required');
                    return false;
                }
                
                // Check witness affiliation for witnesses
                if (partyType === 'witness') {
                    const affiliation = document.getElementById('witness_affiliation').value;
                    if (!affiliation) {
                        Swal.showValidationMessage('Please select witness affiliation');
                        return false;
                    }
                    
                    // If witness supports a party, must select specific person
                    if ((affiliation === 'accuser' || affiliation === 'accused')) {
                        const affiliatedPersonId = document.getElementById('affiliated_person_id').value;
                        if (!affiliatedPersonId) {
                            Swal.showValidationMessage('Please select the specific person this witness supports');
                            return false;
                        }
                    }
                }
                
                // Calculate date of birth from age if provided
                const age = document.getElementById('age').value;
                let dateOfBirth = person.date_of_birth; // Keep existing if age not changed
                if (age) {
                    const currentYear = new Date().getFullYear();
                    const birthYear = currentYear - parseInt(age);
                    dateOfBirth = `${birthYear}-01-01`;
                }
                
                const witnessAffiliation = partyType === 'witness' ? document.getElementById('witness_affiliation').value : null;
                const affiliatedPersonId = (partyType === 'witness' && (witnessAffiliation === 'accuser' || witnessAffiliation === 'accused')) 
                    ? document.getElementById('affiliated_person_id').value 
                    : null;
                
                return {
                    first_name: firstName,
                    middle_name: document.getElementById('middle_name').value,
                    last_name: lastName,
                    date_of_birth: dateOfBirth,
                    gender: document.getElementById('gender').value || null,
                    national_id: document.getElementById('national_id').value || null,
                    phone: document.getElementById('phone').value || null,
                    email: document.getElementById('email').value || null,
                    address: document.getElementById('address').value || null,
                    witness_affiliation: witnessAffiliation,
                    affiliated_person_id: affiliatedPersonId,
                    photoFile: document.getElementById('party_photo').files[0] || null
                };
            }
        });
        
        if (result.isConfirmed) {
            try {
                showLoading('Updating', 'Please wait...');
                
                // Create FormData to handle file upload
                const formData = new FormData();
                formData.append('first_name', result.value.first_name);
                if (result.value.middle_name) formData.append('middle_name', result.value.middle_name);
                formData.append('last_name', result.value.last_name);
                if (result.value.date_of_birth) formData.append('date_of_birth', result.value.date_of_birth);
                if (result.value.gender) formData.append('gender', result.value.gender);
                if (result.value.national_id) formData.append('national_id', result.value.national_id);
                if (result.value.phone) formData.append('phone', result.value.phone);
                if (result.value.email) formData.append('email', result.value.email);
                if (result.value.address) formData.append('address', result.value.address);
                if (result.value.witness_affiliation) formData.append('witness_affiliation', result.value.witness_affiliation);
                if (result.value.affiliated_person_id) formData.append('affiliated_person_id', result.value.affiliated_person_id);
                if (result.value.photoFile) formData.append('photo', result.value.photoFile);
                
                // Send update request
                const updateResponse = await fetch(`${API_BASE_URL}/investigation/cases/${caseId}/parties/${personId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const updateData = await updateResponse.json();
                
                closeAlert();
                
                if (updateData.status === 'success') {
                    await showSuccess('Success', 'Person information updated successfully');
                    
                    // Reload case data and refresh the tab
                    const caseResponse = await investigationAPI.getCase(caseId);
                    if (caseResponse.status === 'success') {
                        window.currentCaseData = caseResponse.data;
                        
                        // Pre-process and store parties for easy access
                        const parties = caseResponse.data.parties || [];
                        window.currentCaseData.accused = parties.filter(p => p.party_role === 'accused');
                        window.currentCaseData.accusers = parties.filter(p => p.party_role === 'accuser');
                        window.currentCaseData.witnesses = parties.filter(p => p.party_role === 'witness');
                        
                        loadCaseParties(caseId);
                    }
                } else {
                    throw new Error(updateData.message || 'Failed to update person');
                }
            } catch (error) {
                closeAlert();
                console.error('Error updating party:', error);
                await showError('Error', 'Failed to update person: ' + (error.message || 'Unknown error'));
            }
        }
    } catch (error) {
        closeAlert();
        console.error('Error loading person data:', error);
        await showError('Error', 'Failed to load person data: ' + (error.message || 'Unknown error'));
    }
}

/**
 * Load Court Acknowledgment Tab
 */
async function loadCourtAcknowledgment(caseId) {
    try {
        const response = await api.get(`/investigation/cases/${caseId}/court-acknowledgment`);
        const data = response.data;
        
        let html = `
            <div class="court-acknowledgment-section" style="padding: 20px;">
                <div class="section-header" style="margin-bottom: 20px;">
                    <h3><i class="fas fa-file-contract"></i> <span data-i18n="court_acknowledgment">${t('court_acknowledgment')}</span></h3>
                    <p data-i18n="court_acknowledgment_desc">${t('court_acknowledgment_desc') || 'Upload the court letter or permit authorizing investigation'}</p>
                </div>
                
                ${data ? `
                    <div class="acknowledgment-display" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <div style="margin-bottom: 15px;">
                            <img src="/${data.file_path}" alt="Court Acknowledgment" style="max-width: 100%; max-height: 600px; border: 2px solid #ddd; border-radius: 8px; display: block; margin: 0 auto;">
                        </div>
                        ${data.notes ? `
                            <div style="background: #fff; padding: 15px; border-radius: 4px; margin-top: 15px;">
                                <strong>Notes:</strong>
                                <p style="margin: 5px 0 0 0;">${data.notes}</p>
                            </div>
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                            <p style="margin: 0;"><strong data-i18n="uploaded">${t('uploaded')}:</strong> ${formatDateTime(data.uploaded_at)}</p>
                            ${!window.currentCaseData?.readOnly ? `
                            <div>
                                <button class="btn btn-warning btn-sm" onclick="editCourtAcknowledgment(${caseId})" style="margin-right: 10px;">
                                    <i class="fas fa-edit"></i> <span data-i18n="edit">${t('edit') || 'Edit'}</span>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="deleteCourtAcknowledgment(${caseId})">
                                    <i class="fas fa-trash"></i> <span data-i18n="delete">${t('delete')}</span>
                                </button>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                ` : window.currentCaseData?.readOnly ? `
                    <div class="empty-state" style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
                        <i class="fas fa-file-upload fa-3x" style="color: #6c757d; margin-bottom: 15px;"></i>
                        <p data-i18n="no_court_acknowledgment">${t('no_court_acknowledgment') || 'No court acknowledgment uploaded'}</p>
                    </div>
                ` : `
                    <div class="upload-section" style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
                        <i class="fas fa-file-upload fa-3x" style="color: #6c757d; margin-bottom: 15px; text-align: center; display: block;"></i>
                        <form id="courtAcknowledgmentForm" enctype="multipart/form-data">
                            <div class="form-group">
                                <label data-i18n="court_letter_permit">${t('court_letter_permit') || 'Court Letter/Permit Image'} *</label>
                                <input type="file" class="form-control" id="court_acknowledgment_file" accept="image/*,application/pdf" required>
                                <small class="form-text text-muted" data-i18n="max_10mb">Max 10MB, JPG/PNG/PDF</small>
                            </div>
                            <div class="form-group">
                                <label data-i18n="notes">${t('notes') || 'Notes (Optional)'}</label>
                                <textarea class="form-control" id="court_acknowledgment_notes" rows="3" placeholder="Add any notes about this document..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-upload"></i> <span data-i18n="upload">${t('upload')}</span>
                            </button>
                        </form>
                    </div>
                `}
            </div>
        `;
        
        $('#tab-court-acknowledgment').html(html);
        
        $('#courtAcknowledgmentForm').on('submit', async function(e) {
            e.preventDefault();
            await uploadCourtAcknowledgment(caseId);
        });
        
    } catch (error) {
        console.error('Error loading court acknowledgment:', error);
        $('#tab-court-acknowledgment').html('<div class="alert alert-error" style="margin: 20px;">Failed to load</div>');
    }
}

async function uploadCourtAcknowledgment(caseId) {
    const fileInput = document.getElementById('court_acknowledgment_file');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('error', 'Please select a file');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'File size must be less than 10MB');
        return;
    }
    
    const formData = new FormData();
    formData.append('court_acknowledgment', file);
    formData.append('notes', $('#court_acknowledgment_notes').val());
    
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

async function deleteCourtAcknowledgment(caseId) {
    if (!confirm('Are you sure you want to delete this court acknowledgment?')) {
        return;
    }
    
    try {
        const response = await api.delete(`/investigation/cases/${caseId}/court-acknowledgment`);
        if (response.status === 'success') {
            showToast('success', 'Deleted successfully');
            loadCourtAcknowledgment(caseId);
        }
    } catch (error) {
        showToast('error', 'Failed to delete');
        console.error(error);
    }
}

function editCourtAcknowledgment(caseId) {
    // Load the tab in edit mode - show form with existing data
    api.get(`/investigation/cases/${caseId}/court-acknowledgment`).then(response => {
        const data = response.data;
        
        const formHtml = `
            <div class="acknowledgment-edit" style="background: #fff3cd; padding: 20px; border: 2px solid #ffc107; border-radius: 8px;">
                <h4 style="margin-bottom: 15px;"><i class="fas fa-edit"></i> Update Court Acknowledgment</h4>
                
                <div style="margin-bottom: 20px;">
                    <p><strong>Current Document:</strong></p>
                    <img src="/${data.file_path}" alt="Current" style="max-width: 300px; border: 2px solid #ddd; border-radius: 4px;">
                </div>
                
                <form id="courtAcknowledgmentEditForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Replace Document (Optional)</label>
                        <input type="file" class="form-control" id="court_acknowledgment_file_edit" accept="image/*,application/pdf">
                        <small class="form-text text-muted">Leave empty to keep current document</small>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea class="form-control" id="court_acknowledgment_notes_edit" rows="3">${data.notes || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-warning">
                        <i class="fas fa-save"></i> Update
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="loadCourtAcknowledgment(${caseId})">
                        Cancel
                    </button>
                </form>
            </div>
        `;
        
        $('#tab-court-acknowledgment').html(formHtml);
        
        $('#courtAcknowledgmentEditForm').on('submit', async function(e) {
            e.preventDefault();
            await updateCourtAcknowledgment(caseId);
        });
    }).catch(error => {
        console.error('Error loading court acknowledgment:', error);
        showToast('error', 'Failed to load');
    });
}

async function updateCourtAcknowledgment(caseId) {
    const formData = new FormData();
    
    const fileInput = document.getElementById('court_acknowledgment_file_edit');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        if (file.size > 10 * 1024 * 1024) {
            showToast('error', 'File size must be less than 10MB');
            return;
        }
        
        formData.append('court_acknowledgment', file);
    }
    
    formData.append('notes', $('#court_acknowledgment_notes_edit').val());
    formData.append('update_only', '1');
    
    try {
        const response = await api.upload(`/investigation/cases/${caseId}/court-acknowledgment`, formData);
        if (response.status === 'success') {
            showToast('success', 'Court acknowledgment updated successfully');
            loadCourtAcknowledgment(caseId);
        }
    } catch (error) {
        showToast('error', 'Failed to update');
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
        
        // Get accused persons from case data
        const accused = window.currentCaseData.accused || [];
        
        // Create a map of custody docs by person_id
        const docsByPerson = {};
        docs.forEach(doc => {
            if (!docsByPerson[doc.accused_person_id]) {
                docsByPerson[doc.accused_person_id] = [];
            }
            docsByPerson[doc.accused_person_id].push(doc);
        });
        
        let html = `
            <div class="custody-docs-section" style="padding: 20px;">
                <div class="section-header" style="margin-bottom: 20px;">
                    <h3><i class="fas fa-user-lock"></i> <span data-i18n="custody_documentation">${t('custody_documentation')}</span></h3>
                    <p style="color: #6c757d;">Add custody information and court documents for each accused person</p>
                </div>
                
                ${accused.length === 0 ? `
                    <div style="text-align: center; padding: 60px; color: #6c757d;">
                        <i class="fas fa-user-slash fa-3x" style="opacity: 0.3; margin-bottom: 15px;"></i>
                        <p>No accused persons in this case yet</p>
                    </div>
                ` : accused.map(person => {
                    const personDocs = docsByPerson[person.person_id] || [];
                    const latestDoc = personDocs.length > 0 ? personDocs[0] : null;
                    
                    return `
                        <div class="accused-custody-card" style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    ${person.photo_path ? `
                                        <img src="/${person.photo_path}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #007bff;">
                                    ` : `
                                        <div style="width: 60px; height: 60px; border-radius: 50%; background: #ccc; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-user fa-2x" style="color: #fff;"></i>
                                        </div>
                                    `}
                                    <div>
                                        <h4 style="margin: 0;">${person.first_name} ${person.last_name}</h4>
                                        <small style="color: #6c757d;">${person.national_id ? 'ID: ' + person.national_id : ''}</small>
                                    </div>
                                </div>
                                ${personDocs.length === 0 ? (window.currentCaseData?.readOnly ? `
                                    <p style="color: #6c757d; font-style: italic;">No custody information</p>
                                ` : `
                                    <button class="btn btn-primary btn-sm" onclick="showAddCustodyForPerson(${caseId}, ${person.person_id})">
                                        <i class="fas fa-plus"></i> Add Custody Info
                                    </button>
                                `) : `
                                    <div style="display: flex; gap: 10px;">
                                        <span class="badge badge-success" style="font-size: 14px; padding: 8px 12px;">
                                            <i class="fas fa-check-circle"></i> Custody Info Added
                                        </span>
                                        ${!window.currentCaseData?.readOnly ? `
                                        <button class="btn btn-warning btn-sm" onclick="editCustodyForPerson(${caseId}, ${person.person_id}, ${personDocs[0].id})">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        ` : ''}
                                    </div>
                                `}
                            </div>
                            
                            ${personDocs.length === 0 ? `
                                <div style="text-align: center; padding: 20px; color: #6c757d; background: #fff; border-radius: 4px;">
                                    <i class="fas fa-info-circle"></i> No custody records yet
                                </div>
                            ` : `
                                <div style="background: #fff; border-radius: 4px; padding: 15px;">
                                    ${personDocs.map(doc => {
                                        // Calculate remaining time
                                        const now = new Date();
                                        const endDate = doc.custody_end ? new Date(doc.custody_end) : null;
                                        let remainingText = '';
                                        let remainingClass = '';
                                        let diffDays = 0;
                                        
                                        if (endDate && doc.custody_status === 'in_custody') {
                                            const diffTime = endDate - now;
                                            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            
                                            if (diffDays > 0) {
                                                // Calculate years, months, and remaining days
                                                const diffYears = Math.floor(diffDays / 365);
                                                const remainingAfterYears = diffDays % 365;
                                                const diffMonths = Math.floor(remainingAfterYears / 30);
                                                const remainingDaysOnly = remainingAfterYears % 30;
                                                
                                                let parts = [];
                                                if (diffYears > 0) parts.push(`${diffYears} year${diffYears > 1 ? 's' : ''}`);
                                                if (diffMonths > 0) parts.push(`${diffMonths} month${diffMonths > 1 ? 's' : ''}`);
                                                if (remainingDaysOnly > 0 || parts.length === 0) parts.push(`${remainingDaysOnly} day${remainingDaysOnly !== 1 ? 's' : ''}`);
                                                
                                                remainingText = parts.join(', ') + ' remaining';
                                                remainingClass = diffDays < 30 ? 'text-danger' : (diffDays < 365 ? 'text-warning' : 'text-success');
                                            } else {
                                                remainingText = 'Sentence period completed';
                                                remainingClass = 'text-danger font-weight-bold';
                                            }
                                        }
                                        
                                        return `
                                        <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin-bottom: 10px;">
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                                <div>
                                                    <p style="margin: 5px 0; font-size: 13px; color: #6c757d;">Sentence Start</p>
                                                    <p style="margin: 0; font-weight: bold; font-size: 15px;">${formatDateTime(doc.custody_start)}</p>
                                                </div>
                                                <div>
                                                    <p style="margin: 5px 0; font-size: 13px; color: #6c757d;">Sentence Duration</p>
                                                    <p style="margin: 0; font-weight: bold; font-size: 15px;">${doc.custody_duration || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p style="margin: 5px 0; font-size: 13px; color: #6c757d;">Release Date</p>
                                                    <p style="margin: 0; font-weight: bold; font-size: 15px; color: #28a745;">${doc.custody_end ? formatDateTime(doc.custody_end) : 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p style="margin: 5px 0; font-size: 13px; color: #6c757d;">Location</p>
                                                    <p style="margin: 0; font-weight: bold; font-size: 15px;">${doc.custody_location}</p>
                                                </div>
                                            </div>
                                            
                                            ${remainingText ? `
                                                <div style="background: ${diffDays < 30 ? '#fff5f5' : (diffDays < 365 ? '#fffbf0' : '#f0fff4')}; padding: 15px; border-radius: 4px; border-left: 4px solid ${diffDays < 30 ? '#dc3545' : (diffDays < 365 ? '#ffc107' : '#28a745')}; margin-bottom: 15px;">
                                                    <p style="margin: 0 0 10px 0; font-size: 16px;" class="${remainingClass}">
                                                        <i class="fas fa-clock"></i> <strong>${remainingText}</strong>
                                                    </p>
                                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1);">
                                                        <div>
                                                            <small style="color: #6c757d; display: block;">Total Months:</small>
                                                            <strong style="font-size: 14px;">${Math.floor(diffDays / 30)} months</strong>
                                                        </div>
                                                        <div>
                                                            <small style="color: #6c757d; display: block;">Total Days:</small>
                                                            <strong style="font-size: 14px;">${diffDays} days</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                                                <span class="badge ${doc.custody_status === 'released' ? 'badge-success' : 'badge-warning'}" style="font-size: 13px;">
                                                    ${doc.custody_status}
                                                </span>
                                                ${doc.court_order_image ? `
                                                    <a href="/${doc.court_order_image}" target="_blank" class="btn btn-sm btn-info">
                                                        <i class="fas fa-file-pdf"></i> Court Order
                                                    </a>
                                                ` : ''}
                                            </div>
                                            
                                            ${doc.notes ? `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; color: #6c757d; margin-bottom: 0;"><em>${doc.notes}</em></p>` : ''}
                                        </div>
                                    `;
                                    }).join('')}
                                </div>
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        $('#tab-custody-docs').html(html);
        
    } catch (error) {
        console.error('Error loading custody documentation:', error);
        $('#tab-custody-docs').html('<div class="alert alert-error" style="margin: 20px;">Failed to load</div>');
    }
}

function showAddCustodyForPerson(caseId, personId) {
    // Get person name from case data
    const accused = window.currentCaseData.accused || [];
    const person = accused.find(p => p.person_id == personId);
    const personName = person ? `${person.first_name} ${person.last_name}` : 'Unknown';
    
    // Instead of modal, show form inline in the tab
    const formHtml = `
        <div id="custodyFormContainer" style="background: #fff; padding: 20px; border: 2px solid #007bff; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin: 0;"><i class="fas fa-plus-circle"></i> Add Custody Information - ${personName}</h4>
                <button class="btn btn-secondary btn-sm" onclick="cancelCustodyForm(${caseId})">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
            
            <form id="custodyDocForm">
                <input type="hidden" id="accused_person_id" value="${personId}">
                
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Sentence Start Date *</label>
                        <input type="datetime-local" class="form-control" id="custody_start" required>
                        <small class="form-text text-muted">When the sentence begins</small>
                    </div>
                    <div class="form-group col-md-6">
                        <label>Sentence Duration *</label>
                        <div class="input-group">
                            <input type="number" class="form-control" id="custody_duration_value" placeholder="e.g., 5" required min="1">
                            <select class="form-control" id="custody_duration_unit" required style="max-width: 120px;">
                                <option value="days">Days</option>
                                <option value="months">Months</option>
                                <option value="years" selected>Years</option>
                            </select>
                        </div>
                        <small class="form-text text-muted">Total sentence from court order</small>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Custody Location *</label>
                        <input type="text" class="form-control" id="custody_location" placeholder="e.g., Central Prison" required>
                    </div>
                    <div class="form-group col-md-6">
                        <label>Release Date (Expected)</label>
                        <input type="text" class="form-control" id="custody_end_calculated" readonly style="background: #e9ecef; font-weight: bold;">
                        <small class="form-text text-muted">Auto-calculated from sentence</small>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Court Order/Document *</label>
                    <input type="file" class="form-control" id="court_order_image" accept="image/*,application/pdf" required>
                    <small class="form-text text-muted">Upload the court order or custody authorization document</small>
                </div>
                
                <div class="form-group">
                    <label>Accused Photo (Optional)</label>
                    <input type="file" class="form-control" id="accused_photo" accept="image/*">
                    <small class="form-text text-muted">Update photo if needed</small>
                </div>
                
                <div class="form-group">
                    <label>Notes</label>
                    <textarea class="form-control" id="custody_notes" rows="3" placeholder="Add any additional information..."></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Save Custody Information
                </button>
                <button type="button" class="btn btn-secondary" onclick="cancelCustodyForm(${caseId})">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </form>
        </div>
    `;
    
    // Insert form at the top of custody docs section
    $('#tab-custody-docs .custody-docs-section').prepend(formHtml);
    
    // Set current date/time as default
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#custody_start').val(now.toISOString().slice(0, 16));
    
    // Calculate expected release date when inputs change
    function calculateReleaseDate() {
        const startDate = $('#custody_start').val();
        const duration = parseInt($('#custody_duration_value').val());
        const unit = $('#custody_duration_unit').val();
        
        if (startDate && duration) {
            const start = new Date(startDate);
            let end = new Date(start);
            
            if (unit === 'days') {
                end.setDate(end.getDate() + duration);
            } else if (unit === 'months') {
                end.setMonth(end.getMonth() + duration);
            } else if (unit === 'years') {
                end.setFullYear(end.getFullYear() + duration);
            }
            
            $('#custody_end_calculated').val(formatDateTime(end));
        }
    }
    
    $('#custody_start, #custody_duration_value, #custody_duration_unit').on('change', calculateReleaseDate);
    
    // Scroll to form
    $('#custodyFormContainer')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Handle form submission
    $('#custodyDocForm').on('submit', async function(e) {
        e.preventDefault();
        await saveCustodyDocumentation(caseId);
    });
}

function cancelCustodyForm(caseId) {
    $('#custodyFormContainer').remove();
}

async function editCustodyForPerson(caseId, personId, custodyId) {
    // Get the custody doc data
    try {
        const response = await api.get(`/investigation/cases/${caseId}/custody-documentation`);
        const doc = response.data.find(d => d.id == custodyId);
            if (!doc) {
                showToast('error', 'Custody record not found');
                return;
            }
            
            // Get person name
            const accused = window.currentCaseData.accused || [];
            const person = accused.find(p => p.person_id == personId);
            const personName = person ? `${person.first_name} ${person.last_name}` : 'Unknown';
            
            // Show edit form with pre-filled data
            const formHtml = `
                <div id="custodyFormContainer" style="background: #fff3cd; padding: 20px; border: 2px solid #ffc107; border-radius: 8px; margin: 20px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h4 style="margin: 0;"><i class="fas fa-edit"></i> Edit Custody Information - ${personName}</h4>
                        <button class="btn btn-secondary btn-sm" onclick="cancelCustodyForm(${caseId})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                    
                    <form id="custodyDocForm">
                        <input type="hidden" id="custody_id" value="${custodyId}">
                        <input type="hidden" id="accused_person_id" value="${personId}">
                        
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label>Sentence Start Date *</label>
                                <input type="datetime-local" class="form-control" id="custody_start" value="${doc.custody_start ? new Date(doc.custody_start).toISOString().slice(0,16) : ''}" required>
                                <small class="form-text text-muted">When the sentence begins</small>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Sentence Duration *</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="custody_duration_value" placeholder="e.g., 5" value="${doc.custody_duration ? doc.custody_duration.split(' ')[0] : ''}" required min="1">
                                    <select class="form-control" id="custody_duration_unit" required style="max-width: 120px;">
                                        <option value="days" ${doc.custody_duration && doc.custody_duration.includes('days') ? 'selected' : ''}>Days</option>
                                        <option value="months" ${doc.custody_duration && doc.custody_duration.includes('months') ? 'selected' : ''}>Months</option>
                                        <option value="years" ${doc.custody_duration && doc.custody_duration.includes('years') ? 'selected' : ''}>Years</option>
                                    </select>
                                </div>
                                <small class="form-text text-muted">Total sentence from court order</small>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label>Custody Location *</label>
                                <input type="text" class="form-control" id="custody_location" value="${doc.custody_location || ''}" required>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Release Date (Expected)</label>
                                <input type="text" class="form-control" id="custody_end_calculated" readonly style="background: #e9ecef; font-weight: bold;">
                                <small class="form-text text-muted">Auto-calculated from sentence</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Court Order/Document</label>
                            <input type="file" class="form-control" id="court_order_image" accept="image/*,application/pdf">
                            <small class="form-text text-muted">Leave empty to keep existing document</small>
                            ${doc.court_order_image ? `<p class="text-success mt-2"><i class="fas fa-check"></i> Current: <a href="/${doc.court_order_image}" target="_blank">View Document</a></p>` : ''}
                        </div>
                        
                        <div class="form-group">
                            <label>Accused Photo (Optional)</label>
                            <input type="file" class="form-control" id="accused_photo" accept="image/*">
                            <small class="form-text text-muted">Leave empty to keep existing photo</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea class="form-control" id="custody_notes" rows="3">${doc.notes || ''}</textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-warning">
                            <i class="fas fa-save"></i> Update Custody Information
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="cancelCustodyForm(${caseId})">
                            Cancel
                        </button>
                    </form>
                </div>
            `;
            
            $('#tab-custody-docs .custody-docs-section').prepend(formHtml);
            
            // Calculate and show current release date
            const calculateReleaseDate = () => {
                const startDate = $('#custody_start').val();
                const duration = parseInt($('#custody_duration_value').val());
                const unit = $('#custody_duration_unit').val();
                
                if (startDate && duration) {
                    const start = new Date(startDate);
                    let end = new Date(start);
                    
                    if (unit === 'days') {
                        end.setDate(end.getDate() + duration);
                    } else if (unit === 'months') {
                        end.setMonth(end.getMonth() + duration);
                    } else if (unit === 'years') {
                        end.setFullYear(end.getFullYear() + duration);
                    }
                    
                    $('#custody_end_calculated').val(formatDateTime(end));
                }
            };
            
            calculateReleaseDate();
            $('#custody_start, #custody_duration_value, #custody_duration_unit').on('change', calculateReleaseDate);
            
            $('#custodyFormContainer')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            $('#custodyDocForm').on('submit', async function(e) {
                e.preventDefault();
                await updateCustodyDocumentation(caseId, custodyId);
            });
    } catch (error) {
        console.error('Error loading custody data:', error);
        showToast('error', 'Failed to load custody data');
    }
}

async function updateCustodyDocumentation(caseId, custodyId) {
    const formData = new FormData();
    formData.append('custody_id', custodyId);
    formData.append('accused_person_id', $('#accused_person_id').val());
    formData.append('custody_start', $('#custody_start').val());
    formData.append('custody_location', $('#custody_location').val());
    formData.append('custody_duration_value', $('#custody_duration_value').val());
    formData.append('custody_duration_unit', $('#custody_duration_unit').val());
    formData.append('notes', $('#custody_notes').val());
    
    const accusedPhoto = document.getElementById('accused_photo').files[0];
    if (accusedPhoto) formData.append('accused_photo', accusedPhoto);
    
    const courtOrder = document.getElementById('court_order_image').files[0];
    if (courtOrder) formData.append('court_order_image', courtOrder);
    
    try {
        const response = await api.upload(`/investigation/cases/${caseId}/custody-documentation/${custodyId}`, formData);
        if (response.status === 'success') {
            showToast('success', 'Custody documentation updated');
            $('#custodyFormContainer').remove();
            loadCustodyDocumentation(caseId);
        }
    } catch (error) {
        showToast('error', 'Failed to update');
        console.error(error);
    }
}

async function saveCustodyDocumentation(caseId) {
    const formData = new FormData();
    formData.append('accused_person_id', $('#accused_person_id').val());
    formData.append('custody_start', $('#custody_start').val());
    formData.append('custody_location', $('#custody_location').val());
    formData.append('custody_duration_value', $('#custody_duration_value').val());
    formData.append('custody_duration_unit', $('#custody_duration_unit').val());
    formData.append('notes', $('#custody_notes').val());
    
    const accusedPhoto = document.getElementById('accused_photo').files[0];
    if (accusedPhoto) formData.append('accused_photo', accusedPhoto);
    
    const courtOrder = document.getElementById('court_order_image').files[0];
    if (courtOrder) formData.append('court_order_image', courtOrder);
    
    try {
        const response = await api.upload(`/investigation/cases/${caseId}/custody-documentation`, formData);
        if (response.status === 'success') {
            showToast('success', 'Custody documentation saved');
            $('#custodyFormContainer').remove();
            loadCustodyDocumentation(caseId);
        }
    } catch (error) {
        showToast('error', 'Failed to save');
        console.error(error);
    }
}

// Export functions to window
window.showFullCaseDetailsModal = showFullCaseDetailsModal;
window.showAddCustodyForPerson = showAddCustodyForPerson;
window.editCustodyForPerson = editCustodyForPerson;
window.cancelCustodyForm = cancelCustodyForm;
window.saveCustodyDocumentation = saveCustodyDocumentation;
window.updateCustodyDocumentation = updateCustodyDocumentation;
window.editCourtAcknowledgment = editCourtAcknowledgment;
window.updateCourtAcknowledgment = updateCourtAcknowledgment;
window.deleteCourtAcknowledgment = deleteCourtAcknowledgment;
