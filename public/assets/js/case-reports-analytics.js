// ============================================
// CASE REPORTS & ANALYTICS DASHBOARD
// ============================================

/**
 * Load Case Reports Dashboard
 */
async function loadCaseReportsDashboard() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('case_reports_analytics');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        // Fetch case statistics
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderCaseReportsDashboard(data.data));
            // Load charts after render
            setTimeout(() => {
                loadCaseCharts(data.data);
            }, 100);
        } else {
            content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
        }
    } catch (error) {
        console.error('Error loading case reports:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render Case Reports Dashboard
 */
function renderCaseReportsDashboard(stats) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="case-reports-dashboard">
            <!-- Page Header -->
            <div class="page-header">
                <h2><i class="fas fa-chart-line"></i> <span data-i18n="case_reports_analytics">${t('case_reports_analytics')}</span></h2>
                <p class="text-muted" data-i18n="comprehensive_case_statistics">${t('comprehensive_case_statistics')}</p>
            </div>
            
            <!-- Date Range Selector -->
            <div class="filters-card">
                <h3><i class="fas fa-filter"></i> <span data-i18n="filter_by_date">${t('filter_by_date')}</span></h3>
                <div class="filter-controls">
                    <button class="filter-btn active" onclick="filterCaseReports('today')" data-period="today">
                        <i class="fas fa-calendar-day"></i> <span data-i18n="today">${t('today')}</span>
                    </button>
                    <button class="filter-btn" onclick="filterCaseReports('week')" data-period="week">
                        <i class="fas fa-calendar-week"></i> <span data-i18n="this_week">${t('this_week')}</span>
                    </button>
                    <button class="filter-btn" onclick="filterCaseReports('month')" data-period="month">
                        <i class="fas fa-calendar-alt"></i> <span data-i18n="this_month">${t('this_month')}</span>
                    </button>
                    <button class="filter-btn" onclick="filterCaseReports('year')" data-period="year">
                        <i class="fas fa-calendar"></i> <span data-i18n="this_year">${t('this_year')}</span>
                    </button>
                    <button class="filter-btn" onclick="showCustomDateRange()">
                        <i class="fas fa-calendar-range"></i> <span data-i18n="custom_range">${t('custom_range')}</span>
                    </button>
                </div>
            </div>
            
            <!-- Summary Statistics -->
            <div class="stats-overview">
                <div class="stats-grid">
                    <div class="stat-card stat-primary clickable-stat" onclick="viewAllCasesFiltered()">
                        <div class="stat-icon"><i class="fas fa-folder"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalCasesCount">${stats.total_cases || 0}</div>
                            <div class="stat-label" data-i18n="total_cases">${t('total_cases')}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-success clickable-stat" onclick="viewCasesByStatusFiltered('solved')">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="solvedCasesCount">${stats.solved_cases || 0}</div>
                            <div class="stat-label" data-i18n="solved_cases">${t('solved_cases')}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-warning clickable-stat" onclick="viewActiveCasesFiltered()">
                        <div class="stat-icon"><i class="fas fa-spinner"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="activeCasesCount">${stats.active_cases || 0}</div>
                            <div class="stat-label" data-i18n="active_cases">${t('active_cases')}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-danger clickable-stat" onclick="viewCustodyDetailsFiltered()">
                        <div class="stat-icon"><i class="fas fa-user-lock"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="custodyCount">${stats.in_custody || 0}</div>
                            <div class="stat-label" data-i18n="in_custody">${t('in_custody')}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Charts Section -->
            <div class="charts-section">
                <div class="chart-row">
                    <!-- Case Status Distribution -->
                    <div class="chart-card">
                        <h3><i class="fas fa-chart-pie"></i> <span data-i18n="case_status_distribution">${t('case_status_distribution')}</span></h3>
                        <canvas id="caseStatusChart"></canvas>
                    </div>
                    
                    <!-- Cases by Priority -->
                    <div class="chart-card">
                        <h3><i class="fas fa-exclamation-triangle"></i> <span data-i18n="cases_by_priority">${t('cases_by_priority')}</span></h3>
                        <canvas id="casePriorityChart"></canvas>
                    </div>
                </div>
                
                <!-- Case Trends Over Time -->
                <div class="chart-card full-width">
                    <h3><i class="fas fa-chart-line"></i> <span data-i18n="case_trends">${t('case_trends')}</span></h3>
                    <canvas id="caseTrendsChart"></canvas>
                </div>
            </div>
            
            <!-- Detailed Breakdown -->
            <div class="breakdown-section">
                <div class="breakdown-row">
                    <!-- Cases by Category -->
                    <div class="breakdown-card">
                        <h3><i class="fas fa-tags"></i> <span data-i18n="cases_by_category">${t('cases_by_category')}</span></h3>
                        <div id="categoryBreakdown" class="breakdown-list">
                            ${renderCategoryBreakdown(stats.cases_by_category || [])}
                        </div>
                    </div>
                    
                    <!-- Custody Statistics -->
                    <div class="breakdown-card">
                        <h3><i class="fas fa-user-lock"></i> <span data-i18n="custody_statistics">${t('custody_statistics')}</span></h3>
                        <div id="custodyBreakdown" class="breakdown-list">
                            ${renderCustodyBreakdown(stats.custody_stats || {})}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .case-reports-dashboard { padding: 20px; }
            .page-header { margin-bottom: 30px; }
            .page-header h2 { margin: 0 0 10px 0; font-size: 28px; }
            
            .filters-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .filters-card h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
            }
            .filter-controls {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .filter-btn {
                padding: 10px 20px;
                border: 2px solid #e0e0e0;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
                font-weight: 500;
            }
            .filter-btn:hover {
                border-color: #4a90e2;
                background: #f0f7ff;
            }
            .filter-btn.active {
                background: #4a90e2;
                color: white;
                border-color: #4a90e2;
            }
            .filter-btn i { margin-right: 5px; }
            
            .stats-overview { margin-bottom: 30px; }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .charts-section { margin-bottom: 30px; }
            .chart-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            .chart-card {
                background: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .chart-card.full-width {
                grid-column: 1 / -1;
            }
            .chart-card h3 {
                margin: 0 0 20px 0;
                font-size: 16px;
                font-weight: 600;
            }
            .chart-card canvas {
                max-height: 300px;
            }
            
            .breakdown-section { }
            .breakdown-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 20px;
            }
            .breakdown-card {
                background: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .breakdown-card h3 {
                margin: 0 0 20px 0;
                font-size: 16px;
                font-weight: 600;
            }
            .breakdown-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .breakdown-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #4a90e2;
            }
            .breakdown-item-label {
                font-size: 14px;
                font-weight: 500;
            }
            .breakdown-item-value {
                font-size: 18px;
                font-weight: bold;
                color: #4a90e2;
            }
            
            @media (max-width: 768px) {
                .chart-row,
                .breakdown-row {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;
}

/**
 * Render Category Breakdown
 */
function renderCategoryBreakdown(categories) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!categories || categories.length === 0) {
        return `<p class="text-muted" data-i18n="no_data_available">${t('no_data_available')}</p>`;
    }
    
    let html = '';
    categories.forEach(cat => {
        // Convert category name to crime_category enum value for filtering
        let enumValue = cat.id;
        if (typeof cat.id === 'number') {
            // It's a custom category, map to enum
            const simpleName = cat.name.toLowerCase().replace(' crimes', '').replace(' related', '').replace(/\s/g, '');
            enumValue = simpleName;
        }
        
        html += `
            <div class="breakdown-item clickable" style="border-left-color: ${cat.color || '#4a90e2'}; cursor: pointer;" onclick="viewCategoryDetails('${enumValue}', '${escapeHtml(cat.name)}')">
                <div class="breakdown-item-label">
                    <i class="fas ${cat.icon || 'fa-folder'}" style="color: ${cat.color || '#4a90e2'}; margin-right: 8px;"></i>
                    ${escapeHtml(cat.name)}
                </div>
                <div class="breakdown-item-value">${cat.count || 0}</div>
            </div>
        `;
    });
    
    return html;
}

/**
 * Render Custody Breakdown
 */
function renderCustodyBreakdown(custodyStats) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="breakdown-item" style="border-left-color: #f59e0b;">
            <div class="breakdown-item-label" data-i18n="active_custody">${t('active_custody')}</div>
            <div class="breakdown-item-value" style="color: #f59e0b;">${custodyStats.active || 0}</div>
        </div>
        <div class="breakdown-item" style="border-left-color: #10b981;">
            <div class="breakdown-item-label" data-i18n="released">${t('released')}</div>
            <div class="breakdown-item-value" style="color: #10b981;">${custodyStats.released || 0}</div>
        </div>
        <div class="breakdown-item" style="border-left-color: #3b82f6;">
            <div class="breakdown-item-label" data-i18n="bailed">${t('bailed')}</div>
            <div class="breakdown-item-value" style="color: #3b82f6;">${custodyStats.bailed || 0}</div>
        </div>
        <div class="breakdown-item" style="border-left-color: #8b5cf6;">
            <div class="breakdown-item-label" data-i18n="transferred">${t('transferred')}</div>
            <div class="breakdown-item-value" style="color: #8b5cf6;">${custodyStats.transferred || 0}</div>
        </div>
    `;
}

// Store chart instances globally to allow destruction
let caseStatusChartInstance = null;
let casePriorityChartInstance = null;
let caseTrendsChartInstance = null;

// Store current filter state
let currentFilter = {
    period: null,
    startDate: null,
    endDate: null
};

/**
 * Load Case Charts
 */
function loadCaseCharts(stats) {
    // Destroy existing charts before creating new ones
    if (caseStatusChartInstance) {
        caseStatusChartInstance.destroy();
    }
    if (casePriorityChartInstance) {
        casePriorityChartInstance.destroy();
    }
    if (caseTrendsChartInstance) {
        caseTrendsChartInstance.destroy();
    }
    
    // Case Status Chart
    if (document.getElementById('caseStatusChart')) {
        const statusCtx = document.getElementById('caseStatusChart').getContext('2d');
        caseStatusChartInstance = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Draft', 'Submitted', 'Investigating', 'Solved', 'Closed'],
                datasets: [{
                    data: [
                        stats.cases_by_status?.draft || 0,
                        stats.cases_by_status?.submitted || 0,
                        stats.cases_by_status?.investigating || 0,
                        stats.cases_by_status?.solved || 0,
                        stats.cases_by_status?.closed || 0
                    ],
                    backgroundColor: ['#9ca3af', '#3b82f6', '#f59e0b', '#10b981', '#6b7280']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Case Priority Chart
    if (document.getElementById('casePriorityChart')) {
        const priorityCtx = document.getElementById('casePriorityChart').getContext('2d');
        casePriorityChartInstance = new Chart(priorityCtx, {
            type: 'pie',
            data: {
                labels: ['Low', 'Medium', 'High', 'Critical'],
                datasets: [{
                    data: [
                        stats.cases_by_priority?.low || 0,
                        stats.cases_by_priority?.medium || 0,
                        stats.cases_by_priority?.high || 0,
                        stats.cases_by_priority?.critical || 0
                    ],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Case Trends Chart
    if (document.getElementById('caseTrendsChart')) {
        const trendsCtx = document.getElementById('caseTrendsChart').getContext('2d');
        const monthlyData = stats.monthly_trends || [];
        
        caseTrendsChartInstance = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: monthlyData.map(m => m.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'New Cases',
                        data: monthlyData.map(m => m.new_cases) || [10, 15, 12, 20, 18, 22],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Solved Cases',
                        data: monthlyData.map(m => m.solved_cases) || [8, 12, 10, 15, 14, 18],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

/**
 * Filter Case Reports by Date Range
 */
async function filterCaseReports(period) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    // Update active button
    $('.filter-btn').removeClass('active');
    $(`.filter-btn[data-period="${period}"]`).addClass('active');
    
    // Store current filter
    currentFilter.period = period;
    currentFilter.startDate = null;
    currentFilter.endDate = null;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats?period=${period}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            updateCaseStats(data.data);
        }
    } catch (error) {
        console.error('Error filtering case reports:', error);
        showError(t('error'), t('error_loading_data'));
    }
}

/**
 * Update Case Statistics
 */
function updateCaseStats(stats) {
    // Update stat cards
    $('#totalCasesCount').text(stats.total_cases || 0);
    $('#solvedCasesCount').text(stats.solved_cases || 0);
    $('#activeCasesCount').text(stats.active_cases || 0);
    $('#custodyCount').text(stats.in_custody || 0);
    
    // Update category breakdown
    const categoryHtml = renderCategoryBreakdown(stats.cases_by_category || []);
    $('#categoryBreakdown').html(categoryHtml);
    
    // Update custody breakdown
    const custodyHtml = renderCustodyBreakdown(stats.custody_stats || {});
    $('#custodyBreakdown').html(custodyHtml);
    
    // Reload charts with new data
    loadCaseCharts(stats);
}

/**
 * Show Custom Date Range Picker
 */
function showCustomDateRange() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const modalContent = `
        <div class="modal-header">
            <h3 data-i18n="select_date_range">${t('select_date_range')}</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="customDateForm" onsubmit="applyCustomDateRange(event)">
                <div class="form-group">
                    <label for="startDate" data-i18n="start_date">${t('start_date')}</label>
                    <input type="date" id="startDate" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="endDate" data-i18n="end_date">${t('end_date')}</label>
                    <input type="date" id="endDate" class="form-control" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()" data-i18n="cancel">${t('cancel')}</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-check"></i> <span data-i18n="apply">${t('apply')}</span>
                    </button>
                </div>
            </form>
        </div>
    `;
    
    showModal(modalContent);
}

/**
 * Apply Custom Date Range
 */
async function applyCustomDateRange(event) {
    event.preventDefault();
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();
    
    closeModal();
    
    // Store current filter
    currentFilter.period = null;
    currentFilter.startDate = startDate;
    currentFilter.endDate = endDate;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats?start=${startDate}&end=${endDate}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            updateCaseStats(data.data);
            $('.filter-btn').removeClass('active');
        }
    } catch (error) {
        console.error('Error applying custom date range:', error);
        showError(t('error'), t('error_loading_data'));
    }
}

/**
 * Build filter URL parameters
 */
function buildFilterParams() {
    let params = [];
    if (currentFilter.period) {
        params.push(`period=${currentFilter.period}`);
    } else if (currentFilter.startDate && currentFilter.endDate) {
        params.push(`start=${currentFilter.startDate}`);
        params.push(`end=${currentFilter.endDate}`);
    }
    return params.length > 0 ? '&' + params.join('&') : '';
}

/**
 * View Category Details
 */
async function viewCategoryDetails(categoryId, categoryName) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('category_details');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const filterParams = buildFilterParams();
        const response = await fetch(`${API_BASE_URL}/admin/cases?crime_category=${categoryId}${filterParams}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderCategoryDetailsView(categoryId, categoryName, data.data || []));
        } else {
            content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
        }
    } catch (error) {
        console.error('Error loading category details:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render Category Details View
 */
function renderCategoryDetailsView(categoryId, categoryName, cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="category-details-container">
            <div class="report-header">
                <button class="btn btn-secondary" onclick="loadCaseReportsDashboard()">
                    <i class="fas fa-arrow-left"></i> <span data-i18n="back">${t('back')}</span>
                </button>
                <h2><i class="fas fa-folder"></i> ${escapeHtml(categoryName)} - <span data-i18n="cases">${t('cases')}</span></h2>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${cases.length}</div>
                        <div class="stat-label" data-i18n="total_cases">${t('total_cases')}</div>
                    </div>
                </div>
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${cases.filter(c => c.status === 'solved' || c.status === 'closed').length}</div>
                        <div class="stat-label" data-i18n="solved_cases">${t('solved_cases')}</div>
                    </div>
                </div>
                <div class="stat-card stat-warning">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${cases.filter(c => c.status === 'investigating' || c.status === 'assigned').length}</div>
                        <div class="stat-label" data-i18n="active_cases">${t('active_cases')}</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3 data-i18n="cases_list">${t('cases_list')}</h3>
                
                <!-- Search/Filter Bar -->
                <div class="search-filter-bar">
                    <div class="search-input-group">
                        <i class="fas fa-search"></i>
                        <input type="text" id="caseSearchInput" class="search-input" placeholder="${t('search_by_name_phone_location')}" oninput="filterCaseTable()">
                    </div>
                    <div class="filter-group">
                        <input type="date" id="incidentDateFilter" class="date-filter" onchange="filterCaseTable()" placeholder="${t('incident_date')}">
                        <button class="btn btn-sm btn-secondary" onclick="clearCaseFilters()">
                            <i class="fas fa-times"></i> <span data-i18n="clear_filters">${t('clear_filters')}</span>
                        </button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="data-table" id="casesTable">
                        <thead>
                            <tr>
                                <th data-i18n="case_number">${t('case_number')}</th>
                                <th data-i18n="ob_number">${t('ob_number')}</th>
                                <th data-i18n="crime_type">${t('crime_type')}</th>
                                <th data-i18n="incident_location">${t('incident_location')}</th>
                                <th data-i18n="incident_date">${t('incident_date')}</th>
                                <th data-i18n="status">${t('status')}</th>
                                <th data-i18n="priority">${t('priority')}</th>
                                <th data-i18n="actions">${t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cases.length > 0 ? cases.map(caseItem => `
                                <tr data-case-id="${caseItem.id}" 
                                    data-search-text="${escapeHtml(caseItem.case_number)} ${escapeHtml(caseItem.ob_number)} ${escapeHtml(caseItem.crime_type)} ${escapeHtml(caseItem.incident_location || '')} ${escapeHtml(caseItem.complainant_name || '')} ${escapeHtml(caseItem.complainant_phone || '')} ${escapeHtml(caseItem.accused_name || '')} ${escapeHtml(caseItem.accused_phone || '')}"
                                    data-incident-date="${caseItem.incident_date}">
                                    <td><strong>${escapeHtml(caseItem.case_number)}</strong></td>
                                    <td>${escapeHtml(caseItem.ob_number)}</td>
                                    <td>${escapeHtml(caseItem.crime_type)}</td>
                                    <td>${escapeHtml(caseItem.incident_location || 'N/A')}</td>
                                    <td>${formatDate(caseItem.incident_date)}</td>
                                    <td><span class="badge badge-${getStatusColor(caseItem.status)}">${escapeHtml(caseItem.status)}</span></td>
                                    <td><span class="badge badge-${getPriorityColor(caseItem.priority)}">${escapeHtml(caseItem.priority)}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewCaseDetails(${caseItem.id})">
                                            <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="8" style="text-align: center;" data-i18n="no_cases_found">${t('no_cases_found')}</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <style>
            .category-details-container { padding: 20px; }
            .report-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .breakdown-item.clickable:hover { background: #f0f7ff; transform: translateX(5px); transition: all 0.3s ease; }
            
            .search-filter-bar {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                flex-wrap: wrap;
                align-items: center;
            }
            .search-input-group {
                flex: 1;
                min-width: 300px;
                position: relative;
            }
            .search-input-group i {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #6c757d;
            }
            .search-input {
                width: 100%;
                padding: 10px 10px 10px 40px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
            .search-input:focus {
                outline: none;
                border-color: #4a90e2;
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
            }
            .filter-group {
                display: flex;
                gap: 10px;
            }
            .date-filter {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
            .date-filter:focus {
                outline: none;
                border-color: #4a90e2;
            }
        </style>
    `;
}

/**
 * Helper function to get status color
 */
function getStatusColor(status) {
    const colors = {
        'draft': 'secondary',
        'submitted': 'info',
        'investigating': 'warning',
        'solved': 'success',
        'closed': 'dark'
    };
    return colors[status] || 'secondary';
}

/**
 * Helper function to get priority color
 */
function getPriorityColor(priority) {
    const colors = {
        'low': 'success',
        'medium': 'info',
        'high': 'warning',
        'critical': 'danger'
    };
    return colors[priority] || 'secondary';
}

/**
 * View All Cases (Filtered)
 */
async function viewAllCasesFiltered() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('all_cases');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const filterParams = buildFilterParams();
        const response = await fetch(`${API_BASE_URL}/admin/cases?${filterParams}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderCasesListView(t('all_cases'), data.data || []));
        } else {
            content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
        }
    } catch (error) {
        console.error('Error loading cases:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * View Cases by Status (Filtered)
 */
async function viewCasesByStatusFiltered(status) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('cases_by_status');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const filterParams = buildFilterParams();
        const response = await fetch(`${API_BASE_URL}/admin/cases?status=${status}${filterParams}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const title = status === 'solved' ? t('solved_cases') : t('cases_by_status');
            content.html(renderCasesListView(title, data.data || []));
        } else {
            content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
        }
    } catch (error) {
        console.error('Error loading cases:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * View Active Cases (Filtered)
 */
async function viewActiveCasesFiltered() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('active_cases');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        // Fetch all cases and filter active ones
        const filterParams = buildFilterParams();
        const response = await fetch(`${API_BASE_URL}/admin/cases?${filterParams}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const activeCases = (data.data || []).filter(c => 
                c.status === 'investigating' || 
                c.status === 'assigned' || 
                c.status === 'approved' ||
                c.status === 'submitted'
            );
            content.html(renderCasesListView(t('active_cases'), activeCases));
        } else {
            content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
        }
    } catch (error) {
        console.error('Error loading cases:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * View Custody Details (Filtered)
 */
async function viewCustodyDetailsFiltered() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('custody_details');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        const filterParams = buildFilterParams();
        const response = await fetch(`${API_BASE_URL}/ob/custody?${filterParams}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderCustodyDetailsView(data.data || []));
        } else {
            content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
        }
    } catch (error) {
        console.error('Error loading custody records:', error);
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render Cases List View
 */
function renderCasesListView(title, cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="cases-list-container">
            <div class="report-header">
                <button class="btn btn-secondary" onclick="loadCaseReportsDashboard()">
                    <i class="fas fa-arrow-left"></i> <span data-i18n="back">${t('back')}</span>
                </button>
                <h2><i class="fas fa-folder"></i> ${escapeHtml(title)}</h2>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-folder"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${cases.length}</div>
                        <div class="stat-label" data-i18n="total_cases">${t('total_cases')}</div>
                    </div>
                </div>
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${cases.filter(c => c.status === 'solved' || c.status === 'closed').length}</div>
                        <div class="stat-label" data-i18n="solved_closed">${t('solved_closed')}</div>
                    </div>
                </div>
                <div class="stat-card stat-warning">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${cases.filter(c => c.status === 'investigating' || c.status === 'assigned').length}</div>
                        <div class="stat-label" data-i18n="investigating">${t('investigating')}</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3 data-i18n="cases_list">${t('cases_list')}</h3>
                <div class="table-responsive">
                    <table class="data-table" id="casesTable">
                        <thead>
                            <tr>
                                <th data-i18n="case_number">${t('case_number')}</th>
                                <th data-i18n="ob_number">${t('ob_number')}</th>
                                <th data-i18n="crime_type">${t('crime_type')}</th>
                                <th data-i18n="incident_location">${t('incident_location')}</th>
                                <th data-i18n="crime_category">${t('crime_category')}</th>
                                <th data-i18n="incident_date">${t('incident_date')}</th>
                                <th data-i18n="status">${t('status')}</th>
                                <th data-i18n="priority">${t('priority')}</th>
                                <th data-i18n="actions">${t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cases.length > 0 ? cases.map(caseItem => `
                                <tr data-case-id="${caseItem.id}" 
                                    data-search-text="${escapeHtml(caseItem.case_number)} ${escapeHtml(caseItem.ob_number)} ${escapeHtml(caseItem.crime_type)} ${escapeHtml(caseItem.incident_location || '')} ${escapeHtml(caseItem.complainant_name || '')} ${escapeHtml(caseItem.complainant_phone || '')} ${escapeHtml(caseItem.accused_name || '')} ${escapeHtml(caseItem.accused_phone || '')}"
                                    data-incident-date="${caseItem.incident_date}">
                                    <td><strong>${escapeHtml(caseItem.case_number)}</strong></td>
                                    <td>${escapeHtml(caseItem.ob_number)}</td>
                                    <td>${escapeHtml(caseItem.crime_type)}</td>
                                    <td>${escapeHtml(caseItem.incident_location || 'N/A')}</td>
                                    <td><span class="badge" style="background: ${getCrimeCategoryColor(caseItem.crime_category)};">${escapeHtml(caseItem.crime_category)}</span></td>
                                    <td>${formatDate(caseItem.incident_date)}</td>
                                    <td><span class="badge badge-${getStatusColor(caseItem.status)}">${escapeHtml(caseItem.status)}</span></td>
                                    <td><span class="badge badge-${getPriorityColor(caseItem.priority)}">${escapeHtml(caseItem.priority)}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewCaseDetails(${caseItem.id})">
                                            <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="9" style="text-align: center;" data-i18n="no_cases_found">${t('no_cases_found')}</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <style>
            .cases-list-container { padding: 20px; }
            .report-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            
            .search-filter-bar {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                flex-wrap: wrap;
                align-items: center;
            }
            .search-input-group {
                flex: 1;
                min-width: 300px;
                position: relative;
            }
            .search-input-group i {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #6c757d;
            }
            .search-input {
                width: 100%;
                padding: 10px 10px 10px 40px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
            .search-input:focus {
                outline: none;
                border-color: #4a90e2;
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
            }
            .filter-group {
                display: flex;
                gap: 10px;
            }
            .date-filter {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
            .date-filter:focus {
                outline: none;
                border-color: #4a90e2;
            }
        </style>
    `;
}

/**
 * Render Custody Details View
 */
function renderCustodyDetailsView(custodyRecords) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="custody-details-container">
            <div class="report-header">
                <button class="btn btn-secondary" onclick="loadCaseReportsDashboard()">
                    <i class="fas fa-arrow-left"></i> <span data-i18n="back">${t('back')}</span>
                </button>
                <h2><i class="fas fa-user-lock"></i> <span data-i18n="custody_records">${t('custody_records')}</span></h2>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card stat-danger">
                    <div class="stat-icon"><i class="fas fa-user-lock"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${custodyRecords.filter(c => c.custody_status === 'in_custody').length}</div>
                        <div class="stat-label" data-i18n="in_custody">${t('in_custody')}</div>
                    </div>
                </div>
                <div class="stat-card stat-success">
                    <div class="stat-icon"><i class="fas fa-door-open"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${custodyRecords.filter(c => c.custody_status === 'released').length}</div>
                        <div class="stat-label" data-i18n="released">${t('released')}</div>
                    </div>
                </div>
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-balance-scale"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${custodyRecords.filter(c => c.bail_status === 'bailed').length}</div>
                        <div class="stat-label" data-i18n="bailed">${t('bailed')}</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3 data-i18n="custody_list">${t('custody_list')}</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th data-i18n="person_name">${t('person_name')}</th>
                                <th data-i18n="case_number">${t('case_number')}</th>
                                <th data-i18n="custody_status">${t('custody_status')}</th>
                                <th data-i18n="bail_status">${t('bail_status')}</th>
                                <th data-i18n="custody_location">${t('custody_location')}</th>
                                <th data-i18n="custody_start">${t('custody_start')}</th>
                                <th data-i18n="actions">${t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${custodyRecords.length > 0 ? custodyRecords.map(record => `
                                <tr>
                                    <td><strong>${escapeHtml(record.person_name || 'N/A')}</strong></td>
                                    <td>${escapeHtml(record.case_number || 'N/A')}</td>
                                    <td><span class="badge badge-${record.custody_status === 'in_custody' ? 'danger' : 'success'}">${escapeHtml(record.custody_status)}</span></td>
                                    <td><span class="badge badge-${record.bail_status === 'bailed' ? 'info' : 'secondary'}">${escapeHtml(record.bail_status)}</span></td>
                                    <td>${escapeHtml(record.custody_location)}</td>
                                    <td>${formatDateTime(record.custody_start)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="loadPage('custody')">
                                            <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" style="text-align: center;" data-i18n="no_custody_records">${t('no_custody_records')}</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <style>
            .custody-details-container { padding: 20px; }
        </style>
    `;
}

/**
 * Get crime category color
 */
function getCrimeCategoryColor(category) {
    const colors = {
        'violent': '#ef4444',
        'property': '#f59e0b',
        'drug': '#8b5cf6',
        'cybercrime': '#3b82f6',
        'sexual': '#ec4899',
        'juvenile': '#10b981',
        'other': '#6b7280'
    };
    return colors[category] || '#6b7280';
}

/**
 * Filter case table based on search and date filters
 */
function filterCaseTable() {
    const searchText = $('#caseSearchInput').val().toLowerCase();
    const incidentDate = $('#incidentDateFilter').val();
    
    $('#casesTable tbody tr').each(function() {
        const $row = $(this);
        
        // Skip "no cases" row
        if ($row.find('[colspan]').length > 0) {
            return;
        }
        
        const rowSearchText = $row.attr('data-search-text')?.toLowerCase() || '';
        const rowDate = $row.attr('data-incident-date') || '';
        
        let showRow = true;
        
        // Apply search filter
        if (searchText && !rowSearchText.includes(searchText)) {
            showRow = false;
        }
        
        // Apply date filter
        if (incidentDate && rowDate !== incidentDate) {
            showRow = false;
        }
        
        // Show or hide row
        if (showRow) {
            $row.show();
        } else {
            $row.hide();
        }
    });
    
    // Show "no results" message if all rows are hidden
    const visibleRows = $('#casesTable tbody tr:visible').length;
    if (visibleRows === 0) {
        const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
        $('#casesTable tbody').append(`
            <tr class="no-results-row">
                <td colspan="9" style="text-align: center; padding: 20px;" data-i18n="no_matching_cases">${t('no_matching_cases')}</td>
            </tr>
        `);
    } else {
        $('.no-results-row').remove();
    }
}

/**
 * Clear case filters
 */
function clearCaseFilters() {
    $('#caseSearchInput').val('');
    $('#incidentDateFilter').val('');
    filterCaseTable();
}
