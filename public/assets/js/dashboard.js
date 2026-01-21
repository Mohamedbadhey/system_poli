// ============================================
// Dashboard Rendering
// ============================================

// Render dashboard based on user role
function renderDashboard(data) {
    const role = currentUser.role;
    
    let html = '<div class="stats-grid">';
    
    // Render statistics cards
    if (data.stats) {
        html += renderStatsCards(data.stats, role);
    }
    
    html += '</div>';
    
    // Render charts and tables
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">';
    
    if (data.cases_by_status) {
        html += renderCasesByStatus(data.cases_by_status);
    }
    
    if (data.recent_cases) {
        html += renderRecentCases(data.recent_cases);
    }
    
    html += '</div>';
    
    return html;
}

// Render statistics cards
function renderStatsCards(stats, role) {
    let html = '';
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (role === USER_ROLES.SUPER_ADMIN) {
        html += `
            <div class="stat-card">
                <div class="stat-icon primary">
                    <i class="fas fa-building"></i>
                </div>
                <div class="stat-details">
                    <h3>${stats.total_centers || 0}</h3>
                    <p data-i18n="police_centers">${t('police_centers')}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon success">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-details">
                    <h3>${stats.total_users || 0}</h3>
                    <p data-i18n="active_users">${t('active_users')}</p>
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="stat-card">
            <div class="stat-icon primary">
                <i class="fas fa-folder"></i>
            </div>
            <div class="stat-details">
                <h3>${stats.total_cases || stats.my_cases || 0}</h3>
                <p data-i18n="${stats.my_cases ? 'my_cases_count' : 'total_cases'}">${stats.my_cases ? t('my_cases_count') : t('total_cases')}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon warning">
                <i class="fas fa-search"></i>
            </div>
            <div class="stat-details">
                <h3>${stats.active_cases || stats.active_investigations || 0}</h3>
                <p data-i18n="active_investigations">${t('active_investigations')}</p>
            </div>
        </div>
    `;
    
    if (stats.pending_approval) {
        html += `
            <div class="stat-card">
                <div class="stat-icon danger">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-details">
                    <h3>${stats.pending_approval}</h3>
                    <p data-i18n="pending_approval_count">${t('pending_approval_count')}</p>
                </div>
            </div>
        `;
    }
    
    if (stats.in_custody !== undefined) {
        html += `
            <div class="stat-card">
                <div class="stat-icon danger">
                    <i class="fas fa-user-lock"></i>
                </div>
                <div class="stat-details">
                    <h3>${stats.in_custody}</h3>
                    <p data-i18n="in_custody">${t('in_custody')}</p>
                </div>
            </div>
        `;
    }
    
    if (stats.sent_to_court !== undefined) {
        html += `
            <div class="stat-card">
                <div class="stat-icon info">
                    <i class="fas fa-gavel"></i>
                </div>
                <div class="stat-details">
                    <h3>${stats.sent_to_court}</h3>
                    <p data-i18n="sent_to_court">${t('sent_to_court')}</p>
                </div>
            </div>
        `;
    }
    
    return html;
}

// Render cases by status chart
function renderCasesByStatus(casesByStatus) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title" data-i18n="cases_by_status">Cases by Status</h3>
            </div>
            <div class="card-body">
                <canvas id="statusChart" width="400" height="300"></canvas>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        renderStatusChart(casesByStatus);
    }, 100);
    
    return html;
}

// Render status chart
function renderStatusChart(data) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const labels = data.map(item => item.status.replace('_', ' ').toUpperCase());
    const values = data.map(item => item.count);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Render recent cases table
function renderRecentCases(recentCases) {
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Recent Cases</h3>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Case Number</th>
                                <th>Crime Type</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    if (recentCases.length === 0) {
        html += '<tr><td colspan="5" style="text-align: center;">No cases found</td></tr>';
    } else {
        recentCases.forEach(caseItem => {
            html += `
                <tr>
                    <td><strong>${caseItem.case_number}</strong></td>
                    <td>${caseItem.crime_type}</td>
                    <td>${getStatusBadge(caseItem.status)}</td>
                    <td>${formatDateOnly(caseItem.incident_date)}</td>
                    <td>
                        <button class="btn btn-primary" onclick="viewCaseDetails(${caseItem.id})" style="padding: 6px 12px; font-size: 12px;">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// View case details
async function viewCase(caseId) {
    $('#pageTitle').text('Case Details');
    const content = $('#pageContent');
    content.html('<div class="loading">Loading case details...</div>');
    
    try {
        let response;
        const role = currentUser.role;
        
        if (role === USER_ROLES.INVESTIGATOR) {
            response = await investigationAPI.getCase(caseId);
        } else if (role === USER_ROLES.COURT_USER) {
            response = await courtAPI.getCase(caseId);
        } else {
            response = await obAPI.getCase(caseId);
        }
        
        if (response.status === 'success') {
            content.html(renderCaseDetails(response.data));
        }
    } catch (error) {
        console.error('Failed to load case:', error);
        content.html('<div class="alert alert-error">Failed to load case details</div>');
    }
}

// Render case details
function renderCaseDetails(caseData) {
    return `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Case: ${caseData.case_number}</h3>
                <div>
                    ${getStatusBadge(caseData.status)}
                    ${getPriorityBadge(caseData.priority)}
                </div>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4>Case Information</h4>
                        <p><strong>OB Number:</strong> ${caseData.ob_number}</p>
                        <p><strong>Crime Type:</strong> ${caseData.crime_type}</p>
                        <p><strong>Category:</strong> ${caseData.crime_category}</p>
                        <p><strong>Incident Date:</strong> ${formatDate(caseData.incident_date)}</p>
                        <p><strong>Location:</strong> ${caseData.incident_location}</p>
                    </div>
                    <div>
                        <h4>Status Information</h4>
                        <p><strong>Created:</strong> ${formatDate(caseData.created_at)}</p>
                        <p><strong>Status:</strong> ${caseData.status}</p>
                        ${caseData.investigation_deadline ? `<p><strong>Deadline:</strong> ${formatDate(caseData.investigation_deadline)}</p>` : ''}
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <h4>Incident Description</h4>
                    <p>${caseData.incident_description}</p>
                </div>
            </div>
        </div>
    `;
}
