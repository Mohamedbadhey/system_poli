/**
 * Custom Report Generator
 * Allows users to select which sections to include in the report
 */

// Available sections for customized report
const availableSections = {
    case_overview: {
        title: 'Case Overview',
        description: 'Basic case information and details',
        icon: 'fa-info-circle'
    },
    parties: {
        title: 'Parties Involved',
        description: 'Accusers, accused, and witnesses',
        icon: 'fa-users',
        hasSubItems: true // This section will show individual persons
    },
    evidence: {
        title: 'Evidence',
        description: 'All evidence items collected',
        icon: 'fa-box'
    },
    timeline: {
        title: 'Case Timeline',
        description: 'Chronological events and activities',
        icon: 'fa-clock'
    },
    assignments: {
        title: 'Case Assignments',
        description: 'Officers assigned to the case',
        icon: 'fa-user-shield'
    },
    conclusions: {
        title: 'Investigator Conclusions',
        description: 'Findings and conclusions',
        icon: 'fa-check-circle'
    },
    recommendations: {
        title: 'Recommendations',
        description: 'Recommended next steps',
        icon: 'fa-clipboard-list'
    }
};

/**
 * Show section selection modal
 */
async function showCustomReportModal(caseId) {
    try {
        // First, fetch the case data to get all persons
        Swal.fire({
            title: 'Loading...',
            text: 'Fetching case data...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const reportResponse = await investigationAPI.generateFullReport(caseId);
        
        if (reportResponse.status !== 'success') {
            throw new Error('Failed to load case data');
        }

        const reportData = reportResponse.data;
        Swal.close();

        // Build sections HTML with person selection for parties
        const sectionsHTML = Object.entries(availableSections).map(([key, section]) => {
            let html = `
                <div class="form-check mb-3" style="padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                    <input class="form-check-input section-checkbox" type="checkbox" value="${key}" id="section_${key}" checked>
                    <label class="form-check-label" for="section_${key}" style="cursor: pointer; width: 100%;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <i class="fas ${section.icon}" style="font-size: 24px; color: #fd7e14;"></i>
                            <div>
                                <strong style="font-size: 15px;">${section.title}</strong>
                                <div style="color: #666; font-size: 13px;">${section.description}</div>
                            </div>
                        </div>
                    </label>`;

            // Add person selection for parties section
            if (key === 'parties' && reportData.parties) {
                html += `
                    <div id="persons_list" style="margin-top: 15px; margin-left: 40px; padding-left: 15px; border-left: 3px solid #fd7e14;">
                        <div style="margin-bottom: 10px; font-weight: 600; color: #333;">
                            <i class="fas fa-user-check"></i> Select Specific Persons:
                        </div>
                        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                            <button type="button" class="btn btn-xs btn-outline-success" onclick="selectAllPersons(true)" style="font-size: 11px; padding: 3px 8px;">
                                Select All
                            </button>
                            <button type="button" class="btn btn-xs btn-outline-secondary" onclick="selectAllPersons(false)" style="font-size: 11px; padding: 3px 8px;">
                                Deselect All
                            </button>
                        </div>`;

                // Accused persons
                if (reportData.parties.accused && reportData.parties.accused.length > 0) {
                    html += `<div style="margin-bottom: 10px;">
                        <div style="font-weight: 600; color: #e74c3c; font-size: 13px; margin-bottom: 5px;">
                            <i class="fas fa-user-slash"></i> Accused:
                        </div>`;
                    reportData.parties.accused.forEach(person => {
                        const fullName = person.full_name || `${person.first_name} ${person.last_name}`;
                        html += `
                            <div class="form-check" style="margin-left: 10px;">
                                <input class="form-check-input person-checkbox" type="checkbox" value="accused_${person.person_id}" id="person_accused_${person.person_id}" checked>
                                <label class="form-check-label" for="person_accused_${person.person_id}" style="font-size: 13px;">
                                    ${escapeHtmlSimple(fullName)} ${person.national_id ? `(ID: ${person.national_id})` : ''}
                                </label>
                            </div>`;
                    });
                    html += `</div>`;
                }

                // Victims/Accusers
                if (reportData.parties.victims && reportData.parties.victims.length > 0) {
                    html += `<div style="margin-bottom: 10px;">
                        <div style="font-weight: 600; color: #3498db; font-size: 13px; margin-bottom: 5px;">
                            <i class="fas fa-user-injured"></i> Victims/Accusers:
                        </div>`;
                    reportData.parties.victims.forEach(person => {
                        const fullName = person.full_name || `${person.first_name} ${person.last_name}`;
                        html += `
                            <div class="form-check" style="margin-left: 10px;">
                                <input class="form-check-input person-checkbox" type="checkbox" value="victim_${person.person_id}" id="person_victim_${person.person_id}" checked>
                                <label class="form-check-label" for="person_victim_${person.person_id}" style="font-size: 13px;">
                                    ${escapeHtmlSimple(fullName)} ${person.national_id ? `(ID: ${person.national_id})` : ''}
                                </label>
                            </div>`;
                    });
                    html += `</div>`;
                }

                // Witnesses
                if (reportData.parties.witnesses && reportData.parties.witnesses.length > 0) {
                    html += `<div style="margin-bottom: 10px;">
                        <div style="font-weight: 600; color: #27ae60; font-size: 13px; margin-bottom: 5px;">
                            <i class="fas fa-user-check"></i> Witnesses:
                        </div>`;
                    reportData.parties.witnesses.forEach(person => {
                        const fullName = person.full_name || `${person.first_name} ${person.last_name}`;
                        html += `
                            <div class="form-check" style="margin-left: 10px;">
                                <input class="form-check-input person-checkbox" type="checkbox" value="witness_${person.person_id}" id="person_witness_${person.person_id}" checked>
                                <label class="form-check-label" for="person_witness_${person.person_id}" style="font-size: 13px;">
                                    ${escapeHtmlSimple(fullName)} ${person.national_id ? `(ID: ${person.national_id})` : ''}
                                </label>
                            </div>`;
                    });
                    html += `</div>`;
                }

                html += `</div>`;
            }

            html += `</div>`;
            return html;
        }).join('');

        const result = await Swal.fire({
            title: '<i class="fas fa-sliders-h"></i> Customize Report',
            html: `
                <div style="text-align: left; max-height: 500px; overflow-y: auto;">
                    <p style="margin-bottom: 20px; color: #666;">Select the sections and specific persons you want to include in your customized report:</p>
                    <div class="mb-3">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="selectAllSections(true)">
                            <i class="fas fa-check-square"></i> Select All Sections
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="selectAllSections(false)">
                            <i class="fas fa-square"></i> Deselect All Sections
                        </button>
                    </div>
                    <div id="sectionsList">
                        ${sectionsHTML}
                    </div>
                </div>
            `,
            width: '700px',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-file-pdf"></i> Generate Report',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#fd7e14',
            customClass: {
                popup: 'custom-report-modal'
            },
            preConfirm: () => {
                const selectedSections = [];
                document.querySelectorAll('#sectionsList .section-checkbox:checked').forEach(checkbox => {
                    selectedSections.push(checkbox.value);
                });

                if (selectedSections.length === 0) {
                    Swal.showValidationMessage('Please select at least one section');
                    return false;
                }

                // Get selected persons if parties section is selected
                const selectedPersons = [];
                if (selectedSections.includes('parties')) {
                    document.querySelectorAll('#sectionsList .person-checkbox:checked').forEach(checkbox => {
                        selectedPersons.push(checkbox.value);
                    });
                    
                    if (selectedPersons.length === 0) {
                        Swal.showValidationMessage('Please select at least one person for the parties section');
                        return false;
                    }
                }

                return { sections: selectedSections, persons: selectedPersons };
            }
        });

        if (result.isConfirmed && result.value) {
            await generateCustomReport(caseId, result.value.sections, result.value.persons);
        }
    } catch (error) {
        Swal.close();
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load case data: ' + error.message
        });
    }
}

// Helper function for simple HTML escaping
function escapeHtmlSimple(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, function(match) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escape[match];
    });
}

/**
 * Select/Deselect all sections
 */
function selectAllSections(select) {
    document.querySelectorAll('#sectionsList .section-checkbox').forEach(checkbox => {
        checkbox.checked = select;
    });
}

/**
 * Select/Deselect all persons
 */
function selectAllPersons(select) {
    document.querySelectorAll('#sectionsList .person-checkbox').forEach(checkbox => {
        checkbox.checked = select;
    });
}

/**
 * Generate customized report with selected sections
 */
async function generateCustomReport(caseId, selectedSections, selectedPersons = []) {
    try {
        Swal.fire({
            title: 'Generating Report...',
            text: 'Please wait while we generate your customized report',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Use EXACT same data fetching as generateFullCaseReport in case-report.js
        const reportResponse = await investigationAPI.generateFullReport(caseId);
        
        if (reportResponse.status !== 'success') {
            throw new Error('Failed to load case data');
        }

        // The API returns: { case, parties: { victims, accused, witnesses }, evidence, assignments, history, conclusions, created_by }
        const reportData = reportResponse.data;
        
        console.log('Custom Report Data:', reportData); // Debug: Check what data we're getting
        console.log('Selected Persons:', selectedPersons); // Debug: Check selected persons
        
        // Filter parties based on selected persons
        if (selectedPersons.length > 0 && reportData.parties) {
            const filteredParties = {
                accused: [],
                victims: [],
                witnesses: []
            };
            
            selectedPersons.forEach(personId => {
                const [role, id] = personId.split('_');
                const personIdNum = parseInt(id);
                
                if (role === 'accused' && reportData.parties.accused) {
                    const person = reportData.parties.accused.find(p => p.person_id == personIdNum);
                    if (person) filteredParties.accused.push(person);
                } else if (role === 'victim' && reportData.parties.victims) {
                    const person = reportData.parties.victims.find(p => p.person_id == personIdNum);
                    if (person) filteredParties.victims.push(person);
                } else if (role === 'witness' && reportData.parties.witnesses) {
                    const person = reportData.parties.witnesses.find(p => p.person_id == personIdNum);
                    if (person) filteredParties.witnesses.push(person);
                }
            });
            
            reportData.parties = filteredParties;
            console.log('Filtered Parties:', filteredParties);
        }
        
        // Pre-load all evidence files as blob URLs (same as full report)
        Swal.update({
            title: 'Loading evidence files...'
        });
        await preloadEvidenceFiles(reportData);

        // Generate HTML
        const htmlContent = await generateCustomReportHTML(reportData, selectedSections);
        
        // Add QR code generation script to HTML
        const htmlWithQR = addQRCodeScriptToHTML(htmlContent);
        
        // Save HTML to server
        Swal.update({
            title: 'Saving report...'
        });
        const htmlResponse = await saveHTMLReport(caseId, reportData, htmlWithQR, 'en', 'custom');
        
        Swal.close();
        
        if (htmlResponse && htmlResponse.data) {
            const htmlUrl = htmlResponse.data.html_url;
            
            // Open HTML in new window
            window.open(htmlUrl, '_blank');
            
            // Log the URL for reference
            console.log('Custom Report HTML URL:', htmlUrl);
            console.log('QR Code URL:', htmlResponse.data.qr_code);
            console.log('Filename:', htmlResponse.data.filename);
            
            // Show success with URL
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Report saved! URL: ${htmlUrl}`,
                timer: 3000
            });
        } else {
            // Fallback to blob URL if save failed
            await Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Server save failed. Opening temporary view...',
                timer: 2000
            });
            const blob = new Blob([htmlWithQR], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        }

    } catch (error) {
        console.error('Error generating custom report:', error);
        Swal.close();
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to generate customized report: ' + error.message
        });
    }
}

/**
 * Generate customized report HTML
 */
async function generateCustomReportHTML(reportData, selectedSections) {
    const { case: caseData, parties, evidence, assignments, history, conclusions } = reportData;

    // Get custom settings from database
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
            statement1 = settings.custom_statement1 || '';
            statement2 = settings.custom_statement2 || '';
            statement3 = settings.custom_statement3 || '';
            footerText = settings.custom_footer_text || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }

    const formatDate = (dateStr, includeTime = false) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const options = includeTime 
            ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            : { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customized Report - ${escapeHtml(caseData.case_number)}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    ${getReportStyles()}
</head>
<body>
    <button class="print-btn" onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
        <i class="fas fa-print"></i> Print Report
    </button>
    
    <div class="report-container" style="max-width: 210mm; margin: 20px auto; background: white; box-shadow: 0 0 30px rgba(0,0,0,0.1); padding: 40px;">
        
        <!-- REPORT HEADER -->
        <div class="report-letterhead">
            ${headerImage ? 
                `<img src="${headerImage}" alt="Report Header" class="letterhead-image" />` :
                `<div class="no-header-placeholder" style="text-align: center; padding: 30px; background: #f5f5f5; border: 2px dashed #ddd;">
                    <i class="fas fa-image" style="font-size: 48px; color: #ccc;"></i>
                    <p style="color: #999; margin-top: 10px;">No letterhead configured</p>
                    <small style="color: #999;">Go to Report Settings to upload a header image</small>
                </div>`
            }
        </div>
        
        <!-- Case Numbers and Date -->
        <div class="case-numbers-section">
            <div class="case-numbers-row">
                <div class="case-numbers-left">
                    <div class="case-number-item">
                        <h3>Lambarka Kiiska</h3>
                        <p>${escapeHtml(caseData.case_number)}</p>
                    </div>
                    <div class="case-number-item">
                        <h3>Lambarka OB</h3>
                        <p>${escapeHtml(caseData.ob_number)}</p>
                    </div>
                </div>
                <div class="report-date">
                    <h3>Taariikhda Warbixinta</h3>
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

        <!-- Selected Sections -->
    `;

    // Add selected sections
    selectedSections.forEach(sectionKey => {
        html += generateSectionContent(sectionKey, reportData, formatDate, escapeHtml);
    });

    html += `
        
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
                                <strong>Prepared By:</strong><br>
                                Name: _________________________<br>
                                Signature: ____________________<br>
                                Date: __________
                            </div>
                            <div>
                                <strong>Reviewed By:</strong><br>
                                Name: _________________________<br>
                                Signature: ____________________<br>
                                Date: __________
                            </div>
                            <div>
                                <strong>Approved By:</strong><br>
                                Name: _________________________<br>
                                Signature: ____________________<br>
                                Date: __________
                            </div>
                        </div>
                    `}
                </div>
                
                <!-- Right side: QR Code -->
                <div style="width: 120px; text-align: center;">
                    <div class="qr-code-container" id="qrCode" style="width: 120px; height: 120px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; background: #f9f9f9; margin-bottom: 5px;"></div>
                    <div style="font-size: 10px; font-weight: bold;">Scan to Verify</div>
                </div>
            </div>
            
            <!-- Footer text at the bottom -->
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #eee; padding-top: 15px;">
                <p>This is an official police case report generated on ${formatDate(new Date().toISOString(), true)}</p>
                <p>Report ID: ${escapeHtml(caseData.case_number)} | Generated by: Police Case Management System</p>
            </div>
        </div>
        
    </div>
</body>
</html>
    `;

    return html;
}

/**
 * Generate content for each section - EXACTLY like full report
 */
function generateSectionContent(sectionKey, reportData, formatDate, escapeHtml) {
    const { case: caseData, parties, evidence, assignments, history, conclusions } = reportData;
    
    // Get organized data like full report does
    const accused = parties.accused || [];
    const accusers = parties.victims || [];
    const witnesses = parties.witnesses || [];
    const neutralWitnesses = witnesses.filter(w => !w.witness_affiliation || w.witness_affiliation === 'neutral' || !w.affiliated_person_id);
    const crimeSceneEvidence = evidence.filter(e => !e.collected_from_person_id || e.collected_from === 'crime_scene');
    
    // Define translations object for all sections (English by default for custom reports)
    const tr = {
        caseOverview: 'CASE OVERVIEW',
        caseInformation: 'Case Information',
        status: 'Status',
        priority: 'Priority',
        crimeCategory: 'Crime Category',
        crimeType: 'Crime Type',
        incidentDate: 'Incident Date',
        location: 'Location',
        incidentDescription: 'Incident Description',
        assignedInvestigators: 'Assigned Investigators',
        name: 'Name',
        role: 'Role',
        assignedDate: 'Assigned Date',
        leadInvestigator: 'Lead Investigator',
        noDescription: 'No description provided',
        section1Accused: 'SECTION 1: ACCUSED PERSONS',
        section2Accusers: 'SECTION 2: ACCUSERS/VICTIMS',
        section3Witnesses: 'SECTION 3: WITNESSES',
        section4CrimeScene: 'SECTION 4: CRIME SCENE EVIDENCE',
        section5Timeline: 'SECTION 5: CASE TIMELINE',
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
        date: 'Date',
        type: 'Type',
        description: 'Description',
        collected: 'Collected',
        by: 'by',
        dateTime: 'Date & Time',
        statusChange: 'Status Change',
        changedBy: 'Changed By',
        noStatementsRecorded: 'No statements recorded',
        noEvidenceCollected: 'No evidence collected',
        noSupportingWitnesses: 'No supporting witnesses',
        caseHistory: 'CASE HISTORY & TIMELINE'
    };
    
    switch (sectionKey) {
        case 'case_overview':
            // Use the EXACT function from full report
            return window.generateCaseOverview(caseData, assignments, tr);

        case 'parties':
            // Use the EXACT functions from full report
            let partiesHTML = '';
            
            if (accused.length > 0) {
                partiesHTML += window.generateAccusedSection(accused, tr);
            }
            
            if (accusers.length > 0) {
                partiesHTML += window.generateAccusersSection(accusers, tr);
            }
            
            if (neutralWitnesses.length > 0) {
                partiesHTML += window.generateWitnessesSection(neutralWitnesses, tr);
            }
            
            if (!accused.length && !accusers.length && !neutralWitnesses.length) {
                partiesHTML = '<div style="padding: 20px; background: #f8f9fa; margin: 20px 0;"><p>No parties recorded.</p></div>';
            }
            
            return partiesHTML;
            
        case 'evidence':
            // Use the EXACT function from full report
            return window.generateCrimeSceneEvidenceSection(crimeSceneEvidence, tr);
            
        case 'timeline':
            // Use the EXACT function from full report  
            return window.generateTimelineSection(history, tr);
            
        case 'conclusions':
            // Use the EXACT function from full report
            if (conclusions && conclusions.length > 0) {
                return window.generateConclusionsSection(conclusions[0], tr);
            } else {
                return '<div style="padding: 20px; background: #f8f9fa; margin: 20px 0;"><p>No investigator conclusions recorded.</p></div>';
            }
            
        case 'assignments':
            // Keep simple table for assignments
            let assignHTML = '<div style="margin: 30px 0;"><h2 style="color: #2c3e50; font-size: 16pt; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #3498db;">CASE ASSIGNMENTS</h2>';
            if (assignments && assignments.length > 0) {
                assignHTML += '<ul style="margin: 20px 0;">';
                assignments.forEach(a => {
                    const name = a.investigator_name || a.full_name || 'Unknown';
                    const role = a.role || a.assignment_role || 'Investigator';
                    assignHTML += `<li style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${escapeHtml(name)}</strong> - ${escapeHtml(role)}</li>`;
                });
                assignHTML += '</ul>';
            } else {
                assignHTML += '<p style="padding: 20px;">No assignments recorded.</p>';
            }
            assignHTML += '</div>';
            return assignHTML;

        case 'recommendations':
            return `
                <div style="margin: 30px 0;">
                    <h2 style="color: #2c3e50; font-size: 16pt; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #3498db;">RECOMMENDATIONS</h2>
                    <p style="padding: 15px; background: #f8f9fa; border-left: 4px solid #27ae60;">${caseData.recommendations ? escapeHtml(caseData.recommendations) : 'No recommendations provided.'}</p>
                </div>
            `;

        default:
            return '';
    }
}

// Get report styles - EXACTLY from full report in case-report.js
function getReportStyles() {
    return `<style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 1cm; size: A4 portrait; }
        body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.6; color: #333; }
        
        .print-btn { display: block; }
        @media print {
            .print-btn { display: none !important; }
        }
        
        .report-letterhead {
            width: 100%;
            margin-bottom: 20px;
            text-align: center;
            page-break-inside: avoid;
        }
        
        .letterhead-image {
            width: 100%;
            height: auto;
            display: block;
            object-fit: cover;
            max-height: 200px;
        }
        
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
        
        .case-number-item h3, .report-date h3 {
            font-size: 11px;
            color: #666;
            font-weight: 600;
            margin-bottom: 3px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        
        .case-number-item p, .report-date p {
            font-size: 14px;
            color: #000;
            font-weight: 700;
            margin: 0;
        }
        
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
        
        .statement-separator {
            margin: 15px 0 0 0;
            padding: 12px 0;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
        }
        
        .statement-3 {
            text-align: center;
            font-size: 13px;
            line-height: 1.4;
            color: #000;
            font-weight: 700;
        }
        
        .report-content {
            padding: 20px 40px;
        }
        
        /* Person Photo Styles - Same as Full Report */
        .person-photo { 
            width: 80px; 
            height: 80px; 
            border-radius: 50%; 
            border: 3px solid white; 
            object-fit: cover; 
            background: white; 
        }
        
        /* Person Card Styles - Same as Full Report */
        .person-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .person-card h3 {
            color: #2c3e50;
            font-size: 14pt;
            margin-bottom: 15px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .person-card h4 {
            color: #34495e;
            font-size: 12pt;
            margin: 15px 0 10px 0;
        }
        
        .person-card ul {
            list-style: none;
            padding: 0;
        }
        
        .person-card ul li {
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .person-card ul li:last-child {
            border-bottom: none;
        }
        
        /* Section Styles */
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #2c3e50;
            font-size: 16pt;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #3498db;
            font-weight: bold;
        }
        
        .section h3 {
            color: #34495e;
            font-size: 13pt;
            margin: 20px 0 15px 0;
            font-weight: 600;
        }
        
        .info-table, .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        .info-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        
        .info-table td:first-child {
            width: 200px;
            font-weight: bold;
        }
        
        .data-table th, .data-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        .data-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .timeline-item {
            margin-bottom: 15px;
            padding-left: 20px;
            border-left: 3px solid #3498db;
        }
        
        /* QR Code Styles */
        .qr-code-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 120px;
        }
        
        .qr-code-container canvas {
            max-width: 100%;
            height: auto !important;
        }
        
        .qr-code-container img {
            max-width: 100%;
            height: auto;
        }
        
        @media print {
            .report-letterhead {
                width: 100% !important;
                margin: 0 0 5px 0 !important;
            }
            .letterhead-image {
                width: 100% !important;
                object-fit: cover !important;
            }
            .case-numbers-section {
                padding: 5px 10px !important;
            }
            .statements-section {
                padding: 4px 10px !important;
            }
            .statement-box, .statement-3 {
                font-size: 8px !important;
            }
            .person-photo { 
                width: 60px !important; 
                height: 60px !important; 
            }
            .qr-code-container {
                width: 100px !important;
                height: 100px !important;
            }
        }
    </style>`;
}

/**
 * Generate enhanced evidence section with images and files
 */
function generateEnhancedEvidenceSection(evidence, formatDate, escapeHtml) {
    if (!evidence || evidence.length === 0) {
        return '<div style="padding: 20px; background: #f8f9fa; margin: 20px 0;"><p>No evidence collected from crime scene.</p></div>';
    }
    
    let html = `
        <div style="margin: 30px 0;">
            <h2 style="background: #f39c12; color: white; padding: 15px 20px; margin: 0 0 20px 0; border-radius: 5px; font-size: 16pt;">
                📦 CRIME SCENE EVIDENCE (${evidence.length})
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
    `;
    
    evidence.forEach((ev, idx) => {
        const typeIcons = { photo: '📷', video: '🎥', audio: '🎤', document: '📄', physical: '📦', digital: '💾' };
        const icon = typeIcons[ev.evidence_type] || '📁';
        const fileUrl = ev.blobUrl || (ev.file_path ? `/uploads/${ev.file_path}` : '');
        
        html += `
            <div style="background: #fef5e7; border: 2px solid #f39c12; border-radius: 8px; padding: 15px; page-break-inside: avoid;">
                <div style="font-weight: bold; margin-bottom: 10px; color: #f39c12;">
                    ${icon} Evidence #${idx + 1}
                </div>
                
                <!-- Display image/video/file if available -->
                ${(ev.evidence_type === 'photo' || ev.evidence_type === 'image') && fileUrl ? `
                    <div style="margin: 10px 0; text-align: center;">
                        <img src="${fileUrl}" alt="${escapeHtml(ev.title || 'Evidence')}" 
                             style="max-width: 100%; max-height: 200px; border-radius: 5px; object-fit: contain; border: 1px solid #ddd;"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; padding: 20px; background: #eee; border-radius: 5px; color: #999; text-align: center;">
                            <i class="fas fa-image" style="font-size: 24px;"></i><br>
                            <small>Image not available or encrypted</small>
                        </div>
                    </div>
                ` : ''}
                
                ${ev.evidence_type === 'video' && fileUrl ? `
                    <div style="margin: 10px 0;">
                        <video controls style="max-width: 100%; border-radius: 5px;">
                            <source src="${fileUrl}" type="video/mp4">
                            <source src="${fileUrl}" type="video/webm">
                            Video not supported
                        </video>
                    </div>
                ` : ''}
                
                ${ev.evidence_type === 'audio' && fileUrl ? `
                    <div style="margin: 10px 0;">
                        <audio controls style="width: 100%;">
                            <source src="${fileUrl}">
                            Audio not supported
                        </audio>
                    </div>
                ` : ''}
                
                <div style="margin-top: 10px;">
                    <strong>${escapeHtml(ev.title || ev.evidence_number)}</strong>
                </div>
                
                <div style="font-size: 11pt; color: #666; margin-top: 5px;">
                    <strong>Type:</strong> ${escapeHtml(ev.evidence_type)}<br>
                    <strong>Number:</strong> ${escapeHtml(ev.evidence_number)}<br>
                    <strong>Collected:</strong> ${formatDate(ev.collected_at || ev.collected_date)}
                </div>
                
                ${ev.description ? `
                    <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px; font-size: 10pt;">
                        ${escapeHtml(ev.description)}
                    </div>
                ` : ''}
                
                ${ev.location_collected ? `
                    <div style="margin-top: 5px; font-size: 10pt; color: #666;">
                        📍 ${escapeHtml(ev.location_collected)}
                    </div>
                ` : ''}
                
                ${ev.collected_by ? `
                    <div style="margin-top: 5px; font-size: 10pt; color: #666;">
                        👤 Collected by: ${escapeHtml(ev.collected_by)}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Preload evidence files - COPIED from case-report.js
 */
async function preloadEvidenceFiles(reportData) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Collect all evidence from all sources
    const allEvidence = [];
    
    // Get evidence from parties (accused, victims, witnesses)
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
    
    // Download and create blob URLs for each evidence file using the API
    const promises = allEvidence.map(async (evidence) => {
        if (!evidence.file_path || !evidence.id) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/investigation/evidence/${evidence.id}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                evidence.blobUrl = URL.createObjectURL(blob);
            } else {
                console.error(`Failed to download evidence ${evidence.id}: ${response.status}`);
            }
        } catch (error) {
            console.error(`Failed to load evidence file ${evidence.id}:`, error);
        }
    });
    
    await Promise.all(promises);
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
 * Save HTML Report - imported from case-report.js
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
            console.log(`✓ ${reportType} HTML report saved successfully`);
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
window.showCustomReportModal = showCustomReportModal;
window.selectAllSections = selectAllSections;
