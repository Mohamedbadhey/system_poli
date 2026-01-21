/**
 * Case Reports Page for Investigators
 * Integrated into the main dashboard
 */

// Get BASE_URL
const BASE_URL = window.location.origin;

// Load Reports Page
async function loadReportsPage() {
    $('#pageTitle').text('Case Reports');
    const content = $('#pageContent');
    content.html('<div class="loading">Loading reports...</div>');
    
    try {
        // Load the reports management interface
        content.html(renderReportsPage());
        
        // Load user's cases for selection
        loadInvestigatorCases();
        
    } catch (error) {
        console.error('Failed to load reports page:', error);
        content.html('<div class="alert alert-error">Failed to load reports page</div>');
    }
}

function renderReportsPage() {
    return `
        <div class="reports-page-container">
            <!-- Header -->
            <div class="reports-header">
                <h1><i class="fas fa-file-alt"></i> Case Reports</h1>
                <p>Generate professional investigation reports for your cases</p>
            </div>
            
            <!-- Case Selection -->
            <div class="case-selection-card">
                <h3><i class="fas fa-folder-open"></i> Select a Case</h3>
                <p>Choose a case to view and generate reports</p>
                <select id="caseSelector" class="form-select">
                    <option value="">-- Select a case --</option>
                </select>
            </div>
            
            <!-- Reports Content (Hidden until case selected) -->
            <div id="reportsContent" style="display: none;">
                
                <!-- Selected Case Info -->
                <div class="selected-case-info" id="selectedCaseCard"></div>
                
                <!-- Statistics -->
                <div class="reports-stats" id="reportsStats">
                    <div class="stat-box">
                        <div class="stat-number" id="totalReportsCount">0</div>
                        <div class="stat-label">Total Reports</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" id="draftReportsCount">0</div>
                        <div class="stat-label">Drafts</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" id="approvedReportsCount">0</div>
                        <div class="stat-label">Approved</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" id="signedReportsCount">0</div>
                        <div class="stat-label">Signed</div>
                    </div>
                </div>
                
                <!-- Navigation Tabs -->
                <div class="reports-tabs">
                    <button class="tab-btn active" data-tab="generate">
                        <i class="fas fa-plus-circle"></i> Generate Reports
                    </button>
                    <button class="tab-btn" data-tab="existing">
                        <i class="fas fa-list"></i> Existing Reports
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Generate Reports Tab -->
                    <div id="generateTab" class="tab-pane active">
                        ${renderReportTypesGrid()}
                    </div>
                    
                    <!-- Existing Reports Tab -->
                    <div id="existingTab" class="tab-pane">
                        <div id="reportsListContainer"></div>
                    </div>
                </div>
            </div>
        </div>
        
        ${renderReportsPageStyles()}
        ${renderReportEditorModal()}
    `;
}

function renderReportEditorModal() {
    return `
        <!-- Report Editor Modal -->
        <div class="modal fade" id="reportEditorModal" tabindex="-1" style="display: none;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-edit"></i> <span id="reportTypeTitle">Generate Report</span>
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="reportForm">
                            <div class="mb-3">
                                <label for="reportTitle" class="form-label">Report Title</label>
                                <input type="text" class="form-control" id="reportTitle" required>
                            </div>
                            
                            <!-- Dynamic metadata fields will be inserted here -->
                            <div id="reportMetadataFields"></div>
                            
                            <div class="mb-3">
                                <label for="reportContent" class="form-label">Report Content</label>
                                <textarea class="form-control" id="reportContent" rows="20" required style="font-family: 'Courier New', monospace;"></textarea>
                                <small class="text-muted">
                                    Edit the template content as needed. Use standard report format.
                                </small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeReportModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="button" class="btn btn-info" id="previewReportBtn">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button type="button" class="btn btn-primary" id="saveReportBtn">
                            <i class="fas fa-save"></i> Save Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .modal { 
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 9999 !important;
                width: 100% !important;
                height: 100% !important;
                overflow-x: hidden !important;
                overflow-y: auto !important;
                outline: 0 !important;
            }
            .modal.show {
                display: block !important;
            }
            .modal-backdrop { 
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 9998 !important;
                width: 100vw !important;
                height: 100vh !important;
                background-color: rgba(0, 0, 0, 0.5) !important;
            }
            .modal-xl { 
                max-width: 1200px;
                margin: 1.75rem auto;
            }
            .modal-dialog { 
                position: relative !important;
                width: auto !important;
                margin: 0.5rem !important;
                pointer-events: none !important;
            }
            .modal-content { 
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                width: 100% !important;
                pointer-events: auto !important;
                background-color: #fff !important;
                background-clip: padding-box !important;
                border: 1px solid rgba(0,0,0,.2) !important;
                border-radius: 12px !important;
                outline: 0 !important;
            }
            .modal-header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px 12px 0 0;
                padding: 1rem;
                border-bottom: 1px solid #dee2e6;
            }
            .modal-body {
                position: relative;
                flex: 1 1 auto;
                padding: 1rem;
            }
            .modal-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding: 0.75rem;
                border-top: 1px solid #dee2e6;
                border-bottom-right-radius: 12px;
                border-bottom-left-radius: 12px;
            }
            .modal-header .btn-close { 
                padding: 0.5rem;
                margin: -0.5rem -0.5rem -0.5rem auto;
                background: transparent;
                border: 0;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }
            .form-label { 
                font-weight: 600;
                color: #374151;
                margin-bottom: 0.5rem;
            }
            .form-control {
                display: block;
                width: 100%;
                padding: 0.375rem 0.75rem;
                font-size: 1rem;
                line-height: 1.5;
                color: #212529;
                background-color: #fff;
                background-clip: padding-box;
                border: 1px solid #ced4da;
                border-radius: 0.25rem;
            }
            .form-control:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                outline: 0;
            }
            #reportContent {
                min-height: 400px;
                font-size: 13px;
                line-height: 1.6;
            }
            .btn {
                display: inline-block;
                padding: 0.375rem 0.75rem;
                font-size: 1rem;
                line-height: 1.5;
                border-radius: 0.25rem;
                border: 1px solid transparent;
                cursor: pointer;
            }
            .btn-primary {
                background-color: #667eea;
                border-color: #667eea;
                color: white;
            }
            .btn-secondary {
                background-color: #6c757d;
                border-color: #6c757d;
                color: white;
            }
            .btn-info {
                background-color: #0dcaf0;
                border-color: #0dcaf0;
                color: white;
            }
        </style>
    `;
}

function renderReportTypesGrid() {
    return `
        <div class="report-types-grid">
            <!-- Investigation Phase -->
            <div class="report-section">
                <h3 class="section-title"><i class="fas fa-search"></i> Investigation Phase</h3>
                <div class="report-cards">
                    <div class="report-card" data-type="preliminary">
                        <div class="report-icon"><i class="fas fa-clipboard-list"></i></div>
                        <h4>Preliminary Report (PIR)</h4>
                        <p>Initial 24-48 hour assessment</p>
                        <button class="btn-generate" onclick="generateReport('preliminary')">
                            <i class="fas fa-plus"></i> Generate
                        </button>
                    </div>
                    
                    <div class="report-card" data-type="interim">
                        <div class="report-icon"><i class="fas fa-tasks"></i></div>
                        <h4>Interim Progress Report</h4>
                        <p>Weekly/bi-weekly updates</p>
                        <button class="btn-generate" onclick="generateReport('interim')">
                            <i class="fas fa-plus"></i> Generate
                        </button>
                    </div>
                    
                    <div class="report-card" data-type="final">
                        <div class="report-icon"><i class="fas fa-flag-checkered"></i></div>
                        <h4>Final Report (FIR)</h4>
                        <p>Complete investigation conclusion</p>
                        <button class="btn-generate" onclick="generateReport('final')">
                            <i class="fas fa-plus"></i> Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Court Phase -->
            <div class="report-section">
                <h3 class="section-title"><i class="fas fa-gavel"></i> Court Phase</h3>
                <div class="report-cards">
                    <div class="report-card" data-type="court_submission">
                        <div class="report-icon"><i class="fas fa-file-signature"></i></div>
                        <h4>Court Submission Docket</h4>
                        <p>Formal charge sheet</p>
                        <button class="btn-generate" onclick="generateReport('court_submission')">
                            <i class="fas fa-plus"></i> Generate
                        </button>
                    </div>
                    
                    <div class="report-card" data-type="exhibit_list">
                        <div class="report-icon"><i class="fas fa-box"></i></div>
                        <h4>Evidence Presentation</h4>
                        <p>Exhibit list with chain of custody</p>
                        <button class="btn-generate" onclick="generateReport('exhibit_list')">
                            <i class="fas fa-plus"></i> Generate
                        </button>
                    </div>
                    
                    <div class="report-card" data-type="supplementary">
                        <div class="report-icon"><i class="fas fa-plus-square"></i></div>
                        <h4>Supplementary Report</h4>
                        <p>Additional investigation</p>
                        <button class="btn-generate" onclick="generateReport('supplementary')">
                            <i class="fas fa-plus"></i> Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Closure -->
            <div class="report-section">
                <h3 class="section-title"><i class="fas fa-archive"></i> Case Closure</h3>
                <div class="report-cards">
                    <div class="report-card" data-type="case_closure">
                        <div class="report-icon"><i class="fas fa-door-closed"></i></div>
                        <h4>Case Closure Report</h4>
                        <p>Final documentation</p>
                        <button class="btn-generate" onclick="generateReport('case_closure')">
                            <i class="fas fa-plus"></i> Generate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderReportsPageStyles() {
    return `
        <style>
            .reports-page-container { max-width: 1400px; margin: 0 auto; padding: 20px; }
            
            .reports-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .reports-header h1 { margin: 0 0 10px 0; font-size: 32px; }
            .reports-header p { margin: 0; opacity: 0.9; }
            
            .case-selection-card {
                background: white;
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .case-selection-card h3 { margin: 0 0 10px 0; font-size: 20px; }
            .case-selection-card p { margin: 0 0 15px 0; color: #6b7280; }
            
            .form-select {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.2s;
            }
            
            .form-select:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .selected-case-info {
                background: white;
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .reports-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .stat-box {
                background: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .stat-number {
                font-size: 36px;
                font-weight: 700;
                color: #667eea;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 14px;
                color: #6b7280;
            }
            
            .reports-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .tab-btn {
                padding: 12px 24px;
                background: none;
                border: none;
                border-bottom: 3px solid transparent;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                color: #6b7280;
                transition: all 0.2s;
            }
            
            .tab-btn.active {
                color: #667eea;
                border-bottom-color: #667eea;
            }
            
            .tab-btn:hover { color: #667eea; }
            
            .tab-pane { display: none; }
            .tab-pane.active { display: block; }
            
            .report-section {
                background: white;
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 25px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .section-title {
                margin: 0 0 20px 0;
                font-size: 20px;
                color: #111827;
                display: flex;
                align-items: center;
                gap: 10px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .report-cards {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
            }
            
            .report-card {
                background: #f9fafb;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                transition: transform 0.2s, box-shadow 0.2s;
                border: 2px solid transparent;
            }
            
            .report-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                border-color: #667eea;
            }
            
            .report-icon {
                font-size: 48px;
                color: #667eea;
                margin-bottom: 15px;
            }
            
            .report-card h4 {
                margin: 0 0 10px 0;
                font-size: 18px;
                color: #111827;
            }
            
            .report-card p {
                margin: 0 0 15px 0;
                font-size: 14px;
                color: #6b7280;
            }
            
            .btn-generate {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .btn-generate:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
            }
        </style>
    `;
}

// Load investigator's cases
async function loadInvestigatorCases() {
    try {
        const response = await $.ajax({
            url: `${BASE_URL}/investigation/cases`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        
        if (response.status === 'success') {
            const cases = response.data;
            const selector = $('#caseSelector');
            selector.empty();
            selector.append('<option value="">-- Select a case --</option>');
            
            cases.forEach(c => {
                selector.append(`<option value="${c.id}">${c.case_number} - ${c.crime_type}</option>`);
            });
            
            // Handle case selection
            selector.on('change', function() {
                const caseId = $(this).val();
                if (caseId) {
                    loadCaseReports(caseId);
                } else {
                    $('#reportsContent').hide();
                }
            });
        }
    } catch (error) {
        console.error('Failed to load cases:', error);
        Swal.fire('Error', 'Failed to load cases. Please try again.', 'error');
    }
}

// Load reports for selected case
async function loadCaseReports(caseId) {
    $('#reportsContent').show();
    
    try {
        // Load case details
        const caseResponse = await $.ajax({
            url: `${BASE_URL}/investigation/cases/${caseId}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        
        if (caseResponse.status === 'success') {
            displaySelectedCase(caseResponse.data);
        }
        
        // Initialize ReportsManager
        if (typeof ReportsManager !== 'undefined') {
            ReportsManager.init(caseId);
        } else {
            // Fallback if ReportsManager not loaded
            loadReportsList(caseId);
        }
    } catch (error) {
        console.error('Failed to load case reports:', error);
        Swal.fire('Error', 'Failed to load case information. Please try again.', 'error');
    }
}

function displaySelectedCase(caseData) {
    $('#selectedCaseCard').html(`
        <h4><i class="fas fa-folder-open"></i> ${caseData.case_number}</h4>
        <p><strong>Crime:</strong> ${caseData.crime_type} | <strong>Status:</strong> ${caseData.status}</p>
    `);
}

async function loadReportsList(caseId) {
    try {
        const response = await $.ajax({
            url: `${BASE_URL}/api/investigation/reports/${caseId}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        
        if (response.status === 'success') {
            const reports = response.data;
            updateReportsStats(reports);
            displayReportsList(reports);
        }
    } catch (error) {
        console.error('Failed to load reports:', error);
    }
}

function updateReportsStats(reports) {
    $('#totalReportsCount').text(reports.length);
    $('#draftReportsCount').text(reports.filter(r => r.approval_status === 'draft').length);
    $('#approvedReportsCount').text(reports.filter(r => r.approval_status === 'approved').length);
    $('#signedReportsCount').text(reports.filter(r => r.is_signed == 1).length);
}

function displayReportsList(reports) {
    const container = $('#reportsListContainer');
    
    if (reports.length === 0) {
        container.html('<div class="alert alert-info">No reports generated yet. Click on a report type to create one!</div>');
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Type</th><th>Title</th><th>Created</th><th>Status</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    reports.forEach(report => {
        html += '<tr>';
        html += `<td>${report.report_type}</td>`;
        html += `<td>${report.report_title}</td>`;
        html += `<td>${new Date(report.created_at).toLocaleString()}</td>`;
        html += `<td>${report.approval_status}</td>`;
        html += `<td><button class="btn btn-sm btn-primary" onclick="viewReport(${report.id})">View</button></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.html(html);
}

function generateReport(reportType) {
    console.log('🎯 [Step 1] generateReport called with type:', reportType);
    
    const caseId = $('#caseSelector').val();
    console.log('🎯 [Step 2] Selected case ID:', caseId);
    
    if (!caseId) {
        console.error('❌ No case selected!');
        Swal.fire('Error', 'Please select a case first', 'error');
        return;
    }
    
    // Use ReportsManager if available
    console.log('🎯 [Step 3] Checking if ReportsManager is available...');
    console.log('ReportsManager type:', typeof ReportsManager);
    
    if (typeof ReportsManager !== 'undefined') {
        console.log('✅ ReportsManager found, calling showGenerateReportModal...');
        ReportsManager.showGenerateReportModal(reportType);
    } else {
        console.error('❌ ReportsManager not found!');
        alert('Report generation feature is loading. Please wait...');
    }
}

function viewReport(reportId) {
    window.open(`${BASE_URL}/api/investigation/reports/pdf/preview/${reportId}`, '_blank');
}

// Tab switching
$(document).on('click', '.tab-btn', function() {
    const tab = $(this).data('tab');
    
    // Update buttons
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');
    
    // Update content
    $('.tab-pane').removeClass('active');
    $(`#${tab}Tab`).addClass('active');
});

function getToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Close modal function
function closeReportModal() {
    $('#reportEditorModal').fadeOut(300);
    $('#reportEditorModal').removeClass('show');
    $('.modal-backdrop').remove();
}
