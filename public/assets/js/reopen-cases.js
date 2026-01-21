/**
 * Reopen Cases Management Page
 * Admin and Super Admin only - Dedicated page for reopening closed cases
 */

let casesTable;
let currentFilters = {
    closure_type: '',
    start_date: '',
    end_date: ''
};

// Use the globally available investigationAPI and stationAPI from api.js
console.log('Reopen Cases page loaded');

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize translations
        if (typeof initializeTranslations === 'function') {
            await initializeTranslations();
        }
        
        // Load statistics
        await loadStatistics();
        
        // Initialize DataTable
        initializeDataTable();
        
        // Load cases
        await loadCases();
        
        // Setup filter listeners
        setupFilterListeners();
        
    } catch (error) {
        console.error('Initialization error:', error);
        await showError('Failed to initialize page', error.message);
    }
});

/**
 * Load statistics
 */
async function loadStatistics() {
    try {
        const response = await investigationAPI.getSolvedCasesStats();
        
        if (response && response.data) {
            const stats = response.data;
            
            const totalClosed = (stats.investigator_closed || 0) + 
                              (stats.closed_with_court_ack || 0) + 
                              (stats.court_solved || 0);
            
            document.getElementById('total-closed').textContent = totalClosed;
            document.getElementById('reopened-cases').textContent = stats.reopened_cases || 0;
            document.getElementById('investigator-closed').textContent = stats.investigator_closed || 0;
            document.getElementById('court-closed').textContent = stats.court_solved || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

/**
 * Initialize DataTable
 */
function initializeDataTable() {
    casesTable = $('#reopen-cases-table').DataTable({
        order: [[5, 'desc']], // Sort by closed date
        pageLength: 25,
        language: {
            search: t('search') || 'Search',
            lengthMenu: (t('show') || 'Show') + ' _MENU_ ' + (t('entries') || 'entries'),
            info: (t('showing') || 'Showing') + ' _START_ ' + (t('to') || 'to') + ' _END_ ' + (t('of') || 'of') + ' _TOTAL_ ' + (t('entries') || 'entries'),
            paginate: {
                first: t('first') || 'First',
                last: t('last') || 'Last',
                next: t('next') || 'Next',
                previous: t('previous') || 'Previous'
            }
        },
        columns: [
            { data: 'case_number' },
            { 
                data: 'incident_date',
                render: function(data) {
                    if (!data) return '-';
                    return new Date(data).toLocaleDateString();
                }
            },
            { 
                data: 'incident_location',
                render: function(data) {
                    return data || '-';
                }
            },
            { 
                data: 'crime_category',
                render: function(data) {
                    return data || '-';
                }
            },
            { 
                data: 'closure_type',
                render: function(data) {
                    return getClosureTypeBadge(data);
                }
            },
            { 
                data: 'closed_date',
                render: function(data) {
                    if (!data) return '-';
                    const date = new Date(data);
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                }
            },
            { 
                data: 'closed_by_name',
                render: function(data) {
                    return data || '-';
                }
            },
            { 
                data: 'center_name',
                render: function(data) {
                    return data || '-';
                }
            },
            {
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    let buttons = `
                        <button class="btn btn-sm btn-info me-1" onclick="viewCaseDetails(${row.id})" title="${t('view_details') || 'View Details'}">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
                    
                    // Only show reopen button for non-court-closed cases
                    if (row.closure_type !== 'court_solved') {
                        buttons += `
                        <button class="btn btn-sm btn-reopen" onclick="showReopenModal(${row.id})" title="${t('reopen_case') || 'Reopen Case'}">
                            <i class="fas fa-folder-open"></i> ${t('reopen') || 'Reopen'}
                        </button>
                        `;
                    } else {
                        buttons += `
                        <span class="badge bg-secondary" title="${t('court_closed_no_reopen') || 'Court-closed cases cannot be reopened'}">
                            <i class="fas fa-lock"></i> ${t('locked') || 'Locked'}
                        </span>
                        `;
                    }
                    
                    return buttons;
                }
            }
        ]
    });
}

/**
 * Load cases with current filters
 */
async function loadCases() {
    try {
        // Build filter params
        const params = {};
        if (currentFilters.closure_type) params.closure_type = currentFilters.closure_type;
        if (currentFilters.start_date) params.start_date = currentFilters.start_date;
        if (currentFilters.end_date) params.end_date = currentFilters.end_date;
        
        const response = await investigationAPI.getAllSolvedCases(params);
        
        if (response && response.data) {
            // Clear and reload table
            casesTable.clear();
            casesTable.rows.add(response.data);
            casesTable.draw();
        }
    } catch (error) {
        console.error('Error loading cases:', error);
        await showError(t('error') || 'Error', t('failed_load_cases') || 'Failed to load cases');
    }
}

/**
 * Setup filter listeners
 */
function setupFilterListeners() {
    document.getElementById('apply-filters').addEventListener('click', function() {
        currentFilters.closure_type = document.getElementById('filter-closure-type').value;
        currentFilters.start_date = document.getElementById('filter-start-date').value;
        currentFilters.end_date = document.getElementById('filter-end-date').value;
        
        loadCases();
    });
}

/**
 * Get closure type badge
 */
function getClosureTypeBadge(closureType) {
    if (!closureType) {
        return `<span class="badge bg-secondary badge-closure-type">${t('legacy') || 'Legacy'}</span>`;
    }
    
    const badges = {
        'investigator_closed': `<span class="badge bg-success badge-closure-type">${t('investigator_closed') || 'Investigator Closed'}</span>`,
        'closed_with_court_ack': `<span class="badge bg-info badge-closure-type">${t('closed_with_court_ack') || 'With Court Ack'}</span>`,
        'court_solved': `<span class="badge bg-warning badge-closure-type">${t('court_solved') || 'Court Solved'}</span>`
    };
    
    return badges[closureType] || `<span class="badge bg-secondary badge-closure-type">${closureType}</span>`;
}

/**
 * View case details
 */
async function viewCaseDetails(caseId) {
    try {
        Swal.fire({
            title: t('loading') || 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const result = await investigationAPI.getCase(caseId);
        const caseData = result.data;
        
        let html = `
            <div class="text-start">
                <div class="info-section">
                    <h6><i class="fas fa-info-circle"></i> ${t('case_information') || 'Case Information'}</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>${t('case_number') || 'Case Number'}:</strong> ${caseData.case_number}</p>
                            <p><strong>${t('incident_date') || 'Incident Date'}:</strong> ${formatDate(caseData.incident_date)}</p>
                            <p><strong>${t('location') || 'Location'}:</strong> ${caseData.incident_location}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>${t('crime_category') || 'Category'}:</strong> ${caseData.crime_category}</p>
                            <p><strong>${t('priority') || 'Priority'}:</strong> <span class="badge bg-${getPriorityColor(caseData.priority)}">${caseData.priority}</span></p>
                            <p><strong>${t('status') || 'Status'}:</strong> <span class="badge bg-secondary">${caseData.status}</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h6><i class="fas fa-door-closed"></i> ${t('closure_information') || 'Closure Information'}</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>${t('closed_date') || 'Closed Date'}:</strong> ${formatDateTime(caseData.closed_date)}</p>
                            <p><strong>${t('closed_by') || 'Closed By'}:</strong> ${caseData.closed_by_name || '-'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>${t('closure_type') || 'Closure Type'}:</strong> ${getClosureTypeBadge(caseData.closure_type)}</p>
                            ${caseData.closure_reason ? `<p><strong>${t('closure_reason') || 'Reason'}:</strong> ${caseData.closure_reason}</p>` : ''}
                        </div>
                    </div>
                </div>
                
                ${caseData.description ? `
                <div class="info-section">
                    <h6><i class="fas fa-file-alt"></i> ${t('description') || 'Description'}</h6>
                    <p>${caseData.description}</p>
                </div>
                ` : ''}
            </div>
        `;
        
        Swal.fire({
            title: t('case_details') || 'Case Details',
            html: html,
            width: '800px',
            confirmButtonText: t('close') || 'Close',
            showCancelButton: caseData.closure_type !== 'court_solved',
            cancelButtonText: `<i class="fas fa-folder-open"></i> ${t('reopen_case') || 'Reopen Case'}`,
            cancelButtonColor: '#f5576c'
        }).then((result) => {
            if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                showReopenModal(caseId);
            }
        });
        
    } catch (error) {
        console.error('Error loading case details:', error);
        await showError(t('error') || 'Error', t('failed_load_case') || 'Failed to load case details');
    }
}

/**
 * Show reopen case modal
 */
async function showReopenModal(caseId) {
    try {
        // First check if case can be reopened
        const checkResult = await investigationAPI.canReopenCase(caseId);
        
        if (!checkResult.data.can_reopen) {
            return Swal.fire({
                icon: 'error',
                title: t('cannot_reopen') || 'Cannot Reopen Case',
                text: checkResult.data.reason,
                confirmButtonText: t('ok') || 'OK'
            });
        }
        
        // Get case details
        const caseResult = await investigationAPI.getCase(caseId);
        const caseData = caseResult.data;
        
        // Get available investigators for assignment
        let investigatorOptions = '<option value="">' + (t('no_assignment') || 'Do not assign') + '</option>';
        try {
            const investigators = await stationAPI.getInvestigators();
            if (investigators.data && investigators.data.length > 0) {
                investigators.data.forEach(inv => {
                    investigatorOptions += `<option value="${inv.id}">${inv.full_name} - ${inv.badge_number || ''}</option>`;
                });
            }
        } catch (e) {
            console.error('Error loading investigators:', e);
        }
        
        const { value: formValues } = await Swal.fire({
            title: t('reopen_case') || 'Reopen Case',
            html: `
                <div class="text-start">
                    <div class="mb-3">
                        <p><strong>${t('case_number') || 'Case Number'}:</strong> ${caseData.case_number}</p>
                        <p><strong>${t('closed_date') || 'Closed Date'}:</strong> ${formatDateTime(caseData.closed_date)}</p>
                        <p><strong>${t('closed_by') || 'Closed By'}:</strong> ${caseData.closed_by_name || '-'}</p>
                        ${caseData.closure_reason ? `<p><strong>${t('closure_reason') || 'Closure Reason'}:</strong> ${caseData.closure_reason}</p>` : ''}
                    </div>
                    
                    <hr>
                    
                    <div class="mb-3">
                        <label for="reopen_reason" class="form-label">${t('reopen_reason') || 'Reason for Reopening'} <span class="text-danger">*</span></label>
                        <textarea id="reopen_reason" class="form-control" rows="4" placeholder="${t('enter_reopen_reason') || 'Enter detailed reason for reopening this case...'}" required></textarea>
                        <small class="text-muted">${t('minimum_20_characters') || 'Minimum 20 characters required'}</small>
                    </div>
                    
                    <div class="mb-3">
                        <label for="assign_investigator" class="form-label">${t('assign_to_investigator') || 'Assign to Investigator'}</label>
                        <select id="assign_investigator" class="form-select">
                            ${investigatorOptions}
                        </select>
                        <small class="text-muted">${t('optional_assignment') || 'Optional: Assign case to an investigator immediately'}</small>
                    </div>
                    
                    <div class="mb-3">
                        <label for="assignment_notes" class="form-label">${t('assignment_notes') || 'Assignment Notes'}</label>
                        <textarea id="assignment_notes" class="form-control" rows="2" placeholder="${t('optional_notes') || 'Optional notes for the investigator...'}"></textarea>
                    </div>
                    
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${t('reopen_warning') || 'Reopening this case will restore it to active status. All previous data will be preserved.'}
                    </div>
                </div>
            `,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: t('reopen_case') || 'Reopen Case',
            cancelButtonText: t('cancel') || 'Cancel',
            confirmButtonColor: '#f5576c',
            preConfirm: () => {
                const reopenReason = document.getElementById('reopen_reason').value.trim();
                const assignTo = document.getElementById('assign_investigator').value;
                const notes = document.getElementById('assignment_notes').value.trim();
                
                if (!reopenReason || reopenReason.length < 20) {
                    Swal.showValidationMessage(t('reopen_reason_required') || 'Please provide a detailed reason (minimum 20 characters)');
                    return false;
                }
                
                return {
                    reopen_reason: reopenReason,
                    assign_to_investigator: assignTo || null,
                    assignment_notes: notes || null
                };
            }
        });
        
        if (formValues) {
            // Show loading
            Swal.fire({
                title: t('reopening_case') || 'Reopening Case...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Reopen the case
            const result = await investigationAPI.reopenCase(caseId, formValues);
            
            if (result.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: t('success') || 'Success',
                    text: t('case_reopened_successfully') || 'Case has been reopened successfully',
                    confirmButtonText: t('ok') || 'OK'
                });
                
                // Reload the cases table and statistics
                await loadStatistics();
                await loadCases();
            }
        }
        
    } catch (error) {
        console.error('Error reopening case:', error);
        Swal.fire({
            icon: 'error',
            title: t('error') || 'Error',
            text: error.response?.message || error.message || (t('failed_reopen_case') || 'Failed to reopen case'),
            confirmButtonText: t('ok') || 'OK'
        });
    }
}

/**
 * Helper Functions
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getPriorityColor(priority) {
    const colors = {
        'low': 'info',
        'medium': 'warning',
        'high': 'danger',
        'critical': 'danger'
    };
    return colors[priority] || 'secondary';
}

async function showError(title, message) {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: t('ok') || 'OK'
    });
}

// Translation helper function
function t(key) {
    if (typeof translate === 'function') {
        return translate(key);
    }
    return key;
}
