// ============================================
// ADMIN REPORTS - Users, Centers, Categories
// ============================================

/**
 * Load Users Management Page
 */
async function loadUsersPage() {
    setPageTitle('user_management');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const htmlContent = renderUsersPage(data.data);
            console.log('=== RENDERED HTML (first 2000 chars) ===');
            console.log(htmlContent.substring(0, 2000));
            console.log('=== END HTML ===');
            content.html(htmlContent);
            
            // Check if the content was actually inserted
            setTimeout(() => {
                console.log('Checking DOM after insertion...');
                const roleCells = document.querySelectorAll('.data-table tbody tr td:nth-child(3)');
                const statusCells = document.querySelectorAll('.data-table tbody tr td:nth-child(5)');
                console.log('Found', roleCells.length, 'role cells');
                console.log('Found', statusCells.length, 'status cells');
                if (roleCells.length > 0) {
                    console.log('First role cell HTML:', roleCells[0].innerHTML);
                    console.log('First role cell text:', roleCells[0].textContent);
                    console.log('First role cell has span:', roleCells[0].querySelector('span') !== null);
                }
                if (statusCells.length > 0) {
                    console.log('First status cell HTML:', statusCells[0].innerHTML);
                    console.log('First status cell has span:', statusCells[0].querySelector('span') !== null);
                }
            }, 100);
        } else {
            content.html(`<div class="alert alert-error" data-i18n="failed_load_users">${t('failed_load_users')}</div>`);
        }
    } catch (error) {
        console.error('Error:', error);
        content.html(`<div class="alert alert-error" data-i18n="error_loading_data">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render Users Page
 */
function renderUsersPage(users) {
    // Debug: Log the users data
    console.log('Rendering users page with data:', users);
    console.log('Sample user:', users[0]);
    
    return `
        <div class="page-header">
            <h2 data-i18n="user_management"><i class="fas fa-users"></i> ${t('user_management')}</h2>
            <button class="btn btn-primary" onclick="showCreateUserModal()">
                <i class="fas fa-plus"></i> <span data-i18n="add_user">${t('add_user')}</span>
            </button>
        </div>
        
        <div class="card">
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="name">${t('name')}</th>
                            <th data-i18n="username">${t('username')}</th>
                            <th data-i18n="user_role">${t('user_role')}</th>
                            <th data-i18n="center">${t('center')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="last_login">${t('last_login')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => {
                            const isActive = user.is_active == 1 || user.is_active === '1' || user.is_active === true;
                            
                            // Check if t function exists
                            let statusBadge, activeText, inactiveText;
                            if (typeof t === 'function') {
                                activeText = t('active');
                                inactiveText = t('inactive');
                            } else {
                                activeText = 'Active';
                                inactiveText = 'Inactive';
                            }
                            
                            statusBadge = isActive 
                                ? '<span class="badge badge-success" data-i18n="active">' + activeText + '</span>'
                                : '<span class="badge badge-danger" data-i18n="inactive">' + inactiveText + '</span>';
                            
                            const roleBadge = user.role ? getRoleBadge(user.role) : 'No Role';
                            
                            return `
                            <tr>
                                <td><strong>${user.full_name || 'N/A'}</strong></td>
                                <td>${user.username || 'N/A'}</td>
                                <td>${roleBadge}</td>
                                <td>${user.center_name || 'N/A'}</td>
                                <td>${statusBadge}</td>
                                <td>${user.last_login ? formatDateTime(user.last_login) : '<span data-i18n="never">' + t('never') + '</span>'}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewUserReport(${user.id})" data-i18n-title="view_report" title="${t('view_report')}">
                                        <i class="fas fa-chart-line"></i>
                                    </button>
                                    <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})" data-i18n-title="edit" title="${t('edit')}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * View User Report
 */
async function viewUserReport(userId) {
    setPageTitle('user_report');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/report`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderUserReport(data.data));
        } else {
            content.html(`<div class="alert alert-error" data-i18n="failed_load_report">${t('failed_load_report')}</div>`);
        }
    } catch (error) {
        console.error('Error:', error);
        content.html(`<div class="alert alert-error" data-i18n="error_loading_data">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render User Report
 */
function renderUserReport(reportData) {
    const user = reportData.user;
    const stats = reportData.stats;
    
    return `
        <div class="report-container">
            <div class="report-header">
                <button class="btn btn-secondary" onclick="loadUsersPage()">
                    <i class="fas fa-arrow-left"></i> <span data-i18n="back_to_users">${t('back_to_users')}</span>
                </button>
                <h2><i class="fas fa-user"></i> ${user.full_name} - <span data-i18n="activity_report">${t('activity_report')}</span></h2>
            </div>
            
            <div class="user-info-card">
                <h3 data-i18n="user_information">${t('user_information')}</h3>
                <div class="info-grid">
                    <div><strong data-i18n="username">${t('username')}:</strong> ${user.username}</div>
                    <div><strong data-i18n="user_role">${t('user_role')}:</strong> ${getRoleBadge(user.role)}</div>
                    <div><strong data-i18n="center">${t('center')}:</strong> ${user.center_name}</div>
                    <div><strong data-i18n="badge_number">${t('badge_number')}:</strong> ${user.badge_number || 'N/A'}</div>
                    <div><strong data-i18n="status">${t('status')}:</strong> ${user.is_active ? `<span class="badge badge-success" data-i18n="active">${t('active')}</span>` : `<span class="badge badge-danger" data-i18n="inactive">${t('inactive')}</span>`}</div>
                    <div><strong data-i18n="last_login">${t('last_login')}:</strong> ${user.last_login ? formatDateTime(user.last_login) : `<span data-i18n="never">${t('never')}</span>`}</div>
                </div>
            </div>
            
            ${renderRoleSpecificStats(user.role, stats)}
            
            ${renderRoleSpecificSections(user.role, reportData)}
        </div>
        
        <style>
            .report-container { padding: 20px; }
            .report-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
            .user-info-card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .section-description { color: #6c757d; font-size: 14px; margin-bottom: 15px; }
            .stat-card.stat-purple .stat-icon { background: #e0e7ff; color: #667eea; }
            .stat-card.stat-secondary .stat-icon { background: #f8f9fa; color: #6c757d; }
        </style>
    `;
}

/**
 * Render role-specific statistics cards
 */
function renderRoleSpecificStats(role, stats) {
    // Common stats for all roles
    const commonStats = `
        <div class="stat-card stat-warning">
            <div class="stat-icon"><i class="fas fa-sign-in-alt"></i></div>
            <div class="stat-content">
                <div class="stat-value">${stats.total_logins || 0}</div>
                <div class="stat-label" data-i18n="total_logins">${t('total_logins')}</div>
            </div>
        </div>
        
        <div class="stat-card stat-secondary">
            <div class="stat-icon"><i class="fas fa-calendar"></i></div>
            <div class="stat-content">
                <div class="stat-value">${stats.account_age_days || 0}</div>
                <div class="stat-label" data-i18n="days_active">${t('days_active')}</div>
            </div>
        </div>
    `;
    
    if (role === 'ob_officer') {
        return `
            <div class="stats-grid">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_cases || 0}</div>
                        <div class="stat-label" data-i18n="cases_created">${t('cases_created')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.active_cases || 0}</div>
                        <div class="stat-label" data-i18n="active_cases">${t('active_cases')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_persons || 0}</div>
                        <div class="stat-label" data-i18n="persons_registered">${t('persons_registered')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-danger">
                    <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.closed_cases || 0}</div>
                        <div class="stat-label" data-i18n="closed_cases">${t('closed_cases')}</div>
                    </div>
                </div>
                
                ${commonStats}
            </div>
        `;
    } else if (role === 'investigator') {
        return `
            <div class="stats-grid">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-search"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_investigations || 0}</div>
                        <div class="stat-label" data-i18n="cases_assigned">${t('cases_assigned')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-tasks"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.active_cases || 0}</div>
                        <div class="stat-label" data-i18n="active_investigations">${t('active_investigations')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-box"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_evidence || 0}</div>
                        <div class="stat-label" data-i18n="evidence_collected">${t('evidence_collected')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-danger">
                    <div class="stat-icon"><i class="fas fa-check-double"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.closed_cases || 0}</div>
                        <div class="stat-label" data-i18n="cases_completed">${t('cases_completed')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-purple">
                    <div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_notes || 0}</div>
                        <div class="stat-label" data-i18n="investigation_notes">${t('investigation_notes')}</div>
                    </div>
                </div>
                
                ${commonStats}
            </div>
        `;
    } else if (role === 'admin' || role === 'super_admin') {
        return `
            <div class="stats-grid">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_cases || 0}</div>
                        <div class="stat-label">Total Cases Managed</div>
                    </div>
                </div>
                
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.active_cases || 0}</div>
                        <div class="stat-label">Cases Under Review</div>
                    </div>
                </div>
                
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.closed_cases || 0}</div>
                        <div class="stat-label">Cases Approved</div>
                    </div>
                </div>
                
                ${commonStats}
            </div>
        `;
    } else {
        // Default for other roles
        return `
            <div class="stats-grid">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_cases || 0}</div>
                        <div class="stat-label">Total Cases</div>
                    </div>
                </div>
                
                ${commonStats}
            </div>
        `;
    }
}

/**
 * Render role-specific sections
 */
function renderRoleSpecificSections(role, reportData) {
    let sections = '';
    
    if (role === 'ob_officer') {
        sections = `
            <div class="report-section">
                <h3><i class="fas fa-file-alt"></i> Cases Created</h3>
                <p class="section-description">All cases registered by this OB Officer</p>
                ${renderUserCasesTable(reportData.cases)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-chart-pie"></i> Case Status Distribution</h3>
                ${renderCaseStatusChart(reportData.cases_by_status)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-history"></i> Recent Activity</h3>
                ${renderActivityTimeline(reportData.recent_activity)}
            </div>
        `;
    } else if (role === 'investigator') {
        sections = `
            <div class="report-section">
                <h3><i class="fas fa-search"></i> Assigned Investigations</h3>
                <p class="section-description">Cases currently assigned to this investigator</p>
                ${renderUserCasesTable(reportData.cases)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-box"></i> Evidence Collection Activity</h3>
                ${renderEvidenceActivity(reportData.recent_activity)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-chart-line"></i> Investigation Progress</h3>
                ${renderCaseStatusChart(reportData.cases_by_status)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-history"></i> Recent Activity</h3>
                ${renderActivityTimeline(reportData.recent_activity)}
            </div>
        `;
    } else if (role === 'admin' || role === 'super_admin') {
        sections = `
            <div class="report-section">
                <h3><i class="fas fa-clipboard-check"></i> Administrative Activity</h3>
                <p class="section-description">Cases reviewed and managed</p>
                ${renderUserCasesTable(reportData.cases)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-chart-bar"></i> Management Overview</h3>
                ${renderCaseStatusChart(reportData.cases_by_status)}
            </div>
        `;
    } else {
        sections = `
            <div class="report-section">
                <h3><i class="fas fa-briefcase"></i> Recent Cases</h3>
                ${renderUserCasesTable(reportData.cases)}
            </div>
        `;
    }
    
    // Add login history for all roles
    sections += `
        <div class="report-section">
            <h3><i class="fas fa-clock"></i> Login History</h3>
            ${renderLoginHistory(reportData.login_history)}
        </div>
    `;
    
    return sections;
}

/**
 * Render case status chart
 */
function renderCaseStatusChart(casesByStatus) {
    if (!casesByStatus) {
        return '<p class="text-muted">No data available</p>';
    }
    
    const total = Object.values(casesByStatus).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
        return '<p class="text-muted">No cases found</p>';
    }
    
    return `
        <div class="status-chart">
            ${Object.entries(casesByStatus).map(([status, count]) => {
                const percentage = Math.round((count / total) * 100);
                return `
                    <div class="status-bar-item">
                        <div class="status-bar-label">
                            ${getStatusBadge(status)}
                            <span class="status-bar-count">${count} (${percentage}%)</span>
                        </div>
                        <div class="status-bar-track">
                            <div class="status-bar-fill status-${status}" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <style>
            .status-chart { display: flex; flex-direction: column; gap: 15px; }
            .status-bar-item { }
            .status-bar-label { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .status-bar-count { color: #6c757d; font-size: 14px; }
            .status-bar-track { height: 10px; background: #e9ecef; border-radius: 5px; overflow: hidden; }
            .status-bar-fill { height: 100%; transition: width 0.3s; }
            .status-draft { background: #6c757d; }
            .status-submitted { background: #0dcaf0; }
            .status-approved { background: #0d6efd; }
            .status-investigating { background: #ffc107; }
            .status-closed { background: #198754; }
        </style>
    `;
}

/**
 * Render activity timeline
 */
function renderActivityTimeline(activities) {
    if (!activities || activities.length === 0) {
        return '<p class="text-muted">No recent activity</p>';
    }
    
    return `
        <div class="activity-timeline">
            ${activities.map(activity => `
                <div class="timeline-item">
                    <div class="timeline-icon ${activity.type === 'case_created' ? 'bg-primary' : 'bg-info'}">
                        <i class="fas ${activity.type === 'case_created' ? 'fa-file-alt' : 'fa-box'}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">${activity.description}</div>
                        <div class="timeline-time">${formatDateTime(activity.timestamp)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <style>
            .activity-timeline { display: flex; flex-direction: column; gap: 20px; }
            .timeline-item { display: flex; gap: 15px; }
            .timeline-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
            .timeline-icon.bg-primary { background: #0d6efd; }
            .timeline-icon.bg-info { background: #0dcaf0; }
            .timeline-content { flex: 1; }
            .timeline-title { font-weight: 500; margin-bottom: 5px; }
            .timeline-time { color: #6c757d; font-size: 13px; }
        </style>
    `;
}

/**
 * Render evidence activity
 */
function renderEvidenceActivity(activities) {
    const evidenceActivities = activities.filter(a => a.type === 'evidence_collected');
    
    if (evidenceActivities.length === 0) {
        return '<p class="text-muted">No evidence collected yet</p>';
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Evidence Title</th>
                    <th>Date Collected</th>
                </tr>
            </thead>
            <tbody>
                ${evidenceActivities.map(a => `
                    <tr>
                        <td><strong>${a.data.title || 'N/A'}</strong></td>
                        <td>${formatDateTime(a.timestamp)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Render login history
 */
function renderLoginHistory(loginHistory) {
    if (!loginHistory || loginHistory.length === 0) {
        return '<p class="text-muted">No login history available</p>';
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Login Time</th>
                    <th>IP Address</th>
                    <th>User Agent</th>
                </tr>
            </thead>
            <tbody>
                ${loginHistory.slice(0, 10).map(session => `
                    <tr>
                        <td>${formatDateTime(session.created_at)}</td>
                        <td><code>${session.ip_address || 'N/A'}</code></td>
                        <td><small>${session.user_agent ? session.user_agent.substring(0, 50) + '...' : 'N/A'}</small></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderUserCasesTable(cases) {
    if (!cases || cases.length === 0) {
        return '<p class="text-muted">No cases found</p>';
    }
    
    // Check if these are assigned cases (has assignment_status)
    const isAssignedCases = cases.length > 0 && cases[0].assignment_status !== undefined;
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Case Number</th>
                    <th>Crime Type</th>
                    <th>Crime Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Center</th>
                    ${isAssignedCases ? '<th>Assigned Date</th>' : '<th>Created Date</th>'}
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${cases.map(c => `
                    <tr>
                        <td><strong>${c.case_number}</strong></td>
                        <td>${c.crime_type || 'N/A'}</td>
                        <td>${getCategoryBadge(c.crime_category)}</td>
                        <td>${getPriorityBadge(c.priority || 'medium')}</td>
                        <td>${getStatusBadge(c.status)}</td>
                        <td>${c.center_name}</td>
                        <td>${formatDateTime(isAssignedCases ? c.assigned_at : c.created_at)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewCaseDetailsAdmin(${c.id})" title="View Details">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Get category badge
 */
function getCategoryBadge(category) {
    const badges = {
        'violent': '<span class="badge" style="background: #dc3545; color: white;">Violent</span>',
        'property': '<span class="badge" style="background: #fd7e14; color: white;">Property</span>',
        'drug': '<span class="badge" style="background: #6f42c1; color: white;">Drug</span>',
        'cybercrime': '<span class="badge" style="background: #0dcaf0; color: white;">Cybercrime</span>',
        'sexual': '<span class="badge" style="background: #d63384; color: white;">Sexual</span>',
        'juvenile': '<span class="badge" style="background: #ffc107; color: #000;">Juvenile</span>',
        'other': '<span class="badge" style="background: #6c757d; color: white;">Other</span>'
    };
    return badges[category] || `<span class="badge badge-secondary">${category}</span>`;
}

/**
 * Get priority badge
 */
function getPriorityBadge(priority) {
    const badges = {
        'low': '<span class="badge" style="background: #198754; color: white;">Low</span>',
        'medium': '<span class="badge" style="background: #ffc107; color: #000;">Medium</span>',
        'high': '<span class="badge" style="background: #fd7e14; color: white;">High</span>',
        'critical': '<span class="badge" style="background: #dc3545; color: white;">Critical</span>'
    };
    return badges[priority] || `<span class="badge badge-secondary">${priority}</span>`;
}

/**
 * View case details (admin version - uses full modal)
 */
async function viewCaseDetailsAdmin(caseId) {
    // Use the existing comprehensive case details modal
    // This shows all case information including parties, evidence, etc.
    if (typeof showFullCaseDetailsModal === 'function') {
        showFullCaseDetailsModal(caseId);
    } else {
        // Fallback to basic details if the full modal isn't available
        showBasicCaseDetails(caseId);
    }
}

/**
 * Fallback: Show basic case details
 */
async function showBasicCaseDetails(caseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/cases/${caseId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const caseData = data.data;
            const modal = $('<div class="modal-overlay"></div>');
            const modalContent = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-header">
                        <h3><i class="fas fa-file-alt"></i> Case Details: ${caseData.case_number}</h3>
                        <button class="modal-close" onclick="$(this).closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="case-details-grid">
                            <div class="detail-item">
                                <strong>Case Number:</strong>
                                <span>${caseData.case_number}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Crime Type:</strong>
                                <span>${caseData.crime_type}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Category:</strong>
                                ${getCategoryBadge(caseData.crime_category)}
                            </div>
                            <div class="detail-item">
                                <strong>Priority:</strong>
                                ${getPriorityBadge(caseData.priority)}
                            </div>
                            <div class="detail-item">
                                <strong>Status:</strong>
                                ${getStatusBadge(caseData.status)}
                            </div>
                            <div class="detail-item">
                                <strong>Police Center:</strong>
                                <span>${caseData.center_name || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Date Created:</strong>
                                <span>${formatDateTime(caseData.created_at)}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Created By:</strong>
                                <span>${caseData.created_by_name || 'N/A'}</span>
                            </div>
                        </div>
                        
                        ${caseData.incident_description ? `
                            <div class="detail-section">
                                <strong>Description:</strong>
                                <p>${caseData.incident_description}</p>
                            </div>
                        ` : ''}
                        
                        ${caseData.incident_location ? `
                            <div class="detail-section">
                                <strong>Location:</strong>
                                <p>${caseData.incident_location}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="$(this).closest('.modal-overlay').remove()">
                            Close
                        </button>
                    </div>
                </div>
                
                <style>
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                    }
                    .modal-dialog { background: white; border-radius: 12px; max-width: 800px; width: 90%; max-height: 90vh; overflow: auto; }
                    .modal-lg { max-width: 900px; }
                    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e5e7eb; }
                    .modal-header h3 { margin: 0; font-size: 20px; }
                    .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: #6c757d; }
                    .modal-close:hover { color: #000; }
                    .modal-body { padding: 20px; }
                    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 20px; border-top: 1px solid #e5e7eb; }
                    .case-details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
                    .detail-item { display: flex; flex-direction: column; }
                    .detail-item strong { color: #6c757d; font-size: 13px; margin-bottom: 5px; }
                    .detail-item span { font-size: 15px; }
                    .detail-section { margin-top: 20px; }
                    .detail-section strong { display: block; color: #6c757d; font-size: 13px; margin-bottom: 10px; }
                    .detail-section p { margin: 0; line-height: 1.6; }
                </style>
            `;
            
            modal.html(modalContent);
            $('body').append(modal);
        } else {
            showToast(data.message || 'Failed to load case details', 'error');
        }
    } catch (error) {
        console.error('Error loading case:', error);
        showToast('Error loading case details', 'error');
    }
}

function getRoleBadge(role) {
    console.log('getRoleBadge called with role:', role, 't function exists:', typeof t);
    
    // Check if t function exists
    if (typeof t !== 'function') {
        console.error('Translation function t() is not defined!');
        // Fallback without translation
        const badges = {
            'super_admin': '<span class="badge badge-danger">Super Admin</span>',
            'admin': '<span class="badge badge-warning">Admin</span>',
            'ob_officer': '<span class="badge badge-info">OB Officer</span>',
            'investigator': '<span class="badge badge-primary">Investigator</span>',
            'court_user': '<span class="badge badge-secondary">Court User</span>'
        };
        return badges[role] || '<span class="badge badge-secondary">' + role + '</span>';
    }
    
    const badges = {
        'super_admin': '<span class="badge badge-danger" data-i18n="super_admin">' + t('super_admin') + '</span>',
        'admin': '<span class="badge badge-warning" data-i18n="admin">' + t('admin') + '</span>',
        'ob_officer': '<span class="badge badge-info" data-i18n="ob_officer">' + t('ob_officer') + '</span>',
        'investigator': '<span class="badge badge-primary" data-i18n="investigator">' + t('investigator') + '</span>',
        'court_user': '<span class="badge badge-secondary" data-i18n="court_user">' + t('court_user') + '</span>'
    };
    
    const result = badges[role] || '<span class="badge badge-secondary">' + role + '</span>';
    console.log('getRoleBadge returning:', result);
    return result;
}

// ============================================
// CENTERS MANAGEMENT & REPORTS
// ============================================

/**
 * Load Centers Page
 */
async function loadCentersPage() {
    setPageTitle('police_centers');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/centers`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderCentersPage(data.data));
        } else {
            content.html(`<div class="alert alert-error" data-i18n="failed_load_centers">${t('failed_load_centers')}</div>`);
        }
    } catch (error) {
        console.error('Error:', error);
        content.html(`<div class="alert alert-error" data-i18n="error_loading_centers">${t('error_loading_centers')}</div>`);
    }
}

/**
 * Render Centers Page
 */
function renderCentersPage(centers) {
    return `
        <div class="page-header">
            <h2 data-i18n="police_centers"><i class="fas fa-building"></i> ${t('police_centers')}</h2>
            ${currentUser.role === 'super_admin' ? `<button class="btn btn-primary" onclick="showCreateCenterModal()"><i class="fas fa-plus"></i> <span data-i18n="add_center">${t('add_center')}</span></button>` : ''}
        </div>
        
        <div class="card">
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="center_name">${t('center_name')}</th>
                            <th data-i18n="code">${t('code')}</th>
                            <th data-i18n="location">${t('location')}</th>
                            <th data-i18n="phone">${t('phone')}</th>
                            <th data-i18n="users">${t('users')}</th>
                            <th data-i18n="cases">${t('cases')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${centers.map(center => `
                            <tr>
                                <td><strong>${center.center_name}</strong></td>
                                <td><span class="badge badge-secondary">${center.center_code}</span></td>
                                <td>${center.location}</td>
                                <td>${center.phone || 'N/A'}</td>
                                <td>${center.stats?.total_users || 0}</td>
                                <td>${center.stats?.total_cases || 0}</td>
                                <td>${center.is_active ? `<span class="badge badge-success" data-i18n="active">${t('active')}</span>` : `<span class="badge badge-danger" data-i18n="inactive">${t('inactive')}</span>`}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewCenterReport(${center.id})" data-i18n-title="view_report" title="${t('view_report')}">
                                        <i class="fas fa-chart-bar"></i>
                                    </button>
                                    ${currentUser.role === 'super_admin' ? `<button class="btn btn-sm btn-primary" onclick="editCenter(${center.id})" data-i18n-title="edit" title="${t('edit')}"><i class="fas fa-edit"></i></button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * View Center Report
 */
async function viewCenterReport(centerId) {
    setPageTitle('center_analytics');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/centers/${centerId}/report`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderCenterReport(data.data));
        } else {
            content.html(`<div class="alert alert-error" data-i18n="failed_load_report">${t('failed_load_report')}</div>`);
        }
    } catch (error) {
        console.error('Error:', error);
        content.html(`<div class="alert alert-error" data-i18n="error_loading_data">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render Center Report
 */
function renderCenterReport(reportData) {
    const center = reportData.center;
    const stats = reportData.stats;
    
    return `
        <div class="report-container">
            <div class="report-header">
                <button class="btn btn-secondary" onclick="loadCentersPage()">
                    <i class="fas fa-arrow-left"></i> <span data-i18n="back_to_centers">${t('back_to_centers')}</span>
                </button>
                <h2><i class="fas fa-building"></i> ${center.center_name} - <span data-i18n="analytics_report">${t('analytics_report')}</span></h2>
            </div>
            
            <div class="user-info-card">
                <h3 data-i18n="center_information">${t('center_information')}</h3>
                <div class="info-grid">
                    <div><strong data-i18n="code">${t('code')}:</strong> ${center.center_code}</div>
                    <div><strong data-i18n="location">${t('location')}:</strong> ${center.location}</div>
                    <div><strong data-i18n="phone">${t('phone')}:</strong> ${center.phone || 'N/A'}</div>
                    <div><strong data-i18n="email">${t('email')}:</strong> ${center.email || 'N/A'}</div>
                    <div><strong data-i18n="status">${t('status')}:</strong> ${center.is_active ? `<span class="badge badge-success" data-i18n="active">${t('active')}</span>` : `<span class="badge badge-danger" data-i18n="inactive">${t('inactive')}</span>`}</div>
                    <div><strong data-i18n="created">${t('created')}:</strong> ${formatDateTime(center.created_at)}</div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_users || 0}</div>
                        <div class="stat-label" data-i18n="total_users">${t('total_users')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_cases || 0}</div>
                        <div class="stat-label" data-i18n="total_cases">${t('total_cases')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.closed_cases || 0}</div>
                        <div class="stat-label" data-i18n="closed_cases">${t('closed_cases')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-warning">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.pending_approval || 0}</div>
                        <div class="stat-label" data-i18n="pending_approval">${t('pending_approval')}</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-users"></i> <span data-i18n="center_users">${t('center_users')}</span></h3>
                ${renderCenterUsersTable(reportData.users)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-briefcase"></i> <span data-i18n="recent_cases">${t('recent_cases')}</span></h3>
                ${renderCenterCasesTable(reportData.recent_cases)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-chart-line"></i> <span data-i18n="performance_metrics">${t('performance_metrics')}</span></h3>
                <div class="performance-grid">
                    <div class="metric-card">
                        <div class="metric-label" data-i18n="case_closure_rate">${t('case_closure_rate')}</div>
                        <div class="metric-value">${reportData.performance?.case_closure_rate || 0}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label" data-i18n="avg_resolution_time">${t('avg_resolution_time')}</div>
                        <div class="metric-value">${reportData.performance?.avg_case_resolution_days || 0} <span data-i18n="days">${t('days')}</span></div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label" data-i18n="court_submission_rate">${t('court_submission_rate')}</div>
                        <div class="metric-value">${reportData.performance?.court_submission_rate || 0}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label" data-i18n="evidence_collection_rate">${t('evidence_collection_rate')}</div>
                        <div class="metric-value">${reportData.performance?.evidence_collection_rate || 0}%</div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .performance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
            .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
            .metric-label { font-size: 14px; color: #6c757d; margin-bottom: 10px; }
            .metric-value { font-size: 28px; font-weight: bold; color: #3b82f6; }
        </style>
    `;
}

function renderCenterUsersTable(users) {
    if (!users || users.length === 0) {
        return `<p class="text-muted" data-i18n="no_users_found">${t('no_users_found')}</p>`;
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th data-i18n="name">${t('name')}</th>
                    <th data-i18n="username">${t('username')}</th>
                    <th data-i18n="user_role">${t('user_role')}</th>
                    <th data-i18n="badge_number">${t('badge_number')}</th>
                    <th data-i18n="cases_created">${t('cases_created')}</th>
                    <th data-i18n="status">${t('status')}</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(u => `
                    <tr>
                        <td><strong>${u.full_name}</strong></td>
                        <td>${u.username}</td>
                        <td>${getRoleBadge(u.role)}</td>
                        <td>${u.badge_number || 'N/A'}</td>
                        <td>${u.cases_created || u.cases_assigned || 0}</td>
                        <td>${u.is_active ? `<span class="badge badge-success" data-i18n="active">${t('active')}</span>` : `<span class="badge badge-danger" data-i18n="inactive">${t('inactive')}</span>`}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderCenterCasesTable(cases) {
    if (!cases || cases.length === 0) {
        return `<p class="text-muted" data-i18n="no_cases_found">${t('no_cases_found')}</p>`;
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Case Number</th>
                    <th>Crime Type</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                ${cases.map(c => `
                    <tr>
                        <td><strong>${c.case_number}</strong></td>
                        <td>${c.crime_type}</td>
                        <td>${getStatusBadge(c.status)}</td>
                        <td>${c.created_by_name}</td>
                        <td>${formatDateTime(c.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ============================================
// CATEGORY REPORTS (Add to existing categories.js)
// ============================================

/**
 * View Category Report
 */
async function viewCategoryReport(categoryId) {
    setPageTitle('category_report');
    const content = $('#pageContent');
    content.html('<div class="loading">Loading category report...</div>');
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}/report`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderCategoryReport(data.data));
        } else {
            content.html('<div class="alert alert-error">Failed to load report</div>');
        }
    } catch (error) {
        console.error('Error:', error);
        content.html('<div class="alert alert-error">Error loading report</div>');
    }
}

/**
 * Render Category Report
 */
function renderCategoryReport(reportData) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const category = reportData.category;
    const stats = reportData.stats;
    
    return `
        <div class="report-container">
            <div class="report-header">
                <button class="btn btn-secondary" onclick="loadReportsDashboard()">
                    <i class="fas fa-arrow-left"></i> <span data-i18n="back_to_reports">${t('back_to_reports')}</span>
                </button>
                <h2><i class="${category.icon}" style="color: ${category.color};"></i> ${escapeHtml(category.name)} - <span data-i18n="detailed_report">${t('detailed_report')}</span></h2>
            </div>
            
            <div class="user-info-card">
                <h3 data-i18n="category_information">${t('category_information')}</h3>
                <div class="info-grid">
                    <div><strong data-i18n="name">${t('name')}:</strong> ${escapeHtml(category.name)}</div>
                    <div><strong data-i18n="description">${t('description')}:</strong> ${escapeHtml(category.description || 'N/A')}</div>
                    <div><strong data-i18n="color">${t('color')}:</strong> <span style="display:inline-block;width:20px;height:20px;background:${category.color};border-radius:3px;"></span> ${category.color}</div>
                    <div><strong data-i18n="status">${t('status')}:</strong> ${category.is_active ? `<span class="badge badge-success" data-i18n="active">${t('active')}</span>` : `<span class="badge badge-danger" data-i18n="inactive">${t('inactive')}</span>`}</div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_cases || 0}</div>
                        <div class="stat-label" data-i18n="total_cases">${t('total_cases')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.closed_cases || 0}</div>
                        <div class="stat-label">Closed Cases</div>
                    </div>
                </div>
                
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-user-tie"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_suspects || 0}</div>
                        <div class="stat-label">Suspects</div>
                    </div>
                </div>
                
                <div class="stat-card stat-warning">
                    <div class="stat-icon"><i class="fas fa-box"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_evidence || 0}</div>
                        <div class="stat-label">Evidence Items</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-building"></i> Cases by Center</h3>
                ${renderCasesByCenterTable(reportData.cases_by_center)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-briefcase"></i> Recent Cases</h3>
                ${renderCategoryCasesTable(reportData.recent_cases)}
            </div>
            
            <div class="report-section">
                <h3><i class="fas fa-chart-line"></i> Resolution Metrics</h3>
                <div class="performance-grid">
                    <div class="metric-card">
                        <div class="metric-label">Closure Rate</div>
                        <div class="metric-value">${reportData.resolution_metrics?.closure_rate || 0}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Avg Resolution Time</div>
                        <div class="metric-value">${reportData.resolution_metrics?.avg_resolution_days || 0} days</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Court Submission</div>
                        <div class="metric-value">${reportData.resolution_metrics?.court_submission_rate || 0}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Evidence Collection</div>
                        <div class="metric-value">${reportData.resolution_metrics?.evidence_collection_rate || 0}%</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCasesByCenterTable(casesByCenter) {
    if (!casesByCenter || casesByCenter.length === 0) {
        return '<p class="text-muted">No data available</p>';
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Center Name</th>
                    <th>Center Code</th>
                    <th>Case Count</th>
                </tr>
            </thead>
            <tbody>
                ${casesByCenter.map(c => `
                    <tr>
                        <td><strong>${c.center_name}</strong></td>
                        <td><span class="badge badge-secondary">${c.center_code}</span></td>
                        <td><span class="badge badge-primary">${c.case_count}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderCategoryCasesTable(cases) {
    if (!cases || cases.length === 0) {
        return '<p class="text-muted">No cases found</p>';
    }
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Case Number</th>
                    <th>Crime Type</th>
                    <th>Status</th>
                    <th>Center</th>
                    <th>Created By</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                ${cases.map(c => `
                    <tr>
                        <td><strong>${c.case_number}</strong></td>
                        <td>${c.crime_type}</td>
                        <td>${getStatusBadge(c.status)}</td>
                        <td>${c.center_name}</td>
                        <td>${c.created_by_name}</td>
                        <td>${formatDateTime(c.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
