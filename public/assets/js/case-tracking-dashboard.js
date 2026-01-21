// ============================================
// Case Tracking Dashboard
// Professional dashboard for tracking assigned cases and investigators
// ============================================

let assignedCasesTable = null;
let investigatorPerformanceTable = null;
let statusChartInstance = null;
let priorityChartInstance = null;

/**
 * Load Case Tracking Dashboard
 */
async function loadCaseTrackingDashboard() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    $('#pageTitle').text(t('case_tracking') || 'Case Tracking');
    const content = $('#pageContent');
    
    content.html(`
        <div class="page-header">
            <h2><i class="fas fa-tasks"></i> <span data-i18n="case_tracking">Case Tracking Dashboard</span></h2>
            <p data-i18n="case_tracking_desc">Monitor assigned cases and investigator performance</p>
        </div>
        
        <!-- Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card stat-total">
                <div class="stat-icon"><i class="fas fa-briefcase"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="totalAssignedCases">0</div>
                    <div class="stat-label" data-i18n="total_assigned">Total Assigned</div>
                </div>
            </div>
            
            <div class="stat-card stat-active">
                <div class="stat-icon"><i class="fas fa-spinner"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="activeCases">0</div>
                    <div class="stat-label" data-i18n="in_progress">In Progress</div>
                </div>
            </div>
            
            <div class="stat-card stat-overdue">
                <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="overdueCases">0</div>
                    <div class="stat-label" data-i18n="overdue">Overdue</div>
                </div>
            </div>
            
            <div class="stat-card stat-completed">
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="completedCases">0</div>
                    <div class="stat-label" data-i18n="completed">Completed</div>
                </div>
            </div>
        </div>
        
        <!-- Charts Row -->
        <div class="charts-row">
            <div class="chart-card">
                <div class="card-header">
                    <h3 data-i18n="case_status_distribution">Case Status Distribution</h3>
                </div>
                <div class="card-body">
                    <canvas id="caseStatusChart" height="200"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <div class="card-header">
                    <h3 data-i18n="cases_by_priority">Cases by Priority</h3>
                </div>
                <div class="card-body">
                    <canvas id="priorityChart" height="200"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Assigned Cases Table -->
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-list"></i> <span data-i18n="assigned_cases">Assigned Cases</span></h3>
                <div class="card-actions">
                    <button class="btn btn-sm btn-primary" onclick="refreshCaseTracking()">
                        <i class="fas fa-sync-alt"></i> <span data-i18n="refresh">Refresh</span>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table id="assignedCasesTable" class="display" style="width:100%">
                        <thead>
                            <tr>
                                <th data-i18n="case_number">Case Number</th>
                                <th data-i18n="crime_type">Crime Type</th>
                                <th data-i18n="priority">Priority</th>
                                <th data-i18n="lead_investigator">Lead Investigator</th>
                                <th data-i18n="team_size">Team Size</th>
                                <th data-i18n="assigned_date">Assigned Date</th>
                                <th data-i18n="deadline">Deadline</th>
                                <th data-i18n="days_left">Days Left</th>
                                <th data-i18n="status">Status</th>
                                <th data-i18n="actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- DataTable will populate this -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Investigator Performance Table -->
        <div class="card" style="margin-top: 20px;">
            <div class="card-header">
                <h3><i class="fas fa-user-tie"></i> <span data-i18n="investigator_performance">Investigator Performance</span></h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table id="investigatorPerformanceTable" class="display" style="width:100%">
                        <thead>
                            <tr>
                                <th data-i18n="investigator">Investigator</th>
                                <th data-i18n="active_cases">Active Cases</th>
                                <th data-i18n="completed_cases">Completed Cases</th>
                                <th data-i18n="overdue">Overdue</th>
                                <th data-i18n="avg_completion_time">Avg. Completion Time</th>
                                <th data-i18n="success_rate">Success Rate</th>
                                <th data-i18n="workload">Workload</th>
                                <th data-i18n="actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- DataTable will populate this -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `);
    
    // Translate the page
    if (window.LanguageManager) {
        LanguageManager.translatePage();
    }
    
    // Load data
    await loadCaseTrackingData();
}

/**
 * Load case tracking data
 */
async function loadCaseTrackingData() {
    try {
        // Fetch assigned cases
        const casesResponse = await api.get('/station/cases/assigned-tracking');
        
        if (casesResponse.status === 'success') {
            const cases = casesResponse.data || [];
            
            // Update statistics
            updateStatistics(cases);
            
            // Update charts
            updateCharts(cases);
            
            // Initialize assigned cases table
            initializeAssignedCasesTable(cases);
        }
        
        // Fetch investigator performance
        const performanceResponse = await api.get('/station/investigators/performance');
        
        if (performanceResponse.status === 'success') {
            const investigators = performanceResponse.data || [];
            initializeInvestigatorTable(investigators);
        }
        
    } catch (error) {
        console.error('Error loading case tracking data:', error);
        await Swal.fire({
            icon: 'error',
            title: t('error'),
            text: t('failed_to_load_tracking_data'),
            confirmButtonColor: '#ef4444'
        });
    }
}

/**
 * Update statistics cards
 */
function updateStatistics(cases) {
    const now = new Date();
    
    const stats = {
        total: cases.length,
        active: cases.filter(c => ['assigned', 'investigating'].includes(c.status)).length,
        overdue: cases.filter(c => {
            if (!c.deadline) return false;
            return new Date(c.deadline) < now && !['closed', 'archived'].includes(c.status);
        }).length,
        completed: cases.filter(c => ['closed', 'archived'].includes(c.status)).length
    };
    
    $('#totalAssignedCases').text(stats.total);
    $('#activeCases').text(stats.active);
    $('#overdueCases').text(stats.overdue);
    $('#completedCases').text(stats.completed);
    
    // Add pulse animation for overdue if > 0
    if (stats.overdue > 0) {
        $('.stat-overdue').addClass('pulse');
    }
}

/**
 * Update charts
 */
function updateCharts(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    // Destroy existing charts if they exist
    if (statusChartInstance) {
        statusChartInstance.destroy();
        statusChartInstance = null;
    }
    if (priorityChartInstance) {
        priorityChartInstance.destroy();
        priorityChartInstance = null;
    }
    
    // Status distribution chart
    const statusCounts = {};
    cases.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    
    statusChartInstance = new Chart(document.getElementById('caseStatusChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts).map(s => formatStatus(s)),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#3b82f6', // assigned
                    '#f59e0b', // investigating
                    '#10b981', // evidence_collected
                    '#8b5cf6', // under_review
                    '#6b7280'  // other
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
    
    // Priority distribution chart
    const priorityCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    };
    
    cases.forEach(c => {
        priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
    });
    
    priorityChartInstance = new Chart(document.getElementById('priorityChart'), {
        type: 'bar',
        data: {
            labels: [t('critical'), t('high'), t('medium'), t('low')],
            datasets: [{
                label: t('cases'),
                data: [priorityCounts.critical, priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                backgroundColor: [
                    '#ef4444', // critical
                    '#f59e0b', // high
                    '#3b82f6', // medium
                    '#6b7280'  // low
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * Initialize assigned cases table
 */
function initializeAssignedCasesTable(cases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    if (assignedCasesTable) {
        assignedCasesTable.destroy();
    }
    
    assignedCasesTable = $('#assignedCasesTable').DataTable({
        data: cases,
        order: [[7, 'asc']], // Order by days left (ascending - urgent first)
        pageLength: 25,
        responsive: true,
        columns: [
            {
                data: 'case_number',
                render: function(data, type, row) {
                    return `<strong>${data}</strong>`;
                }
            },
            { data: 'crime_type' },
            {
                data: 'priority',
                render: function(data) {
                    return getPriorityBadge(data);
                }
            },
            {
                data: 'lead_investigator_name',
                render: function(data) {
                    return data || t('na');
                }
            },
            {
                data: 'team_size',
                render: function(data) {
                    return `<span class="badge badge-info">${data} ${data === 1 ? t('investigator_lowercase') : t('investigators')}</span>`;
                }
            },
            {
                data: 'assigned_at',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString() : t('na');
                }
            },
            {
                data: 'deadline',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString() : t('no_deadline');
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    if (!row.deadline) return t('na');
                    const daysLeft = calculateDaysLeft(row.deadline);
                    return getDaysLeftBadge(daysLeft);
                }
            },
            {
                data: 'status',
                render: function(data) {
                    return getStatusBadge(data);
                }
            },
            {
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="viewCaseDetails(${row.id})" title="${t('view_details')}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="viewCaseTeam(${row.id})" title="${t('view_team')}">
                                <i class="fas fa-users"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="updateDeadline(${row.id})" title="${t('update_deadline')}">
                                <i class="fas fa-calendar"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
}

/**
 * Initialize investigator performance table
 */
function initializeInvestigatorTable(investigators) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    if (investigatorPerformanceTable) {
        investigatorPerformanceTable.destroy();
    }
    
    investigatorPerformanceTable = $('#investigatorPerformanceTable').DataTable({
        data: investigators,
        order: [[1, 'desc']], // Order by active cases (descending)
        pageLength: 10,
        responsive: true,
        columns: [
            {
                data: null,
                render: function(data, type, row) {
                    return `
                        <div class="investigator-info">
                            <strong>${row.full_name}</strong>
                            <div style="font-size: 0.85em; color: #666;">${row.badge_number || ''}</div>
                        </div>
                    `;
                }
            },
            {
                data: 'active_cases',
                render: function(data) {
                    return `<span class="badge badge-primary">${data}</span>`;
                }
            },
            {
                data: 'completed_cases',
                render: function(data) {
                    return `<span class="badge badge-success">${data}</span>`;
                }
            },
            {
                data: 'overdue_cases',
                render: function(data) {
                    return data > 0 
                        ? `<span class="badge badge-danger">${data}</span>`
                        : `<span class="badge badge-secondary">0</span>`;
                }
            },
            {
                data: 'avg_completion_days',
                render: function(data) {
                    return data ? `${Math.round(data)} ${t('days')}` : t('na');
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    const total = row.completed_cases + (row.failed_cases || 0);
                    if (total === 0) return t('na');
                    const rate = Math.round((row.completed_cases / total) * 100);
                    return getSuccessRateBadge(rate);
                }
            },
            {
                data: 'active_cases',
                render: function(data) {
                    return getWorkloadBadge(data);
                }
            },
            {
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-info" onclick="viewInvestigatorCases(${row.id})" title="${t('view_cases')}">
                                <i class="fas fa-folder-open"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="viewInvestigatorProfile(${row.id})" title="${t('view_profile')}">
                                <i class="fas fa-user"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
}

/**
 * Calculate days left until deadline
 */
function calculateDaysLeft(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get days left badge
 */
function getDaysLeftBadge(days) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    if (days < 0) {
        return `<span class="badge badge-danger"><i class="fas fa-exclamation-triangle"></i> ${Math.abs(days)} ${t('days_overdue')}</span>`;
    } else if (days === 0) {
        return `<span class="badge badge-warning"><i class="fas fa-clock"></i> ${t('due_today')}</span>`;
    } else if (days <= 3) {
        return `<span class="badge badge-warning">${days} ${t('days_left_lowercase')}</span>`;
    } else if (days <= 7) {
        return `<span class="badge badge-info">${days} ${t('days_left_lowercase')}</span>`;
    } else {
        return `<span class="badge badge-success">${days} ${t('days_left_lowercase')}</span>`;
    }
}

/**
 * Get success rate badge
 */
function getSuccessRateBadge(rate) {
    let color = 'secondary';
    if (rate >= 90) color = 'success';
    else if (rate >= 70) color = 'primary';
    else if (rate >= 50) color = 'warning';
    else color = 'danger';
    
    return `<span class="badge badge-${color}">${rate}%</span>`;
}

/**
 * Get workload badge
 */
function getWorkloadBadge(activeCases) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    if (activeCases === 0) {
        return `<span class="badge badge-secondary">${t('available')}</span>`;
    } else if (activeCases <= 2) {
        return `<span class="badge badge-success">${t('light')}</span>`;
    } else if (activeCases <= 5) {
        return `<span class="badge badge-primary">${t('moderate')}</span>`;
    } else if (activeCases <= 8) {
        return `<span class="badge badge-warning">${t('heavy')}</span>`;
    } else {
        return `<span class="badge badge-danger">${t('overloaded')}</span>`;
    }
}

/**
 * Format status for display
 */
function formatStatus(status) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Refresh case tracking data
 */
async function refreshCaseTracking() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    await loadCaseTrackingData();
    await Swal.fire({
        icon: 'success',
        title: t('refreshed'),
        text: t('case_tracking_data_updated'),
        confirmButtonColor: '#10b981',
        timer: 1500,
        showConfirmButton: false
    });
}

/**
 * View case team
 */
async function viewCaseTeam(caseId) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    try {
        const response = await api.get(`/station/cases/${caseId}/team`);
        
        if (response.status === 'success') {
            const team = response.data || [];
            
            let teamHtml = '<div class="team-list">';
            team.forEach(member => {
                const leadBadge = member.is_lead_investigator ? `<span class="badge badge-warning">${t('lead')}</span>` : '';
                teamHtml += `
                    <div class="team-member">
                        <strong>${member.full_name}</strong> ${leadBadge}
                        <div style="font-size: 0.9em; color: #666;">${t('badge')}: ${member.badge_number}</div>
                        <div style="font-size: 0.9em; color: #666;">${t('phone')}: ${member.phone || t('na')}</div>
                    </div>
                `;
            });
            teamHtml += '</div>';
            
            await Swal.fire({
                title: t('investigation_team'),
                html: teamHtml,
                width: '600px',
                confirmButtonColor: '#3b82f6'
            });
        }
    } catch (error) {
        console.error('Error loading team:', error);
        showToast('error', t('failed_to_load_team'));
    }
}

/**
 * Update deadline
 */
async function updateDeadline(caseId) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const { value: deadline } = await Swal.fire({
        title: t('update_deadline'),
        html: `
            <input type="date" id="deadline-input" class="swal2-input" min="${new Date().toISOString().split('T')[0]}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: t('updated'),
        confirmButtonColor: '#3b82f6',
        preConfirm: () => {
            const deadline = document.getElementById('deadline-input').value;
            if (!deadline) {
                Swal.showValidationMessage(t('please_select_deadline'));
            }
            return deadline;
        }
    });
    
    if (deadline) {
        try {
            const response = await api.post(`/station/cases/${caseId}/deadline`, { deadline });
            
            if (response.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: t('updated'),
                    text: t('deadline_updated_successfully'),
                    confirmButtonColor: '#10b981'
                });
                await loadCaseTrackingData();
            }
        } catch (error) {
            console.error('Error updating deadline:', error);
            await Swal.fire({
                icon: 'error',
                title: t('error'),
                text: t('failed_to_update_deadline'),
                confirmButtonColor: '#ef4444'
            });
        }
    }
}

/**
 * View investigator cases
 */
async function viewInvestigatorCases(investigatorId) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    try {
        const response = await api.get(`/station/investigators/${investigatorId}/cases`);
        
        if (response.status === 'success') {
            const cases = response.data || [];
            
            let casesHtml = '<div class="investigator-cases-list">';
            
            if (cases.length === 0) {
                casesHtml += `
                    <div style="text-align: center; padding: 40px; color: #6b7280;">
                        <i class="fas fa-folder-open" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
                        <p>${t('no_cases_assigned')}</p>
                    </div>
                `;
            } else {
                casesHtml += `
                    <table class="data-table" style="width: 100%;">
                        <thead>
                            <tr>
                                <th>${t('case_number')}</th>
                                <th>${t('crime_type')}</th>
                                <th>${t('status')}</th>
                                <th>${t('priority')}</th>
                                <th>${t('assigned_date')}</th>
                                <th>${t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                cases.forEach(caseItem => {
                    casesHtml += `
                        <tr>
                            <td><strong>${caseItem.case_number}</strong></td>
                            <td>${caseItem.crime_type || t('na')}</td>
                            <td>${getStatusBadge(caseItem.status)}</td>
                            <td>${getPriorityBadge(caseItem.priority || 'medium')}</td>
                            <td>${caseItem.assigned_at ? new Date(caseItem.assigned_at).toLocaleDateString() : t('na')}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewCaseDetails(${caseItem.id}); closeModal();">
                                    <i class="fas fa-eye"></i> ${t('view')}
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                casesHtml += `
                        </tbody>
                    </table>
                `;
            }
            
            casesHtml += '</div>';
            
            await Swal.fire({
                title: t('assigned_cases'),
                html: casesHtml,
                width: '900px',
                confirmButtonColor: '#3b82f6',
                confirmButtonText: t('close')
            });
        }
    } catch (error) {
        console.error('Error loading investigator cases:', error);
        showToast('error', t('failed_to_load_tracking_data'));
    }
}

/**
 * View investigator profile
 */
async function viewInvestigatorProfile(investigatorId) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    try {
        const response = await api.get(`/station/investigators/${investigatorId}/profile`);
        
        if (response.status === 'success') {
            const profile = response.data;
            
            const profileHtml = `
                <div class="investigator-profile">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="width: 100px; height: 100px; border-radius: 50%; background: #e0e7ff; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                            <i class="fas fa-user-tie" style="font-size: 48px; color: #667eea;"></i>
                        </div>
                        <h3 style="margin: 10px 0 5px 0;">${profile.full_name}</h3>
                        <p style="color: #6b7280; margin: 0;">${t('badge')}: ${profile.badge_number || t('na')}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                        <div>
                            <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">${t('contact_information')}</h4>
                            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                                <div style="margin-bottom: 10px;">
                                    <i class="fas fa-envelope" style="color: #667eea; margin-right: 8px;"></i>
                                    <span>${profile.email || t('na')}</span>
                                </div>
                                <div>
                                    <i class="fas fa-phone" style="color: #667eea; margin-right: 8px;"></i>
                                    <span>${profile.phone || t('na')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">${t('performance_metrics')}</h4>
                            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                                <div style="margin-bottom: 10px;">
                                    <strong>${t('active_cases')}:</strong> ${profile.active_cases || 0}
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <strong>${t('completed_cases')}:</strong> ${profile.completed_cases || 0}
                                </div>
                                <div>
                                    <strong>${t('success_rate')}:</strong> ${profile.success_rate || 0}%
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">${t('department_information')}</h4>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                            <div style="margin-bottom: 10px;">
                                <strong>${t('police_center')}:</strong> ${profile.center_name || t('na')}
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>${t('rank')}:</strong> ${profile.rank || t('investigator')}
                            </div>
                            <div>
                                <strong>${t('join_date')}:</strong> ${profile.created_at ? new Date(profile.created_at).toLocaleDateString() : t('na')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                    .investigator-profile h4 {
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                </style>
            `;
            
            await Swal.fire({
                title: t('investigator') + ' ' + t('view_profile'),
                html: profileHtml,
                width: '700px',
                confirmButtonColor: '#3b82f6',
                confirmButtonText: t('close')
            });
        }
    } catch (error) {
        console.error('Error loading investigator profile:', error);
        showToast('error', t('failed_to_load_tracking_data'));
    }
}
