// ============================================
// COURT DASHBOARD
// ============================================

/**
 * Load Court Dashboard
 */
async function loadCourtDashboard() {
    const content = `
        <div class="page-header">
            <h2><i class="fas fa-gavel"></i> Court Dashboard</h2>
            <p class="text-muted">Overview of cases sent to court</p>
        </div>

        <div id="courtDashboardContent">
            <div class="loading">Loading dashboard...</div>
        </div>
    `;
    
    $('#pageContent').html(content);
    $('#pageTitle').text('Court Dashboard');
    
    await loadCourtDashboardData();
}

/**
 * Load Court Dashboard Data
 */
async function loadCourtDashboardData() {
    try {
        const response = await courtAPI.getDashboard();
        
        if (response.status === 'success') {
            renderCourtDashboard(response.data);
        }
    } catch (error) {
        console.error('Error loading court dashboard:', error);
        $('#courtDashboardContent').html('<div class="error-message">Failed to load dashboard</div>');
        showError('Error', 'Failed to load court dashboard');
    }
}

/**
 * Render Court Dashboard
 */
function renderCourtDashboard(data) {
    const html = `
        <!-- Statistics Cards -->
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 14px; opacity: 0.9;">Total Cases</div>
                        <div style="font-size: 32px; font-weight: bold; margin-top: 5px;">${data.total_cases || 0}</div>
                    </div>
                    <i class="fas fa-folder-open" style="font-size: 40px; opacity: 0.3;"></i>
                </div>
            </div>
            
            <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 14px; opacity: 0.9;">Pending Review</div>
                        <div style="font-size: 32px; font-weight: bold; margin-top: 5px;">${data.pending_review || 0}</div>
                    </div>
                    <i class="fas fa-clock" style="font-size: 40px; opacity: 0.3;"></i>
                </div>
            </div>
            
            <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 14px; opacity: 0.9;">Assigned Back</div>
                        <div style="font-size: 32px; font-weight: bold; margin-top: 5px;">${data.assigned_back || 0}</div>
                    </div>
                    <i class="fas fa-redo" style="font-size: 40px; opacity: 0.3;"></i>
                </div>
            </div>
            
            <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 14px; opacity: 0.9;">Closed by Court</div>
                        <div style="font-size: 32px; font-weight: bold; margin-top: 5px;">${data.closed_by_court || 0}</div>
                    </div>
                    <i class="fas fa-check-circle" style="font-size: 40px; opacity: 0.3;"></i>
                </div>
            </div>
        </div>

        <!-- Upcoming Deadlines -->
        ${(data.upcoming_deadlines && data.upcoming_deadlines.length > 0) ? `
        <div class="card mb-4">
            <div class="card-header" style="background: #fff3cd; border-bottom: 2px solid #ffc107;">
                <h3 style="margin: 0; color: #856404;">
                    <i class="fas fa-calendar-alt"></i> Upcoming Deadlines (Next 7 Days)
                </h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Case Number</th>
                                <th>Investigator</th>
                                <th>Deadline</th>
                                <th>Days Left</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.upcoming_deadlines.map(assignment => {
                                const deadline = new Date(assignment.deadline);
                                const today = new Date();
                                const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                                
                                let daysLeftBadge = '';
                                if (daysLeft === 0) {
                                    daysLeftBadge = '<span class="category-badge badge-danger" style="display: inline-block; position: static;">Due TODAY</span>';
                                } else if (daysLeft <= 3) {
                                    daysLeftBadge = `<span class="category-badge badge-warning" style="display: inline-block; position: static;">${daysLeft} day(s)</span>`;
                                } else {
                                    daysLeftBadge = `<span class="category-badge badge-info" style="display: inline-block; position: static;">${daysLeft} day(s)</span>`;
                                }
                                
                                return `
                                    <tr>
                                        <td><strong>${escapeHtml(assignment.case_number)}</strong></td>
                                        <td>${escapeHtml(assignment.investigator_name)}</td>
                                        <td>${formatDate(assignment.deadline)}</td>
                                        <td>${daysLeftBadge}</td>
                                        <td><span class="category-badge badge-primary" style="display: inline-block; position: static;">Active</span></td>
                                        <td>
                                            <button class="btn-icon" onclick="viewCourtCase(${assignment.case_id})" title="View Case">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Overdue Assignments -->
        ${(data.overdue && data.overdue.length > 0) ? `
        <div class="card mb-4">
            <div class="card-header" style="background: #f8d7da; border-bottom: 2px solid #dc3545;">
                <h3 style="margin: 0; color: #721c24;">
                    <i class="fas fa-exclamation-triangle"></i> Overdue Assignments
                </h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Case Number</th>
                                <th>Investigator</th>
                                <th>Deadline</th>
                                <th>Days Overdue</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.overdue.map(assignment => {
                                const deadline = new Date(assignment.deadline);
                                const today = new Date();
                                const daysOverdue = Math.ceil((today - deadline) / (1000 * 60 * 60 * 24));
                                
                                return `
                                    <tr>
                                        <td><strong>${escapeHtml(assignment.case_number)}</strong></td>
                                        <td>${escapeHtml(assignment.investigator_name)}</td>
                                        <td>${formatDate(assignment.deadline)}</td>
                                        <td><span class="category-badge badge-danger" style="display: inline-block; position: static;">${daysOverdue} day(s) overdue</span></td>
                                        <td>
                                            <button class="btn-icon" onclick="viewCourtCase(${assignment.case_id})" title="View Case">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Quick Actions -->
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
            </div>
            <div class="card-body">
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="loadCourtCases()">
                        <i class="fas fa-list"></i> View All Cases
                    </button>
                    <button class="btn btn-info" onclick="loadCourtCases('sent_to_court')">
                        <i class="fas fa-clock"></i> Pending Review
                    </button>
                    <button class="btn btn-warning" onclick="loadCourtCases('court_assigned_back')">
                        <i class="fas fa-redo"></i> Assigned Back
                    </button>
                </div>
            </div>
        </div>
    `;
    
    $('#courtDashboardContent').html(html);
}

/**
 * View Court Case
 */
function viewCourtCase(caseId) {
    // Navigate to court cases page with case details
    loadCourtCases();
    // After loading, open the case details
    setTimeout(() => {
        viewCaseDetails(caseId);
    }, 500);
}

// Export functions
window.loadCourtDashboard = loadCourtDashboard;
window.viewCourtCase = viewCourtCase;
