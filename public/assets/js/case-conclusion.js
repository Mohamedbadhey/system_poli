// ============================================
// INVESTIGATOR CONCLUSION MANAGEMENT
// ============================================

/**
 * Load conclusion for a case
 */
async function loadCaseConclusion(caseId) {
    const tab = $('#tab-conclusion');
    const readOnly = window.currentCaseData?.readOnly || false;
    
    try {
        const response = await investigationAPI.getConclusion(caseId);
        
        if (response.status === 'success') {
            const conclusion = response.data;
            tab.html(buildConclusionEditor(caseId, conclusion, readOnly));
            
            // Initialize auto-save only if not read-only
            if (!readOnly) {
                initializeConclusionAutoSave(caseId);
            }
        } else {
            throw new Error('Failed to load conclusion');
        }
    } catch (error) {
        console.error('Error loading conclusion:', error);
        tab.html(buildConclusionEditor(caseId, null, readOnly));
        if (!readOnly) {
            initializeConclusionAutoSave(caseId);
        }
    }
}

/**
 * Build conclusion editor UI
 */
function buildConclusionEditor(caseId, conclusion, readOnly = false) {
    return `
        <div class="conclusion-editor ${readOnly ? 'read-only-mode' : ''}">
            <div class="conclusion-header">
                <div class="conclusion-title-section">
                    <h3><i class="fas fa-clipboard-check"></i> Investigation Conclusion Report</h3>
                    <p class="text-muted">
                        ${readOnly ? 'Final submitted conclusion for this closed case.' : 'Document your findings, analysis, and recommendations for this case.'}
                    </p>
                </div>
                
                <div class="conclusion-status">
                    ${conclusion ? `
                        <span class="badge badge-success">
                            <i class="fas fa-check-circle"></i> ${readOnly ? 'FINAL' : 'SAVED'}
                        </span>
                    ` : `
                        <span class="badge badge-secondary">${readOnly ? 'NO CONCLUSION' : 'NEW'}</span>
                    `}
                </div>
            </div>
            
            <form id="conclusionForm" class="conclusion-form">
                <!-- Conclusion Title -->
                <div class="form-group">
                    <label for="conclusionTitle">
                        <i class="fas fa-heading"></i> Conclusion Title ${readOnly ? '' : '*'}
                    </label>
                    <input 
                        type="text" 
                        class="form-control" 
                        id="conclusionTitle" 
                        name="conclusion_title"
                        placeholder="Brief title summarizing your conclusion"
                        value="${conclusion?.conclusion_title || ''}"
                        ${readOnly ? 'readonly' : 'required'}
                    >
                    ${!readOnly ? `
                    <small class="form-text text-muted">
                        Example: "Evidence supports charge of assault causing bodily harm"
                    </small>
                    ` : ''}
                </div>
                
                <!-- Investigation Findings -->
                <div class="form-group">
                    <label for="findings">
                        <i class="fas fa-search"></i> Investigation Findings ${readOnly ? '' : '*'}
                    </label>
                    <textarea 
                        class="form-control conclusion-textarea" 
                        id="findings" 
                        name="findings"
                        rows="8"
                        placeholder="Detailed findings from your investigation&#10;&#10;Include:&#10;- Key evidence discovered&#10;- Witness testimonies&#10;- Physical evidence analysis&#10;- Timeline of events&#10;- Contradictions or confirmations&#10;- Any challenges faced"
                        ${readOnly ? 'readonly' : 'required'}
                    >${conclusion?.findings || ''}</textarea>
                    ${!readOnly ? `
                    <small class="form-text text-muted">
                        Document all significant findings from your investigation.
                    </small>
                    ` : ''}
                </div>
                
                <!-- Recommendations -->
                <div class="form-group">
                    <label for="recommendations">
                        <i class="fas fa-lightbulb"></i> Recommendations
                    </label>
                    <textarea 
                        class="form-control conclusion-textarea" 
                        id="recommendations" 
                        name="recommendations"
                        rows="6"
                        placeholder="Your recommendations for case resolution&#10;&#10;Consider:&#10;- Recommended charges&#10;- Further investigation needed&#10;- Case closure justification&#10;- Court submission readiness"
                        ${readOnly ? 'readonly' : ''}
                    >${conclusion?.recommendations || ''}</textarea>
                    ${!readOnly ? `
                    <small class="form-text text-muted">
                        Provide actionable recommendations based on your findings.
                    </small>
                    ` : ''}
                </div>
                
                <!-- Conclusion Summary -->
                <div class="form-group">
                    <label for="conclusionSummary">
                        <i class="fas fa-file-alt"></i> Conclusion Summary ${readOnly ? '' : '*'}
                    </label>
                    <textarea 
                        class="form-control conclusion-textarea" 
                        id="conclusionSummary" 
                        name="conclusion_summary"
                        rows="6"
                        placeholder="Concise summary of your conclusion&#10;&#10;This should be a clear, professional statement that:&#10;- Summarizes the investigation outcome&#10;- States your professional opinion&#10;- Supports prosecution or case closure"
                        ${readOnly ? 'readonly' : 'required'}
                    >${conclusion?.conclusion_summary || ''}</textarea>
                    ${!readOnly ? `
                    <small class="form-text text-muted">
                        This summary will appear prominently in the full case report.
                    </small>
                    ` : ''}
                </div>
                
                <!-- Metadata -->
                ${conclusion ? `
                    <div class="conclusion-meta">
                        <div class="row">
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="fas fa-clock"></i> Last Updated: 
                                    <strong>${new Date(conclusion.updated_at).toLocaleString()}</strong>
                                </small>
                            </div>
                            ${conclusion.submitted_at ? `
                                <div class="col-md-6 text-right">
                                    <small class="text-muted">
                                        <i class="fas fa-paper-plane"></i> Submitted: 
                                        <strong>${new Date(conclusion.submitted_at).toLocaleString()}</strong>
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Action Buttons -->
                ${!readOnly ? `
                <div class="conclusion-actions">
                    <button type="button" class="btn btn-success" onclick="saveConclusionDraft(${caseId})">
                        <i class="fas fa-save"></i> Save Conclusion
                    </button>
                    <small class="text-muted ml-3">
                        <i class="fas fa-info-circle"></i> Auto-saves every 30 seconds
                    </small>
                </div>
                ` : ''}
            </form>
        </div>
    `;
}

/**
 * Get status badge color
 */
function getStatusBadgeColor(status) {
    const colors = {
        'draft': 'secondary',
        'submitted': 'warning',
        'reviewed': 'success'
    };
    return colors[status] || 'secondary';
}

/**
 * Initialize auto-save functionality
 */
let autoSaveTimer = null;
function initializeConclusionAutoSave(caseId) {
    // Clear existing timer
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
    
    // Set up auto-save every 30 seconds
    autoSaveTimer = setInterval(() => {
        const form = $('#conclusionForm');
        if (form.length && !form.find('input, textarea').is('[readonly]')) {
            saveConclusionDraft(caseId, true);
        }
    }, 30000); // 30 seconds
    
    // Clear timer when tab changes
    $(document).on('click', '.case-tab', function() {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
        }
    });
}

/**
 * Save conclusion
 */
async function saveConclusionDraft(caseId, isAutoSave = false) {
    const form = $('#conclusionForm');
    const formData = {
        conclusion_title: $('#conclusionTitle').val().trim(),
        findings: $('#findings').val().trim(),
        recommendations: $('#recommendations').val().trim(),
        conclusion_summary: $('#conclusionSummary').val().trim(),
        status: 'draft'
    };
    
    // Validate required fields
    if (!formData.conclusion_title || !formData.findings || !formData.conclusion_summary) {
        if (!isAutoSave) {
            await showError('Validation Error', 'Please fill in all required fields (Title, Findings, and Summary)');
        }
        return;
    }
    
    try {
        const response = await investigationAPI.saveConclusion(caseId, formData);
        
        if (response.status === 'success') {
            if (!isAutoSave) {
                await showSuccess('Success', 'Conclusion saved successfully');
                // Reload to show updated data
                loadCaseConclusion(caseId);
            } else {
                // Show brief indicator for auto-save
                showAutoSaveIndicator();
            }
        } else {
            throw new Error(response.message || 'Failed to save conclusion');
        }
    } catch (error) {
        console.error('Error saving conclusion:', error);
        if (!isAutoSave) {
            await showError('Error', error.message || 'Failed to save conclusion');
        }
    }
}

// Remove submit for review function - not needed

/**
 * Show auto-save indicator
 */
function showAutoSaveIndicator() {
    const indicator = $('<div class="auto-save-indicator">Saved</div>');
    $('body').append(indicator);
    
    setTimeout(() => {
        indicator.addClass('show');
    }, 10);
    
    setTimeout(() => {
        indicator.removeClass('show');
        setTimeout(() => indicator.remove(), 300);
    }, 2000);
}

// ============================================
// TAB SWITCHING - ADD CONCLUSION TAB SUPPORT
// ============================================

// Extend the switchCaseTab function to handle conclusion tab
const originalSwitchCaseTab = window.switchCaseTab;
window.switchCaseTab = function(tabName) {
    if (originalSwitchCaseTab) {
        originalSwitchCaseTab(tabName);
    }
    
    // Load conclusion data when tab is activated
    if (tabName === 'conclusion') {
        const caseId = window.currentCaseData?.id;
        if (caseId) {
            loadCaseConclusion(caseId);
        }
    }
};
