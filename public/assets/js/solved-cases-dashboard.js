/**
 * Solved Cases Dashboard JavaScript
 * Displays all closed cases with statistics and detailed view
 */

let casesTable;
let currentFilters = {
    closure_type: '',
    start_date: '',
    end_date: ''
};

// Use the globally available investigationAPI from api.js
// This is already loaded via the script tag in the HTML
console.log('Using global investigationAPI from api.js');

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Wait a bit for everything to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Load statistics
        await loadStatistics();
        
        // Initialize DataTable
        initializeDataTable();
        
        // Load cases
        await loadCases();
        
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
        // Use the investigationAPI (from parent or local)
        const response = await investigationAPI.getSolvedCasesStats();
        
        if (response && response.data) {
            const stats = response.data;
            
            // Update statistics cards
            document.getElementById('total-closed').textContent = stats.total_closed || 0;
            document.getElementById('investigator-closed').textContent = stats.investigator_closed || 0;
            document.getElementById('court-ack-closed').textContent = stats.closed_with_court_ack || 0;
            document.getElementById('court-solved').textContent = stats.court_solved || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

/**
 * Initialize DataTable
 */
function initializeDataTable() {
    casesTable = $('#solved-cases-table').DataTable({
        order: [[3, 'desc']], // Order by closed date descending
        pageLength: 25,
        responsive: true,
        language: {
            search: t('search') || 'Search:',
            lengthMenu: `${t('show') || 'Show'} _MENU_ ${t('entries') || 'entries'}`,
            info: `${t('showing') || 'Showing'} _START_ ${t('to') || 'to'} _END_ ${t('of') || 'of'} _TOTAL_ ${t('entries') || 'entries'}`,
            paginate: {
                first: t('first') || 'First',
                last: t('last') || 'Last',
                next: t('next') || 'Next',
                previous: t('previous') || 'Previous'
            },
            emptyTable: t('no_data_available') || 'No data available'
        },
        columns: [
            { data: 'case_number' },
            { data: 'crime_type' },
            { 
                data: 'closure_type',
                render: function(data, type, row) {
                    return getClosureTypeBadge(data);
                }
            },
            { 
                data: 'closed_date',
                render: function(data, type, row) {
                    if (!data) return '-';
                    const date = new Date(data);
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                }
            },
            { 
                data: 'closed_by_name',
                render: function(data, type, row) {
                    return data || '-';
                }
            },
            { 
                data: 'center_name',
                render: function(data, type, row) {
                    return data || '-';
                }
            },
            {
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <button class="btn btn-sm btn-primary" onclick="viewCaseDetails(${row.id})">
                            <i class="fas fa-eye"></i> ${t('view') || 'View'}
                        </button>
                    `;
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
        
        // Use the investigationAPI (from parent or local)
        const response = await investigationAPI.getAllSolvedCases(params);
        
        if (response && response.data) {
            // Clear and reload table
            casesTable.clear();
            casesTable.rows.add(response.data);
            casesTable.draw();
        }
    } catch (error) {
        console.error('Error loading cases:', error);
        await showError('Failed to load cases', error.message);
    }
}

/**
 * Apply filters
 */
function applyFilters() {
    currentFilters.closure_type = document.getElementById('closure-type-filter').value;
    currentFilters.start_date = document.getElementById('start-date-filter').value;
    currentFilters.end_date = document.getElementById('end-date-filter').value;
    
    loadCases();
    loadStatistics(); // Reload stats with filters if needed
}

/**
 * Clear filters
 */
function clearFilters() {
    document.getElementById('closure-type-filter').value = '';
    document.getElementById('start-date-filter').value = '';
    document.getElementById('end-date-filter').value = '';
    
    currentFilters = {
        closure_type: '',
        start_date: '',
        end_date: ''
    };
    
    loadCases();
    loadStatistics();
}

/**
 * Get closure type badge HTML
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
 * View case details in modal - Use the full case details modal in read-only mode
 */
async function viewCaseDetails(caseId) {
    try {
        // Use the same modal as investigations, but in read-only mode
        if (typeof showFullCaseDetailsModal === 'function') {
            await showFullCaseDetailsModal(caseId, true); // true = read-only mode
        } else {
            console.error('showFullCaseDetailsModal is not available');
            await showError('Error', 'Case details modal is not available');
        }
    } catch (error) {
        console.error('Error loading case details:', error);
        await showError('Failed to load case details', error.message);
    }
}

/**
 * Display case details in modal
 */
function displayCaseDetails(caseData) {
    // Set modal title
    document.getElementById('modal-case-number').textContent = caseData.case_number;
    
    // Build case details HTML
    let html = `
        <!-- Basic Information -->
        <div class="info-section">
            <h6><i class="fas fa-info-circle"></i> ${t('basic_information') || 'Basic Information'}</h6>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>${t('case_number') || 'Case Number'}:</strong> ${caseData.case_number}</p>
                    <p><strong>${t('crime_type') || 'Crime Type'}:</strong> ${caseData.crime_type || '-'}</p>
                    <p><strong>${t('incident_date') || 'Incident Date'}:</strong> ${formatDate(caseData.incident_date)}</p>
                    <p><strong>${t('incident_location') || 'Location'}:</strong> ${caseData.incident_location || '-'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>${t('status') || 'Status'}:</strong> <span class="badge bg-secondary">${caseData.status}</span></p>
                    <p><strong>${t('priority') || 'Priority'}:</strong> <span class="badge bg-${getPriorityColor(caseData.priority)}">${caseData.priority || '-'}</span></p>
                    <p><strong>${t('center') || 'Center'}:</strong> ${caseData.center_name || '-'}</p>
                    <p><strong>${t('category') || 'Category'}:</strong> ${caseData.category_name || '-'}</p>
                </div>
            </div>
        </div>
        
        <!-- Closure Information -->
        <div class="info-section">
            <h6><i class="fas fa-check-circle"></i> ${t('closure_information') || 'Closure Information'}</h6>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>${t('closure_type') || 'Closure Type'}:</strong> ${getClosureTypeBadge(caseData.closure_type)}</p>
                    <p><strong>${t('closed_date') || 'Closed Date'}:</strong> ${formatDateTime(caseData.closed_date)}</p>
                    <p><strong>${t('closed_by') || 'Closed By'}:</strong> ${caseData.closed_by_name || '-'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>${t('closure_reason') || 'Closure Reason'}:</strong></p>
                    <p class="border p-2 bg-light">${caseData.closure_reason || '-'}</p>
                </div>
            </div>
        </div>
    `;
    
    // Court Acknowledgment Details (if applicable)
    if (caseData.closure_type === 'closed_with_court_ack') {
        html += `
            <div class="info-section">
                <h6><i class="fas fa-gavel"></i> ${t('court_acknowledgment_details') || 'Court Acknowledgment Details'}</h6>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>${t('acknowledgment_number') || 'Acknowledgment Number'}:</strong> ${caseData.court_acknowledgment_number || '-'}</p>
                        <p><strong>${t('acknowledgment_date') || 'Acknowledgment Date'}:</strong> ${formatDate(caseData.court_acknowledgment_date)}</p>
                        <p><strong>${t('acknowledgment_deadline') || 'Court Deadline'}:</strong> ${formatDate(caseData.court_acknowledgment_deadline)}</p>
                    </div>
                    <div class="col-md-6">
                        ${caseData.court_acknowledgment_document ? `
                            <p><strong>${t('document') || 'Document'}:</strong> 
                                <a href="${API_BASE_URL}/${caseData.court_acknowledgment_document}" target="_blank" class="btn btn-sm btn-primary">
                                    <i class="fas fa-download"></i> ${t('download') || 'Download'}
                                </a>
                            </p>
                        ` : ''}
                        ${caseData.court_acknowledgment_notes ? `
                            <p><strong>${t('notes') || 'Notes'}:</strong></p>
                            <p class="border p-2 bg-light">${caseData.court_acknowledgment_notes}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Parties Information
    if (caseData.parties && caseData.parties.length > 0) {
        html += `
            <div class="info-section">
                <h6><i class="fas fa-users"></i> ${t('parties') || 'Parties'}</h6>
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                <th>${t('role') || 'Role'}</th>
                                <th>${t('name') || 'Name'}</th>
                                <th>${t('phone') || 'Phone'}</th>
                                <th>${t('national_id') || 'National ID'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${caseData.parties.map(party => `
                                <tr>
                                    <td><span class="badge bg-${getPartyRoleColor(party.party_role)}">${party.party_role}</span></td>
                                    <td>${party.first_name} ${party.middle_name || ''} ${party.last_name}</td>
                                    <td>${party.phone || '-'}</td>
                                    <td>${party.national_id || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Case Description
    if (caseData.description) {
        html += `
            <div class="info-section">
                <h6><i class="fas fa-file-alt"></i> ${t('description') || 'Description'}</h6>
                <p>${caseData.description}</p>
            </div>
        `;
    }
    
    // Display in modal
    document.getElementById('case-details-content').innerHTML = html;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('caseDetailsModal'));
    modal.show();
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
        'urgent': 'danger'
    };
    return colors[priority] || 'secondary';
}

function getPartyRoleColor(role) {
    const colors = {
        'accused': 'danger',
        'accuser': 'primary',
        'witness': 'info'
    };
    return colors[role] || 'secondary';
}

async function showError(title, message) {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: t('ok') || 'OK'
    });
}
