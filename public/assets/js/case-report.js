// ============================================
// CASE REPORT GENERATION
// ============================================

/**
 * Generate Case Report
 */
async function generateCaseReport(caseId) {
    const result = await Swal.fire({
        title: 'Generate Case Report',
        html: `
            <div style="text-align: left;">
                <p style="margin-bottom: 15px;">Choose language and format for the report:</p>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600;">
                        <i class="fas fa-language"></i> Report Language:
                    </label>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-outline-primary language-btn" data-lang="en" style="flex: 1; padding: 10px;" onclick="selectLanguage(this, 'en')">
                            English
                        </button>
                        <button class="btn btn-outline-primary language-btn" data-lang="so" style="flex: 1; padding: 10px;" onclick="selectLanguage(this, 'so')">
                            Somali (Af-Soomaali)
                        </button>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary btn-block mb-2" id="viewReportBtn" disabled style="width: 100%; padding: 12px;">
                        <i class="fas fa-eye"></i> View in Browser (Printable)
                    </button>
                    <button class="btn btn-info btn-block" onclick="downloadReportData(${caseId}); Swal.close();" style="width: 100%; padding: 12px;">
                        <i class="fas fa-download"></i> Download as JSON
                    </button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        width: '550px',
        didOpen: () => {
            // Store case ID for later use
            window.currentReportCaseId = caseId;
            window.selectedLanguage = null;
        }
    });
}

function selectLanguage(btn, lang) {
    // Remove selected state from all buttons
    document.querySelectorAll('.language-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline-primary');
    });
    
    // Add selected state to clicked button
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-primary');
    
    // Store selected language
    window.selectedLanguage = lang;
    
    // Enable view report button
    const viewBtn = document.getElementById('viewReportBtn');
    viewBtn.disabled = false;
    viewBtn.onclick = function() {
        viewReportInBrowser(window.currentReportCaseId, lang);
        Swal.close();
    };
}

/**
 * View Report in Browser (Printable) - Basic Report
 */
async function viewReportInBrowser(caseId, language = 'en') {
    showLoading('Preparing report for print...');
    
    try {
        // Get the report data first
        const response = await investigationAPI.generateReport(caseId);
        
        if (response.status === 'success') {
            closeAlert();
            
            // Generate the HTML content with selected language
            const reportData = response.data;
            const htmlContent = await generatePrintableHTML(reportData, language);
            
            // Add QR code generation script to HTML
            const htmlWithQR = addQRCodeScriptToHTML(htmlContent);
            
            // Save HTML to server
            showLoading('Saving report...');
            const htmlResponse = await saveHTMLReport(caseId, reportData, htmlWithQR, language, 'basic');
            closeAlert();
            
            if (htmlResponse && htmlResponse.data) {
                const htmlUrl = htmlResponse.data.html_url;
                
                // Open HTML in new window
                window.open(htmlUrl, '_blank');
                
                // Log the URL for reference
                console.log('Basic Report HTML URL:', htmlUrl);
                console.log('QR Code URL:', htmlResponse.data.qr_code);
                console.log('Filename:', htmlResponse.data.filename);
                
                // Show success with URL
                showToast(`✓ Report saved! URL: ${htmlUrl}`, 'success', 10000);
            } else {
                // Fallback to blob URL if save failed
                showToast('Server save failed. Opening temporary view...', 'warning');
                const blob = new Blob([htmlWithQR], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }
        } else {
            closeAlert();
            await showError('Error', 'Failed to load report data');
        }
    } catch (error) {
        closeAlert();
        console.error('Error loading report:', error);
        await showError('Error', 'Failed to prepare report for printing');
    }
}

/**
 * Add QR code generation script to HTML
 */
function addQRCodeScriptToHTML(htmlContent) {
    // Script to inject
    const qrScript = `
    <script>
        // Generate QR code when page loads
        window.addEventListener('DOMContentLoaded', function() {
            const qrContainer = document.getElementById('qrCode');
            if (qrContainer && typeof QRCode !== 'undefined') {
                // Get current page URL as the QR code target
                const reportUrl = window.location.href;
                
                // Clear container
                qrContainer.innerHTML = '';
                
                // Generate QR code pointing to this HTML file
                new QRCode(qrContainer, {
                    text: reportUrl,
                    width: 120,
                    height: 120,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                console.log('QR Code generated for report URL:', reportUrl);
            } else {
                console.warn('QR Code library not loaded or container not found');
            }
        });
    </script>`;
    
    // Insert before closing </head> tag
    return htmlContent.replace('</head>', qrScript + '\n</head>');
}

/**
 * Generate QR Code for Report Verification
 */
function generateReportQRCode(printWindow, reportData, language) {
    try {
        const qrContainer = printWindow.document.getElementById('qrCode');
        if (!qrContainer) {
            console.warn('QR code container not found in report');
            return;
        }
        
        // Create public report URL - anyone can view the report by scanning
        const baseUrl = window.location.origin;
        const caseNumber = reportData.case.case_number;
        const timestamp = reportData.case.created_at;
        const verificationCode = generateVerificationCode(caseNumber, timestamp);
        const publicReportUrl = `${baseUrl}/public-report.html?case=${caseNumber}&code=${verificationCode}`;
        
        // Clear container
        qrContainer.innerHTML = '';
        
        // Check if QRCode library is available
        if (typeof printWindow.QRCode !== 'undefined') {
            // Use QRCode library
            new printWindow.QRCode(qrContainer, {
                text: publicReportUrl,
                width: 120,
                height: 120,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: printWindow.QRCode.CorrectLevel.H
            });
        } else {
            // Fallback to Google Charts API
            const qrSize = 150;
            const qrImg = printWindow.document.createElement('img');
            qrImg.src = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(publicReportUrl)}&chs=${qrSize}x${qrSize}&chld=H|0`;
            qrImg.alt = 'QR Code';
            qrImg.style.width = '100%';
            qrImg.style.height = '100%';
            qrContainer.appendChild(qrImg);
        }
        
        console.log('QR Code generated for report:', reportData.case.case_number);
    } catch (error) {
        console.error('Error generating QR code for report:', error);
        // Show fallback text
        if (qrContainer) {
            qrContainer.innerHTML = '<div style="font-size: 10px; color: #999;">QR Code Error</div>';
        }
    }
}

/**
 * Download Report Data as JSON
 */
async function downloadReportData(caseId) {
    showLoading('Generating report...');
    
    try {
        const response = await investigationAPI.generateReport(caseId);
        
        closeAlert();
        
        if (response.status === 'success') {
            // Convert to JSON and download
            const reportData = response.data;
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Create download link
            const url = window.URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `case_report_${reportData.case.case_number}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            await showSuccess('Report Downloaded', 'Case report has been downloaded successfully');
        }
    } catch (error) {
        closeAlert();
        console.error('Error generating report:', error);
        await showError('Error', 'Failed to generate case report');
    }
}

/**
 * Generate Full Report with Conclusions (for investigators)
 */
async function generateFullCaseReport(caseId) {
    console.log('🔵 generateFullCaseReport CALLED with caseId:', caseId);
    console.log('🔵 Function location: case-report.js line 259');
    
    const user = getCurrentUser();
    const userRole = user?.userRole || user?.role;
    console.log('🔵 User:', user);
    console.log('🔵 User Role:', userRole);
    
    const result = await Swal.fire({
        title: 'Generate Full Case Report',
        html: `
            <div style="text-align: left;">
                <p style="margin-bottom: 15px; color: #e74c3c; font-weight: bold;">
                    <i class="fas fa-clipboard-check"></i> Full Report with Investigator Conclusions
                </p>
                <p style="margin-bottom: 15px; font-size: 14px;">
                    This comprehensive report includes:
                </p>
                <ul style="text-align: left; font-size: 13px; margin-bottom: 20px; padding-left: 20px;">
                    <li>Complete case details and metadata</li>
                    <li>All parties (accused, victims, witnesses)</li>
                    <li>Evidence inventory</li>
                    <li>Case history and timeline</li>
                    <li><strong>Your investigation conclusions and findings</strong></li>
                </ul>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600;">
                        <i class="fas fa-language"></i> Report Language:
                    </label>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-outline-primary language-btn-full" data-lang="en" style="flex: 1; padding: 10px;" onclick="selectFullReportLanguage(this, 'en')">
                            English
                        </button>
                        <button class="btn btn-outline-primary language-btn-full" data-lang="so" style="flex: 1; padding: 10px;" onclick="selectFullReportLanguage(this, 'so')">
                            Somali (Af-Soomaali)
                        </button>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn btn-danger btn-block mb-2" id="viewFullReportBtn" disabled style="width: 100%; padding: 12px;">
                        <i class="fas fa-file-pdf"></i> View Full Report (Printable)
                    </button>
                    <button class="btn btn-info btn-block" onclick="downloadReportData(${caseId}); Swal.close();" style="width: 100%; padding: 12px;">
                        <i class="fas fa-download"></i> Download Data as JSON
                    </button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        width: '550px',
        customClass: {
            container: 'swal2-container-high-z-index'
        },
        didOpen: () => {
            console.log('🔵 Full Report modal opened');
            // Store case ID for later use
            window.currentFullReportCaseId = caseId;
            window.selectedFullReportLanguage = null;
            
            // Force this modal to appear on top of case details modal
            const containers = document.querySelectorAll('.swal2-container');
            console.log('🔵 Found', containers.length, 'SweetAlert containers');
            if (containers.length > 0) {
                const lastContainer = containers[containers.length - 1];
                lastContainer.style.zIndex = '99999999';
                console.log('🔵 Set z-index to 99999999 for container');
                const popup = lastContainer.querySelector('.swal2-popup');
                if (popup) {
                    popup.style.zIndex = '99999999';
                    console.log('🔵 Set z-index to 99999999 for popup');
                }
            }
        }
    });
}

/**
 * Select language for full report
 */
function selectFullReportLanguage(btn, lang) {
    // Remove selected state from all buttons
    document.querySelectorAll('.language-btn-full').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline-primary');
    });
    
    // Add selected state to clicked button
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-primary');
    
    // Store selected language
    window.selectedFullReportLanguage = lang;
    
    // Enable view report button
    const viewBtn = document.getElementById('viewFullReportBtn');
    viewBtn.disabled = false;
    viewBtn.onclick = function() {
        viewFullReportInBrowser(window.currentFullReportCaseId, lang);
        Swal.close();
    };
}

/**
 * View Full Report in Browser (with Conclusions)
 */
async function viewFullReportInBrowser(caseId, language = 'en') {
    showLoading('Preparing full report...');
    
    try {
        // Fetch FULL report data (includes investigation_notes, supporting_witnesses, conclusions)
        const reportResponse = await investigationAPI.generateFullReport(caseId);
        
        closeAlert();
        
        if (reportResponse.status === 'success') {
            // The full report already includes all data
            const reportData = reportResponse.data;
            
            // Pre-load all evidence files as blob URLs
            showLoading('Loading evidence files...');
            await preloadEvidenceFiles(reportData);
            closeAlert();
            
            // Generate HTML with the enhanced person-centric data and selected language
            const htmlContent = await generateFullReportHTML(reportData, language);
            
            // Save HTML to server
            showLoading('Saving report...');
            const htmlResponse = await saveHTMLReport(caseId, reportData, htmlContent, language);
            closeAlert();
            
            if (htmlResponse && htmlResponse.data) {
                const htmlUrl = htmlResponse.data.html_url;
                
                // Open HTML in new window
                window.open(htmlUrl, '_blank');
                
                // Log the URL for reference
                console.log('Report HTML URL:', htmlUrl);
                console.log('QR Code URL:', htmlResponse.data.qr_code);
                console.log('Filename:', htmlResponse.data.filename);
                
                // Show success with URL
                showToast(`✓ Report saved! URL: ${htmlUrl}`, 'success', 10000);
            } else {
                // Fallback to blob URL if save failed
                showToast('Server save failed. Opening temporary view...', 'warning');
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }
        } else {
            closeAlert();
            await showError('Error', 'Failed to load full report data');
        }
    } catch (error) {
        closeAlert();
        console.error('Error loading full report:', error);
        await showError('Error', 'Failed to prepare full report: ' + error.message);
    }
}

/**
 * Pre-load evidence files and convert to blob URLs for display in report
 */
async function preloadEvidenceFiles(reportData) {
    const token = localStorage.getItem('auth_token');
    
    // Collect all evidence from all parties
    const allEvidence = [];
    if (reportData.parties) {
        ['accused', 'victims', 'witnesses'].forEach(role => {
            if (reportData.parties[role]) {
                reportData.parties[role].forEach(person => {
                    if (person.evidence && person.evidence.length > 0) {
                        allEvidence.push(...person.evidence);
                    }
                });
            }
        });
    }
    
    // Also get general evidence
    if (reportData.evidence) {
        allEvidence.push(...reportData.evidence);
    }
    
    // Download and create blob URLs for each evidence file
    const promises = allEvidence.map(async (evidence) => {
        if (!evidence.file_path || !evidence.id) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidence.id}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                // Store the blob URL in the evidence object
                evidence.blob_url = blobUrl;
            }
        } catch (error) {
            console.error(`Failed to load evidence ${evidence.id}:`, error);
        }
    });
    
    await Promise.all(promises);
}

/**
 * OLD: View Full Report in Browser (server-side - deprecated)
 */
function viewFullReportInBrowser_OLD(caseId) {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const url = `${API_BASE_URL}/investigation/cases/${caseId}/report/full`;
    
    // Open in new window with auth token
    const newWindow = window.open('', '_blank');
    
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Loading Full Report...</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #f5f5f5;
                    }
                    .loader {
                        text-align: center;
                    }
                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #e74c3c;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="loader">
                    <div class="spinner"></div>
                    <h3>Generating Full Report</h3>
                    <p>Including investigation conclusions...</p>
                </div>
                <script>
                    fetch('${url}', {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ${token}',
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to generate report');
                        }
                        return response.text();
                    })
                    .then(html => {
                        document.open();
                        document.write(html);
                        document.close();
                    })
                    .catch(error => {
                        console.error('Full Report Error:', error);
                        document.body.innerHTML = \`
                            <div style="max-width: 800px; margin: 50px auto; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <h2 style="color: #e74c3c;">? Error Loading Report</h2>
                                
                                <div style="background: #f8d7da; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
                                    <strong>Error Message:</strong>
                                    <pre style="margin: 10px 0; white-space: pre-wrap; word-wrap: break-word;">\${error.message}</pre>
                                </div>
                                
                                <h3>?? Debug Information:</h3>
                                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                    <pre style="margin: 0; white-space: pre-wrap;">URL: ${url}
Token: ${token ? 'Present (length: ' + '${token}'.length + ')' : '? MISSING - Please login again'}
Case ID: ${caseId}
Timestamp: \${new Date().toISOString()}</pre>
                                </div>
                                
                                <h3>?? Possible Causes:</h3>
                                <ul style="line-height: 1.8;">
                                    <li>Authentication token expired or invalid</li>
                                    <li>Case not found (ID: ${caseId})</li>
                                    <li>No permission to access this case</li>
                                    <li>Database or server error</li>
                                    <li>investigator_conclusions table issue</li>
                                </ul>
                                
                                <h3>??? Next Steps:</h3>
                                <ol style="line-height: 1.8;">
                                    <li><strong>Check browser console</strong> (Press F12 ? Console tab)</li>
                                    <li><strong>Check server logs:</strong> <code>writable/logs/log-\${new Date().toISOString().split('T')[0]}.log</code></li>
                                    <li><strong>Try:</strong> Logout and login again</li>
                                    <li><strong>Verify:</strong> You're assigned to case ${caseId}</li>
                                    <li><strong>Verify:</strong> You're logged in as investigator</li>
                                </ol>
                                
                                <div style="margin-top: 30px; display: flex; gap: 10px;">
                                    <button onclick="location.reload()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                                        ?? Try Again
                                    </button>
                                    <button onclick="window.close()" style="padding: 12px 24px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                                        ? Close Window
                                    </button>
                                </div>
                            </div>
                        \`;
                    });
                </script>
            </body>
            </html>
        `);
    } else {
        showError('Error', 'Please allow pop-ups to view the report');
    }
}

/**
 * Translation Dictionary
 */
const translations = {
    en: {
        caseNumber: 'Case Number',
        obNumber: 'OB Number',
        reportDate: 'Report Date',
        caseInformation: 'Case Information',
        status: 'Status',
        priority: 'Priority',
        crimeCategory: 'Crime Category',
        crimeType: 'Crime Type',
        incidentDate: 'Incident Date',
        location: 'Location',
        createdBy: 'Created By',
        createdAt: 'Created At',
        courtStatus: 'Court Status',
        incidentDescription: 'Incident Description',
        noDescription: 'No description provided',
        accusedPersons: 'Accused Person(s)',
        accusersVictims: 'Accuser(s) / Victim(s)',
        assignedInvestigators: 'Assigned Investigators',
        name: 'Name',
        role: 'Role',
        assignedDate: 'Assigned Date',
        leadInvestigator: 'Lead Investigator',
        supportInvestigator: 'Support Investigator',
        courtAssignment: 'Court Assignment',
        assignedTo: 'Assigned To',
        assignedBy: 'Assigned By',
        deadline: 'Deadline',
        notes: 'Notes',
        id: 'ID',
        gender: 'Gender',
        phone: 'Phone',
        address: 'Address',
        statement: 'Statement',
        preparedBy: 'Prepared By',
        signature: 'Signature',
        date: 'Date',
        reviewedBy: 'Reviewed By',
        scanForDetails: 'Scan for Case Details',
        printReport: 'PRINT REPORT',
        // Full Report Translations
        caseOverview: 'CASE OVERVIEW',
        section1Accused: 'SECTION 1: ACCUSED PERSONS',
        section2Accusers: 'SECTION 2: ACCUSERS/VICTIMS',
        section3Witnesses: 'SECTION 3: WITNESSES',
        section4CrimeScene: 'SECTION 4: CRIME SCENE EVIDENCE',
        accusedPerson: 'ACCUSED',
        victimPerson: 'VICTIM',
        witnessPerson: 'WITNESS',
        statementsNotes: 'STATEMENTS & NOTES',
        evidence: 'EVIDENCE',
        supportingWitnesses: 'SUPPORTING WITNESSES',
        investigatorConclusions: 'INVESTIGATOR CONCLUSIONS & FINDINGS',
        investigationFindings: 'Investigation Findings',
        findings: 'FINDINGS',
        recommendations: 'RECOMMENDATIONS',
        conclusionSummary: 'CONCLUSION SUMMARY',
        investigator: 'Investigator',
        badge: 'Badge',
        officialStatement: 'Official Statement',
        dateNotRecorded: 'Date not recorded',
        noStatementsRecorded: 'No statements recorded',
        noEvidenceCollected: 'No evidence collected',
        noSupportingWitnesses: 'No supporting witnesses',
        witnessNum: 'Witness',
        type: 'Type',
        description: 'Description',
        collected: 'Collected',
        by: 'by',
        category: 'Category',
        locationCollected: 'Location',
        approvedBy: 'Approved By',
        evidenceItem: 'Evidence',
        noLetterhead: 'No letterhead configured',
        uploadHeaderMsg: 'Go to Report Settings to upload a header image',
        officialPoliceReport: 'This is an official police case report generated on',
        reportId: 'Report ID',
        generatedBySystem: 'Generated by: Police Case Management System',
        dob: 'DOB',
        email: 'Email',
        collectedFrom: 'Collected From',
        evidenceNumber: 'Evidence Number',
        // Additional labels
        accusedNum: 'ACCUSED',
        victimNum: 'VICTIM',
        witnessNum: 'WITNESS',
        crimeType: 'Crime Type',
        incidentDescription: 'INCIDENT DESCRIPTION',
        // Table headers
        number: '#',
        title: 'Title',
        collectedDate: 'Collected Date',
        collectedBy: 'Collected By',
        storageLocation: 'Storage Location',
        dateTime: 'Date & Time',
        statusChange: 'Status Change',
        changedBy: 'Changed By',
        witnesses: 'WITNESS(ES)',
        evidenceSection: 'EVIDENCE SECTION',
        evidenceInventory: 'EVIDENCE INVENTORY',
        caseHistory: 'CASE HISTORY & TIMELINE',
        printReportBtn: 'Print Report',
        unknown: 'Unknown',
        section5Timeline: 'SECTION 5: CASE TIMELINE',
        statementsNotesLabel: 'STATEMENTS & NOTES'
    },
    so: {
        caseNumber: 'Lambarka Kiiska',
        obNumber: 'Lambarka OB',
        reportDate: 'Taariikhda Warbixinta',
        caseInformation: 'Macluumaadka Kiiska',
        status: 'Xaaladda',
        priority: 'Muhiimadda',
        crimeCategory: 'Nooca Dembiga',
        crimeType: 'Qaybta Dembiga',
        incidentDate: 'Taariikhda Dhacdada',
        location: 'Goobta',
        createdBy: 'Abuuray',
        createdAt: 'La Abuuray',
        courtStatus: 'Xaaladda Maxkamadda',
        incidentDescription: 'Sharaxaada Dhacdada',
        noDescription: 'Ma jiraan sharaxaad la bixiyay',
        accusedPersons: 'Qof(yada) La Eedaynayo',
        accusersVictims: 'Dacwoodayaasha / Dhibbanayaasha',
        assignedInvestigators: 'Baarayaasha Loo Xilsaaray',
        name: 'Magaca',
        role: 'Doorka',
        assignedDate: 'Taariikhda Xilsaarista',
        leadInvestigator: 'Baaraha Hogaamiya',
        supportInvestigator: 'Baaraha Taageeraha',
        courtAssignment: 'Xilsaarista Maxkamadda',
        assignedTo: 'Loo Xilsaaray',
        assignedBy: 'Xilsaaray',
        deadline: 'Xilliga Ugu Dambeeya',
        notes: 'Qoraalo',
        id: 'Lambarka Aqoonsiga',
        gender: 'Jinsiga',
        phone: 'Telefoonka',
        address: 'Ciwaanka',
        statement: 'Bayaanka',
        preparedBy: 'Diyaariyay',
        signature: 'Saxiixa',
        date: 'Taariikhda',
        reviewedBy: 'Dib u Eegay',
        scanForDetails: 'Sawir Macluumaadka Kiiska',
        printReport: 'DAABAC WARBIXINTA',
        // Full Report Translations
        caseOverview: 'KOOBKA KIISKA',
        section1Accused: 'QAYBTA 1: DADKA LOO SHAKIYAY',
        section2Accusers: 'QAYBTA 2: DACWOODAYAASHA/DHIBBANAYAASHA',
        section3Witnesses: 'QAYBTA 3: MARKHAATIYAASHA',
        section4CrimeScene: 'QAYBTA 4: CADDAYNTA GOOBTA DEMBIGA',
        accusedPerson: 'LOO SHAKIYAY',
        victimPerson: 'DHIBANE',
        witnessPerson: 'MARKHAATI',
        statementsNotes: 'BAYANNO & QORAALO',
        evidence: 'CADDAYN',
        supportingWitnesses: 'MARKHAATIYAASHA TAAGEERAHA',
        investigatorConclusions: 'GUNAANADAHA & NATIIJOOYINKA BAADHAHA',
        investigationFindings: 'Natiijooyinka Baadhista',
        findings: 'NATIIJOOYINKA',
        recommendations: 'TALOOYINKA',
        conclusionSummary: 'KOOBKA GUNAANADA',
        investigator: 'Baadhaha',
        badge: 'Calaamad',
        officialStatement: 'Bayaan Rasmi ah',
        dateNotRecorded: 'Taariikh lama qorin',
        noStatementsRecorded: 'Bayanno lama qorin',
        noEvidenceCollected: 'Caddayn lama urursan',
        noSupportingWitnesses: 'Markhaatiyo taageeraha ma jiraan',
        witnessNum: 'Markhaati',
        type: 'Nooca',
        description: 'Sharaxaad',
        collected: 'La ururiyay',
        by: 'waxaa',
        category: 'Qaybta',
        locationCollected: 'Goobta',
        approvedBy: 'Ansixiyay',
        evidenceItem: 'Caddayn',
        noLetterhead: 'Ma jiro sawir madax',
        uploadHeaderMsg: 'Tag Dejinta Warbixinta si aad u soo geliso sawir madax',
        officialPoliceReport: 'Tani waa warbixin rasmi ah oo booliska oo la sameeyay',
        reportId: 'Lambarka Warbixinta',
        generatedBySystem: 'Waxaa sameeyay: Nidaamka Maaraynta Kiisaska Booliiska',
        dob: 'Taariikhda Dhalashada',
        email: 'Iimayl',
        collectedFrom: 'Laga Ururiyay',
        evidenceNumber: 'Lambarka Caddaynta',
        // Additional labels
        accusedNum: 'LOO SHAKIYAY',
        victimNum: 'DHIBANE',
        witnessNum: 'MARKHAATI',
        crimeType: 'Qaybta Dembiga',
        incidentDescription: 'SHARAXAADA DHACDADA',
        // Table headers
        number: '#',
        title: 'Cinwaan',
        collectedDate: 'Taariikhda Ururinta',
        collectedBy: 'Waxaa Ururiyay',
        storageLocation: 'Goobta Kaydka',
        dateTime: 'Taariikhda & Waqtiga',
        statusChange: 'Isbedelka Xaaladda',
        changedBy: 'Waxaa Beddelay',
        witnesses: 'MARKHAATIYAASHA',
        evidenceSection: 'QAYBTA CADDAYNTA',
        evidenceInventory: 'LIISKA CADDAYNTA',
        caseHistory: 'TAARIIKHDA & WAQTIGA KIISKA',
        printReportBtn: 'Daabac Warbixinta',
        unknown: 'Lama yaqaan',
        section5Timeline: 'QAYBTA 5: WAQTIGA KIISKA',
        statementsNotesLabel: 'BAYANNO & QORAALO'
    }
};

/**
 * Generate FULL Report HTML with Conclusions
 */
async function generateFullReportHTML(reportData, language = 'en') {
    // Generate Full Report using person-centric design with its own styles
    let html = await generatePersonCentricReport(reportData, language);
    return html;
    
    // ORIGINAL CODE BELOW (kept for reference but not executed)
    // Use the original design but with enhanced person-centric data
    // let html = generatePrintableHTML(reportData, language);
    
    // If there are conclusions, insert them after case description
    if (reportData.conclusions && reportData.conclusions.length > 0) {
        const conclusion = reportData.conclusions[0]; // Get first/latest conclusion
        
        const conclusionHTML = `
        <!-- INVESTIGATOR CONCLUSIONS SECTION -->
        <div class="report-section" style="background: #fff9e6; border: 3px solid #e74c3c; padding: 20px; margin: 30px 0; page-break-inside: avoid;">
            <h2 class="section-header" style="background: #e74c3c; color: white; padding: 12px 15px; margin: -20px -20px 20px -20px; border-bottom: none;">
                <span class="section-icon" style="background: white;"></span>
                INVESTIGATOR CONCLUSIONS & FINDINGS
            </h2>
            <div class="section-body">
                <div class="conclusion-card" style="background: white; padding: 20px; border-radius: 5px;">
                    <h4 style="color: #e74c3c; font-size: 16pt; margin-bottom: 15px; font-weight: 700;">
                        ${escapeHtml(conclusion.conclusion_title)}
                    </h4>
                    
                    <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
                        <strong>Investigator:</strong> ${escapeHtml(conclusion.investigator_name || 'N/A')}
                        ${conclusion.badge_number ? ` (Badge: ${escapeHtml(conclusion.badge_number)})` : ''}
                        <br>
                        <strong>${tr.date}:</strong> ${new Date(conclusion.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: 700; color: #666; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                            Investigation Findings:
                        </div>
                        <div style="padding: 15px; background: #fafafa; border-left: 4px solid #3498db; line-height: 1.8; white-space: pre-wrap;">
                            ${escapeHtml(conclusion.findings).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    ${conclusion.recommendations ? `
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: 700; color: #666; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                            Recommendations:
                        </div>
                        <div style="padding: 15px; background: #fafafa; border-left: 4px solid #27ae60; line-height: 1.8; white-space: pre-wrap;">
                            ${escapeHtml(conclusion.recommendations).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 0;">
                        <div style="font-weight: 700; color: #666; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                            Conclusion Summary:
                        </div>
                        <div style="padding: 15px; background: #fafafa; border-left: 4px solid #e74c3c; line-height: 1.8; white-space: pre-wrap; font-weight: 600;">
                            ${escapeHtml(conclusion.conclusion_summary).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Insert conclusions after case description section
        const descriptionEnd = html.indexOf('<!-- Parties -->');
        if (descriptionEnd !== -1) {
            html = html.substring(0, descriptionEnd) + conclusionHTML + html.substring(descriptionEnd);
        }
    }
    
    // Add additional sections that are missing from basic report
    html = addAdditionalSectionsToFullReport(html, reportData);
    
    return html;
}

/**
 * Generate Person-Centric Full Report
 * Each accused/accuser gets their own complete section with:
 * - Personal details
 * - Statements/Notes
 * - Evidence collected from them
 * - Supporting witnesses
 */
async function generatePersonCentricReport(reportData, language = 'en') {
    const { case: caseData, parties, evidence, assignments, history, conclusions, created_by } = reportData;
    
    // Get translations for selected language
    const tr = translations[language] || translations.en;
    
    // Get custom settings from database (with localStorage fallback) for FULL REPORT
    let headerImage = '';
    let statement1 = '';
    let statement2 = '';
    let statement3 = '';
    let footerText = '';
    
    try {
        const response = await fetch('/api/report-settings');
        const result = await response.json();
        
        if (result.status === 'success') {
            const settings = result.data;
            headerImage = settings.header_image ? `/uploads/${settings.header_image}` : '';
            // Use FULL report statements
            statement1 = settings.full_statement1 || '';
            statement2 = settings.full_statement2 || '';
            statement3 = settings.full_statement3 || '';
            footerText = settings.full_footer_text || '';
        } else {
            // Fallback to localStorage
            const localSettings = JSON.parse(localStorage.getItem('reportSettings') || '{}');
            headerImage = localSettings.headerImage || '';
            statement1 = localSettings.statement1 || '';
            statement2 = localSettings.statement2 || '';
            statement3 = localSettings.statement3 || '';
            footerText = localSettings.footerText || '';
        }
    } catch (error) {
        console.error('Error loading settings from database:', error);
        // Fallback to localStorage
        const localSettings = JSON.parse(localStorage.getItem('reportSettings') || '{}');
        headerImage = localSettings.headerImage || '';
        statement1 = localSettings.statement1 || '';
        statement2 = localSettings.statement2 || '';
        statement3 = localSettings.statement3 || '';
        footerText = localSettings.footerText || '';
    }
    
    // Helper to format date
    const formatDate = (dateStr, includeTime = false) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const options = includeTime 
            ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            : { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    
    // Separate parties by role
    const accused = parties.accused || [];
    const accusers = parties.victims || [];
    const witnesses = parties.witnesses || [];
    
    // Split witnesses into affiliated and independent
    const affiliatedWitnesses = witnesses.filter(w => w.witness_affiliation && w.witness_affiliation !== 'neutral' && w.affiliated_person_id);
    const independentWitnesses = witnesses.filter(w => !w.witness_affiliation || w.witness_affiliation === 'neutral' || !w.affiliated_person_id);
    
    // Get crime scene evidence (not collected from specific person)
    const crimeSceneEvidence = evidence.filter(e => !e.collected_from_person_id || e.collected_from === 'crime_scene');
    
    // Start building HTML
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Full Case Report - ${escapeHtml(caseData.case_number)}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    ${getReportStyles()}
    <script>
        // Generate QR code when page loads
        window.addEventListener('DOMContentLoaded', function() {
            const qrContainer = document.getElementById('qrCode');
            if (qrContainer && typeof QRCode !== 'undefined') {
                // Get current page URL as the QR code target
                const reportUrl = window.location.href;
                
                // Clear container
                qrContainer.innerHTML = '';
                
                // Generate QR code pointing to this HTML file
                new QRCode(qrContainer, {
                    text: reportUrl,
                    width: 120,
                    height: 120,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                console.log('QR Code generated for report URL:', reportUrl);
            } else {
                console.warn('QR Code library not loaded or container not found');
            }
        });
    </script>
</head>
<body>
    <button class="print-btn" onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
        <i class="fas fa-print"></i> ${tr.printReportBtn}
    </button>
    
    <div class="report-container" style="max-width: 210mm; margin: 20px auto; background: white; box-shadow: 0 0 30px rgba(0,0,0,0.1); padding: 40px;">
        
        <!-- REPORT HEADER -->
        ${generateReportHeader(caseData, created_by, headerImage, tr)}
        
        <!-- Case Numbers and Date -->
        <div class="case-numbers-section">
            <div class="case-numbers-row">
                <div class="case-numbers-left">
                    <div class="case-number-item">
                        <h3>${tr.caseNumber}</h3>
                        <p>${escapeHtml(caseData.case_number)}</p>
                    </div>
                    <div class="case-number-item">
                        <h3>${tr.obNumber}</h3>
                        <p>${escapeHtml(caseData.ob_number)}</p>
                    </div>
                </div>
                <div class="report-date">
                    <h3>${tr.reportDate}</h3>
                    <p>${formatDate(new Date(), true)}</p>
                </div>
            </div>
        </div>
        
        <!-- Statements Section -->
        <div class="statements-section">
            ${statement1 || statement2 ? `
                <div class="statement-1-2">
                    ${statement1 ? `<div class="statement-box">${escapeHtml(statement1).replace(/\n/g, '<br>')}</div>` : ''}
                    ${statement2 ? `<div class="statement-box">${escapeHtml(statement2).replace(/\n/g, '<br>')}</div>` : ''}
                </div>
            ` : ''}
            ${statement3 ? `
                <div class="statement-separator">
                    <div class="statement-3">${escapeHtml(statement3).replace(/\n/g, '<br>')}</div>
                </div>
            ` : ''}
        </div>
        
        <!-- CASE OVERVIEW -->
        ${generateCaseOverview(caseData, assignments, tr)}
        
        <!-- SECTION 1: ACCUSED PERSONS -->
        ${accused.length > 0 ? generateAccusedSection(accused, tr) : ''}
        
        <!-- SECTION 2: ACCUSERS/VICTIMS -->
        ${accusers.length > 0 ? generateAccusersSection(accusers, tr) : ''}
        
        <!-- SECTION 3: INDEPENDENT WITNESSES -->
        ${independentWitnesses.length > 0 ? generateWitnessesSection(independentWitnesses, tr) : ''}
        
        <!-- SECTION 4: CRIME SCENE EVIDENCE -->
        ${crimeSceneEvidence.length > 0 ? generateCrimeSceneEvidenceSection(crimeSceneEvidence, tr) : ''}
        
        <!-- INVESTIGATOR CONCLUSIONS & FINDINGS (LAST SECTION) -->
        ${conclusions && conclusions.length > 0 ? generateConclusionsSection(conclusions[0], tr) : ''}
        
        <!-- FOOTER -->
        <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #ddd;">
            <!-- Signature Blocks and QR Code Section (Side by Side) -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 30px;">
                <!-- Left side: Signature blocks -->
                <div style="flex: 1;">
                    ${footerText ? `
                        <div style="white-space: pre-line; line-height: 2;">${escapeHtml(footerText)}</div>
                    ` : `
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px;">
                            <div>
                                <strong>${tr.preparedBy}:</strong><br>
                                ${tr.name}: _________________________<br>
                                ${tr.signature}: ____________________<br>
                                ${tr.date}: __________
                            </div>
                            <div>
                                <strong>${tr.reviewedBy}:</strong><br>
                                ${tr.name}: _________________________<br>
                                ${tr.signature}: ____________________<br>
                                ${tr.date}: __________
                            </div>
                            <div>
                                <strong>${tr.approvedBy}:</strong><br>
                                ${tr.name}: _________________________<br>
                                ${tr.signature}: ____________________<br>
                                ${tr.date}: __________
                            </div>
                        </div>
                    `}
                </div>
                
                <!-- Right side: QR Code -->
                <div style="width: 120px; text-align: center;">
                    <div class="qr-code-container" id="qrCode" style="width: 120px; height: 120px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; background: #f9f9f9; margin-bottom: 5px;"></div>
                    <div style="font-size: 10px; font-weight: bold;">${tr.scanForDetails}</div>
                </div>
            </div>
            
            <!-- Footer text at the bottom -->
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #eee; padding-top: 15px;">
                <p>${tr.officialPoliceReport} ${formatDate(new Date().toISOString(), true)}</p>
                <p>${tr.reportId}: ${escapeHtml(caseData.case_number)} | ${tr.generatedBySystem}</p>
            </div>
        </div>
        
    </div>
</body>
</html>
    `;
    
    return html;
}

/**
 * Helper Functions for Person-Centric Report
 */

// Get report styles
function getReportStyles() {
    return `<style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 1cm; size: A4 portrait; }
        body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #333; }
        
        /* Letter Header */
        .report-letterhead {
            width: 100%;
            margin-bottom: 15px;
            text-align: center;
            page-break-inside: avoid;
        }
        
        .letterhead-image {
            width: 100%;
            height: auto;
            display: block;
            object-fit: contain;
            max-height: 180px;
        }
        
        /* Case Numbers Section - Compact */
        .case-numbers-section { 
            background: #f8f9fa;
            padding: 10px 30px;
            border-bottom: 2px solid #dee2e6;
            margin-bottom: 10px;
        }
        
        .case-numbers-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .case-numbers-left {
            display: flex;
            gap: 30px;
        }
        
        .case-number-item h3 {
            font-size: 10px;
            color: #666;
            font-weight: 600;
            margin-bottom: 2px;
            text-transform: uppercase;
        }
        
        .case-number-item p {
            font-size: 13px;
            color: #000;
            font-weight: 700;
        }
        
        .report-date {
            text-align: right;
        }
        
        .report-date h3 {
            font-size: 10px;
            color: #666;
            font-weight: 600;
            margin-bottom: 2px;
            text-transform: uppercase;
        }
        
        .report-date p {
            font-size: 13px;
            color: #000;
            font-weight: 700;
        }
        
        /* Statements Section */
        .statements-section {
            background: white;
            padding: 10px 30px;
            border-bottom: 1px solid #ddd;
            margin-bottom: 15px;
        }
        
        .statement-box {
            margin-bottom: 5px;
            line-height: 1.4;
            color: #000;
            font-size: 12px;
            font-weight: 600;
        }
        
        .statement-3 {
            text-align: center;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            font-weight: 700;
            padding: 8px 0;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            margin-top: 8px;
        }
        
        /* Section Headers - Stronger and more colorful */
        .section-header { 
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white; 
            padding: 12px 20px; 
            margin: 20px 0 12px 0; 
            font-size: 14pt; 
            font-weight: bold; 
            page-break-after: avoid;
            page-break-inside: avoid;
            orphans: 3;
            border-radius: 5px;
            box-shadow: 0 3px 6px rgba(0,0,0,0.2);
            border-bottom: 4px solid #1a252f;
        }
        
        /* Person File - More organized with stronger borders */
        .person-file { 
            border: 3px solid #3498db; 
            padding: 0; 
            margin: 15px 0; 
            background: white; 
            page-break-inside: avoid;
            orphans: 3;
            widows: 3;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }
        
        .person-header { 
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white; 
            padding: 15px 20px; 
            display: flex; 
            align-items: center; 
            gap: 15px;
            border-bottom: 3px solid #2980b9;
        }
        
        .person-photo { 
            width: 70px; 
            height: 70px; 
            border-radius: 50%; 
            border: 3px solid white; 
            object-fit: cover; 
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .person-name { 
            font-size: 15pt; 
            font-weight: bold; 
        }
        
        /* Subsections - Better organized with strong lines and colors */
        .subsection { 
            margin: 0; 
            padding: 12px 15px; 
            background: #ffffff; 
            border-bottom: 2px solid #dee2e6;
            page-break-inside: avoid;
        }
        
        .subsection:last-child {
            border-bottom: none;
        }
        
        .subsection:nth-child(even) {
            background: #f8f9fa;
        }
        
        .subsection-title { 
            font-weight: bold; 
            color: #ffffff; 
            margin-bottom: 10px; 
            font-size: 11pt;
            padding: 8px 12px;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            border-radius: 4px;
            border-left: 4px solid #2471a3;
            page-break-after: avoid;
        }
        
        /* Info table - Strong lines and better spacing */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #dee2e6;
        }
        
        .info-table tr {
            border-bottom: 2px solid #dee2e6;
        }
        
        .info-table tr:last-child {
            border-bottom: none;
        }
        
        .info-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .info-table td {
            padding: 10px 12px;
            vertical-align: top;
        }
        
        .info-table td:first-child {
            font-weight: 700;
            color: #2c3e50;
            width: 25%;
            background: #e8f4f8;
            border-right: 2px solid #3498db;
        }
        
        /* Evidence and Notes - Cleaner */
        .evidence-item { 
            padding: 8px; 
            margin: 8px 0; 
            background: #e8f4f8; 
            border-left: 3px solid #3498db;
            border-radius: 3px;
        }
        
        .note-item { 
            padding: 8px; 
            margin: 8px 0; 
            background: #fff3cd; 
            border-left: 3px solid #ffc107;
            border-radius: 3px;
        }
        
        /* Witness items */
        .witness-item {
            padding: 8px;
            margin: 8px 0;
            background: #d4edda;
            border-left: 3px solid #27ae60;
            border-radius: 3px;
        }
        
        /* Spacing improvements */
        .detail-row {
            display: flex;
            padding: 4px 0;
            border-bottom: 1px solid #f5f5f5;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 600;
            color: #555;
            min-width: 120px;
            flex-shrink: 0;
        }
        
        .detail-value {
            color: #333;
            flex: 1;
        }
        
        @media print { 
            .print-btn { display: none !important; } 
            body { 
                padding: 0 !important; 
                font-size: 8pt !important; 
                line-height: 1.2 !important; 
                margin: 0 !important;
            }
            @page { 
                margin: 0.8cm; 
                size: A4 portrait;
            }
            
            /* Remove all shadows for print */
            * { 
                box-shadow: none !important; 
                -webkit-box-shadow: none !important;
            }
            
            /* Letterhead - More compact */
            .report-letterhead {
                margin-bottom: 2px !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
            }
            .letterhead-image {
                max-height: 80px !important;
                height: auto !important;
                width: 100% !important;
                object-fit: contain !important;
                display: block !important;
                margin: 0 auto !important;
            }
            
            /* Case Numbers - Very compact */
            .case-numbers-section {
                padding: 2px 6px !important;
                margin-bottom: 2px !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
            }
            
            .case-number-item h3,
            .report-date h3 {
                font-size: 6px !important;
                margin-bottom: 0 !important;
                line-height: 1 !important;
            }
            
            .case-number-item p,
            .report-date p {
                font-size: 7.5px !important;
                margin: 0 !important;
                line-height: 1.1 !important;
            }
            
            .statements-section {
                padding: 2px 6px !important;
                margin-bottom: 2px !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
            }
            
            .statement-box {
                font-size: 6.5px !important;
                margin-bottom: 0 !important;
                line-height: 1 !important;
                padding: 1px 2px !important;
            }
            
            .statement-3 {
                font-size: 6.5px !important;
                padding: 1px 0 !important;
                margin: 1px 0 !important;
                line-height: 1 !important;
            }
            
            /* Section Headers - Respect inline page-break styles */
            .section-header { 
                font-size: 8.5pt !important; 
                padding: 4px 6px !important; 
                margin: 5px 0 3px 0 !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
            }
            
            /* Ensure section header + first person stay together */
            .section-header + .person-file,
            .section-header + div {
                page-break-before: avoid !important;
            }
            
            /* Person Files - Allow natural breaks between persons */
            .person-file { 
                margin: 8px 0 !important;
                padding: 0 !important;
                page-break-inside: auto !important;
                page-break-before: auto !important;
                page-break-after: auto !important;
                border: 2px solid #333 !important;
            }
            
            /* First person directly after section header MUST stay together */
            h2 + .person-file,
            .section-header + .person-file {
                page-break-before: avoid !important;
                page-break-inside: avoid !important;
            }
            
            /* Person header should stay with content */
            .person-file > div:first-child {
                padding: 5px 8px !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
            }
            
            /* Person content area */
            .person-file > div:last-child {
                page-break-before: avoid !important;
            }
            
            /* Person photo in print */
            .person-file img {
                width: 70px !important;
                height: 85px !important;
                border: 2px solid white !important;
            }
            
            /* Compact subsections - Allow breaks between sections if needed */
            .subsection { 
                padding: 5px 8px !important;
                margin: 0 !important;
                page-break-inside: auto !important;
                page-break-after: auto !important;
            }
            
            .subsection-title {
                font-size: 8.5pt !important;
                padding: 4px 8px !important;
                margin-bottom: 4px !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
            }
            
            /* Tables */
            .info-table {
                border: 1px solid #333 !important;
                page-break-inside: auto !important;
                page-break-before: auto !important;
            }
            
            .info-table td {
                padding: 2px 4px !important;
                font-size: 7.5pt !important;
                border-bottom: 1px solid #ddd !important;
            }
            
            .info-table tr {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
            }
            
            /* Table headers stay with at least one row */
            .info-table tr:first-child {
                page-break-after: avoid !important;
            }
            
            /* Prevent orphaned headers - keep with next content */
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                orphans: 3 !important;
                widows: 3 !important;
            }
            
            /* Images */
            img { 
                max-height: 120px !important; 
                page-break-inside: avoid !important;
            }
            
            /* Avoid breaking lists */
            ul, ol {
                page-break-inside: avoid !important;
            }
            
            /* Keep witness and evidence items together */
            .evidence-item, .note-item, .witness-item {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
                margin: 3px 0 !important;
                padding: 4px 6px !important;
            }
            
            /* Supporting witness boxes in print */
            div[style*="border: 2px solid #27ae60"] {
                page-break-inside: avoid !important;
                margin-bottom: 5px !important;
            }
            
            /* Case overview - more compact in print */
            div[style*="border: 3px solid #3498db"] {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
                padding: 8px 10px !important;
                margin-bottom: 8px !important;
            }
            
            /* Case overview table in print */
            div[style*="border: 3px solid #3498db"] .info-table td {
                padding: 1px 3px !important;
                font-size: 7pt !important;
            }
            
            /* Case overview title */
            div[style*="border: 3px solid #3498db"] h2 {
                padding: 5px 8px !important;
                margin-bottom: 6px !important;
                font-size: 9pt !important;
            }
            
            /* Description section in case overview */
            div[style*="border: 3px solid #3498db"] > div > div:last-child {
                margin-top: 6px !important;
                padding: 6px !important;
                font-size: 7pt !important;
                line-height: 1.2 !important;
            }
            
            /* Conclusions section - keep together */
            div[style*="border: 4px solid #e74c3c"] {
                page-break-inside: avoid !important;
                page-break-before: auto !important;
            }
            
            /* Reduce margins to fit more content */
            body {
                margin: 0 !important;
            }
            
            /* Better page break control */
            * {
                orphans: 2 !important;
                widows: 2 !important;
            }
        }
    </style>`;
}

// Generate report header with letterhead (Just image, same as basic report)
function generateReportHeader(caseData, created_by, headerImage = '', tr = {}) {
    return `
        <!-- Letterhead Header -->
        <div class="report-letterhead" style="text-align: center; width: 100%;">
            ${headerImage ? 
                `<img src="${headerImage}" alt="Report Header" class="letterhead-image" style="width: 100%; height: auto; max-height: 180px; object-fit: contain; display: block; margin: 0 auto;" />` :
                `<div class="no-header-placeholder" style="text-align: center; padding: 30px; background: #f5f5f5; border: 2px dashed #ddd;">
                    <i class="fas fa-image" style="font-size: 48px; color: #ccc;"></i>
                    <p style="color: #999; margin-top: 10px;">${tr.noLetterhead || 'No letterhead configured'}</p>
                    <small style="color: #999;">${tr.uploadHeaderMsg || 'Go to Report Settings to upload a header image'}</small>
                </div>`
            }
        </div>
    `;
}

// Generate case overview
function generateCaseOverview(caseData, assignments, tr) {
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    return `
        <div style="background: linear-gradient(to right, #e8f4f8 0%, #ffffff 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 3px solid #3498db; box-shadow: 0 3px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #ffffff; margin-bottom: 15px; font-size: 14pt; padding: 10px 15px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); border-radius: 5px; border-left: 5px solid #2471a3;">?? ${tr.caseOverview}</h2>
            <table class="info-table" style="margin-top: 15px;">
                <tr><td>${tr.crimeType}:</td><td>${escapeHtml(caseData.crime_type)}</td></tr>
                <tr><td>${tr.category}:</td><td>${escapeHtml(caseData.crime_category)}</td></tr>
                <tr><td>${tr.incidentDate}:</td><td>${formatDate(caseData.incident_date)}</td></tr>
                <tr><td>${tr.location}:</td><td>${escapeHtml(caseData.incident_location)}</td></tr>
                <tr><td>${tr.status}:</td><td><span style="background: #3498db; color: white; padding: 4px 12px; border-radius: 4px; font-size: 10pt; font-weight: bold;">${escapeHtml(caseData.status).toUpperCase()}</span></td></tr>
                <tr><td>${tr.priority}:</td><td><span style="background: ${caseData.priority === 'high' ? '#e74c3c' : caseData.priority === 'medium' ? '#f39c12' : '#95a5a6'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 10pt; font-weight: bold;">${escapeHtml(caseData.priority || 'N/A').toUpperCase()}</span></td></tr>
            </table>
            <div style="margin-top: 15px; padding: 15px; background: white; border-left: 4px solid #3498db; border-radius: 4px;">
                <div style="font-weight: 700; color: #2c3e50; margin-bottom: 8px; font-size: 10pt;">?? ${tr.incidentDescription}:</div>
                <div style="color: #333; line-height: 1.6;">${escapeHtml(caseData.incident_description).replace(/\n/g, '<br>')}</div>
            </div>
        </div>
    `;
}

// Generate conclusions section
function generateConclusionsSection(conclusion, tr) {
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
        <div style="background: linear-gradient(to right, #fff9e6 0%, #ffffff 100%); border: 4px solid #e74c3c; padding: 0; margin: 25px 0; page-break-inside: avoid; page-break-before: always; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(231,76,60,0.3);">
            <h2 class="section-header" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); margin: 0; border-radius: 0; border-bottom: 4px solid #a93226; page-break-after: avoid;">?? ${tr.investigatorConclusions}</h2>
            <div style="padding: 20px;">
                <h4 style="color: #ffffff; font-size: 13pt; margin-bottom: 15px; padding: 10px 15px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); border-radius: 5px; border-left: 5px solid #a93226;">${escapeHtml(conclusion.conclusion_title)}</h4>
                <table class="info-table" style="margin-bottom: 15px; border: 3px solid #e74c3c;">
                    <tr><td style="background: #fadbd8;">${tr.investigator}:</td><td>${escapeHtml(conclusion.investigator_name || 'N/A')}${conclusion.badge_number ? ` (${tr.badge}: ${escapeHtml(conclusion.badge_number)})` : ''}</td></tr>
                    <tr><td style="background: #fadbd8;">${tr.date}:</td><td>${formatDate(conclusion.updated_at)}</td></tr>
                </table>
                
                <div style="margin-bottom: 15px; padding: 15px; background: white; border: 3px solid #3498db; border-radius: 5px;">
                    <div style="font-weight: 700; color: #ffffff; margin-bottom: 10px; font-size: 11pt; padding: 8px 12px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); border-radius: 4px;">?? ${tr.findings}:</div>
                    <div style="padding: 12px; background: #f8f9fa; border-left: 5px solid #3498db; white-space: pre-wrap; line-height: 1.8; border-radius: 3px;">${escapeHtml(conclusion.findings)}</div>
                </div>
                
                ${conclusion.recommendations ? `
                <div style="margin-bottom: 15px; padding: 15px; background: white; border: 3px solid #27ae60; border-radius: 5px;">
                    <div style="font-weight: 700; color: #ffffff; margin-bottom: 10px; font-size: 11pt; padding: 8px 12px; background: linear-gradient(135deg, #27ae60 0%, #229954 100%); border-radius: 4px;">?? ${tr.recommendations}:</div>
                    <div style="padding: 12px; background: #f8f9fa; border-left: 5px solid #27ae60; white-space: pre-wrap; line-height: 1.8; border-radius: 3px;">${escapeHtml(conclusion.recommendations)}</div>
                </div>` : ''}
                
                <div style="padding: 15px; background: white; border: 3px solid #e74c3c; border-radius: 5px;">
                    <div style="font-weight: 700; color: #ffffff; margin-bottom: 10px; font-size: 11pt; padding: 8px 12px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); border-radius: 4px;">? ${tr.conclusionSummary}:</div>
                    <div style="padding: 12px; background: #f8f9fa; border-left: 5px solid #e74c3c; white-space: pre-wrap; font-weight: 600; line-height: 1.8; border-radius: 3px;">${escapeHtml(conclusion.conclusion_summary)}</div>
                </div>
            </div>
        </div>
    `;
}

// Generate ACCUSED section (person-by-person)
function generateAccusedSection(accused, tr) {
    const formatDate = (dateStr, includeTime = false) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const options = includeTime ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    
    let html = `<h2 class="section-header" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); page-break-before: always; page-break-after: avoid;">?? ${tr.section1Accused}</h2>`;
    
    accused.forEach((person, index) => {
        const photoUrl = person.photo_path ? `${window.location.origin}/${person.photo_path.replace(/^\/+/, '')}` : '';
        const fullName = person.full_name || `${person.first_name} ${person.last_name}`;
        
        html += `
        <div class="person-file" style="page-break-inside: avoid; border: 3px solid #e74c3c; box-shadow: 0 2px 6px rgba(231,76,60,0.2);">
            <!-- Photo and Basic Info Section at Top -->
            <div style="background: #e74c3c; padding: 8px 12px; border-bottom: 3px solid #c0392b; display: flex; gap: 12px; align-items: center;">
                <!-- Info on Left -->
                <div style="flex: 1;">
                    <div style="color: white; font-size: 12pt; font-weight: bold; margin-bottom: 6px;">?? ${tr.accusedNum} #${index + 1}: ${escapeHtml(fullName)}</div>
                    <div style="background: white; padding: 6px; border: 2px solid #c0392b; border-radius: 3px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
                            <tr>
                                <td style="padding: 2px 6px; width: 18%; font-weight: 600; color: #555;">ID:</td>
                                <td style="padding: 2px 6px; width: 32%; border-right: 1px solid #ddd;">${escapeHtml(person.national_id || person.id_number || 'N/A')}</td>
                                <td style="padding: 2px 6px; width: 18%; font-weight: 600; color: #555;">Gender:</td>
                                <td style="padding: 2px 6px; width: 32%;">${escapeHtml(person.gender || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">DOB:</td>
                                <td style="padding: 2px 6px; border-right: 1px solid #ddd;">${formatDate(person.date_of_birth)}</td>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">Phone:</td>
                                <td style="padding: 2px 6px;">${escapeHtml(person.phone || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.email}:</td>
                                <td colspan="3" style="padding: 2px 6px;">${escapeHtml(person.email || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">Address:</td>
                                <td colspan="3" style="padding: 2px 6px;">${escapeHtml(person.address || 'N/A')}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <!-- Photo on Right -->
                <div style="flex-shrink: 0;">
                    ${photoUrl ? `<img src="${photoUrl}" style="width: 85px; height: 105px; object-fit: cover; border: 2px solid white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" onerror="this.style.display='none'">` : 
                                 `<div style="width: 85px; height: 105px; background: white; display: flex; align-items: center; justify-content: center; font-size: 28pt; font-weight: bold; color: #e74c3c; border: 2px solid white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${fullName.charAt(0)}</div>`}
                </div>
            </div>
            
            <!-- All Other Sections Below -->
            <div style="padding: 10px 12px; background: #ffffff;">
                
                <!-- Statements & Investigation Notes -->
                ${generatePersonStatementsSection(person, tr)}
                
                <!-- Evidence Collected From This Person -->
                ${generatePersonEvidenceSection(person, tr)}
                
                <!-- Supporting Witnesses -->
                ${generateSupportingWitnessesSection(person, tr)}
            </div>
        </div>
        `;
    });
    
    return html;
}

// Generate ACCUSERS section (person-by-person)
function generateAccusersSection(accusers, tr) {
    const formatDate = (dateStr, includeTime = false) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const options = includeTime ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    
    let html = `<h2 class="section-header" style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); page-break-before: always; page-break-after: avoid;">?? ${tr.section2Accusers}</h2>`;
    
    accusers.forEach((person, index) => {
        const photoUrl = person.photo_path ? `${window.location.origin}/${person.photo_path.replace(/^\/+/, '')}` : '';
        const fullName = person.full_name || `${person.first_name} ${person.last_name}`;
        
        html += `
        <div class="person-file" style="page-break-inside: avoid; border: 3px solid #27ae60; box-shadow: 0 2px 6px rgba(39,174,96,0.2);">
            <!-- Photo and Basic Info Section at Top -->
            <div style="background: #27ae60; padding: 8px 12px; border-bottom: 3px solid #229954; display: flex; gap: 12px; align-items: center;">
                <!-- Info on Left -->
                <div style="flex: 1;">
                    <div style="color: white; font-size: 12pt; font-weight: bold; margin-bottom: 6px;">?? ${tr.victimNum} #${index + 1}: ${escapeHtml(fullName)}</div>
                    <div style="background: white; padding: 6px; border: 2px solid #229954; border-radius: 3px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
                            <tr>
                                <td style="padding: 2px 6px; width: 18%; font-weight: 600; color: #555;">${tr.id}:</td>
                                <td style="padding: 2px 6px; width: 32%; border-right: 1px solid #ddd;">${escapeHtml(person.national_id || person.id_number || 'N/A')}</td>
                                <td style="padding: 2px 6px; width: 18%; font-weight: 600; color: #555;">${tr.gender}:</td>
                                <td style="padding: 2px 6px; width: 32%;">${escapeHtml(person.gender || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.dob}:</td>
                                <td style="padding: 2px 6px; border-right: 1px solid #ddd;">${formatDate(person.date_of_birth)}</td>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.phone}:</td>
                                <td style="padding: 2px 6px;">${escapeHtml(person.phone || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.email}:</td>
                                <td colspan="3" style="padding: 2px 6px;">${escapeHtml(person.email || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.address}:</td>
                                <td colspan="3" style="padding: 2px 6px;">${escapeHtml(person.address || 'N/A')}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <!-- Photo on Right -->
                <div style="flex-shrink: 0;">
                    ${photoUrl ? `<img src="${photoUrl}" style="width: 85px; height: 105px; object-fit: cover; border: 2px solid white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" onerror="this.style.display='none'">` : 
                                 `<div style="width: 85px; height: 105px; background: white; display: flex; align-items: center; justify-content: center; font-size: 28pt; font-weight: bold; color: #27ae60; border: 2px solid white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${fullName.charAt(0)}</div>`}
                </div>
            </div>
            
            <!-- All Other Sections Below -->
            <div style="padding: 10px 12px; background: #ffffff;">
                
                <!-- Statements & Investigation Notes -->
                ${generatePersonStatementsSection(person, tr)}
                
                <!-- Evidence Collected From This Person -->
                ${generatePersonEvidenceSection(person, tr)}
                
                <!-- Supporting Witnesses -->
                ${generateSupportingWitnessesSection(person, tr)}
            </div>
        </div>
        `;
    });
    
    return html;
}

// Generate statements/notes section for a person
function generatePersonStatementsSection(person, tr) {
    const formatDate = (dateStr, includeTime = true) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    
    let html = `<div style="margin-bottom: 12px;"><div class="subsection-title" style="padding: 6px 10px; font-size: 10pt; margin-bottom: 8px;">?? ${tr.statementsNotes}</div>`;
    
    // Check for both investigation_notes and statementsNotes (for backward compatibility)
    const notes = person.investigation_notes || person.statementsNotes || [];
    
    if (!person.statement && notes.length === 0) {
        html += `<div style="color: #999; font-style: italic; padding: 6px; font-size: 9pt;">${tr.noStatementsRecorded}</div>`;
    } else {
        html += '<table class="info-table">';
        
        // Add statement from case_parties
        if (person.statement) {
            html += `
                <tr>
                    <td style="vertical-align: top; width: 30%;">
                        <strong>${tr.officialStatement}</strong><br>
                        <span style="font-size: 9pt; color: #666;">${person.statement_date ? formatDate(person.statement_date) : tr.dateNotRecorded}</span>
                    </td>
                    <td style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(person.statement)}</td>
                </tr>`;
        }
        
        // Add investigation notes
        if (notes.length > 0) {
            notes.forEach(note => {
                html += `
                <tr>
                    <td style="vertical-align: top; width: 30%;">
                        <strong>${escapeHtml(note.note_type).toUpperCase()}</strong><br>
                        <span style="font-size: 9pt; color: #666;">${formatDate(note.created_at)}</span><br>
                        <span style="font-size: 9pt; color: #666;">${tr.by}: ${escapeHtml(note.investigator_name || tr.unknown)}</span>
                    </td>
                    <td style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(note.note_text)}</td>
                </tr>`;
            });
        }
        
        html += '</table>';
    }
    
    html += '</div>';
    return html;
}

// Generate evidence section for a person
function generatePersonEvidenceSection(person, tr) {
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    
    let html = `<div style="margin-bottom: 12px;"><div class="subsection-title" style="padding: 6px 10px; font-size: 10pt; margin-bottom: 8px;">??? ${tr.evidence}</div>`;
    
    if (person.evidence && person.evidence.length > 0) {
        html += '<table class="info-table" style="font-size: 8pt;">';
        html += '<tr style="background: #f8f9fa; font-size: 8pt;"><td style="padding: 4px 6px;"><strong>#</strong></td><td style="padding: 4px 6px;"><strong>Type</strong></td><td style="padding: 4px 6px;"><strong>Description</strong></td><td style="padding: 4px 6px;"><strong>Date</strong></td></tr>';
        
        person.evidence.forEach((ev, idx) => {
            const typeIcons = { photo: '??', video: '??', audio: '??', document: '??', physical: '??', digital: '??' };
            const icon = typeIcons[ev.evidence_type] || '??';
            
            html += `
            <tr>
                <td style="width: 5%; text-align: center; padding: 4px 6px;">${idx + 1}</td>
                <td style="width: 15%; padding: 4px 6px;">
                    ${icon} ${escapeHtml(ev.evidence_type)}
                </td>
                <td style="width: 55%; padding: 4px 6px;">
                    <strong>${escapeHtml(ev.title || ev.evidence_type)}</strong>
                    ${ev.description ? ` - ${escapeHtml(ev.description)}` : ''}
                </td>
                <td style="width: 25%; padding: 4px 6px;">${formatDate(ev.collected_at)}</td>
            </tr>`;
        });
        
        html += '</table>';
    } else {
        html += `<div style="color: #999; font-style: italic; padding: 6px; font-size: 9pt;">${tr.noEvidenceCollected}</div>`;
    }
    
    html += '</div>';
    return html;
}

// Generate supporting witnesses section
function generateSupportingWitnessesSection(person, tr) {
    const formatDate = (dateStr, includeTime = false) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const options = includeTime ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    
    let html = `<div style="margin-bottom: 12px;"><div class="subsection-title" style="padding: 6px 10px; font-size: 10pt; margin-bottom: 8px;">?? ${tr.supportingWitnesses}</div>`;
    
    if (person.supporting_witnesses && person.supporting_witnesses.length > 0) {
        person.supporting_witnesses.forEach((witness, idx) => {
            const fullName = witness.full_name || `${witness.first_name} ${witness.last_name}`;
            const photoUrl = witness.photo_path ? `${window.location.origin}/${witness.photo_path.replace(/^\/+/, '')}` : '';
            
            html += `
            <div style="border: 2px solid #27ae60; border-radius: 5px; padding: 8px; margin-bottom: 10px; background: #f8fff8;">
                <!-- Witness Header -->
                <div style="display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid #27ae60;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 10pt; color: #27ae60; margin-bottom: 4px;">?? ${tr.witnessNum} #${idx + 1}: ${escapeHtml(fullName)}</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
                            <tr>
                                <td style="padding: 2px 4px; width: 20%; font-weight: 600; color: #555;">${tr.id}:</td>
                                <td style="padding: 2px 4px; width: 30%;">${escapeHtml(witness.national_id || witness.id_number || 'N/A')}</td>
                                <td style="padding: 2px 4px; width: 20%; font-weight: 600; color: #555;">${tr.gender}:</td>
                                <td style="padding: 2px 4px; width: 30%;">${escapeHtml(witness.gender || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 4px; font-weight: 600; color: #555;">${tr.phone}:</td>
                                <td style="padding: 2px 4px;">${escapeHtml(witness.phone || 'N/A')}</td>
                                <td style="padding: 2px 4px; font-weight: 600; color: #555;">${tr.dob}:</td>
                                <td style="padding: 2px 4px;">${formatDate(witness.date_of_birth)}</td>
                            </tr>
                            ${witness.address ? `
                            <tr>
                                <td style="padding: 2px 4px; font-weight: 600; color: #555;">${tr.address}:</td>
                                <td colspan="3" style="padding: 2px 4px;">${escapeHtml(witness.address)}</td>
                            </tr>` : ''}
                        </table>
                    </div>
                    ${photoUrl ? `
                    <div style="flex-shrink: 0;">
                        <img src="${photoUrl}" style="width: 60px; height: 75px; object-fit: cover; border: 2px solid #27ae60; border-radius: 4px;" onerror="this.style.display='none'">
                    </div>` : `
                    <div style="flex-shrink: 0;">
                        <div style="width: 60px; height: 75px; background: #27ae60; color: white; display: flex; align-items: center; justify-content: center; font-size: 20pt; font-weight: bold; border-radius: 4px;">${fullName.charAt(0)}</div>
                    </div>`}
                </div>
                
                <!-- Witness Statements & Notes -->
                ${(witness.statement || (witness.investigation_notes && witness.investigation_notes.length > 0)) ? `
                <div style="margin-bottom: 6px;">
                    <div style="font-weight: 600; font-size: 8.5pt; color: #27ae60; margin-bottom: 4px;">?? ${tr.statementsNotesLabel}:</div>
                    ${witness.statement ? `
                    <div style="background: white; padding: 6px; border-left: 3px solid #27ae60; border-radius: 3px; margin-bottom: 4px;">
                        <div style="font-weight: 600; font-size: 8pt; color: #27ae60;">${tr.officialStatement}:</div>
                        <div style="white-space: pre-wrap; line-height: 1.5; font-size: 8.5pt; margin-top: 3px;">${escapeHtml(witness.statement)}</div>
                    </div>` : ''}
                    ${witness.investigation_notes && witness.investigation_notes.length > 0 ? witness.investigation_notes.map(note => `
                    <div style="background: white; padding: 6px; border-left: 3px solid #f39c12; border-radius: 3px; margin-bottom: 4px;">
                        <div style="font-weight: 600; font-size: 8pt; color: #f39c12;">${escapeHtml(note.note_type.toUpperCase())} - ${formatDate(note.created_at, true)}</div>
                        <div style="font-size: 7.5pt; color: #666;">By: ${escapeHtml(note.investigator_name || 'Unknown')}</div>
                        <div style="white-space: pre-wrap; line-height: 1.5; font-size: 8.5pt; margin-top: 3px;">${escapeHtml(note.note_text)}</div>
                    </div>`).join('') : ''}
                </div>` : ''}
                
                <!-- Witness Evidence -->
                ${witness.evidence && witness.evidence.length > 0 ? `
                <div>
                    <div style="font-weight: 600; font-size: 8.5pt; color: #27ae60; margin-bottom: 4px;">??? EVIDENCE (${witness.evidence.length}):</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; border: 1px solid #ddd;">
                        <tr style="background: #f0f0f0;">
                            <td style="padding: 3px 5px; font-weight: 600; width: 5%;">#</td>
                            <td style="padding: 3px 5px; font-weight: 600; width: 20%;">Type</td>
                            <td style="padding: 3px 5px; font-weight: 600;">Description</td>
                            <td style="padding: 3px 5px; font-weight: 600; width: 20%;">Date</td>
                        </tr>
                        ${witness.evidence.map((ev, evIdx) => {
                            const typeIcons = { photo: '??', video: '??', audio: '??', document: '??', physical: '??', digital: '??' };
                            const icon = typeIcons[ev.evidence_type] || '??';
                            return `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 3px 5px; text-align: center;">${evIdx + 1}</td>
                                <td style="padding: 3px 5px;">${icon} ${escapeHtml(ev.evidence_type)}</td>
                                <td style="padding: 3px 5px;">${escapeHtml(ev.title || ev.description || 'No description')}</td>
                                <td style="padding: 3px 5px;">${formatDate(ev.collected_at)}</td>
                            </tr>`;
                        }).join('')}
                    </table>
                </div>` : ''}
                
                ${!witness.statement && (!witness.investigation_notes || witness.investigation_notes.length === 0) && (!witness.evidence || witness.evidence.length === 0) ? `
                <div style="color: #999; font-style: italic; font-size: 8pt; padding: 4px;">No statements, notes, or evidence recorded for this witness.</div>` : ''}
            </div>`;
        });
    } else {
        html += `<div style="color: #999; font-style: italic; padding: 6px; font-size: 9pt;">${tr.noSupportingWitnesses}</div>`;
    }
    
    html += '</div>';
    return html;
}

// Generate independent witnesses section (full person-centric like accused/victims)
function generateWitnessesSection(witnesses, tr) {
    const formatDate = (dateStr, includeTime = false) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const options = includeTime ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    
    let html = `<h2 class="section-header" style="background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); page-break-before: always; page-break-after: avoid;">??? ${tr.section3Witnesses}</h2>`;
    
    witnesses.forEach((person, index) => {
        const photoUrl = person.photo_path ? `${window.location.origin}/${person.photo_path.replace(/^\/+/, '')}` : '';
        const fullName = person.full_name || `${person.first_name} ${person.last_name}`;
        
        html += `
        <div class="person-file" style="page-break-inside: avoid; border: 3px solid #95a5a6; box-shadow: 0 2px 6px rgba(149,165,166,0.2);">
            <!-- Photo and Basic Info Section at Top -->
            <div style="background: #95a5a6; padding: 8px 12px; border-bottom: 3px solid #7f8c8d; display: flex; gap: 12px; align-items: center;">
                <!-- Info on Left -->
                <div style="flex: 1;">
                    <div style="color: white; font-size: 12pt; font-weight: bold; margin-bottom: 6px;">??? ${tr.witnessNum} #${index + 1}: ${escapeHtml(fullName)}</div>
                    <div style="background: white; padding: 6px; border: 2px solid #7f8c8d; border-radius: 3px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
                            <tr>
                                <td style="padding: 2px 6px; width: 18%; font-weight: 600; color: #555;">${tr.id}:</td>
                                <td style="padding: 2px 6px; width: 32%; border-right: 1px solid #ddd;">${escapeHtml(person.national_id || person.id_number || 'N/A')}</td>
                                <td style="padding: 2px 6px; width: 18%; font-weight: 600; color: #555;">${tr.gender}:</td>
                                <td style="padding: 2px 6px; width: 32%;">${escapeHtml(person.gender || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.dob}:</td>
                                <td style="padding: 2px 6px; border-right: 1px solid #ddd;">${formatDate(person.date_of_birth)}</td>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.phone}:</td>
                                <td style="padding: 2px 6px;">${escapeHtml(person.phone || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.email}:</td>
                                <td colspan="3" style="padding: 2px 6px;">${escapeHtml(person.email || 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 6px; font-weight: 600; color: #555;">${tr.address}:</td>
                                <td colspan="3" style="padding: 2px 6px;">${escapeHtml(person.address || 'N/A')}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <!-- Photo on Right -->
                <div style="flex-shrink: 0;">
                    ${photoUrl ? `<img src="${photoUrl}" style="width: 85px; height: 105px; object-fit: cover; border: 2px solid white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" onerror="this.style.display='none'">` : 
                                 `<div style="width: 85px; height: 105px; background: white; display: flex; align-items: center; justify-content: center; font-size: 28pt; font-weight: bold; color: #95a5a6; border: 2px solid white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${fullName.charAt(0)}</div>`}
                </div>
            </div>
            
            <!-- All Other Sections Below -->
            <div style="padding: 10px 12px; background: #ffffff;">
                
                <!-- Statements & Investigation Notes -->
                ${generatePersonStatementsSection(person, tr)}
                
                <!-- Evidence Collected From This Person -->
                ${generatePersonEvidenceSection(person, tr)}
                
            </div>
        </div>
        `;
    });
    
    return html;
}

// Generate crime scene evidence section
function generateCrimeSceneEvidenceSection(evidence, tr) {
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    
    let html = `<h2 class="section-header" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); page-break-before: always; page-break-after: avoid;">?? ${tr.section4CrimeScene}</h2>`;
    html += '<div style="background: #fef5e7; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #f39c12;">';
    html += '<table class="info-table">';
    html += `<tr style="background: #fff; font-weight: bold;"><td style="width: 5%;">${tr.number}</td><td style="width: 15%;">${tr.type}</td><td style="width: 35%;">${tr.description}</td><td style="width: 20%;">${tr.collected}</td><td style="width: 25%;">${tr.locationCollected}</td></tr>`;
    
    evidence.forEach((ev, idx) => {
        const typeIcons = { photo: '??', video: '??', audio: '??', document: '??', physical: '??', digital: '??' };
        const icon = typeIcons[ev.evidence_type] || '??';
        
        html += `
        <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>
                ${icon} ${escapeHtml(ev.evidence_type)}<br>
                <span style="font-size: 8pt; color: #666;">${escapeHtml(ev.evidence_number)}</span>
            </td>
            <td>
                <strong>${escapeHtml(ev.title || ev.evidence_type)}</strong>
                ${ev.description ? `<br><span style="font-size: 9pt; color: #666;">${escapeHtml(ev.description)}</span>` : ''}
            </td>
            <td style="font-size: 9pt;">${formatDate(ev.collected_at)}</td>
            <td style="font-size: 9pt;">${ev.location_collected ? `?? ${escapeHtml(ev.location_collected)}` : 'N/A'}</td>
        </tr>`;
    });
    
    html += '</table></div>';
    return html;
}

// Generate timeline section
function generateTimelineSection(history, tr) {
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let html = `<h2 class="section-header">${tr.section5Timeline}</h2>`;
    
    if (history && history.length > 0) {
        html += '<div style="padding: 15px; background: #f8f9fa;">';
        history.forEach((entry, idx) => {
            html += `
            <div style="padding: 10px; margin: 10px 0; background: white; border-left: 3px solid #3498db;">
                <div style="font-weight: bold;">${formatDate(entry.changed_at)} - ${escapeHtml(entry.new_status || 'Status Change').toUpperCase().replace(/_/g, ' ')}</div>
                <div style="font-size: 9pt; color: #666;">Changed by: ${escapeHtml(entry.changed_by_name || 'Unknown')}</div>
                ${entry.reason ? `<div style="margin-top: 5px;">${escapeHtml(entry.reason)}</div>` : ''}
            </div>`;
        });
        html += '</div>';
    } else {
        html += '<div style="color: #999; font-style: italic; padding: 15px;">No timeline entries recorded.</div>';
    }
    
    return html;
}

/**
 * Add additional sections to Full Report (Evidence, Witnesses, History, etc.)
 */
function addAdditionalSectionsToFullReport(html, reportData) {
    const { case: caseData, parties, evidence, assignments, history, court_assignment } = reportData;
    
    let additionalHTML = '';
    
    // WITNESSES SECTION
    if (parties.witnesses && parties.witnesses.length > 0) {
        additionalHTML += `
        <!-- Witnesses Section -->
        <div class="report-section">
            <h2 class="section-header">
                <span class="section-icon"></span>
                ${tr.witnesses}
            </h2>
            <div class="section-body">`;
        
        parties.witnesses.forEach((witness, index) => {
            let photoUrl = '';
            if (witness.photo_path) {
                const cleanPath = witness.photo_path.replace(/^\/+/, '');
                photoUrl = `${window.location.origin}/${cleanPath}`;
            }
            
            additionalHTML += `
                <div class="person-card">
                    <div class="person-row">
                        <div class="person-photo-wrapper">
                            ${witness.photo_path ? 
                                `<img src="${photoUrl}" alt="${escapeHtml(witness.full_name)}" class="person-photo" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                                <div class="photo-placeholder-fallback" style="display:none;">${witness.full_name.charAt(0).toUpperCase()}</div>` :
                                `<div class="photo-placeholder-fallback">${witness.full_name.charAt(0).toUpperCase()}</div>`
                            }
                        </div>
                        <div class="person-info">
                            <h4 class="person-name">${escapeHtml(witness.full_name)}</h4>
                            <div class="person-details-grid">
                                ${witness.id_number ? `<div class="info-pair">
                                    <span class="info-label">${tr.id}:</span>
                                    <span class="info-value">${escapeHtml(witness.id_number)}</span>
                                </div>` : ''}
                                ${witness.gender ? `<div class="info-pair">
                                    <span class="info-label">${tr.gender}:</span>
                                    <span class="info-value">${escapeHtml(witness.gender)}</span>
                                </div>` : ''}
                                ${witness.phone ? `<div class="info-pair">
                                    <span class="info-label">${tr.phone}:</span>
                                    <span class="info-value">${escapeHtml(witness.phone)}</span>
                                </div>` : ''}
                                ${witness.address ? `<div class="info-pair">
                                    <span class="info-label">${tr.address}:</span>
                                    <span class="info-value">${escapeHtml(witness.address)}</span>
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                    ${witness.statement ? `<div class="person-statement">
                        <div class="statement-label">Statement:</div>
                        <div class="statement-text">${escapeHtml(witness.statement).replace(/\n/g, '<br>')}</div>
                    </div>` : ''}
                </div>`;
        });
        
        additionalHTML += `
            </div>
        </div>`;
    }
    
    // EVIDENCE SECTION
    if (evidence && evidence.length > 0) {
        additionalHTML += `
        <!-- Evidence Section -->
        <div class="report-section">
            <h2 class="section-header">
                <span class="section-icon"></span>
                ${tr.evidenceInventory}
            </h2>
            <div class="section-body">
                <table>
                    <thead>
                        <tr>
                            <th>${tr.number}</th>
                            <th>${tr.type}</th>
                            <th>${tr.description}</th>
                            <th>${tr.collectedDate}</th>
                            <th>${tr.collectedBy}</th>
                            <th>${tr.storageLocation}</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        evidence.forEach((item, index) => {
            additionalHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${escapeHtml(item.evidence_type || 'N/A')}</td>
                            <td>${escapeHtml(item.description || 'N/A')}</td>
                            <td>${item.collected_at ? new Date(item.collected_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</td>
                            <td>${escapeHtml(item.collected_by || 'N/A')}</td>
                            <td>${escapeHtml(item.location_collected || 'N/A')}</td>
                        </tr>`;
        });
        
        additionalHTML += `
                    </tbody>
                </table>
            </div>
        </div>`;
    }
    
    // CASE HISTORY/TIMELINE SECTION
    if (history && history.length > 0) {
        additionalHTML += `
        <!-- Case History Section -->
        <div class="report-section">
            <h2 class="section-header">
                <span class="section-icon"></span>
                ${tr.caseHistory}
            </h2>
            <div class="section-body">
                <table>
                    <thead>
                        <tr>
                            <th>${tr.dateTime}</th>
                            <th>${tr.statusChange}</th>
                            <th>${tr.changedBy}</th>
                            <th>${tr.notes}</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        history.forEach((entry) => {
            additionalHTML += `
                        <tr>
                            <td>${new Date(entry.changed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td><strong>${escapeHtml(entry.new_status || 'N/A').toUpperCase().replace(/_/g, ' ')}</strong></td>
                            <td>${escapeHtml(entry.changed_by_name || 'N/A')}</td>
                            <td>${escapeHtml(entry.notes || '-')}</td>
                        </tr>`;
        });
        
        additionalHTML += `
                    </tbody>
                </table>
            </div>
        </div>`;
    }
    
    // Insert additional sections before footer
    const footerStart = html.indexOf('<!-- Footer -->');
    if (footerStart !== -1) {
        html = html.substring(0, footerStart) + additionalHTML + html.substring(footerStart);
    } else {
        // If no footer marker, append before closing report-body
        const bodyEnd = html.lastIndexOf('</div>\n        \n        </div>\n    </div>');
        if (bodyEnd !== -1) {
            html = html.substring(0, bodyEnd) + additionalHTML + html.substring(bodyEnd);
        }
    }
    
    return html;
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text) {
    if (!text) return 'N/A';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generate Printable HTML from Report Data (Basic Report)
 */
async function generatePrintableHTML(reportData, language = 'en') {
    const { case: caseData, parties, evidence, assignments, history, court_assignment, created_by } = reportData;
    
    // Get translations for selected language
    const tr = translations[language] || translations.en;
    
    // Helper function to escape HTML
    const esc = (str) => {
        if (!str) return 'N/A';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    // Helper function to build detailed person card with ALL information
    const buildDetailedPersonCard = (person, index) => {
        let photoUrl = '';
        if (person.photo_path) {
            const cleanPath = person.photo_path.replace(/^\/+/, '');
            photoUrl = `${window.location.origin}/${cleanPath}`;
        }
        
        return `
        <div class="person-card">
            <div class="person-row">
                <div class="person-photo-wrapper">
                    ${person.photo_path ? 
                        `<img src="${photoUrl}" alt="${esc(person.full_name)}" class="person-photo" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div class="photo-placeholder-fallback" style="display:none;">${person.full_name.charAt(0).toUpperCase()}</div>` :
                        `<div class="photo-placeholder-fallback">${person.full_name.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="person-info">
                    <h4 class="person-name">${esc(person.full_name)}</h4>
                    <div class="person-details-grid">
                        ${person.id_number ? `<div class="info-pair">
                            <span class="info-label">${tr.id}:</span>
                            <span class="info-value">${esc(person.id_number)}</span>
                        </div>` : ''}
                        ${person.gender ? `<div class="info-pair">
                            <span class="info-label">${tr.gender}:</span>
                            <span class="info-value">${esc(person.gender)}</span>
                        </div>` : ''}
                        ${person.date_of_birth ? `<div class="info-pair">
                            <span class="info-label">${tr.dob}:</span>
                            <span class="info-value">${formatDate(person.date_of_birth)}</span>
                        </div>` : ''}
                        ${person.phone ? `<div class="info-pair">
                            <span class="info-label">${tr.phone}:</span>
                            <span class="info-value">${esc(person.phone)}</span>
                        </div>` : ''}
                        ${person.email ? `<div class="info-pair">
                            <span class="info-label">${tr.email}:</span>
                            <span class="info-value">${esc(person.email)}</span>
                        </div>` : ''}
                        ${person.address ? `<div class="info-pair">
                            <span class="info-label">${tr.address}:</span>
                            <span class="info-value">${esc(person.address)}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
            
            ${person.party_statement || person.statement ? `
            <div class="person-statement">
                <div class="statement-label">Statement:</div>
                <div class="statement-text">${esc(person.party_statement || person.statement).replace(/\n/g, '<br>')}</div>
            </div>` : ''}
            
            ${person.party_role === 'witness' && person.affiliated_person && person.affiliated_person.full_name ? `
            <div class="person-statement" style="background: #e8f4f8;">
                <div class="statement-label">Witness Affiliation:</div>
                <div class="statement-text">
                    <strong>Affiliated with:</strong> ${esc(person.affiliated_person.full_name)}<br>
                    <strong>${tr.type}:</strong> ${esc(person.witness_affiliation || 'Neutral')}
                </div>
            </div>` : ''}
            
            ${person.custody && person.custody.length > 0 ? `
            <div class="person-statement" style="background: #fff3cd; border-left: 4px solid #856404;">
                <div class="statement-label">Custody Information:</div>
                <div class="statement-text">
                    ${person.custody.map((custody, idx) => `
                        <div style="margin-bottom: 15px; padding-bottom: 15px; ${idx < person.custody.length - 1 ? 'border-bottom: 1px solid #ddd;' : ''}">
                            <strong>Status:</strong> ${esc(custody.status).toUpperCase().replace(/_/g, ' ')}<br>
                            <strong>Booked By:</strong> ${esc(custody.booked_by_name || 'N/A')}<br>
                            <strong>Booked At:</strong> ${formatDate(custody.booked_at, true)}<br>
                            ${custody.custody_location ? `<strong>Location:</strong> ${esc(custody.custody_location)}<br>` : ''}
                            ${custody.release_date ? `<strong>Released:</strong> ${formatDate(custody.release_date, true)}<br>` : ''}
                            ${custody.bail_first_name ? `<strong>Bailed To:</strong> ${esc(custody.bail_first_name + ' ' + custody.bail_last_name)}<br>` : ''}
                            ${custody.notes ? `<strong>Notes:</strong> ${esc(custody.notes)}` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
            
            ${person.investigation_notes && person.investigation_notes.length > 0 ? `
            <div class="person-statement" style="background: #fff3cd; border-left: 4px solid #856404;">
                <div class="statement-label">Investigation Notes & Statements:</div>
                <div class="statement-text">
                    ${person.investigation_notes.map((note, idx) => {
                        return `<div style="margin-bottom: 15px; padding-bottom: 15px; ${idx < person.investigation_notes.length - 1 ? 'border-bottom: 1px solid #ddd;' : ''}">
                            <strong>${esc(note.note_type || 'Note').toUpperCase()}</strong> - ${formatDate(note.created_at, true)}<br>
                            <em>By: ${esc(note.investigator_name || 'Unknown')}${note.badge_number ? ' (Badge: ' + esc(note.badge_number) + ')' : ''}</em><br>
                            <div style="margin-top: 8px; white-space: pre-wrap;">${esc(note.note_text)}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}
            
            ${person.evidence && person.evidence.length > 0 ? `
            <div class="person-statement" style="background: #d4edda; border-left: 4px solid #155724;">
                <div class="statement-label">Evidence Collected From This Person:</div>
                <div class="statement-text">
                    ${person.evidence.map((ev, idx) => {
                        let evidenceHTML = `<div style="margin-bottom: 15px; padding-bottom: 15px; ${idx < person.evidence.length - 1 ? 'border-bottom: 1px solid #ddd;' : ''}">
                            <strong>${idx + 1}. ${esc(ev.title || ev.evidence_type || tr.evidenceItem)}</strong>
                            <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 3px; font-size: 9pt; margin-left: 10px;">${esc(ev.evidence_type).toUpperCase()}</span><br>
                            ${ev.description ? `<strong>${tr.description}:</strong> ${esc(ev.description)}<br>` : ''}
                            <strong>${tr.collected}:</strong> ${formatDate(ev.collected_at, true)}${ev.collected_by_name ? ` ${tr.by} ${esc(ev.collected_by_name)}` : ''}<br>
                            ${ev.location_collected ? `<strong>${tr.locationCollected}:</strong> ${esc(ev.location_collected)}<br>` : ''}`;
                        
                        // Display file based on evidence type - EMBEDDED IN REPORT
                        if (ev.file_path) {
                            // Use blob URL if available, otherwise fall back to file path
                            const fileUrl = ev.blob_url || (window.location.origin + '/' + ev.file_path.replace(/^\/+/, ''));
                            const fileName = ev.file_path.split('/').pop();
                            const fileExtension = fileName.split('.').pop().toLowerCase();
                            
                            if (ev.evidence_type === 'photo') {
                                // Display photo evidence INLINE
                                evidenceHTML += '<div style="margin-top: 15px; text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px;">' +
                                    '<img src="' + fileUrl + '" alt="Evidence Photo" ' +
                                         'style="max-width: 100%; height: auto; border: 3px solid #28a745; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" ' +
                                         'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';" />' +
                                    '<div style="display:none; padding: 15px; background: #f8d7da; border: 2px solid #f5c6cb; border-radius: 8px; color: #721c24;">' +
                                        '?? Image not available: ' + esc(fileName) +
                                    '</div>' +
                                '</div>';
                            } else if (ev.evidence_type === 'video') {
                                // Display video EMBEDDED with HTML5 player
                                evidenceHTML += '<div style="margin-top: 15px; background: #000; padding: 10px; border-radius: 8px; border: 3px solid #0c5460;">' +
                                    '<video controls style="width: 100%; max-height: 400px; border-radius: 4px;" preload="metadata">' +
                                        '<source src="' + fileUrl + '" type="video/mp4">' +
                                        '<source src="' + fileUrl + '" type="video/webm">' +
                                        '<source src="' + fileUrl + '" type="video/ogg">' +
                                        'Your browser does not support the video tag.' +
                                    '</video>' +
                                    '<div style="text-align: center; color: white; margin-top: 8px; font-size: 10pt;">?? ' + esc(fileName) + '</div>' +
                                '</div>';
                            } else if (ev.evidence_type === 'audio') {
                                // Display audio EMBEDDED with HTML5 player
                                evidenceHTML += '<div style="margin-top: 15px; padding: 15px; background: #f3e5f5; border: 2px solid #6f42c1; border-radius: 8px;">' +
                                    '<div style="font-weight: bold; margin-bottom: 10px; color: #6f42c1;">?? Audio Recording: ' + esc(fileName) + '</div>' +
                                    '<audio controls style="width: 100%;" preload="metadata">' +
                                        '<source src="' + fileUrl + '" type="audio/mpeg">' +
                                        '<source src="' + fileUrl + '" type="audio/wav">' +
                                        '<source src="' + fileUrl + '" type="audio/ogg">' +
                                        'Your browser does not support the audio tag.' +
                                    '</audio>' +
                                '</div>';
                            } else if (ev.evidence_type === 'document') {
                                // Display document EMBEDDED - PDF in iframe, others as image or link
                                if (fileExtension === 'pdf') {
                                    // Embed PDF viewer (shows in browser, hidden in print with message)
                                    evidenceHTML += '<div style="margin-top: 15px; border: 3px solid #ffc107; border-radius: 8px; overflow: hidden;">' +
                                        '<div style="background: #fff3cd; padding: 10px; font-weight: bold; color: #856404;">?? PDF Document: ' + esc(fileName) + '</div>' +
                                        '<iframe src="' + fileUrl + '" style="width: 100%; height: 600px; border: none;" type="application/pdf"></iframe>' +
                                        '<p style="display: none; padding: 15px; background: #fff3cd; color: #856404; text-align: center; border-top: 2px dashed #ffc107;">' +
                                            '?? PDF Document: <strong>' + esc(fileName) + '</strong><br>' +
                                            '<em style="font-size: 9pt;">(PDF content viewable in browser version - not embedded in print)</em>' +
                                        '</p>' +
                                    '</div>';
                                } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                                    // Display image document
                                    evidenceHTML += '<div style="margin-top: 15px; text-align: center; background: #fff3cd; padding: 15px; border: 3px solid #ffc107; border-radius: 8px;">' +
                                        '<div style="font-weight: bold; margin-bottom: 10px; color: #856404;">?? Document Image: ' + esc(fileName) + '</div>' +
                                        '<img src="' + fileUrl + '" alt="Document" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 4px;" />' +
                                    '</div>';
                                } else {
                                    // Other document types - show link
                                    evidenceHTML += '<div style="margin-top: 15px; padding: 15px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">' +
                                        '<div style="display: flex; align-items: center; gap: 10px;">' +
                                            '<i class="fas fa-file-alt" style="font-size: 32pt; color: #856404;"></i>' +
                                            '<div>' +
                                                '<strong>Document:</strong> ' + esc(fileName) + '<br>' +
                                                '<a href="' + fileUrl + '" target="_blank" style="color: #007bff; text-decoration: underline; font-weight: bold;">?? Download/View Document</a>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>';
                                }
                            } else {
                                // Display generic file with icon
                                evidenceHTML += '<div style="margin-top: 15px; padding: 15px; background: #e9ecef; border: 2px solid #6c757d; border-radius: 8px;">' +
                                    '<div style="display: flex; align-items: center; gap: 10px;">' +
                                        '<i class="fas fa-file" style="font-size: 32pt; color: #6c757d;"></i>' +
                                        '<div>' +
                                            '<strong>File:</strong> ' + esc(fileName) + '<br>' +
                                            '<a href="' + fileUrl + '" target="_blank" style="color: #007bff; text-decoration: underline; font-weight: bold;">?? Download/View File</a>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>';
                            }
                        }
                        
                        evidenceHTML += `</div>`;
                        return evidenceHTML;
                    }).join('')}
                </div>
            </div>` : ''}
            
            ${person.supporting_witnesses && person.supporting_witnesses.length > 0 ? `
            <div class="person-statement" style="background: #d1ecf1; border-left: 4px solid #0c5460;">
                <div class="statement-label">Witnesses Supporting This Person:</div>
                <div class="statement-text">
                    ${person.supporting_witnesses.map((witness, idx) => {
                        const witnessName = witness.full_name || `${witness.first_name} ${witness.last_name}`;
                        const witnessPhoto = witness.photo_path ? window.location.origin + '/' + witness.photo_path.replace(/^\/+/, '') : null;
                        
                        return `<div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px; ${idx < person.supporting_witnesses.length - 1 ? 'border-bottom: 2px solid #0c5460;' : ''}">
                            <div style="display: flex; gap: 15px; align-items: start;">
                                ${witnessPhoto ? `
                                    <img src="${witnessPhoto}" alt="Witness Photo" 
                                         style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #0c5460; object-fit: cover;" 
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                                    <div style="display: none; width: 80px; height: 80px; border-radius: 50%; background: #17a2b8; color: white; align-items: center; justify-content: center; font-size: 24pt; font-weight: bold;">
                                        ${witnessName.charAt(0).toUpperCase()}
                                    </div>
                                ` : `
                                    <div style="width: 80px; height: 80px; border-radius: 50%; background: #17a2b8; color: white; display: flex; align-items: center; justify-content: center; font-size: 24pt; font-weight: bold; flex-shrink: 0;">
                                        ${witnessName.charAt(0).toUpperCase()}
                                    </div>
                                `}
                                <div style="flex: 1;">
                                    <div style="font-size: 14pt; font-weight: bold; color: #0c5460; margin-bottom: 8px;">
                                        ?? Witness #${idx + 1}: ${esc(witnessName)}
                                    </div>
                                    ${witness.national_id ? `<div style="margin-bottom: 5px;"><strong>ID:</strong> ${esc(witness.national_id)}</div>` : ''}
                                    ${witness.phone ? `<div style="margin-bottom: 5px;"><strong>Phone:</strong> ${esc(witness.phone)}</div>` : ''}
                                    ${witness.address ? `<div style="margin-bottom: 5px;"><strong>Address:</strong> ${esc(witness.address)}</div>` : ''}
                                    ${witness.gender ? `<div style="margin-bottom: 5px;"><strong>Gender:</strong> ${esc(witness.gender)}</div>` : ''}
                                    
                                    ${witness.statement ? `
                                        <div style="margin-top: 12px; padding: 12px; background: #e7f3ff; border-left: 4px solid #17a2b8; border-radius: 4px;">
                                            <div style="font-weight: bold; color: #0c5460; margin-bottom: 8px;">?? Witness Statement:</div>
                                            <div style="white-space: pre-wrap; line-height: 1.6;">${esc(witness.statement)}</div>
                                            ${witness.statement_date ? `<div style="margin-top: 8px; font-size: 9pt; color: #666;"><em>Statement Date: ${formatDate(witness.statement_date, true)}</em></div>` : ''}
                                        </div>
                                    ` : '<div style="margin-top: 10px; font-style: italic; color: #999;">No statement recorded</div>'}
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}
        </div>
        `;
    };
    
    // Helper function to format date
    const formatDate = (dateStr, includeTime = false) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const options = includeTime 
            ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            : { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    
    // Generate parties HTML with photos - Corporate Style WITH ALL DETAILS
    const generatePartiesHTML = (partyList, title, iconClass) => {
        if (!partyList || partyList.length === 0) return '';
        
        const cards = partyList.map((party, index) => {
            return buildDetailedPersonCard(party, index);
        }).join('');
        
        /* OLD CODE - REPLACED WITH DETAILED VERSION */
        /*
        const cards_OLD = partyList.map((party, index) => {
            // Construct proper image URL
            let photoUrl = '';
            if (party.photo_path) {
                // If photo_path starts with http/https, use as is
                if (party.photo_path.startsWith('http')) {
                    photoUrl = party.photo_path;
                } else {
                    // Database already stores full path like "uploads/persons/file.jpg"
                    // Just add the origin
                    const cleanPath = party.photo_path.replace(/^\/+/, ''); // Remove leading slashes
                    photoUrl = `${window.location.origin}/${cleanPath}`;
                }
            }
            
            console.log('Photo URL for', party.full_name, ':', photoUrl); // Debug log
            
            return `
            <div class="person-card">
                <div class="person-row">
                    <div class="person-photo-wrapper">
                        ${party.photo_path ? 
                            `<img src="${photoUrl}" alt="${esc(party.full_name)}" class="person-photo" 
                                 onerror="console.error('Failed to load image:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                                 onload="console.log('Image loaded successfully:', this.src);" />
                            <div class="photo-placeholder-fallback" style="display:none;">${party.full_name.charAt(0).toUpperCase()}</div>` :
                            `<div class="photo-placeholder-fallback">${party.full_name.charAt(0).toUpperCase()}</div>`
                        }
                    </div>
                    <div class="person-info">
                        <h4 class="person-name">${esc(party.full_name)}</h4>
                        <div class="person-details-grid">
                            ${party.id_number ? `<div class="info-pair">
                                <span class="info-label">${tr.id}:</span>
                                <span class="info-value">${esc(party.id_number)}</span>
                            </div>` : ''}
                            ${party.gender ? `<div class="info-pair">
                                <span class="info-label">${tr.gender}:</span>
                                <span class="info-value">${esc(party.gender)}</span>
                            </div>` : ''}
                            ${party.phone ? `<div class="info-pair">
                                <span class="info-label">${tr.phone}:</span>
                                <span class="info-value">${esc(party.phone)}</span>
                            </div>` : ''}
                            ${party.address ? `<div class="info-pair">
                                <span class="info-label">${tr.address}:</span>
                                <span class="info-value">${esc(party.address)}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                ${party.statement ? `<div class="person-statement">
                    <div class="statement-label">${tr.statement}:</div>
                    <div class="statement-text">${esc(party.statement)}</div>
                </div>` : ''}
            </div>
        `}).join('');
        */
        
        return `
            <div class="report-section">
                <h2 class="section-header">
                    <span class="section-icon ${iconClass}"></span>
                    ${title}
                </h2>
                <div class="section-body">
                    ${cards}
                </div>
            </div>
        `;
    };
    
    // Get custom settings from database (with localStorage fallback)
    let headerImage = '';
    let statement1 = '';
    let statement2 = '';
    let statement3 = '';
    let footerText = '';
    
    try {
        const response = await fetch('/api/report-settings');
        const result = await response.json();
        
        if (result.status === 'success') {
            const settings = result.data;
            headerImage = settings.header_image ? `/uploads/${settings.header_image}` : '';
            // Use BASIC report statements (this is for generatePrintableHTML - Basic Report)
            statement1 = settings.basic_statement1 || settings.statement1 || '';
            statement2 = settings.basic_statement2 || settings.statement2 || '';
            statement3 = settings.basic_statement3 || settings.statement3 || '';
            footerText = settings.basic_footer_text || settings.footer_text || '';
        } else {
            // Fallback to localStorage
            const localSettings = JSON.parse(localStorage.getItem('reportSettings') || '{}');
            headerImage = localSettings.headerImage || '';
            statement1 = localSettings.statement1 || '';
            statement2 = localSettings.statement2 || '';
            statement3 = localSettings.statement3 || '';
            footerText = localSettings.footerText || '';
        }
    } catch (error) {
        console.error('Error loading settings from database:', error);
        // Fallback to localStorage
        const localSettings = JSON.parse(localStorage.getItem('reportSettings') || '{}');
        headerImage = localSettings.headerImage || '';
        statement1 = localSettings.statement1 || '';
        statement2 = localSettings.statement2 || '';
        statement3 = localSettings.statement3 || '';
        footerText = localSettings.footerText || '';
    }
    
    // Generate HTML
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Case Report - ${esc(caseData.case_number)}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page { 
            margin: 0.75cm; 
            size: A4 portrait;
        }
        
        body { 
            font-family: 'Georgia', 'Times New Roman', serif; 
            line-height: 1.4; 
            color: #1a1a1a; 
            background: #f5f5f5; 
            padding: 0;
            font-size: 10pt;
        }
        
        .report-container { 
            max-width: 210mm; 
            margin: 20px auto; 
            background: white; 
            box-shadow: 0 0 30px rgba(0,0,0,0.1);
        }
        
        /* Header Letterhead */
        .report-letterhead {
            background: white;
            padding: 0;
            border: none;
            position: relative;
            width: 100%;
            overflow: hidden;
        }
        
        .letterhead-image {
            width: 100%;
            height: auto;
            display: block;
            object-fit: contain;
        }
        
        .no-header-placeholder {
            padding: 40px;
            text-align: center;
            background: #f5f5f5;
            border-bottom: 3px solid #ddd;
        }
        
        .no-header-placeholder i {
            font-size: 48px;
            color: #999;
            margin-bottom: 15px;
        }
        
        .no-header-placeholder p {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }
        
        /* Case Numbers Section */
        .case-numbers-section { 
            background: white;
            padding: 12px 40px;
            border-bottom: 1px solid #ddd;
        }
        
        .case-numbers-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .case-numbers-left {
            display: flex;
            gap: 40px;
        }
        
        .case-number-item h3 {
            font-size: 11px;
            color: #666;
            font-weight: 600;
            margin-bottom: 3px;
            font-family: 'Arial', sans-serif;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        
        .case-number-item p {
            font-size: 15px;
            font-weight: 700;
            color: #000;
        }
        
        .report-date {
            text-align: right;
        }
        
        .report-date h3 {
            font-size: 11px;
            color: #666;
            font-weight: 600;
            margin-bottom: 3px;
            font-family: 'Arial', sans-serif;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        
        .report-date p {
            font-size: 15px;
            font-weight: 700;
            color: #000;
        }
        
        /* Statements Section */
        .statements-section {
            background: white;
            padding: 15px 40px;
            border-bottom: 1px solid #ddd;
        }
        
        .statement-1-2 {
            margin-bottom: 15px;
        }
        
        .statement-box {
            margin-bottom: 3px;
            line-height: 1.4;
            color: #000;
            font-size: 13px;
            font-weight: 700;
        }
        
        .statement-box:last-child {
            margin-bottom: 0;
        }
        
        .statement-separator {
            margin: 15px 0 0 0;
            padding: 12px 0;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
        }
        
        .statement-3 {
            text-align: center;
            font-weight: 700;
            text-decoration: underline;
            color: #000;
            font-size: 13px;
            line-height: 1.4;
        }
        
        .report-body { 
            padding: 20px 40px; 
        }
        
        /* Meta Information */
        .report-meta { 
            background: #fafafa; 
            border: 1px solid #e0e0e0;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .meta-title {
            font-size: 14px;
            font-weight: 700;
            color: #666;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-family: 'Arial', sans-serif;
        }
        
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        
        .meta-item {
            display: flex;
            flex-direction: column;
        }
        
        .meta-label {
            font-size: 11px;
            color: #666;
            font-weight: 600;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-family: 'Arial', sans-serif;
        }
        
        .meta-value {
            font-size: 15px;
            color: #1a1a1a;
            font-weight: 500;
        }
        
        /* Sections */
        .report-section { 
            margin-bottom: 15px; 
            page-break-inside: avoid;
            orphans: 3;
            widows: 3;
        }
        
        .section-header { 
            font-size: 13pt; 
            font-weight: 700; 
            color: #1a1a1a;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #1a1a1a;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .section-icon {
            width: 8px;
            height: 8px;
            background: #c9b037;
            display: inline-block;
        }
        
        .section-body { }
        
        /* Description */
        .description-box { 
            background: white;
            border-left: 4px solid #c9b037; 
            padding: 15px 20px;
            font-size: 13px;
            line-height: 1.6;
            color: #333;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        /* Person Cards */
        .person-card { 
            background: white; 
            border: 1px solid #e0e0e0;
            margin-bottom: 12px; 
            page-break-inside: avoid;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            orphans: 2;
            widows: 2;
        }
        
        .person-row {
            display: flex;
            padding: 15px;
            gap: 15px;
            align-items: flex-start;
        }
        
        .person-photo-wrapper { 
            width: 80px; 
            height: 100px; 
            flex-shrink: 0;
            border: 2px solid #1a1a1a;
            overflow: hidden;
            background: #f5f5f5;
        }
        
        .person-photo { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            display: block;
        }
        
        .photo-placeholder-fallback { 
            width: 100%; 
            height: 100%; 
            background: #1a1a1a;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 32px; 
            font-weight: 700;
            font-family: 'Arial', sans-serif;
        }
        
        .person-info { 
            flex: 1; 
        }
        
        .person-name { 
            font-size: 13pt; 
            color: #1a1a1a; 
            margin-bottom: 8px; 
            font-weight: 700;
        }
        
        .person-details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }
        
        .info-pair {
            display: flex;
            gap: 8px;
        }
        
        .info-label { 
            font-size: 12px; 
            color: #666;
            font-weight: 700;
            min-width: 70px;
            font-family: 'Arial', sans-serif;
        }
        
        .info-value { 
            font-size: 13px; 
            color: #1a1a1a;
            font-weight: 500;
        }
        
        .person-statement {
            padding: 12px 15px;
            background: #fafafa;
            border-top: 1px solid #e0e0e0;
        }
        
        .statement-label {
            font-size: 12px;
            color: #666;
            font-weight: 700;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-family: 'Arial', sans-serif;
        }
        
        .statement-text {
            font-size: 14px;
            line-height: 1.8;
            color: #333;
        }
        
        /* Tables */
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        table th { 
            background: #1a1a1a;
            color: white; 
            padding: 15px 20px; 
            text-align: left; 
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-family: 'Arial', sans-serif;
        }
        
        table td { 
            padding: 15px 20px; 
            border-bottom: 1px solid #e0e0e0;
            font-size: 14px;
        }
        
        table tr:hover { 
            background: #fafafa; 
        }
        
        /* Print Button */
        .print-btn { 
            position: fixed; 
            top: 30px; 
            right: 30px; 
            padding: 12px 30px; 
            background: #1a1a1a;
            color: white; 
            border: 2px solid #c9b037;
            cursor: pointer; 
            font-size: 14px; 
            font-weight: 700;
            z-index: 1000;
            font-family: 'Arial', sans-serif;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        
        .print-btn:hover { 
            background: #c9b037;
            color: #1a1a1a;
        }
        
        /* Footer */
        .report-footer { 
            margin-top: 20px;
            padding: 25px 40px; 
            background: white;
            border-top: 2px solid #000;
            page-break-inside: avoid;
        }
        
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 40px;
        }
        
        .footer-left {
            flex: 1;
            color: #000;
        }
        
        .footer-text {
            font-size: 13px;
            line-height: 1.8;
            color: #000;
            white-space: pre-line;
        }
        
        .footer-right {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        
        .qr-code-container {
            width: 150px;
            height: 150px;
            border: 2px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            padding: 10px;
        }
        
        .qr-code-container canvas {
            width: 100%;
            height: 100%;
        }
        
        .qr-label {
            font-size: 11px;
            color: #666;
            text-align: center;
            font-weight: 600;
        }
        
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-shadow: none !important;
            }
            
            @page { 
                margin: 0.3cm; 
                size: A4 portrait;
            }
            
            body { 
                background: white; 
                padding: 0 !important;
                font-size: 8pt !important;
                line-height: 1.2 !important;
                margin: 0 !important;
            }
            
            .report-container {
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                max-width: 100% !important;
                width: 100% !important;
                page-break-after: auto;
            }
            
            /* Add padding to all children except header */
            .report-body,
            .case-numbers-section,
            .statements-section,
            .report-meta,
            .parties-section {
                padding-left: 5px !important;
                padding-right: 5px !important;
            }
            
            .print-btn { 
                display: none !important; 
            }
            .report-letterhead {
                page-break-after: avoid !important;
                padding: 0 !important;
                margin: 0 0 2px 0 !important;
                width: 100% !important;
                height: 90px !important;
                overflow: hidden !important;
            }
            .letterhead-image {
                width: 100% !important;
                height: 100% !important;
                max-height: none !important;
                min-height: 90px !important;
                object-fit: cover !important; /* Fill the entire width and height */
                object-position: center center !important;
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .no-header-placeholder {
                padding: 8px !important;
            }
            .no-header-placeholder i {
                font-size: 18px !important;
            }
            .no-header-placeholder p {
                font-size: 8px !important;
            }
            .case-numbers-section {
                padding: 5px 10px !important;
                margin: 0 !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                display: block !important;
                visibility: visible !important;
                background: #f8f9fa !important;
                border-bottom: 2px solid #dee2e6 !important;
                overflow: visible !important;
                width: 100% !important;
            }
            .case-numbers-row {
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
                width: 100% !important;
            }
            .case-numbers-left {
                flex: 1 !important;
                min-width: 0 !important;
            }
            .case-numbers-left {
                gap: 8px !important;
                display: flex !important;
                flex-direction: column !important;
            }
            .report-date {
                text-align: right !important;
            }
            .case-number-item, .report-date {
                display: block !important;
                margin-bottom: 4px !important;
            }
            .case-number-item h3, .report-date h3 {
                font-size: 8px !important;
                margin-bottom: 2px !important;
                color: #666 !important;
                font-weight: 600 !important;
            }
            .case-number-item p, .report-date p {
                font-size: 11px !important;
                font-weight: 700 !important;
                color: #000 !important;
            }
            .statements-section {
                padding: 4px 10px !important;
                margin: 0 !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                page-break-inside: avoid !important;
                display: block !important;
                visibility: visible !important;
                overflow: visible !important;
                width: 100% !important;
            }
            .statement-1-2 {
                margin-bottom: 2px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 2px !important;
            }
            .statement-box {
                font-size: 8px !important;
                margin-bottom: 0 !important;
                line-height: 1.1 !important;
                padding: 2px 4px !important;
            }
            .statement-3 {
                font-size: 8px !important;
                line-height: 1.1 !important;
                padding: 2px 4px !important;
                margin-top: 2px !important;
            }
            .statement-separator {
                margin: 2px 0 !important;
                padding: 1px 0 !important;
                height: 1px !important;
            }
            .report-body {
                padding: 4px 10px !important;
                margin-top: 0 !important;
            }
            .report-meta {
                padding: 3px !important;
                margin-bottom: 2px !important;
                margin-top: 0 !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                border: 1px solid #ddd !important;
            }
            .meta-title {
                font-size: 8pt !important;
                margin-bottom: 2px !important;
                padding: 1px 3px !important;
                background: #f5f5f5 !important;
            }
            .meta-grid {
                gap: 1px !important;
                grid-template-columns: repeat(3, 1fr) !important; /* 3 columns for more compact */
                font-size: 7pt !important;
            }
            .meta-item {
                margin-bottom: 0px !important;
                padding: 1px !important;
            }
            .meta-label {
                font-size: 6.5pt !important;
                margin-bottom: 0px !important;
                display: inline !important;
            }
            .meta-value {
                font-size: 7pt !important;
                display: inline !important;
            }
            /* Inline label:value format for compactness */
            .meta-item {
                display: block !important;
            }
            .description-box {
                font-size: 7pt !important;
                line-height: 1.1 !important;
                padding: 3px !important;
                margin: 1px 0 !important;
            }
            
            /* COMPACT CONCLUSIONS SECTION */
            .conclusion-card, 
            div[style*="background: #fff9e6"],
            div[style*="border: 3px solid #e74c3c"] {
                padding: 3px !important;
                margin: 2px 0 !important;
                page-break-inside: avoid !important;
            }
            
            .conclusion-card h2,
            .conclusion-card h4 {
                font-size: 8pt !important;
                margin: 1px 0 !important;
                padding: 2px !important;
            }
            
            .conclusion-card div[style*="margin-bottom"] {
                margin-bottom: 2px !important;
                padding-bottom: 2px !important;
                font-size: 6.5pt !important;
            }
            
            .conclusion-card div[style*="padding: 15px"] {
                padding: 2px !important;
                font-size: 7pt !important;
                line-height: 1.1 !important;
            }
            
            .conclusion-card div[style*="font-weight: bold"] {
                font-size: 6.5pt !important;
                margin-bottom: 1px !important;
            }
            
            /* COMPACT PERSON CARDS FOR PRINT */
            .person-card {
                padding: 4px !important;
                margin: 2px 0 !important;
                page-break-inside: avoid !important;
                border-width: 1px !important;
                display: flex !important;
                flex-direction: row !important;
                align-items: flex-start !important;
                gap: 6px !important;
            }
            
            /* Person photo in card */
            .person-card .person-photo-container {
                flex-shrink: 0 !important;
                width: 45px !important;
                height: 45px !important;
                min-width: 45px !important;
                min-height: 45px !important;
                overflow: hidden !important;
                border: 1px solid #ddd !important;
                background: white !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            .person-card .person-photo-container img {
                width: 100% !important;
                height: 100% !important;
                min-width: 45px !important;
                min-height: 45px !important;
                object-fit: cover !important; /* Fill the container completely */
                display: block !important;
            }
            
            /* Person info takes remaining space */
            .person-card .person-info {
                flex: 1 !important;
                min-width: 0 !important;
            }
            
            .person-card .person-name {
                font-size: 8pt !important;
                margin: 0 0 2px 0 !important;
                font-weight: bold !important;
            }
            
            .person-card .person-details-grid {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 2px !important;
                font-size: 6.5pt !important;
            }
            
            .person-card .info-pair {
                margin: 0 !important;
                padding: 1px !important;
            }
            
            .person-card .info-label {
                font-size: 6pt !important;
                font-weight: bold !important;
            }
            
            .person-card .info-value {
                font-size: 6.5pt !important;
            }
            
            .person-card .person-statement {
                font-size: 6.5pt !important;
                line-height: 1.1 !important;
                margin-top: 2px !important;
                padding: 2px !important;
                max-height: 30px !important;
                overflow: hidden !important;
            }
            
            /* Witness photos side-by-side with info */
            div[style*="display: flex"][style*="gap: 15px"] {
                gap: 4px !important;
            }
            
            div[style*="width: 80px"][style*="height: 80px"],
            div[style*="width: 80px"][style*="height: 80px"] img {
                width: 45px !important;
                height: 45px !important;
                min-width: 45px !important;
                min-height: 45px !important;
                max-width: 45px !important;
                max-height: 45px !important;
                object-fit: cover !important; /* Fill the container completely */
                border-radius: 0 !important; /* Square photos */
                border: 1px solid #ddd !important;
            }
            
            /* Add page numbers */
            @page {
                margin: 0.3cm;
                @bottom-right {
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 8pt;
                    color: #666;
                }
            }
            
            /* Alternative page counter in footer */
            body::after {
                content: "";
                display: block;
                position: fixed;
                bottom: 0.2cm;
                right: 0.5cm;
                font-size: 8pt;
                color: #666;
            }
            
            .person-header-section {
                padding: 4px !important;
                margin: -5px -5px 4px -5px !important;
            }
            
            .person-photo-container img,
            .person-photo {
                width: 45px !important;
                height: 45px !important;
                min-width: 45px !important;
                min-height: 45px !important;
                max-width: 45px !important;
                max-height: 45px !important;
                object-fit: cover !important; /* Fill the container completely */
                border-radius: 0 !important; /* Square photos, not circles */
                border: 1px solid #ddd !important;
                background: white !important;
            }
            
            /* Person header with horizontal layout */
            .person-header-section {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            
            .person-name-title {
                font-size: 12pt !important;
            }
            
            .person-details-grid {
                gap: 6px !important;
            }
            
            .person-statement {
                padding: 8px !important;
                margin: 8px 0 !important;
            }
            
            .statement-label {
                font-size: 9pt !important;
                margin-bottom: 5px !important;
            }
            
            .statement-text {
                font-size: 8.5pt !important;
                line-height: 1.3 !important;
            }
            
            /* OPTIMIZE MEDIA FOR PRINT - HORIZONTAL LAYOUT */
            img {
                max-height: 100px !important;
                max-width: 120px !important;
                page-break-inside: avoid !important;
                float: left !important;
                margin: 4px 8px 4px 0 !important;
                object-fit: contain !important; /* Show full image without cropping */
                width: auto !important;
                height: auto !important;
            }
            
            /* Evidence containers with horizontal layout */
            .evidence-item,
            div[style*="evidence"],
            div[style*="text-align: center"] {
                display: flex !important;
                align-items: flex-start !important;
                gap: 8px !important;
                padding: 4px !important;
                margin: 4px 0 !important;
                page-break-inside: avoid !important;
            }
            
            /* Image containers should not center in print */
            div[style*="text-align: center"] {
                text-align: left !important;
            }
            
            /* Make evidence content wrap around images */
            .evidence-item > div,
            div[style*="margin-top: 15px"] > div {
                flex: 1 !important;
                overflow: hidden !important;
            }
            
            video {
                max-height: 100px !important;
                display: none !important; /* Hide video players in print */
            }
            
            audio {
                display: none !important; /* Hide audio players in print */
            }
            
            iframe {
                display: none !important; /* Hide iframes (PDFs) in print - they don't render */
            }
            
            /* Show message for PDF documents in print */
            iframe + p {
                display: block !important;
                padding: 10px !important;
                background: #fff3cd !important;
                border-top: 2px dashed #ffc107 !important;
                text-align: center !important;
                color: #856404 !important;
                font-size: 9pt !important;
            }
            
            /* COMPACT SECTIONS */
            .section-header {
                font-size: 10pt !important;
                padding: 6px 10px !important;
                margin: 6px 0 4px 0 !important;
                page-break-after: avoid !important;
                page-break-before: auto !important;
            }
            
            .report-section {
                padding: 4px !important;
                margin: 4px 0 !important;
                page-break-inside: avoid !important;
            }
            
            .section-body {
                padding: 4px !important;
            }
            
            .section-icon {
                display: none !important; /* Hide icons to save space */
            }
            
            /* STRATEGIC PAGE BREAKS */
            .section-header:first-of-type {
                page-break-before: avoid !important;
            }
            
            /* Tables */
            table {
                font-size: 8.5pt !important;
            }
            
            td, th {
                padding: 3px !important;
            }
            .meta-label {
                font-size: 8pt;
            }
            .meta-value {
                font-size: 9pt;
            }
            .report-section { 
                page-break-inside: avoid;
                margin-bottom: 12px;
            }
            .section-header {
                font-size: 10pt;
                margin-bottom: 8px;
                padding-bottom: 4px;
            }
            .description-box {
                padding: 10px 15px;
                font-size: 9pt;
                line-height: 1.4;
            }
            .person-card {
                margin-bottom: 10px;
                box-shadow: none;
                page-break-inside: avoid;
            }
            .person-row {
                padding: 10px;
                gap: 12px;
            }
            .person-photo-wrapper {
                width: 60px;
                height: 75px;
            }
            .person-name {
                font-size: 10pt;
                margin-bottom: 6px;
            }
            .person-details-grid {
                gap: 6px;
            }
            .info-label {
                font-size: 7pt;
            }
            .info-value {
                font-size: 8pt;
            }
            .person-statement {
                padding: 8px 10px;
            }
            .statement-label {
                font-size: 7pt;
            }
            .statement-text {
                font-size: 8pt;
                line-height: 1.4;
            }
            table {
                margin-bottom: 10px;
            }
            table th {
                padding: 6px 8px;
                font-size: 8pt;
            }
            table td {
                padding: 6px 8px;
                font-size: 8pt;
            }
            .report-footer {
                margin-top: 15px;
                padding: 15px 20px;
                border-top: 2px solid #000;
                page-break-inside: avoid;
            }
            .footer-content {
                gap: 20px;
            }
            .footer-text {
                font-size: 9pt;
                line-height: 1.5;
            }
            .qr-code-container {
                width: 100px;
                height: 100px;
                padding: 5px;
            }
            .qr-label {
                font-size: 7pt;
            }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">${tr.printReport}</button>
    
    <div class="report-container">
        <!-- Professional Letterhead -->
        <div class="report-letterhead">
            ${headerImage ? 
                `<img src="${headerImage}" alt="Report Header" class="letterhead-image" />` :
                `<div class="no-header-placeholder">
                    <i class="fas fa-image"></i>
                    <p><strong>No Header Image</strong></p>
                    <p>Go to Report Settings to upload a header image</p>
                </div>`
            }
        </div>
        
        <!-- Case Numbers and Date -->
        <div class="case-numbers-section">
            <div class="case-numbers-row">
                <div class="case-numbers-left">
                    <div class="case-number-item">
                        <h3>${tr.caseNumber}</h3>
                        <p>${esc(caseData.case_number)}</p>
                    </div>
                    <div class="case-number-item">
                        <h3>${tr.obNumber}</h3>
                        <p>${esc(caseData.ob_number)}</p>
                    </div>
                </div>
                <div class="report-date">
                    <h3>${tr.reportDate}</h3>
                    <p>${formatDate(new Date(), true)}</p>
                </div>
            </div>
        </div>
        
        <!-- Statements Section -->
        <div class="statements-section">
            ${statement1 || statement2 ? `
                <div class="statement-1-2">
                    ${statement1 ? `<div class="statement-box">${esc(statement1).replace(/\n/g, '<br>')}</div>` : ''}
                    ${statement2 ? `<div class="statement-box">${esc(statement2).replace(/\n/g, '<br>')}</div>` : ''}
                </div>
            ` : ''}
            ${statement3 ? `
                <div class="statement-separator">
                    <div class="statement-3">${esc(statement3).replace(/\n/g, '<br>')}</div>
                </div>
            ` : ''}
        </div>
        
        <div class="report-body">
        
        <!-- Case Information -->
        <div class="report-meta">
            <div class="meta-title">${tr.caseInformation}</div>
            <div class="meta-grid">
                <div class="meta-item">
                    <span class="meta-label">${tr.status}</span>
                    <span class="meta-value">${esc(caseData.status).toUpperCase().replace(/_/g, ' ')}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">${tr.priority}</span>
                    <span class="meta-value">${esc(caseData.priority || 'N/A').toUpperCase()}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">${tr.crimeCategory}</span>
                    <span class="meta-value">${esc(caseData.crime_category || 'N/A')}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">${tr.crimeType}</span>
                    <span class="meta-value">${esc(caseData.crime_type)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">${tr.incidentDate}</span>
                    <span class="meta-value">${formatDate(caseData.incident_date, true)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">${tr.location}</span>
                    <span class="meta-value">${esc(caseData.incident_location || 'N/A')}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">${tr.createdBy}</span>
                    <span class="meta-value">${esc(created_by?.full_name || 'N/A')}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">${tr.createdAt}</span>
                    <span class="meta-value">${formatDate(caseData.created_at, true)}</span>
                </div>
                ${caseData.court_status && caseData.court_status !== 'not_sent' ? `
                <div class="meta-item" style="grid-column: 1 / -1;">
                    <span class="meta-label">${tr.courtStatus}</span>
                    <span class="meta-value">${esc(caseData.court_status).toUpperCase().replace(/_/g, ' ')}</span>
                </div>` : ''}
            </div>
        </div>
        
        <!-- Case Description -->
        <div class="report-section">
            <h2 class="section-header">
                <span class="section-icon"></span>
                ${tr.incidentDescription}
            </h2>
            <div class="section-body">
                <div class="description-box">
                    ${esc(caseData.incident_description || tr.noDescription).replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>
        
        <!-- Parties -->
        ${generatePartiesHTML(parties.accused, tr.accusedPersons, 'accused-icon')}
        ${generatePartiesHTML(parties.victims, tr.accusersVictims, 'victim-icon')}
        
        <!-- Investigators -->
        ${assignments && assignments.length > 0 ? `
        <div class="report-section">
            <h2 class="section-header">
                <span class="section-icon"></span>
                ${tr.assignedInvestigators}
            </h2>
            <div class="section-body">
                <table>
                    <thead>
                        <tr>
                            <th>${tr.name}</th>
                            <th>${tr.role}</th>
                            <th>${tr.assignedDate}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignments.map(assignment => `
                        <tr>
                            <td>${esc(assignment.investigator_name)}</td>
                            <td>${assignment.is_lead_investigator ? tr.leadInvestigator : tr.supportInvestigator}</td>
                            <td>${formatDate(assignment.assigned_at)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>` : ''}
        
        <!-- Court Assignment -->
        ${court_assignment ? `
        <div class="report-section">
            <h2 class="section-header">
                <span class="section-icon"></span>
                ${tr.courtAssignment}
            </h2>
            <div class="section-body">
                <div class="report-meta">
                    <div class="meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">${tr.assignedTo}</span>
                            <span class="meta-value">${esc(court_assignment.investigator_name || 'N/A')}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">${tr.assignedBy}</span>
                            <span class="meta-value">${esc(court_assignment.assigned_by_name || 'N/A')}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">${tr.deadline}</span>
                            <span class="meta-value">${formatDate(court_assignment.deadline)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">${tr.status}</span>
                            <span class="meta-value">${esc(court_assignment.status)}</span>
                        </div>
                        ${court_assignment.notes ? `
                        <div class="meta-item" style="grid-column: 1 / -1;">
                            <span class="meta-label">${tr.notes}</span>
                            <span class="meta-value">${esc(court_assignment.notes)}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        </div>` : ''}
        
        
        </div>
        
        <!-- Footer -->
        <div class="report-footer">
            <div class="footer-content">
                <div class="footer-left">
                    ${footerText ? `
                        <div class="footer-text">${esc(footerText).replace(/\n/g, '<br>')}</div>
                    ` : `
                        <div class="footer-text">
                            <strong>${tr.preparedBy}:</strong><br>
                            ${tr.name}: _______________________________<br>
                            ${tr.signature}: __________________________<br>
                            ${tr.date}: _______________<br><br>
                            <strong>${tr.reviewedBy}:</strong><br>
                            ${tr.name}: _______________________________<br>
                            ${tr.signature}: __________________________<br>
                            ${tr.date}: _______________
                        </div>
                    `}
                </div>
                <div class="footer-right">
                    <div class="qr-code-container" id="qrCode">
                        <!-- QR Code will be generated here -->
                    </div>
                    <div class="qr-label">${tr.scanForDetails}</div>
                    <div style="font-size: 10px; text-align: center; margin-top: 5px; color: #666;">
                        ${caseData.verification_code || 'Verification Code: N/A'}
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Save HTML report to server
 */
async function saveHTMLReport(caseId, reportData, htmlContent, language, reportType = 'full') {
    try {
        const authToken = localStorage.getItem('auth_token');
        
        if (!authToken) {
            console.log('No auth token - cannot save report');
            return null;
        }
        
        const response = await fetch(`${API_BASE_URL}/investigation/saved-html-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                case_id: caseId,
                case_number: reportData.case.case_number,
                report_title: `${reportType === 'basic' ? 'Basic' : reportType === 'custom' ? 'Custom' : 'Full'} Report - ${reportData.case.case_number}`,
                report_language: language,
                report_type: reportType,
                report_html: htmlContent
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('✓ HTML report saved successfully');
            console.log('  Filename:', result.data.filename);
            console.log('  HTML URL:', result.data.html_url);
            return result;
        } else {
            console.error('Failed to save HTML:', result.message);
            return null;
        }
        
    } catch (error) {
        console.error('Error saving HTML report:', error);
        return null;
    }
}

// Export functions
window.generateCaseReport = generateCaseReport;
window.generateFullCaseReport = generateFullCaseReport;
window.viewReportInBrowser = viewReportInBrowser;
window.viewFullReportInBrowser = viewFullReportInBrowser;
window.downloadReportData = downloadReportData;
window.selectLanguage = selectLanguage;
window.selectFullReportLanguage = selectFullReportLanguage;
window.saveHTMLReport = saveHTMLReport;

// Export helper functions for custom report to use
window.generateCaseOverview = generateCaseOverview;
window.generateAccusedSection = generateAccusedSection;
window.generateAccusersSection = generateAccusersSection;
window.generateWitnessesSection = generateWitnessesSection;
window.generateCrimeSceneEvidenceSection = generateCrimeSceneEvidenceSection;
window.generateTimelineSection = generateTimelineSection;
window.generateConclusionsSection = generateConclusionsSection;
