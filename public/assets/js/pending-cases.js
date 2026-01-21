// ============================================
// Pending Cases Page with DataTable
// ============================================

let pendingCasesTable = null;

/**
 * Load Pending Cases Page
 */
async function loadPendingCasesPage() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    $('#pageTitle').text(t('pending_approval'));
    const content = $('#pageContent');
    
    content.html(`
        <div class="page-header">
            <h2><i class="fas fa-clock"></i> <span data-i18n="pending_approval">${t('pending_approval')}</span></h2>
            <p data-i18n="pending_cases_desc">${t('pending_cases_desc') || 'Review and approve cases submitted by OB officers'}</p>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 data-i18n="cases_awaiting_approval">${t('cases_awaiting_approval') || 'Cases Awaiting Approval'}</h3>
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="refreshPendingCases()">
                        <i class="fas fa-sync-alt"></i> <span data-i18n="refresh">${t('refresh') || 'Refresh'}</span>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table id="pendingCasesTable" class="display" style="width:100%">
                        <thead>
                            <tr>
                                <th data-i18n="case_number">${t('case_number') || 'Case Number'}</th>
                                <th data-i18n="ob_number">${t('ob_number') || 'OB Number'}</th>
                                <th data-i18n="crime_type">${t('crime_type') || 'Crime Type'}</th>
                                <th data-i18n="category">${t('category') || 'Category'}</th>
                                <th data-i18n="priority">${t('priority') || 'Priority'}</th>
                                <th data-i18n="submitted_by">${t('submitted_by') || 'Submitted By'}</th>
                                <th data-i18n="submitted_at">${t('submitted_at') || 'Submitted At'}</th>
                                <th data-i18n="status">${t('status') || 'Status'}</th>
                                <th data-i18n="actions">${t('actions') || 'Actions'}</th>
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
    
    // Load pending cases data
    await loadPendingCasesData();
}

/**
 * Load and initialize DataTable with pending cases
 */
async function loadPendingCasesData() {
    try {
        const response = await api.get('/station/cases/pending');
        
        if (response.status === 'success') {
            const cases = response.data || [];
            
            // Destroy existing DataTable if it exists
            if (pendingCasesTable) {
                pendingCasesTable.destroy();
            }
            
            // Initialize DataTable
            pendingCasesTable = $('#pendingCasesTable').DataTable({
                data: cases,
                order: [[6, 'desc']], // Order by submitted_at (column index 6) descending
                pageLength: 25,
                responsive: true,
                columns: [
                    { 
                        data: 'case_number',
                        render: function(data) {
                            return `<strong>${data || 'N/A'}</strong>`;
                        }
                    },
                    { 
                        data: 'ob_number',
                        render: function(data) {
                            return data || 'N/A';
                        }
                    },
                    { 
                        data: 'crime_type',
                        render: function(data) {
                            return data || 'N/A';
                        }
                    },
                    { 
                        data: 'crime_category',
                        render: function(data) {
                            return `<span class="badge badge-${getCategoryColor(data)}">${data || 'N/A'}</span>`;
                        }
                    },
                    { 
                        data: 'priority',
                        render: function(data) {
                            return getPriorityBadge(data || 'medium');
                        }
                    },
                    { 
                        data: null,
                        render: function(data) {
                            return data.created_by_name || 'Unknown';
                        }
                    },
                    { 
                        data: 'submitted_at',
                        render: function(data) {
                            if (!data) return 'N/A';
                            const date = new Date(data);
                            return `
                                <div>
                                    <div>${date.toLocaleDateString()}</div>
                                    <div style="font-size: 0.85em; color: #666;">${date.toLocaleTimeString()}</div>
                                </div>
                            `;
                        }
                    },
                    { 
                        data: 'status',
                        render: function(data) {
                            return getStatusBadge(data || 'submitted');
                        }
                    },
                    { 
                        data: null,
                        orderable: false,
                        render: function(data, type, row) {
                            return `
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-primary" onclick="viewCaseDetails(${row.id})" title="View Details">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-success" onclick="approvePendingCase(${row.id})" title="Approve">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn btn-sm btn-warning" onclick="returnPendingCase(${row.id})" title="Return">
                                        <i class="fas fa-undo"></i>
                                    </button>
                                </div>
                            `;
                        }
                    }
                ],
                language: {
                    search: "_INPUT_",
                    searchPlaceholder: "Search cases...",
                    lengthMenu: "Show _MENU_ cases",
                    info: "Showing _START_ to _END_ of _TOTAL_ cases",
                    infoEmpty: "No cases to display",
                    infoFiltered: "(filtered from _MAX_ total cases)",
                    zeroRecords: "No matching cases found",
                    emptyTable: "No pending cases at the moment"
                }
            });
            
            // Apply translations if available
            if (typeof applyTranslations === 'function') {
                applyTranslations();
            }
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.message || 'Failed to load pending cases',
                confirmButtonColor: '#ef4444'
            });
        }
    } catch (error) {
        console.error('Error loading pending cases:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load pending cases. Please refresh the page.',
            confirmButtonColor: '#ef4444'
        });
    }
}

/**
 * Refresh pending cases data
 */
async function refreshPendingCases() {
    await loadPendingCasesData();
    await Swal.fire({
        icon: 'success',
        title: 'Refreshed!',
        text: 'Cases list has been updated',
        confirmButtonColor: '#10b981',
        timer: 1500,
        showConfirmButton: false
    });
}

/**
 * Approve a pending case
 */
async function approvePendingCase(caseId) {
    const result = await Swal.fire({
        title: 'Approve Case?',
        text: 'This case will be approved and ready for assignment',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await api.post(`/station/cases/${caseId}/approve`);
            
            if (response.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Case Approved!',
                    text: response.message || 'Case has been approved successfully',
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: true
                });
                await loadPendingCasesData(); // Refresh the table
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.message || 'Failed to approve case',
                    confirmButtonColor: '#ef4444'
                });
            }
        } catch (error) {
            console.error('Error approving case:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to approve case. Please try again.',
                confirmButtonColor: '#ef4444'
            });
        }
    }
}

/**
 * Return a pending case
 */
async function returnPendingCase(caseId) {
    const { value: reason } = await Swal.fire({
        title: 'Return Case?',
        text: 'Please provide a reason for returning this case',
        input: 'textarea',
        inputPlaceholder: 'Enter reason...',
        inputAttributes: {
            'aria-label': 'Enter reason for returning case'
        },
        showCancelButton: true,
        confirmButtonText: 'Return Case',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280',
        inputValidator: (value) => {
            if (!value) {
                return 'Please provide a reason';
            }
        }
    });
    
    if (reason) {
        try {
            const response = await api.post(`/station/cases/${caseId}/return`, { reason });
            
            if (response.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Case Returned!',
                    text: response.message || 'Case has been returned successfully',
                    confirmButtonColor: '#f59e0b',
                    timer: 2000,
                    showConfirmButton: true
                });
                await loadPendingCasesData(); // Refresh the table
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.message || 'Failed to return case',
                    confirmButtonColor: '#ef4444'
                });
            }
        } catch (error) {
            console.error('Error returning case:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to return case. Please try again.',
                confirmButtonColor: '#ef4444'
            });
        }
    }
}

/**
 * Get category color for badge
 */
function getCategoryColor(category) {
    const colors = {
        'violent': 'danger',
        'property': 'warning',
        'drug': 'info',
        'cybercrime': 'primary',
        'sexual': 'danger',
        'juvenile': 'secondary',
        'other': 'secondary'
    };
    return colors[category] || 'secondary';
}
