/**
 * Reports Management JavaScript
 * Handles all report generation, viewing, and management functionality
 */

const ReportsManager = {
    currentCaseId: null,
    currentReportType: null,
    reports: [],

    /**
     * Initialize reports manager
     */
    init: function(caseId) {
        this.currentCaseId = caseId;
        this.loadReports();
        this.setupEventListeners();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        // Generate report button
        $(document).on('click', '.btn-generate-report', (e) => {
            const reportType = $(e.currentTarget).data('report-type');
            this.showGenerateReportModal(reportType);
        });

        // Save report
        $(document).on('click', '#saveReportBtn', () => {
            this.saveReport();
        });

        // Preview report
        $(document).on('click', '#previewReportBtn', () => {
            this.previewReport();
        });

        // View report
        $(document).on('click', '.btn-view-report', (e) => {
            const reportId = $(e.currentTarget).data('report-id');
            this.viewReport(reportId);
        });

        // Download PDF
        $(document).on('click', '.btn-download-pdf', (e) => {
            const reportId = $(e.currentTarget).data('report-id');
            this.downloadPDF(reportId);
        });

        // Submit for approval
        $(document).on('click', '.btn-submit-approval', (e) => {
            const reportId = $(e.currentTarget).data('report-id');
            this.submitForApproval(reportId);
        });

        // Sign report
        $(document).on('click', '.btn-sign-report', (e) => {
            const reportId = $(e.currentTarget).data('report-id');
            this.signReport(reportId);
        });

        // Approve/Reject (for commanders)
        $(document).on('click', '.btn-approve-report', (e) => {
            const reportId = $(e.currentTarget).data('report-id');
            this.approveReport(reportId);
        });

        $(document).on('click', '.btn-reject-report', (e) => {
            const reportId = $(e.currentTarget).data('report-id');
            this.rejectReport(reportId);
        });
    },

    /**
     * Load all reports for case
     */
    loadReports: function() {
        console.log('Loading reports for case:', this.currentCaseId);
        $.ajax({
            url: `${BASE_URL}/api/investigation/reports/${this.currentCaseId}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            success: (response) => {
                console.log('Reports loaded:', response);
                if (response.status === 'success') {
                    this.reports = response.data;
                    this.displayReports();
                    this.updateStatistics();
                } else {
                    console.error('Unexpected response:', response);
                    showToast('Unexpected response from server', 'error');
                }
            },
            error: (xhr) => {
                console.error('Failed to load reports:', xhr);
                console.error('Response:', xhr.responseJSON);
                showToast('Failed to load reports: ' + (xhr.responseJSON?.message || xhr.statusText), 'error');
            }
        });
    },

    /**
     * Display reports list
     */
    displayReports: function() {
        console.log('Displaying reports:', this.reports);
        const container = $('#reportsListContainer');
        
        if (!this.reports || this.reports.length === 0) {
            container.html('<div class="alert alert-info"><i class="fas fa-info-circle"></i> No reports generated yet. Click on a report type above to create your first report.</div>');
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-hover">';
        html += '<thead><tr>';
        html += '<th>Report Type</th>';
        html += '<th>Title</th>';
        html += '<th>Created</th>';
        html += '<th>Status</th>';
        html += '<th>Actions</th>';
        html += '</tr></thead><tbody>';

        this.reports.forEach(report => {
            html += '<tr>';
            html += `<td><span class="badge bg-info">${this.formatReportType(report.report_type)}</span></td>`;
            html += `<td>${report.report_title}</td>`;
            html += `<td>${this.formatDateTime(report.created_at)}</td>`;
            html += `<td>${this.getStatusBadge(report)}</td>`;
            html += `<td>${this.getActionButtons(report)}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.html(html);
    },

    /**
     * Update statistics cards
     */
    updateStatistics: function() {
        const total = this.reports.length;
        const drafts = this.reports.filter(r => r.approval_status === 'draft').length;
        const approved = this.reports.filter(r => r.approval_status === 'approved').length;
        const signed = this.reports.filter(r => r.is_signed == 1).length;

        $('#totalReportsCount').text(total);
        $('#draftReportsCount').text(drafts);
        $('#approvedReportsCount').text(approved);
        $('#signedReportsCount').text(signed);
    },

    /**
     * Show generate report modal
     */
    showGenerateReportModal: function(reportType) {
        console.log('🚀 [Step 4] showGenerateReportModal called');
        console.log('📝 Report Type:', reportType);
        console.log('📁 Current Case ID:', this.currentCaseId);
        
        this.currentReportType = reportType;
        console.log('✅ Set currentReportType to:', this.currentReportType);
        
        // Show loading toast or console log
        console.log('⏳ Showing loading message...');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Generating report template...',
                text: 'Please wait',
                icon: 'info',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            console.log('Generating report template...');
        }

        // Call API to generate report template
        const apiUrl = `${BASE_URL}/api/investigation/reports/generate/${reportType}/${this.currentCaseId}`;
        console.log('🌐 [Step 5] Calling API:', apiUrl);
        console.log('🔑 Auth Token:', getToken() ? 'Present' : 'MISSING!');
        console.log('📤 Request Headers:', { 'Authorization': 'Bearer ' + getToken() });
        
        $.ajax({
            url: apiUrl,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            success: (response) => {
                console.log('✅ [Step 6] API Success!');
                console.log('📥 Response Status:', response.status);
                console.log('📊 Response Data:', response);
                
                if (response.status === 'success') {
                    console.log('✅ Status is success, proceeding...');
                    console.log('📄 Report Data Keys:', Object.keys(response.data));
                    console.log('📝 Content Length:', response.data.content?.length || 0);
                    console.log('🎯 [Step 7] Calling showReportEditor...');
                    
                    this.showReportEditor(response.data);
                } else {
                    console.error('❌ API returned non-success status:', response);
                    Swal.fire('Error', 'Unexpected response from server', 'error');
                }
            },
            error: (xhr) => {
                console.error('❌ [ERROR] API Call Failed!');
                console.error('Status Code:', xhr.status);
                console.error('Status Text:', xhr.statusText);
                console.error('Response JSON:', xhr.responseJSON);
                console.error('Full XHR Object:', xhr);
                
                const error = xhr.responseJSON?.message || 'Failed to generate report template';
                if (typeof Swal !== 'undefined') {
                    Swal.fire('Error', error, 'error');
                } else {
                    alert(error);
                }
            }
        });
    },

    /**
     * Show report editor modal
     */
    showReportEditor: function(data) {
        console.log('🎨 [Step 8] showReportEditor called');
        console.log('📦 Data received:', data);
        console.log('📦 Data keys:', Object.keys(data));
        
        // Check if modal exists, if not, create it
        console.log('🔍 [Step 9] Checking if modal exists in DOM...');
        const modalCount = $('#reportEditorModal').length;
        console.log('Modal count:', modalCount);
        
        if (modalCount === 0) {
            console.error('❌ Modal not found in DOM!');
            console.log('DOM Check - #reportEditorModal selector returned 0 elements');
            Swal.fire('Error', 'Report editor modal not found. Please refresh the page.', 'error');
            return;
        }
        
        console.log('✅ Modal found in DOM!');
        
        const modal = $('#reportEditorModal');
        console.log('Modal jQuery object:', modal);
        console.log('Modal is hidden?', modal.is(':hidden'));
        
        console.log('🏷️ [Step 10] Setting report title...');
        const formattedType = this.formatReportType(this.currentReportType);
        console.log('Formatted type:', formattedType);
        $('#reportTypeTitle').text(formattedType);
        console.log('Title element text now:', $('#reportTypeTitle').text());
        
        console.log('📝 [Step 11] Populating form fields...');
        const reportTitle = data.metadata?.title || `${formattedType} - Case ${data.case.case_number}`;
        console.log('Report Title:', reportTitle);
        $('#reportTitle').val(reportTitle);
        console.log('Title input value now:', $('#reportTitle').val());
        
        console.log('📄 [Step 12] Setting report content...');
        console.log('Content length:', data.content?.length || 0);
        console.log('Content preview (first 100 chars):', data.content?.substring(0, 100));
        $('#reportContent').val(data.content);
        console.log('Content textarea value length:', $('#reportContent').val().length);
        
        console.log('⚙️ [Step 13] Adding metadata fields...');
        this.addMetadataFields(data);
        console.log('Metadata fields container HTML:', $('#reportMetadataFields').html());
        
        console.log('🎭 [Step 14] Opening modal...');
        console.log('Current modal display:', modal.css('display'));
        console.log('Current modal visibility:', modal.css('visibility'));
        
        // Remove any existing backdrops first
        console.log('Removing existing backdrops...');
        $('.modal-backdrop').remove();
        
        console.log('Setting modal styles with !important...');
        
        // Force modal to display
        modal.css({
            'display': 'block',
            'opacity': '1',
            'visibility': 'visible',
            'pointer-events': 'auto'
        });
        console.log('✅ Display set to block with styles');
        
        modal.addClass('show');
        console.log('✅ Added show class');
        
        // Add backdrop
        $('body').append('<div class="modal-backdrop fade show" style="display: block !important;"></div>');
        console.log('✅ Added backdrop');
        
        // Ensure body doesn't scroll
        $('body').css('overflow', 'hidden');
        console.log('✅ Set body overflow to hidden');
        
        console.log('🎉 [Step 15] Modal opening complete!');
        console.log('Final modal display:', modal.css('display'));
        console.log('Final modal visibility:', modal.css('visibility'));
        console.log('Final modal classes:', modal.attr('class'));
        console.log('Is modal visible?', modal.is(':visible'));
        
        // Check if modal is actually visible after 500ms
        setTimeout(() => {
            console.log('⏱️ [Check after 500ms] Is modal visible?', $('#reportEditorModal').is(':visible'));
            console.log('Modal display:', $('#reportEditorModal').css('display'));
            console.log('Modal height:', $('#reportEditorModal').height());
            console.log('Modal width:', $('#reportEditorModal').width());
        }, 500);
    },

    /**
     * Add metadata fields based on report type
     */
    addMetadataFields: function(data) {
        const container = $('#reportMetadataFields');
        container.empty();

        switch(this.currentReportType) {
            case 'preliminary':
                container.html(`
                    <div class="mb-3">
                        <label class="form-label">Priority Assessment</label>
                        <select class="form-select" id="priorityAssessment">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                `);
                break;
                
            case 'interim':
                container.html(`
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Period From</label>
                            <input type="date" class="form-control" id="periodFrom">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Period To</label>
                            <input type="date" class="form-control" id="periodTo" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                `);
                break;
                
            case 'final':
                container.html(`
                    <div class="mb-3">
                        <label class="form-label">Case Strength</label>
                        <select class="form-select" id="caseStrength">
                            <option value="weak">Weak</option>
                            <option value="moderate">Moderate</option>
                            <option value="strong" selected>Strong</option>
                            <option value="conclusive">Conclusive</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Recommended Action</label>
                        <select class="form-select" id="recommendedAction">
                            <option value="prosecute" selected>Prosecute</option>
                            <option value="dismiss">Dismiss</option>
                            <option value="further_investigation">Further Investigation</option>
                        </select>
                    </div>
                `);
                break;
                
            case 'court_submission':
                container.html(`
                    <div class="mb-3">
                        <label class="form-label">Court Reference Number</label>
                        <input type="text" class="form-control" id="courtReference" placeholder="Will be assigned by court">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Charges Preferred</label>
                        <textarea class="form-control" id="chargesPreferred" rows="3" placeholder="List charges with criminal code sections"></textarea>
                    </div>
                `);
                break;
        }
    },

    /**
     * Save report
     */
    saveReport: function() {
        const title = $('#reportTitle').val();
        const content = $('#reportContent').val();

        if (!title || !content) {
            if (typeof Swal !== 'undefined') {
                Swal.fire('Warning', 'Please fill in all required fields', 'warning');
            } else {
                alert('Please fill in all required fields');
            }
            return;
        }

        // Collect metadata
        const metadata = this.collectMetadata();

        const reportData = {
            case_id: this.currentCaseId,
            report_type: this.currentReportType,
            report_title: title,
            report_content: content,
            ...metadata
        };

        $.ajax({
            url: `${BASE_URL}/api/investigation/reports/save`,
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + getToken(),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(reportData),
            success: (response) => {
                if (response.status === 'success') {
                    if (typeof Swal !== 'undefined') {
                        Swal.fire('Success', 'Report saved successfully', 'success');
                    } else {
                        alert('Report saved successfully');
                    }
                    $('#reportEditorModal').modal('hide');
                    this.loadReports();
                }
            },
            error: (xhr) => {
                const error = xhr.responseJSON?.message || 'Failed to save report';
                if (typeof Swal !== 'undefined') {
                    Swal.fire('Error', error, 'error');
                } else {
                    alert(error);
                }
            }
        });
    },

    /**
     * Collect metadata from form
     */
    collectMetadata: function() {
        const metadata = {};

        switch(this.currentReportType) {
            case 'preliminary':
                metadata.metadata = {
                    priority_assessment: $('#priorityAssessment').val()
                };
                break;
                
            case 'interim':
                metadata.period_covered_from = $('#periodFrom').val();
                metadata.period_covered_to = $('#periodTo').val();
                break;
                
            case 'final':
                metadata.case_strength = $('#caseStrength').val();
                metadata.recommended_action = $('#recommendedAction').val();
                break;
                
            case 'court_submission':
                metadata.court_reference_number = $('#courtReference').val();
                metadata.metadata = {
                    charges_preferred: $('#chargesPreferred').val()
                };
                break;
        }

        return metadata;
    },

    /**
     * Preview report
     */
    previewReport: function() {
        const title = $('#reportTitle').val();
        const content = $('#reportContent').val();
        const metadata = this.collectMetadata();

        if (!content) {
            showToast('Report content is required', 'warning');
            return;
        }

        // Open preview in new window
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write('<html><head><title>Report Preview</title></head><body><h3>Loading preview...</h3></body></html>');

        $.ajax({
            url: `${BASE_URL}/api/investigation/reports/pdf/preview-data`,
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + getToken(),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                case_id: this.currentCaseId,
                report_type: this.currentReportType,
                content: content,
                metadata: { title, ...metadata }
            }),
            success: (html) => {
                previewWindow.document.open();
                previewWindow.document.write(html);
                previewWindow.document.close();
            },
            error: (xhr) => {
                previewWindow.close();
                showToast('Failed to generate preview', 'error');
            }
        });
    },

    /**
     * View report
     */
    viewReport: function(reportId) {
        window.open(`${BASE_URL}/api/investigation/reports/pdf/preview/${reportId}`, '_blank');
    },

    /**
     * Download PDF
     */
    downloadPDF: function(reportId) {
        window.location.href = `${BASE_URL}/api/investigation/reports/pdf/download/${reportId}?token=${getToken()}`;
    },

    /**
     * Submit for approval
     */
    submitForApproval: function(reportId) {
        Swal.fire({
            title: 'Submit Report for Approval?',
            text: 'Once submitted, you cannot edit the report until it is approved or rejected.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Submit',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/api/investigation/reports/${reportId}/submit-approval`,
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + getToken() },
                    success: (response) => {
                        showToast('Report submitted for approval', 'success');
                        this.loadReports();
                    },
                    error: (xhr) => {
                        showToast('Failed to submit report', 'error');
                    }
                });
            }
        });
    },

    /**
     * Sign report
     */
    signReport: function(reportId) {
        Swal.fire({
            title: 'Digitally Sign Report?',
            text: 'This will permanently sign the report with your digital signature.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Sign Report',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/api/investigation/reports/${reportId}/sign`,
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + getToken() },
                    success: (response) => {
                        showToast('Report signed successfully', 'success');
                        this.loadReports();
                    },
                    error: (xhr) => {
                        showToast('Failed to sign report', 'error');
                    }
                });
            }
        });
    },

    /**
     * Approve report (for commanders)
     */
    approveReport: function(reportId) {
        Swal.fire({
            title: 'Approve Report?',
            input: 'textarea',
            inputLabel: 'Comments (optional)',
            inputPlaceholder: 'Enter approval comments...',
            showCancelButton: true,
            confirmButtonText: 'Approve',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/api/investigation/reports/approvals/${reportId}/approve`,
                    method: 'POST',
                    headers: { 
                        'Authorization': 'Bearer ' + getToken(),
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({ comments: result.value }),
                    success: (response) => {
                        showToast('Report approved successfully', 'success');
                        this.loadReports();
                    },
                    error: (xhr) => {
                        showToast('Failed to approve report', 'error');
                    }
                });
            }
        });
    },

    /**
     * Reject report (for commanders)
     */
    rejectReport: function(reportId) {
        Swal.fire({
            title: 'Reject Report?',
            input: 'textarea',
            inputLabel: 'Rejection Reason (required)',
            inputPlaceholder: 'Enter reason for rejection...',
            inputValidator: (value) => {
                if (!value) {
                    return 'You must provide a reason for rejection';
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${BASE_URL}/api/investigation/reports/approvals/${reportId}/reject`,
                    method: 'POST',
                    headers: { 
                        'Authorization': 'Bearer ' + getToken(),
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({ comments: result.value }),
                    success: (response) => {
                        showToast('Report rejected', 'success');
                        this.loadReports();
                    },
                    error: (xhr) => {
                        showToast('Failed to reject report', 'error');
                    }
                });
            }
        });
    },

    /**
     * Format report type for display
     */
    formatReportType: function(type) {
        const types = {
            'preliminary': 'Preliminary Investigation Report (PIR)',
            'interim': 'Interim Progress Report',
            'final': 'Final Investigation Report (FIR)',
            'court_submission': 'Court Submission Docket',
            'exhibit_list': 'Evidence Presentation Report',
            'supplementary': 'Supplementary Investigation Report',
            'case_closure': 'Case Closure Report',
            'evidence_analysis': 'Evidence Analysis Report',
            'witness_compilation': 'Witness Statement Compilation',
            'prosecution_summary': 'Case Summary for Prosecution',
            'court_status': 'Court Status Report'
        };
        return types[type] || type.replace('_', ' ').toUpperCase();
    },

    /**
     * Get status badge HTML
     */
    getStatusBadge: function(report) {
        const status = report.approval_status || 'draft';
        const badges = {
            'draft': '<span class="badge bg-secondary">Draft</span>',
            'pending_approval': '<span class="badge bg-warning">Pending Approval</span>',
            'approved': '<span class="badge bg-success">Approved</span>',
            'rejected': '<span class="badge bg-danger">Rejected</span>'
        };
        
        let html = badges[status] || status;
        
        if (report.is_signed) {
            html += ' <span class="badge bg-primary"><i class="fas fa-signature"></i> Signed</span>';
        }
        
        return html;
    },

    /**
     * Get action buttons HTML
     */
    getActionButtons: function(report) {
        let html = '<div class="btn-group btn-group-sm">';
        
        // View button
        html += `<button class="btn btn-info btn-view-report" data-report-id="${report.id}" title="View Report">
                    <i class="fas fa-eye"></i>
                 </button>`;
        
        // Download PDF button
        html += `<button class="btn btn-primary btn-download-pdf" data-report-id="${report.id}" title="Download PDF">
                    <i class="fas fa-download"></i>
                 </button>`;
        
        // Edit button (only for drafts)
        if (report.approval_status === 'draft') {
            html += `<button class="btn btn-warning btn-edit-report" data-report-id="${report.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                     </button>`;
        }
        
        // Submit for approval (only for drafts)
        if (report.approval_status === 'draft' && !report.is_signed) {
            html += `<button class="btn btn-success btn-submit-approval" data-report-id="${report.id}" title="Submit for Approval">
                        <i class="fas fa-paper-plane"></i>
                     </button>`;
        }
        
        // Sign button (final reports that are approved)
        if (report.report_type === 'final' && report.approval_status === 'approved' && !report.is_signed) {
            html += `<button class="btn btn-primary btn-sign-report" data-report-id="${report.id}" title="Sign Report">
                        <i class="fas fa-signature"></i>
                     </button>`;
        }
        
        // Approve/Reject buttons (for commanders, pending reports)
        const userRole = localStorage.getItem('userRole');
        if ((userRole === 'admin' || userRole === 'super_admin') && report.approval_status === 'pending_approval') {
            html += `<button class="btn btn-success btn-approve-report" data-report-id="${report.id}" title="Approve">
                        <i class="fas fa-check"></i>
                     </button>`;
            html += `<button class="btn btn-danger btn-reject-report" data-report-id="${report.id}" title="Reject">
                        <i class="fas fa-times"></i>
                     </button>`;
        }
        
        html += '</div>';
        return html;
    },

    /**
     * Format date time
     */
    formatDateTime: function(datetime) {
        if (!datetime) return 'N/A';
        const date = new Date(datetime);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Helper function to get auth token
function getToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}
