// ============================================
// Investigator Assignment Functions
// ============================================

// Show Assign Investigator Modal with availability indicators
async function showAssignInvestigatorModal(caseId, caseNumber) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    
    // Load available investigators from the center
    let investigatorsHtml = `<option value="">${t('select_investigator')}</option>`;
    let investigators = [];
    
    try {
        const response = await stationAPI.getAvailableInvestigators();
        if (response.status === 'success') {
            investigators = response.data;
            
            // Build options with availability indicators
            investigatorsHtml += investigators.map(inv => {
                const availabilityIcon = inv.is_available ? '&#10003;' : '&#9888;'; // checkmark or warning
                const availabilityText = inv.is_available ? t('available') : t('busy');
                const activeCases = inv.active_cases;
                const caseText = activeCases === 1 ? t('case_lowercase') : t('cases_lowercase');
                
                return `<option value="${inv.id}" data-available="${inv.is_available}" data-cases="${activeCases}">
                    ${availabilityIcon} ${inv.full_name} - ${inv.badge_number || t('na')} (${activeCases} ${caseText} - ${availabilityText})
                </option>`;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load investigators:', error);
        investigatorsHtml += `<option value="" disabled>${t('error_loading_investigators')}</option>`;
    }
    
    const bodyHtml = `
        <form id="assignInvestigatorForm">
            <div class="form-group">
                <label><strong><span data-i18n="case">${t('case')}</span>:</strong> ${caseNumber}</label>
            </div>
            
            <div class="form-group">
                <label data-i18n="select_investigator_required">${t('select_investigator_required')}</label>
                <select name="user_id" id="investigatorSelect" required onchange="showInvestigatorDetails(this.value)">
                    ${investigatorsHtml}
                </select>
                <small style="color: #6b7280; display: block; margin-top: 5px;">
                    <i class="fas fa-info-circle"></i> <span data-i18n="only_investigators_from_center">${t('only_investigators_from_center')}</span> &#10003; = <span data-i18n="available_0_4_cases">${t('available_0_4_cases')}</span> | &#9888; = <span data-i18n="busy_5_plus_cases">${t('busy_5_plus_cases')}</span>
                </small>
            </div>
            
            <div id="investigatorDetails" style="display: none; padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #374151;" data-i18n="investigator_details">${t('investigator_details')}</h4>
                <div id="investigatorDetailsContent"></div>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="is_lead_investigator"> <span data-i18n="assign_as_lead_investigator">${t('assign_as_lead_investigator')}</span>
                </label>
            </div>
            
            <div class="form-group">
                <label data-i18n="assignment_notes">${t('assignment_notes')}</label>
                <textarea name="assignment_notes" rows="3" data-i18n-placeholder="special_instructions_placeholder" placeholder="${t('special_instructions_placeholder')}"></textarea>
            </div>
        </form>
        
        <style>
            #investigatorSelect option[data-available="true"] {
                color: #059669;
                font-weight: 500;
            }
            #investigatorSelect option[data-available="false"] {
                color: #f59e0b;
            }
        </style>
    `;
    
    showModal(t('assign_investigator_to_case'), bodyHtml, [
        { text: t('cancel'), class: 'btn btn-secondary', onclick: 'closeModal()' },
        { text: t('assign'), class: 'btn btn-primary', onclick: `submitAssignInvestigator(${caseId})` }
    ]);
    
    // Store investigators data for details view
    window.investigatorsData = investigators;
}

// Submit Assignment - Updated to use correct endpoint
async function submitAssignInvestigator(caseId) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const form = $('#assignInvestigatorForm')[0];
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const investigatorId = formData.get('user_id');
    const isLeadInvestigator = formData.get('is_lead_investigator') ? 1 : 0;
    
    // The assignInvestigators endpoint expects investigator_ids array and lead_investigator_id
    const data = {
        investigator_ids: [investigatorId],
        lead_investigator_id: investigatorId,
        deadline: null // Optional: can add deadline field to form
    };
    
    try {
        showLoading(t('assigning_investigator'), t('please_wait'));
        const response = await stationAPI.assignInvestigators(caseId, data);
        
        closeAlert();
        if (response.status === 'success') {
            await showSuccess(t('success'), t('investigator_assigned_successfully'));
            closeModal();
            // Reload the page that called this modal
            if (typeof loadAssignmentsTable === 'function') {
                loadAssignmentsTable();
            } else if (typeof loadAllCasesTable === 'function') {
                loadAllCasesTable();
            }
        }
    } catch (error) {
        closeAlert();
        console.error('Assignment error:', error);
        
        if (error.status === 400 && error.response && error.response.messages) {
            const messages = error.response.messages;
            let errorText = '';
            
            if (typeof messages === 'object') {
                errorText = Object.values(messages).join('\n');
            } else {
                errorText = messages;
            }
            
            await Swal.fire({
                icon: 'error',
                title: t('assignment_failed'),
                html: errorText.replace(/\n/g, '<br>'),
                confirmButtonColor: '#ef4444'
            });
        } else {
            await showError(t('error'), t('failed_to_assign_investigator') + ': ' + error.message);
        }
    }
}

// Show investigator workload details when selected
async function showInvestigatorDetails(investigatorId) {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const detailsDiv = $('#investigatorDetails');
    const contentDiv = $('#investigatorDetailsContent');
    
    if (!investigatorId) {
        detailsDiv.hide();
        return;
    }
    
    detailsDiv.show();
    contentDiv.html(`<p><i class="fas fa-spinner fa-spin"></i> ${t('loading_details')}</p>`);
    
    try {
        const response = await stationAPI.getInvestigatorWorkload(investigatorId);
        if (response.status === 'success') {
            const inv = response.data.investigator;
            const workload = response.data.workload;
            const cases = response.data.active_cases;
            
            const statusColor = workload.availability_status === 'available' ? '#059669' : '#f59e0b';
            const statusIcon = workload.availability_status === 'available' ? 'check-circle' : 'exclamation-triangle';
            
            let html = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: white; padding: 10px; border-radius: 6px; border-left: 3px solid ${statusColor};">
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">${t('status')}</div>
                        <div style="font-size: 16px; font-weight: 600; color: ${statusColor};">
                            <i class="fas fa-${statusIcon}"></i> ${workload.availability_status}
                        </div>
                    </div>
                    <div style="background: white; padding: 10px; border-radius: 6px;">
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">${t('active_cases')}</div>
                        <div style="font-size: 16px; font-weight: 600; color: #374151;">${workload.total_cases}</div>
                    </div>
                    <div style="background: white; padding: 10px; border-radius: 6px;">
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">${t('overdue')}</div>
                        <div style="font-size: 16px; font-weight: 600; color: ${workload.overdue_cases > 0 ? '#ef4444' : '#374151'};">
                            ${workload.overdue_cases}
                        </div>
                    </div>
                    <div style="background: white; padding: 10px; border-radius: 6px;">
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">${t('urgent')}</div>
                        <div style="font-size: 16px; font-weight: 600; color: ${workload.urgent_cases > 0 ? '#f59e0b' : '#374151'};">
                            ${workload.urgent_cases}
                        </div>
                    </div>
                </div>
            `;
            
            if (cases.length > 0) {
                html += `<div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">${t('current_cases')}:</div>`;
                html += '<div style="max-height: 150px; overflow-y: auto;">';
                cases.forEach(c => {
                    const deadlineColor = c.deadline && new Date(c.deadline) < new Date() ? '#ef4444' : '#6b7280';
                    html += `
                        <div style="font-size: 12px; padding: 6px; background: white; margin-bottom: 4px; border-radius: 4px; display: flex; justify-content: space-between;">
                            <span><strong>${c.case_number}</strong> - ${c.crime_type}</span>
                            <span style="color: ${deadlineColor};">
                                ${c.deadline ? new Date(c.deadline).toLocaleDateString() : t('no_deadline')}
                                ${c.is_lead_investigator ? ' (' + t('lead') + ')' : ''}
                            </span>
                        </div>
                    `;
                });
                html += '</div>';
            } else {
                html += `<div style="font-size: 13px; color: #6b7280; font-style: italic;">${t('no_active_cases')}</div>`;
            }
            
            contentDiv.html(html);
        }
    } catch (error) {
        console.error('Failed to load investigator details:', error);
        contentDiv.html(`<p style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> ${t('failed_to_load_details')}</p>`);
    }
}
