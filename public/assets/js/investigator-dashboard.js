// ============================================
// Professional Investigator Dashboard - Redesigned
// ============================================

// Main function to render investigator dashboard with detailed data
async function renderInvestigatorDashboard() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    try {
        // Show loading state
        showLoadingState();
        
        // Fetch dashboard stats and cases with date filter
        const statsUrl = `/investigation/dashboard/stats${currentDateFilter !== 'all' ? '?filter=' + currentDateFilter : ''}`;
        const [statsResponse, casesResponse] = await Promise.all([
            api.get(statsUrl),
            investigationAPI.getCases() // Get all investigator cases for table
        ]);
        
        if (statsResponse.status !== 'success') {
            throw new Error('Failed to load dashboard stats');
        }
        
        const stats = statsResponse.data || {};
        
        // Get all cases for the table
        let allCases = casesResponse.status === 'success' ? (casesResponse.data || []) : [];
        
        // Apply date filter if set (for table only - stats come pre-filtered from backend)
        const filteredCases = filterCasesByDateRange(allCases, currentDateFilter);
        
        console.log('[DEBUG] Dashboard stats from API:', stats);
        console.log('[DEBUG] All cases count:', allCases.length);
        console.log('[DEBUG] Filtered cases count:', filteredCases.length);
        console.log('[DEBUG] Current filter:', currentDateFilter);
        
        const headerHtml = renderSimpleDashboardHeader();
        const statsHtml = renderSimpleStatsGridFromAPI(stats);
        const casesHtml = renderRecentCasesList(filteredCases);
        
        console.log('[DEBUG] Header HTML length:', headerHtml.length);
        console.log('[DEBUG] Stats HTML length:', statsHtml.length);
        console.log('[DEBUG] Cases HTML length:', casesHtml.length);
        
        const finalHtml = `
            <div class="investigator-dashboard-simple container-fluid">
                <!-- Dashboard Header -->
                ${headerHtml}
                
                <!-- Simple Stats Grid -->
                ${statsHtml}
                
                <!-- Recent Cases -->
                ${casesHtml}
            </div>
        `;
        
        console.log('[DEBUG] Final HTML length:', finalHtml.length);
        console.log('[DEBUG] First 500 chars:', finalHtml.substring(0, 500));
        
        return finalHtml;
    } catch (error) {
        console.error('[ERROR] Error rendering investigator dashboard:', error);
        console.error('[ERROR] Stack trace:', error.stack);
        return `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i>
                ${t('error_loading_dashboard')}
                <br><small>Error: ${error.message}</small>
            </div>
        `;
    }
}

// Show loading state
function showLoadingState() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
        pageContent.innerHTML = `
            <div class="loading-dashboard">
                <div class="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        `;
    }
}

// Analyze investigator data for comprehensive dashboard
function analyzeInvestigatorData(cases, stats) {
    const analysis = {
        totalCases: cases.length,
        activeCases: 0,
        newAssignedCases: 0,
        closedCases: {
            total: 0,
            investigatorClosed: 0,
            courtClosed: 0,
            concluded: 0
        },
        byStatus: {},
        byCategory: {},
        byPriority: {},
        evidence: {
            total: 0,
            byType: {}
        },
        persons: {
            total: 0,
            accusers: 0,  // Victims/Complainants
            accused: 0,   // Suspects
            witnesses: 0,
            otherPersons: 0
        },
        medicalForms: {
            total: 0,
            completed: 0,
            pending: 0
        },
        monthlyTrend: {},
        urgentCases: [],
        completionRate: 0
    };
    
    // Analyze each case
    cases.forEach(caseItem => {
        // By Status
        const status = caseItem.status || 'unknown';
        analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;
        
        // Count active cases
        if (!['closed', 'concluded', 'sent_to_court'].includes(status)) {
            analysis.activeCases++;
        }
        
        // Count newly assigned cases (assigned status or created in last 7 days)
        if (status === 'assigned') {
            analysis.newAssignedCases++;
        } else if (caseItem.created_at) {
            const daysAgo = Math.floor((new Date() - new Date(caseItem.created_at)) / (1000 * 60 * 60 * 24));
            if (daysAgo <= 7 && status === 'under_investigation') {
                analysis.newAssignedCases++;
            }
        }
        
        // Count closed cases by type
        if (status === 'closed') {
            analysis.closedCases.total++;
            // Check closure type from case data
            if (caseItem.closure_type === 'investigator') {
                analysis.closedCases.investigatorClosed++;
            } else if (caseItem.closure_type === 'court' || status === 'sent_to_court') {
                analysis.closedCases.courtClosed++;
            }
        } else if (status === 'concluded') {
            analysis.closedCases.total++;
            analysis.closedCases.concluded++;
        } else if (status === 'sent_to_court') {
            analysis.closedCases.total++;
            analysis.closedCases.courtClosed++;
        }
        
        // By Category
        const category = caseItem.crime_category || caseItem.crime_type || 'Other';
        analysis.byCategory[category] = (analysis.byCategory[category] || 0) + 1;
        
        // By Priority
        const priority = caseItem.priority || 'medium';
        analysis.byPriority[priority] = (analysis.byPriority[priority] || 0) + 1;
        
        // Urgent cases (high priority or approaching deadline)
        if (priority === 'urgent' || priority === 'high') {
            analysis.urgentCases.push(caseItem);
        }
        
        if (caseItem.investigation_deadline) {
            const deadline = new Date(caseItem.investigation_deadline);
            const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 3 && daysUntil >= 0) {
                if (!analysis.urgentCases.find(c => c.id === caseItem.id)) {
                    analysis.urgentCases.push(caseItem);
                }
            }
        }
        
        // Count persons if available in case data
        if (caseItem.person_count) {
            analysis.persons.total += caseItem.person_count;
        }
        if (caseItem.accusers_count) {
            analysis.persons.accusers += caseItem.accusers_count;
        }
        if (caseItem.accused_count) {
            analysis.persons.accused += caseItem.accused_count;
        }
        if (caseItem.witnesses_count) {
            analysis.persons.witnesses += caseItem.witnesses_count;
        }
        
        // Count medical forms if available
        if (caseItem.medical_forms_count) {
            analysis.medicalForms.total += caseItem.medical_forms_count;
            if (caseItem.medical_forms_completed) {
                analysis.medicalForms.completed += caseItem.medical_forms_completed;
            }
        }
        
        // Monthly trend
        if (caseItem.created_at) {
            const month = new Date(caseItem.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            analysis.monthlyTrend[month] = (analysis.monthlyTrend[month] || 0) + 1;
        }
    });
    
    // Calculate completion rate
    analysis.completionRate = analysis.totalCases > 0 ? ((analysis.closedCases.total / analysis.totalCases) * 100).toFixed(1) : 0;
    
    // Calculate pending medical forms
    analysis.medicalForms.pending = analysis.medicalForms.total - analysis.medicalForms.completed;
    
    // Use stats if available (override with more accurate data if provided)
    if (stats.total_evidence) analysis.evidence.total = stats.total_evidence;
    if (stats.total_persons) analysis.persons.total = stats.total_persons;
    if (stats.total_accusers) analysis.persons.accusers = stats.total_accusers;
    if (stats.total_accused) analysis.persons.accused = stats.total_accused;
    if (stats.total_witnesses) analysis.persons.witnesses = stats.total_witnesses;
    if (stats.total_medical_forms) analysis.medicalForms.total = stats.total_medical_forms;
    if (stats.completed_medical_forms) analysis.medicalForms.completed = stats.completed_medical_forms;
    if (stats.pending_medical_forms) analysis.medicalForms.pending = stats.pending_medical_forms;
    
    // Calculate other persons if not categorized
    const categorizedPersons = analysis.persons.accusers + analysis.persons.accused + analysis.persons.witnesses;
    if (analysis.persons.total > categorizedPersons) {
        analysis.persons.otherPersons = analysis.persons.total - categorizedPersons;
    }
    
    return analysis;
}

// Render simple dashboard header with date filter
function renderSimpleDashboardHeader() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const userName = currentUser.full_name || currentUser.username || t('investigator');
    
    return `
        <div class="simple-dashboard-header">
            <div class="header-left">
                <h2 class="dashboard-title">
                    <i class="fas fa-tachometer-alt"></i>
                    ${t('investigator_dashboard') || 'Investigator Dashboard'}
                </h2>
                <p class="welcome-text">${t('welcome') || 'Welcome'}, <strong>${userName}</strong></p>
            </div>
            <div class="header-right">
                <div class="date-filter-container">
                    <button class="btn btn-sm btn-outline-secondary" onclick="setDashboardDateFilter('today')">
                        <i class="fas fa-calendar-day"></i> ${t('today') || 'Today'}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="setDashboardDateFilter('week')">
                        <i class="fas fa-calendar-week"></i> ${t('this_week') || 'This Week'}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="setDashboardDateFilter('month')">
                        <i class="fas fa-calendar-alt"></i> ${t('this_month') || 'This Month'}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="setDashboardDateFilter('year')">
                        <i class="fas fa-calendar"></i> ${t('this_year') || 'This Year'}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary active" onclick="setDashboardDateFilter('all')">
                        <i class="fas fa-infinity"></i> ${t('all_time') || 'All Time'}
                    </button>
                </div>
                <button class="btn btn-primary" onclick="loadPage('investigations')">
                    <i class="fas fa-folder-open"></i> ${t('view_all_cases') || 'View All Cases'}
                </button>
            </div>
        </div>
    `;
}

// Render simple stats grid using data directly from API (like solved-cases-dashboard)
function renderSimpleStatsGridFromAPI(stats) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    console.log('[DEBUG] Rendering stats:', stats);
    
    return `
        <div class="row" id="stats-cards">
            <!-- Row 1: Main Stats -->
            <div class="col-md-3">
                <div class="stats-card bg-primary text-white position-relative clickable-card" onclick="showCardDetails('total_cases', ${stats.total_cases || 0})">
                    <div class="stats-label">${t('total_cases') || 'Total Cases'}</div>
                    <div class="stats-number">${stats.total_cases || 0}</div>
                    <i class="fas fa-briefcase stats-icon"></i>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stats-card bg-success text-white position-relative clickable-card" onclick="showCardDetails('active_cases', ${stats.active_cases || 0})">
                    <div class="stats-label">${t('active_investigations') || 'Active Investigations'}</div>
                    <div class="stats-number">${stats.active_cases || 0}</div>
                    <i class="fas fa-search stats-icon"></i>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stats-card bg-info text-white position-relative clickable-card" onclick="showCardDetails('closed_cases', ${stats.closed_cases || 0})">
                    <div class="stats-label">${t('total_closed_cases') || 'Total Closed Cases'}</div>
                    <div class="stats-number">${stats.closed_cases || 0}</div>
                    <i class="fas fa-check-circle stats-icon"></i>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stats-card bg-success text-white position-relative">
                    <div class="stats-label">${t('completion_rate') || 'Completion Rate'}</div>
                    <div class="stats-number">${stats.total_cases > 0 ? Math.round((stats.closed_cases / stats.total_cases) * 100) : 0}%</div>
                    <i class="fas fa-chart-line stats-icon"></i>
                </div>
            </div>
            
            <!-- Row 2: Closure Types -->
            <div class="col-md-3">
                <div class="stats-card bg-purple text-white position-relative clickable-card" style="background: #6f42c1 !important;" onclick="showCardDetails('investigator_closed', ${stats.closed_by_investigator || 0})">
                    <div class="stats-label">${t('investigation_closed') || 'Investigation Closed'}</div>
                    <div class="stats-number">${stats.closed_by_investigator || 0}</div>
                    <i class="fas fa-user-check stats-icon"></i>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stats-card bg-teal text-white position-relative clickable-card" style="background: #20c997 !important;" onclick="showCardDetails('court_ack', ${stats.closed_with_court_ack || 0})">
                    <div class="stats-label">${t('court_acknowledgment') || 'Court Acknowledgment'}</div>
                    <div class="stats-number">${stats.closed_with_court_ack || 0}</div>
                    <i class="fas fa-file-signature stats-icon"></i>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stats-card bg-indigo text-white position-relative clickable-card" style="background: #6610f2 !important;" onclick="showCardDetails('court_solved', ${stats.court_solved || 0})">
                    <div class="stats-label">${t('court_solved') || 'Court Solved'}</div>
                    <div class="stats-number">${stats.court_solved || 0}</div>
                    <i class="fas fa-gavel stats-icon"></i>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stats-card bg-info text-white position-relative clickable-card" onclick="showCardDetails('persons', ${stats.total_persons || 0})">
                    <div class="stats-label">${t('persons_in_cases') || 'Persons in Cases'}</div>
                    <div class="stats-number">${stats.total_persons || 0}</div>
                    <i class="fas fa-users stats-icon"></i>
                </div>
            </div>
            
            <!-- Row 3: Investigation Data -->
            <div class="col-md-3">
                <div class="stats-card bg-secondary text-white position-relative clickable-card" onclick="showCardDetails('evidence', ${stats.total_evidence || 0})">
                    <div class="stats-label">${t('evidence_items') || 'Evidence Items'}</div>
                    <div class="stats-number">${stats.total_evidence || 0}</div>
                    <i class="fas fa-box stats-icon"></i>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stats-card bg-danger text-white position-relative clickable-card" onclick="showCardDetails('medical_forms', ${stats.total_medical_forms || 0})">
                    <div class="stats-label">${t('medical_forms') || 'Medical Forms'}</div>
                    <div class="stats-number">${stats.total_medical_forms || 0}</div>
                    <i class="fas fa-file-medical stats-icon"></i>
                </div>
            </div>
        </div>
    `;
}

// Render recent cases list
function renderRecentCasesList(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!cases || cases.length === 0) {
        return `
            <div class="recent-cases-section">
                <h3 class="section-title">
                    <i class="fas fa-history"></i> ${t('recent_cases') || 'Recent Cases'}
                </h3>
                <div class="empty-message">
                    <i class="fas fa-inbox"></i>
                    <p>${t('no_cases_assigned') || 'No cases assigned yet'}</p>
                </div>
            </div>
        `;
    }
    
    const recentCases = cases.slice(0, 10);
    
    return `
        <div class="recent-cases-section">
            <h3 class="section-title">
                <i class="fas fa-history"></i> ${t('recent_cases') || 'Recent Cases'}
            </h3>
            <div class="cases-table-wrapper">
                <table class="cases-table">
                    <thead>
                        <tr>
                            <th>${t('case_number') || 'Case Number'}</th>
                            <th>${t('category') || 'Category'}</th>
                            <th>${t('status') || 'Status'}</th>
                            <th>${t('priority') || 'Priority'}</th>
                            <th>${t('date') || 'Date'}</th>
                            <th>${t('action') || 'Action'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentCases.map(caseItem => `
                            <tr>
                                <td><strong>#${caseItem.case_number || 'N/A'}</strong></td>
                                <td>${caseItem.crime_category || caseItem.crime_type || 'N/A'}</td>
                                <td>
                                    <span class="badge badge-${caseItem.status || 'unknown'}">
                                        ${getStatusLabel(caseItem.status, t)}
                                    </span>
                                </td>
                                <td>
                                    ${caseItem.priority ? `
                                        <span class="badge badge-priority-${caseItem.priority}">
                                            ${caseItem.priority}
                                        </span>
                                    ` : '-'}
                                </td>
                                <td>${formatDate(caseItem.created_at)}</td>
                                <td>
                                    <button class="btn-small btn-primary" onclick="openCaseDetails(${caseItem.id})">
                                        <i class="fas fa-eye"></i> ${t('view') || 'View'}
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

// Render quick stats overview
function renderQuickStats(data) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="quick-stats-grid">
            <div class="stat-card-modern stat-primary" onclick="filterCasesByStatus('all')">
                <div class="stat-icon-modern">
                    <i class="fas fa-briefcase"></i>
                </div>
                <div class="stat-details-modern">
                    <div class="stat-value-modern">${data.totalCases || 0}</div>
                    <div class="stat-label-modern">${t('total_cases') || 'Total Cases'}</div>
                    <div class="stat-trend">
                        <i class="fas fa-info-circle"></i>
                        <span>${t('all_assigned_cases') || 'All assigned to you'}</span>
                    </div>
                </div>
            </div>
            
            <div class="stat-card-modern stat-success" onclick="filterCasesByStatus('active')">
                <div class="stat-icon-modern">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-details-modern">
                    <div class="stat-value-modern">${data.activeCases || 0}</div>
                    <div class="stat-label-modern">${t('active_investigations') || 'Active Investigations'}</div>
                    <div class="stat-trend stat-positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>${t('in_progress') || 'In Progress'}</span>
                    </div>
                </div>
            </div>
            
            <div class="stat-card-modern stat-info" onclick="filterCasesByStatus('new')">
                <div class="stat-icon-modern">
                    <i class="fas fa-plus-circle"></i>
                </div>
                <div class="stat-details-modern">
                    <div class="stat-value-modern">${data.newAssignedCases || 0}</div>
                    <div class="stat-label-modern">${t('new_assignments') || 'New Assignments'}</div>
                    <div class="stat-trend">
                        <i class="fas fa-calendar-week"></i>
                        <span>${t('last_7_days') || 'Last 7 days'}</span>
                    </div>
                </div>
            </div>
            
            <div class="stat-card-modern stat-warning" onclick="filterCasesByStatus('urgent')">
                <div class="stat-icon-modern">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-details-modern">
                    <div class="stat-value-modern">${data.urgentCases?.length || 0}</div>
                    <div class="stat-label-modern">${t('urgent_cases') || 'Urgent Cases'}</div>
                    <div class="stat-trend stat-negative">
                        <i class="fas fa-bell"></i>
                        <span>${t('needs_attention') || 'Needs Attention'}</span>
                    </div>
                </div>
            </div>
            
            <div class="stat-card-modern stat-completed" onclick="filterCasesByStatus('closed')">
                <div class="stat-icon-modern">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-details-modern">
                    <div class="stat-value-modern">${data.closedCases?.total || 0}</div>
                    <div class="stat-label-modern">${t('closed_cases') || 'Closed Cases'}</div>
                    <div class="stat-trend stat-positive">
                        <i class="fas fa-percentage"></i>
                        <span>${data.completionRate || 0}% ${t('completion_rate') || 'Completion'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render Cases Overview Card
function renderCasesOverviewCard(data) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const statusData = Object.entries(data.byStatus).map(([status, count]) => ({
        status,
        count,
        label: getStatusLabel(status, t)
    }));
    
    return `
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-chart-pie"></i>
                    ${t('cases_overview') || 'Cases Overview'}
                </h3>
            </div>
            <div class="card-body">
                <div class="overview-stats">
                    ${statusData.length > 0 ? statusData.map(item => `
                        <div class="overview-item">
                            <div class="overview-label">${item.label}</div>
                            <div class="overview-value">${item.count}</div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>${t('no_cases_assigned') || 'No cases assigned yet'}</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Render Status Distribution Chart
function renderStatusDistributionChart(data) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const statusData = Object.entries(data.byStatus);
    const total = statusData.reduce((sum, [_, count]) => sum + count, 0);
    
    return `
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-chart-bar"></i>
                    ${t('status_distribution') || 'Status Distribution'}
                </h3>
            </div>
            <div class="card-body">
                ${statusData.length > 0 ? `
                    <div class="chart-bars">
                        ${statusData.map(([status, count]) => {
                            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                            const statusColor = getStatusColor(status);
                            return `
                                <div class="chart-bar-item">
                                    <div class="chart-bar-label">
                                        <span class="status-dot" style="background: ${statusColor}"></span>
                                        <span>${getStatusLabel(status, t)}</span>
                                    </div>
                                    <div class="chart-bar-track">
                                        <div class="chart-bar-fill" style="width: ${percentage}%; background: ${statusColor}"></div>
                                    </div>
                                    <div class="chart-bar-value">${count}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-chart-bar"></i>
                        <p>${t('no_data_available') || 'No data available'}</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Render Priority Breakdown Card
function renderPriorityBreakdownCard(data) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const priorities = [
        { key: 'urgent', label: t('urgent') || 'Urgent', icon: 'fa-exclamation-circle', color: '#ef4444' },
        { key: 'high', label: t('high') || 'High', icon: 'fa-arrow-up', color: '#f59e0b' },
        { key: 'medium', label: t('medium') || 'Medium', icon: 'fa-minus', color: '#3b82f6' },
        { key: 'low', label: t('low') || 'Low', icon: 'fa-arrow-down', color: '#10b981' }
    ];
    
    return `
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-flag"></i>
                    ${t('priority_breakdown') || 'Priority Breakdown'}
                </h3>
            </div>
            <div class="card-body">
                <div class="priority-grid">
                    ${priorities.map(priority => {
                        const count = data.byPriority[priority.key] || 0;
                        return `
                            <div class="priority-item" onclick="filterCasesByPriority('${priority.key}')">
                                <div class="priority-icon" style="background: ${priority.color}">
                                    <i class="fas ${priority.icon}"></i>
                                </div>
                                <div class="priority-details">
                                    <div class="priority-count">${count}</div>
                                    <div class="priority-label">${priority.label}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// Render Recent Cases Card
function renderRecentCasesCard(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const recentCases = cases.slice(0, 5);
    
    return `
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-history"></i>
                    ${t('recent_cases') || 'Recent Cases'}
                </h3>
                <button class="btn-link" onclick="loadPage('investigations')">
                    ${t('view_all') || 'View All'} →
                </button>
            </div>
            <div class="card-body">
                ${recentCases.length > 0 ? `
                    <div class="recent-cases-list">
                        ${recentCases.map(caseItem => `
                            <div class="case-item" onclick="openCaseDetails(${caseItem.id})">
                                <div class="case-item-header">
                                    <div class="case-number">#${caseItem.case_number || 'N/A'}</div>
                                    <span class="case-badge case-badge-${caseItem.status || 'unknown'}">
                                        ${getStatusLabel(caseItem.status, t)}
                                    </span>
                                </div>
                                <div class="case-item-body">
                                    <div class="case-description">${caseItem.crime_category || caseItem.crime_type || 'Unknown'}</div>
                                    <div class="case-meta">
                                        <span><i class="far fa-calendar"></i> ${formatDate(caseItem.created_at)}</span>
                                        ${caseItem.priority ? `<span class="priority-badge priority-${caseItem.priority}">
                                            <i class="fas fa-flag"></i> ${caseItem.priority}
                                        </span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>${t('no_recent_cases') || 'No recent cases'}</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Render Urgent Cases Card
function renderUrgentCasesCard(urgentCases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="dashboard-card urgent-card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${t('urgent_attention') || 'Urgent Attention'}
                </h3>
            </div>
            <div class="card-body">
                ${urgentCases.length > 0 ? `
                    <div class="urgent-cases-list">
                        ${urgentCases.slice(0, 3).map(caseItem => `
                            <div class="urgent-case-item" onclick="openCaseDetails(${caseItem.id})">
                                <div class="urgent-icon">
                                    <i class="fas fa-bell"></i>
                                </div>
                                <div class="urgent-details">
                                    <div class="urgent-title">#${caseItem.case_number || 'N/A'}</div>
                                    <div class="urgent-reason">
                                        ${caseItem.priority === 'urgent' ? t('urgent_priority') || 'Urgent Priority' : t('approaching_deadline') || 'Approaching Deadline'}
                                    </div>
                                </div>
                                <div class="urgent-action">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-state success-state">
                        <i class="fas fa-check-circle"></i>
                        <p>${t('no_urgent_cases') || 'No urgent cases'}</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Render Quick Actions Card
function renderQuickActionsCard() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-bolt"></i>
                    ${t('quick_actions') || 'Quick Actions'}
                </h3>
            </div>
            <div class="card-body">
                <div class="quick-actions-grid">
                    <button class="action-btn" onclick="loadPage('investigations')">
                        <i class="fas fa-search"></i>
                        <span>${t('view_cases') || 'View Cases'}</span>
                    </button>
                    <button class="action-btn" onclick="loadPage('solved-cases')">
                        <i class="fas fa-check-circle"></i>
                        <span>${t('solved_cases') || 'Solved Cases'}</span>
                    </button>
                    <button class="action-btn" onclick="loadPage('reopen-cases')">
                        <i class="fas fa-folder-open"></i>
                        <span>${t('reopen_cases') || 'Reopen Cases'}</span>
                    </button>
                    <button class="action-btn" onclick="refreshDashboard()">
                        <i class="fas fa-sync"></i>
                        <span>${t('refresh') || 'Refresh'}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render comprehensive statistics (old function kept for compatibility)
function renderComprehensiveStats(data) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="comprehensive-stats-grid">
            <!-- Total Cases -->
            <div class="stat-card-large stat-info">
                <div class="stat-icon-large"><i class="fas fa-briefcase"></i></div>
                <div class="stat-content-large">
                    <div class="stat-value-large">${data.totalCases}</div>
                    <div class="stat-label-large">${t('total_cases')}</div>
                    <div class="stat-sublabel">${t('all_assigned_cases')}</div>
                </div>
            </div>
            
            <!-- Active Cases -->
            <div class="stat-card-large stat-primary">
                <div class="stat-icon-large"><i class="fas fa-folder-open"></i></div>
                <div class="stat-content-large">
                    <div class="stat-value-large">${data.activeCases}</div>
                    <div class="stat-label-large">${t('active_investigations')}</div>
                    <div class="stat-sublabel">${t('cases_in_progress')}</div>
                </div>
            </div>
            
            <!-- New Assigned Cases -->
            <div class="stat-card-large stat-blue">
                <div class="stat-icon-large"><i class="fas fa-plus-circle"></i></div>
                <div class="stat-content-large">
                    <div class="stat-value-large">${data.newAssignedCases}</div>
                    <div class="stat-label-large">${t('new_assigned_cases')}</div>
                    <div class="stat-sublabel">${t('last_7_days')}</div>
                </div>
            </div>
            
            <!-- Closed Cases with Details -->
            <div class="stat-card-large stat-success stat-expandable" onclick="toggleClosureDetails(this)">
                <div class="stat-icon-large"><i class="fas fa-check-circle"></i></div>
                <div class="stat-content-large">
                    <div class="stat-value-large">${data.closedCases.total}</div>
                    <div class="stat-label-large">${t('closed_cases')}</div>
                    <div class="stat-sublabel">${data.completionRate}% ${t('completion_rate')}</div>
                </div>
                <div class="stat-expand-icon"><i class="fas fa-chevron-down"></i></div>
            </div>
            
            <!-- Closure Details (Hidden by default) -->
            <div class="stat-details-card" id="closureDetails" style="display: none;">
                <div class="stat-details-header">
                    <h4><i class="fas fa-info-circle"></i> ${t('closure_breakdown')}</h4>
                </div>
                <div class="stat-details-body">
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #10b981;"><i class="fas fa-user-check"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.closedCases.investigatorClosed}</div>
                            <div class="detail-label">${t('investigator_closed')}</div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #3b82f6;"><i class="fas fa-gavel"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.closedCases.courtClosed}</div>
                            <div class="detail-label">${t('court_closed')}</div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #8b5cf6;"><i class="fas fa-check-double"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.closedCases.concluded}</div>
                            <div class="detail-label">${t('concluded_cases')}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Urgent Cases -->
            <div class="stat-card-large stat-warning">
                <div class="stat-icon-large"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="stat-content-large">
                    <div class="stat-value-large">${data.urgentCases.length}</div>
                    <div class="stat-label-large">${t('urgent_cases')}</div>
                    <div class="stat-sublabel">${t('require_immediate_attention')}</div>
                </div>
            </div>
            
            <!-- Persons with Details -->
            <div class="stat-card-large stat-cyan stat-expandable" onclick="togglePersonsDetails(this)">
                <div class="stat-icon-large"><i class="fas fa-users"></i></div>
                <div class="stat-content-large">
                    <div class="stat-value-large">${data.persons.total}</div>
                    <div class="stat-label-large">${t('persons_involved')}</div>
                    <div class="stat-sublabel">${t('click_for_breakdown')}</div>
                </div>
                <div class="stat-expand-icon"><i class="fas fa-chevron-down"></i></div>
            </div>
            
            <!-- Persons Details (Hidden by default) -->
            <div class="stat-details-card" id="personsDetails" style="display: none;">
                <div class="stat-details-header">
                    <h4><i class="fas fa-users"></i> ${t('persons_breakdown')}</h4>
                </div>
                <div class="stat-details-body">
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #ef4444;"><i class="fas fa-user-injured"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.persons.accusers}</div>
                            <div class="detail-label">${t('accusers_victims')}</div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #f59e0b;"><i class="fas fa-user-shield"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.persons.accused}</div>
                            <div class="detail-label">${t('accused_suspects')}</div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #3b82f6;"><i class="fas fa-user-friends"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.persons.witnesses}</div>
                            <div class="detail-label">${t('witnesses')}</div>
                        </div>
                    </div>
                    ${data.persons.otherPersons > 0 ? `
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #6b7280;"><i class="fas fa-user"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.persons.otherPersons}</div>
                            <div class="detail-label">${t('other_persons')}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Evidence Items -->
            <div class="stat-card-large stat-purple">
                <div class="stat-icon-large"><i class="fas fa-box"></i></div>
                <div class="stat-content-large">
                    <div class="stat-value-large">${data.evidence.total}</div>
                    <div class="stat-label-large">${t('evidence_items')}</div>
                    <div class="stat-sublabel">${t('collected_items')}</div>
                </div>
            </div>
            
            <!-- Medical Forms -->
            <div class="stat-card-large stat-teal stat-expandable" onclick="toggleMedicalDetails(this)">
                <div class="stat-icon-large"><i class="fas fa-notes-medical"></i></div>
                <div class="stat-content-large">
                    <div class="stat-value-large">${data.medicalForms.total}</div>
                    <div class="stat-label-large">${t('medical_forms')}</div>
                    <div class="stat-sublabel">${t('click_for_details')}</div>
                </div>
                <div class="stat-expand-icon"><i class="fas fa-chevron-down"></i></div>
            </div>
            
            <!-- Medical Forms Details (Hidden by default) -->
            <div class="stat-details-card" id="medicalDetails" style="display: none;">
                <div class="stat-details-header">
                    <h4><i class="fas fa-notes-medical"></i> ${t('medical_forms_breakdown')}</h4>
                </div>
                <div class="stat-details-body">
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #10b981;"><i class="fas fa-check"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.medicalForms.completed}</div>
                            <div class="detail-label">${t('completed_forms')}</div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon" style="background: #f59e0b;"><i class="fas fa-clock"></i></span>
                        <div class="detail-content">
                            <div class="detail-value">${data.medicalForms.pending}</div>
                            <div class="detail-label">${t('pending_forms')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        function toggleClosureDetails(card) {
            const details = document.getElementById('closureDetails');
            const icon = card.querySelector('.stat-expand-icon i');
            if (details.style.display === 'none') {
                details.style.display = 'block';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                details.style.display = 'none';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        }
        
        function togglePersonsDetails(card) {
            const details = document.getElementById('personsDetails');
            const icon = card.querySelector('.stat-expand-icon i');
            if (details.style.display === 'none') {
                details.style.display = 'block';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                details.style.display = 'none';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        }
        
        function toggleMedicalDetails(card) {
            const details = document.getElementById('medicalDetails');
            const icon = card.querySelector('.stat-expand-icon i');
            if (details.style.display === 'none') {
                details.style.display = 'block';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                details.style.display = 'none';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        }
        </script>
    `;
}

// Render cases by status table
function renderCasesByStatusTable(byStatus) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const statusOrder = ['assigned', 'under_investigation', 'evidence_review', 'pending', 'concluded', 'sent_to_court', 'closed'];
    const statusColors = {
        'assigned': '#06b6d4',
        'under_investigation': '#3b82f6',
        'evidence_review': '#8b5cf6',
        'pending': '#f59e0b',
        'concluded': '#10b981',
        'sent_to_court': '#ef4444',
        'closed': '#6b7280'
    };
    
    let totalCases = 0;
    Object.values(byStatus).forEach(count => totalCases += count);
    
    let html = `
        <div class="data-table-card">
            <div class="data-table-header">
                <h3><i class="fas fa-list"></i> ${t('cases_by_status')}</h3>
                <span class="table-total">${t('total')}: ${totalCases}</span>
            </div>
            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${t('status')}</th>
                            <th class="text-center">${t('count')}</th>
                            <th class="text-center">${t('percentage')}</th>
                            <th>${t('visual')}</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    statusOrder.forEach(status => {
        const count = byStatus[status] || 0;
        const percentage = totalCases > 0 ? ((count / totalCases) * 100).toFixed(1) : 0;
        const color = statusColors[status] || '#6b7280';
        const statusLabel = t(status) || status.replace(/_/g, ' ');
        
        html += `
            <tr>
                <td>
                    <span class="status-indicator" style="background-color: ${color};"></span>
                    ${statusLabel}
                </td>
                <td class="text-center"><strong>${count}</strong></td>
                <td class="text-center">${percentage}%</td>
                <td>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${percentage}%; background-color: ${color};"></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return html;
}

// Render cases by category table
function renderCasesByCategoryTable(byCategory) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    let totalCases = 0;
    Object.values(byCategory).forEach(count => totalCases += count);
    
    // Sort by count descending
    const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    
    let html = `
        <div class="data-table-card">
            <div class="data-table-header">
                <h3><i class="fas fa-folder-tree"></i> ${t('cases_by_category')}</h3>
                <span class="table-total">${t('total')}: ${totalCases}</span>
            </div>
            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${t('category')}</th>
                            <th class="text-center">${t('count')}</th>
                            <th class="text-center">${t('percentage')}</th>
                            <th>${t('visual')}</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    sortedCategories.forEach(([category, count]) => {
        const percentage = totalCases > 0 ? ((count / totalCases) * 100).toFixed(1) : 0;
        const categoryLabel = t(category) || category;
        
        html += `
            <tr>
                <td><i class="fas fa-folder"></i> ${categoryLabel}</td>
                <td class="text-center"><strong>${count}</strong></td>
                <td class="text-center">${percentage}%</td>
                <td>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${percentage}%; background-color: #3b82f6;"></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return html;
}

// Render cases by priority table
function renderCasesByPriorityTable(byPriority) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const priorityOrder = ['urgent', 'high', 'medium', 'low'];
    const priorityColors = {
        'urgent': '#dc2626',
        'high': '#f59e0b',
        'medium': '#3b82f6',
        'low': '#10b981'
    };
    const priorityIcons = {
        'urgent': 'fa-exclamation-circle',
        'high': 'fa-arrow-up',
        'medium': 'fa-minus',
        'low': 'fa-arrow-down'
    };
    
    let totalCases = 0;
    Object.values(byPriority).forEach(count => totalCases += count);
    
    let html = `
        <div class="data-table-card">
            <div class="data-table-header">
                <h3><i class="fas fa-flag"></i> ${t('cases_by_priority')}</h3>
                <span class="table-total">${t('total')}: ${totalCases}</span>
            </div>
            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${t('priority')}</th>
                            <th class="text-center">${t('count')}</th>
                            <th class="text-center">${t('percentage')}</th>
                            <th>${t('visual')}</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    priorityOrder.forEach(priority => {
        const count = byPriority[priority] || 0;
        const percentage = totalCases > 0 ? ((count / totalCases) * 100).toFixed(1) : 0;
        const color = priorityColors[priority] || '#6b7280';
        const icon = priorityIcons[priority] || 'fa-flag';
        const priorityLabel = t(priority) || priority;
        
        html += `
            <tr>
                <td>
                    <i class="fas ${icon}" style="color: ${color};"></i>
                    ${priorityLabel}
                </td>
                <td class="text-center"><strong>${count}</strong></td>
                <td class="text-center">${percentage}%</td>
                <td>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${percentage}%; background-color: ${color};"></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return html;
}

// Render detailed cases table
function renderDetailedCasesTable(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    let html = `
        <div class="data-table-card full-width">
            <div class="data-table-header">
                <h3><i class="fas fa-table"></i> ${t('detailed_cases_list')}</h3>
                <span class="table-total">${t('showing')}: ${cases.length} ${t('cases')}</span>
            </div>
            <div class="data-table-wrapper">
                <table class="data-table data-table-detailed" id="investigatorCasesTable">
                    <thead>
                        <tr>
                            <th>${t('case_number')}</th>
                            <th>${t('category')}</th>
                            <th>${t('status')}</th>
                            <th>${t('priority')}</th>
                            <th>${t('location')}</th>
                            <th>${t('date_opened')}</th>
                            <th>${t('deadline')}</th>
                            <th class="text-center">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    cases.forEach(caseItem => {
        const deadline = caseItem.investigation_deadline ? new Date(caseItem.investigation_deadline) : null;
        const daysUntil = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
        let deadlineClass = '';
        let deadlineText = t('no_deadline');
        
        if (deadline) {
            deadlineText = formatDateOnly(caseItem.investigation_deadline);
            if (daysUntil !== null) {
                if (daysUntil < 0) {
                    deadlineClass = 'text-danger';
                    deadlineText += ` (${t('overdue')})`;
                } else if (daysUntil === 0) {
                    deadlineClass = 'text-danger';
                    deadlineText += ` (${t('today')})`;
                } else if (daysUntil <= 3) {
                    deadlineClass = 'text-warning';
                    deadlineText = `${daysUntil} ${t('days')}`;
                }
            }
        }
        
        html += `
            <tr>
                <td><strong>${caseItem.case_number}</strong></td>
                <td>${caseItem.crime_category || caseItem.crime_type || '-'}</td>
                <td>${getStatusBadge(caseItem.status)}</td>
                <td>${getPriorityBadge(caseItem.priority)}</td>
                <td>${caseItem.incident_location || '-'}</td>
                <td>${formatDateOnly(caseItem.created_at)}</td>
                <td class="${deadlineClass}">${deadlineText}</td>
                <td class="text-center">
                    <button class="btn-icon-small" onclick="viewCaseDetails(${caseItem.id})" title="${t('view')}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon-small" onclick="editCase(${caseItem.id})" title="${t('edit')}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Initialize DataTable after rendering
    setTimeout(() => {
        if ($.fn.DataTable && $('#investigatorCasesTable').length) {
            $('#investigatorCasesTable').DataTable({
                order: [[5, 'desc']],
                pageLength: 10,
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
    }, 500);
    
    return html;
}

// Render evidence summary
function renderEvidenceSummary(evidence) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="summary-card">
            <div class="summary-header">
                <h3><i class="fas fa-box"></i> ${t('evidence_summary')}</h3>
            </div>
            <div class="summary-content">
                <div class="summary-stat">
                    <div class="summary-value">${evidence.total}</div>
                    <div class="summary-label">${t('total_evidence_items')}</div>
                </div>
                <div class="summary-list">
                    <p><i class="fas fa-info-circle"></i> ${t('evidence_collected_across_all_cases')}</p>
                    <button class="btn btn-outline btn-sm" onclick="loadPage('evidence')">
                        <i class="fas fa-box"></i> ${t('view_all_evidence')}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render persons summary
function renderPersonsSummary(persons) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="summary-card">
            <div class="summary-header">
                <h3><i class="fas fa-users"></i> ${t('persons_summary')}</h3>
            </div>
            <div class="summary-content">
                <div class="summary-stat">
                    <div class="summary-value">${persons.total}</div>
                    <div class="summary-label">${t('total_persons_involved')}</div>
                </div>
                <div class="summary-list">
                    <p><i class="fas fa-info-circle"></i> ${t('persons_across_all_cases')}</p>
                    <button class="btn btn-outline btn-sm" onclick="loadPage('case-persons')">
                        <i class="fas fa-users"></i> ${t('view_all_persons')}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render welcome header with personalized greeting (keeping for backward compatibility)
function renderWelcomeHeader() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const hour = new Date().getHours();
    let greeting = t('good_morning');
    let icon = 'fa-sun';
    
    if (hour >= 12 && hour < 17) {
        greeting = t('good_afternoon');
        icon = 'fa-cloud-sun';
    } else if (hour >= 17) {
        greeting = t('good_evening');
        icon = 'fa-moon';
    }
    
    const userName = currentUser.full_name || currentUser.username || t('investigator');
    const today = new Date().toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    return `
        <div class="dashboard-welcome-header">
            <div class="welcome-content">
                <div class="greeting-section">
                    <h1>
                        <i class="fas ${icon}"></i>
                        ${greeting}, <span class="user-name">${userName}</span>
                    </h1>
                    <p class="welcome-subtitle">
                        <i class="fas fa-calendar-day"></i> ${today}
                    </p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="loadPage('investigations')">
                        <i class="fas fa-plus"></i> ${t('view_all_cases')}
                    </button>
                    <button class="btn btn-outline" onclick="refreshDashboard()">
                        <i class="fas fa-sync-alt"></i> ${t('refresh')}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render statistics cards with interactive features
function renderStatisticsCards(stats) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const cards = [
        {
            title: t('active_investigations'),
            value: stats.active_investigations || stats.active_cases || 0,
            icon: 'fa-folder-open',
            color: 'primary',
            trend: '+0',
            action: () => loadPage('investigations'),
            description: t('cases_in_progress')
        },
        {
            title: t('completed_cases'),
            value: stats.completed_cases || 0,
            icon: 'fa-check-circle',
            color: 'success',
            trend: '+0',
            action: () => loadPage('solved-cases-dashboard'),
            description: t('successfully_solved')
        },
        {
            title: t('pending_reports'),
            value: stats.pending_reports || 0,
            icon: 'fa-file-alt',
            color: 'warning',
            trend: '0',
            urgent: (stats.pending_reports || 0) > 5,
            action: () => loadPage('reports-dashboard'),
            description: t('awaiting_completion')
        },
        {
            title: t('total_evidence'),
            value: stats.total_evidence || 0,
            icon: 'fa-box',
            color: 'info',
            trend: '+0',
            action: () => loadPage('evidence'),
            description: t('items_collected')
        }
    ];
    
    let html = '<div class="stats-cards-grid">';
    
    cards.forEach(card => {
        html += `
            <div class="stat-card-enhanced stat-${card.color} ${card.urgent ? 'stat-urgent' : ''}" 
                 onclick="if(typeof ${card.action.name} === 'function') ${card.action.name}();" 
                 style="cursor: pointer;">
                <div class="stat-card-header">
                    <div class="stat-icon-wrapper">
                        <i class="fas ${card.icon}"></i>
                    </div>
                    ${card.urgent ? '<span class="urgent-badge"><i class="fas fa-exclamation-circle"></i></span>' : ''}
                </div>
                <div class="stat-card-body">
                    <div class="stat-value">${card.value}</div>
                    <div class="stat-title">${card.title}</div>
                    <div class="stat-description">${card.description}</div>
                </div>
                <div class="stat-card-footer">
                    <span class="stat-action">
                        <i class="fas fa-arrow-right"></i> ${t('view_details')}
                    </span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Render priority alerts for urgent cases
function renderPriorityAlerts(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    // Filter urgent cases (high priority or approaching deadline)
    const urgentCases = cases.filter(c => {
        if (c.priority === 'urgent' || c.priority === 'high') return true;
        
        if (c.investigation_deadline) {
            const deadline = new Date(c.investigation_deadline);
            const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 3 && daysUntil >= 0;
        }
        
        return false;
    }).slice(0, 3); // Show max 3 alerts
    
    if (urgentCases.length === 0) {
        return ''; // No alerts to show
    }
    
    let html = `
        <div class="priority-alerts-section">
            <div class="alerts-header">
                <h3>
                    <i class="fas fa-exclamation-triangle"></i>
                    ${t('priority_alerts')}
                </h3>
                <span class="alerts-count">${urgentCases.length} ${t('urgent_items')}</span>
            </div>
            <div class="alerts-container">
    `;
    
    urgentCases.forEach(caseItem => {
        const deadline = caseItem.investigation_deadline ? new Date(caseItem.investigation_deadline) : null;
        const daysUntil = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
        let alertType = 'warning';
        let alertMessage = t('high_priority_case');
        
        if (daysUntil !== null) {
            if (daysUntil === 0) {
                alertType = 'danger';
                alertMessage = t('deadline_today');
            } else if (daysUntil === 1) {
                alertType = 'danger';
                alertMessage = t('deadline_tomorrow');
            } else if (daysUntil <= 3) {
                alertType = 'warning';
                alertMessage = `${t('deadline_in')} ${daysUntil} ${t('days')}`;
            }
        }
        
        html += `
            <div class="alert-card alert-${alertType}" onclick="viewCaseDetails(${caseItem.id})">
                <div class="alert-icon">
                    <i class="fas ${alertType === 'danger' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${caseItem.case_number}</div>
                    <div class="alert-description">${caseItem.crime_type || t('investigation')}</div>
                    <div class="alert-message">
                        <i class="fas fa-clock"></i> ${alertMessage}
                    </div>
                </div>
                <div class="alert-action">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Render active cases section
function renderActiveCasesSection(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="dashboard-card">
            <div class="card-header-enhanced">
                <div>
                    <h2><i class="fas fa-briefcase"></i> ${t('active_investigations')}</h2>
                    <p class="card-subtitle">${cases.length} ${t('cases_assigned_to_you')}</p>
                </div>
                <button class="btn btn-sm btn-primary" onclick="loadPage('investigations')">
                    <i class="fas fa-list"></i> ${t('view_all')}
                </button>
            </div>
            <div class="card-body">
                ${renderEnhancedCasesTable(cases)}
            </div>
        </div>
    `;
}

// Render enhanced cases table
function renderEnhancedCasesTable(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (cases.length === 0) {
        return `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>${t('no_active_cases')}</h3>
                <p>${t('no_cases_assigned_yet')}</p>
            </div>
        `;
    }
    
    let html = `
        <div class="cases-table-wrapper">
            <table class="cases-table-enhanced">
                <thead>
                    <tr>
                        <th>${t('case_number')}</th>
                        <th>${t('crime_type')}</th>
                        <th>${t('status')}</th>
                        <th>${t('priority')}</th>
                        <th>${t('deadline')}</th>
                        <th>${t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    cases.slice(0, 5).forEach(caseItem => {
        const deadline = caseItem.investigation_deadline ? new Date(caseItem.investigation_deadline) : null;
        const daysUntil = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
        let deadlineClass = '';
        let deadlineText = t('no_deadline');
        
        if (deadline) {
            deadlineText = formatDateOnly(caseItem.investigation_deadline);
            if (daysUntil !== null) {
                if (daysUntil < 0) {
                    deadlineClass = 'deadline-overdue';
                    deadlineText += ` (${t('overdue')})`;
                } else if (daysUntil === 0) {
                    deadlineClass = 'deadline-today';
                    deadlineText += ` (${t('today')})`;
                } else if (daysUntil <= 3) {
                    deadlineClass = 'deadline-soon';
                }
            }
        }
        
        html += `
            <tr class="case-row" onclick="viewCaseDetails(${caseItem.id})" style="cursor: pointer;">
                <td>
                    <div class="case-number-cell">
                        <i class="fas fa-folder"></i>
                        <strong>${caseItem.case_number}</strong>
                    </div>
                </td>
                <td>
                    <div class="crime-type-cell">
                        ${caseItem.crime_type || t('investigation')}
                    </div>
                </td>
                <td>${getStatusBadge(caseItem.status)}</td>
                <td>${getPriorityBadge(caseItem.priority)}</td>
                <td>
                    <span class="deadline-badge ${deadlineClass}">
                        ${deadline ? '<i class="fas fa-clock"></i>' : '<i class="fas fa-calendar-times"></i>'}
                        ${deadlineText}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="event.stopPropagation(); viewCaseDetails(${caseItem.id})" title="${t('view_details')}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); editCase(${caseItem.id})" title="${t('edit_case')}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    if (cases.length > 5) {
        html += `
            <div class="table-footer">
                <button class="btn btn-outline" onclick="loadPage('investigations')">
                    ${t('show_all')} ${cases.length} ${t('cases')}
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    }
    
    return html;
}

// Render recent activity timeline
function renderRecentActivityTimeline(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="dashboard-card">
            <div class="card-header-enhanced">
                <h2><i class="fas fa-history"></i> ${t('recent_activity')}</h2>
            </div>
            <div class="card-body">
                <div class="activity-timeline">
                    ${renderTimelineItems(cases)}
                </div>
            </div>
        </div>
    `;
}

// Render timeline items
function renderTimelineItems(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (cases.length === 0) {
        return `
            <div class="empty-state-small">
                <p>${t('no_recent_activity')}</p>
            </div>
        `;
    }
    
    let html = '';
    
    // Show last 5 cases with their update time
    cases.slice(0, 5).forEach((caseItem, index) => {
        const icon = getStatusIcon(caseItem.status);
        const timeAgo = formatTimeAgo(caseItem.updated_at || caseItem.created_at);
        
        html += `
            <div class="timeline-item">
                <div class="timeline-marker">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <strong>${caseItem.case_number}</strong>
                        <span class="timeline-time">${timeAgo}</span>
                    </div>
                    <div class="timeline-body">
                        ${t('case_status_updated')}: ${getStatusBadge(caseItem.status)}
                    </div>
                </div>
            </div>
        `;
    });
    
    return html;
}

// Render status overview with chart
function renderStatusOverview(casesByStatus, stats) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    return `
        <div class="dashboard-card">
            <div class="card-header-enhanced">
                <h2><i class="fas fa-chart-pie"></i> ${t('status_overview')}</h2>
            </div>
            <div class="card-body">
                <div class="status-summary">
                    ${renderStatusList(casesByStatus)}
                </div>
                <div class="chart-container">
                    <canvas id="investigatorStatusChart"></canvas>
                </div>
            </div>
        </div>
    `;
}

// Render status list
function renderStatusList(casesByStatus) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    // Convert to array if it's an object
    let statusArray = [];
    if (Array.isArray(casesByStatus)) {
        statusArray = casesByStatus;
    } else if (casesByStatus && typeof casesByStatus === 'object') {
        // Convert object to array
        statusArray = Object.entries(casesByStatus).map(([status, count]) => ({
            status: status,
            count: count
        }));
    }
    
    if (!statusArray || statusArray.length === 0) {
        return `<p class="text-muted">${t('no_data_available')}</p>`;
    }
    
    let html = '<div class="status-list">';
    
    const statusColors = {
        'under_investigation': '#3b82f6',
        'pending': '#f59e0b',
        'evidence_review': '#8b5cf6',
        'concluded': '#10b981',
        'sent_to_court': '#ef4444',
        'assigned': '#06b6d4',
        'closed': '#6b7280'
    };
    
    statusArray.forEach(item => {
        const color = statusColors[item.status] || '#6b7280';
        const statusLabel = t(item.status) || item.status.replace('_', ' ');
        
        html += `
            <div class="status-item">
                <div class="status-indicator" style="background-color: ${color};"></div>
                <div class="status-info">
                    <span class="status-label">${statusLabel}</span>
                    <span class="status-count">${item.count}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Initialize chart after DOM is loaded
    setTimeout(() => {
        initializeStatusChart(casesByStatus);
    }, 100);
    
    return html;
}

// Initialize status chart
function initializeStatusChart(casesByStatus) {
    const ctx = document.getElementById('investigatorStatusChart');
    if (!ctx) return;
    
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    // Convert to array if it's an object
    let statusArray = [];
    if (Array.isArray(casesByStatus)) {
        statusArray = casesByStatus;
    } else if (casesByStatus && typeof casesByStatus === 'object') {
        statusArray = Object.entries(casesByStatus).map(([status, count]) => ({
            status: status,
            count: count
        }));
    }
    
    if (statusArray.length === 0) return;
    
    const labels = statusArray.map(item => t(item.status) || item.status.replace(/_/g, ' '));
    const data = statusArray.map(item => item.count);
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Render quick actions
function renderQuickActions() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const actions = [
        { icon: 'fa-search', label: t('my_investigations'), page: 'investigations', color: 'primary' },
        { icon: 'fa-box', label: t('evidence'), page: 'evidence', color: 'info' },
        { icon: 'fa-users', label: t('persons'), page: 'case-persons', color: 'success' },
        { icon: 'fa-notes-medical', label: t('medical_forms'), page: 'medical-forms-dashboard', color: 'warning' },
        { icon: 'fa-file-certificate', label: t('certificates'), page: 'certificates-dashboard', color: 'purple' },
        { icon: 'fa-check-double', label: t('solved_cases'), page: 'solved-cases-dashboard', color: 'success' }
    ];
    
    let html = `
        <div class="dashboard-card">
            <div class="card-header-enhanced">
                <h2><i class="fas fa-bolt"></i> ${t('quick_actions')}</h2>
            </div>
            <div class="card-body">
                <div class="quick-actions-grid">
    `;
    
    actions.forEach(action => {
        html += `
            <button class="quick-action-btn action-${action.color}" onclick="loadPage('${action.page}')">
                <i class="fas ${action.icon}"></i>
                <span>${action.label}</span>
            </button>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// Render performance metrics
function renderPerformanceMetrics(stats) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const totalCases = (stats.active_investigations || 0) + (stats.completed_cases || 0);
    const completionRate = totalCases > 0 ? ((stats.completed_cases || 0) / totalCases * 100).toFixed(1) : 0;
    
    return `
        <div class="dashboard-card">
            <div class="card-header-enhanced">
                <h2><i class="fas fa-chart-line"></i> ${t('performance_overview')}</h2>
            </div>
            <div class="card-body">
                <div class="metrics-grid">
                    <div class="metric-item">
                        <div class="metric-label">${t('completion_rate')}</div>
                        <div class="metric-value">${completionRate}%</div>
                        <div class="metric-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${completionRate}%;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-label">${t('total_cases_handled')}</div>
                        <div class="metric-value">${totalCases}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-label">${t('pending_reports')}</div>
                        <div class="metric-value ${(stats.pending_reports || 0) > 5 ? 'metric-warning' : ''}">${stats.pending_reports || 0}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper function to get status icon
function getStatusIcon(status) {
    const icons = {
        'under_investigation': 'fa-search',
        'pending': 'fa-clock',
        'evidence_review': 'fa-box',
        'concluded': 'fa-check-circle',
        'sent_to_court': 'fa-gavel',
        'closed': 'fa-check-double'
    };
    
    return icons[status] || 'fa-folder';
}

// Helper function to format time ago
function formatTimeAgo(dateString) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    if (!dateString) return t('recently');
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return t('just_now');
    if (seconds < 3600) return Math.floor(seconds / 60) + ' ' + t('minutes_ago');
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' ' + t('hours_ago');
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' ' + t('days_ago');
    
    return formatDateOnly(dateString);
}

// Refresh dashboard
async function refreshDashboard() {
    if (currentUser && currentUser.role === USER_ROLES.INVESTIGATOR) {
        showToast(LanguageManager.t('refreshing_dashboard'), 'info');
        await loadDashboard();
    }
}

// Render status chart
function renderStatusChart(byStatus) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    setTimeout(() => {
        const canvas = document.getElementById('statusChartCanvas');
        if (!canvas || !byStatus) return;
        
        const labels = Object.keys(byStatus).map(key => t(key) || key.replace(/_/g, ' '));
        const values = Object.values(byStatus);
        
        if (values.length === 0) return;
        
        new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6b7280'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }, 500);
    
    return `
        <div class="chart-card">
            <div class="chart-header">
                <h3><i class="fas fa-chart-pie"></i> ${t('status_distribution')}</h3>
            </div>
            <div class="chart-body">
                <canvas id="statusChartCanvas" style="max-height: 300px;"></canvas>
            </div>
        </div>
    `;
}

// Render category chart
function renderCategoryChart(byCategory) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    setTimeout(() => {
        const canvas = document.getElementById('categoryChartCanvas');
        if (!canvas || !byCategory) return;
        
        const labels = Object.keys(byCategory).map(key => t(key) || key);
        const values = Object.values(byCategory);
        
        if (values.length === 0) return;
        
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: t('cases'),
                    data: values,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }, 500);
    
    return `
        <div class="chart-card">
            <div class="chart-header">
                <h3><i class="fas fa-chart-bar"></i> ${t('category_distribution')}</h3>
            </div>
            <div class="chart-body">
                <canvas id="categoryChartCanvas" style="max-height: 300px;"></canvas>
            </div>
        </div>
    `;
}

// Render priority chart
function renderPriorityChart(byPriority) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    setTimeout(() => {
        const canvas = document.getElementById('priorityChartCanvas');
        if (!canvas || !byPriority) return;
        
        const priorityOrder = ['urgent', 'high', 'medium', 'low'];
        const labels = priorityOrder.map(p => t(p) || p);
        const values = priorityOrder.map(p => byPriority[p] || 0);
        
        if (values.every(v => v === 0)) return;
        
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#dc2626', '#f59e0b', '#3b82f6', '#10b981'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }, 500);
    
    return `
        <div class="chart-card">
            <div class="chart-header">
                <h3><i class="fas fa-chart-doughnut"></i> ${t('priority_distribution')}</h3>
            </div>
            <div class="chart-body">
                <canvas id="priorityChartCanvas" style="max-height: 300px;"></canvas>
            </div>
        </div>
    `;
}

// Render monthly trend chart
function renderMonthlyTrendChart(monthlyTrend) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    setTimeout(() => {
        const canvas = document.getElementById('trendChartCanvas');
        if (!canvas || !monthlyTrend) return;
        
        const sortedMonths = Object.keys(monthlyTrend).sort((a, b) => new Date(a) - new Date(b));
        const labels = sortedMonths;
        const values = sortedMonths.map(month => monthlyTrend[month]);
        
        if (values.length === 0) return;
        
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: t('cases'),
                    data: values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }, 500);
    
    return `
        <div class="chart-card chart-card-wide">
            <div class="chart-header">
                <h3><i class="fas fa-chart-line"></i> ${t('monthly_case_trend')}</h3>
            </div>
            <div class="chart-body">
                <canvas id="trendChartCanvas" style="max-height: 300px;"></canvas>
            </div>
        </div>
    `;
}

// Make function globally available
window.renderInvestigatorDashboard = renderInvestigatorDashboard;

console.log('✅ Enhanced Investigator Dashboard loaded successfully!');
console.log('✅ renderInvestigatorDashboard is available:', typeof window.renderInvestigatorDashboard);

// ============================================
// Helper Functions for Redesigned Dashboard
// ============================================

// Render Category Breakdown Table
function renderCategoryBreakdownTable(categoryData) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const categories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
    const total = categories.reduce((sum, [_, count]) => sum + count, 0);
    
    return `
        <div class="dashboard-card table-card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-list"></i>
                    ${t('cases_by_category') || 'Cases by Category'}
                </h3>
            </div>
            <div class="card-body">
                ${categories.length > 0 ? `
                    <div class="category-table">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th>${t('category') || 'Category'}</th>
                                    <th>${t('cases') || 'Cases'}</th>
                                    <th>${t('percentage') || 'Percentage'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${categories.map(([category, count]) => {
                                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                    return `
                                        <tr onclick="filterCasesByCategory('${category}')">
                                            <td>
                                                <div class="category-name">
                                                    <i class="fas fa-folder"></i>
                                                    ${category}
                                                </div>
                                            </td>
                                            <td><strong>${count}</strong></td>
                                            <td>
                                                <div class="percentage-bar">
                                                    <div class="percentage-fill" style="width: ${percentage}%"></div>
                                                    <span class="percentage-text">${percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-list"></i>
                        <p>${t('no_categories') || 'No categories found'}</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Render Investigation Metrics Card
function renderInvestigationMetricsCard(data) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    const metrics = [
        {
            label: t('total_evidence') || 'Total Evidence',
            value: data.evidence.total || 0,
            icon: 'fa-box',
            color: '#3b82f6'
        },
        {
            label: t('persons_involved') || 'Persons Involved',
            value: data.persons.total || 0,
            icon: 'fa-users',
            color: '#8b5cf6'
        },
        {
            label: t('medical_forms') || 'Medical Forms',
            value: data.medicalForms.total || 0,
            icon: 'fa-file-medical',
            color: '#10b981'
        },
        {
            label: t('completion_rate') || 'Completion Rate',
            value: `${data.completionRate || 0}%`,
            icon: 'fa-chart-line',
            color: '#f59e0b'
        }
    ];
    
    return `
        <div class="dashboard-card metrics-card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-tachometer-alt"></i>
                    ${t('investigation_metrics') || 'Investigation Metrics'}
                </h3>
            </div>
            <div class="card-body">
                <div class="metrics-grid">
                    ${metrics.map(metric => `
                        <div class="metric-item">
                            <div class="metric-icon" style="background: ${metric.color}">
                                <i class="fas ${metric.icon}"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">${metric.value}</div>
                                <div class="metric-label">${metric.label}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Helper function to get status label
function getStatusLabel(status, t) {
    const labels = {
        'draft': t('draft') || 'Draft',
        'submitted': t('submitted') || 'Submitted',
        'approved': t('approved') || 'Approved',
        'assigned': t('assigned') || 'Assigned',
        'investigating': t('investigating') || 'Investigating',
        'under_investigation': t('under_investigation') || 'Under Investigation',
        'pending_court': t('pending_court') || 'Pending Court',
        'closed': t('closed') || 'Closed',
        'concluded': t('concluded') || 'Concluded',
        'sent_to_court': t('sent_to_court') || 'Sent to Court',
        'unknown': t('unknown') || 'Unknown'
    };
    return labels[status] || status;
}

// Helper function to get status color
function getStatusColor(status) {
    const colors = {
        'draft': '#6b7280',
        'submitted': '#3b82f6',
        'approved': '#10b981',
        'assigned': '#8b5cf6',
        'investigating': '#f59e0b',
        'under_investigation': '#f59e0b',
        'pending_court': '#ef4444',
        'closed': '#059669',
        'concluded': '#059669',
        'sent_to_court': '#dc2626',
        'unknown': '#9ca3af'
    };
    return colors[status] || '#9ca3af';
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Filter functions
function filterCasesByStatus(status) {
    console.log('Filtering by status:', status);
    loadPage('investigations', { status });
}

function filterCasesByPriority(priority) {
    console.log('Filtering by priority:', priority);
    loadPage('investigations', { priority });
}

function filterCasesByCategory(category) {
    console.log('Filtering by category:', category);
    loadPage('investigations', { category });
}

// Global variable to store current date filter
let currentDateFilter = 'all';

// Set dashboard date filter
function setDashboardDateFilter(filter) {
    currentDateFilter = filter;
    
    console.log('[DEBUG] Date filter changed to:', filter);
    
    // Update active button state
    document.querySelectorAll('.date-filter-container .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.closest('.btn').classList.add('active');
    }
    
    // Reload dashboard with filter
    console.log('[DEBUG] Reloading dashboard with filter:', currentDateFilter);
    loadPage('dashboard');
}

// Filter cases by date range
function filterCasesByDateRange(cases, filter) {
    if (filter === 'all') {
        return cases;
    }
    
    const now = new Date();
    let startDate;
    
    switch(filter) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            return cases;
    }
    
    return cases.filter(caseItem => {
        const caseDate = new Date(caseItem.created_at || caseItem.incident_date);
        return caseDate >= startDate;
    });
}

// Open case details
function openCaseDetails(caseId) {
    console.log('Opening case details for case ID:', caseId);
    // Load the investigations page with the case details modal
    loadPage('investigations');
    // Small delay to ensure page is loaded before opening modal
    setTimeout(() => {
        if (typeof viewCaseDetails === 'function') {
            viewCaseDetails(caseId);
        } else {
            console.error('viewCaseDetails function not found');
        }
    }, 500);
}

// Show card details with SweetAlert
function showCardDetails(cardType, count) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    let title = '';
    let htmlContent = '';
    let confirmButtonText = '';
    let navigateTo = '';
    
    switch(cardType) {
        case 'total_cases':
            title = '<i class="fas fa-briefcase text-primary"></i> ' + (t('total_cases') || 'Total Cases');
            htmlContent = `
                <p>You have <strong class="text-primary">${count}</strong> cases assigned to you.</p>
                <p class="text-muted">This includes all active, closed, and pending cases.</p>
            `;
            confirmButtonText = '<i class="fas fa-folder-open"></i> View All Cases';
            navigateTo = 'all-cases';
            break;
            
        case 'active_cases':
            title = '<i class="fas fa-search text-success"></i> ' + (t('active_investigations') || 'Active Investigations');
            htmlContent = `
                <p>You have <strong class="text-success">${count}</strong> active cases currently under investigation.</p>
                <p class="text-muted">These cases require your attention.</p>
            `;
            confirmButtonText = '<i class="fas fa-search"></i> View Active Cases';
            navigateTo = 'investigations';
            break;
            
        case 'closed_cases':
            title = '<i class="fas fa-check-circle text-info"></i> ' + (t('total_closed_cases') || 'Closed Cases');
            htmlContent = `
                <p>You have closed <strong class="text-info">${count}</strong> cases.</p>
                <p class="text-muted">These include cases closed by investigation, court acknowledgment, or court verdict.</p>
            `;
            confirmButtonText = '<i class="fas fa-check-circle"></i> View Closed Cases';
            navigateTo = 'solved-cases-dashboard';
            break;
            
        case 'investigator_closed':
            title = '<i class="fas fa-user-check" style="color: #6f42c1"></i> ' + (t('investigation_closed') || 'Investigation Closed');
            htmlContent = `
                <p><strong style="color: #6f42c1">${count}</strong> cases were closed by your investigation.</p>
                <p class="text-muted">These cases were concluded without court involvement.</p>
            `;
            confirmButtonText = '<i class="fas fa-user-check"></i> View Details';
            navigateTo = 'solved-cases-dashboard';
            break;
            
        case 'court_ack':
            title = '<i class="fas fa-file-signature" style="color: #20c997"></i> ' + (t('court_acknowledgment') || 'Court Acknowledgment');
            htmlContent = `
                <p><strong style="color: #20c997">${count}</strong> cases were closed with court acknowledgment.</p>
                <p class="text-muted">The court has acknowledged receipt and processing of these cases.</p>
            `;
            confirmButtonText = '<i class="fas fa-file-signature"></i> View Details';
            navigateTo = 'solved-cases-dashboard';
            break;
            
        case 'court_solved':
            title = '<i class="fas fa-gavel" style="color: #6610f2"></i> ' + (t('court_solved') || 'Court Solved');
            htmlContent = `
                <p><strong style="color: #6610f2">${count}</strong> cases were resolved with a final court verdict.</p>
                <p class="text-muted">These cases have been formally concluded by the court.</p>
            `;
            confirmButtonText = '<i class="fas fa-gavel"></i> View Details';
            navigateTo = 'solved-cases-dashboard';
            break;
            
        case 'persons':
            title = '<i class="fas fa-users text-info"></i> ' + (t('persons_in_cases') || 'Persons in Cases');
            htmlContent = `
                <p>There are <strong class="text-info">${count}</strong> persons involved across all your cases.</p>
                <p class="text-muted">This includes accusers, accused, and witnesses.</p>
            `;
            confirmButtonText = '<i class="fas fa-users"></i> View Persons';
            navigateTo = 'case-persons';
            break;
            
        case 'evidence':
            title = '<i class="fas fa-box text-secondary"></i> ' + (t('evidence_items') || 'Evidence Items');
            htmlContent = `
                <p>You have collected <strong class="text-secondary">${count}</strong> evidence items.</p>
                <p class="text-muted">Evidence collected across all your cases.</p>
            `;
            confirmButtonText = '<i class="fas fa-box"></i> View Cases';
            navigateTo = 'all-cases';
            break;
            
        case 'medical_forms':
            title = '<i class="fas fa-file-medical text-danger"></i> ' + (t('medical_forms') || 'Medical Forms');
            htmlContent = `
                <p>There are <strong class="text-danger">${count}</strong> medical examination forms.</p>
                <p class="text-muted">Forms associated with your cases.</p>
            `;
            confirmButtonText = '<i class="fas fa-file-medical"></i> View Cases';
            navigateTo = 'all-cases';
            break;
    }
    
    // Add "no items" message if count is 0
    if (count === 0) {
        htmlContent += `
            <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin-top: 10px;">
                <i class="fas fa-info-circle" style="color: #1976d2;"></i>
                <span style="color: #1565c0;">No items to display at this time.</span>
            </div>
        `;
    }
    
    // Show SweetAlert
    Swal.fire({
        title: title,
        html: htmlContent,
        showCancelButton: count > 0,
        confirmButtonText: count > 0 ? confirmButtonText : (t('close') || 'Close'),
        cancelButtonText: '<i class="fas fa-times"></i> ' + (t('close') || 'Close'),
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        width: '500px',
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    }).then((result) => {
        if (result.isConfirmed && count > 0 && navigateTo) {
            loadPage(navigateTo);
        }
    });
}

// Refresh dashboard
function refreshDashboard() {
    loadPage('dashboard');
}
