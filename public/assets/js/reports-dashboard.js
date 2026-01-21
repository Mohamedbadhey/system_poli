// ============================================
// COMPREHENSIVE REPORTS DASHBOARD
// ============================================

/**
 * Load Main Reports Dashboard with Overview
 */
async function loadReportsDashboard() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('reports_analytics');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        // Fetch all reports data
        const [usersResp, centersResp, statsResp] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            }),
            fetch(`${API_BASE_URL}/admin/centers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            }),
            fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            })
        ]);
        
        const users = await usersResp.json();
        const centers = await centersResp.json();
        const stats = await statsResp.json();
        
        content.html(renderReportsDashboard(users.data || [], centers.data || [], stats.data || {}));
    } catch (error) {
        console.error('Error loading reports dashboard:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render Reports Dashboard
 */
function renderReportsDashboard(users, centers, stats) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    // Calculate overview statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const totalCenters = centers.length;
    const activeCenters = centers.filter(c => c.is_active).length;
    const totalCategories = stats.cases_by_category?.length || 0;
    const totalCases = stats.total_cases || 0;
    
    return `
        <div class="reports-dashboard-container">
            <!-- Page Header -->
            <div class="page-header">
                <h2 data-i18n="reports_analytics">${t('reports_analytics')}</h2>
                <p class="text-muted" data-i18n="comprehensive_system_reports">${t('comprehensive_system_reports')}</p>
            </div>
            
            <!-- Overview Statistics -->
            <div class="stats-overview">
                <h3 data-i18n="system_overview">${t('system_overview')}</h3>
                <div class="stats-grid">
                    <div class="stat-card stat-primary">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-content">
                            <div class="stat-value">${totalUsers}</div>
                            <div class="stat-label" data-i18n="total_users">${t('total_users')}</div>
                            <div class="stat-detail">${activeUsers} <span data-i18n="active">${t('active')}</span></div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-success">
                        <div class="stat-icon"><i class="fas fa-building"></i></div>
                        <div class="stat-content">
                            <div class="stat-value">${totalCenters}</div>
                            <div class="stat-label" data-i18n="police_centers">${t('police_centers')}</div>
                            <div class="stat-detail">${activeCenters} <span data-i18n="active">${t('active')}</span></div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-warning">
                        <div class="stat-icon"><i class="fas fa-folder"></i></div>
                        <div class="stat-content">
                            <div class="stat-value">${totalCategories}</div>
                            <div class="stat-label" data-i18n="categories">${t('categories')}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-info">
                        <div class="stat-icon"><i class="fas fa-briefcase"></i></div>
                        <div class="stat-content">
                            <div class="stat-value">${totalCases}</div>
                            <div class="stat-label" data-i18n="total_cases">${t('total_cases')}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Report Sections -->
            <div class="reports-sections">
                <!-- User Reports Section -->
                <div class="report-section">
                    <div class="section-header">
                        <h3><i class="fas fa-users"></i> <span data-i18n="user_reports">${t('user_reports')}</span></h3>
                        <p class="text-muted" data-i18n="user_activity_performance">${t('user_activity_performance')}</p>
                    </div>
                    <div class="section-content">
                        ${renderUserReportsGrid(users)}
                    </div>
                </div>
                
                <!-- Center Reports Section -->
                <div class="report-section">
                    <div class="section-header">
                        <h3><i class="fas fa-building"></i> <span data-i18n="center_reports">${t('center_reports')}</span></h3>
                        <p class="text-muted" data-i18n="center_analytics_performance">${t('center_analytics_performance')}</p>
                    </div>
                    <div class="section-content">
                        ${renderCenterReportsGrid(centers)}
                    </div>
                </div>
                
                <!-- Category Reports Section -->
                <div class="report-section">
                    <div class="section-header">
                        <h3><i class="fas fa-chart-pie"></i> <span data-i18n="category_reports">${t('category_reports')}</span></h3>
                        <p class="text-muted" data-i18n="case_distribution_by_category">${t('case_distribution_by_category')}</p>
                    </div>
                    <div class="section-content">
                        ${renderCategoryReportsGrid(stats.cases_by_category || [])}
                    </div>
                </div>
                
                <!-- Case Reports Section -->
                <div class="report-section">
                    <div class="section-header">
                        <h3><i class="fas fa-chart-line"></i> <span data-i18n="case_reports_analytics">${t('case_reports_analytics')}</span></h3>
                        <p class="text-muted" data-i18n="detailed_case_analytics">${t('detailed_case_analytics')}</p>
                    </div>
                    <div class="section-content">
                        <div class="report-grid">
                            <div class="report-card" style="grid-column: 1 / -1;">
                                <div class="report-card-header">
                                    <div class="report-card-icon" style="color: #3b82f6;">
                                        <i class="fas fa-analytics"></i>
                                    </div>
                                    <div class="report-card-title">
                                        <h4 data-i18n="comprehensive_case_analytics">${t('comprehensive_case_analytics')}</h4>
                                        <p data-i18n="daily_monthly_yearly_reports">${t('daily_monthly_yearly_reports')}</p>
                                    </div>
                                </div>
                                <div class="report-card-actions">
                                    <button class="btn btn-primary" onclick="loadCaseReportsDashboard()">
                                        <i class="fas fa-chart-bar"></i> <span data-i18n="view_analytics">${t('view_analytics')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .reports-dashboard-container { padding: 20px; }
            .page-header { margin-bottom: 30px; }
            .page-header h2 { margin: 0 0 10px 0; }
            
            .stats-overview { margin-bottom: 40px; }
            .stats-overview h3 { margin-bottom: 20px; }
            .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                gap: 20px; 
                margin-bottom: 20px; 
            }
            
            .stat-card { 
                background: white; 
                padding: 20px; 
                border-radius: 10px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                display: flex; 
                align-items: center; 
                gap: 15px;
            }
            .stat-card.stat-primary { border-left: 4px solid #4a90e2; }
            .stat-card.stat-success { border-left: 4px solid #28a745; }
            .stat-card.stat-warning { border-left: 4px solid #ffc107; }
            .stat-card.stat-info { border-left: 4px solid #17a2b8; }
            
            .stat-icon { 
                width: 60px; 
                height: 60px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 24px;
            }
            .stat-card.stat-primary .stat-icon { background: #e3f2fd; color: #4a90e2; }
            .stat-card.stat-success .stat-icon { background: #d4edda; color: #28a745; }
            .stat-card.stat-warning .stat-icon { background: #fff3cd; color: #ffc107; }
            .stat-card.stat-info .stat-icon { background: #d1ecf1; color: #17a2b8; }
            
            .stat-content { flex: 1; }
            .stat-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
            .stat-label { font-size: 14px; color: #6c757d; margin-bottom: 5px; }
            .stat-detail { font-size: 12px; color: #28a745; }
            
            .reports-sections { display: flex; flex-direction: column; gap: 30px; }
            .report-section { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .section-header { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f0f0f0; }
            .section-header h3 { margin: 0 0 8px 0; font-size: 20px; }
            .section-header p { margin: 0; font-size: 14px; }
            
            .report-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
                gap: 20px; 
            }
            
            .report-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                transition: all 0.3s ease;
            }
            .report-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateY(-2px);
            }
            
            .report-card-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 15px;
                padding-bottom: 12px;
                border-bottom: 2px solid #e0e0e0;
            }
            
            .report-card-icon {
                width: 45px;
                height: 45px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .report-card-title {
                flex: 1;
            }
            .report-card-title h4 {
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
            }
            .report-card-title p {
                margin: 0;
                font-size: 12px;
                color: #6c757d;
            }
            
            .report-card-stats {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
            }
            .report-stat {
                text-align: center;
            }
            .report-stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #333;
            }
            .report-stat-label {
                font-size: 11px;
                color: #6c757d;
                text-transform: uppercase;
            }
            
            .report-card-actions {
                display: flex;
                gap: 10px;
            }
            .report-card-actions .btn {
                flex: 1;
                padding: 8px 12px;
                font-size: 13px;
            }
        </style>
    `;
}

/**
 * Render User Reports Grid
 */
function renderUserReportsGrid(users) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!users || users.length === 0) {
        return `<p class="text-muted" data-i18n="no_users_found">${t('no_users_found')}</p>`;
    }
    
    // Group users by role
    const roleGroups = users.reduce((acc, user) => {
        if (!acc[user.role]) acc[user.role] = [];
        acc[user.role].push(user);
        return acc;
    }, {});
    
    let html = '<div class="report-grid">';
    
    // Render cards for each role group
    Object.entries(roleGroups).forEach(([role, roleUsers]) => {
        const activeCount = roleUsers.filter(u => u.is_active).length;
        const inactiveCount = roleUsers.length - activeCount;
        
        html += `
            <div class="report-card">
                <div class="report-card-header">
                    <div class="report-card-icon" style="color: #4a90e2;">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <div class="report-card-title">
                        <h4>${getRoleDisplayName(role)}</h4>
                        <p>${roleUsers.length} <span data-i18n="users">${t('users')}</span></p>
                    </div>
                </div>
                <div class="report-card-stats">
                    <div class="report-stat">
                        <div class="report-stat-value" style="color: #28a745;">${activeCount}</div>
                        <div class="report-stat-label" data-i18n="active">${t('active')}</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-stat-value" style="color: #dc3545;">${inactiveCount}</div>
                        <div class="report-stat-label" data-i18n="inactive">${t('inactive')}</div>
                    </div>
                </div>
                <div class="report-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewRoleUsersReport('${role}')">
                        <i class="fas fa-eye"></i> <span data-i18n="view_details">${t('view_details')}</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * Render Center Reports Grid
 */
function renderCenterReportsGrid(centers) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!centers || centers.length === 0) {
        return `<p class="text-muted" data-i18n="no_centers_found">${t('no_centers_found')}</p>`;
    }
    
    let html = '<div class="report-grid">';
    
    centers.forEach(center => {
        const stats = center.stats || {};
        html += `
            <div class="report-card">
                <div class="report-card-header">
                    <div class="report-card-icon" style="color: #28a745;">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="report-card-title">
                        <h4>${escapeHtml(center.center_name)}</h4>
                        <p>${escapeHtml(center.center_code)} - ${escapeHtml(center.location)}</p>
                    </div>
                </div>
                <div class="report-card-stats">
                    <div class="report-stat">
                        <div class="report-stat-value">${stats.total_users || 0}</div>
                        <div class="report-stat-label" data-i18n="staff">${t('staff')}</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-stat-value">${stats.total_cases || 0}</div>
                        <div class="report-stat-label" data-i18n="cases">${t('cases')}</div>
                    </div>
                </div>
                <div class="report-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewCenterReport(${center.id})">
                        <i class="fas fa-chart-bar"></i> <span data-i18n="view_report">${t('view_report')}</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * Render Category Reports Grid
 */
function renderCategoryReportsGrid(categories) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!categories || categories.length === 0) {
        return `<p class="text-muted" data-i18n="no_categories_found">${t('no_categories_found')}</p>`;
    }
    
    let html = '<div class="report-grid">';
    
    categories.forEach(category => {
        const caseCount = category.count || 0;
        
        // Convert category name to crime_category enum value for filtering
        let enumValue = category.id;
        if (typeof category.id === 'number') {
            // It's a custom category, map to enum
            const simpleName = category.name.toLowerCase().replace(' crimes', '').replace(' related', '').replace(/\s/g, '');
            enumValue = simpleName;
        }
        
        html += `
            <div class="report-card">
                <div class="report-card-header">
                    <div class="report-card-icon" style="color: ${category.color};">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <div class="report-card-title">
                        <h4>${escapeHtml(category.name)}</h4>
                        <p>${escapeHtml(category.description || 'No description')}</p>
                    </div>
                </div>
                <div class="report-card-stats">
                    <div class="report-stat">
                        <div class="report-stat-value">${caseCount}</div>
                        <div class="report-stat-label" data-i18n="cases">${t('cases')}</div>
                    </div>
                </div>
                <div class="report-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewCategoryReport('${enumValue}', '${escapeHtml(category.name)}')">
                        <i class="fas fa-chart-pie"></i> <span data-i18n="view_report">${t('view_report')}</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * View Role Users Report
 */
async function viewRoleUsersReport(role) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('user_report');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const roleUsers = data.data.filter(u => u.role === role);
            content.html(renderRoleUsersDetailReport(role, roleUsers));
        } else {
            content.html(`<div class="alert alert-error">${t('failed_load_report')}</div>`);
        }
    } catch (error) {
        console.error('Error:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render Role Users Detail Report
 */
function renderRoleUsersDetailReport(role, users) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="report-container">
            <div class="report-header">
                <button class="btn btn-secondary" onclick="loadReportsDashboard()">
                    <i class="fas fa-arrow-left"></i> <span data-i18n="back_to_reports">${t('back_to_reports')}</span>
                </button>
                <h2><i class="fas fa-user-shield"></i> ${getRoleDisplayName(role)} - <span data-i18n="detailed_report">${t('detailed_report')}</span></h2>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${users.length}</div>
                        <div class="stat-label" data-i18n="total_users">${t('total_users')}</div>
                    </div>
                </div>
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${users.filter(u => u.is_active).length}</div>
                        <div class="stat-label" data-i18n="active_users">${t('active_users')}</div>
                    </div>
                </div>
                <div class="stat-card stat-warning">
                    <div class="stat-icon"><i class="fas fa-pause-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${users.filter(u => !u.is_active).length}</div>
                        <div class="stat-label" data-i18n="inactive_users">${t('inactive_users')}</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3 data-i18n="user_list">${t('user_list')}</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th data-i18n="name">${t('name')}</th>
                                <th data-i18n="username">${t('username')}</th>
                                <th data-i18n="center">${t('center')}</th>
                                <th data-i18n="status">${t('status')}</th>
                                <th data-i18n="last_login">${t('last_login')}</th>
                                <th data-i18n="actions">${t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td><strong>${escapeHtml(user.full_name)}</strong></td>
                                    <td>${escapeHtml(user.username)}</td>
                                    <td>${escapeHtml(user.center_name || 'N/A')}</td>
                                    <td>${user.is_active ? `<span class="badge badge-success" data-i18n="active">${t('active')}</span>` : `<span class="badge badge-danger" data-i18n="inactive">${t('inactive')}</span>`}</td>
                                    <td>${user.last_login ? formatDateTime(user.last_login) : `<span data-i18n="never">${t('never')}</span>`}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewUserReport(${user.id})">
                                            <i class="fas fa-chart-line"></i> <span data-i18n="view_report">${t('view_report')}</span>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <style>
            .report-container { padding: 20px; }
            .report-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        </style>
    `;
}

/**
 * Helper function to get role display name
 */
function getRoleDisplayName(role) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const roleNames = {
        'super_admin': t('super_admin'),
        'admin': t('admin'),
        'ob_officer': t('ob_officer'),
        'investigator': t('investigator'),
        'court_liaison': t('court_liaison')
    };
    return roleNames[role] || role;
}

/**
 * View Category Report
 */
async function viewCategoryReport(categoryId, categoryName) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('category_report');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/cases?crime_category=${categoryId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            // Use the category details view from case-reports-analytics
            if (typeof renderCategoryDetailsView === 'function') {
                content.html(renderCategoryDetailsView(categoryId, categoryName, data.data || []));
            } else {
                // Fallback to simple list
                content.html(`
                    <div class="report-container">
                        <div class="report-header">
                            <button class="btn btn-secondary" onclick="loadReportsDashboard()">
                                <i class="fas fa-arrow-left"></i> ${t('back')}
                            </button>
                            <h2>${escapeHtml(categoryName)}</h2>
                        </div>
                        <p>${data.data.length} ${t('cases_found')}</p>
                    </div>
                `);
            }
        } else {
            content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
        }
    } catch (error) {
        console.error('Error loading category report:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}
