// ============================================
// DAILY OPERATIONS DASHBOARD
// ============================================

/**
 * Load Daily Operations Dashboard
 */
async function loadDailyOperationsDashboard() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    setPageTitle('daily_operations_dashboard');
    const content = $('#pageContent');
    content.html(getLoadingHTML('loading_data'));
    
    try {
        // Get filter parameters
        const urlParams = new URLSearchParams(window.location.search);
        const period = urlParams.get('period') || 'today';
        const date = urlParams.get('date') || new Date().toISOString().split('T')[0];
        const centerId = urlParams.get('center_id') || '';
        const category = urlParams.get('category') || '';
        const priority = urlParams.get('priority') || '';
        
        // Build query string
        let queryParams = `period=${period}&date=${date}`;
        if (centerId) queryParams += `&center_id=${centerId}`;
        if (category) queryParams += `&category=${category}`;
        if (priority) queryParams += `&priority=${priority}`;
        
        // Fetch daily operations data
        const response = await fetch(`${API_BASE_URL}/admin/daily-operations?${queryParams}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            content.html(renderDailyOperationsDashboard(data.data));
            
            // Load filters data
            await loadFiltersData();
            
            // Initialize charts
            setTimeout(() => {
                initializeDailyOperationsCharts(data.data);
            }, 100);
        } else {
            showToast(t('error_loading_data'), 'error');
            content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
        }
    } catch (error) {
        console.error('Error loading daily operations:', error);
        showToast(t('error_loading_data'), 'error');
        content.html(`<div class="alert alert-error">${t('error_loading_data')}</div>`);
    }
}

/**
 * Render Daily Operations Dashboard
 */
function renderDailyOperationsDashboard(data) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="daily-operations-dashboard">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-left">
                    <h2><i class="fas fa-chart-bar"></i> <span data-i18n="daily_operations_dashboard">${t('daily_operations_dashboard')}</span></h2>
                    <p class="subtitle" data-i18n="daily_operations_subtitle">${t('daily_operations_subtitle')}</p>
                </div>
                <div class="header-right">
                    ${renderPeriodFilter(data.period)}
                    <button class="btn btn-info" onclick="printDailyOperations()">
                        <i class="fas fa-print"></i> <span data-i18n="print_report">${t('print_report')}</span>
                    </button>
                    <button class="btn btn-primary" onclick="exportDailyOperations('pdf')">
                        <i class="fas fa-file-pdf"></i> <span data-i18n="export_pdf">${t('export_pdf')}</span>
                    </button>
                    <button class="btn btn-success" onclick="exportDailyOperations('excel')">
                        <i class="fas fa-file-excel"></i> <span data-i18n="export_excel">${t('export_excel')}</span>
                    </button>
                </div>
            </div>

            <!-- Statistics Overview -->
            ${renderOperationsStats(data.stats)}

            <!-- Charts Section -->
            <div class="charts-grid">
                <div class="chart-card">
                    <h3><i class="fas fa-chart-pie"></i> <span data-i18n="cases_by_status">${t('cases_by_status')}</span></h3>
                    <canvas id="casesByStatusChart"></canvas>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-chart-bar"></i> <span data-i18n="cases_by_priority">${t('cases_by_priority')}</span></h3>
                    <canvas id="casesByPriorityChart"></canvas>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-chart-doughnut"></i> <span data-i18n="cases_by_category">${t('cases_by_category')}</span></h3>
                    <canvas id="casesByCategoryChart"></canvas>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-lock"></i> <span data-i18n="custody_status">${t('custody_status')}</span></h3>
                    <canvas id="custodyStatusChart"></canvas>
                </div>
            </div>

            <!-- Detailed Sections -->
            <div class="operations-sections">
                ${renderCasesSubmittedSection(data.cases_submitted)}
                ${renderCasesAssignedSection(data.cases_assigned)}
                ${renderCasesClosedSection(data.cases_closed)}
                ${renderCurrentCustodySection(data.current_custody)}
                ${renderCertificatesIssuedSection(data.certificates_issued)}
                ${renderMedicalFormsSection(data.medical_forms_issued)}
                ${renderBasicReportsSection(data.basic_reports_issued)}
                ${renderFullReportsSection(data.full_reports_issued)}
                ${renderCourtAcknowledgmentsSection(data.court_acknowledgments_issued)}
            </div>
        </div>
    `;
}

/**
 * Render Period Filter
 */
function renderPeriodFilter(currentPeriod) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const periods = [
        { value: 'today', label: t('today') },
        { value: 'week', label: t('this_week') },
        { value: 'month', label: t('this_month') },
        { value: 'year', label: t('this_year') }
    ];
    
    return `
        <div class="filters-container">
            <div class="period-filter">
                <select id="periodSelect" onchange="changePeriod(this.value)" class="form-control">
                    ${periods.map(period => `
                        <option value="${period.value}" ${currentPeriod === period.value ? 'selected' : ''}>
                            ${period.label}
                        </option>
                    `).join('')}
                </select>
            </div>
            <button class="btn btn-secondary" onclick="toggleAdvancedFilters()">
                <i class="fas fa-filter"></i> <span data-i18n="advanced_filters">${t('advanced_filters')}</span>
            </button>
        </div>
    `;
}

/**
 * Toggle Advanced Filters
 */
function toggleAdvancedFilters() {
    const filtersPanel = $('#advancedFiltersPanel');
    if (filtersPanel.length) {
        filtersPanel.toggle();
    }
}

/**
 * Load Filters Data (Centers, Categories, Priorities)
 */
async function loadFiltersData() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const currentCenter = urlParams.get('center_id') || '';
        const currentCategory = urlParams.get('category') || '';
        const currentPriority = urlParams.get('priority') || '';
        
        // Fetch police centers
        const centersResponse = await fetch(`${API_BASE_URL}/admin/centers`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const centersData = await centersResponse.json();
        const centers = centersData.data || [];
        
        // Build advanced filters HTML
        const filtersHTML = `
            <div id="advancedFiltersPanel" class="advanced-filters-panel" style="display: none;">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label for="centerFilter"><i class="fas fa-building"></i> <span data-i18n="filter_by_center">${t('filter_by_center')}</span></label>
                        <select id="centerFilter" class="form-control">
                            <option value="">${t('all_centers')}</option>
                            ${centers.map(center => `
                                <option value="${center.id}" ${currentCenter == center.id ? 'selected' : ''}>
                                    ${escapeHtml(center.center_name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="categoryFilter"><i class="fas fa-tags"></i> <span data-i18n="filter_by_category">${t('filter_by_category')}</span></label>
                        <select id="categoryFilter" class="form-control">
                            <option value="">${t('all_categories')}</option>
                            <option value="violent" ${currentCategory === 'violent' ? 'selected' : ''}>${t('violent')}</option>
                            <option value="property" ${currentCategory === 'property' ? 'selected' : ''}>${t('property')}</option>
                            <option value="drug" ${currentCategory === 'drug' ? 'selected' : ''}>${t('drug')}</option>
                            <option value="cybercrime" ${currentCategory === 'cybercrime' ? 'selected' : ''}>${t('cybercrime')}</option>
                            <option value="sexual" ${currentCategory === 'sexual' ? 'selected' : ''}>${t('sexual')}</option>
                            <option value="juvenile" ${currentCategory === 'juvenile' ? 'selected' : ''}>${t('juvenile')}</option>
                            <option value="other" ${currentCategory === 'other' ? 'selected' : ''}>${t('other')}</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="priorityFilter"><i class="fas fa-exclamation-circle"></i> <span data-i18n="filter_by_priority">${t('filter_by_priority')}</span></label>
                        <select id="priorityFilter" class="form-control">
                            <option value="">${t('all_priorities')}</option>
                            <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>${t('low')}</option>
                            <option value="medium" ${currentPriority === 'medium' ? 'selected' : ''}>${t('medium')}</option>
                            <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>${t('high')}</option>
                            <option value="critical" ${currentPriority === 'critical' ? 'selected' : ''}>${t('critical')}</option>
                        </select>
                    </div>
                    
                    <div class="filter-actions">
                        <button class="btn btn-primary" onclick="applyAdvancedFilters()">
                            <i class="fas fa-check"></i> <span data-i18n="apply_filters">${t('apply_filters')}</span>
                        </button>
                        <button class="btn btn-secondary" onclick="clearAdvancedFilters()">
                            <i class="fas fa-times"></i> <span data-i18n="clear_filters">${t('clear_filters')}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert filters panel after the page header
        $('.page-header').after(filtersHTML);
        
    } catch (error) {
        console.error('Error loading filters:', error);
    }
}

/**
 * Apply Advanced Filters
 */
function applyAdvancedFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const period = urlParams.get('period') || 'today';
    const date = urlParams.get('date') || new Date().toISOString().split('T')[0];
    
    const centerId = $('#centerFilter').val();
    const category = $('#categoryFilter').val();
    const priority = $('#priorityFilter').val();
    
    // Build new URL with filters
    let url = `#daily-operations?period=${period}&date=${date}`;
    if (centerId) url += `&center_id=${centerId}`;
    if (category) url += `&category=${category}`;
    if (priority) url += `&priority=${priority}`;
    
    window.location.hash = url;
    loadDailyOperationsDashboard();
}

/**
 * Clear Advanced Filters
 */
function clearAdvancedFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const period = urlParams.get('period') || 'today';
    const date = urlParams.get('date') || new Date().toISOString().split('T')[0];
    
    window.location.hash = `#daily-operations?period=${period}&date=${date}`;
    loadDailyOperationsDashboard();
}

/**
 * Render Operations Statistics
 */
function renderOperationsStats(stats) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="stats-grid">
            <div class="stat-card stat-primary">
                <div class="stat-icon"><i class="fas fa-folder-plus"></i></div>
                <div class="stat-content">
                    <h3>${stats.cases_submitted_count || 0}</h3>
                    <p data-i18n="cases_submitted">${t('cases_submitted')}</p>
                </div>
            </div>
            <div class="stat-card stat-info">
                <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                <div class="stat-content">
                    <h3>${stats.cases_assigned_count || 0}</h3>
                    <p data-i18n="cases_assigned">${t('cases_assigned')}</p>
                </div>
            </div>
            <div class="stat-card stat-success">
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-content">
                    <h3>${stats.cases_closed_count || 0}</h3>
                    <p data-i18n="cases_closed">${t('cases_closed')}</p>
                </div>
            </div>
            <div class="stat-card stat-warning">
                <div class="stat-icon"><i class="fas fa-lock"></i></div>
                <div class="stat-content">
                    <h3>${stats.current_custody_count || 0}</h3>
                    <p data-i18n="current_custody">${t('current_custody')}</p>
                </div>
            </div>
            <div class="stat-card stat-certificate">
                <div class="stat-icon"><i class="fas fa-certificate"></i></div>
                <div class="stat-content">
                    <h3>${stats.certificates_issued_count || 0}</h3>
                    <p data-i18n="certificates_issued">${t('certificates_issued')}</p>
                </div>
            </div>
            <div class="stat-card stat-medical">
                <div class="stat-icon"><i class="fas fa-notes-medical"></i></div>
                <div class="stat-content">
                    <h3>${stats.medical_forms_issued_count || 0}</h3>
                    <p data-i18n="medical_forms_issued">${t('medical_forms_issued')}</p>
                </div>
            </div>
            <div class="stat-card stat-report">
                <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
                <div class="stat-content">
                    <h3>${stats.basic_reports_count || 0}</h3>
                    <p data-i18n="basic_reports">${t('basic_reports') || 'Basic Reports'}</p>
                </div>
            </div>
            <div class="stat-card stat-full-report">
                <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
                <div class="stat-content">
                    <h3>${stats.full_reports_count || 0}</h3>
                    <p data-i18n="full_reports">${t('full_reports') || 'Full Reports'}</p>
                </div>
            </div>
            <div class="stat-card stat-court">
                <div class="stat-icon"><i class="fas fa-file-contract"></i></div>
                <div class="stat-content">
                    <h3>${stats.court_acknowledgments_count || 0}</h3>
                    <p data-i18n="court_acknowledgments">${t('court_acknowledgments') || 'Court Acknowledgments'}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Cases Submitted Section
 */
function renderCasesSubmittedSection(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!cases || cases.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-folder-plus"></i> <span data-i18n="cases_submitted">${t('cases_submitted')}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_cases_submitted">${t('no_cases_submitted')}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-folder-plus"></i> <span data-i18n="cases_submitted">${t('cases_submitted')}</span> (${cases.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="ob_number">${t('ob_number')}</th>
                            <th data-i18n="crime_type">${t('crime_type')}</th>
                            <th data-i18n="priority">${t('priority')}</th>
                            <th data-i18n="center">${t('center')}</th>
                            <th data-i18n="created_by">${t('created_by')}</th>
                            <th data-i18n="created_at">${t('created_at')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cases.map(caseItem => `
                            <tr>
                                <td><strong>${escapeHtml(caseItem.case_number)}</strong></td>
                                <td>${escapeHtml(caseItem.ob_number)}</td>
                                <td>${escapeHtml(caseItem.crime_type)}</td>
                                <td><span class="badge badge-${getPriorityClass(caseItem.priority)}">${caseItem.priority}</span></td>
                                <td>${escapeHtml(caseItem.center_name)}</td>
                                <td>${escapeHtml(caseItem.created_by_name || 'N/A')}</td>
                                <td>${formatDateTime(caseItem.created_at)}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewCaseDetails(${caseItem.id})">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * Render Cases Assigned Section
 */
function renderCasesAssignedSection(assignments) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!assignments || assignments.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-user-check"></i> <span data-i18n="cases_assigned">${t('cases_assigned')}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_cases_assigned">${t('no_cases_assigned')}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-user-check"></i> <span data-i18n="cases_assigned">${t('cases_assigned')}</span> (${assignments.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="crime_type">${t('crime_type')}</th>
                            <th data-i18n="investigator">${t('investigator')}</th>
                            <th data-i18n="assigned_by">${t('assigned_by')}</th>
                            <th data-i18n="assigned_at">${t('assigned_at')}</th>
                            <th data-i18n="deadline">${t('deadline')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignments.map(assignment => `
                            <tr>
                                <td><strong>${escapeHtml(assignment.case_number)}</strong></td>
                                <td>${escapeHtml(assignment.crime_type)}</td>
                                <td>${escapeHtml(assignment.investigator_name)}</td>
                                <td>${escapeHtml(assignment.assigned_by_name || 'N/A')}</td>
                                <td>${formatDateTime(assignment.assigned_at)}</td>
                                <td>${assignment.deadline ? formatDate(assignment.deadline) : 'N/A'}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewCaseDetails(${assignment.case_id})">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * Render Cases Closed Section
 */
function renderCasesClosedSection(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!cases || cases.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-check-circle"></i> <span data-i18n="cases_closed">${t('cases_closed')}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_cases_closed">${t('no_cases_closed')}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-check-circle"></i> <span data-i18n="cases_closed">${t('cases_closed')}</span> (${cases.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="crime_type">${t('crime_type')}</th>
                            <th data-i18n="closed_by">${t('closed_by')}</th>
                            <th data-i18n="closed_at">${t('closed_at')}</th>
                            <th data-i18n="closure_reason">${t('closure_reason')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cases.map(caseItem => `
                            <tr>
                                <td><strong>${escapeHtml(caseItem.case_number)}</strong></td>
                                <td>${escapeHtml(caseItem.crime_type)}</td>
                                <td>${escapeHtml(caseItem.closed_by_name || 'N/A')}</td>
                                <td>${formatDateTime(caseItem.closed_at)}</td>
                                <td>${escapeHtml(caseItem.closure_reason || 'N/A')}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewCaseDetails(${caseItem.id})">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * Render Current Custody Section
 */
function renderCurrentCustodySection(custody) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!custody || custody.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-lock"></i> <span data-i18n="current_custody">${t('current_custody')}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_custody_records">${t('no_custody_records')}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-lock"></i> <span data-i18n="current_custody">${t('current_custody')}</span> (${custody.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="person_name">${t('person_name')}</th>
                            <th data-i18n="national_id">${t('national_id')}</th>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="custody_start">${t('custody_start')}</th>
                            <th data-i18n="custody_location">${t('custody_location')}</th>
                            <th data-i18n="center">${t('center')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${custody.map(record => `
                            <tr>
                                <td><strong>${escapeHtml(record.person_full_name)}</strong></td>
                                <td>${escapeHtml(record.national_id || 'N/A')}</td>
                                <td>${escapeHtml(record.case_number)}</td>
                                <td>${formatDateTime(record.custody_start)}</td>
                                <td>${escapeHtml(record.custody_location || 'N/A')}</td>
                                <td>${escapeHtml(record.center_name)}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewCustodyDetails(${record.id})">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * Render Certificates Issued Section
 */
function renderCertificatesIssuedSection(certificates) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!certificates || certificates.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-certificate"></i> <span data-i18n="certificates_issued">${t('certificates_issued')}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_certificates_issued">${t('no_certificates_issued')}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-certificate"></i> <span data-i18n="certificates_issued">${t('certificates_issued')}</span> (${certificates.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="certificate_number">${t('certificate_number')}</th>
                            <th data-i18n="person_name">${t('person_name')}</th>
                            <th data-i18n="purpose">${t('purpose')}</th>
                            <th data-i18n="issue_date">${t('issue_date')}</th>
                            <th data-i18n="issued_by">${t('issued_by')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${certificates.map(cert => `
                            <tr>
                                <td><strong>${escapeHtml(cert.certificate_number)}</strong></td>
                                <td>${escapeHtml(cert.person_full_name || cert.person_name)}</td>
                                <td>${escapeHtml(cert.purpose || 'N/A')}</td>
                                <td>${formatDate(cert.issue_date)}</td>
                                <td>${escapeHtml(cert.issued_by_name || 'N/A')}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewCertificate(${cert.id})">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * Render Medical Forms Section
 */
function renderMedicalFormsSection(forms) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!forms || forms.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-notes-medical"></i> <span data-i18n="medical_forms_issued">${t('medical_forms_issued')}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_medical_forms_issued">${t('no_medical_forms_issued')}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-notes-medical"></i> <span data-i18n="medical_forms_issued">${t('medical_forms_issued')}</span> (${forms.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="patient_name">${t('patient_name')}</th>
                            <th data-i18n="hospital_name">${t('hospital_name')}</th>
                            <th data-i18n="examination_date">${t('examination_date')}</th>
                            <th data-i18n="created_by">${t('created_by')}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${forms.map(form => `
                            <tr>
                                <td><strong>${escapeHtml(form.case_number)}</strong></td>
                                <td>${escapeHtml(form.person_full_name || form.patient_name)}</td>
                                <td>${escapeHtml(form.hospital_name || 'N/A')}</td>
                                <td>${formatDate(form.examination_date)}</td>
                                <td>${escapeHtml(form.created_by_name || 'N/A')}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewMedicalForm(${form.id})">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * Initialize Charts
 */
function initializeDailyOperationsCharts(data) {
    // Cases by Status Chart
    if (data.cases_by_status && data.cases_by_status.length > 0) {
        const statusCtx = document.getElementById('casesByStatusChart');
        if (statusCtx) {
            new Chart(statusCtx, {
                type: 'pie',
                data: {
                    labels: data.cases_by_status.map(item => item.status),
                    datasets: [{
                        data: data.cases_by_status.map(item => item.count),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }
    }
    
    // Cases by Priority Chart
    if (data.cases_by_priority && data.cases_by_priority.length > 0) {
        const priorityCtx = document.getElementById('casesByPriorityChart');
        if (priorityCtx) {
            new Chart(priorityCtx, {
                type: 'bar',
                data: {
                    labels: data.cases_by_priority.map(item => item.priority),
                    datasets: [{
                        label: 'Cases',
                        data: data.cases_by_priority.map(item => item.count),
                        backgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    
    // Cases by Category Chart
    if (data.cases_by_category && data.cases_by_category.length > 0) {
        const categoryCtx = document.getElementById('casesByCategoryChart');
        if (categoryCtx) {
            new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: data.cases_by_category.map(item => item.crime_category),
                    datasets: [{
                        data: data.cases_by_category.map(item => item.count),
                        backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#6b7280']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }
    }
    
    // Custody Status Chart
    if (data.custody_by_status && data.custody_by_status.length > 0) {
        const custodyCtx = document.getElementById('custodyStatusChart');
        if (custodyCtx) {
            new Chart(custodyCtx, {
                type: 'bar',
                data: {
                    labels: data.custody_by_status.map(item => item.custody_status),
                    datasets: [{
                        label: 'Count',
                        data: data.custody_by_status.map(item => item.count),
                        backgroundColor: '#f59e0b'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
}

/**
 * Change Period Filter
 */
function changePeriod(period) {
    const url = new URL(window.location);
    url.searchParams.set('period', period);
    window.location = url.toString();
}

/**
 * Export Daily Operations
 */
async function exportDailyOperations(format) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const period = urlParams.get('period') || 'today';
        const date = urlParams.get('date') || new Date().toISOString().split('T')[0];
        const language = localStorage.getItem('language') || 'en';
        
        showToast(t('generating_report'), 'info');
        
        const endpoint = format === 'pdf' ? 'export-pdf' : 'export-excel';
        const response = await fetch(`${API_BASE_URL}/admin/daily-operations/${endpoint}?period=${period}&date=${date}&language=${language}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast(format === 'pdf' ? t('pdf_generated') : t('excel_generated'), 'success');
            
            // Open the file in a new tab (for PDF) or download it
            window.open(result.data.full_url, '_blank');
        } else {
            showToast(t('error_exporting_data'), 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast(t('error_exporting_data'), 'error');
    }
}

/**
 * Print Daily Operations Report
 */
function printDailyOperations() {
    window.print();
}

/**
 * Helper: Get Priority Class
 */
function getPriorityClass(priority) {
    const classes = {
        'low': 'success',
        'medium': 'info',
        'high': 'warning',
        'critical': 'danger'
    };
    return classes[priority] || 'secondary';
}

/**
 * Render Basic Reports Section
 */
function renderBasicReportsSection(reports) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!reports || reports.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-file-alt"></i> <span data-i18n="basic_reports">${t('basic_reports') || 'Basic Reports'}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_basic_reports">${t('no_basic_reports') || 'No basic reports generated'}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-file-alt"></i> <span data-i18n="basic_reports">${t('basic_reports') || 'Basic Reports'}</span> (${reports.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="report_title">${t('report_title') || 'Report Title'}</th>
                            <th data-i18n="language">${t('language')}</th>
                            <th data-i18n="generated_by">${t('generated_by') || 'Generated By'}</th>
                            <th data-i18n="generated_at">${t('generated_at') || 'Generated At'}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reports.map(report => `
                            <tr>
                                <td><strong>${escapeHtml(report.case_number || 'N/A')}</strong></td>
                                <td>${escapeHtml(report.report_title)}</td>
                                <td><span class="badge badge-info">${report.report_language === 'so' ? 'Somali' : 'English'}</span></td>
                                <td>${escapeHtml(report.generated_by_name || 'N/A')}</td>
                                <td>${new Date(report.created_at).toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="viewReport('${report.pdf_url}')">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * Render Full Reports Section
 */
function renderFullReportsSection(reports) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!reports || reports.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-clipboard-check"></i> <span data-i18n="full_reports">${t('full_reports') || 'Full Reports'}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_full_reports">${t('no_full_reports') || 'No full reports generated'}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-clipboard-check"></i> <span data-i18n="full_reports">${t('full_reports') || 'Full Reports'}</span> (${reports.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="report_title">${t('report_title') || 'Report Title'}</th>
                            <th data-i18n="language">${t('language')}</th>
                            <th data-i18n="generated_by">${t('generated_by') || 'Generated By'}</th>
                            <th data-i18n="generated_at">${t('generated_at') || 'Generated At'}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reports.map(report => `
                            <tr>
                                <td><strong>${escapeHtml(report.case_number || 'N/A')}</strong></td>
                                <td>${escapeHtml(report.report_title)}</td>
                                <td><span class="badge badge-info">${report.report_language === 'so' ? 'Somali' : 'English'}</span></td>
                                <td>${escapeHtml(report.generated_by_name || 'N/A')}</td>
                                <td>${new Date(report.created_at).toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="viewReport('${report.pdf_url}')">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * Render Court Acknowledgments Section
 */
function renderCourtAcknowledgmentsSection(acknowledgments) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!acknowledgments || acknowledgments.length === 0) {
        return `
            <div class="section-card">
                <h3><i class="fas fa-file-contract"></i> <span data-i18n="court_acknowledgments">${t('court_acknowledgments') || 'Court Acknowledgments'}</span> (0)</h3>
                <p class="empty-state" data-i18n="no_court_acknowledgments">${t('no_court_acknowledgments') || 'No court acknowledgments uploaded'}</p>
            </div>
        `;
    }
    
    return `
        <div class="section-card">
            <h3><i class="fas fa-file-contract"></i> <span data-i18n="court_acknowledgments">${t('court_acknowledgments') || 'Court Acknowledgments'}</span> (${acknowledgments.length})</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th data-i18n="case_number">${t('case_number')}</th>
                            <th data-i18n="ob_number">${t('ob_number')}</th>
                            <th data-i18n="document_type">${t('document_type') || 'Document Type'}</th>
                            <th data-i18n="uploaded_by">${t('uploaded_by') || 'Uploaded By'}</th>
                            <th data-i18n="uploaded_at">${t('uploaded_at') || 'Uploaded At'}</th>
                            <th data-i18n="actions">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${acknowledgments.map(ack => `
                            <tr>
                                <td><strong>${escapeHtml(ack.case_number || 'N/A')}</strong></td>
                                <td>${escapeHtml(ack.ob_number || 'N/A')}</td>
                                <td><span class="badge badge-success">${escapeHtml(ack.document_type || 'Court Acknowledgment')}</span></td>
                                <td>${escapeHtml(ack.uploaded_by_name || 'N/A')}</td>
                                <td>${new Date(ack.uploaded_at).toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="viewCourtDocument('${ack.file_path}')">
                                        <i class="fas fa-eye"></i> <span data-i18n="view">${t('view')}</span>
                                    </button>
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
 * View Report (HTML)
 */
function viewReport(reportUrl) {
    if (reportUrl) {
        // Open report in new tab
        const fullUrl = reportUrl.startsWith('http') ? reportUrl : `${window.location.origin}${reportUrl}`;
        window.open(fullUrl, '_blank');
    } else {
        showToast('Report URL not available', 'error');
    }
}

/**
 * View Court Document
 */
function viewCourtDocument(filePath) {
    if (filePath) {
        // Open document in new tab
        const fullUrl = filePath.startsWith('http') ? filePath : `${window.location.origin}${filePath}`;
        window.open(fullUrl, '_blank');
    } else {
        showToast('Document not available', 'error');
    }
}

/**
 * View Certificate
 * Opens certificate page in new tab
 */
function viewCertificate(certificateId) {
    if (certificateId) {
        // Open certificate page with the ID
        window.open(`assets/pages/non-criminal-certificate.html?id=${certificateId}`, '_blank');
    } else {
        showToast('Certificate ID not available', 'error');
    }
}

/**
 * View Medical Form
 * Opens medical form page in new tab
 */
function viewMedicalForm(formId) {
    if (formId) {
        // Open medical form page with the ID
        window.open(`assets/pages/medical-examination-report.html?id=${formId}`, '_blank');
    } else {
        showToast('Medical form ID not available', 'error');
    }
}

/**
 * View Custody Details
 * Opens modal with detailed custody information
 */
async function viewCustodyDetails(custodyId) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    try {
        // Fetch custody record details
        const response = await fetch(`${API_BASE_URL}/ob/custody/${custodyId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const record = data.data;
            const person = record.person || {};
            const caseData = record.case || {};
            
            // Build person full name
            const personName = person.first_name ? 
                `${person.first_name} ${person.middle_name || ''} ${person.last_name}`.trim() : 
                'N/A';
            
            // Format custody status with proper translation
            const statusText = record.custody_status === 'in_custody' ? 
                t('in_custody') || 'In Custody' : 
                t('released') || 'Released';
            
            const statusClass = record.custody_status === 'in_custody' ? 'warning' : 'success';
            
            // Build modal content
            const modalContent = `
                <div class="custody-details" style="padding: 20px;">
                    <h3 style="margin-bottom: 20px; color: #1e293b;">${t('custody_details') || 'Custody Details'}</h3>
                    
                    <div class="detail-section" style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                        <h4 style="color: #2563eb; margin-bottom: 10px;">${t('person_information') || 'Person Information'}</h4>
                        <p style="margin: 5px 0;"><strong>${t('name') || 'Name'}:</strong> ${escapeHtml(personName)}</p>
                        <p style="margin: 5px 0;"><strong>${t('national_id') || 'National ID'}:</strong> ${escapeHtml(person.national_id || 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>${t('gender') || 'Gender'}:</strong> ${escapeHtml(person.gender ? person.gender.charAt(0).toUpperCase() + person.gender.slice(1) : 'N/A')}</p>
                        ${person.date_of_birth ? `<p style="margin: 5px 0;"><strong>${t('date_of_birth') || 'Date of Birth'}:</strong> ${escapeHtml(person.date_of_birth)}</p>` : ''}
                    </div>
                    
                    <div class="detail-section" style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                        <h4 style="color: #2563eb; margin-bottom: 10px;">${t('custody_information') || 'Custody Information'}</h4>
                        <p style="margin: 5px 0;"><strong>${t('case_number') || 'Case Number'}:</strong> ${escapeHtml(caseData.case_number || 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>${t('ob_number') || 'OB Number'}:</strong> ${escapeHtml(caseData.ob_number || 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>${t('custody_start') || 'Custody Start'}:</strong> ${new Date(record.custody_start).toLocaleString()}</p>
                        <p style="margin: 5px 0;"><strong>${t('custody_location') || 'Location'}:</strong> ${escapeHtml(record.custody_location || 'N/A')}</p>
                        ${record.cell_number ? `<p style="margin: 5px 0;"><strong>${t('cell_number') || 'Cell Number'}:</strong> ${escapeHtml(record.cell_number)}</p>` : ''}
                        <p style="margin: 5px 0;"><strong>${t('status') || 'Status'}:</strong> <span class="badge badge-${statusClass}">${statusText}</span></p>
                        ${record.legal_time_limit ? `<p style="margin: 5px 0;"><strong>${t('legal_time_limit') || 'Legal Time Limit'}:</strong> ${record.legal_time_limit} ${t('hours') || 'hours'}</p>` : ''}
                    </div>
                    
                    ${record.health_status ? `
                    <div class="detail-section" style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                        <h4 style="color: #2563eb; margin-bottom: 10px;">${t('health_information') || 'Health Information'}</h4>
                        <p style="margin: 5px 0;"><strong>${t('health_status') || 'Health Status'}:</strong> ${escapeHtml(record.health_status)}</p>
                        ${record.medical_conditions ? `<p style="margin: 5px 0;"><strong>${t('medical_conditions') || 'Medical Conditions'}:</strong> ${escapeHtml(record.medical_conditions)}</p>` : ''}
                        ${record.medications ? `<p style="margin: 5px 0;"><strong>${t('medications') || 'Medications'}:</strong> ${escapeHtml(record.medications)}</p>` : ''}
                    </div>
                    ` : ''}
                    
                    ${record.custody_end ? `
                    <div class="detail-section" style="margin-bottom: 20px; padding: 15px; background: #dcfce7; border-radius: 8px;">
                        <h4 style="color: #16a34a; margin-bottom: 10px;">${t('release_information') || 'Release Information'}</h4>
                        <p style="margin: 5px 0;"><strong>${t('custody_end') || 'Release Date'}:</strong> ${new Date(record.custody_end).toLocaleString()}</p>
                        ${record.release_reason ? `<p style="margin: 5px 0;"><strong>${t('release_reason') || 'Release Reason'}:</strong> ${escapeHtml(record.release_reason)}</p>` : ''}
                    </div>
                    ` : ''}
                    
                    ${record.custody_notes ? `
                    <div class="detail-section" style="margin-bottom: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
                        <h4 style="color: #92400e; margin-bottom: 10px;">${t('notes') || 'Notes'}</h4>
                        <p style="margin: 5px 0;">${escapeHtml(record.custody_notes)}</p>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Show in modal
            showModal(modalContent);
        } else {
            showToast(t('error_loading_data') || 'Error loading data', 'error');
        }
    } catch (error) {
        console.error('Error loading custody details:', error);
        showToast(t('error_loading_data') || 'Error loading data', 'error');
    }
}
