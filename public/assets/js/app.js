// ============================================
// Main Application Logic
// ============================================

let currentUser = null;

// Initialize application
$(document).ready(async function() {
    // Check authentication
    if (!checkAuth()) {
        return;
    }
    
    // Load user data
    currentUser = getCurrentUser();
    
    if (currentUser) {
        // Wait for language manager to initialize before loading app
        if (window.LanguageManager && !LanguageManager.initialized) {
            await LanguageManager.init();
        }
        initializeApp();
    }
});

// Initialize application
function initializeApp() {
    // Set user name
    $('#userName').text(currentUser.full_name);
    
    // Load navigation based on role
    loadNavigation();
    
    // Load notifications
    loadNotifications();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup URL routing
    setupRouting();
    
    // Load page based on URL or default to dashboard
    loadPageFromURL();
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar toggle with overlay support (both buttons)
    $('#sidebarToggle, #mobileMenuToggle').on('click', function(e) {
        e.stopPropagation();
        $('#sidebar').toggleClass('show');
        
        // Add/remove overlay on mobile
        if (window.innerWidth <= 768) {
            if ($('#sidebar').hasClass('show')) {
                if ($('.sidebar-overlay').length === 0) {
                    $('body').append('<div class="sidebar-overlay"></div>');
                }
                setTimeout(function() {
                    $('.sidebar-overlay').addClass('show');
                }, 10);
            } else {
                $('.sidebar-overlay').removeClass('show');
                setTimeout(function() {
                    $('.sidebar-overlay').remove();
                }, 300);
            }
        }
    });
    
    // Close sidebar when clicking overlay
    $(document).on('click', '.sidebar-overlay', function() {
        $('#sidebar').removeClass('show');
        $('.sidebar-overlay').removeClass('show');
        setTimeout(function() {
            $('.sidebar-overlay').remove();
        }, 300);
    });
    
    // Close sidebar when clicking a nav item on mobile
    $(document).on('click', '.nav-item', function() {
        if (window.innerWidth <= 768) {
            $('#sidebar').removeClass('show');
            $('.sidebar-overlay').removeClass('show');
            setTimeout(function() {
                $('.sidebar-overlay').remove();
            }, 300);
        }
    });
    
    // User dropdown
    $('#userBtn').on('click', function(e) {
        e.stopPropagation();
        $('#userDropdown').toggleClass('show');
    });
    
    // Notification dropdown
    $('#notificationBtn').on('click', function(e) {
        e.stopPropagation();
        $('#notificationDropdown').toggleClass('show');
    });
    
    // Close dropdowns when clicking outside
    $(document).on('click', function() {
        $('.dropdown-menu').removeClass('show');
    });
    
    // Global search
    $('#globalSearch').on('keypress', function(e) {
        if (e.which === 13) {
            performGlobalSearch($(this).val());
        }
    });
    
    // Navigation click handlers
    $(document).on('click', '.nav-item', function(e) {
        e.preventDefault();
        
        // Check if this is a parent item (collapsible group)
        if ($(this).hasClass('nav-item-parent')) {
            const groupId = $(this).data('group');
            const submenu = $(`#submenu-${groupId}`);
            const arrow = $(this).find('.nav-arrow');
            
            // Toggle submenu
            submenu.slideToggle(200);
            arrow.toggleClass('rotated');
            $(this).toggleClass('expanded');
            return;
        }
        
        const page = $(this).data('page');
        
        // Update active state
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        
        // Load the page and update URL
        navigateToPage(page);
    });
}

// Load navigation based on user role
function loadNavigation() {
    const nav = $('#sidebarNav');
    nav.empty();
    
    const role = currentUser.role;
    
    // Common navigation items
    nav.append(createNavItem('dashboard', 'dashboard', 'fas fa-home', true));
    
    // Role-specific navigation
    if (role === USER_ROLES.SUPER_ADMIN) {
        nav.append(createNavItem('users', 'user_management', 'fas fa-users'));
        nav.append(createNavItem('centers', 'police_centers', 'fas fa-building'));
        nav.append(createNavItem('categories', 'categories', 'fas fa-tags'));
        nav.append(createNavItem('audit-logs', 'audit_logs', 'fas fa-clipboard-list'));
        nav.append(createNavItem('reports', 'system_reports', 'fas fa-chart-bar'));
    }
    
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
        // Daily Operations Dashboard - Top priority for admins
        nav.append(createNavItem('daily-operations', 'daily_operations_dashboard', 'fas fa-chart-bar'));
        // Pending cases removed temporarily - not needed for now
        // nav.append(createNavItem('pending-cases', 'pending_approval', 'fas fa-clock'));
        nav.append(createNavItem('case-tracking', 'case_tracking', 'fas fa-tasks'));
        nav.append(createNavItem('all-cases', 'all_cases', 'fas fa-folder-open'));
        nav.append(createNavItem('cases-by-category', 'cases_by_category', 'fas fa-folder-tree'));
        nav.append(createNavItem('assignments', 'assignments', 'fas fa-tasks'));
        nav.append(createNavItem('custody', 'custody_management', 'fas fa-user-lock'));
        nav.append(createNavItem('bailers', 'bailers_management', 'fas fa-handshake'));
        if (role === USER_ROLES.ADMIN) {
            nav.append(createNavItem('categories', 'categories', 'fas fa-tags'));
        }
    }
    
    if (role === USER_ROLES.OB_OFFICER || hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
        nav.append(createNavItem('ob-entry', 'ob_entry', 'fas fa-file-alt'));
        nav.append(createNavItem('incident-entry', 'incident_entry', 'fas fa-exclamation-triangle'));
        nav.append(createNavItem('my-cases', 'my_cases', 'fas fa-briefcase'));
        nav.append(createNavItem('persons', 'persons', 'fas fa-users'));
        nav.append(createNavItem('custody', 'custody_management', 'fas fa-user-lock'));
        nav.append(createNavItem('bailers', 'bailers_management', 'fas fa-handshake'));
    }
    
    if (role === USER_ROLES.INVESTIGATOR || hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
        nav.append(createNavItem('all-cases', 'all_cases', 'fas fa-briefcase'));
        nav.append(createNavItem('investigations', 'my_investigations', 'fas fa-search'));
        nav.append(createNavItem('case-persons', 'case_persons', 'fas fa-user-friends'));
        nav.append(createNavItem('evidence', 'evidence_management', 'fas fa-box'));
        
        // Medical Forms - Collapsible Group
        nav.append(createNavGroup('medical-forms', 'medical_forms', 'fas fa-notes-medical',
            createNavSubItem('medical-examination-form', 'medical_examination_form', 'fas fa-file-medical') +
            createNavSubItem('medical-forms-dashboard', 'medical_forms_dashboard', 'fas fa-chart-line')
        ));
        
        nav.append(createNavItem('solved-cases-dashboard', 'solved_cases_dashboard', 'fas fa-check-double'));
        // TEMPORARILY HIDDEN - Investigator and Court specific solved cases
        // nav.append(createNavItem('investigator-solved-cases', 'investigator_solved_cases', 'fas fa-check-circle'));
        // nav.append(createNavItem('court-solved-cases', 'court_solved_cases', 'fas fa-gavel'));
        if (role === USER_ROLES.INVESTIGATOR) {
            nav.append(createNavItem('report-settings', 'report_settings', 'fas fa-file-image'));
        }
    }
    
    // Reopen Cases - Admin and Super Admin only
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
        nav.append(createNavItem('reopen-cases', 'reopen_cases_management', 'fas fa-folder-open'));
    }
    
    // Reports and Cases by Category - Only for Admin and Super Admin
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
        nav.append(createNavItem('reports', 'case_reports', 'fas fa-file-alt'));
        nav.append(createNavItem('cases-by-category', 'cases_by_category', 'fas fa-folder-tree'));
    }
    
    // Non-Criminal Certificate pages - Only for Admin and Super Admin
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
        nav.append(createNavItem('non-criminal-certificate', 'non_criminal_certificate', 'fas fa-certificate'));
        nav.append(createNavItem('certificates-dashboard', 'certificates_dashboard', 'fas fa-chart-line'));
    }
    
    if (role === USER_ROLES.COURT_USER || hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
        if (role === USER_ROLES.COURT_USER) {
            nav.append(createNavItem('court-dashboard', 'court_dashboard', 'fas fa-tachometer-alt'));
            nav.append(createNavItem('court-cases', 'court_cases', 'fas fa-gavel'));
        }
    }
}

// Create navigation item
function createNavItem(id, translationKey, icon, active = false) {
    const text = window.LanguageManager ? LanguageManager.t(translationKey) : translationKey;
    return `
        <a href="#" class="nav-item ${active ? 'active' : ''}" data-page="${id}" data-i18n="${translationKey}">
            <i class="${icon}"></i>
            <span>${text}</span>
        </a>
    `;
}

// Create collapsible navigation group
function createNavGroup(id, translationKey, icon, children) {
    const text = window.LanguageManager ? LanguageManager.t(translationKey) : translationKey;
    return `
        <div class="nav-group">
            <a href="#" class="nav-item nav-item-parent" data-group="${id}" data-i18n="${translationKey}">
                <i class="${icon}"></i>
                <span>${text}</span>
                <i class="fas fa-chevron-down nav-arrow"></i>
            </a>
            <div class="nav-submenu" id="submenu-${id}">
                ${children}
            </div>
        </div>
    `;
}

// Create submenu item
function createNavSubItem(id, translationKey, icon) {
    const text = window.LanguageManager ? LanguageManager.t(translationKey) : translationKey;
    return `
        <a href="#" class="nav-item nav-item-child" data-page="${id}" data-i18n="${translationKey}">
            <i class="${icon}"></i>
            <span>${text}</span>
        </a>
    `;
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await commonAPI.getNotifications();
        
        if (response.status === 'success') {
            const notifications = response.data;
            const unreadCount = notifications.filter(n => !n.is_read).length;
            
            // Update badge
            $('#notificationBadge').text(unreadCount);
            
            // Update notification list
            const list = $('#notificationList');
            list.empty();
            
            if (notifications.length === 0) {
                const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
                list.append(`<div class="dropdown-item" data-i18n="no_notifications">${t('no_notifications')}</div>`);
            } else {
                notifications.slice(0, 10).forEach(notification => {
                    list.append(createNotificationItem(notification));
                });
            }
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

// Create notification item
function createNotificationItem(notification) {
    return `
        <a href="#" class="dropdown-item ${notification.is_read ? '' : 'unread'}" 
           onclick="handleNotificationClick(${notification.id}, '${notification.link_entity_type}', ${notification.link_entity_id})">
            <strong>${notification.title}</strong><br>
            <small>${notification.message}</small>
        </a>
    `;
}

// Handle notification click
async function handleNotificationClick(notificationId, entityType, entityId) {
    try {
        await commonAPI.markNotificationRead(notificationId);
        
        // Navigate to relevant page
        if (entityType === 'cases') {
            loadCaseDetails(entityId);
        }
        
        // Reload notifications
        loadNotifications();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

// Translation helper for dynamic content
function t(key, params = {}) {
    if (window.LanguageManager && typeof LanguageManager.t === 'function') {
        return LanguageManager.t(key, params);
    }
    return key;
}

// Load dashboard
async function loadDashboard() {
    $('#pageTitle').text(t('dashboard'));
    const content = $('#pageContent');
    content.html(`<div class="loading">${t('loading_dashboard')}</div>`);
    
    try {
        const role = currentUser.role;
        
        console.log('ðŸ” Loading dashboard for role:', role);
        console.log('ðŸ” Enhanced dashboard available:', typeof renderInvestigatorDashboard);
        
        // Use enhanced investigator dashboard if available
        if (role === 'investigator' && typeof renderInvestigatorDashboard === 'function') {
            console.log('âœ… Loading ENHANCED investigator dashboard');
            const html = await renderInvestigatorDashboard();
            content.html(html);
        } else {
            console.log('âš ï¸ Loading OLD dashboard for role:', role);
            const response = await commonAPI.getDashboard();
            
            if (response.status === 'success') {
                const data = response.data;
                
                if (role === 'investigator') {
                    content.html(renderInvestigatorDashboardOld(data));
                } else if (role === 'ob_officer') {
                    content.html(renderOBOfficerDashboard(data));
                } else if (role === 'admin' || role === 'super_admin') {
                    content.html(renderAdminDashboard(data));
                } else {
                    content.html(renderDefaultDashboard(data));
                }
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        content.html(`<div class="alert alert-error" data-i18n="failed_load_dashboard">${t('failed_load_dashboard')}</div>`);
    }
}

// Render Investigator Dashboard (Old version - fallback)
function renderInvestigatorDashboardOld(data) {
    const stats = data.stats || {};
    const recentCases = data.recent_cases || [];
    const casesByStatus = data.cases_by_status || {};
    
    return `
        <div class="investigator-dashboard">
            <!-- Welcome Header -->
            <div class="dashboard-header">
                <div class="welcome-section">
                    <h1 data-i18n="investigator_dashboard"><i class="fas fa-search"></i> ${t('investigator_dashboard')}</h1>
                    <p data-i18n="welcome_back_user">${t('welcome_back_user').replace('{name}', currentUser.full_name || currentUser.username)}</p>
                    <p class="timestamp" data-i18n="last_updated">${t('last_updated')}: ${new Date().toLocaleString()}</p>
                </div>
            </div>
            
            <!-- Statistics Cards -->
            <div class="stats-grid">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-folder-open"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.assigned_cases || 0}</div>
                        <div class="stat-label" data-i18n="active_investigations_count">${t('active_investigations_count')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.completed_cases || 0}</div>
                        <div class="stat-label" data-i18n="completed_cases">${t('completed_cases')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-warning">
                    <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.pending_reports || 0}</div>
                        <div class="stat-label" data-i18n="reports_pending">${t('reports_pending')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${(stats.assigned_cases || 0) + (stats.completed_cases || 0)}</div>
                        <div class="stat-label" data-i18n="total_assigned">${t('total_assigned')}</div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Cases & Activities -->
            <div class="dashboard-content">
                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 data-i18n="my_active_investigations"><i class="fas fa-briefcase"></i> ${t('my_active_investigations')}</h2>
                        <a href="#" onclick="loadPage('investigations'); return false;" class="btn btn-sm btn-primary" data-i18n="view_all">
                            ${t('view_all')}
                        </a>
                    </div>
                    <div class="cases-table">
                        ${renderInvestigatorCasesTable(recentCases)}
                    </div>
                </div>
                
                <div class="dashboard-sidebar">
                    <div class="sidebar-section">
                        <h3 data-i18n="case_status_overview"><i class="fas fa-chart-pie"></i> ${t('case_status_overview')}</h3>
                        <div class="status-breakdown">
                            ${renderStatusBreakdown(casesByStatus)}
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3 data-i18n="quick_actions"><i class="fas fa-tasks"></i> ${t('quick_actions')}</h3>
                        <div class="quick-actions">
                            <button class="action-btn" onclick="loadPage('investigations')" data-i18n="view_investigations">
                                <i class="fas fa-search"></i> ${t('view_investigations')}
                            </button>
                            <button class="action-btn" onclick="loadPage('evidence')" data-i18n="manage_evidence">
                                <i class="fas fa-box"></i> ${t('manage_evidence')}
                            </button>
                            <button class="action-btn" onclick="loadPage('reports')" data-i18n="generate_report">
                                <i class="fas fa-file-alt"></i> ${t('generate_report')}
                            </button>
                            <button class="action-btn" onclick="loadPage('cases-by-category')" data-i18n="browse_by_category">
                                <i class="fas fa-folder-tree"></i> ${t('browse_by_category')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .investigator-dashboard { padding: 20px; max-width: 1400px; margin: 0 auto; }
            
            .dashboard-header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .welcome-section h1 { margin: 0 0 10px 0; font-size: 32px; font-weight: 700; }
            .welcome-section p { margin: 5px 0; opacity: 0.95; }
            .timestamp { font-size: 13px; opacity: 0.8; margin-top: 10px !important; }
            
            .stats-grid { 
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                border-radius: 12px;
                padding: 25px;
                display: flex;
                align-items: center;
                gap: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            }
            
            .stat-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
            }
            
            .stat-primary .stat-icon { background: #e0e7ff; color: #667eea; }
            .stat-success .stat-icon { background: #d1fae5; color: #10b981; }
            .stat-warning .stat-icon { background: #fef3c7; color: #f59e0b; }
            .stat-info .stat-icon { background: #dbeafe; color: #3b82f6; }
            
            .stat-content { flex: 1; }
            .stat-value { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 5px; }
            .stat-label { font-size: 14px; color: #6b7280; font-weight: 500; }
            
            .dashboard-content {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 30px;
            }
            
            @media (max-width: 1024px) {
                .dashboard-content { grid-template-columns: 1fr; }
            }
            
            .dashboard-section, .sidebar-section {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .section-header h2 {
                margin: 0;
                font-size: 20px;
                color: #111827;
                font-weight: 600;
            }
            
            .sidebar-section { margin-bottom: 20px; }
            .sidebar-section h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
                color: #374151;
                font-weight: 600;
            }
            
            .quick-actions { display: flex; flex-direction: column; gap: 10px; }
            .action-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
            }
            
            .action-btn i { font-size: 16px; }
            
            .status-breakdown { display: flex; flex-direction: column; gap: 12px; }
            .status-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f9fafb;
                border-radius: 6px;
            }
            
            .status-item-label { font-size: 14px; color: #374151; font-weight: 500; }
            .status-item-count {
                background: #667eea;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
            }
        </style>
    `;
}

function renderInvestigatorCasesTable(cases) {
    if (!cases || cases.length === 0) {
        return `
            <div style="text-align: center; padding: 60px; color: #6b7280;">
                <i class="fas fa-folder-open" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
                <h3 data-i18n="no_active_investigations">${t('no_active_investigations')}</h3>
                <p data-i18n="no_cases_assigned">${t('no_cases_assigned')}</p>
            </div>
        `;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th data-i18n="case_number">${t('case_number')}</th>
                    <th data-i18n="case_type">${t('case_type')}</th>
                    <th data-i18n="status">${t('status')}</th>
                    <th data-i18n="priority">${t('priority')}</th>
                    <th data-i18n="date_assigned">${t('date_assigned')}</th>
                    <th data-i18n="actions">${t('actions')}</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    cases.forEach(caseItem => {
        html += `
            <tr>
                <td><strong>${caseItem.case_number || 'N/A'}</strong></td>
                <td>${caseItem.crime_type || 'N/A'}</td>
                <td>${getStatusBadge(caseItem.status)}</td>
                <td>${getPriorityBadge(caseItem.priority || 'medium')}</td>
                <td>${formatDateOnly(caseItem.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCase(${caseItem.id})" data-i18n="view">
                        <i class="fas fa-eye"></i> ${t('view')}
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

function renderStatusBreakdown(statusData) {
    const statusLabels = {
        'assigned': t('assigned'),
        'investigating': t('investigating'),
        'pending_report': t('pending_report'),
        'report_submitted': t('report_submitted'),
        'completed': t('completed')
    };
    
    let html = '';
    for (let [status, count] of Object.entries(statusData)) {
        html += `
            <div class="status-item">
                <span class="status-item-label" data-i18n="${status}">${statusLabels[status] || status}</span>
                <span class="status-item-count">${count}</span>
            </div>
        `;
    }
    
    if (html === '') {
        html = `<p style="text-align: center; color: #6b7280;" data-i18n="no_data_available">${t('no_data_available')}</p>`;
    }
    
    return html;
}

// Render OB Officer Dashboard
function renderOBOfficerDashboard(data) {
    const stats = data.stats || {};
    const recentCases = data.recent_cases || [];
    const casesByStatus = data.cases_by_status || {};
    
    return `
        <div class="ob-officer-dashboard">
            <!-- Welcome Header -->
            <div class="dashboard-header">
                <div class="welcome-section">
                    <h1 data-i18n="ob_officer_dashboard"><i class="fas fa-file-alt"></i> ${t('ob_officer_dashboard')}</h1>
                    <p data-i18n="welcome_back_user">${t('welcome_back_user').replace('{name}', currentUser.full_name || currentUser.username)}</p>
                    <p class="timestamp" data-i18n="last_updated">${t('last_updated')}: ${new Date().toLocaleString()}</p>
                </div>
            </div>
            
            <!-- Statistics Cards -->
            <div class="stats-grid">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.my_cases || 0}</div>
                        <div class="stat-label" data-i18n="my_cases">${t('my_cases')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.submitted_cases || 0}</div>
                        <div class="stat-label" data-i18n="submitted_cases">${t('submitted_cases')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-warning">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.pending_approval || 0}</div>
                        <div class="stat-label" data-i18n="pending_approval_count">${t('pending_approval_count')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-danger">
                    <div class="stat-icon"><i class="fas fa-user-lock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.in_custody || 0}</div>
                        <div class="stat-label" data-i18n="in_custody">${t('in_custody')}</div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Cases & Quick Actions -->
            <div class="dashboard-content">
                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 data-i18n="my_recent_cases"><i class="fas fa-briefcase"></i> ${t('my_recent_cases')}</h2>
                        <a href="#" onclick="loadPage('my-cases'); return false;" class="btn btn-sm btn-primary" data-i18n="view_all">
                            ${t('view_all')}
                        </a>
                    </div>
                    <div class="cases-table">
                        ${renderOBOfficerCasesTable(recentCases)}
                    </div>
                </div>
                
                <div class="dashboard-sidebar">
                    <div class="sidebar-section">
                        <h3 data-i18n="case_status_overview"><i class="fas fa-chart-pie"></i> ${t('case_status_overview')}</h3>
                        <div class="status-breakdown">
                            ${renderStatusBreakdown(casesByStatus)}
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3 data-i18n="quick_actions"><i class="fas fa-tasks"></i> ${t('quick_actions')}</h3>
                        <div class="quick-actions">
                            <button class="action-btn" onclick="loadPage('ob-entry')" data-i18n="create_new_ob_entry">
                                <i class="fas fa-file-alt"></i> ${t('create_new_ob_entry')}
                            </button>
                            <button class="action-btn" onclick="loadPage('my-cases')" data-i18n="view_my_cases">
                                <i class="fas fa-briefcase"></i> ${t('view_my_cases')}
                            </button>
                            <button class="action-btn" onclick="loadPage('persons')" data-i18n="manage_persons">
                                <i class="fas fa-users"></i> ${t('manage_persons')}
                            </button>
                            <button class="action-btn" onclick="loadPage('custody')" data-i18n="custody_management">
                                <i class="fas fa-user-lock"></i> ${t('custody_management')}
                            </button>
                            <button class="action-btn" onclick="loadPage('cases-by-category')" data-i18n="browse_by_category">
                                <i class="fas fa-folder-tree"></i> ${t('browse_by_category')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .ob-officer-dashboard { padding: 20px; max-width: 1400px; margin: 0 auto; }
            
            .dashboard-header { 
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .welcome-section h1 { margin: 0 0 10px 0; font-size: 32px; font-weight: 700; }
            .welcome-section p { margin: 5px 0; opacity: 0.95; }
            .timestamp { font-size: 13px; opacity: 0.8; margin-top: 10px !important; }
            
            .stats-grid { 
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                border-radius: 12px;
                padding: 25px;
                display: flex;
                align-items: center;
                gap: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            }
            
            .stat-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
            }
            
            .stat-primary .stat-icon { background: #dbeafe; color: #3b82f6; }
            .stat-success .stat-icon { background: #d1fae5; color: #10b981; }
            .stat-warning .stat-icon { background: #fef3c7; color: #f59e0b; }
            .stat-danger .stat-icon { background: #fee2e2; color: #ef4444; }
            .stat-info .stat-icon { background: #e0e7ff; color: #667eea; }
            
            .stat-content { flex: 1; }
            .stat-value { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 5px; }
            .stat-label { font-size: 14px; color: #6b7280; font-weight: 500; }
            
            .dashboard-content {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 30px;
            }
            
            @media (max-width: 1024px) {
                .dashboard-content { grid-template-columns: 1fr; }
            }
            
            .dashboard-section, .sidebar-section {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .section-header h2 {
                margin: 0;
                font-size: 20px;
                color: #111827;
                font-weight: 600;
            }
            
            .sidebar-section { margin-bottom: 20px; }
            .sidebar-section h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
                color: #374151;
                font-weight: 600;
            }
            
            .quick-actions { display: flex; flex-direction: column; gap: 10px; }
            .action-btn {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
            }
            
            .action-btn i { font-size: 16px; }
            
            .status-breakdown { display: flex; flex-direction: column; gap: 12px; }
            .status-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f9fafb;
                border-radius: 6px;
            }
            
            .status-item-label { font-size: 14px; color: #374151; font-weight: 500; }
            .status-item-count {
                background: #10b981;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
            }
        </style>
    `;
}

function renderOBOfficerCasesTable(cases) {
    if (!cases || cases.length === 0) {
        return `
            <div style="text-align: center; padding: 60px; color: #6b7280;">
                <i class="fas fa-folder-open" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
                <h3 data-i18n="no_cases_yet">${t('no_cases_yet')}</h3>
                <p>${t('no_cases_assigned')}. ${t('click_to_get_started')}.</p>
            </div>
        `;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th data-i18n="case_number">${t('case_number')}</th>
                    <th data-i18n="crime_type">${t('crime_type')}</th>
                    <th data-i18n="status">${t('status')}</th>
                    <th data-i18n="priority">${t('priority')}</th>
                    <th data-i18n="date_created">${t('date_created')}</th>
                    <th data-i18n="actions">${t('actions')}</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    cases.forEach(caseItem => {
        html += `
            <tr>
                <td><strong>${caseItem.case_number || 'N/A'}</strong></td>
                <td>${caseItem.crime_type || 'N/A'}</td>
                <td>${getStatusBadge(caseItem.status)}</td>
                <td>${getPriorityBadge(caseItem.priority || 'medium')}</td>
                <td>${formatDateOnly(caseItem.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCaseDetails(${caseItem.id})" data-i18n="view">
                        <i class="fas fa-eye"></i> ${t('view')}
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

function renderAdminDashboard(data) {
    const stats = data.stats || {};
    const recentCases = data.recent_cases || [];
    const casesByStatus = data.cases_by_status || {};
    
    return `
        <div class="admin-dashboard">
            <!-- Welcome Header -->
            <div class="dashboard-header">
                <div class="welcome-section">
                    <h1 data-i18n="admin_dashboard"><i class="fas fa-tachometer-alt"></i> ${t('admin_dashboard')}</h1>
                    <p data-i18n="welcome_back_user">${t('welcome_back_user').replace('{name}', currentUser.full_name || currentUser.username)}</p>
                    <p class="timestamp" data-i18n="last_updated">${t('last_updated')}: ${new Date().toLocaleString()}</p>
                </div>
            </div>
            
            <!-- Statistics Cards -->
            <div class="stats-grid">
                ${currentUser.role === 'super_admin' ? `
                    <div class="stat-card stat-primary">
                        <div class="stat-icon"><i class="fas fa-building"></i></div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.total_centers || 0}</div>
                            <div class="stat-label" data-i18n="police_centers">${t('police_centers')}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-success">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.total_users || 0}</div>
                            <div class="stat-label" data-i18n="total_users">${t('total_users')}</div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total_cases || 0}</div>
                        <div class="stat-label" data-i18n="total_cases">${t('total_cases')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-warning">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.pending_approval || 0}</div>
                        <div class="stat-label" data-i18n="pending_approval_count">${t('pending_approval_count')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-search"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.active_cases || 0}</div>
                        <div class="stat-label" data-i18n="active_investigations_count">${t('active_investigations_count')}</div>
                    </div>
                </div>
                
                <div class="stat-card stat-danger">
                    <div class="stat-icon"><i class="fas fa-user-lock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.in_custody || 0}</div>
                        <div class="stat-label" data-i18n="in_custody_count">${t('in_custody_count')}</div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Cases & Quick Actions -->
            <div class="dashboard-content">
                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 data-i18n="recent_cases"><i class="fas fa-briefcase"></i> ${t('recent_cases')}</h2>
                        <a href="#" onclick="loadPage('all-cases'); return false;" class="btn btn-sm btn-primary" data-i18n="view_all">
                            ${t('view_all')}
                        </a>
                    </div>
                    <div class="cases-table">
                        ${renderAdminCasesTable(recentCases)}
                    </div>
                </div>
                
                <div class="dashboard-sidebar">
                    <div class="sidebar-section">
                        <h3 data-i18n="case_status_overview"><i class="fas fa-chart-pie"></i> ${t('case_status_overview')}</h3>
                        <div class="status-breakdown">
                            ${renderStatusBreakdown(casesByStatus)}
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3 data-i18n="quick_actions"><i class="fas fa-tasks"></i> ${t('quick_actions')}</h3>
                        <div class="quick-actions">
                            ${currentUser.role === 'super_admin' ? `
                                <button class="action-btn" onclick="loadPage('users')" data-i18n="manage_users">
                                    <i class="fas fa-users"></i> ${t('manage_users')}
                                </button>
                                <button class="action-btn" onclick="loadPage('centers')" data-i18n="manage_centers">
                                    <i class="fas fa-building"></i> ${t('manage_centers')}
                                </button>
                            ` : ''}
                            <button class="action-btn" onclick="loadPage('pending-cases')" data-i18n="review_pending_cases">
                                <i class="fas fa-clock"></i> ${t('review_pending_cases')}
                            </button>
                            <button class="action-btn" onclick="loadPage('all-cases')" data-i18n="view_all_cases">
                                <i class="fas fa-folder-open"></i> ${t('view_all_cases')}
                            </button>
                            <button class="action-btn" onclick="loadPage('assignments')" data-i18n="manage_assignments">
                                <i class="fas fa-tasks"></i> ${t('manage_assignments')}
                            </button>
                            <button class="action-btn" onclick="loadPage('custody')" data-i18n="custody_management">
                                <i class="fas fa-user-lock"></i> ${t('custody_management')}
                            </button>
                            <button class="action-btn" onclick="loadPage('categories')" data-i18n="manage_categories">
                                <i class="fas fa-tags"></i> ${t('manage_categories')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .admin-dashboard { padding: 20px; max-width: 1400px; margin: 0 auto; }
            
            .dashboard-header { 
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .welcome-section h1 { margin: 0 0 10px 0; font-size: 32px; font-weight: 700; }
            .welcome-section p { margin: 5px 0; opacity: 0.95; }
            .timestamp { font-size: 13px; opacity: 0.8; margin-top: 10px !important; }
            
            .stats-grid { 
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                border-radius: 12px;
                padding: 25px;
                display: flex;
                align-items: center;
                gap: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            }
            
            .stat-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
            }
            
            .stat-primary .stat-icon { background: #dbeafe; color: #3b82f6; }
            .stat-success .stat-icon { background: #d1fae5; color: #10b981; }
            .stat-warning .stat-icon { background: #fef3c7; color: #f59e0b; }
            .stat-danger .stat-icon { background: #fee2e2; color: #ef4444; }
            .stat-info .stat-icon { background: #e0e7ff; color: #667eea; }
            
            .stat-content { flex: 1; }
            .stat-value { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 5px; }
            .stat-label { font-size: 14px; color: #6b7280; font-weight: 500; }
            
            .dashboard-content {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 30px;
            }
            
            @media (max-width: 1024px) {
                .dashboard-content { grid-template-columns: 1fr; }
            }
            
            .dashboard-section, .sidebar-section {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .section-header h2 {
                margin: 0;
                font-size: 20px;
                color: #111827;
                font-weight: 600;
            }
            
            .sidebar-section { margin-bottom: 20px; }
            .sidebar-section h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
                color: #374151;
                font-weight: 600;
            }
            
            .quick-actions { display: flex; flex-direction: column; gap: 10px; }
            .action-btn {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
            }
            
            .action-btn i { font-size: 16px; }
            
            .status-breakdown { display: flex; flex-direction: column; gap: 12px; }
            .status-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f9fafb;
                border-radius: 6px;
            }
            
            .status-item-label { font-size: 14px; color: #374151; font-weight: 500; }
            .status-item-count {
                background: #3b82f6;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
            }
        </style>
    `;
}

function renderAdminCasesTable(cases) {
    if (!cases || cases.length === 0) {
        return `
            <div style="text-align: center; padding: 60px; color: #6b7280;">
                <i class="fas fa-folder-open" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
                <h3>No Cases Yet</h3>
                <p>No cases have been created in your center yet.</p>
            </div>
        `;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Case Number</th>
                    <th>Crime Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    cases.forEach(caseItem => {
        html += `
            <tr>
                <td><strong>${caseItem.case_number || 'N/A'}</strong></td>
                <td>${caseItem.crime_type || 'N/A'}</td>
                <td>${getStatusBadge(caseItem.status)}</td>
                <td>${getPriorityBadge(caseItem.priority || 'medium')}</td>
                <td>${caseItem.created_by_name || 'N/A'}</td>
                <td>${formatDateOnly(caseItem.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCaseDetails(${caseItem.id})" data-i18n="view">
                        <i class="fas fa-eye"></i> ${t('view')}
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

function renderDefaultDashboard(data) {
    return `<div class="alert alert-info" data-i18n="dashboard_under_construction">${t('dashboard_under_construction')}</div>`;
}

// ============================================
// Case Persons Page (Investigator)
// ============================================

async function loadCasePersonsPage() {
    setPageTitle('case_persons');
    const content = $('#pageContent');
    content.html(`
        <div class="loading-dashboard">
            <div class="loading-spinner"></div>
            <p>${t('loading')}...</p>
        </div>
    `);
    
    try {
        const response = await investigationAPI.getCasePersons();
        
        if (response.status === 'success') {
            renderCasePersonsPage(response.data);
        } else {
            content.html(`
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${t('no_data_available')}
                </div>
            `);
        }
    } catch (error) {
        console.error('Failed to load case persons:', error);
        content.html(`
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                ${t('failed_to_load_persons')}: ${error.message}
            </div>
        `);
    }
}

// NEW PROFESSIONAL CASE PERSONS PAGE
function renderCasePersonsPage(persons) {
    const content = $('#pageContent');
    
    // Calculate statistics
    const stats = {
        total: persons.length,
        accused: persons.filter(p => p.roles && p.roles.includes('accused')).length,
        accuser: persons.filter(p => p.roles && p.roles.includes('accuser')).length,
        witness: persons.filter(p => p.roles && p.roles.includes('witness')).length,
        inCustody: persons.filter(p => p.custody_status === 'in_custody').length,
        bailed: persons.filter(p => p.custody_status === 'bailed').length,
        repeatOffenders: persons.filter(p => (p.criminal_history_count || 0) > 0).length
    };
    
    content.html(`
        <div class="case-persons-page container-fluid">
            <!-- Header -->
            <div class="page-header">
                <div class="header-content">
                    <h1><i class="fas fa-user-friends"></i> ${t('case_persons')}</h1>
                    <p class="subtitle">${t('all_persons_in_your_cases')}</p>
                </div>
            </div>
            
            <!-- Statistics Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stats-card bg-primary text-white">
                        <div class="stats-label">${t('total_persons')}</div>
                        <div class="stats-number">${stats.total}</div>
                        <i class="fas fa-users stats-icon"></i>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-danger text-white">
                        <div class="stats-label">${t('accused')}</div>
                        <div class="stats-number">${stats.accused}</div>
                        <i class="fas fa-user-shield stats-icon"></i>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-success text-white">
                        <div class="stats-label">${t('accusers')}</div>
                        <div class="stats-number">${stats.accuser}</div>
                        <i class="fas fa-user-injured stats-icon"></i>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-info text-white">
                        <div class="stats-label">${t('witnesses')}</div>
                        <div class="stats-number">${stats.witness}</div>
                        <i class="fas fa-user-friends stats-icon"></i>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-warning text-white">
                        <div class="stats-label">${t('in_custody')}</div>
                        <div class="stats-number">${stats.inCustody}</div>
                        <i class="fas fa-user-lock stats-icon"></i>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-secondary text-white">
                        <div class="stats-label">${t('bailed')}</div>
                        <div class="stats-number">${stats.bailed}</div>
                        <i class="fas fa-handshake stats-icon"></i>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card" style="background: #6f42c1; color: white;">
                        <div class="stats-label">${t('repeat_offenders')}</div>
                        <div class="stats-number">${stats.repeatOffenders}</div>
                        <i class="fas fa-exclamation-triangle stats-icon"></i>
                    </div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <input type="text" id="personSearch" class="form-control" placeholder="${t('search_by_name')}" />
                        </div>
                        <div class="col-md-3">
                            <select id="roleFilter" class="form-control">
                                <option value="">${t('all_roles')}</option>
                                <option value="accused">${t('accused')}</option>
                                <option value="accuser">${t('accuser')}</option>
                                <option value="witness">${t('witness')}</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select id="custodyFilter" class="form-control">
                                <option value="">${t('all_custody_status')}</option>
                                <option value="in_custody">${t('in_custody')}</option>
                                <option value="bailed">${t('bailed')}</option>
                                <option value="none">${t('not_in_custody')}</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-secondary btn-block" onclick="clearPersonFilters()">
                                <i class="fas fa-times"></i> ${t('clear')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Persons Table -->
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="personsTable">
                            <thead>
                                <tr>
                                    <th>${t('photo')}</th>
                                    <th>${t('name')}</th>
                                    <th>${t('national_id')}</th>
                                    <th>${t('phone')}</th>
                                    <th>${t('roles')}</th>
                                    <th>${t('cases')}</th>
                                    <th>${t('custody_status')}</th>
                                    <th>${t('history')}</th>
                                    <th>${t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${persons.map(person => renderPersonRow(person)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .case-persons-page {
                padding: 20px;
                max-width: 1600px;
                margin: 0 auto;
            }
            
            .page-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .page-header h1 {
                margin: 0 0 5px 0;
                font-size: 28px;
                font-weight: 700;
            }
            
            .page-header .subtitle {
                margin: 0;
                opacity: 0.9;
                font-size: 14px;
            }
            
            .stats-card {
                padding: 20px;
                border-radius: 12px;
                position: relative;
                overflow: hidden;
                margin-bottom: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s;
            }
            
            .stats-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            
            .stats-label {
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                opacity: 0.9;
                margin-bottom: 5px;
            }
            
            .stats-number {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 0;
            }
            
            .stats-icon {
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 40px;
                opacity: 0.2;
            }
            
            .person-photo {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #e5e7eb;
            }
            
            .person-photo-placeholder {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: #6b7280;
            }
            
            .role-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                margin-right: 4px;
                margin-bottom: 4px;
            }
            
            .role-accused { background: #fee2e2; color: #dc2626; }
            .role-accuser { background: #d1fae5; color: #059669; }
            .role-witness { background: #dbeafe; color: #2563eb; }
            
            .custody-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .custody-in_custody { background: #fee2e2; color: #dc2626; }
            .custody-bailed { background: #fef3c7; color: #d97706; }
            .custody-free { background: #d1fae5; color: #059669; }
            
            .history-badge {
                background: #f3f4f6;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                color: #374151;
            }
            
            .history-badge.repeat-offender {
                background: #fef3c7;
                color: #d97706;
            }
        </style>
    `);
    
    // Initialize DataTable
    setTimeout(() => {
        if ($.fn.DataTable) {
            $('#personsTable').DataTable({
                order: [[1, 'asc']],
                pageLength: 25,
                responsive: true,
                language: {
                    search: t('search') + ':',
                    lengthMenu: t('show') + ' _MENU_ ' + t('entries'),
                    info: t('showing') + ' _START_ ' + t('to') + ' _END_ ' + t('of') + ' _TOTAL_ ' + t('entries'),
                    paginate: {
                        first: t('first'),
                        last: t('last'),
                        next: t('next'),
                        previous: t('previous')
                    }
                }
            });
        }
    }, 100);
    
    // Setup filters
    $('#personSearch, #roleFilter, #custodyFilter').on('change keyup', filterPersonsTable);
}

function renderPersonRow(person) {
    const fullName = `${person.first_name || ''} ${person.middle_name || ''} ${person.last_name || ''}`.trim();
    const roles = (person.roles || '').split(',').filter(r => r);
    const custodyStatus = person.custody_status || 'none';
    const criminalHistory = person.criminal_history_count || 0;
    
    return `
        <tr>
            <td>
                ${person.photo_path 
                    ? `<img src="${person.photo_path}" class="person-photo" alt="${fullName}">` 
                    : `<div class="person-photo-placeholder"><i class="fas fa-user"></i></div>`
                }
            </td>
            <td>
                <strong>${fullName || 'N/A'}</strong>
            </td>
            <td>${person.national_id || '-'}</td>
            <td>${person.phone || '-'}</td>
            <td>
                ${roles.map(role => `<span class="role-badge role-${role.trim()}">${t(role.trim())}</span>`).join('')}
            </td>
            <td>
                <span class="badge badge-primary">${person.investigator_cases || 0} ${t('cases')}</span>
            </td>
            <td>
                ${renderCustodyBadge(custodyStatus)}
            </td>
            <td>
                ${criminalHistory > 0 
                    ? `<span class="history-badge repeat-offender">${criminalHistory} ${t('past_cases')}</span>`
                    : `<span class="history-badge">${t('no_history')}</span>`
                }
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewPersonDetails(${person.id})">
                    <i class="fas fa-eye"></i> ${t('view')}
                </button>
            </td>
        </tr>
    `;
}

function renderCustodyBadge(status) {
    if (status === 'in_custody') {
        return `<span class="custody-badge custody-in_custody"><i class="fas fa-lock"></i> ${t('in_custody')}</span>`;
    } else if (status === 'bailed') {
        return `<span class="custody-badge custody-bailed"><i class="fas fa-handshake"></i> ${t('bailed')}</span>`;
    } else {
        return `<span class="custody-badge custody-free"><i class="fas fa-check"></i> ${t('free')}</span>`;
    }
}

function filterPersonsTable() {
    const search = $('#personSearch').val().toLowerCase();
    const roleFilter = $('#roleFilter').val();
    const custodyFilter = $('#custodyFilter').val();
    
    if ($.fn.DataTable && $.fn.DataTable.isDataTable('#personsTable')) {
        const table = $('#personsTable').DataTable();
        
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            const name = data[1].toLowerCase();
            const nationalId = data[2].toLowerCase();
            const phone = data[3].toLowerCase();
            const roles = data[4].toLowerCase();
            const custody = data[6].toLowerCase();
            
            const matchesSearch = !search || name.includes(search) || nationalId.includes(search) || phone.includes(search);
            const matchesRole = !roleFilter || roles.includes(roleFilter);
            const matchesCustody = !custodyFilter || custody.includes(custodyFilter);
            
            return matchesSearch && matchesRole && matchesCustody;
        });
        
        table.draw();
        $.fn.dataTable.ext.search.pop();
    }
}

function clearPersonFilters() {
    $('#personSearch').val('');
    $('#roleFilter').val('');
    $('#custodyFilter').val('');
    filterPersonsTable();
}

async function viewPersonDetails(personId) {
    try {
        const response = await api.get(`/investigation/persons/${personId}`);
        
        if (response.status === 'success') {
            const person = response.data;
            showPersonDetailsModal(person);
        }
    } catch (error) {
        console.error('Failed to load person details:', error);
        showToast(t('failed_to_load_person_details'), 'error');
    }
}

function showPersonDetailsModal(person) {
    const fullName = `${person.first_name || ''} ${person.middle_name || ''} ${person.last_name || ''}`.trim();
    
    Swal.fire({
        title: `<i class="fas fa-user"></i> ${fullName}`,
        html: `
            <div style="text-align: left;">
                <h5>${t('personal_information')}</h5>
                <p><strong>${t('national_id')}:</strong> ${person.national_id || 'N/A'}</p>
                <p><strong>${t('phone')}:</strong> ${person.phone || 'N/A'}</p>
                <p><strong>${t('date_of_birth')}:</strong> ${person.date_of_birth || 'N/A'}</p>
                <p><strong>${t('address')}:</strong> ${person.address || 'N/A'}</p>
                
                <h5 class="mt-3">${t('case_involvement')}</h5>
                <p><strong>${t('total_cases')}:</strong> ${person.cases ? person.cases.length : 0}</p>
                
                <h5 class="mt-3">${t('criminal_history')}</h5>
                <p>${person.criminal_history && person.criminal_history.length > 0 
                    ? person.criminal_history.length + ' ' + t('past_cases')
                    : t('no_criminal_history')
                }</p>
            </div>
        `,
        width: 600,
        showCloseButton: true,
        confirmButtonText: t('close')
    });
}


function renderPersonsCards(persons) {
    if (!persons || persons.length === 0) {
        return `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #6b7280;">
                <i class="fas fa-user-friends" style="font-size: 64px; opacity: 0.3; margin-bottom: 20px;"></i>
                <h3 data-i18n="no_persons_found">${t('no_persons_found')}</h3>
                <p data-i18n="no_persons_match_filters">${t('no_persons_match_filters')}</p>
            </div>
        `;
    }
    
    let html = '';
    
    persons.forEach(person => {
        const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.trim();
        const photoUrl = person.photo_path ? `/${person.photo_path}` : '/assets/images/default-avatar.png';
        const roles = person.roles ? person.roles.split(',') : [];
        const custodyStatus = person.custody_status || 'none';
        const totalCases = person.total_cases || 0;
        const investigatorCases = person.investigator_cases || 0;
        const criminalHistory = person.criminal_history_count || 0;
        
        html += `
            <div class="person-card" data-roles="${person.roles || ''}" data-custody="${custodyStatus}" data-name="${fullName.toLowerCase()}" data-id="${person.national_id || ''}" data-phone="${person.phone || ''}">
                <div class="person-card-header">
                    <img src="${photoUrl}" alt="${fullName}" class="person-photo">
                    <div class="person-info-header">
                        <h3 class="person-name">${fullName}</h3>
                        <div class="person-roles">
                            ${roles.map(role => `<span class="role-badge role-${role.trim()}" data-i18n="${role.trim()}">${t(role.trim())}</span>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="person-details">
                    <div class="detail-item">
                        <span class="detail-label" data-i18n="national_id">${t('national_id')}</span>
                        <span class="detail-value">${person.national_id || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label" data-i18n="phone">${t('phone')}</span>
                        <span class="detail-value">${person.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label" data-i18n="gender">${t('gender')}</span>
                        <span class="detail-value">${person.gender || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label" data-i18n="custody_status">${t('custody_status')}</span>
                        <span class="custody-badge custody-${custodyStatus}">
                            <i class="fas fa-${custodyStatus === 'in_custody' ? 'lock' : custodyStatus === 'bailed' ? 'balance-scale' : 'check'}"></i>
                            ${custodyStatus === 'in_custody' ? t('in_custody') : custodyStatus === 'bailed' ? t('bailed') : t('not_in_custody')}
                        </span>
                    </div>
                </div>
                
                <div class="person-stats">
                    <div class="stat">
                        <div class="stat-value">${investigatorCases}</div>
                        <div class="stat-label" data-i18n="with_cases">${t('with_cases')}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${totalCases}</div>
                        <div class="stat-label" data-i18n="total_cases">${t('total_cases')}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${criminalHistory}</div>
                        <div class="stat-label" data-i18n="custody_history">${t('custody_history')}</div>
                    </div>
                </div>
                
                <div class="person-actions">
                    <button class="btn-view" onclick="viewPersonFullDetails(${person.id})">
                        <i class="fas fa-eye"></i> <span data-i18n="view_details">${t('view_details')}</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    return html;
}

function filterPersons() {
    const searchText = $('#personSearch').val().toLowerCase();
    const roleFilter = $('#roleFilter').val();
    const custodyFilter = $('#custodyFilter').val();
    
    $('.person-card').each(function() {
        const card = $(this);
        const name = card.attr('data-name') || '';
        const id = card.attr('data-id') || '';
        const phone = card.attr('data-phone') || '';
        const roles = card.attr('data-roles') || '';
        const custody = card.attr('data-custody') || '';
        
        const matchesSearch = !searchText || name.includes(searchText) || id.includes(searchText) || phone.includes(searchText);
        const matchesRole = !roleFilter || roles.includes(roleFilter);
        const matchesCustody = !custodyFilter || custody === custodyFilter;
        
        if (matchesSearch && matchesRole && matchesCustody) {
            card.show();
        } else {
            card.hide();
        }
    });
}

async function viewPersonFullDetails(personId) {
    try {
        showLoading(t('loading_person_details'));
        const response = await investigationAPI.getPerson(personId);
        
        if (response.status === 'success') {
            closeAlert();
            showPersonDetailsModal(response.data);
        }
    } catch (error) {
        closeAlert();
        await showError(t('error'), t('failed_load_person_details') + ': ' + error.message);
    }
}

function showPersonDetailsModal(person) {
    const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.trim();
    const photoUrl = person.photo_path ? `/${person.photo_path}` : '/assets/images/default-avatar.png';
    const cases = person.cases || [];
    const custodyRecords = person.custody_records || [];
    const criminalHistory = person.criminal_history || [];
    
    const bodyHtml = `
        <div class="person-details-full">
            <div class="details-header">
                <img src="${photoUrl}" alt="${fullName}" class="details-photo">
                <div class="details-info">
                    <h2>${fullName}</h2>
                    <div class="details-meta">
                        <span><i class="fas fa-id-card"></i> ${person.national_id || 'N/A'}</span>
                        <span><i class="fas fa-phone"></i> ${person.phone || 'N/A'}</span>
                        <span><i class="fas fa-envelope"></i> ${person.email || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="details-sections">
                <div class="details-section">
                    <h3 data-i18n="personal_information"><i class="fas fa-user"></i> ${t('personal_information')}</h3>
                    <div class="info-grid">
                        <div><strong data-i18n="gender">${t('gender')}:</strong> ${person.gender || 'N/A'}</div>
                        <div><strong data-i18n="date_of_birth">${t('date_of_birth')}:</strong> ${person.date_of_birth || 'N/A'}</div>
                        <div><strong data-i18n="address">${t('address')}:</strong> ${person.address || 'N/A'}</div>
                        <div><strong data-i18n="nationality">${t('nationality')}:</strong> ${person.nationality || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h3 data-i18n="connected_cases"><i class="fas fa-briefcase"></i> ${t('connected_cases')} (${cases.length})</h3>
                    ${cases.length > 0 ? `
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th data-i18n="case_number">${t('case_number')}</th>
                                    <th data-i18n="role">${t('role')}</th>
                                    <th data-i18n="type">${t('type')}</th>
                                    <th data-i18n="status">${t('status')}</th>
                                    <th data-i18n="action">${t('action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cases.map(c => `
                                    <tr>
                                        <td><strong>${c.case_number}</strong></td>
                                        <td><span class="role-badge role-${c.party_role}" data-i18n="${c.party_role}">${t(c.party_role)}</span></td>
                                        <td>${c.crime_type || 'N/A'}</td>
                                        <td>${getStatusBadge(c.status)}</td>
                                        <td><button class="btn btn-sm btn-primary" onclick="viewCase(${c.id})" data-i18n="view">${t('view')}</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p style="text-align: center; color: #6b7280;" data-i18n="no_cases_found">' + t('no_cases_found') + '</p>'}
                </div>
                
                ${custodyRecords.length > 0 ? `
                    <div class="details-section">
                        <h3 data-i18n="custody_records"><i class="fas fa-lock"></i> ${t('custody_records')} (${custodyRecords.length})</h3>
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th data-i18n="status">${t('status')}</th>
                                    <th data-i18n="location">${t('location')}</th>
                                    <th data-i18n="start_date">${t('start_date')}</th>
                                    <th data-i18n="end_date">${t('end_date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${custodyRecords.map(cr => `
                                    <tr>
                                        <td><span class="custody-badge custody-${cr.custody_status}">${cr.custody_status}</span></td>
                                        <td>${cr.custody_location || 'N/A'}</td>
                                        <td>${formatDateOnly(cr.custody_start)}</td>
                                        <td>${cr.custody_end ? formatDateOnly(cr.custody_end) : '<em data-i18n="ongoing">' + t('ongoing') + '</em>'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                ${criminalHistory.length > 0 ? `
                    <div class="details-section">
                        <h3 data-i18n="criminal_history"><i class="fas fa-history"></i> ${t('criminal_history')} - ${t('past_offenses')} (${criminalHistory.length})</h3>
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th data-i18n="case_number">${t('case_number')}</th>
                                    <th data-i18n="date">${t('date')}</th>
                                    <th data-i18n="crime_type">${t('crime_type')}</th>
                                    <th data-i18n="location">${t('location')}</th>
                                    <th data-i18n="closed_date">${t('closed_date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${criminalHistory.map(ch => `
                                    <tr>
                                        <td><strong>${ch.case_number}</strong></td>
                                        <td>${formatDateOnly(ch.incident_date)}</td>
                                        <td><strong>${ch.crime_type}</strong></td>
                                        <td>${ch.incident_location || 'N/A'}</td>
                                        <td>${ch.closed_at ? formatDateOnly(ch.closed_at) : 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <style>
            .person-details-full { padding: 20px; max-height: 70vh; overflow-y: auto; }
            .details-header {
                display: flex;
                gap: 20px;
                align-items: center;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
                margin-bottom: 20px;
            }
            .details-photo {
                width: 120px;
                height: 120px;
                border-radius: 12px;
                object-fit: cover;
                border: 3px solid #e5e7eb;
            }
            .details-info h2 { margin: 0 0 10px 0; font-size: 24px; }
            .details-meta { display: flex; gap: 15px; flex-wrap: wrap; font-size: 14px; color: #6b7280; }
            .details-meta span { display: flex; align-items: center; gap: 5px; }
            
            .details-sections { display: flex; flex-direction: column; gap: 20px; }
            .details-section {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
            }
            .details-section h3 {
                margin: 0 0 15px 0;
                font-size: 18px;
                color: #111827;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            .details-table {
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 8px;
                overflow: hidden;
            }
            .details-table th {
                background: #667eea;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: 600;
            }
            .details-table td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }
            .details-table tr:last-child td { border-bottom: none; }
        </style>
    `;
    
    showModal(t('person_details'), bodyHtml, [
        { text: t('close'), class: 'btn btn-secondary', onclick: 'closeModal()' }
    ]);
}

// Show alert message
function showAlert(message, type = 'success') {
    const alertHtml = `
        <div class="alert alert-${type}" style="margin-bottom: 20px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        </div>
    `;
    
    $('#pageContent').prepend(alertHtml);
    
    setTimeout(() => {
        $('.alert').fadeOut();
    }, 5000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Format date only
function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Get status badge HTML
function getStatusBadge(status) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const statusKey = 'status_' + status;
    const statusText = t(statusKey);
    return `<span class="badge-status ${status}" data-i18n="${statusKey}">${statusText}</span>`;
}

// Get priority badge HTML
function getPriorityBadge(priority) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const colors = {
        low: '#6b7280',
        medium: '#3b82f6',
        high: '#f59e0b',
        critical: '#ef4444'
    };
    const priorityKey = 'priority_' + priority;
    const priorityText = t(priorityKey);
    return `<span class="badge-status" style="background: ${colors[priority]}; color: white;" data-i18n="${priorityKey}">${priorityText}</span>`;
}

// Setup routing - handle browser back/forward buttons
function setupRouting() {
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            loadPage(event.state.page, false);
            updateActiveNavItem(event.state.page);
        } else {
            loadPageFromURL();
        }
    });
}

// Load page from current URL
function loadPageFromURL() {
    const hash = window.location.hash.substring(1); // Remove the '#'
    const page = hash || 'dashboard';
    loadPage(page, false);
    updateActiveNavItem(page);
}

// Navigate to a page and update URL
function navigateToPage(page) {
    // Update URL without reloading page
    const newURL = window.location.pathname + '#' + page;
    history.pushState({ page: page }, '', newURL);
    
    // Load the page content
    loadPage(page, true);
}

// Update active navigation item
function updateActiveNavItem(page) {
    $('.nav-item').removeClass('active');
    $(`.nav-item[data-page="${page}"]`).addClass('active');
}

// Load page based on navigation
function loadPage(page, updateNav = true) {
    console.log('Loading page:', page);
    
    if (updateNav) {
        updateActiveNavItem(page);
    }
    
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsersPage();
            break;
        case 'centers':
            loadCentersPage();
            break;
        case 'audit-logs':
            loadAuditLogsPage();
            break;
        case 'pending-cases':
            loadPendingCasesPage();
            break;
        case 'case-tracking':
            loadCaseTrackingDashboard();
            break;
        case 'all-cases':
            loadAllCasesPage();
            break;
        case 'ob-entry':
            loadOBEntryPage();
            break;
        case 'my-cases':
            loadMyCasesPage();
            break;
        case 'persons':
            if (hasAnyRole([USER_ROLES.OB_OFFICER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
                loadPersonsPage();
            } else {
                loadPage('dashboard');
            }
            break;
        case 'all-cases':
            loadHTMLPage('assets/pages/all-cases.html');
            break;
        
        case 'investigations':
            loadInvestigationsPage();
            break;
        case 'case-persons':
            loadCasePersonsPage();
            break;
        case 'report-settings':
            loadReportSettingsPage();
            break;
        
        case 'medical-examination-form':
            loadMedicalExaminationForm();
            break;
        
        case 'medical-forms-dashboard':
            loadMedicalFormsDashboard();
            break;
        case 'solved-cases-dashboard':
            loadSolvedCasesDashboard();
            break;
        
        case 'non-criminal-certificate':
            // Only allow admin and superadmin access
            if (hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
                loadNonCriminalCertificate();
            } else {
                showError(t('access_denied'), t('no_permission_to_access_page'));
                loadPage('dashboard');
            }
            break;
        
        case 'certificates-dashboard':
            // Only allow admin and superadmin access
            if (hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
                loadCertificatesDashboard();
            } else {
                showError(t('access_denied'), t('no_permission_to_access_page'));
                loadPage('dashboard');
            }
            break;
        case 'evidence':
            loadEvidencePage();
            break;
        case 'reports':
            loadReportsDashboard();
            break;
        case 'court-cases':
            loadCourtCasesPage();
            break;
        case 'custody':
            loadCustodyPage();
            break;
        case 'bailers':
            loadBailersPage();
            break;
        case 'assignments':
            loadAssignmentsPage();
            break;
        case 'reports':
            // Only allow admin and superadmin access
            if (hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
                loadReportsDashboard();
            } else {
                showError(t('access_denied'), t('no_permission_to_access_page'));
                loadPage('dashboard');
            }
            break;
        case 'categories':
            loadCategoriesManagement();
            break;
        case 'cases-by-category':
            // Only allow admin and superadmin access
            if (hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
                loadCasesByCategory();
            } else {
                showError(t('access_denied'), t('no_permission_to_access_page'));
                loadPage('dashboard');
            }
            break;
        case 'court-dashboard':
            loadCourtDashboard();
            break;
        case 'court-cases':
            loadCourtCases();
            break;
        case 'investigator-solved-cases':
            loadInvestigatorSolvedCasesPage();
            break;
        case 'court-solved-cases':
            loadCourtSolvedCasesPage();
            break;
        
        case 'reopen-cases':
            loadReopenCasesPage();
            break;
        case 'incident-entry':
            loadIncidentEntryPage();
            break;
        case 'daily-operations':
            // Only allow admin and superadmin access
            if (hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
                loadDailyOperationsDashboard();
            } else {
                showError(t('access_denied'), t('no_permission_to_access_page'));
                loadPage('dashboard');
            }
            break;
        default:
            $('#pageContent').html('<div class="alert alert-info">Page under construction: ' + page + '</div>');
    }
}

// User Management Page
function loadUsersPage() {
    setPageTitle('user_management');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px;">
            <button class="btn btn-primary" onclick="showCreateUserModal()" data-i18n="create_new_user">
                <i class="fas fa-plus"></i> ${t('create_new_user')}
            </button>
        </div>
        <div id="usersTable">${t('loading_users')}</div>
    `);
    
    loadUsersTable();
}

async function loadUsersTable() {
    try {
        const response = await adminAPI.getUsers();
        if (response.status === 'success') {
            const users = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="username">${t('username')}</th>
                            <th data-i18n="full_name">${t('full_name')}</th>
                            <th data-i18n="email">${t('email')}</th>
                            <th data-i18n="user_role">${t('user_role')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            users.forEach(user => {
                html += `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.full_name}</td>
                        <td>${user.email}</td>
                        <td><span class="badge-status">${user.role}</span></td>
                        <td><span class="badge-status ${user.is_active ? 'approved' : 'draft'}" data-i18n="${user.is_active ? 'active' : 'inactive'}">${user.is_active ? t('active') : t('inactive')}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})" data-i18n="edit">${t('edit')}</button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#usersTable').html(html);
        }
    } catch (error) {
        $('#usersTable').html(`<div class="alert alert-error" data-i18n="failed_load_users">${t('failed_load_users')}</div>`);
    }
}

// Police Centers Page
function loadCentersPage() {
    setPageTitle('police_centers');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px;">
            <button class="btn btn-primary" onclick="showCreateCenterModal()" data-i18n="add_new_center">
                <i class="fas fa-plus"></i> ${t('add_new_center')}
            </button>
        </div>
        <div id="centersTable">${t('loading_centers')}</div>
    `);
    
    loadCentersTable();
}

async function loadCentersTable() {
    console.log('Loading centers table...');
    try {
        const response = await adminAPI.getCenters();
        console.log('Centers response:', response);
        
        if (response.status === 'success') {
            const centers = response.data;
            console.log('Number of centers:', centers.length);
            
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="code">${t('code')}</th>
                            <th data-i18n="center_name">${t('center_name')}</th>
                            <th data-i18n="location">${t('location')}</th>
                            <th data-i18n="phone">${t('phone')}</th>
                            <th data-i18n="email">${t('email')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            centers.forEach(center => {
                html += `
                    <tr>
                        <td><strong>${center.center_code}</strong></td>
                        <td>${center.center_name}</td>
                        <td>${center.location}</td>
                        <td>${center.phone || '-'}</td>
                        <td>${center.email || '-'}</td>
                        <td><span class="badge-status ${center.is_active ? 'approved' : 'draft'}" data-i18n="${center.is_active ? 'active' : 'inactive'}">${center.is_active ? t('active') : t('inactive')}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editCenter(${center.id})" data-i18n="edit">${t('edit')}</button>
                            <button class="btn btn-sm btn-secondary" onclick="viewCenter(${center.id})" data-i18n="view">${t('view')}</button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#centersTable').html(html);
        }
    } catch (error) {
        $('#centersTable').html(`<div class="alert alert-error" data-i18n="failed_load_centers">${t('failed_load_centers')}</div>`);
    }
}

function showCreateCenterModal() {
    const bodyHtml = `
        <form id="createCenterForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Center Code *</label>
                    <input type="text" name="center_code" required placeholder="e.g., KSM-004">
                </div>
                <div class="form-group">
                    <label>Center Name *</label>
                    <input type="text" name="center_name" required placeholder="e.g., Kismayo East Station">
                </div>
            </div>
            <div class="form-group">
                <label>Location *</label>
                <input type="text" name="location" required placeholder="Enter full address">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" name="phone" placeholder="+252 xxx xxx xxx">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="center@example.com">
                </div>
            </div>
        </form>
    `;
    showModal('Create Police Center', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Create', class: 'btn btn-primary', onclick: 'submitCreateCenter()' }
    ]);
}

async function submitCreateCenter() {
    const form = $('#createCenterForm')[0];
    
    // Check form validity
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.is_active = 1;
    
    console.log('Creating center with data:', data);
    
    try {
        showLoading('Creating Center', 'Please wait...');
        const response = await adminAPI.createCenter(data);
        
        console.log('Create center response:', response);
        closeAlert();
        
        if (response.status === 'success') {
            await showSuccess('Success!', 'Police center created successfully!');
            closeModal();
            // Reload the centers table
            console.log('Reloading centers table after successful creation...');
            setTimeout(() => {
                loadCentersTable();
            }, 500);
        }
    } catch (error) {
        closeAlert();
        console.error('Create center error:', error);
        
        // Handle validation errors
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
                title: 'Validation Error',
                html: errorText.replace(/\n/g, '<br>'),
                confirmButtonColor: '#ef4444'
            });
        } else {
            await showError('Error', 'Failed to create center: ' + error.message);
        }
    }
}

async function editCenter(id) {
    try {
        const response = await adminAPI.getCenter(id);
        if (response.status === 'success') {
            const center = response.data;
            
            const bodyHtml = `
                <form id="editCenterForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Center Code *</label>
                            <input type="text" name="center_code" required value="${center.center_code}">
                        </div>
                        <div class="form-group">
                            <label>Center Name *</label>
                            <input type="text" name="center_name" required value="${center.center_name}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Location *</label>
                        <input type="text" name="location" required value="${center.location}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" name="phone" value="${center.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value="${center.email || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="is_active" ${center.is_active ? 'checked' : ''}> Active
                        </label>
                    </div>
                </form>
            `;
            
            showModal('Edit Police Center', bodyHtml, [
                { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
                { text: 'Save Changes', class: 'btn btn-primary', onclick: `submitEditCenter(${id})` }
            ]);
        }
    } catch (error) {
        alert('Failed to load center details: ' + error.message);
    }
}

async function submitEditCenter(id) {
    const form = $('#editCenterForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.is_active = data.is_active ? 1 : 0;
    
    try {
        const response = await adminAPI.updateCenter(id, data);
        if (response.status === 'success') {
            await showSuccess('Success!', 'Center updated successfully!');
            closeModal();
            loadCentersTable();
        }
    } catch (error) {
        await showError('Error', 'Failed to update center: ' + error.message);
    }
}

async function viewCenter(id) {
    try {
        const response = await adminAPI.getCenter(id);
        if (response.status === 'success') {
            const center = response.data;
            
            const bodyHtml = `
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Center Code</span>
                        <span class="info-value">${center.center_code}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Center Name</span>
                        <span class="info-value">${center.center_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Location</span>
                        <span class="info-value">${center.location}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Phone</span>
                        <span class="info-value">${center.phone || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${center.email || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status</span>
                        <span class="info-value"><span class="badge-status ${center.is_active ? 'approved' : 'draft'}">${center.is_active ? 'Active' : 'Inactive'}</span></span>
                    </div>
                </div>
                
                ${center.gps_latitude ? `
                <div style="margin-top: 20px;">
                    <h3>GPS Location</h3>
                    <p>Latitude: ${center.gps_latitude}<br>Longitude: ${center.gps_longitude}</p>
                </div>` : ''}
                
                <div style="margin-top: 20px;">
                    <h3>Statistics</h3>
                    <p>Total Users: ${center.total_users || 0}<br>Active Cases: ${center.active_cases || 0}</p>
                </div>
            `;
            
            showModal('Police Center Details', bodyHtml, [
                { text: 'Edit', class: 'btn btn-primary', onclick: `closeModal(); editCenter(${id})` },
                { text: 'Close', class: 'btn btn-secondary', onclick: 'closeModal()' }
            ]);
        }
    } catch (error) {
        alert('Failed to load center details: ' + error.message);
    }
}

// Audit Logs Page
function loadAuditLogsPage() {
    setPageTitle('audit_logs');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
            <input type="text" id="auditSearch" data-i18n-placeholder="search_by_user_action" placeholder="${t('search_by_user_action')}" style="flex: 1; padding: 8px;">
            <select id="auditActionFilter" style="padding: 8px;">
                <option value="" data-i18n="all_actions">${t('all_actions')}</option>
                <option value="CREATE" data-i18n="create">${t('create')}</option>
                <option value="UPDATE" data-i18n="update">${t('update')}</option>
                <option value="DELETE" data-i18n="delete">${t('delete')}</option>
                <option value="LOGIN" data-i18n="login">${t('login')}</option>
                <option value="LOGOUT" data-i18n="logout">${t('logout')}</option>
            </select>
            <button class="btn btn-primary" onclick="filterAuditLogs()"><span data-i18n="filter">${t('filter')}</span></button>
            <button class="btn btn-secondary" onclick="exportAuditLogs()"><span data-i18n="export">${t('export')}</span></button>
        </div>
        <div id="auditLogsTable">${getLoadingHTML('loading_data')}</div>
    `);
    
    loadAuditLogsTable();
}

async function loadAuditLogsTable(filters = {}) {
    try {
        const response = await adminAPI.getAuditLogs(filters);
        if (response.status === 'success') {
            const logs = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="date_time">${t('date_time')}</th>
                            <th data-i18n="user">${t('user')}</th>
                            <th data-i18n="action">${t('action')}</th>
                            <th data-i18n="entity">${t('entity')}</th>
                            <th data-i18n="description">${t('description')}</th>
                            <th data-i18n="ip_address">${t('ip_address')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (logs.length === 0) {
                html += `<tr><td colspan="6" style="text-align: center;" data-i18n="no_audit_logs_found">${t('no_audit_logs_found')}</td></tr>`;
            } else {
                logs.forEach(log => {
                    const date = new Date(log.created_at);
                    html += `
                        <tr>
                            <td>${date.toLocaleString()}</td>
                            <td>${log.username}</td>
                            <td><span class="badge-status">${log.action}</span></td>
                            <td>${log.entity_type} #${log.entity_id || '-'}</td>
                            <td>${log.description}</td>
                            <td>${log.ip_address}</td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#auditLogsTable').html(html);
        }
    } catch (error) {
        $('#auditLogsTable').html('<div class="alert alert-error">Failed to load audit logs: ' + error.message + '</div>');
    }
}

function filterAuditLogs() {
    const search = $('#auditSearch').val();
    const action = $('#auditActionFilter').val();
    loadAuditLogsTable({ search, action });
}

function exportAuditLogs() {
    window.open('/admin/audit-logs/export', '_blank');
    // Or implement client-side CSV export
}

// Pending Cases Page
function loadPendingCasesPage() {
    setPageTitle('pending_approval');
    const content = $('#pageContent');
    content.html(`
        <div id="pendingCasesTable">${getLoadingHTML('loading_data')}</div>
    `);
    
    loadPendingCasesTable();
}

async function loadPendingCasesTable() {
    try {
        const response = await stationAPI.getPendingCases();
        if (response.status === 'success') {
            const cases = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="ob_number">${t('ob_number')}</th>
                            <th data-i18n="crime_type">${t('crime_type')}</th>
                            <th data-i18n="incident_date">${t('incident_date')}</th>
                            <th data-i18n="priority">${t('priority')}</th>
                            <th data-i18n="submitted_by">${t('submitted_by')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (cases.length === 0) {
                html += `<tr><td colspan="7" style="text-align: center;" data-i18n="no_pending_cases">${t('no_pending_cases')}</td></tr>`;
            } else {
                cases.forEach(caseItem => {
                    html += `
                        <tr>
                            <td><strong>${caseItem.case_number}</strong></td>
                            <td>${caseItem.ob_number}</td>
                            <td>${caseItem.crime_type}</td>
                            <td>${new Date(caseItem.incident_date).toLocaleDateString()}</td>
                            <td>${getPriorityBadge(caseItem.priority)}</td>
                            <td>${caseItem.created_by_name || 'N/A'}</td>
                            <td>
                                <button class="btn btn-sm btn-success" onclick="approveCase(${caseItem.id})"><span data-i18n="approve">${t('approve')}</span></button>
                                <button class="btn btn-sm btn-warning" onclick="returnCase(${caseItem.id})"><span data-i18n="return">${t('return')}</span></button>
                                <button class="btn btn-sm btn-secondary" onclick="viewCaseDetails(${caseItem.id})"><span data-i18n="view">${t('view')}</span></button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#pendingCasesTable').html(html);
        }
    } catch (error) {
        $('#pendingCasesTable').html('<div class="alert alert-error">Failed to load pending cases: ' + error.message + '</div>');
    }
}

async function approveCase(caseId) {
    const result = await showConfirm('Approve Case?', 'Approve this case and assign investigators?', 'Yes, approve');
    if (result.isConfirmed) {
        try {
            const response = await stationAPI.approveCase(caseId);
            if (response.status === 'success') {
                await showSuccess('Success!', 'Case approved successfully!');
                loadPendingCasesTable();
            }
        } catch (error) {
            await showError('Error', 'Failed to approve case: ' + error.message);
        }
    }
}

async function returnCase(caseId) {
    const result = await showPrompt('Return Case', 'Enter reason for returning this case:', 'Reason for returning...');
    if (result.isConfirmed && result.value) {
        try {
            const response = await stationAPI.returnCase(caseId, { reason: result.value });
            if (response.status === 'success') {
                await showSuccess('Success!', 'Case returned to OB officer');
                loadPendingCasesTable();
            }
        } catch (error) {
            await showError('Error', 'Failed to return case: ' + error.message);
        }
    }
}

async function viewCaseDetails(caseId) {
    // Get user role
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userRole = userData.role;
    
    // Only investigators get the full-page modal
    if (userRole === 'investigator' && typeof showFullCaseDetailsModal === 'function') {
        const result = await showFullCaseDetailsModal(caseId);
        // If modal opened successfully, return
        if (result !== null) {
            return;
        }
    }
    
    // Fallback to old modal if new one not loaded
    try {
        // Get user role to determine which API to use
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const userRole = userData.role;
        
        // Use appropriate API based on role
        let response;
        if (userRole === 'investigator') {
            response = await investigationAPI.getCase(caseId);
        } else if (userRole === 'court_user') {
            // Court users use court API
            response = await courtAPI.getCase(caseId);
        } else if (userRole === 'admin' || userRole === 'super_admin') {
            // Admins can use station API which has broader access
            response = await stationAPI.getCase(caseId);
        } else {
            // OB officers and others use OB API
            response = await obAPI.getCase(caseId);
        }
        
        if (response.status === 'success') {
            const caseData = response.data;
            
            const bodyHtml = `
                <div class="case-details-modal">
                    <!-- Header Section -->
                    <div class="case-header">
                        <div class="case-header-left">
                            <h2 style="margin: 0;">${caseData.case_number}</h2>
                            <p style="margin: 5px 0 0 0;"><span data-i18n="ob_number">${t('ob_number')}</span>: <strong>${caseData.ob_number}</strong></p>
                        </div>
                        <div class="case-header-right">
                            ${getStatusBadge(caseData.status)}
                            ${getPriorityBadge(caseData.priority)}
                            ${caseData.is_sensitive ? '<span class="badge-status" style="background: #ef4444; margin-left: 5px;" data-i18n="sensitive">' + t('sensitive').toUpperCase() + '</span>' : ''}
                        </div>
                    </div>
                    
                    <!-- Crime Information -->
                    <div class="detail-section">
                        <h3 class="section-title" data-i18n="crime_information"><i class="fas fa-gavel"></i> ${t('crime_information')}</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label data-i18n="crime_type">${t('crime_type')}</label>
                                <p>${caseData.crime_type}</p>
                            </div>
                            <div class="detail-item">
                                <label data-i18n="category">${t('category')}</label>
                                <p><span class="badge-status" style="text-transform: capitalize;">${caseData.crime_category}</span></p>
                            </div>
                            <div class="detail-item">
                                <label data-i18n="incident_date">${t('incident_date')}</label>
                                <p>${formatDate(caseData.incident_date)}</p>
                            </div>
                            <div class="detail-item">
                                <label data-i18n="report_date">${t('report_date')}</label>
                                <p>${formatDate(caseData.report_date)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Incident Details -->
                    <div class="detail-section">
                        <h3 class="section-title" data-i18n="incident_details"><i class="fas fa-map-marker-alt"></i> ${t('incident_details')}</h3>
                        <div class="detail-item">
                            <label data-i18n="location">${t('location')}</label>
                            <p>${caseData.incident_location}</p>
                        </div>
                        <div class="detail-item">
                            <label data-i18n="description">${t('description')}</label>
                            <p style="white-space: pre-wrap;">${caseData.incident_description}</p>
                        </div>
                    </div>
                    
                    <!-- Case Parties -->
                    <div class="detail-section">
                        <h3 class="section-title" data-i18n="case_parties"><i class="fas fa-users"></i> ${t('case_parties')}</h3>
                        ${caseData.parties && caseData.parties.length > 0 ? `
                            <div class="parties-grid">
                                ${caseData.parties.map(party => `
                                    <div class="party-card ${party.party_role}">
                                        <div class="party-role-badge">${t('party_role_' + party.party_role)}</div>
                                        <div class="party-card-content">
                                            <div class="party-photo">
                                                ${party.photo_path ? `
                                                    <img src="/${party.photo_path}" alt="${party.first_name} ${party.last_name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=party-photo-placeholder><i class=fas fa-user></i></div>'">
                                                ` : `
                                                    <div class="party-photo-placeholder">
                                                        <i class="fas fa-user"></i>
                                                    </div>
                                                `}
                                            </div>
                                            <div class="party-info">
                                                <h4>${party.first_name || ''} ${party.last_name || ''}</h4>
                                                <div class="party-details">
                                                    <div class="party-detail">
                                                        <i class="fas fa-id-card"></i>
                                                        <span>${party.national_id || t('not_provided')}</span>
                                                    </div>
                                                    <div class="party-detail">
                                                        <i class="fas fa-phone"></i>
                                                        <span>${party.phone || t('not_provided')}</span>
                                                    </div>
                                                    <div class="party-detail">
                                                        <i class="fas fa-venus-mars"></i>
                                                        <span>${party.gender ? t('gender_' + party.gender.toLowerCase()) : t('not_specified')}</span>
                                                    </div>
                                                    ${party.address ? `
                                                    <div class="party-detail">
                                                        <i class="fas fa-home"></i>
                                                        <span>${party.address}</span>
                                                    </div>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i class="fas fa-user-slash" style="font-size: 48px; color: #d1d5db;"></i>
                                <p data-i18n="no_parties_added">${t('no_parties_added')}</p>
                                <small data-i18n="add_parties_to_submit">${t('add_parties_to_submit')}</small>
                            </div>
                        `}
                    </div>
                    
                    <!-- Investigation Assignment -->
                    ${caseData.investigating_officer_name ? `
                    <div class="detail-section">
                        <h3 class="section-title" data-i18n="investigation_assignment"><i class="fas fa-user-tie"></i> ${t('investigation_assignment')}</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label data-i18n="investigating_officer">${t('investigating_officer')}</label>
                                <p><strong>${caseData.investigating_officer_name}</strong></p>
                            </div>
                            ${caseData.sent_by_name ? `
                            <div class="detail-item">
                                <label data-i18n="sent_to_court_by">${t('sent_to_court_by')}</label>
                                <p>${caseData.sent_by_name}</p>
                            </div>
                            ` : ''}
                            ${caseData.sent_to_court_at ? `
                            <div class="detail-item">
                                <label data-i18n="sent_to_court_date">${t('sent_to_court_date')}</label>
                                <p>${formatDateTime(caseData.sent_to_court_at)}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Related Cases -->
                    <div class="detail-section" id="relatedCasesSection">
                        <h3 class="section-title" data-i18n="related_cases"><i class="fas fa-link"></i> ${t('related_cases')}</h3>
                        <div id="relatedCasesContent" data-i18n="loading">${t('loading')}...</div>
                    </div>
                    
                    ${caseData.investigators && caseData.investigators.length > 0 ? `
                    <div class="detail-section">
                        <h3 class="section-title" data-i18n="assigned_investigators"><i class="fas fa-user-shield"></i> ${t('assigned_investigators')}</h3>
                        <div class="investigators-list">
                            ${caseData.investigators.map(inv => `
                                <div class="investigator-card">
                                    <div class="investigator-avatar">
                                        <i class="fas fa-user-tie"></i>
                                    </div>
                                    <div class="investigator-info">
                                        <h4>${inv.full_name}</h4>
                                        <p><span data-i18n="badge">${t('badge')}</span>: ${inv.badge_number}</p>
                                        <span class="badge-status ${inv.is_lead_investigator ? 'approved' : 'draft'}">
                                            ${inv.is_lead_investigator ? t('lead_investigator') : t('investigator')}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <style>
                    .case-details-modal {
                        /* No max-height or overflow - let modal handle it */
                    }
                    
                    .case-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding: 25px;
                        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                        color: white;
                        border-radius: 12px;
                        margin-bottom: 20px;
                        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
                    }
                    
                    .case-header h2 {
                        color: white !important;
                    }
                    
                    .case-header p {
                        color: #e0e7ff !important;
                    }
                    
                    .case-header-right {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    
                    .detail-section {
                        background: #f9fafb;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    
                    .section-title {
                        margin: 0 0 15px 0;
                        color: #374151;
                        font-size: 18px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .section-title i {
                        color: #667eea;
                    }
                    
                    .detail-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                    }
                    
                    .detail-item label {
                        display: block;
                        font-size: 12px;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 5px;
                        font-weight: 600;
                    }
                    
                    .detail-item p {
                        margin: 0;
                        color: #1f2937;
                        font-size: 15px;
                    }
                    
                    .parties-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                        gap: 20px;
                    }
                    
                    .party-card {
                        background: white;
                        padding: 20px;
                        border-radius: 12px;
                        border: 2px solid #e5e7eb;
                        position: relative;
                    }
                    
                    .party-card-content {
                        display: flex;
                        gap: 20px;
                        align-items: flex-start;
                    }
                    
                    .party-photo {
                        flex-shrink: 0;
                        width: 120px;
                        height: 150px;
                        border-radius: 8px;
                        overflow: hidden;
                        border: 2px solid #e5e7eb;
                    }
                    
                    .party-photo img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    
                    .party-photo-placeholder {
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 48px;
                        color: #9ca3af;
                    }
                    
                    .party-info {
                        flex: 1;
                    }
                    
                    .party-card.accuser {
                        border-color: #3b82f6;
                    }
                    
                    .party-card.accused {
                        border-color: #ef4444;
                    }
                    
                    .party-role-badge {
                        position: absolute;
                        top: -10px;
                        right: 15px;
                        background: #667eea;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    
                    .party-card.accuser .party-role-badge {
                        background: #3b82f6;
                    }
                    
                    .party-card.accused .party-role-badge {
                        background: #ef4444;
                    }
                    
                    .party-info h4 {
                        margin: 0 0 15px 0;
                        color: #1f2937;
                        font-size: 20px;
                        font-weight: 600;
                    }
                    
                    .party-details {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .party-detail {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        color: #6b7280;
                        font-size: 14px;
                    }
                    
                    .party-detail i {
                        width: 20px;
                        color: #9ca3af;
                    }
                    
                    .investigators-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    
                    .investigator-card {
                        background: white;
                        padding: 15px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .investigator-avatar {
                        width: 50px;
                        height: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 24px;
                    }
                    
                    .investigator-info h4 {
                        margin: 0;
                        color: #1f2937;
                        font-size: 16px;
                    }
                    
                    .investigator-info p {
                        margin: 5px 0;
                        color: #6b7280;
                        font-size: 13px;
                    }
                    
                    .empty-state {
                        text-align: center;
                        padding: 40px;
                        color: #6b7280;
                    }
                    
                    .empty-state p {
                        margin: 15px 0 5px 0;
                        font-size: 16px;
                        font-weight: 500;
                    }
                    
                    .empty-state small {
                        color: #9ca3af;
                    }
                </style>
            `;
            
            showModal(t('case_details'), bodyHtml, [
                { text: t('close'), class: 'btn btn-secondary', onclick: 'closeModal()' }
            ], 'large');
            
            // Load related cases after modal is shown
            loadRelatedCasesForView(caseId);
        }
    } catch (error) {
        await showError(t('error'), t('failed_to_load_case') + ': ' + error.message);
    }
}

// All Cases Page
function loadAllCasesPage() {
    setPageTitle('all_cases');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
            <input type="text" id="caseSearch" data-i18n-placeholder="search_by_case_number" placeholder="${t('search_by_case_number')}" style="flex: 1; padding: 8px;">
            <select id="caseStatusFilter" style="padding: 8px;">
                <option value="" data-i18n="all_status">${t('all_status')}</option>
                <option value="draft" data-i18n="draft">${t('draft')}</option>
                <option value="submitted" data-i18n="submitted">${t('submitted')}</option>
                <option value="approved" data-i18n="approved">${t('approved')}</option>
                <option value="assigned" data-i18n="assigned">${t('assigned')}</option>
                <option value="investigating" data-i18n="investigating">${t('investigating')}</option>
                <option value="solved" data-i18n="solved">${t('solved')}</option>
                <option value="escalated" data-i18n="escalated">${t('escalated')}</option>
                <option value="court_pending" data-i18n="court_pending">${t('court_pending')}</option>
                <option value="closed" data-i18n="closed">${t('closed')}</option>
            </select>
            <select id="casePriorityFilter" style="padding: 8px;">
                <option value="" data-i18n="all_priority">${t('all_priority')}</option>
                <option value="low" data-i18n="low">${t('low')}</option>
                <option value="medium" data-i18n="medium">${t('medium')}</option>
                <option value="high" data-i18n="high">${t('high')}</option>
                <option value="critical" data-i18n="critical">${t('critical')}</option>
            </select>
            <button class="btn btn-primary" onclick="filterAllCases()"><span data-i18n="filter">${t('filter')}</span></button>
        </div>
        <div id="allCasesTable">${getLoadingHTML('loading_data')}</div>
    `);
    
    loadAllCasesTable();
}

async function loadAllCasesTable(filters = {}) {
    try {
        // Use the appropriate API based on user role
        let response;
        if (currentUser.role === 'investigator') {
            response = await investigationAPI.getCases(filters);
        } else {
            response = await obAPI.getCases(filters);
        }
        if (response.status === 'success') {
            const cases = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="crime_type">${t('crime_type')}</th>
                            <th data-i18n="category">${t('category')}</th>
                            <th data-i18n="incident_date">${t('incident_date')}</th>
                            <th data-i18n="priority">${t('priority')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (cases.length === 0) {
                html += `<tr><td colspan="7" style="text-align: center;" data-i18n="no_cases_found">${t('no_cases_found')}</td></tr>`;
            } else {
                cases.forEach(caseItem => {
                    html += `
                        <tr>
                            <td><strong>${caseItem.case_number}</strong></td>
                            <td>${caseItem.crime_type}</td>
                            <td><span class="badge-status">${caseItem.crime_category}</span></td>
                            <td>${new Date(caseItem.incident_date).toLocaleDateString()}</td>
                            <td>${getPriorityBadge(caseItem.priority)}</td>
                            <td>${getStatusBadge(caseItem.status)}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="viewCaseDetails(${caseItem.id})" data-i18n="view">${t('view')}</button>
                                <button class="btn btn-sm btn-primary" onclick="showAssignInvestigatorModal(${caseItem.id}, '${caseItem.case_number}')" data-i18n="assign">${t('assign')}</button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#allCasesTable').html(html);
        }
    } catch (error) {
        $('#allCasesTable').html('<div class="alert alert-error">Failed to load cases: ' + error.message + '</div>');
    }
}

function filterAllCases() {
    const search = $('#caseSearch').val();
    const status = $('#caseStatusFilter').val();
    const priority = $('#casePriorityFilter').val();
    loadAllCasesTable({ search, status, priority });
}

function manageCaseAssignment(caseId) {
    alert('Manage Case Assignment #' + caseId + ' - Coming soon!');
}

// OB Entry Page
function loadOBEntryPage() {
    setPageTitle('create_ob_entry');
    const content = $('#pageContent');
    content.html(`
        <form id="obEntryForm" style="max-width: 1200px;">
            <h3 data-i18n="case_information">${t('case_information')}</h3>
            <div class="form-row">
                <div class="form-group">
                    <label data-i18n="crime_type_required">${t('crime_type')} *</label>
                    <input type="text" name="crime_type" required data-i18n-placeholder="crime_type_placeholder" placeholder="${t('crime_type_placeholder')}">
                </div>
                <div class="form-group">
                    <label data-i18n="crime_category_required">${t('crime_category')} *</label>
                    <select name="crime_category" id="ob_crime_category" required>
                        <option value="">Loading categories...</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label data-i18n="priority_required">${t('priority')} *</label>
                    <select name="priority" required>
                        <option value="low" data-i18n="low">${t('low')}</option>
                        <option value="medium" selected data-i18n="medium">${t('medium')}</option>
                        <option value="high" data-i18n="high">${t('high')}</option>
                        <option value="critical" data-i18n="critical">${t('critical')}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label data-i18n="incident_date_time_required">${t('incident_date_time')} *</label>
                    <input type="datetime-local" name="incident_date" required>
                </div>
            </div>
            
            <div class="form-group">
                <label data-i18n="incident_location_required">${t('incident_location')} *</label>
                <input type="text" name="incident_location" required data-i18n-placeholder="incident_location_placeholder" placeholder="${t('incident_location_placeholder')}">
            </div>
            
            <div class="form-group">
                <label data-i18n="incident_description_required">${t('incident_description')} *</label>
                <textarea name="incident_description" rows="5" required data-i18n-placeholder="incident_description_placeholder" placeholder="${t('incident_description_placeholder')}"></textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="is_sensitive"> <span data-i18n="mark_as_sensitive_case">${t('mark_as_sensitive_case')}</span>
                </label>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;">
            
            <h3 data-i18n="related_cases_optional">${t('related_cases_optional')}</h3>
            <p style="color: #6b7280; margin-bottom: 15px;" data-i18n="connect_related_cases_desc">${t('connect_related_cases_desc')}</p>
            
            <div class="form-group">
                <label data-i18n="search_for_related_cases">${t('search_for_related_cases')}</label>
                <input type="text" id="relatedCaseSearch" data-i18n-placeholder="search_related_cases_placeholder" placeholder="${t('search_related_cases_placeholder')}" onkeyup="searchRelatedCases(event)">
            </div>
            
            <div id="relatedCasesResults" style="display: none; margin-bottom: 15px; max-height: 200px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px;">
                <!-- Search results will appear here -->
            </div>
            
            <div id="selectedRelatedCases">
                <!-- Selected related cases will appear here -->
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;" data-i18n="accuser_information_required">${t('accuser_information')} *</h3>
                <button type="button" class="btn btn-sm btn-primary" onclick="addAccuserForm()">
                    <i class="fas fa-plus"></i> <span data-i18n="add_another_accuser">${t('add_another_accuser')}</span>
                </button>
            </div>
            
            <div id="accusersContainer">
                <div class="party-form-section" data-party-index="0">
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="full_name_required">${t('full_name')} *</label>
                            <input type="text" name="accuser_name_0" required data-i18n-placeholder="full_name_accuser_placeholder" placeholder="${t('full_name_accuser_placeholder')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="national_id">${t('national_id')}</label>
                            <input type="text" name="accuser_id_0" data-i18n-placeholder="national_id_placeholder" placeholder="${t('national_id_placeholder')}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="phone">${t('phone')}</label>
                            <input type="tel" name="accuser_phone_0" data-i18n-placeholder="phone_number_placeholder" placeholder="${t('phone_number_placeholder')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="gender">${t('gender')}</label>
                            <select name="accuser_gender_0">
                                <option value="" data-i18n="select">${t('select')}</option>
                                <option value="male" data-i18n="male">${t('male')}</option>
                                <option value="female" data-i18n="female">${t('female')}</option>
                                <option value="other" data-i18n="other">${t('other')}</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label data-i18n="photo">${t('photo')}</label>
                        <input type="file" name="accuser_photo_0" accept="image/*" class="form-control">
                        <small style="color: #6b7280; display: block; margin-top: 5px;" data-i18n="photo_upload_hint">${t('photo_upload_hint')}</small>
                    </div>
                    <div class="form-group">
                        <label data-i18n="address">${t('address')}</label>
                        <input type="text" name="accuser_address_0" data-i18n-placeholder="physical_address_placeholder" placeholder="${t('physical_address_placeholder')}">
                    </div>
                </div>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;" data-i18n="accused_information_required">${t('accused_information')} *</h3>
                <button type="button" class="btn btn-sm btn-primary" onclick="addAccusedForm()">
                    <i class="fas fa-plus"></i> <span data-i18n="add_another_accused">${t('add_another_accused')}</span>
                </button>
            </div>
            
            <div id="accusedContainer">
                <div class="party-form-section" data-party-index="0">
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="full_name_required">${t('full_name')} *</label>
                            <input type="text" name="accused_name_0" required data-i18n-placeholder="full_name_accused_placeholder" placeholder="${t('full_name_accused_placeholder')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="national_id">${t('national_id')}</label>
                            <input type="text" name="accused_id_0" data-i18n-placeholder="national_id_placeholder" placeholder="${t('national_id_placeholder')}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="phone">${t('phone')}</label>
                            <input type="tel" name="accused_phone_0" data-i18n-placeholder="phone_number_placeholder" placeholder="${t('phone_number_placeholder')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="gender">${t('gender')}</label>
                            <select name="accused_gender_0">
                                <option value="" data-i18n="select">${t('select')}</option>
                                <option value="male" data-i18n="male">${t('male')}</option>
                                <option value="female" data-i18n="female">${t('female')}</option>
                                <option value="other" data-i18n="other">${t('other')}</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label data-i18n="address">${t('address')}</label>
                        <input type="text" name="accused_address_0" data-i18n-placeholder="physical_address_placeholder" placeholder="${t('physical_address_placeholder')}">
                    </div>
                    <div class="form-group">
                        <label data-i18n="photo_optional">${t('photo_optional')}</label>
                        <input type="file" name="accused_photo_0" accept="image/*" onchange="previewPhoto(event, 'accused', 0)">
                        <small style="color: #6b7280; display: block; margin-top: 5px;" data-i18n="photo_upload_accused_hint">${t('photo_upload_accused_hint')}</small>
                        <div id="accused_photo_preview_0" style="margin-top: 10px; display: none;">
                            <img src="" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #e5e7eb;">
                        </div>
                    </div>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <h5 style="color: #1f2937; margin-bottom: 15px;"><i class="fas fa-user-lock"></i> <span data-i18n="custody_status">${t('custody_status')}</span></h5>
                    
                    <div class="form-group">
                        <label data-i18n="custody_status_required">${t('custody_status')} *</label>
                        <select name="accused_custody_status_0" onchange="toggleCustodyFields(0)" required>
                            <option value="not_present" data-i18n="not_present">${t('not_present')}</option>
                            <option value="arrested" data-i18n="arrested_in_custody">${t('arrested_in_custody')}</option>
                            <option value="bailed" data-i18n="bailed_released">${t('bailed_released')}</option>
                        </select>
                    </div>
                    
                    <!-- Arrested Fields -->
                    <div id="arrested_fields_0" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label data-i18n="custody_location">${t('custody_location')}</label>
                                <input type="text" name="accused_custody_location_0" data-i18n-placeholder="custody_location_placeholder" placeholder="${t('custody_location_placeholder')}">
                            </div>
                            <div class="form-group">
                                <label data-i18n="cell_number">${t('cell_number')}</label>
                                <input type="text" name="accused_cell_number_0" data-i18n-placeholder="cell_number_placeholder" placeholder="${t('cell_number_placeholder')}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label data-i18n="custody_notes">${t('custody_notes')}</label>
                            <textarea name="accused_custody_notes_0" rows="2" data-i18n-placeholder="custody_notes_placeholder" placeholder="${t('custody_notes_placeholder')}"></textarea>
                        </div>
                    </div>
                    
                    <!-- Bailed Fields -->
                    <div id="bailed_fields_0" style="display: none;">
                        <h6 style="color: #3b82f6; margin: 15px 0 10px 0;"><i class="fas fa-user-tie"></i> <span data-i18n="bailer_information">${t('bailer_information')}</span></h6>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label data-i18n="bailer_full_name_required">${t('bailer_full_name')} *</label>
                                <input type="text" name="accused_bailer_name_0" data-i18n-placeholder="bailer_name_placeholder" placeholder="${t('bailer_name_placeholder')}">
                            </div>
                            <div class="form-group">
                                <label data-i18n="bailer_national_id">${t('bailer_national_id')}</label>
                                <input type="text" name="accused_bailer_id_0" data-i18n-placeholder="national_id_placeholder" placeholder="${t('national_id_placeholder')}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label data-i18n="bailer_phone_required">${t('bailer_phone')} *</label>
                                <input type="tel" name="accused_bailer_phone_0" data-i18n-placeholder="phone_number_placeholder" placeholder="${t('phone_number_placeholder')}">
                            </div>
                            <div class="form-group">
                                <label data-i18n="relationship_to_accused">${t('relationship_to_accused')}</label>
                                <input type="text" name="accused_bailer_relationship_0" data-i18n-placeholder="relationship_placeholder" placeholder="${t('relationship_placeholder')}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label data-i18n="bailer_address">${t('bailer_address')}</label>
                            <input type="text" name="accused_bailer_address_0" data-i18n-placeholder="physical_address_placeholder" placeholder="${t('physical_address_placeholder')}">
                        </div>
                        
                        <div class="form-group">
                            <label>Bail Conditions</label>
                            <textarea name="accused_bail_conditions_0" rows="2" placeholder="Enter bail conditions..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Bail Amount (if applicable)</label>
                            <input type="number" name="accused_bail_amount_0" placeholder="Amount in local currency" step="0.01">
                        </div>
                    </div>
                </div>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;">
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button type="submit" class="btn btn-primary"><span data-i18n="save_as_draft">${t('save_as_draft')}</span></button>
                <button type="button" class="btn btn-success" onclick="submitOBEntry()"><span data-i18n="submit_case">${t('submit_case')}</span></button>
                <button type="button" class="btn btn-secondary" onclick="navigateToPage('my-cases')"><span data-i18n="cancel">${t('cancel')}</span></button>
            </div>
        </form>
    `);
    
    // Load categories from database
    // Disable submit button until categories load
    const submitBtn = $('.btn-success[onclick*="submitOBEntry"]');
    if (submitBtn.length) {
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');
    }
    
    // Load categories
    loadOBCategories().then(() => {
        // Re-enable submit button after categories load
        if (submitBtn.length) {
            submitBtn.prop('disabled', false).html('<span data-i18n="submit_case">' + t('submit_case') + '</span>');
        }
    });
    
    $('#obEntryForm').on('submit', function(e) {
        e.preventDefault();
        saveOBEntry('draft');
    });
}

// Counters for dynamic forms
let accuserCounter = 1;
let accusedCounter = 1;

// Add another accuser form
function addAccuserForm() {
    const index = accuserCounter++;
    const formHtml = `
        <div class="party-form-section" data-party-index="${index}" style="margin-top: 20px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; position: relative;">
            <button type="button" class="btn btn-sm btn-danger" onclick="removePartyForm(this)" style="position: absolute; top: 10px; right: 10px;">
                <i class="fas fa-times"></i> ${t('remove')}
            </button>
            <h4 style="color: #3b82f6; margin-bottom: 15px;">${t('accuser')} #${index + 1}</h4>
            <div class="form-row">
                <div class="form-group">
                    <label>${t('full_name')} *</label>
                    <input type="text" name="accuser_name_${index}" required placeholder="${t('full_name_accuser_placeholder')}">
                </div>
                <div class="form-group">
                    <label>${t('national_id')}</label>
                    <input type="text" name="accuser_id_${index}" placeholder="${t('national_id_placeholder')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>${t('phone')}</label>
                    <input type="tel" name="accuser_phone_${index}" placeholder="${t('phone_number_placeholder')}">
                </div>
                <div class="form-group">
                    <label>${t('gender')}</label>
                    <select name="accuser_gender_${index}">
                        <option value="">${t('select')}</option>
                        <option value="male">${t('male')}</option>
                        <option value="female">${t('female')}</option>
                        <option value="other">${t('other')}</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>${t('photo')}</label>
                <input type="file" name="accuser_photo_${index}" accept="image/*" class="form-control">
                <small style="color: #6b7280; display: block; margin-top: 5px;">${t('photo_upload_hint')}</small>
            </div>
            <div class="form-group">
                <label>${t('address')}</label>
                <input type="text" name="accuser_address_${index}" placeholder="${t('physical_address_placeholder')}">
            </div>
        </div>
    `;
    $('#accusersContainer').append(formHtml);
}

// Add another accused form
function addAccusedForm() {
    const index = accusedCounter++;
    const formHtml = `
        <div class="party-form-section" data-party-index="${index}" style="margin-top: 20px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; position: relative;">
            <button type="button" class="btn btn-sm btn-danger" onclick="removePartyForm(this)" style="position: absolute; top: 10px; right: 10px;">
                <i class="fas fa-times"></i> ${t('remove')}
            </button>
            <h4 style="color: #ef4444; margin-bottom: 15px;">${t('accused')} #${index + 1}</h4>
            <div class="form-row">
                <div class="form-group">
                    <label>${t('full_name')} *</label>
                    <input type="text" name="accused_name_${index}" required placeholder="${t('full_name_accused_placeholder')}">
                </div>
                <div class="form-group">
                    <label>${t('national_id')}</label>
                    <input type="text" name="accused_id_${index}" placeholder="${t('national_id_placeholder')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>${t('phone')}</label>
                    <input type="tel" name="accused_phone_${index}" placeholder="${t('phone_number_placeholder')}">
                </div>
                <div class="form-group">
                    <label>${t('gender')}</label>
                    <select name="accused_gender_${index}">
                        <option value="">${t('select')}</option>
                        <option value="male">${t('male')}</option>
                        <option value="female">${t('female')}</option>
                        <option value="other">${t('other')}</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>${t('address')}</label>
                <input type="text" name="accused_address_${index}" placeholder="${t('physical_address_placeholder')}">
            </div>
            <div class="form-group">
                <label>${t('photo')} (${t('optional')})</label>
                <input type="file" name="accused_photo_${index}" accept="image/*" onchange="previewPhoto(event, 'accused', ${index})">
                <small style="color: #6b7280; display: block; margin-top: 5px;">${t('upload_photo_accused')}</small>
                <div id="accused_photo_preview_${index}" style="margin-top: 10px; display: none;">
                    <img src="" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #e5e7eb;">
                </div>
            </div>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <h5 style="color: #1f2937; margin-bottom: 15px;"><i class="fas fa-user-lock"></i> ${t('custody_status')}</h5>
            
            <div class="form-group">
                <label>${t('custody_status')} *</label>
                <select name="accused_custody_status_${index}" onchange="toggleCustodyFields(${index})" required>
                    <option value="not_present">${t('not_present')}</option>
                    <option value="arrested">${t('arrested')}</option>
                    <option value="bailed">${t('bailed')}</option>
                </select>
            </div>
            
            <!-- Arrested Fields -->
            <div id="arrested_fields_${index}" style="display: none;">
                <div class="form-row">
                    <div class="form-group">
                        <label>${t('custody_location')}</label>
                        <input type="text" name="accused_custody_location_${index}" placeholder="${t('custody_location_placeholder')}">
                    </div>
                    <div class="form-group">
                        <label>${t('cell_number')}</label>
                        <input type="text" name="accused_cell_number_${index}" placeholder="${t('cell_number_placeholder')}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>${t('custody_notes')}</label>
                    <textarea name="accused_custody_notes_${index}" rows="2" placeholder="${t('custody_notes_placeholder')}"></textarea>
                </div>
            </div>
            
            <!-- Bailed Fields -->
            <div id="bailed_fields_${index}" style="display: none;">
                <h6 style="color: #3b82f6; margin: 15px 0 10px 0;"><i class="fas fa-user-tie"></i> ${t('bailer_information')}</h6>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>${t('bailer_full_name')} *</label>
                        <input type="text" name="accused_bailer_name_${index}" placeholder="${t('bailer_name_placeholder')}">
                    </div>
                    <div class="form-group">
                        <label>${t('bailer_national_id')}</label>
                        <input type="text" name="accused_bailer_id_${index}" placeholder="${t('national_id_placeholder')}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>${t('bailer_phone')} *</label>
                        <input type="tel" name="accused_bailer_phone_${index}" placeholder="${t('phone_number_placeholder')}">
                    </div>
                    <div class="form-group">
                        <label>${t('relationship_to_accused')}</label>
                        <input type="text" name="accused_bailer_relationship_${index}" placeholder="${t('relationship_placeholder')}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>${t('bailer_address')}</label>
                    <input type="text" name="accused_bailer_address_${index}" placeholder="${t('physical_address_placeholder')}">
                </div>
                
                <div class="form-group">
                    <label>${t('bail_conditions')}</label>
                    <textarea name="accused_bail_conditions_${index}" rows="2" placeholder="${t('bail_conditions_placeholder')}"></textarea>
                </div>
                
                <div class="form-group">
                    <label>${t('bail_amount')} (${t('if_applicable')})</label>
                    <input type="number" name="accused_bail_amount_${index}" placeholder="${t('bail_amount_placeholder')}" step="0.01">
                </div>
            </div>
        </div>
    `;
    $('#accusedContainer').append(formHtml);
}

// Remove party form
function removePartyForm(button) {
    $(button).closest('.party-form-section').remove();
}

// Toggle custody fields visibility based on status
function toggleCustodyFields(index) {
    const custodyStatus = $(`select[name="accused_custody_status_${index}"]`).val();
    const arrestedFields = $(`#arrested_fields_${index}`);
    const bailedFields = $(`#bailed_fields_${index}`);
    
    // Hide all fields first
    arrestedFields.hide();
    bailedFields.hide();
    
    // Show appropriate fields based on status
    if (custodyStatus === 'arrested') {
        arrestedFields.slideDown();
    } else if (custodyStatus === 'bailed') {
        bailedFields.slideDown();
    }
    // If 'not_present', both stay hidden
}

// Preview photo (unified for all parties)
function previewPhoto(event, partyType, index) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showError('File Too Large', 'Please select an image smaller than 5MB');
            event.target.value = '';
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showError('Invalid File Type', 'Please select a valid image file');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            $(`#${partyType}_photo_preview_${index} img`).attr('src', e.target.result);
            $(`#${partyType}_photo_preview_${index}`).show();
        };
        reader.readAsDataURL(file);
    } else {
        $(`#${partyType}_photo_preview_${index}`).hide();
    }
}

async function saveOBEntry(status) {
    const form = $('#obEntryForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Helper function to split name into first and last name
    function splitName(fullName) {
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) {
            return { first_name: parts[0], last_name: parts[0] };
        }
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        return { first_name: firstName, last_name: lastName };
    }
    
    // Extract all accusers with photos
    const accusers = [];
    let accuserIndex = 0;
    while (data[`accuser_name_${accuserIndex}`]) {
        const accuserName = splitName(data[`accuser_name_${accuserIndex}`]);
        const photoFile = formData.get(`accuser_photo_${accuserIndex}`);
        
        accusers.push({
            data: {
                person_type: 'accuser',
                first_name: accuserName.first_name,
                last_name: accuserName.last_name,
                national_id: data[`accuser_id_${accuserIndex}`] || null,
                phone: data[`accuser_phone_${accuserIndex}`] || null,
                gender: data[`accuser_gender_${accuserIndex}`] || null,
                address: data[`accuser_address_${accuserIndex}`] || null
            },
            photo: photoFile && photoFile.size > 0 ? photoFile : null
        });
        
        // Delete from case data
        delete data[`accuser_name_${accuserIndex}`];
        delete data[`accuser_id_${accuserIndex}`];
        delete data[`accuser_phone_${accuserIndex}`];
        delete data[`accuser_gender_${accuserIndex}`];
        delete data[`accuser_address_${accuserIndex}`];
        
        accuserIndex++;
    }
    
    // Extract all accused with photos, custody status, and bailer info
    const accused = [];
    let accusedIndex = 0;
    while (data[`accused_name_${accusedIndex}`]) {
        const accusedName = splitName(data[`accused_name_${accusedIndex}`]);
        const photoFile = formData.get(`accused_photo_${accusedIndex}`);
        const custodyStatus = data[`accused_custody_status_${accusedIndex}`];
        
        const accusedItem = {
            data: {
                person_type: 'accused',
                first_name: accusedName.first_name,
                last_name: accusedName.last_name,
                national_id: data[`accused_id_${accusedIndex}`] || null,
                phone: data[`accused_phone_${accusedIndex}`] || null,
                gender: data[`accused_gender_${accusedIndex}`] || null,
                address: data[`accused_address_${accusedIndex}`] || null
            },
            photo: photoFile && photoFile.size > 0 ? photoFile : null,
            custodyStatus: custodyStatus
        };
        
        // Add arrested-specific data
        if (custodyStatus === 'arrested') {
            accusedItem.custody = {
                custody_location: data[`accused_custody_location_${accusedIndex}`] || 'Station Lock-up',
                cell_number: data[`accused_cell_number_${accusedIndex}`] || null,
                custody_notes: data[`accused_custody_notes_${accusedIndex}`] || null
            };
        }
        
        // Add bailer data if bailed
        if (custodyStatus === 'bailed') {
            const bailerName = data[`accused_bailer_name_${accusedIndex}`];
            if (bailerName) {
                const bailerNameParts = splitName(bailerName);
                accusedItem.bailer = {
                    first_name: bailerNameParts.first_name,
                    last_name: bailerNameParts.last_name,
                    national_id: data[`accused_bailer_id_${accusedIndex}`] || null,
                    phone: data[`accused_bailer_phone_${accusedIndex}`] || null,
                    relationship: data[`accused_bailer_relationship_${accusedIndex}`] || null,
                    address: data[`accused_bailer_address_${accusedIndex}`] || null
                };
                accusedItem.bailInfo = {
                    bail_conditions: data[`accused_bail_conditions_${accusedIndex}`] || null,
                    bail_amount: data[`accused_bail_amount_${accusedIndex}`] || null
                };
            }
        }
        
        accused.push(accusedItem);
        
        // Delete from case data
        delete data[`accused_name_${accusedIndex}`];
        delete data[`accused_id_${accusedIndex}`];
        delete data[`accused_phone_${accusedIndex}`];
        delete data[`accused_gender_${accusedIndex}`];
        delete data[`accused_address_${accusedIndex}`];
        delete data[`accused_photo_${accusedIndex}`];
        delete data[`accused_custody_status_${accusedIndex}`];
        delete data[`accused_custody_location_${accusedIndex}`];
        delete data[`accused_cell_number_${accusedIndex}`];
        delete data[`accused_custody_notes_${accusedIndex}`];
        delete data[`accused_bailer_name_${accusedIndex}`];
        delete data[`accused_bailer_id_${accusedIndex}`];
        delete data[`accused_bailer_phone_${accusedIndex}`];
        delete data[`accused_bailer_relationship_${accusedIndex}`];
        delete data[`accused_bailer_address_${accusedIndex}`];
        delete data[`accused_bail_conditions_${accusedIndex}`];
        delete data[`accused_bail_amount_${accusedIndex}`];
        
        accusedIndex++;
    }
    
    data.status = status;
    data.is_sensitive = data.is_sensitive ? 1 : 0;
    
    console.log('Submitting case data:', data);
    console.log('Accusers:', accusers);
    console.log('Accused:', accused);
    
    try {
        showLoading('Creating Case', 'Please wait...');
        
        // Step 1: Create the case
        const caseResponse = await obAPI.createCase(data);
        if (caseResponse.status === 'success') {
            const caseId = caseResponse.data.id;
            
            // Step 2: Create all accuser person records with photos
            for (const accuserItem of accusers) {
                accuserItem.data.case_id = caseId;
                
                // If there's a photo, send as FormData
                if (accuserItem.photo) {
                    const accuserFormData = new FormData();
                    Object.keys(accuserItem.data).forEach(key => {
                        if (accuserItem.data[key] !== null) {
                            accuserFormData.append(key, accuserItem.data[key]);
                        }
                    });
                    accuserFormData.append('photo', accuserItem.photo);
                    
                    // Send as multipart/form-data
                    await api.upload(API_ENDPOINTS.PERSONS, accuserFormData);
                } else {
                    // Send as JSON
                    await obAPI.createPerson(accuserItem.data);
                }
            }
            
            // Step 3: Create all accused person records with photos, custody, and bailer records
            for (const accusedItem of accused) {
                accusedItem.data.case_id = caseId;
                
                let personResponse;
                
                // If there's a photo, send as FormData
                if (accusedItem.photo) {
                    const accusedFormData = new FormData();
                    Object.keys(accusedItem.data).forEach(key => {
                        if (accusedItem.data[key] !== null) {
                            accusedFormData.append(key, accusedItem.data[key]);
                        }
                    });
                    accusedFormData.append('photo', accusedItem.photo);
                    
                    // Send as multipart/form-data
                    personResponse = await api.upload(API_ENDPOINTS.PERSONS, accusedFormData);
                } else {
                    // Send as JSON
                    personResponse = await obAPI.createPerson(accusedItem.data);
                }
                
                if (personResponse.status === 'success') {
                    const personId = personResponse.data.id;
                    
                    console.log('Person created. ID:', personId, 'Custody Status:', accusedItem.custodyStatus);
                    
                    // Handle custody based on status
                    if (accusedItem.custodyStatus === 'arrested') {
                        console.log('Creating custody record for arrested accused...');
                        console.log('Custody data:', accusedItem.custody);
                        
                        // Create custody record for arrested accused
                        const custodyData = {
                            case_id: caseId,
                            person_id: personId,
                            custody_status: 'in_custody',
                            custody_location: accusedItem.custody.custody_location || 'Station Lock-up',
                            custody_start: new Date().toISOString().slice(0, 19).replace('T', ' '),
                            cell_number: accusedItem.custody.cell_number || null,
                            custody_notes: accusedItem.custody.custody_notes || null
                        };
                        
                        console.log('Sending custody data:', custodyData);
                        
                        try {
                            const custodyResponse = await obAPI.createCustody(custodyData);
                            console.log('Custody creation response:', custodyResponse);
                            if (custodyResponse.status === 'success') {
                                console.log('âœ… Custody record created successfully!');
                            }
                        } catch (error) {
                            console.error('âŒ Failed to create custody record:', error);
                            // Show error to user
                            await showError('Warning', `Person created but custody record failed: ${error.message}`);
                        }
                    } else if (accusedItem.custodyStatus === 'bailed' && accusedItem.bailer) {
                        // Create bailer person record
                        const bailerData = {
                            person_type: 'other', // Bailer is categorized as 'other'
                            first_name: accusedItem.bailer.first_name,
                            last_name: accusedItem.bailer.last_name,
                            national_id: accusedItem.bailer.national_id,
                            phone: accusedItem.bailer.phone,
                            address: accusedItem.bailer.address,
                            case_id: caseId
                        };
                        
                        try {
                            const bailerResponse = await obAPI.createPerson(bailerData);
                            
                            if (bailerResponse.status === 'success') {
                                const bailerId = bailerResponse.data.id;
                                
                                // Create custody record for bailed accused
                                const custodyData = {
                                    case_id: caseId,
                                    person_id: personId,
                                    custody_status: 'released',
                                    custody_start: new Date().toISOString().slice(0, 19).replace('T', ' '),
                                    custody_end: new Date().toISOString().slice(0, 19).replace('T', ' '),
                                    custody_notes: `Bailed by: ${accusedItem.bailer.first_name} ${accusedItem.bailer.last_name}\n` +
                                                   `Relationship: ${accusedItem.bailer.relationship || 'N/A'}\n` +
                                                   `Bail Amount: ${accusedItem.bailInfo.bail_amount || 'N/A'}\n` +
                                                   `Bail Conditions: ${accusedItem.bailInfo.bail_conditions || 'None specified'}`
                                };
                                
                                console.log('About to create custody with data:', custodyData);
            const custodyCreateResponse = await obAPI.createCustody(custodyData);
            console.log('Custody creation response:', custodyCreateResponse);
                            }
                        } catch (error) {
                            console.error('Failed to create bailer or custody record:', error);
                        }
                    }
                    // If custodyStatus is 'not_present', no custody record is created
                }
            }
            
            // Step 5: Save case relationships if any
            if (selectedRelatedCases.length > 0) {
                for (const relatedCaseId of selectedRelatedCases) {
                    try {
                        await obAPI.addCaseRelationship(caseId, {
                            related_case_id: relatedCaseId,
                            relationship_type: 'related'
                        });
                    } catch (error) {
                        console.error('Failed to link case:', error);
                    }
                }
            }
            
            closeAlert();
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                html: status === 'draft' ? 'Case saved as draft with parties' : 'Case submitted successfully. Admin can now assign investigator.' + 
                      (selectedRelatedCases.length > 0 ? `<br><small>${selectedRelatedCases.length} related case(s) linked</small>` : ''),
                confirmButtonColor: '#10b981'
            });
            
            // Clear selected related cases
            selectedRelatedCases = [];
            
            navigateToPage('my-cases');
        }
    } catch (error) {
        closeAlert();
        console.error('Case creation error:', error);
        
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
                title: 'Validation Error',
                html: errorText.replace(/\n/g, '<br>'),
                confirmButtonColor: '#ef4444'
            });
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to save case',
                confirmButtonColor: '#ef4444'
            });
        }
    }
}

/**
 * Load categories from database for OB Entry form
 */
async function loadOBCategories() {
    try {
        // Use the correct endpoint based on user role
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const userRole = userData.role;
        
        // Choose the appropriate endpoint
        let endpoint = '/ob/categories'; // Default for OB officers
        if (userRole === 'admin' || userRole === 'super_admin') {
            endpoint = '/admin/categories';
        } else if (userRole === 'investigator') {
            endpoint = '/investigation/categories';
        }
        
        const response = await api.get(endpoint);
        
        if (response.status === 'success' && response.data) {
            const categorySelect = $('#ob_crime_category');
            
            // Clear existing options except the first one (Select Category)
            categorySelect.find('option:not(:first)').remove();
            
            // Add categories from database
            response.data.forEach(category => {
                if (category.is_active == 1) {
                    const currentLang = LanguageManager.currentLanguage || 'en';
                    let categoryName;
                    
                    if (currentLang === 'so') {
                        // Somali: try name_so, then name_en, then name, then slug
                        categoryName = category.name_so || category.name_en || category.name || category.slug;
                    } else {
                        // English: try name_en, then name, then slug
                        categoryName = category.name_en || category.name || category.slug;
                    }
                    
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
        console.log('Using default categories');
        // Keep the default hardcoded categories if API fails
    }
}

async function submitOBEntry() {
    const result = await showConfirm('Submit Case?', 'Submit this case? It will be ready for investigator assignment.', 'Yes, submit');
    if (result.isConfirmed) {
        saveOBEntry('submitted');
    }
}


// My Cases Page
function loadMyCasesPage() {
    setPageTitle('my_cases');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px;">
            <button class="btn btn-primary" onclick="loadOBEntryPage()">
                <i class="fas fa-plus"></i> ${t('create_new_case')}
            </button>
        </div>
        <div id="myCasesTable">${t('loading_cases')}</div>
    `);
    
    loadMyCasesTable();
}

async function loadMyCasesTable() {
    try {
        const response = await obAPI.getCases();
        if (response.status === 'success') {
            const cases = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="ob_number">${t('ob_number')}</th>
                            <th data-i18n="crime_type">${t('crime_type')}</th>
                            <th data-i18n="incident_date">${t('incident_date')}</th>
                            <th data-i18n="priority">${t('priority')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (cases.length === 0) {
                html += `<tr><td colspan="7" style="text-align: center;">${t('no_cases_found')}. ${t('click_to_get_started')}.</td></tr>`;
            } else {
                cases.forEach(caseItem => {
                    html += `
                        <tr>
                            <td><strong>${caseItem.case_number}</strong></td>
                            <td>${caseItem.ob_number}</td>
                            <td>${caseItem.crime_type}</td>
                            <td>${new Date(caseItem.incident_date).toLocaleDateString()}</td>
                            <td>${getPriorityBadge(caseItem.priority)}</td>
                            <td>${getStatusBadge(caseItem.status)}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="viewCaseDetails(${caseItem.id})">${t('view')}</button>
                                ${(caseItem.status === 'draft' || caseItem.status === 'returned') ? '<button class="btn btn-sm btn-primary" onclick="editCase(' + caseItem.id + ')">' + t('edit') + '</button>' : ''}
                                ${(caseItem.status === 'draft' || caseItem.status === 'returned') ? '<button class="btn btn-sm btn-success" onclick="submitCase(' + caseItem.id + ')">' + t('submit') + '</button>' : ''}
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#myCasesTable').html(html);
        }
    } catch (error) {
        $('#myCasesTable').html('<div class="alert alert-error">' + t('failed_load_cases') + ': ' + error.message + '</div>');
    }
}

async function editCase(caseId) {
    try {
        const response = await obAPI.getCase(caseId);
        if (response.status === 'success') {
            const caseData = response.data;
            
            const bodyHtml = `
                <form id="editCaseForm" style="max-height: 70vh; overflow-y: auto;">
                    <h3 data-i18n="case_information">${t('case_information')}</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="crime_type">${t('crime_type')} *</label>
                            <input type="text" name="crime_type" value="${caseData.crime_type}" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="crime_category">${t('crime_category')} *</label>
                            <select name="crime_category" id="edit_crime_category" required>
                                <option value="">Loading categories...</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label data-i18n="priority">${t('priority')} *</label>
                            <select name="priority" required>
                                <option value="low" ${caseData.priority === 'low' ? 'selected' : ''} data-i18n="priority_low">${t('priority_low')}</option>
                                <option value="medium" ${caseData.priority === 'medium' ? 'selected' : ''} data-i18n="priority_medium">${t('priority_medium')}</option>
                                <option value="high" ${caseData.priority === 'high' ? 'selected' : ''} data-i18n="priority_high">${t('priority_high')}</option>
                                <option value="critical" ${caseData.priority === 'critical' ? 'selected' : ''} data-i18n="priority_critical">${t('priority_critical')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label data-i18n="incident_date">${t('incident_date')} *</label>
                            <input type="datetime-local" name="incident_date" value="${caseData.incident_date ? caseData.incident_date.substring(0, 16) : ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="incident_location">${t('incident_location')} *</label>
                        <input type="text" name="incident_location" value="${caseData.incident_location}" required>
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="description">${t('description')} *</label>
                        <textarea name="incident_description" rows="5" required>${caseData.incident_description}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="is_sensitive" ${caseData.is_sensitive ? 'checked' : ''}> Mark as Sensitive Case
                        </label>
                    </div>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 2px solid #e5e7eb;">
                    
                    <h3 data-i18n="case_parties">${t('case_parties')}</h3>
                    ${caseData.parties && caseData.parties.length > 0 ? `
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${caseData.parties.map((party, index) => `
                                <div style="padding: 15px; border: 2px solid ${party.party_role === 'accuser' ? '#3b82f6' : '#ef4444'}; border-radius: 8px; margin-bottom: 10px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <strong style="color: ${party.party_role === 'accuser' ? '#3b82f6' : '#ef4444'};">${party.party_role.toUpperCase()}</strong>
                                        <button type="button" class="btn btn-sm btn-danger" onclick="removePartyFromCase(${party.id}, ${caseId})">
                                            <i class="fas fa-trash"></i> <span data-i18n="remove">${t('remove')}</span>
                                        </button>
                                    </div>
                                    <p><strong data-i18n="name">${t('name')}:</strong> ${party.first_name} ${party.last_name}</p>
                                    <p><strong data-i18n="national_id">${t('national_id')}:</strong> ${party.national_id || 'N/A'} | <strong data-i18n="phone">${t('phone')}:</strong> ${party.phone || 'N/A'}</p>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="addMoreParties(${caseId})">
                            <i class="fas fa-plus"></i> <span data-i18n="add_more_parties">${t('add_more_parties')}</span>
                        </button>
                    ` : `<p class="alert alert-info" data-i18n="no_parties_added">${t('no_parties_added')}</p>`}
                </form>
            `;
            
            showModal(t('edit_case_title'), bodyHtml, [
                { text: t('cancel'), class: 'btn btn-secondary', onclick: 'closeModal()' },
                { text: t('save_changes'), class: 'btn btn-primary', onclick: `submitEditCase(${caseId})` }
            ], 'large');
            
            // Load dynamic categories after modal is shown
            await loadEditCaseCategories(caseData.crime_category);
        }
    } catch (error) {
        await showError(t('error'), t('failed_to_load_case') + ': ' + error.message);
    }
}

/**
 * Load dynamic categories for edit case modal
 */
async function loadEditCaseCategories(selectedCategory) {
    try {
        const response = await api.get('/ob/categories');
        
        if (response.status === 'success' && response.data) {
            const categorySelect = document.getElementById('edit_crime_category');
            
            if (!categorySelect) {
                console.error('Edit category select not found');
                return;
            }
            
            // Clear existing options
            categorySelect.innerHTML = '';
            
            // Add a default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = t('select_category') || 'Select Category';
            categorySelect.appendChild(defaultOption);
            
            // Add categories from database
            response.data.forEach(category => {
                if (category.is_active == 1) {
                    const categoryName = category.name || '';
                    
                    if (categoryName && categoryName !== 'undefined') {
                        const option = document.createElement('option');
                        option.value = categoryName;
                        option.textContent = categoryName;
                        
                        // Select the current category
                        if (categoryName === selectedCategory) {
                            option.selected = true;
                        }
                        
                        categorySelect.appendChild(option);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading categories for edit modal:', error);
        // Keep the default "Loading categories..." option if API fails
    }
}

async function removePartyFromCase(partyId, caseId) {
    const result = await showConfirm(t('remove_party'), t('remove_party_confirm'), t('yes_remove'));
    if (result.isConfirmed) {
        try {
            // Call API to remove party
            // For now, just reload the edit form
            await showSuccess(t('success'), t('party_removed_success'));
            closeModal();
            editCase(caseId);
        } catch (error) {
            await showError('Error', 'Failed to remove party: ' + error.message);
        }
    }
}

function addMoreParties(caseId) {
    closeModal();
    showAddPartiesModal(caseId);
}

async function submitEditCase(caseId) {
    const form = $('#editCaseForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.is_sensitive = data.is_sensitive ? 1 : 0;
    
    try {
        showLoading(t('updating_case'), t('please_wait'));
        const response = await obAPI.updateCase(caseId, data);
        
        closeAlert();
        if (response.status === 'success') {
            await showSuccess(t('success'), t('case_updated_success'));
            closeModal();
            loadMyCasesTable();
        }
    } catch (error) {
        closeAlert();
        console.error('Case update error:', error);
        
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
            await showError(t('error'), t('case_update_failed') + ': ' + error.message);
        }
    }
}

// OLD editCase function that was incomplete:
async function editCaseOld(caseId) {
    try {
        const response = await obAPI.getCase(caseId);
        if (response.status === 'success') {
            const caseData = response.data;
            
            // Redirect to OB Entry page with pre-filled data
            // For now, show a simplified edit modal
            const bodyHtml = `
                <form id="editCaseFormOld">
                    <div class="form-group">
                        <label>Crime Type</label>
                        <input type="text" name="crime_type" value="${caseData.crime_type}" required>
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select name="priority" required>
                            <option value="low" ${caseData.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${caseData.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${caseData.priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="critical" ${caseData.priority === 'critical' ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Incident Location</label>
                        <input type="text" name="incident_location" value="${caseData.incident_location}" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="incident_description" rows="5" required>${caseData.incident_description}</textarea>
                    </div>
                </form>
            `;
            
            showModal('Edit Case', bodyHtml, [
                { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
                { text: 'Save Changes', class: 'btn btn-primary', onclick: `submitEditCase(${caseId})` }
            ]);
        }
    } catch (error) {
        alert('Failed to load case for editing: ' + error.message);
    }
}

async function submitEditCase(caseId) {
    const form = $('#editCaseForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await obAPI.updateCase(caseId, data);
        if (response.status === 'success') {
            await showSuccess('Success!', 'Case updated successfully!');
            closeModal();
            loadMyCasesTable();
        }
    } catch (error) {
        await showError('Error', 'Failed to update case: ' + error.message);
    }
}

function showAddPartiesModal(caseId) {
    const bodyHtml = `
        <form id="addPartiesForm">
            <h3>Add Accuser</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="accuser_name" required placeholder="Full name">
                </div>
                <div class="form-group">
                    <label>National ID</label>
                    <input type="text" name="accuser_id" placeholder="National ID number">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" name="accuser_phone" placeholder="Phone number">
                </div>
                <div class="form-group">
                    <label>Gender</label>
                    <select name="accuser_gender">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Address</label>
                <input type="text" name="accuser_address" placeholder="Physical address">
            </div>
            
            <h3 style="margin-top: 30px;">Add Accused</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="accused_name" required placeholder="Full name">
                </div>
                <div class="form-group">
                    <label>National ID</label>
                    <input type="text" name="accused_id" placeholder="National ID number">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" name="accused_phone" placeholder="Phone number">
                </div>
                <div class="form-group">
                    <label>Gender</label>
                    <select name="accused_gender">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Address</label>
                <input type="text" name="accused_address" placeholder="Physical address">
            </div>
        </form>
    `;
    
    showModal('Add Case Parties', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Save Parties', class: 'btn btn-primary', onclick: `submitAddParties(${caseId})` }
    ]);
}

async function submitAddParties(caseId) {
    const form = $('#addPartiesForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        showLoading('Adding Parties', 'Please wait...');
        
        // Create accuser person record
        const accuserData = {
            full_name: data.accuser_name,
            national_id: data.accuser_id,
            phone: data.accuser_phone,
            gender: data.accuser_gender,
            address: data.accuser_address
        };
        
        const accuserResponse = await obAPI.createPerson(accuserData);
        const accuserId = accuserResponse.data.id;
        
        // Create accused person record
        const accusedData = {
            full_name: data.accused_name,
            national_id: data.accused_id,
            phone: data.accused_phone,
            gender: data.accused_gender,
            address: data.accused_address
        };
        
        const accusedResponse = await obAPI.createPerson(accusedData);
        const accusedId = accusedResponse.data.id;
        
        // Add both as case parties
        await obAPI.addCaseParty(caseId, {
            person_id: accuserId,
            party_role: 'accuser',
            is_primary: 1
        });
        
        await obAPI.addCaseParty(caseId, {
            person_id: accusedId,
            party_role: 'accused',
            is_primary: 1
        });
        
        closeAlert();
        await showSuccess('Success!', 'Parties added successfully! You can now submit the case.');
        closeModal();
        loadMyCasesTable();
    } catch (error) {
        closeAlert();
        await showError('Error', 'Failed to add parties: ' + error.message);
    }
}

async function submitCase(caseId) {
    const result = await showConfirm('Submit Case?', 'Submit this case for approval?', 'Yes, submit');
    if (result.isConfirmed) {
        try {
            const response = await obAPI.submitCase(caseId);
            if (response.status === 'success') {
                await showSuccess('Success!', 'Case submitted successfully!');
                loadMyCasesTable();
            }
        } catch (error) {
            console.error('Submit case error:', error);
            
            // Handle validation errors
            if (error.status === 400 && error.response && error.response.messages) {
                const messages = error.response.messages;
                let errorText = '';
                
                // Format validation errors
                if (typeof messages === 'object' && messages.error) {
                    errorText = messages.error;
                } else if (typeof messages === 'object') {
                    errorText = Object.values(messages).join('\n');
                } else {
                    errorText = messages;
                }
                
                await Swal.fire({
                    icon: 'warning',
                    title: 'Cannot Submit Case',
                    html: errorText + '<br><br>Please add accuser and/or accused information first.',
                    confirmButtonColor: '#f59e0b',
                    confirmButtonText: 'Add Parties'
                }).then((result) => {
                    if (result.isConfirmed) {
                        showAddPartiesModal(caseId);
                    }
                });
            } else {
                await showError('Error', 'Failed to submit case: ' + error.message);
            }
        }
    }
}

// Investigations Page
/**
 * Load Report Settings Page
 */
function loadReportSettingsPage() {
    setPageTitle('report_settings');
    
    const content = `
        <div class="page-header">
            <h2>Report Settings</h2>
            <p>Customize the header image and report text sections for full and basic reports</p>
        </div>
        
        <div class="settings-container" style="max-width: 1200px; margin: 0 auto;"
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-image"></i> Report Header Image</h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: start;">
                        <div>
                            <div id="headerImagePreview" style="width: 100%; aspect-ratio: 2.5/1; border: 2px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f9f9f9; overflow: hidden;">
                                <div style="text-align: center; color: #999;">
                                    <i class="fas fa-image" style="font-size: 48px; margin-bottom: 10px;"></i>
                                    <p>No header image uploaded</p>
                                    <small>Upload a full-width banner to see preview</small>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 15px;">Upload Report Header Image</h4>
                            <p style="color: #666; margin-bottom: 15px;">This image will appear as the full-width header on all generated reports. Include your logo, agency name, and all necessary information in the image. Recommended size: 2100x400px (full width banner).</p>
                            
                            <div class="form-group">
                                <label>Choose Header Image:</label>
                                <input type="file" id="headerImageInput" accept="image/*" class="form-control">
                                <small class="form-text text-muted">Supported formats: JPG, PNG (Max 2MB). Create a banner image with your logo, agency name, and contact information.</small>
                            </div>
                            
                            <div style="margin-top: 20px;">
                                <button class="btn btn-primary" onclick="uploadHeaderImage()">
                                    <i class="fas fa-upload"></i> Upload Header Image
                                </button>
                                <button class="btn btn-danger" onclick="removeHeaderImage()" id="removeHeaderBtn" style="display: none;">
                                    <i class="fas fa-trash"></i> Remove Header Image
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            
            <div class="card" style="margin-top: 30px;">
                <div class="card-header">
                    <h3><i class="fas fa-info-circle"></i> Instructions</h3>
                </div>
                <div class="card-body">
                    <h4>How to Create Your Header Image:</h4>
                    <ol style="line-height: 2;">
                        <li>Create a banner image in your preferred design software (Photoshop, Canva, etc.)</li>
                        <li><strong>Recommended size:</strong> 2100 x 400 pixels (full width banner)</li>
                        <li>Include in your header image:
                            <ul>
                                <li>Your agency logo/badge</li>
                                <li>Agency name in both Somali and English</li>
                                <li>Department name</li>
                                <li>Location/address</li>
                                <li>Contact information (phone, email)</li>
                            </ul>
                        </li>
                        <li>Save as JPG or PNG format</li>
                        <li>Upload using the button above</li>
                    </ol>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #0288d1; border-radius: 4px;">
                        <p style="margin: 0;"><strong><i class="fas fa-lightbulb"></i> Tip:</strong> The header image will appear at the top of every generated report. Make sure it looks professional and includes all necessary information.</p>
                    </div>
                </div>
            </div>
        </div>
            
            <!-- Report Text Sections - Three Column Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 30px;">
                <!-- Full Report Text Sections -->
                <div class="card">
                    <div class="card-header" style="background: #0d6efd; color: white;">
                        <h4 style="margin: 0;"><i class="fas fa-file-alt"></i> Full Report Text Sections</h4>
                        <small>For Final, Court Submission reports</small>
                    </div>
                    <div class="card-body">
                        <form id="fullReportTextForm">
                            <div class="form-group mb-3">
                                <label><strong>Statement 1</strong> (After case numbers)</label>
                                <textarea class="form-control" id="fullStatement1" rows="3" placeholder="Enter statement for full reports"></textarea>
                                <small class="text-muted">Appears after case/OB numbers</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Statement 2</strong> (Below Statement 1)</label>
                                <textarea class="form-control" id="fullStatement2" rows="3" placeholder="Enter second statement"></textarea>
                                <small class="text-muted">Appears below Statement 1</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Statement 3</strong> (Before report sections)</label>
                                <textarea class="form-control" id="fullStatement3" rows="3" placeholder="Enter statement before content"></textarea>
                                <small class="text-muted">Appears before main report content</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Footer Text</strong> (Signature Section)</label>
                                <textarea class="form-control" id="fullFooterText" rows="5" placeholder="Enter footer with signature lines"></textarea>
                                <small class="text-muted">Include signature lines for officers</small>
                            </div>
                            
                            <button type="button" class="btn btn-primary w-100" onclick="saveReportText('full')">
                                <i class="fas fa-save"></i> Save Full Report Text
                            </button>
                        </form>
                    </div>
                </div>
                
                <!-- Basic Report Text Sections -->
                <div class="card">
                    <div class="card-header" style="background: #198754; color: white;">
                        <h4 style="margin: 0;"><i class="fas fa-file"></i> Basic Report Text Sections</h4>
                        <small>For Preliminary, Interim reports</small>
                    </div>
                    <div class="card-body">
                        <form id="basicReportTextForm">
                            <div class="form-group mb-3">
                                <label><strong>Statement 1</strong> (After case numbers)</label>
                                <textarea class="form-control" id="basicStatement1" rows="3" placeholder="Enter statement for basic reports"></textarea>
                                <small class="text-muted">Appears after case/OB numbers</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Statement 2</strong> (Below Statement 1)</label>
                                <textarea class="form-control" id="basicStatement2" rows="3" placeholder="Enter second statement"></textarea>
                                <small class="text-muted">Appears below Statement 1</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Statement 3</strong> (Before report sections)</label>
                                <textarea class="form-control" id="basicStatement3" rows="3" placeholder="Enter statement before content"></textarea>
                                <small class="text-muted">Appears before main report content</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Footer Text</strong> (Signature Section)</label>
                                <textarea class="form-control" id="basicFooterText" rows="5" placeholder="Enter footer with signature lines"></textarea>
                                <small class="text-muted">Include signature lines for officers</small>
                            </div>
                            
                            <button type="button" class="btn btn-success w-100" onclick="saveReportText('basic')">
                                <i class="fas fa-save"></i> Save Basic Report Text
                            </button>
                        </form>
                    </div>
                </div>
                
                <!-- Customized Report Text Sections -->
                <div class="card">
                    <div class="card-header" style="background: #fd7e14; color: white;">
                        <h4 style="margin: 0;"><i class="fas fa-sliders-h"></i> Customized Report Text Sections</h4>
                        <small>For Custom/Selective reports</small>
                    </div>
                    <div class="card-body">
                        <form id="customReportTextForm">
                            <div class="form-group mb-3">
                                <label><strong>Statement 1</strong> (After case numbers)</label>
                                <textarea class="form-control" id="customStatement1" rows="3" placeholder="Enter statement for custom reports"></textarea>
                                <small class="text-muted">Appears after case/OB numbers</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Statement 2</strong> (Below Statement 1)</label>
                                <textarea class="form-control" id="customStatement2" rows="3" placeholder="Enter second statement"></textarea>
                                <small class="text-muted">Appears below Statement 1</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Statement 3</strong> (Before report sections)</label>
                                <textarea class="form-control" id="customStatement3" rows="3" placeholder="Enter statement before content"></textarea>
                                <small class="text-muted">Appears before main report content</small>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label><strong>Footer Text</strong> (Signature Section)</label>
                                <textarea class="form-control" id="customFooterText" rows="5" placeholder="Enter footer with signature lines"></textarea>
                                <small class="text-muted">Include signature lines for officers</small>
                            </div>
                            
                            <button type="button" class="btn btn-warning w-100" onclick="saveReportText('custom')">
                                <i class="fas fa-save"></i> Save Custom Report Text
                            </button>
                        </form>
                    </div>
                </div>
            </div>
    `;
    
    $('#pageContent').html(content);
    
    loadCurrentSettings();
    
    // Handle file input change
    $('#headerImageInput').on('change', function() {
        previewSelectedImage(this);
    });
}

/**
 * Load current settings from database
 */
async function loadCurrentSettings() {
    try {
        const response = await fetch('/api/report-settings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            const settings = result.data;
            
            // Load header image
            if (settings.header_image) {
                const imageUrl = `/uploads/${settings.header_image}`;
                $('#headerImagePreview').html(`<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: contain;" />`);
                $('#removeHeaderBtn').show();
            }
            
            // Load full report statements
            if (settings.full_statement1) $('#fullStatement1').val(settings.full_statement1);
            if (settings.full_statement2) $('#fullStatement2').val(settings.full_statement2);
            if (settings.full_statement3) $('#fullStatement3').val(settings.full_statement3);
            if (settings.full_footer_text) $('#fullFooterText').val(settings.full_footer_text);
            
            // Load basic report statements
            if (settings.basic_statement1) $('#basicStatement1').val(settings.basic_statement1);
            if (settings.basic_statement2) $('#basicStatement2').val(settings.basic_statement2);
            if (settings.basic_statement3) $('#basicStatement3').val(settings.basic_statement3);
            if (settings.basic_footer_text) $('#basicFooterText').val(settings.basic_footer_text);
            
            // Load customized report statements
            if (settings.custom_statement1) $('#customStatement1').val(settings.custom_statement1);
            if (settings.custom_statement2) $('#customStatement2').val(settings.custom_statement2);
            if (settings.custom_statement3) $('#customStatement3').val(settings.custom_statement3);
            if (settings.custom_footer_text) $('#customFooterText').val(settings.custom_footer_text);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        // Fall back to localStorage for backward compatibility
        const localSettings = JSON.parse(localStorage.getItem('reportSettings') || '{}');
        if (localSettings.headerImage) {
            $('#headerImagePreview').html(`<img src="${localSettings.headerImage}" style="width: 100%; height: 100%; object-fit: contain;" />`);
            $('#removeHeaderBtn').show();
        }
        // Load from localStorage as fallback
        if (localSettings.statement1) {
            $('#fullStatement1').val(localSettings.statement1);
            $('#basicStatement1').val(localSettings.statement1);
        }
        if (localSettings.statement2) {
            $('#fullStatement2').val(localSettings.statement2);
            $('#basicStatement2').val(localSettings.statement2);
        }
        if (localSettings.statement3) {
            $('#fullStatement3').val(localSettings.statement3);
            $('#basicStatement3').val(localSettings.statement3);
        }
        if (localSettings.footerText) {
            $('#fullFooterText').val(localSettings.footerText);
            $('#basicFooterText').val(localSettings.footerText);
        }
    }
}

/**
 * Preview selected image
 */
function previewSelectedImage(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Check file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            showError('Error', 'File size must be less than 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#headerImagePreview').html(`<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;" />`);
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Upload header image to database
 */
async function uploadHeaderImage() {
    const fileInput = document.getElementById('headerImageInput');
    if (!fileInput.files || !fileInput.files[0]) {
        await showError('Error', 'Please select an image file first');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        await showError('Error', 'File size must be less than 2MB');
        return;
    }
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('header_image', file);
    
    try {
        const response = await fetch('/api/report-settings/upload-header', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const imageUrl = result.data.image_url;
            $('#headerImagePreview').html(`<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: contain;" />`);
            $('#removeHeaderBtn').show();
            await showSuccess('Success', 'Header image uploaded successfully!');
            
            // Clear file input
            fileInput.value = '';
        } else {
            await showError('Error', result.message || 'Failed to upload image');
        }
    } catch (error) {
        console.error('Upload error:', error);
        await showError('Error', 'Failed to upload image. Please try again.');
    }
}

/**
 * Remove header image from database
 */
async function removeHeaderImage() {
    const result = await showConfirm('Remove Header Image?', 'Are you sure you want to remove the header image?', 'Yes, remove');
    if (result.isConfirmed) {
        try {
            const response = await fetch('/api/report-settings/header_image', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    value: null,
                    type: 'image'
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                $('#headerImagePreview').html(`
                    <div style="text-align: center; color: #999;">
                        <i class="fas fa-image" style="font-size: 48px; margin-bottom: 10px;"></i>
                        <p>No header image uploaded</p>
                        <small>Upload a full-width banner to see preview</small>
                    </div>
                `);
                $('#removeHeaderBtn').hide();
                $('#headerImageInput').val('');
                
                await showSuccess('Success', 'Header image removed successfully!');
            } else {
                await showError('Error', 'Failed to remove header image');
            }
        } catch (error) {
            console.error('Remove error:', error);
            await showError('Error', 'Failed to remove header image. Please try again.');
        }
    }
}

/**
 * Save report text sections to database
 */
async function saveReportText(type) {
    let data = {};
    
    if (type === 'full') {
        data = {
            full_statement1: $('#fullStatement1').val(),
            full_statement2: $('#fullStatement2').val(),
            full_statement3: $('#fullStatement3').val(),
            full_footer_text: $('#fullFooterText').val()
        };
    } else if (type === 'basic') {
        data = {
            basic_statement1: $('#basicStatement1').val(),
            basic_statement2: $('#basicStatement2').val(),
            basic_statement3: $('#basicStatement3').val(),
            basic_footer_text: $('#basicFooterText').val()
        };
    } else if (type === 'custom') {
        data = {
            custom_statement1: $('#customStatement1').val(),
            custom_statement2: $('#customStatement2').val(),
            custom_statement3: $('#customStatement3').val(),
            custom_footer_text: $('#customFooterText').val()
        };
    }
    
    try {
        const response = await fetch('/api/report-settings/update-statements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const typeName = type === 'full' ? 'Full' : type === 'basic' ? 'Basic' : 'Customized';
            await showSuccess('Success', `${typeName} report text saved successfully!`);
        } else {
            await showError('Error', result.message || 'Failed to save report text');
        }
    } catch (error) {
        console.error('Save error:', error);
        await showError('Error', 'Failed to save report text. Please try again.');
    }
}

/**
 * Load report sections (full and basic)
 */
let fullReportSections = {};
let basicReportSections = {};

async function loadReportSections() {
    try {
        const response = await fetch('/api/report-settings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            fullReportSections = result.data.full_report_sections || {};
            basicReportSections = result.data.basic_report_sections || {};
            
            renderReportSections('full', fullReportSections);
            renderReportSections('basic', basicReportSections);
        }
    } catch (error) {
        console.error('Error loading report sections:', error);
    }
}

/**
 * Render report sections
 */
function renderReportSections(type, sections) {
    const container = $(`#${type}ReportSectionsList`);
    container.html('');
    
    if (!sections || Object.keys(sections).length === 0) {
        container.html('<p class="text-muted text-center" style="padding: 20px;">No sections yet.<br>Click "Add" to create one.</p>');
        return;
    }
    
    // Convert to array and sort by order
    const sectionsArray = Object.entries(sections).map(([key, section]) => ({
        key: key,
        ...section
    })).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sectionsArray.forEach((section, index) => {
        const sectionHtml = `
            <div class="card mb-2" style="border-left: 3px solid ${section.enabled ? '#28a745' : '#ccc'}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div class="card-body" style="padding: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <strong style="color: ${section.enabled ? '#000' : '#999'};">${section.order}. ${section.title}</strong>
                        <div>
                            <button class="btn btn-xs ${section.enabled ? 'btn-outline-warning' : 'btn-outline-success'}" 
                                    style="padding: 2px 8px; font-size: 11px;"
                                    onclick="toggleSectionEnabled('${type}', '${section.key}')">
                                <i class="fas fa-${section.enabled ? 'eye-slash' : 'eye'}"></i>
                            </button>
                            <button class="btn btn-xs btn-outline-danger" 
                                    style="padding: 2px 8px; font-size: 11px;"
                                    onclick="deleteReportSection('${type}', '${section.key}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <input type="text" class="form-control form-control-sm mb-2" 
                           placeholder="Section title" value="${section.title}" 
                           onchange="updateSectionField('${type}', '${section.key}', 'title', this.value)">
                    
                    <input type="number" class="form-control form-control-sm mb-2" 
                           placeholder="Order" value="${section.order || index + 1}" 
                           style="width: 80px;"
                           onchange="updateSectionField('${type}', '${section.key}', 'order', parseInt(this.value))">
                    
                    <textarea class="form-control form-control-sm" rows="2" 
                              placeholder="Template text (guidance)"
                              onchange="updateSectionField('${type}', '${section.key}', 'template', this.value)">${section.template || ''}</textarea>
                </div>
            </div>
        `;
        container.append(sectionHtml);
    });
}

/**
 * Update section field
 */
function updateSectionField(type, key, field, value) {
    const sections = type === 'full' ? fullReportSections : basicReportSections;
    if (sections[key]) {
        sections[key][field] = value;
    }
}

/**
 * Toggle section enabled/disabled
 */
function toggleSectionEnabled(type, key) {
    const sections = type === 'full' ? fullReportSections : basicReportSections;
    if (sections[key]) {
        sections[key].enabled = !sections[key].enabled;
        renderReportSections(type, sections);
    }
}

/**
 * Add new section
 */
async function addReportSection(type) {
    const result = await Swal.fire({
        title: 'Add New Section',
        input: 'text',
        inputLabel: 'Section Title',
        inputPlaceholder: 'Enter section title',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'Please enter a section title!';
            }
        }
    });
    
    if (result.isConfirmed && result.value) {
        const title = result.value;
        const key = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const sections = type === 'full' ? fullReportSections : basicReportSections;
        
        sections[key] = {
            title: title,
            enabled: true,
            order: Object.keys(sections).length + 1,
            template: ''
        };
        
        if (type === 'full') {
            fullReportSections = sections;
        } else {
            basicReportSections = sections;
        }
        
        renderReportSections(type, sections);
    }
}

/**
 * Delete section
 */
async function deleteReportSection(type, key) {
    const result = await showConfirm('Delete Section?', 'Are you sure you want to delete this section?', 'Yes, delete');
    
    if (result.isConfirmed) {
        const sections = type === 'full' ? fullReportSections : basicReportSections;
        delete sections[key];
        
        if (type === 'full') {
            fullReportSections = sections;
        } else {
            basicReportSections = sections;
        }
        
        renderReportSections(type, sections);
    }
}

/**
 * Save report sections
 */
async function saveReportSections(type) {
    const sections = type === 'full' ? fullReportSections : basicReportSections;
    const endpoint = type === 'full' ? 'update-full-sections' : 'update-basic-sections';
    
    try {
        const response = await fetch(`/api/report-settings/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                sections: sections
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            await showSuccess('Success', `${type === 'full' ? 'Full' : 'Basic'} report sections saved successfully!`);
        } else {
            await showError('Error', result.message || 'Failed to save sections');
        }
    } catch (error) {
        console.error('Save error:', error);
        await showError('Error', 'Failed to save sections. Please try again.');
    }
}

function loadInvestigationsPage() {
    setPageTitle('my_investigations');
    const content = $('#pageContent');
    content.html(`
        <div id="investigationsTable">${getLoadingHTML('loading_investigations')}</div>
    `);
    
    loadInvestigationsTable();
}

async function loadInvestigationsTable() {
    try {
        const response = await investigationAPI.getAssignedCases();
        if (response.status === 'success') {
            const cases = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="crime_type">${t('crime_type')}</th>
                            <th data-i18n="date_assigned">${t('date_assigned')}</th>
                            <th data-i18n="deadline">Deadline</th>
                            <th data-i18n="priority">${t('priority')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (cases.length === 0) {
                html += `<tr><td colspan="7" style="text-align: center;" data-i18n="no_investigations_assigned">${t('no_investigations_assigned')}</td></tr>`;
            } else {
                cases.forEach(caseItem => {
                    const deadline = caseItem.deadline ? new Date(caseItem.deadline) : null;
                    const isOverdue = deadline && deadline < new Date();
                    
                    html += `
                        <tr ${isOverdue ? 'style="background: #fff3cd;"' : ''}>
                            <td><strong>${caseItem.case_number}</strong></td>
                            <td>${caseItem.crime_type}</td>
                            <td>${formatDate(caseItem.assigned_date)}</td>
                            <td ${isOverdue ? 'style="color: red; font-weight: bold;"' : ''}>
                                ${deadline ? formatDate(deadline) : t('no') + ' deadline'}
                                ${isOverdue ? ' (OVERDUE)' : ''}
                            </td>
                            <td>${getTranslatedPriorityBadge(caseItem.priority)}</td>
                            <td>${getTranslatedStatusBadge(caseItem.status)}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="manageInvestigation(${caseItem.id})" data-i18n="manage">
                                    ${t('manage')}
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="viewCaseDetails(${caseItem.id})" data-i18n="details">
                                    ${t('details')}
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#investigationsTable').html(html);
        }
    } catch (error) {
        $('#investigationsTable').html(`<div class="alert alert-error">${t('failed_to_load_investigations')}: ${error.message}</div>`);
    }
}

function manageInvestigation(caseId) {
    // Get user role
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userRole = userData.role;
    
    // Only investigators get the full-page modal
    if (userRole === 'investigator' && typeof showFullCaseDetailsModal === 'function') {
        showFullCaseDetailsModal(caseId);
        return;
    }
    
    // Fallback to old implementation if modal not loaded
    setPageTitle('manage');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px;">
            <button class="btn btn-secondary" onclick="loadInvestigationsPage()" data-i18n="back">
                <i class="fas fa-arrow-left"></i> ${t('back')}
            </button>
        </div>
        
        <div class="tabs">
            <button class="tab-btn active" onclick="showInvestigationTab('evidence', ${caseId})" data-i18n="evidence">${t('evidence')}</button>
            <button class="tab-btn" onclick="showInvestigationTab('reports', ${caseId})" data-i18n="reports">${t('reports')}</button>
            <button class="tab-btn" onclick="showInvestigationTab('timeline', ${caseId})" data-i18n="timeline">${t('timeline')}</button>
        </div>
        
        <div id="investigationTabContent">
            ${getLoadingHTML()}
        </div>
    `);
    
    showInvestigationTab('evidence', caseId);
}

function showInvestigationTab(tab, caseId) {
    $('.tab-btn').removeClass('active');
    $(`.tab-btn:contains('${tab.charAt(0).toUpperCase() + tab.slice(1)}')`).addClass('active');
    
    const content = $('#investigationTabContent');
    
    switch(tab) {
        case 'evidence':
            loadCaseEvidence(caseId);
            break;
        case 'reports':
            loadCaseReports(caseId);
            break;
        case 'timeline':
            loadCaseTimeline(caseId);
            break;
    }
}

async function loadCaseEvidence(caseId) {
    const content = $('#investigationTabContent');
    content.html(`
        <div style="margin: 20px 0;">
            <button class="btn btn-primary" onclick="uploadEvidence(${caseId})" data-i18n="upload_evidence">
                <i class="fas fa-upload"></i> ${t('upload')} ${t('evidence')}
            </button>
        </div>
        <div id="evidenceList">${getLoadingHTML('loading_data')}</div>
    `);
    
    try {
        const response = await investigationAPI.getCaseEvidence(caseId);
        if (response.status === 'success') {
            const evidence = response.data;
            let html = `<table class="data-table"><thead><tr>
                <th data-i18n="evidence_number">${t('evidence_number')}</th>
                <th data-i18n="evidence_type">${t('evidence_type')}</th>
                <th data-i18n="description">${t('description')}</th>
                <th data-i18n="collected_at">${t('collected_at')}</th>
                <th data-i18n="actions">${t('actions')}</th>
            </tr></thead><tbody>`;
            
            if (evidence.length === 0) {
                html += `<tr><td colspan="5" style="text-align: center;" data-i18n="no_evidence">${t('no_evidence')}</td></tr>`;
            } else {
                evidence.forEach(item => {
                    html += `
                        <tr>
                            <td><strong>${item.evidence_number}</strong></td>
                            <td><span class="badge-status">${item.evidence_type}</span></td>
                            <td>${item.description ? item.description.substring(0, 50) + '...' : 'N/A'}</td>
                            <td>${item.collected_at ? formatDate(item.collected_at) : 'N/A'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="viewEvidenceDetails(${item.id})" data-i18n="view">${t('view')}</button>
                                <button class="btn btn-sm btn-primary" onclick="evidenceEditManager.showEditModal(${item.id})" data-i18n="edit"><i class="fas fa-edit"></i> ${t('edit')}</button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += '</tbody></table>';
            $('#evidenceList').html(html);
        }
    } catch (error) {
        $('#evidenceList').html(`<div class="alert alert-error">${t('failed_to_load')}</div>`);
    }
}

async function loadCaseReports(caseId) {
    const content = $('#investigationTabContent');
    content.html(`
        <div style="margin: 20px 0;">
            <button class="btn btn-primary" onclick="createReport(${caseId})">
                <i class="fas fa-file-alt"></i> Create Report
            </button>
        </div>
        <div id="reportsList">Loading reports...</div>
    `);
    
    // Placeholder - shows empty state
    $('#reportsList').html(`
        <table class="data-table">
            <thead><tr><th>Report Type</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
                <tr><td colspan="4" style="text-align: center;">No reports created yet</td></tr>
            </tbody>
        </table>
    `);
}

async function loadCaseTimeline(caseId) {
    const content = $('#investigationTabContent');
    content.html(`
        <div style="margin: 20px 0;">
            <button class="btn btn-primary" onclick="addTimelineEntry(${caseId})">
                <i class="fas fa-plus"></i> Add Timeline Entry
            </button>
        </div>
        <div id="timelineList">Loading timeline...</div>
    `);
    
    // Placeholder - shows empty state
    $('#timelineList').html(`
        <div class="timeline">
            <p style="text-align: center; color: #6b7280;">No timeline entries yet</p>
        </div>
    `);
}

function uploadEvidence(caseId) {
    const bodyHtml = `
        <form id="uploadEvidenceForm">
            <div class="form-group">
                <label data-i18n="evidence_type">${t('evidence_type')} *</label>
                <select name="evidence_type" required>
                    <option value="photo" data-i18n="photo">${t('photo')}</option>
                    <option value="video" data-i18n="video">${t('video')}</option>
                    <option value="audio" data-i18n="audio">${t('audio')}</option>
                    <option value="document" data-i18n="document">${t('document')}</option>
                    <option value="physical" data-i18n="physical">${t('physical')}</option>
                    <option value="digital" data-i18n="digital">${t('digital')}</option>
                </select>
            </div>
            <div class="form-group">
                <label data-i18n="description">${t('description')} *</label>
                <textarea name="description" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label data-i18n="storage_location">${t('storage_location')} *</label>
                <input type="text" name="storage_location" required placeholder="${t('location')}">
            </div>
            <div class="form-group">
                <label data-i18n="collection_date">${t('collection_date')} *</label>
                <input type="datetime-local" name="collection_date" required>
            </div>
            <div class="form-group">
                <label data-i18n="upload_file">${t('upload_file')}</label>
                <input type="file" name="evidence_file" id="evidenceFile">
                <small>${t('digital_evidence')}</small>
            </div>
        </form>
    `;
    showModal(t('upload') + ' ' + t('evidence'), bodyHtml, [
        { text: t('cancel'), class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: t('upload'), class: 'btn btn-primary', onclick: `submitEvidence(${caseId})` }
    ]);
}

function createReport(caseId) {
    const bodyHtml = `
        <form id="createReportForm">
            <div class="form-group">
                <label>Report Type *</label>
                <select name="report_type" required>
                    <option value="preliminary">Preliminary Report</option>
                    <option value="interim">Interim Report</option>
                    <option value="final">Final Report</option>
                    <option value="court_submission">Court Submission</option>
                </select>
            </div>
            <div class="form-group">
                <label>Report Title *</label>
                <input type="text" name="title" required>
            </div>
            <div class="form-group">
                <label>Report Content *</label>
                <textarea name="content" rows="10" required placeholder="Write your report here..."></textarea>
            </div>
            <div class="form-group">
                <label>Findings</label>
                <textarea name="findings" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label>Recommendations</label>
                <textarea name="recommendations" rows="4"></textarea>
            </div>
        </form>
    `;
    showModal('Create Investigation Report', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Save Draft', class: 'btn btn-secondary', onclick: `submitReport(${caseId}, 'draft')` },
        { text: 'Submit', class: 'btn btn-primary', onclick: `submitReport(${caseId}, 'submitted')` }
    ]);
}

function addTimelineEntry(caseId) {
    const bodyHtml = `
        <form id="timelineEntryForm">
            <div class="form-group">
                <label>Activity Type *</label>
                <select name="activity_type" required>
                    <option value="investigation">Investigation Activity</option>
                    <option value="interview">Interview</option>
                    <option value="evidence_collection">Evidence Collection</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="meeting">Meeting</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" name="activity_date" required>
            </div>
            <div class="form-group">
                <label>Activity Description *</label>
                <textarea name="description" rows="5" required placeholder="Describe what happened..."></textarea>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" name="location">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="notes" rows="3"></textarea>
            </div>
        </form>
    `;
    showModal('Add Timeline Entry', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Add Entry', class: 'btn btn-primary', onclick: `submitTimelineEntry(${caseId})` }
    ]);
}

async function submitEvidence(caseId) {
    const form = $('#uploadEvidenceForm')[0];
    const formData = new FormData(form);
    
    try {
        const response = await investigationAPI.uploadEvidence(caseId, formData);
        if (response.status === 'success') {
            alert('Evidence uploaded successfully!');
            closeModal();
            loadCaseEvidence(caseId);
        }
    } catch (error) {
        alert('Failed to upload evidence: ' + error.message);
    }
}

async function submitReport(caseId, status) {
    const form = $('#createReportForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.status = status;
    
    try {
        const response = await investigationAPI.createReport(caseId, data);
        if (response.status === 'success') {
            alert('Report created successfully!');
            closeModal();
            loadCaseReports(caseId);
        }
    } catch (error) {
        alert('Failed to create report: ' + error.message);
    }
}

async function submitTimelineEntry(caseId) {
    const form = $('#timelineEntryForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await investigationAPI.addTimelineEntry(caseId, data);
        if (response.status === 'success') {
            alert('Timeline entry added!');
            closeModal();
            loadCaseTimeline(caseId);
        }
    } catch (error) {
        alert('Failed to add timeline entry: ' + error.message);
    }
}

// Evidence Page
function loadEvidencePage() {
    setPageTitle('evidence_management');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
            <input type="text" id="evidenceSearch" data-i18n-placeholder="search_evidence" placeholder="${t('search_evidence')}" style="flex: 1; padding: 8px;">
            <select id="evidenceTypeFilter" style="padding: 8px;">
                <option value="" data-i18n="all_types">${t('all_types')}</option>
                <option value="photo" data-i18n="photo">${t('photo')}</option>
                <option value="video" data-i18n="video">${t('video')}</option>
                <option value="audio" data-i18n="audio">${t('audio')}</option>
                <option value="document" data-i18n="document">${t('document')}</option>
                <option value="physical" data-i18n="physical_item">${t('physical_item')}</option>
                <option value="digital" data-i18n="digital_evidence">${t('digital_evidence')}</option>
            </select>
            <button class="btn btn-primary" onclick="filterEvidence()" data-i18n="filter">${t('filter')}</button>
        </div>
        <div id="evidenceTable" data-i18n="loading_evidence">${t('loading_evidence')}</div>
    `);
    
    loadEvidenceTable();
}

// Function to refresh evidence list (called after editing)
function refreshEvidenceList() {
    if (typeof loadEvidenceTable === 'function') {
        loadEvidenceTable();
    }
}

async function loadEvidenceTable(filters = {}) {
    try {
        const response = await investigationAPI.getEvidence(filters);
        if (response.status === 'success') {
            const evidence = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="evidence_number">${t('evidence_number')}</th>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="type">${t('type')}</th>
                            <th data-i18n="description">${t('description')}</th>
                            <th data-i18n="collected_at">${t('collected_at')}</th>
                            <th data-i18n="location">${t('location')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (evidence.length === 0) {
                html += '<tr><td colspan="8" style="text-align: center;" data-i18n="no_evidence_found">' + t('no_evidence_found') + '</td></tr>';
            } else {
                evidence.forEach(item => {
                    const editedBadge = item.is_edited ? '<span class="badge badge-warning" title="This evidence has been edited"><i class="fas fa-edit"></i></span>' : '';
                    html += `
                        <tr>
                            <td><strong>${item.evidence_number}</strong> ${editedBadge}</td>
                            <td>${item.case_number}</td>
                            <td><span class="badge-status">${item.evidence_type}</span></td>
                            <td>${item.description ? item.description.substring(0, 50) + '...' : 'N/A'}</td>
                            <td>${item.collected_at ? new Date(item.collected_at).toLocaleDateString() : 'N/A'}</td>
                            <td>${item.location_collected || 'N/A'}</td>
                            <td>${item.is_critical ? '<span class="badge badge-danger" data-i18n="critical">' + t('critical') + '</span>' : '<span class="badge badge-secondary" data-i18n="normal">' + t('normal') + '</span>'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="viewEvidenceDetails(${item.id})" data-i18n="view">${t('view')}</button>
                                <button class="btn btn-sm btn-primary" onclick="evidenceEditManager.showEditModal(${item.id})" title="${t('edit')}"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-info" onclick="evidenceEditManager.showEditHistory(${item.id})" title="${t('view_history')}"><i class="fas fa-history"></i></button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#evidenceTable').html(html);
        }
    } catch (error) {
        $('#evidenceTable').html('<div class="alert alert-error">' + t('failed_update_evidence') + ': ' + error.message + '</div>');
    }
}

function filterEvidence() {
    const search = $('#evidenceSearch').val();
    const type = $('#evidenceTypeFilter').val();
    loadEvidenceTable({ search, type });
}

async function viewEvidenceDetails(evidenceId) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    try {
        const response = await investigationAPI.getEvidence({ id: evidenceId });
        if (response.status === 'success' && response.data.length > 0) {
            const evidence = response.data[0];
            
            const bodyHtml = `
                ${evidence.is_critical ? `
                <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="color: #dc2626; font-size: 24px;"></i>
                    <div style="color: #dc2626; font-weight: bold; font-size: 18px; margin-top: 8px;" data-i18n="critical_evidence">${t('critical_evidence')}</div>
                </div>
                ` : ''}
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label" data-i18n="evidence_number">${t('evidence_number')}</span>
                        <span class="info-value">${evidence.evidence_number}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="type">${t('type')}</span>
                        <span class="info-value"><span class="badge-status">${evidence.evidence_type}</span></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="status">${t('status')}</span>
                        <span class="info-value"><span class="badge-status">${evidence.status}</span></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="collected_at">${t('collected_at')}</span>
                        <span class="info-value">${new Date(evidence.collection_date).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="collected_by">${t('collected_by')}</span>
                        <span class="info-value">${evidence.collected_by_name || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label" data-i18n="location">${t('location')}</span>
                        <span class="info-value">${evidence.storage_location}</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 data-i18n="description">${t('description')}</h3>
                    <p>${evidence.description}</p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 data-i18n="chain_of_custody">${t('chain_of_custody')}</h3>
                    <p>${evidence.chain_of_custody || t('no_custody_records')}</p>
                </div>
                
                ${evidence.analysis_result ? `
                <div style="margin-top: 20px;">
                    <h3 data-i18n="analysis_result">${t('analysis_result')}</h3>
                    <p>${evidence.analysis_result}</p>
                </div>` : ''}
            `;
            
            showModal(t('view_evidence'), bodyHtml, [
                { text: t('update_chain'), class: 'btn btn-primary', onclick: `updateChainOfCustody(${evidenceId})` },
                { text: t('close'), class: 'btn btn-secondary', onclick: 'closeModal()' }
            ]);
        }
    } catch (error) {
        alert(t('failed_load_evidence') + ': ' + error.message);
    }
}

function updateChainOfCustody(evidenceId) {
    closeModal(); // Close details modal first
    
    const bodyHtml = `
        <form id="chainOfCustodyForm">
            <div class="form-group">
                <label>Action *</label>
                <select name="action" required>
                    <option value="collected">Collected</option>
                    <option value="transferred">Transferred</option>
                    <option value="analyzed">Analyzed</option>
                    <option value="stored">Stored</option>
                    <option value="disposed">Disposed</option>
                </select>
            </div>
            <div class="form-group">
                <label>Location *</label>
                <input type="text" name="location" required placeholder="Current location of evidence">
            </div>
            <div class="form-group">
                <label>Notes *</label>
                <textarea name="notes" rows="4" required placeholder="Describe what happened with this evidence"></textarea>
            </div>
            <div class="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" name="custody_date" required value="${new Date().toISOString().slice(0,16)}">
            </div>
        </form>
    `;
    
    showModal('Update Chain of Custody', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Update', class: 'btn btn-primary', onclick: `submitChainOfCustody(${evidenceId})` }
    ]);
}

async function submitChainOfCustody(evidenceId) {
    const form = $('#chainOfCustodyForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await api.post(`/investigation/evidence/${evidenceId}/custody-log`, data);
        if (response.status === 'success') {
            alert('Chain of custody updated successfully!');
            closeModal();
            loadEvidenceTable();
        }
    } catch (error) {
        alert('Failed to update chain of custody: ' + error.message);
    }
}

// Court Cases Page
function loadCourtCasesPage() {
    setPageTitle('court_cases');
    const content = $('#pageContent');
    content.html(`
        <div id="courtCasesTable">Loading court cases...</div>
    `);
    
    loadCourtCasesTable();
}

async function loadCourtCasesTable() {
    try {
        const response = await courtAPI.getCourtCases();
        if (response.status === 'success') {
            const cases = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Case Number</th>
                            <th>Crime Type</th>
                            <th>Court Status</th>
                            <th>Submission Date</th>
                            <th>Court Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (cases.length === 0) {
                html += '<tr><td colspan="6" style="text-align: center;">No court cases found</td></tr>';
            } else {
                cases.forEach(caseItem => {
                    html += `
                        <tr>
                            <td><strong>${caseItem.case_number}</strong></td>
                            <td>${caseItem.crime_type}</td>
                            <td>${getStatusBadge(caseItem.status)}</td>
                            <td>${caseItem.submission_date ? new Date(caseItem.submission_date).toLocaleDateString() : '-'}</td>
                            <td>${caseItem.court_date ? new Date(caseItem.court_date).toLocaleDateString() : '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="viewCaseDetails(${caseItem.id})">View</button>
                                ${caseItem.status === 'escalated' ? '<button class="btn btn-sm btn-primary" onclick="submitToCourt(' + caseItem.id + ')">Submit</button>' : ''}
                                ${caseItem.status === 'court_pending' ? '<button class="btn btn-sm btn-success" onclick="uploadDecision(' + caseItem.id + ')">Decision</button>' : ''}
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#courtCasesTable').html(html);
        }
    } catch (error) {
        $('#courtCasesTable').html('<div class="alert alert-error">Failed to load court cases: ' + error.message + '</div>');
    }
}

function submitToCourt(caseId) {
    const bodyHtml = `
        <form id="courtSubmissionForm">
            <div class="form-group">
                <label>Court Name *</label>
                <input type="text" name="court_name" required placeholder="e.g., Kismayo District Court">
            </div>
            <div class="form-group">
                <label>Court Date *</label>
                <input type="date" name="court_date" required>
            </div>
            <div class="form-group">
                <label>Case File Number</label>
                <input type="text" name="case_file_number" placeholder="Court's file number">
            </div>
            <div class="form-group">
                <label>Prosecutor Name</label>
                <input type="text" name="prosecutor_name">
            </div>
            <div class="form-group">
                <label>Submission Notes</label>
                <textarea name="submission_notes" rows="4" placeholder="Any additional notes for court submission"></textarea>
            </div>
            <div class="form-group">
                <label>Attach Documents</label>
                <input type="file" name="documents" multiple>
                <small>Case file, evidence list, investigation reports</small>
            </div>
        </form>
    `;
    
    showModal('Submit Case to Court', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Submit to Court', class: 'btn btn-primary', onclick: `submitCourtCase(${caseId})` }
    ]);
}

async function submitCourtCase(caseId) {
    const form = $('#courtSubmissionForm')[0];
    const formData = new FormData(form);
    
    try {
        const response = await courtAPI.submitToCourt(caseId, formData);
        if (response.status === 'success') {
            alert('Case successfully submitted to court!');
            closeModal();
            loadCourtCasesTable();
        }
    } catch (error) {
        alert('Failed to submit to court: ' + error.message);
    }
}

function uploadDecision(caseId) {
    const bodyHtml = `
        <form id="courtDecisionForm">
            <div class="form-group">
                <label>Decision Type *</label>
                <select name="decision_type" required>
                    <option value="guilty">Guilty</option>
                    <option value="not_guilty">Not Guilty</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="pending">Pending</option>
                    <option value="appeal">Appeal</option>
                </select>
            </div>
            <div class="form-group">
                <label>Decision Date *</label>
                <input type="date" name="decision_date" required>
            </div>
            <div class="form-group">
                <label>Verdict Summary *</label>
                <textarea name="verdict_summary" rows="5" required placeholder="Summarize the court's decision"></textarea>
            </div>
            <div class="form-group">
                <label>Sentence (if applicable)</label>
                <textarea name="sentence" rows="3" placeholder="Details of sentence if guilty verdict"></textarea>
            </div>
            <div class="form-group">
                <label>Upload Court Documents</label>
                <input type="file" name="decision_document" accept=".pdf,.doc,.docx">
                <small>Court order, judgment document (PDF format preferred)</small>
            </div>
        </form>
    `;
    
    showModal('Upload Court Decision', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Upload Decision', class: 'btn btn-success', onclick: `submitCourtDecision(${caseId})` }
    ]);
}

async function submitCourtDecision(caseId) {
    const form = $('#courtDecisionForm')[0];
    const formData = new FormData(form);
    
    try {
        const response = await courtAPI.uploadDecision(caseId, formData);
        if (response.status === 'success') {
            alert('Court decision uploaded successfully!');
            closeModal();
            loadCourtCasesTable();
        }
    } catch (error) {
        alert('Failed to upload decision: ' + error.message);
    }
}

// Custody Management Page
function loadCustodyPage() {
    setPageTitle('custody_management');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
            <button class="btn btn-primary" onclick="recordNewCustody()">
                <i class="fas fa-plus"></i> <span data-i18n="record_new_custody">${t('record_new_custody')}</span>
            </button>
            <button class="btn btn-secondary" onclick="loadCustodyPage()"><span data-i18n="active_only">${t('active_only')}</span></button>
            <button class="btn btn-secondary" onclick="loadAllCustodyRecords()"><span data-i18n="view_all">${t('view_all')}</span></button>
        </div>
        <div id="custodyTable">${getLoadingHTML('loading_data')}</div>
    `);
    
    loadCustodyTable();
}

async function loadCustodyTable() {
    try {
        const response = await obAPI.getActiveCustody();
        if (response.status === 'success') {
            const records = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="custody_id">${t('custody_id')}</th>
                            <th data-i18n="person_name">${t('person_name')}</th>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="location">${t('location')}</th>
                            <th data-i18n="custody_start">${t('custody_start')}</th>
                            <th data-i18n="expected_release">${t('expected_release')}</th>
                            <th data-i18n="health_status">${t('health_status')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (records.length === 0) {
                html += `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px;">
                            <div style="color: #6b7280;">
                                <i class="fas fa-user-lock" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                                <h3 style="margin: 10px 0;" data-i18n="no_active_custody_records">${t('no_active_custody_records')}</h3>
                                <p style="margin: 10px 0;" data-i18n="no_persons_in_custody">${t('no_persons_in_custody')}</p>
                                <p style="margin: 10px 0; font-size: 14px;" data-i18n="custody_auto_created_note">
                                    ${t('custody_auto_created_note')}
                                </p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                records.forEach(record => {
                    const custodyStart = new Date(record.custody_start);
                    const expectedRelease = record.expected_release_date ? new Date(record.expected_release_date) : null;
                    const now = new Date();
                    const isOverdue = expectedRelease && expectedRelease < now;
                    
                    html += `
                        <tr ${isOverdue ? 'style="background: #fee2e2;"' : ''}>
                            <td><strong>#${record.id}</strong></td>
                            <td>${record.person_name}</td>
                            <td>${record.case_number || 'N/A'}</td>
                            <td><span class="badge-status ${record.custody_status === 'in_custody' ? 'pending' : 'approved'}">${record.custody_status}</span></td>
                            <td>${record.custody_location}<br><small>Cell: ${record.cell_number || 'N/A'}</small></td>
                            <td>${custodyStart.toLocaleString()}</td>
                            <td ${isOverdue ? 'style="color: red; font-weight: bold;"' : ''}>
                                ${expectedRelease ? expectedRelease.toLocaleString() : '<span style="color: #9ca3af;">Not Set</span>'}
                                ${isOverdue ? '<br><strong>(OVERDUE)</strong>' : ''}
                            </td>
                            <td><span class="badge-status ${record.health_status === 'good' ? 'approved' : 'pending'}">${record.health_status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="manageCustody(${record.id})" data-i18n="manage">${t('manage')}</button>
                                <button class="btn btn-sm btn-secondary" onclick="addDailyLog(${record.id})" data-i18n="daily_log">${t('daily_log')}</button>
                                <button class="btn btn-sm btn-warning" onclick="recordMovement(${record.id})" data-i18n="movement">${t('movement')}</button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#custodyTable').html(html);
        }
    } catch (error) {
        $('#custodyTable').html('<div class="alert alert-error">' + t('failed_load_custody_records') + ': ' + error.message + '</div>');
    }
}

// Custody Management Functions
async function manageCustody(custodyId) {
    try {
        console.log('manageCustody called with ID:', custodyId, 'Type:', typeof custodyId);
        showLoading('Loading custody details...');
        const response = await obAPI.getCustody(custodyId);
        
        if (response.status === 'success') {
            const custody = response.data;
            const person = custody.person || {};
            const caseData = custody.case || {};
            
            const bodyHtml = `
                <div style="padding: 20px;">
                    <h3>Custody Record #${custody.id}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        <div>
                            <strong>Person:</strong><br>
                            ${person.first_name} ${person.last_name}
                        </div>
                        <div>
                            <strong>Case Number:</strong><br>
                            ${caseData.case_number || 'N/A'}
                        </div>
                        <div>
                            <strong>Status:</strong><br>
                            ${custody.custody_status}
                        </div>
                        <div>
                            <strong>Location:</strong><br>
                            ${custody.custody_location}
                        </div>
                        <div>
                            <strong>Cell Number:</strong><br>
                            ${custody.cell_number || 'N/A'}
                        </div>
                        <div>
                            <strong>Health Status:</strong><br>
                            ${custody.health_status}
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <strong>Custody Notes:</strong><br>
                        ${custody.custody_notes || 'None'}
                    </div>
                </div>
            `;
            
            closeAlert();
            showModal('Custody Details', bodyHtml, [
                { text: 'Close', class: 'btn btn-secondary', onclick: 'closeModal()' }
            ]);
        }
    } catch (error) {
        closeAlert();
        await showError('Error', 'Failed to load custody details: ' + error.message);
    }
}

function addDailyLog(custodyId) {
    const bodyHtml = `
        <form id="dailyLogForm">
            <div class="form-group">
                <label>Health Status</label>
                <select name="health_status">
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
            <div class="form-group">
                <label>Health Notes</label>
                <textarea name="health_notes" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Meal Provided</label>
                <input type="checkbox" name="meal_provided" value="1">
            </div>
            <div class="form-group">
                <label>Exercise Allowed</label>
                <input type="checkbox" name="exercise_allowed" value="1">
            </div>
            <div class="form-group">
                <label>Behavior Notes</label>
                <textarea name="behavior_notes" rows="3"></textarea>
            </div>
        </form>
    `;
    
    showModal('Add Daily Log', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Save', class: 'btn btn-primary', onclick: 'submitDailyLog(' + custodyId + ')' }
    ]);
}

async function submitDailyLog(custodyId) {
        const form = document.getElementById('dailyLogForm');
        const formData = new FormData(form);
        const data = {
            health_status: formData.get('health_status'),
            health_notes: formData.get('health_notes'),
            meal_provided: formData.get('meal_provided') ? 1 : 0,
            exercise_allowed: formData.get('exercise_allowed') ? 1 : 0,
            behavior_notes: formData.get('behavior_notes')
        };
        
    try {
        await obAPI.addDailyLog(custodyId, data);
        closeModal();
        await showSuccess('Success', 'Daily log added successfully');
        loadCustodyTable();
    } catch (error) {
        await showError('Error', 'Failed to add daily log: ' + error.message);
    }
}

function recordMovement(custodyId) {
    const bodyHtml = `
        <form id="movementForm">
            <div class="form-group">
                <label>Movement Type *</label>
                <select name="movement_type" required>
                    <option value="">Select Type</option>
                    <option value="court_appearance">Court Appearance</option>
                    <option value="hospital_visit">Hospital Visit</option>
                    <option value="transfer">Transfer to Another Facility</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>From Location *</label>
                <input type="text" name="from_location" required>
            </div>
            <div class="form-group">
                <label>To Location *</label>
                <input type="text" name="to_location" required>
            </div>
            <div class="form-group">
                <label>Movement Start *</label>
                <input type="datetime-local" name="movement_start" required>
            </div>
            <div class="form-group">
                <label>Escorted By</label>
                <input type="text" name="escorted_by">
            </div>
            <div class="form-group">
                <label>Purpose</label>
                <textarea name="purpose" rows="3"></textarea>
            </div>
        </form>
    `;
    
    showModal('Record Movement', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Record', class: 'btn btn-primary', onclick: 'submitMovement(' + custodyId + ')' }
    ]);
}

async function submitMovement(custodyId) {
        const form = document.getElementById('movementForm');
        const formData = new FormData(form);
        const data = {
            movement_type: formData.get('movement_type'),
            from_location: formData.get('from_location'),
            to_location: formData.get('to_location'),
            movement_start: formData.get('movement_start').replace('T', ' ') + ':00',
            escorted_by: formData.get('escorted_by'),
            purpose: formData.get('purpose')
        };
        
    try {
        await obAPI.recordMovement(custodyId, data);
        closeModal();
        await showSuccess('Success', 'Movement recorded successfully');
        loadCustodyTable();
    } catch (error) {
        await showError('Error', 'Failed to record movement: ' + error.message);
    }
}

// ============================================
// Bailers Management Page
// ============================================

function loadBailersPage() {
    setPageTitle('bailers_management');
    const content = $('#pageContent');
    content.html(`
        <div class="bailers-page-container">
            <div class="bailers-header">
                <h2><i class="fas fa-handshake"></i> <span data-i18n="bailers_management">${t('bailers_management')}</span></h2>
                <p data-i18n="bailers_management_desc">${t('bailers_management_desc')}</p>
            </div>
            
            <div id="bailersTableContainer" class="table-container">
                ${getLoadingHTML('loading_data')}
            </div>
        </div>
        
        <style>
            .bailers-page-container { max-width: 1400px; margin: 0 auto; padding: 20px; }
            .bailers-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
            .bailers-header h2 { margin: 0 0 10px 0; font-size: 28px; }
            .bailer-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .bailer-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px; }
            .bailer-info-item { display: flex; flex-direction: column; }
            .bailer-info-label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px; }
            .bailer-info-value { font-size: 14px; color: #111827; }
            .bailed-persons-list { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
            .bailed-person-item { padding: 10px; background: #f9fafb; border-radius: 6px; margin-bottom: 10px; }
        </style>
    `);
    
    loadBailersTable();
}

async function loadBailersTable() {
    try {
        const response = await obAPI.getAllBailers();
        if (response.status === 'success') {
            renderBailersTable(response.data);
        }
    } catch (error) {
        $('#bailersTableContainer').html(`<div class="alert alert-error" data-i18n="failed_load_bailers">${t('failed_load_bailers')}: ${error.message}</div>`);
    }
}

function renderBailersTable(bailers) {
    let html = '';
    
    if (bailers.length === 0) {
        html = `
            <div style="text-align: center; padding: 60px; color: #6b7280;">
                <i class="fas fa-handshake" style="font-size: 64px; opacity: 0.3; margin-bottom: 20px;"></i>
                <h3 data-i18n="no_bailers_found">${t('no_bailers_found')}</h3>
                <p data-i18n="no_bailers_posted_msg">${t('no_bailers_posted_msg')}</p>
            </div>
        `;
    } else {
        bailers.forEach(bailer => {
            const fullName = `${bailer.first_name} ${bailer.middle_name || ''} ${bailer.last_name}`.trim();
            const bailedPersons = bailer.bailed_persons || [];
            
            html += `
                <div class="bailer-card">
                    <div class="bailer-info">
                        <div class="bailer-info-item">
                            <span class="bailer-info-label" data-i18n="bailer_name">${t('bailer_name')}</span>
                            <span class="bailer-info-value"><strong>${fullName}</strong></span>
                        </div>
                        <div class="bailer-info-item">
                            <span class="bailer-info-label" data-i18n="national_id">${t('national_id')}</span>
                            <span class="bailer-info-value">${bailer.national_id || 'N/A'}</span>
                        </div>
                        <div class="bailer-info-item">
                            <span class="bailer-info-label" data-i18n="phone">${t('phone')}</span>
                            <span class="bailer-info-value">${bailer.phone || 'N/A'}</span>
                        </div>
                        <div class="bailer-info-item">
                            <span class="bailer-info-label" data-i18n="address">${t('address')}</span>
                            <span class="bailer-info-value">${bailer.address || 'N/A'}</span>
                        </div>
                        <div class="bailer-info-item">
                            <span class="bailer-info-label" data-i18n="connected_cases">${t('connected_cases')}</span>
                            <span class="bailer-info-value">${bailer.case_count || 0}</span>
                        </div>
                        <div class="bailer-info-item">
                            <span class="bailer-info-label" data-i18n="persons_bailed">${t('persons_bailed')}</span>
                            <span class="bailer-info-value">${bailedPersons.length}</span>
                        </div>
                    </div>
                    
                    ${bailedPersons.length > 0 ? `
                        <div class="bailed-persons-list">
                            <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #374151;" data-i18n="persons_bailed">${t('persons_bailed')}:</h4>
                            ${bailedPersons.map(person => `
                                <div class="bailed-person-item">
                                    <div><strong>${person.bailed_person_name}</strong></div>
                                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                                        <span data-i18n="case_label">${t('case_label')}</span>: ${person.case_number} | <span data-i18n="status">${t('status')}</span>: ${person.custody_status}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 15px;">
                        <button class="btn btn-sm btn-primary" onclick="viewPersonDetails(${bailer.id})">
                            <i class="fas fa-eye"></i> <span data-i18n="view_details">${t('view_details')}</span>
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    $('#bailersTableContainer').html(html);
}

// ============================================
// Custody Management Functions
// ============================================

function recordNewCustody() {
    const bodyHtml = `
        <form id="custodyForm">
            <div class="form-group">
                <label data-i18n="person_name">${t('person_name')} *</label>
                <input type="text" name="person_name" required>
                <small data-i18n="search_enter_person">${t('search_enter_person')}</small>
            </div>
            <div class="form-group">
                <label data-i18n="case_number">${t('case_number')}</label>
                <input type="text" name="case_number" placeholder="${t('optional_link_case')}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label data-i18n="custody_location">${t('custody_location')} *</label>
                    <input type="text" name="custody_location" required>
                </div>
                <div class="form-group">
                    <label data-i18n="cell_number">${t('cell_number')}</label>
                    <input type="text" name="cell_number">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label data-i18n="custody_start">${t('custody_start')} *</label>
                    <input type="datetime-local" name="custody_start" required>
                </div>
                <div class="form-group">
                    <label data-i18n="expected_release">${t('expected_release')}</label>
                    <input type="datetime-local" name="expected_release_date">
                </div>
            </div>
            <div class="form-group">
                <label data-i18n="arrest_warrant_number">${t('arrest_warrant_number')}</label>
                <input type="text" name="arrest_warrant_number">
            </div>
            <div class="form-group">
                <label data-i18n="initial_health_status">${t('initial_health_status')} *</label>
                <select name="health_status" required>
                    <option value="good" data-i18n="good">${t('good')}</option>
                    <option value="fair" data-i18n="fair">${t('fair')}</option>
                    <option value="needs_attention" data-i18n="needs_attention">${t('needs_attention')}</option>
                    <option value="critical" data-i18n="critical">${t('critical')}</option>
                </select>
            </div>
        </form>
    `;
    showModal(t('record_new_custody'), bodyHtml, [
        { text: t('cancel'), class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: t('record'), class: 'btn btn-primary', onclick: 'submitCustodyRecord()' }
    ]);
}

function addDailyLog(id) {
    const bodyHtml = `
        <form id="dailyLogForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Log Date *</label>
                    <input type="date" name="log_date" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Log Time *</label>
                    <input type="time" name="log_time" required value="${new Date().toTimeString().slice(0,5)}">
                </div>
            </div>
            <div class="form-group">
                <label>Health Status *</label>
                <select name="health_status" required>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs_attention">Needs Attention</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="health_check_done" checked> Health Check Completed
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="meal_provided" checked> Meal Provided
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="exercise_allowed"> Exercise Allowed
                </label>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="notes" rows="4"></textarea>
            </div>
        </form>
    `;
    showModal('Add Daily Log', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Save Log', class: 'btn btn-primary', onclick: `submitDailyLog(${id})` }
    ]);
}

function recordMovement(id) {
    const bodyHtml = `
        <form id="movementForm">
            <div class="form-group">
                <label>Movement Type *</label>
                <select name="movement_type" required>
                    <option value="court_appearance">Court Appearance</option>
                    <option value="hospital_visit">Hospital Visit</option>
                    <option value="transfer">Transfer to Another Center</option>
                    <option value="release">Release</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Movement Date *</label>
                    <input type="date" name="movement_date" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Movement Time *</label>
                    <input type="time" name="movement_time" required value="${new Date().toTimeString().slice(0,5)}">
                </div>
            </div>
            <div class="form-group">
                <label>Destination *</label>
                <input type="text" name="destination" required>
            </div>
            <div class="form-group">
                <label>Reason *</label>
                <textarea name="reason" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label>Escorted By</label>
                <input type="text" name="escorted_by">
            </div>
        </form>
    `;
    showModal('Record Movement', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Record', class: 'btn btn-primary', onclick: `submitMovement(${id})` }
    ]);
}

async function submitCustodyRecord() {
    const form = $('#custodyForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await obAPI.createCustody(data);
        if (response.status === 'success') {
            alert('Custody record created successfully!');
            closeModal();
            loadCustodyTable();
        }
    } catch (error) {
        alert('Failed to create custody record: ' + error.message);
    }
}

async function submitDailyLog(custodyId) {
    const form = $('#dailyLogForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.health_check_done = data.health_check_done ? 1 : 0;
    data.meal_provided = data.meal_provided ? 1 : 0;
    data.exercise_allowed = data.exercise_allowed ? 1 : 0;
    
    try {
        const response = await obAPI.addDailyLog(custodyId, data);
        if (response.status === 'success') {
            alert('Daily log added successfully!');
            closeModal();
            loadCustodyTable();
        }
    } catch (error) {
        alert('Failed to add daily log: ' + error.message);
    }
}

async function submitMovement(custodyId) {
    const form = $('#movementForm')[0];
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await obAPI.recordMovement(custodyId, data);
        if (response.status === 'success') {
            alert('Movement recorded successfully!');
            closeModal();
            loadCustodyTable();
        }
    } catch (error) {
        alert('Failed to record movement: ' + error.message);
    }
}

async function loadAllCustodyRecords() {
    setPageTitle('all_custody_records');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px;">
            <button class="btn btn-secondary" onclick="loadCustodyPage()">
                <i class="fas fa-arrow-left"></i> <span data-i18n="back_to_active_only">${t('back_to_active_only')}</span>
            </button>
            <select id="custodyStatusFilter" style="margin-left: 10px; padding: 8px;">
                <option value="" data-i18n="all_statuses">${t('all_statuses')}</option>
                <option value="in_custody" data-i18n="in_custody">${t('in_custody')}</option>
                <option value="released" data-i18n="released">${t('released')}</option>
                <option value="transferred" data-i18n="transferred">${t('transferred')}</option>
                <option value="court_appearance" data-i18n="court_appearance">${t('court_appearance')}</option>
            </select>
            <button class="btn btn-primary" onclick="filterAllCustody()" data-i18n="filter">${t('filter')}</button>
        </div>
        <div id="allCustodyTable">${t('loading_all_custody')}</div>
    `);
    
    loadAllCustodyTable();
}

async function loadAllCustodyTable(status = '') {
    try {
        const response = await obAPI.getAllCustody({ status: status });
        if (response.status === 'success') {
            const records = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="id">${t('id')}</th>
                            <th data-i18n="person_name">${t('person_name')}</th>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="custody_start">${t('custody_start')}</th>
                            <th data-i18n="release_end_date">${t('release_end_date')}</th>
                            <th data-i18n="duration">${t('duration')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (records.length === 0) {
                html += `<tr><td colspan="8" style="text-align: center;" data-i18n="no_custody_records">${t('no_custody_records')}</td></tr>`;
            } else {
                records.forEach(record => {
                    const startDate = new Date(record.custody_start);
                    const endDate = record.custody_end ? new Date(record.custody_end) : new Date();
                    const duration = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)); // days
                    
                    html += `
                        <tr>
                            <td><strong>#${record.id}</strong></td>
                            <td>${record.person_name}</td>
                            <td>${record.case_number || 'N/A'}</td>
                            <td><span class="badge-status">${record.custody_status}</span></td>
                            <td>${startDate.toLocaleDateString()}</td>
                            <td>${record.custody_end ? new Date(record.custody_end).toLocaleDateString() : t('ongoing')}</td>
                            <td>${duration} ${t('days')}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="manageCustody(${record.id})" data-i18n="view">${t('view')}</button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#allCustodyTable').html(html);
        }
    } catch (error) {
        $('#allCustodyTable').html('<div class="alert alert-error">' + t('failed_load_custody_records') + ': ' + error.message + '</div>');
    }
}

function filterAllCustody() {
    const status = $('#custodyStatusFilter').val();
    loadAllCustodyTable(status);
}

// Case Assignments Page
function loadAssignmentsPage() {
    setPageTitle('manage_case_assignments');
    const content = $('#pageContent');
    content.html(`
        <div class="page-header">
            <h2 data-i18n="case_assignments">${t('case_assignments')}</h2>
            <p data-i18n="assign_investigators_desc">${t('assign_investigators_desc')}</p>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 data-i18n="cases_ready_for_assignment">${t('cases_ready_for_assignment')}</h3>
            </div>
            <div class="card-body">
                <table id="assignmentsTable" class="data-table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="crime_type">${t('crime_type')}</th>
                            <th data-i18n="priority">${t('priority')}</th>
                            <th data-i18n="status">${t('status')}</th>
                            <th data-i18n="date_approved">${t('date_approved')}</th>
                            <th data-i18n="assigned_investigators">${t('assigned_investigators')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody id="assignmentsTableBody">
                        <tr><td colspan="7" class="text-center">${getLoadingHTML('loading_data')}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `);
    
    loadAssignmentsTable();
}

async function loadAssignmentsTable() {
    try {
        // For now, we'll show all active assignments
        // In a real implementation, this would fetch from /station/assignments endpoint
        const response = await api.get('/station/cases/pending'); // Placeholder
        
        let html = `
            <h3>Active Case Assignments</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Case Number</th>
                        <th>Crime Type</th>
                        <th>Assigned To</th>
                        <th>Assigned Date</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="7" style="text-align: center;">
                            No assignments data available yet.<br>
                            <small>This page will show case-to-investigator assignments.</small>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-top: 30px;">
                <h3>Assign Cases to Investigators</h3>
                <p>Select a case from "All Cases" page and use the "Assign" button to assign investigators.</p>
            </div>
        `;
        
        $('#assignmentsTable').html(html);
    } catch (error) {
        $('#assignmentsTable').html('<div class="alert alert-info">Case assignment management - Coming soon!</div>');
    }
}

async function loadUnassignedCases() {
    setPageTitle('unassigned_cases');
    const content = $('#pageContent');
    content.html(`
        <div style="margin-bottom: 20px;">
            <button class="btn btn-secondary" onclick="loadAssignmentsPage()">
                <i class="fas fa-arrow-left"></i> Back to Assignments
            </button>
        </div>
        <div id="unassignedCasesTable">Loading unassigned cases...</div>
    `);
    
    loadUnassignedCasesTable();
}

async function loadUnassignedCasesTable() {
    try {
        // Get approved cases that haven't been assigned yet
        const response = await obAPI.getCases({ status: 'approved' });
        if (response.status === 'success') {
            const cases = response.data;
            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Case Number</th>
                            <th>Crime Type</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Incident Date</th>
                            <th>Days Waiting</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (cases.length === 0) {
                html += '<tr><td colspan="7" style="text-align: center;">No unassigned cases found</td></tr>';
            } else {
                cases.forEach(caseItem => {
                    const approvedDate = new Date(caseItem.approved_at || caseItem.created_at);
                    const daysWaiting = Math.floor((new Date() - approvedDate) / (1000 * 60 * 60 * 24));
                    
                    html += `
                        <tr ${daysWaiting > 7 ? 'style="background: #fff3cd;"' : ''}>
                            <td><strong>${caseItem.case_number}</strong></td>
                            <td>${caseItem.crime_type}</td>
                            <td><span class="badge-status">${caseItem.crime_category}</span></td>
                            <td>${getPriorityBadge(caseItem.priority)}</td>
                            <td>${new Date(caseItem.incident_date).toLocaleDateString()}</td>
                            <td ${daysWaiting > 7 ? 'style="color: red; font-weight: bold;"' : ''}>
                                ${daysWaiting} days
                                ${daysWaiting > 7 ? '<br><small>(URGENT)</small>' : ''}
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="manageCaseAssignment(${caseItem.id})">Assign Now</button>
                                <button class="btn btn-sm btn-secondary" onclick="viewCaseDetails(${caseItem.id})">View</button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                    </tbody>
                </table>
            `;
            
            $('#unassignedCasesTable').html(html);
        }
    } catch (error) {
        $('#unassignedCasesTable').html('<div class="alert alert-error">Failed to load unassigned cases: ' + error.message + '</div>');
    }
}

// Reports Page
function loadReportsDashboard() {
    setPageTitle('reports_analytics');
    const content = $('#pageContent');
    content.html(`
        <div class="tabs">
            <button class="tab-btn active" onclick="showReportTab('statistics')">Statistics</button>
            <button class="tab-btn" onclick="showReportTab('cases')">Case Reports</button>
            <button class="tab-btn" onclick="showReportTab('performance')">Performance</button>
            <button class="tab-btn" onclick="showReportTab('custom')">Custom Reports</button>
        </div>
        <div id="reportTabContent"></div>
    `);
    
    showReportTab('statistics');
}

function showReportTab(tab) {
    $('.tab-btn').removeClass('active');
    $(`.tab-btn:contains('${tab.charAt(0).toUpperCase() + tab.slice(1)}')`).addClass('active');
    
    const content = $('#reportTabContent');
    
    switch(tab) {
        case 'statistics':
            loadStatisticsReport();
            break;
        case 'cases':
            loadCaseReports();
            break;
        case 'performance':
            loadPerformanceReport();
            break;
        case 'custom':
            loadCustomReports();
            break;
    }
}

function loadStatisticsReport() {
    const content = $('#reportTabContent');
    content.html(`
        <div style="margin: 20px 0;">
            <h3>System Statistics</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Total Cases</span>
                    <span class="info-value" id="statTotalCases">Loading...</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Active Investigations</span>
                    <span class="info-value" id="statActiveInvestigations">Loading...</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Pending Approval</span>
                    <span class="info-value" id="statPendingApproval">Loading...</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Closed Cases</span>
                    <span class="info-value" id="statClosedCases">Loading...</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Active Custody</span>
                    <span class="info-value" id="statActiveCustody">Loading...</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Evidence Items</span>
                    <span class="info-value" id="statTotalEvidence">Loading...</span>
                </div>
            </div>
        </div>
        
        <div style="margin: 30px 0;">
            <h3>Cases by Status</h3>
            <canvas id="casesByStatusChart" width="400" height="200"></canvas>
        </div>
        
        <div style="margin: 30px 0;">
            <h3>Cases by Crime Type</h3>
            <canvas id="casesByCrimeChart" width="400" height="200"></canvas>
        </div>
        
        <div style="margin: 20px 0; text-align: right;">
            <button class="btn btn-primary" onclick="exportStatisticsReport()">
                <i class="fas fa-download"></i> Export Report
            </button>
        </div>
    `);
    
    // Load statistics data
    loadStatisticsData();
}

async function loadStatisticsData() {
    try {
        const response = await api.get('/api/dashboard');
        if (response.status === 'success') {
            const stats = response.data.stats;
            $('#statTotalCases').text(stats.total_cases || 0);
            $('#statActiveInvestigations').text(stats.active_investigations || 0);
            $('#statPendingApproval').text(stats.pending_approval || 0);
            $('#statClosedCases').text(stats.closed_cases || 0);
            $('#statActiveCustody').text(stats.active_custody || 0);
            $('#statTotalEvidence').text(stats.total_evidence || 0);
            
            // Draw charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                drawCaseStatusChart(response.data.cases_by_status);
            }
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

function drawCaseStatusChart(data) {
    const ctx = document.getElementById('casesByStatusChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data || {}),
            datasets: [{
                label: 'Cases',
                data: Object.values(data || {}),
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function loadCaseReports() {
    const content = $('#reportTabContent');
    content.html(`
        <div style="margin: 20px 0;">
            <h3>Generate Case Report</h3>
            <form id="caseReportForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Report Type</label>
                        <select name="report_type">
                            <option value="summary">Case Summary</option>
                            <option value="detailed">Detailed Case Report</option>
                            <option value="timeline">Case Timeline</option>
                            <option value="evidence">Evidence Report</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date Range</label>
                        <select name="date_range">
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Status Filter</label>
                        <select name="status">
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="investigating">Investigating</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Crime Category</label>
                        <select name="category">
                            <option value="">All Categories</option>
                            <option value="violent">Violent Crime</option>
                            <option value="property">Property Crime</option>
                            <option value="drug">Drug Related</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <button type="button" class="btn btn-primary" onclick="generateCaseReport()">
                        <i class="fas fa-file-pdf"></i> Generate Report
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="previewCaseReport()">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                </div>
            </form>
        </div>
    `);
}

function loadPerformanceReport() {
    const content = $('#reportTabContent');
    content.html(`
        <div style="margin: 20px 0;">
            <h3>Performance Metrics</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Average Case Resolution Time</span>
                    <span class="info-value">15 days</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Case Approval Rate</span>
                    <span class="info-value">92%</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Investigation Success Rate</span>
                    <span class="info-value">78%</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Court Submission Rate</span>
                    <span class="info-value">65%</span>
                </div>
            </div>
        </div>
        
        <div style="margin: 30px 0;">
            <h3>Investigator Performance</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Investigator</th>
                        <th>Assigned Cases</th>
                        <th>Completed</th>
                        <th>Pending</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="5" style="text-align: center;">Performance data will be calculated from actual case data</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `);
}

function loadCustomReports() {
    const content = $('#reportTabContent');
    content.html(`
        <div style="margin: 20px 0;">
            <h3>Custom Report Builder</h3>
            <p>Build custom reports by selecting data fields and filters.</p>
            
            <form id="customReportForm">
                <div class="form-group">
                    <label>Report Name</label>
                    <input type="text" name="report_name" placeholder="Enter report name">
                </div>
                
                <div class="form-group">
                    <label>Select Data Fields</label>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <label><input type="checkbox" name="fields" value="case_number"> Case Number</label>
                        <label><input type="checkbox" name="fields" value="crime_type"> Crime Type</label>
                        <label><input type="checkbox" name="fields" value="status"> Status</label>
                        <label><input type="checkbox" name="fields" value="priority"> Priority</label>
                        <label><input type="checkbox" name="fields" value="incident_date"> Incident Date</label>
                        <label><input type="checkbox" name="fields" value="location"> Location</label>
                        <label><input type="checkbox" name="fields" value="investigator"> Investigator</label>
                        <label><input type="checkbox" name="fields" value="evidence_count"> Evidence Count</label>
                        <label><input type="checkbox" name="fields" value="outcome"> Outcome</label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Output Format</label>
                    <select name="format">
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>
                
                <div style="margin-top: 20px;">
                    <button type="button" class="btn btn-primary" onclick="generateCustomReport()">
                        <i class="fas fa-cog"></i> Generate Custom Report
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="saveReportTemplate()">
                        <i class="fas fa-save"></i> Save as Template
                    </button>
                </div>
            </form>
        </div>
    `);
}

function exportStatisticsReport() {
    alert('Exporting statistics report to PDF...');
}

function generateCaseReport() {
    alert('Generating case report based on selected filters...');
}

function previewCaseReport() {
    alert('Previewing case report...');
}

function generateCustomReport() {
    const form = $('#customReportForm')[0];
    const formData = new FormData(form);
    alert('Generating custom report with selected fields...');
}

function saveReportTemplate() {
    alert('Saving report template for future use...');
}

// ============================================
// Case Assignment Management Functions
// ============================================

async function loadAssignmentsTable() {
    try {
        const response = await stationAPI.getCases();
        if (response.status === 'success') {
            const cases = response.data;
            // Filter for approved cases
            const approvedCases = cases.filter(c => c.status === 'approved' || c.status === 'under_investigation');
            
            let html = '';
            if (approvedCases.length === 0) {
                html = '<tr><td colspan="7" class="text-center">No cases available for assignment</td></tr>';
            } else {
                approvedCases.forEach(caseItem => {
                    const investigators = caseItem.investigators || [];
                    const investigatorsList = investigators.length > 0
                        ? investigators.map(inv => `
                            <span class="badge-status ${inv.is_lead_investigator ? 'approved' : 'draft'}" style="margin: 2px;">
                                ${inv.full_name} ${inv.is_lead_investigator ? '(' + t('lead') + ')' : ''}
                            </span>
                        `).join('')
                        : `<span class="badge-status pending" data-i18n="no_investigators_assigned">${t('no_investigators_assigned')}</span>`;
                    
                    html += `
                        <tr>
                            <td><strong>${caseItem.case_number}</strong></td>
                            <td>${caseItem.crime_type}</td>
                            <td>${getPriorityBadge(caseItem.priority)}</td>
                            <td>${getStatusBadge(caseItem.status)}</td>
                            <td>${formatDate(caseItem.updated_at)}</td>
                            <td>${investigatorsList}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="showAssignInvestigatorModal(${caseItem.id}, '${caseItem.case_number}')" data-i18n="assign">
                                    <i class="fas fa-user-plus"></i> ${t('assign')}
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="viewCaseDetails(${caseItem.id})" data-i18n="view">
                                    <i class="fas fa-eye"></i> ${t('view')}
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            $('#assignmentsTableBody').html(html);
        }
    } catch (error) {
        $('#assignmentsTableBody').html(`<tr><td colspan="7" class="text-center text-danger">Error loading cases: ${error.message}</td></tr>`);
    }
}

// Show Assign Investigator Modal
async function showAssignInvestigatorModal(caseId, caseNumber) {
    // Load investigators
    let investigatorsOptions = '<option value="">Select Investigator</option>';
    try {
        const usersResponse = await adminAPI.getUsers();
        if (usersResponse.status === 'success') {
            const investigators = usersResponse.data.filter(u => u.role === 'investigator' && u.is_active);
            investigatorsOptions += investigators.map(inv => 
                `<option value="${inv.id}">${inv.full_name} (${inv.badge_number || 'N/A'})</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Failed to load investigators:', error);
    }
    
    const bodyHtml = `
        <form id="assignInvestigatorForm">
            <div class="form-group">
                <label><strong>Case:</strong> ${caseNumber}</label>
            </div>
            
            <div class="form-group">
                <label>Investigator *</label>
                <select name="user_id" required>
                    ${investigatorsOptions}
                </select>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="is_lead_investigator"> Assign as Lead Investigator
                </label>
            </div>
            
            <div class="form-group">
                <label>Assignment Notes</label>
                <textarea name="assignment_notes" rows="3" placeholder="Special instructions or notes for this assignment..."></textarea>
            </div>
        </form>
    `;
    
    showModal('Assign Investigator to Case', bodyHtml, [
        { text: 'Cancel', class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: 'Assign', class: 'btn btn-primary', onclick: `submitAssignInvestigator(${caseId})` }
    ]);
}

// Submit Assignment
async function submitAssignInvestigator(caseId) {
    const form = $('#assignInvestigatorForm')[0];
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.case_id = caseId;
    data.is_lead_investigator = data.is_lead_investigator ? 1 : 0;
    
    try {
        showLoading('Assigning Investigator', 'Please wait...');
        const response = await stationAPI.assignInvestigator(data);
        
        closeAlert();
        if (response.status === 'success') {
            await showSuccess('Success!', 'Investigator assigned successfully!');
            closeModal();
            loadAssignmentsTable();
        }
    } catch (error) {
        closeAlert();
        console.error('Assignment error:', error);
        
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
                title: 'Validation Error',
                html: errorText.replace(/\n/g, '<br>'),
                confirmButtonColor: '#ef4444'
            });
        } else {
            await showError('Error', 'Failed to assign investigator: ' + error.message);
        }
    }
}

// ============================================
// Related Cases Functions
// ============================================

let selectedRelatedCases = [];
let searchTimeout = null;

async function searchRelatedCases(event) {
    const searchTerm = event.target.value.trim();
    
    if (searchTerm.length < 3) {
        $('#relatedCasesResults').hide();
        return;
    }
    
    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const response = await obAPI.getCases();
            if (response.status === 'success') {
                const cases = response.data;
                
                // Filter cases based on search term
                const filteredCases = cases.filter(c => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                        c.case_number.toLowerCase().includes(searchLower) ||
                        c.crime_type.toLowerCase().includes(searchLower) ||
                        c.incident_description.toLowerCase().includes(searchLower)
                    );
                });
                
                displaySearchResults(filteredCases);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

function displaySearchResults(cases) {
    const resultsDiv = $('#relatedCasesResults');
    
    if (cases.length === 0) {
        resultsDiv.html('<p style="color: #6b7280; margin: 0;">No cases found</p>');
        resultsDiv.show();
        return;
    }
    
    let html = '<div style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">Click to select related case:</div>';
    
    cases.forEach(caseItem => {
        // Don't show already selected cases
        if (selectedRelatedCases.includes(caseItem.id)) {
            return;
        }
        
        html += `
            <div class="search-result-item" onclick="addRelatedCase(${caseItem.id}, '${caseItem.case_number}', '${caseItem.crime_type}')" 
                 style="padding: 10px; border: 1px solid #e5e7eb; margin-bottom: 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;"
                 onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">
                <strong>${caseItem.case_number}</strong> - ${caseItem.crime_type}<br>
                <small style="color: #6b7280;">${caseItem.incident_description.substring(0, 80)}...</small><br>
                <small style="color: #9ca3af;">${getStatusBadge(caseItem.status)} | ${formatDate(caseItem.incident_date)}</small>
            </div>
        `;
    });
    
    resultsDiv.html(html);
    resultsDiv.show();
}

function addRelatedCase(caseId, caseNumber, crimeType) {
    if (selectedRelatedCases.includes(caseId)) {
        return;
    }
    
    selectedRelatedCases.push(caseId);
    displaySelectedCases();
    
    // Clear search
    $('#relatedCaseSearch').val('');
    $('#relatedCasesResults').hide();
}

function removeRelatedCase(caseId) {
    selectedRelatedCases = selectedRelatedCases.filter(id => id !== caseId);
    displaySelectedCases();
}

function displaySelectedCases() {
    const container = $('#selectedRelatedCases');
    
    if (selectedRelatedCases.length === 0) {
        container.html('');
        return;
    }
    
    let html = '<div style="margin-bottom: 15px;"><strong>Selected Related Cases:</strong></div>';
    
    selectedRelatedCases.forEach(caseId => {
        html += `
            <div style="display: inline-block; background: #eff6ff; border: 1px solid #3b82f6; padding: 8px 12px; border-radius: 20px; margin: 5px;">
                <span>Case #${caseId}</span>
                <button type="button" onclick="removeRelatedCase(${caseId})" 
                        style="background: none; border: none; color: #ef4444; margin-left: 8px; cursor: pointer; font-size: 16px;">
                    ï¿½
                </button>
            </div>
        `;
    });
    
    container.html(html);
}


// Load related cases for case details view
async function loadRelatedCasesForView(caseId) {
    try {
        const response = await obAPI.getCaseRelationships(caseId);
        if (response.status === 'success' && response.data && response.data.length > 0) {
            const relatedCases = response.data;
            let html = '<div class="related-cases-list">';
            
            relatedCases.forEach(related => {
                html += `
                    <div class="related-case-item" style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong style="color: #3b82f6;">${related.case_number}</strong>
                                <span class="badge-status" style="margin-left: 10px;">${related.relationship_type}</span>
                                <p style="margin: 8px 0 0 0; color: #6b7280;">
                                    ${related.crime_type} | ${formatDate(related.incident_date)}
                                </p>
                                ${related.notes ? `<p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af;"><em>${related.notes}</em></p>` : ''}
                            </div>
                            <button class="btn btn-sm btn-secondary" onclick="viewCaseDetails(${related.related_case_id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            $('#relatedCasesContent').html(html);
        } else {
            $('#relatedCasesSection').hide();
        }
    } catch (error) {
        console.error('Failed to load related cases:', error);
        $('#relatedCasesSection').hide();
    }
}



// ============================================
// OB Entry Page - Create New Cases
// ============================================

// OB En

// ============================================
// PERSONS MANAGEMENT PAGE
// ============================================

// Load Persons Page
function loadPersonsPage() {
    setPageTitle('persons_management');
    const content = $('#pageContent');
    content.html(`
        <div class="persons-page-container">
            <div class="persons-header">
                <h2><i class="fas fa-users"></i> ${t('persons_management')}</h2>
                <p>${t('view_manage_persons')}</p>
            </div>
            
            <div class="persons-filters">
                <div class="filter-group">
                    <label>${t('person_type')}:</label>
                    <select id="personTypeFilter" onchange="filterPersons()">
                        <option value="">${t('all_types')}</option>
                        <option value="accused">${t('accused')}</option>
                        <option value="accuser">${t('accuser')}</option>
                        <option value="witness">${t('witness')}</option>
                        <option value="other">${t('other_bailer')}</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>${t('search')}:</label>
                    <input type="text" id="personSearch" placeholder="${t('search_name_id_phone')}" onkeyup="filterPersons()">
                </div>
            </div>
            
            <div id="personsTableContainer" class="table-container">
                ${t('loading_persons')}
            </div>
        </div>
        
        <style>
            .persons-page-container { max-width: 1400px; margin: 0 auto; padding: 20px; }
            .persons-header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
            .persons-header h2 { margin: 0 0 10px 0; font-size: 28px; }
            .persons-filters { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
            .filter-group { display: flex; flex-direction: column; gap: 5px; }
            .filter-group label { font-weight: 600; color: #374151; }
            .filter-group select, .filter-group input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; min-width: 200px; }
            .table-container { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow-x: auto; }
            .person-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .person-badge.accused { background: #fee2e2; color: #991b1b; }
            .person-badge.accuser { background: #d1fae5; color: #065f46; }
            .person-badge.witness { background: #dbeafe; color: #1e40af; }
            .person-badge.other { background: #e5e7eb; color: #1f2937; }
            .person-photo-thumb { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb; }
            .case-count { display: inline-block; background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px; }
        </style>
    `);
    
    loadPersonsTable();
}

// Load Persons Table
async function loadPersonsTable() {
    try {
        const response = await obAPI.getAllPersons();
        if (response.status === 'success') {
            renderPersonsTable(response.data);
        }
    } catch (error) {
        $('#personsTableContainer').html('<div class="alert alert-error">' + t('failed_load_persons') + ': ' + error.message + '</div>');
    }
}

// Render Persons Table
function renderPersonsTable(persons) {
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th data-i18n="photo">${t('photo')}</th>
                    <th data-i18n="name">${t('name')}</th>
                    <th data-i18n="type">${t('type')}</th>
                    <th data-i18n="national_id">${t('national_id')}</th>
                    <th data-i18n="phone">${t('phone')}</th>
                    <th data-i18n="connected_cases">${t('connected_cases')}</th>
                    <th data-i18n="custody_status">${t('custody_status')}</th>
                    <th data-i18n="actions">${t('actions')}</th>
                </tr>
            </thead>
            <tbody id="personsTableBody">
    `;
    
    if (persons.length === 0) {
        html += '<tr><td colspan="8" style="text-align: center; padding: 40px;">' + t('no_persons_found') + '</td></tr>';
    } else {
        persons.forEach(person => {
            const photoUrl = person.photo_path ? `/${person.photo_path}` : '/assets/images/default-avatar.png';
            const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.trim();
            const caseCount = person.case_count || 0;
            const custodyStatus = person.custody_status ? person.custody_status : 'none';
            
            html += `
                <tr data-person-type="${person.person_type}">
                    <td><img src="${photoUrl}" class="person-photo-thumb" alt="${fullName}"></td>
                    <td><strong>${fullName}</strong></td>
                    <td><span class="person-badge ${person.person_type}">${person.person_type}</span></td>
                    <td>${person.national_id || 'N/A'}</td>
                    <td>${person.phone || 'N/A'}</td>
                    <td>
                        <a href="#" onclick="viewPersonCases(${person.id}); return false;">
                            ${caseCount} ${caseCount !== 1 ? t('cases') : t('case')} 
                            <i class="fas fa-external-link-alt" style="font-size: 10px;"></i>
                        </a>
                    </td>
                    <td>${getCustodyStatusBadge(custodyStatus)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewPersonDetails(${person.id})">
                            <i class="fas fa-eye"></i> ${t('view')}
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editPersonDetails(${person.id})">
                            <i class="fas fa-edit"></i> ${t('edit')}
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table>';
    $('#personsTableContainer').html(html);
}

// Filter Persons
function filterPersons() {
    const typeFilter = $('#personTypeFilter').val().toLowerCase();
    const searchText = $('#personSearch').val().toLowerCase();
    
    $('#personsTableBody tr').each(function() {
        const row = $(this);
        const personType = row.attr('data-person-type');
        const rowText = row.text().toLowerCase();
        
        const matchesType = !typeFilter || personType === typeFilter;
        const matchesSearch = !searchText || rowText.includes(searchText);
        
        if (matchesType && matchesSearch) {
            row.show();
        } else {
            row.hide();
        }
    });
}

// Get Custody Status Badge
function getCustodyStatusBadge(status) {
    const badges = {
        'in_custody': '<span class="badge badge-danger" data-i18n="in_custody">' + t('in_custody') + '</span>',
        'bailed': '<span class="badge badge-warning" data-i18n="bailed">' + t('bailed') + '</span>',
        'released': '<span class="badge badge-success" data-i18n="released">' + t('released') + '</span>',
        'transferred': '<span class="badge badge-info" data-i18n="transferred">' + t('transferred') + '</span>',
        'escaped': '<span class="badge badge-danger" data-i18n="escaped">' + t('escaped') + '</span>',
        'none': '<span class="badge badge-secondary" data-i18n="no_custody">' + t('no_custody') + '</span>',
        'null': '<span class="badge badge-secondary" data-i18n="no_custody">' + t('no_custody') + '</span>'
    };
    return badges[status] || badges['none'];
}

// View Person Details Modal
async function viewPersonDetails(personId) {
    try {
        showLoading(t('loading_person_details'));
        const response = await obAPI.getPerson(personId);
        
        if (response.status === 'success') {
            const person = response.data;
            const fullName = `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.trim();
            const photoUrl = person.photo_path ? `/${person.photo_path}` : '/assets/images/default-avatar.png';
            
            closeAlert();
            
            await Swal.fire({
                title: fullName,
                html: `
                    <div class="person-details-modal">
                        <div class="person-photo-section">
                            <img src="${photoUrl}" style="max-width: 150px; max-height: 150px; border-radius: 12px; border: 3px solid #e5e7eb;">
                        </div>
                        
                        <div class="person-info-grid">
                            <div class="info-item">
                                <strong data-i18n="type">${t('type')}:</strong>
                                <span class="person-badge ${person.person_type}">${person.person_type.toUpperCase()}</span>
                            </div>
                            <div class="info-item">
                                <strong data-i18n="national_id">${t('national_id')}:</strong> ${person.national_id || 'N/A'}
                            </div>
                            <div class="info-item">
                                <strong data-i18n="phone">${t('phone')}:</strong> ${person.phone || 'N/A'}
                            </div>
                            <div class="info-item">
                                <strong data-i18n="email">${t('email')}:</strong> ${person.email || 'N/A'}
                            </div>
                            <div class="info-item">
                                <strong data-i18n="gender">${t('gender')}:</strong> ${person.gender || 'N/A'}
                            </div>
                            <div class="info-item">
                                <strong data-i18n="date_of_birth">${t('date_of_birth')}:</strong> ${person.date_of_birth || 'N/A'}
                            </div>
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <strong data-i18n="address">${t('address')}:</strong> ${person.address || 'N/A'}
                            </div>
                        </div>
                        
                        <div class="person-cases-section">
                            <h4 data-i18n="connected_cases">${t('connected_cases')}</h4>
                            <div id="personCasesList">${t('loading_cases_dots')}</div>
                        </div>
                        
                        <div class="person-custody-section">
                            <h4 data-i18n="custody_history">${t('custody_history')} 
                                <button class="btn btn-sm btn-primary" onclick="manageCustodyForPerson(${person.id}, '${fullName}'); return false;" style="float: right;">
                                    <i class="fas fa-edit"></i> ${t('manage_custody')}
                                </button>
                            </h4>
                            <div id="personCustodyList">${t('loading_custody_records')}</div>
                        </div>
                    </div>
                    
                    <style>
                        .person-details-modal { text-align: left; }
                        .person-photo-section { text-align: center; margin-bottom: 20px; }
                        .person-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
                        .info-item { padding: 10px; background: #f9fafb; border-radius: 6px; }
                        .person-cases-section, .person-custody-section { margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; }
                    </style>
                `,
                width: '800px',
                showConfirmButton: true,
                confirmButtonText: t('close'),
                didOpen: () => {
                    loadPersonCasesInModal(personId);
                    loadPersonCustodyInModal(personId);
                }
            });
        }
    } catch (error) {
        closeAlert();
        await showError(t('error'), t('failed_load_person_details') + ': ' + error.message);
    }
}

// Load Person Cases in Modal
async function loadPersonCasesInModal(personId) {
    try {
        const response = await obAPI.getPersonCases(personId);
        if (response.status === 'success' && response.data.length > 0) {
            let html = '<ul>';
            response.data.forEach(caseItem => {
                html += `<li><strong>${caseItem.case_number}</strong> - ${caseItem.crime_type} (${caseItem.party_role})</li>`;
            });
            html += '</ul>';
            $('#personCasesList').html(html);
        } else {
            $('#personCasesList').html('<p style="color: #6b7280;" data-i18n="no_connected_cases">' + t('no_connected_cases') + '</p>');
        }
    } catch (error) {
        $('#personCasesList').html('<p style="color: #ef4444;">' + t('failed_load_cases') + '</p>');
    }
}

// Load Person Custody in Modal
async function loadPersonCustodyInModal(personId) {
    try {
        const response = await obAPI.getPersonCustody(personId);
        if (response.status === 'success' && response.data.length > 0) {
            let html = '<ul>';
            response.data.forEach(custody => {
                html += `<li><strong>${custody.case_number}</strong> - ${custody.custody_status} (${custody.custody_start})</li>`;
            });
            html += '</ul>';
            $('#personCustodyList').html(html);
        } else {
            $('#personCustodyList').html('<p style="color: #6b7280;" data-i18n="no_custody_records">' + t('no_custody_records') + '</p>');
        }
    } catch (error) {
        $('#personCustodyList').html('<p style="color: #ef4444;">' + t('failed_load_custody_records') + '</p>');
    }
}

// View Person Cases (separate page)
async function viewPersonCases(personId) {
    await viewPersonDetails(personId);
}

// Edit Person Details
async function editPersonDetails(personId) {
    try {
        showLoading(t('loading_person_details'));
        const response = await obAPI.getPerson(personId);
        
        if (response.status === 'success') {
            const person = response.data;
            closeAlert();
            
            const result = await Swal.fire({
                title: t('edit_person_details'),
                html: `
                    <form id="editPersonForm" style="text-align: left;">
                        <div class="form-group">
                            <label data-i18n="first_name">${t('first_name')} *</label>
                            <input type="text" id="edit_first_name" class="swal2-input" value="${person.first_name}" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="middle_name">${t('middle_name')}</label>
                            <input type="text" id="edit_middle_name" class="swal2-input" value="${person.middle_name || ''}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="last_name">${t('last_name')} *</label>
                            <input type="text" id="edit_last_name" class="swal2-input" value="${person.last_name}" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="national_id">${t('national_id')}</label>
                            <input type="text" id="edit_national_id" class="swal2-input" value="${person.national_id || ''}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="phone">${t('phone')}</label>
                            <input type="tel" id="edit_phone" class="swal2-input" value="${person.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="email">${t('email')}</label>
                            <input type="email" id="edit_email" class="swal2-input" value="${person.email || ''}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="gender">${t('gender')}</label>
                            <select id="edit_gender" class="swal2-input">
                                <option value="">${t('select')}</option>
                                <option value="male" ${person.gender === 'male' ? 'selected' : ''}>${t('male')}</option>
                                <option value="female" ${person.gender === 'female' ? 'selected' : ''}>${t('female')}</option>
                                <option value="other" ${person.gender === 'other' ? 'selected' : ''}>${t('other')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label data-i18n="date_of_birth">${t('date_of_birth')}</label>
                            <input type="date" id="edit_dob" class="swal2-input" value="${person.date_of_birth || ''}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="address">${t('address')}</label>
                            <textarea id="edit_address" class="swal2-textarea">${person.address || ''}</textarea>
                        </div>
                    </form>
                `,
                width: '600px',
                showCancelButton: true,
                confirmButtonText: t('update_person'),
                cancelButtonText: t('cancel'),
                preConfirm: () => {
                    return {
                        first_name: document.getElementById('edit_first_name').value,
                        middle_name: document.getElementById('edit_middle_name').value,
                        last_name: document.getElementById('edit_last_name').value,
                        national_id: document.getElementById('edit_national_id').value,
                        phone: document.getElementById('edit_phone').value,
                        email: document.getElementById('edit_email').value,
                        gender: document.getElementById('edit_gender').value,
                        date_of_birth: document.getElementById('edit_dob').value,
                        address: document.getElementById('edit_address').value
                    };
                }
            });
            
            if (result.isConfirmed) {
                showLoading(t('updating_person'));
                const updateResponse = await obAPI.updatePerson(personId, result.value);
                closeAlert();
                
                if (updateResponse.status === 'success') {
                    await showSuccess(t('success'), t('person_updated_success'));
                    loadPersonsTable(); // Reload table
                }
            }
        }
    } catch (error) {
        closeAlert();
        await showError(t('error'), t('failed_update_person') + ': ' + error.message);
    }
}
// ============================================
// MANAGE CUSTODY FOR PERSON
// ============================================

// Manage Custody for Person
async function manageCustodyForPerson(personId, personName) {
    try {
        showLoading(t('loading_custody_info'));
        
        // Get person's current custody status
        const custodyResponse = await obAPI.getPersonCustody(personId);
        const activeCustody = custodyResponse.data.find(c => c.custody_status === 'in_custody' || c.custody_status === 'not_present');
        
        closeAlert();
        
        const result = await Swal.fire({
            title: `${t('manage_custody_title')} - ${personName}`,
            html: `
                <form id="manageCustodyForm" style="text-align: left;">
                    <div class="form-group">
                        <label data-i18n="custody_action">${t('custody_action')} *</label>
                        <select id="custody_action" class="swal2-input" onchange="toggleCustodyActionFields()" required>
                            <option value="">${t('select_action')}</option>
                            ${!activeCustody ? '<option value="create_arrested">' + t('mark_as_arrested') + '</option>' : ''}
                            ${!activeCustody ? '<option value="create_bailed">' + t('mark_as_bailed') + '</option>' : ''}
                            ${activeCustody && activeCustody.custody_status === 'in_custody' ? '<option value="update_to_bailed">' + t('grant_bail') + '</option>' : ''}
                            ${activeCustody && activeCustody.custody_status === 'in_custody' ? '<option value="update_to_released">' + t('release_from_custody') + '</option>' : ''}
                        </select>
                    </div>
                    
                    <div id="custody_case_field" style="display: none;">
                        <div class="form-group">
                            <label data-i18n="select_case_label">${t('select_case_label')} *</label>
                            <select id="custody_case_id" class="swal2-input">
                                <option value="">${t('loading_cases_dots')}</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Arrested Fields -->
                    <div id="arrested_custody_fields" style="display: none;">
                        <div class="form-group">
                            <label data-i18n="custody_location">${t('custody_location')}</label>
                            <input type="text" id="custody_location" class="swal2-input" value="${t('station_lockup')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="cell_number">${t('cell_number')}</label>
                            <input type="text" id="cell_number" class="swal2-input" placeholder="${t('cell_number_placeholder')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="custody_notes">${t('custody_notes')}</label>
                            <textarea id="custody_notes" class="swal2-textarea" placeholder="${t('custody_notes_placeholder')}"></textarea>
                        </div>
                    </div>
                    
                    <!-- Bailed Fields -->
                    <div id="bailed_custody_fields" style="display: none;">
                        <h5 style="margin: 15px 0 10px 0; color: #3b82f6;" data-i18n="bailer_information">${t('bailer_information')}</h5>
                        <div class="form-group">
                            <label data-i18n="bailer_full_name">${t('bailer_full_name')} *</label>
                            <input type="text" id="bailer_name" class="swal2-input" placeholder="${t('full_name_placeholder')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="bailer_phone">${t('bailer_phone')} *</label>
                            <input type="tel" id="bailer_phone" class="swal2-input" placeholder="${t('phone_placeholder_somalia')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="bailer_national_id">${t('bailer_national_id')}</label>
                            <input type="text" id="bailer_id" class="swal2-input">
                        </div>
                        <div class="form-group">
                            <label data-i18n="relationship_to_accused">${t('relationship_to_accused')}</label>
                            <input type="text" id="bailer_relationship" class="swal2-input" placeholder="${t('relationship_placeholder_short')}">
                        </div>
                        <div class="form-group">
                            <label data-i18n="bailer_address">${t('bailer_address')}</label>
                            <input type="text" id="bailer_address" class="swal2-input">
                        </div>
                        <div class="form-group">
                            <label data-i18n="bail_conditions">${t('bail_conditions')}</label>
                            <textarea id="bail_conditions" class="swal2-textarea" placeholder="${t('bail_conditions_placeholder')}"></textarea>
                        </div>
                        <div class="form-group">
                            <label data-i18n="bail_amount">${t('bail_amount')}</label>
                            <input type="number" id="bail_amount" class="swal2-input" placeholder="${t('bail_amount_placeholder')}">
                        </div>
                    </div>
                </form>
            `,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: t('update_custody'),
            cancelButtonText: t('cancel'),
            didOpen: async () => {
                // Load person's cases
                const casesResponse = await obAPI.getPersonCases(personId);
                const caseSelect = document.getElementById('custody_case_id');
                if (casesResponse.data.length > 0) {
                    caseSelect.innerHTML = '<option value="">' + t('select_case_label') + '</option>';
                    casesResponse.data.forEach(c => {
                        caseSelect.innerHTML += `<option value="${c.case_id}">${c.case_number} - ${c.crime_type}</option>`;
                    });
                } else {
                    caseSelect.innerHTML = '<option value="">' + t('no_cases_found') + '</option>';
                }
            },
            preConfirm: () => {
                const action = document.getElementById('custody_action').value;
                if (!action) {
                    Swal.showValidationMessage(t('please_select_action'));
                    return false;
                }
                
                const caseId = document.getElementById('custody_case_id').value;
                if ((action === 'create_arrested' || action === 'create_bailed') && !caseId) {
                    Swal.showValidationMessage(t('please_select_case'));
                    return false;
                }
                
                if (action === 'create_bailed' || action === 'update_to_bailed') {
                    const bailerName = document.getElementById('bailer_name').value;
                    const bailerPhone = document.getElementById('bailer_phone').value;
                    if (!bailerName || !bailerPhone) {
                        Swal.showValidationMessage(t('bailer_name_phone_required'));
                        return false;
                    }
                }
                
                return {
                    action: action,
                    case_id: caseId,
                    custody_location: document.getElementById('custody_location')?.value,
                    cell_number: document.getElementById('cell_number')?.value,
                    custody_notes: document.getElementById('custody_notes')?.value,
                    bailer_name: document.getElementById('bailer_name')?.value,
                    bailer_phone: document.getElementById('bailer_phone')?.value,
                    bailer_id: document.getElementById('bailer_id')?.value,
                    bailer_relationship: document.getElementById('bailer_relationship')?.value,
                    bailer_address: document.getElementById('bailer_address')?.value,
                    bail_conditions: document.getElementById('bail_conditions')?.value,
                    bail_amount: document.getElementById('bail_amount')?.value
                };
            }
        });
        
        if (result.isConfirmed) {
            await processCustodyUpdate(personId, result.value, activeCustody);
        }
    } catch (error) {
        closeAlert();
        await showError(t('error'), t('failed_manage_custody') + ': ' + error.message);
    }
}

// Toggle custody action fields
function toggleCustodyActionFields() {
    const action = document.getElementById('custody_action').value;
    const caseField = document.getElementById('custody_case_field');
    const arrestedFields = document.getElementById('arrested_custody_fields');
    const bailedFields = document.getElementById('bailed_custody_fields');
    
    // Hide all first
    caseField.style.display = 'none';
    arrestedFields.style.display = 'none';
    bailedFields.style.display = 'none';
    
    if (action === 'create_arrested') {
        caseField.style.display = 'block';
        arrestedFields.style.display = 'block';
    } else if (action === 'create_bailed') {
        caseField.style.display = 'block';
        bailedFields.style.display = 'block';
    } else if (action === 'update_to_bailed') {
        bailedFields.style.display = 'block';
    }
}

// Process custody update
async function processCustodyUpdate(personId, data, activeCustody) {
    try {
        showLoading('Processing custody update...');
        
        console.log('Processing custody update:', data.action);
        console.log('Case ID:', data.case_id);
        console.log('Active Custody:', activeCustody);
        
        if (data.action === 'create_arrested') {
            // Create new custody record as arrested
            const custodyData = {
                case_id: parseInt(data.case_id),
                person_id: personId,
                custody_status: 'in_custody',
                custody_location: data.custody_location,
                custody_start: new Date().toISOString().slice(0, 19).replace('T', ' '),
                cell_number: data.cell_number,
                custody_notes: data.custody_notes
            };
            console.log('About to create custody with data:', custodyData);
            const custodyCreateResponse = await obAPI.createCustody(custodyData);
            console.log('Custody creation response:', custodyCreateResponse);
            
        } else if (data.action === 'create_bailed') {
            // Create bailer first
            const bailerName = data.bailer_name.split(' ');
            const bailerData = {
                person_type: 'other',
                first_name: bailerName[0],
                last_name: bailerName.slice(1).join(' ') || bailerName[0],
                national_id: data.bailer_id,
                phone: data.bailer_phone,
                address: data.bailer_address,
                case_id: parseInt(data.case_id)
            };
            await obAPI.createPerson(bailerData);
            
            // Create custody record as released/bailed
            const custodyData = {
                case_id: parseInt(data.case_id),
                person_id: personId,
                custody_status: 'released',
                custody_start: new Date().toISOString().slice(0, 19).replace('T', ' '),
                custody_end: new Date().toISOString().slice(0, 19).replace('T', ' '),
                custody_notes: `Bailed by: ${data.bailer_name}\nRelationship: ${data.bailer_relationship || 'N/A'}\nBail Amount: ${data.bail_amount || 'N/A'}\nBail Conditions: ${data.bail_conditions || 'None specified'}`
            };
            console.log('About to create custody with data:', custodyData);
            const custodyCreateResponse = await obAPI.createCustody(custodyData);
            console.log('Custody creation response:', custodyCreateResponse);
            
        } else if (data.action === 'update_to_bailed' && activeCustody) {
            // Create bailer first
            const bailerName = data.bailer_name.split(' ');
            const bailerData = {
                person_type: 'other',
                first_name: bailerName[0],
                last_name: bailerName.slice(1).join(' ') || bailerName[0],
                national_id: data.bailer_id,
                phone: data.bailer_phone,
                address: data.bailer_address,
                case_id: activeCustody.case_id
            };
            await obAPI.createPerson(bailerData);
            
            // Update existing custody to released
            const updateData = {
                custody_status: 'released',
                custody_end: new Date().toISOString().slice(0, 19).replace('T', ' '),
                custody_notes: (activeCustody.custody_notes || '') + `\n\nBailed by: ${data.bailer_name}\nRelationship: ${data.bailer_relationship || 'N/A'}\nBail Amount: ${data.bail_amount || 'N/A'}\nBail Conditions: ${data.bail_conditions || 'None specified'}`
            };
            await obAPI.updateCustody(activeCustody.id, updateData);
            
        } else if (data.action === 'update_to_released' && activeCustody) {
            // Simply release from custody
            const updateData = {
                custody_status: 'released',
                custody_end: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };
            await obAPI.updateCustody(activeCustody.id, updateData);
        }
        
        closeAlert();
        await showSuccess('Success!', 'Custody status updated successfully');
        
        // Reload persons page if on it
        if (window.location.hash.includes('persons')) {
            loadPersonsTable();
        }
        
    } catch (error) {
        closeAlert();
        await showError('Error', 'Failed to update custody: ' + error.message);
    }
}

// ============================================
// Language Toggle Function
// ============================================

// Language dropdown toggle
function toggleLanguageMenu() {
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// Close language dropdown when clicking outside
$(document).on('click', function(e) {
    if (!$(e.target).closest('.language-dropdown').length) {
        $('#languageDropdown').hide();
    }
});

// ============================================
// Medical Examination Form
// ============================================

// Load Medical Examination Form Page
function loadMedicalExaminationForm() {
    $('#pageTitle').text(t('medical_examination_form'));
    $('#pageContent').html('<iframe id="medicalFormIframe" src="assets/pages/medical-examination-report.html" style="width:100%; height:calc(100vh - 100px); border:none;"></iframe>');
    
    // Listen for case data requests from iframe
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'REQUEST_CASE_DATA') {
            sendCaseDataToForm();
        }
    });
}

// Load Medical Forms Dashboard
function loadMedicalFormsDashboard() {
    $('#pageTitle').text(t('medical_forms_dashboard'));
    $('#pageContent').html('<iframe id="medicalFormsDashboardIframe" src="assets/pages/medical-forms-dashboard.html" style="width:100%; height:calc(100vh - 100px); border:none;"></iframe>');
}

function loadSolvedCasesDashboard() {
    $('#pageTitle').text(t('solved_cases_dashboard'));
    $('#pageContent').html('<iframe id="solvedCasesDashboardIframe" src="assets/pages/solved-cases-dashboard.html" style="width:100%; height:calc(100vh - 100px); border:none;"></iframe>');
}

function loadReopenCasesPage() {
    // Only admin and super_admin can access this page
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        $('#pageTitle').text(t('access_denied') || 'Access Denied');
        $('#pageContent').html(`
            <div class="alert alert-danger" style="margin: 20px; padding: 30px; text-align: center;">
                <h4><i class="fas fa-lock"></i> ${t('access_denied') || 'Access Denied'}</h4>
                <p style="margin-top: 15px; font-size: 16px;">${t('no_permission_page') || 'You do not have permission to access this page.'}</p>
                <p style="margin-top: 10px; color: #666;">${t('admin_only_page') || 'This page is only accessible to administrators.'}</p>
            </div>
        `);
        return;
    }
    $('#pageTitle').text(t('reopen_cases_management') || 'Reopen Cases Management');
    $('#pageContent').html('<iframe id="reopenCasesIframe" src="assets/pages/reopen-cases.html" style="width:100%; height:calc(100vh - 100px); border:none;"></iframe>');
}

// Load Non-Criminal Certificate Page
function loadNonCriminalCertificate() {
    $('#pageTitle').text(t('non_criminal_certificate'));
    $('#pageContent').html('<iframe id="nonCriminalCertIframe" src="assets/pages/non-criminal-certificate.html" style="width:100%; height:calc(100vh - 100px); border:none;"></iframe>');
}

// Load Certificates Dashboard
function loadCertificatesDashboard() {
    $('#pageTitle').text(t('certificates_dashboard'));
    $('#pageContent').html('<iframe id="certsDashboardIframe" src="assets/pages/certificates-dashboard.html" style="width:100%; height:calc(100vh - 100px); border:none;"></iframe>');
    
    // Listen for navigation messages from iframe
    window.addEventListener('message', function(event) {
        if (event.data && event.data.action === 'navigate') {
            navigateToPage(event.data.page);
        }
    });
}

// Send case data to medical form iframe
function sendCaseDataToForm() {
    const iframe = document.getElementById('medicalFormIframe');
    if (!iframe) return;
    
    // Get current active case if any
    const activeCaseId = localStorage.getItem('active_case_id');
    
    if (activeCaseId) {
        // Fetch case data from API
        $.ajax({
            url: `${API_BASE_URL}/investigation/cases/${activeCaseId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'X-Language': getCurrentLanguage()
            },
            success: function(response) {
                if (response.data) {
                    const caseData = {
                        id: response.data.id,
                        case_number: response.data.case_number,
                        victim_name: response.data.victim_name || '',
                        accused_name: response.data.accused_name || '',
                        location: response.data.location || '',
                        incident_date: response.data.incident_date || '',
                        investigator: {
                            name: currentUser.full_name || currentUser.username,
                            rank: currentUser.rank || '',
                            phone: currentUser.phone || ''
                        }
                    };
                    
                    // Send case data to iframe
                    iframe.contentWindow.postMessage({
                        type: 'CASE_DATA',
                        caseData: caseData
                    }, '*');
                }
            },
            error: function() {
                console.log('No active case found');
                // Send user data at least
                iframe.contentWindow.postMessage({
                    type: 'CASE_DATA',
                    caseData: {
                        investigator: {
                            name: currentUser.full_name || currentUser.username,
                            rank: currentUser.rank || '',
                            phone: currentUser.phone || ''
                        }
                    }
                }, '*');
            }
        });
    } else {
        // No active case, just send user info
        iframe.contentWindow.postMessage({
            type: 'CASE_DATA',
            caseData: {
                investigator: {
                    name: currentUser.full_name || currentUser.username,
                    rank: currentUser.rank || '',
                    phone: currentUser.phone || ''
                }
            }
        }, '*');
    }
}

