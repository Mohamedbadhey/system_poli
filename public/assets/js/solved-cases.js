// ============================================
// Solved Cases Management
// ============================================

/**
 * Load Investigator Solved Cases Page
 */
function loadInvestigatorSolvedCasesPage() {
    const html = `
        <div class="page-header">
            <h2 data-i18n="investigator_solved_cases">Cases Solved by Investigators</h2>
            <p data-i18n="investigator_solved_cases_desc">Cases closed by investigators without sending to court</p>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="search-filter-container">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="investigatorSolvedSearch" placeholder="Search cases..." data-i18n-placeholder="search_cases">
                    </div>
                    <div class="filter-group">
                        <select id="investigatorSolvedPriorityFilter" class="form-select">
                            <option value="" data-i18n="all_priorities">All Priorities</option>
                            <option value="low" data-i18n="priority_low">Low</option>
                            <option value="medium" data-i18n="priority_medium">Medium</option>
                            <option value="high" data-i18n="priority_high">High</option>
                            <option value="critical" data-i18n="priority_critical">Critical</option>
                        </select>
                        <select id="investigatorSolvedCategoryFilter" class="form-select">
                            <option value="" data-i18n="all_categories">All Categories</option>
                            <option value="violent" data-i18n="category_violent">Violent</option>
                            <option value="property" data-i18n="category_property">Property</option>
                            <option value="drug" data-i18n="category_drug">Drug</option>
                            <option value="cybercrime" data-i18n="category_cybercrime">Cybercrime</option>
                            <option value="sexual" data-i18n="category_sexual">Sexual</option>
                            <option value="juvenile" data-i18n="category_juvenile">Juvenile</option>
                            <option value="other" data-i18n="category_other">Other</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table class="data-table" id="investigatorSolvedTable">
                        <thead>
                            <tr>
                                <th data-i18n="case_number">Case Number</th>
                                <th data-i18n="crime_type">Crime Type</th>
                                <th data-i18n="category">Category</th>
                                <th data-i18n="priority">Priority</th>
                                <th data-i18n="center">Center</th>
                                <th data-i18n="closed_by">Closed By</th>
                                <th data-i18n="closed_date">Closed Date</th>
                                <th data-i18n="actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="investigatorSolvedTableBody">
                            <tr>
                                <td colspan="8" class="text-center">
                                    <i class="fas fa-spinner fa-spin"></i> Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    $('#pageContent').html(html);
    loadInvestigatorSolvedTable();
    
    // Setup event listeners
    $('#investigatorSolvedSearch').on('input', debounce(loadInvestigatorSolvedTable, 300));
    $('#investigatorSolvedPriorityFilter, #investigatorSolvedCategoryFilter').on('change', loadInvestigatorSolvedTable);
}

/**
 * Load Investigator Solved Cases Table
 */
async function loadInvestigatorSolvedTable() {
    try {
        const search = $('#investigatorSolvedSearch').val();
        const priority = $('#investigatorSolvedPriorityFilter').val();
        const category = $('#investigatorSolvedCategoryFilter').val();
        
        const response = await api.get('/investigation/cases/solved-by-investigator');
        let cases = response.data;
        
        // Apply filters
        if (search) {
            const searchLower = search.toLowerCase();
            cases = cases.filter(c => 
                c.case_number?.toLowerCase().includes(searchLower) ||
                c.crime_type?.toLowerCase().includes(searchLower) ||
                c.incident_description?.toLowerCase().includes(searchLower)
            );
        }
        
        if (priority) {
            cases = cases.filter(c => c.priority === priority);
        }
        
        if (category) {
            cases = cases.filter(c => c.crime_category === category);
        }
        
        const tbody = $('#investigatorSolvedTableBody');
        
        if (cases.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="8" class="text-center">
                        <i class="fas fa-folder-open"></i> No solved cases found
                    </td>
                </tr>
            `);
            return;
        }
        
        const rows = cases.map(c => `
            <tr>
                <td>
                    <strong>${c.case_number || 'N/A'}</strong><br>
                    <small class="text-muted">${c.ob_number || ''}</small>
                </td>
                <td>${c.crime_type || 'N/A'}</td>
                <td><span class="badge badge-${c.crime_category || 'other'}">${c.crime_category || 'N/A'}</span></td>
                <td><span class="badge badge-priority-${c.priority || 'medium'}">${c.priority || 'N/A'}</span></td>
                <td>
                    ${c.center_name || 'N/A'}<br>
                    <small class="text-muted">${c.center_code || ''}</small>
                </td>
                <td>
                    ${c.closed_by_name || 'N/A'}<br>
                    <small class="text-muted">Badge: ${c.badge_number || 'N/A'}</small>
                </td>
                <td>${c.closed_date ? formatDateTime(c.closed_date) : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCaseDetails(${c.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.html(rows);
        
    } catch (error) {
        console.error('Error loading investigator solved cases:', error);
        $('#investigatorSolvedTableBody').html(`
            <tr>
                <td colspan="8" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error loading cases
                </td>
            </tr>
        `);
    }
}

/**
 * Load Court Solved Cases Page
 */
function loadCourtSolvedCasesPage() {
    const html = `
        <div class="page-header">
            <h2 data-i18n="court_solved_cases">Cases Solved by Court</h2>
            <p data-i18n="court_solved_cases_desc">Cases that were sent to court and resolved by the court</p>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="search-filter-container">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="courtSolvedSearch" placeholder="Search cases..." data-i18n-placeholder="search_cases">
                    </div>
                    <div class="filter-group">
                        <select id="courtSolvedPriorityFilter" class="form-select">
                            <option value="" data-i18n="all_priorities">All Priorities</option>
                            <option value="low" data-i18n="priority_low">Low</option>
                            <option value="medium" data-i18n="priority_medium">Medium</option>
                            <option value="high" data-i18n="priority_high">High</option>
                            <option value="critical" data-i18n="priority_critical">Critical</option>
                        </select>
                        <select id="courtSolvedCategoryFilter" class="form-select">
                            <option value="" data-i18n="all_categories">All Categories</option>
                            <option value="violent" data-i18n="category_violent">Violent</option>
                            <option value="property" data-i18n="category_property">Property</option>
                            <option value="drug" data-i18n="category_drug">Drug</option>
                            <option value="cybercrime" data-i18n="category_cybercrime">Cybercrime</option>
                            <option value="sexual" data-i18n="category_sexual">Sexual</option>
                            <option value="juvenile" data-i18n="category_juvenile">Juvenile</option>
                            <option value="other" data-i18n="category_other">Other</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="table-container">
                    <table class="data-table" id="courtSolvedTable">
                        <thead>
                            <tr>
                                <th data-i18n="case_number">Case Number</th>
                                <th data-i18n="crime_type">Crime Type</th>
                                <th data-i18n="category">Category</th>
                                <th data-i18n="priority">Priority</th>
                                <th data-i18n="center">Center</th>
                                <th data-i18n="sent_by">Sent to Court By</th>
                                <th data-i18n="sent_date">Sent Date</th>
                                <th data-i18n="closed_date">Closed Date</th>
                                <th data-i18n="actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="courtSolvedTableBody">
                            <tr>
                                <td colspan="9" class="text-center">
                                    <i class="fas fa-spinner fa-spin"></i> Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    $('#pageContent').html(html);
    loadCourtSolvedTable();
    
    // Setup event listeners
    $('#courtSolvedSearch').on('input', debounce(loadCourtSolvedTable, 300));
    $('#courtSolvedPriorityFilter, #courtSolvedCategoryFilter').on('change', loadCourtSolvedTable);
}

/**
 * Load Court Solved Cases Table
 */
async function loadCourtSolvedTable() {
    try {
        const search = $('#courtSolvedSearch').val();
        const priority = $('#courtSolvedPriorityFilter').val();
        const category = $('#courtSolvedCategoryFilter').val();
        
        const response = await api.get('/investigation/cases/solved-by-court');
        let cases = response.data;
        
        // Apply filters
        if (search) {
            const searchLower = search.toLowerCase();
            cases = cases.filter(c => 
                c.case_number?.toLowerCase().includes(searchLower) ||
                c.crime_type?.toLowerCase().includes(searchLower) ||
                c.incident_description?.toLowerCase().includes(searchLower)
            );
        }
        
        if (priority) {
            cases = cases.filter(c => c.priority === priority);
        }
        
        if (category) {
            cases = cases.filter(c => c.crime_category === category);
        }
        
        const tbody = $('#courtSolvedTableBody');
        
        if (cases.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="9" class="text-center">
                        <i class="fas fa-folder-open"></i> No court-solved cases found
                    </td>
                </tr>
            `);
            return;
        }
        
        const rows = cases.map(c => `
            <tr>
                <td>
                    <strong>${c.case_number || 'N/A'}</strong><br>
                    <small class="text-muted">${c.ob_number || ''}</small>
                </td>
                <td>${c.crime_type || 'N/A'}</td>
                <td><span class="badge badge-${c.crime_category || 'other'}">${c.crime_category || 'N/A'}</span></td>
                <td><span class="badge badge-priority-${c.priority || 'medium'}">${c.priority || 'N/A'}</span></td>
                <td>
                    ${c.center_name || 'N/A'}<br>
                    <small class="text-muted">${c.center_code || ''}</small>
                </td>
                <td>
                    ${c.sent_by_name || 'N/A'}<br>
                    <small class="text-muted">Badge: ${c.sent_by_badge || 'N/A'}</small>
                </td>
                <td>${c.sent_to_court_date ? formatDateTime(c.sent_to_court_date) : 'N/A'}</td>
                <td>${c.closed_date ? formatDateTime(c.closed_date) : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCaseDetails(${c.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.html(rows);
        
    } catch (error) {
        console.error('Error loading court solved cases:', error);
        $('#courtSolvedTableBody').html(`
            <tr>
                <td colspan="9" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error loading cases
                </td>
            </tr>
        `);
    }
}

// Helper function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
