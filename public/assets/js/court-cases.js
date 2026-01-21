// ============================================
// COURT CASES MANAGEMENT
// ============================================

let currentCourtCases = [];
let courtCaseFilters = {};

/**
 * Load Court Cases Page
 */
async function loadCourtCases(filterStatus = null) {
    const content = `
        <div class="page-header">
            <h2><i class="fas fa-gavel"></i> Court Cases</h2>
            <p class="text-muted">Manage cases sent to court</p>
        </div>

        <!-- Filters -->
        <div class="card mb-3">
            <div class="card-body">
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <label style="margin: 0; font-weight: 600;">Filter by Status:</label>
                    <button class="btn btn-sm ${!filterStatus ? 'btn-primary' : 'btn-outline-primary'}" onclick="loadCourtCases()">
                        All Cases
                    </button>
                    <button class="btn btn-sm ${filterStatus === 'sent_to_court' ? 'btn-primary' : 'btn-outline-primary'}" onclick="loadCourtCases('sent_to_court')">
                        Pending Review
                    </button>
                    <button class="btn btn-sm ${filterStatus === 'court_review' ? 'btn-primary' : 'btn-outline-primary'}" onclick="loadCourtCases('court_review')">
                        Under Review
                    </button>
                    <button class="btn btn-sm ${filterStatus === 'court_assigned_back' ? 'btn-primary' : 'btn-outline-primary'}" onclick="loadCourtCases('court_assigned_back')">
                        Assigned Back
                    </button>
                    <button class="btn btn-sm ${filterStatus === 'court_closed' ? 'btn-primary' : 'btn-outline-primary'}" onclick="loadCourtCases('court_closed')">
                        Closed
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div id="courtCasesTableContainer">
                    <div class="loading">Loading cases...</div>
                </div>
            </div>
        </div>
    `;
    
    $('#pageContent').html(content);
    $('#pageTitle').text('Court Cases');
    
    courtCaseFilters.status = filterStatus;
    await loadCourtCasesData();
}

/**
 * Load Court Cases Data
 */
async function loadCourtCasesData() {
    try {
        const response = await courtAPI.getCases();
        
        if (response.status === 'success') {
            currentCourtCases = response.data;
            
            // Apply filters
            let filteredCases = currentCourtCases;
            if (courtCaseFilters.status) {
                filteredCases = currentCourtCases.filter(c => c.court_status === courtCaseFilters.status);
            }
            
            renderCourtCasesTable(filteredCases);
        }
    } catch (error) {
        console.error('Error loading court cases:', error);
        $('#courtCasesTableContainer').html('<div class="error-message">Failed to load court cases</div>');
        showError('Error', 'Failed to load court cases');
    }
}

/**
 * Render Court Cases Table
 */
function renderCourtCasesTable(cases) {
    if (cases.length === 0) {
        $('#courtCasesTableContainer').html(`
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Cases Found</h3>
                <p>No cases match the current filter</p>
            </div>
        `);
        return;
    }
    
    const html = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Case Number</th>
                        <th>OB Number</th>
                        <th>Crime Type</th>
                        <th>Sent By</th>
                        <th>Sent Date</th>
                        <th>Court Status</th>
                        <th>Deadline</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${cases.map(caseItem => {
                        const statusBadge = getCourtStatusBadge(caseItem.court_status);
                        
                        let deadlineInfo = 'N/A';
                        // Check both court_deadline (from cases table) for backward compatibility
                        const deadline = caseItem.court_deadline;
                        if (deadline && caseItem.court_status === 'court_assigned_back') {
                            const deadlineDate = new Date(deadline);
                            const today = new Date();
                            const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
                            
                            if (daysLeft < 0) {
                                deadlineInfo = `<span class="category-badge badge-danger" style="display: inline-block; position: static;">${Math.abs(daysLeft)} day(s) overdue</span>`;
                            } else if (daysLeft === 0) {
                                deadlineInfo = '<span class="category-badge badge-warning" style="display: inline-block; position: static;">Due TODAY</span>';
                            } else if (daysLeft <= 3) {
                                deadlineInfo = `<span class="category-badge badge-warning" style="display: inline-block; position: static;">${daysLeft} day(s)</span>`;
                            } else {
                                deadlineInfo = formatDate(deadline);
                            }
                        }
                        
                        return `
                            <tr>
                                <td><strong>${escapeHtml(caseItem.case_number)}</strong></td>
                                <td>${escapeHtml(caseItem.ob_number)}</td>
                                <td>${escapeHtml(caseItem.crime_type)}</td>
                                <td>${escapeHtml(caseItem.sent_by_name || 'N/A')}</td>
                                <td>${formatDate(caseItem.sent_to_court_date)}</td>
                                <td>${statusBadge}</td>
                                <td>${deadlineInfo}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-icon" onclick="showCourtCaseActions(${caseItem.id})" title="Actions">
                                            <i class="fas fa-bars"></i>
                                        </button>
                                        <button class="btn-icon" onclick="viewCaseDetails(${caseItem.id})" title="View Details">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    $('#courtCasesTableContainer').html(html);
}

/**
 * Show Court Case Actions Menu
 */
async function showCourtCaseActions(caseId) {
    const caseItem = currentCourtCases.find(c => c.id == caseId);
    if (!caseItem) return;
    
    const actions = [];
    
    // Mark as Review
    if (caseItem.court_status === 'sent_to_court') {
        actions.push({
            label: 'Mark as Under Review',
            icon: 'fa-eye',
            onclick: `markCaseAsReview(${caseId})`
        });
    }
    
    // Assign to Investigator
    if (caseItem.court_status === 'sent_to_court' || caseItem.court_status === 'court_review') {
        actions.push({
            label: 'Assign to Investigator',
            icon: 'fa-user-tie',
            onclick: `showAssignToInvestigatorModal(${caseId}, '${caseItem.case_number}')`
        });
    }
    
    // Close Case
    if (caseItem.court_status !== 'court_closed') {
        actions.push({
            label: 'Close Case',
            icon: 'fa-check-circle',
            onclick: `showCourtCloseCaseModal(${caseId}, '${caseItem.case_number}')`
        });
    }
    
    // View History
    actions.push({
        label: 'View Case History',
        icon: 'fa-history',
        onclick: `viewCaseHistory(${caseId})`
    });
    
    // Build actions menu
    const actionsHtml = actions.map(action => `
        <button class="btn btn-block btn-outline-primary mb-2" onclick="${action.onclick}; closeModal();" style="text-align: left;">
            <i class="fas ${action.icon}"></i> ${action.label}
        </button>
    `).join('');
    
    const modalContent = `
        <div class="modal-header">
            <h3>Case Actions - ${escapeHtml(caseItem.case_number)}</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            ${actionsHtml}
        </div>
    `;
    
    showModal('Case Actions', modalContent, [], 'small');
}

// Export functions
window.loadCourtCases = loadCourtCases;
window.showCourtCaseActions = showCourtCaseActions;
