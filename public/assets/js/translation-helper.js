// ============================================
// Global Translation Helper Functions
// ============================================

/**
 * Translation helper function - available globally
 * @param {string} key - Translation key
 * @param {object} params - Parameters to replace
 * @returns {string} Translated text
 */
window.t = function(key, params = {}) {
    if (window.LanguageManager && typeof LanguageManager.t === 'function') {
        return LanguageManager.t(key, params);
    }
    return key;
};

/**
 * Translate all elements with data-i18n attributes in a container
 * @param {string|jQuery} container - Container selector or jQuery object
 */
window.translateContainer = function(container) {
    const $container = $(container);
    
    // Translate text content
    $container.find('[data-i18n]').each(function() {
        const key = $(this).attr('data-i18n');
        const translation = t(key);
        
        if ($(this).is('input, textarea')) {
            // Don't change input values, only placeholders
        } else {
            $(this).text(translation);
        }
    });
    
    // Translate placeholders
    $container.find('[data-i18n-placeholder]').each(function() {
        const key = $(this).attr('data-i18n-placeholder');
        $(this).attr('placeholder', t(key));
    });
    
    // Translate titles
    $container.find('[data-i18n-title]').each(function() {
        const key = $(this).attr('data-i18n-title');
        $(this).attr('title', t(key));
    });
    
    // Translate values
    $container.find('[data-i18n-value]').each(function() {
        const key = $(this).attr('data-i18n-value');
        $(this).val(t(key));
    });
};

/**
 * Get translated status badge HTML
 * @param {string} status - Status key
 * @returns {string} HTML for status badge
 */
window.getTranslatedStatusBadge = function(status) {
    const statusMap = {
        'draft': { class: 'badge-secondary', key: 'status_draft' },
        'submitted': { class: 'badge-info', key: 'status_submitted' },
        'under_investigation': { class: 'badge-warning', key: 'status_under_investigation' },
        'closed': { class: 'badge-success', key: 'status_closed' },
        'pending': { class: 'badge-warning', key: 'status_pending' },
        'active': { class: 'badge-success', key: 'status_active' },
        'approved': { class: 'badge-success', key: 'approved' },
        'rejected': { class: 'badge-danger', key: 'rejected' }
    };
    
    const statusInfo = statusMap[status] || { class: 'badge-secondary', key: status };
    return `<span class="badge ${statusInfo.class}" data-i18n="${statusInfo.key}">${t(statusInfo.key)}</span>`;
};

/**
 * Get translated priority badge HTML
 * @param {string} priority - Priority level
 * @returns {string} HTML for priority badge
 */
window.getTranslatedPriorityBadge = function(priority) {
    const priorityMap = {
        'low': { class: 'badge-info', key: 'priority_low' },
        'medium': { class: 'badge-warning', key: 'priority_medium' },
        'high': { class: 'badge-danger', key: 'priority_high' },
        'critical': { class: 'badge-danger', key: 'priority_critical' }
    };
    
    const priorityInfo = priorityMap[priority] || { class: 'badge-secondary', key: priority };
    return `<span class="badge ${priorityInfo.class}" data-i18n="${priorityInfo.key}">${t(priorityInfo.key)}</span>`;
};

/**
 * Common table headers translations
 */
window.TABLE_HEADERS = {
    case_number: () => t('case_number'),
    ob_number: () => t('ob_number'),
    case_type: () => t('case_type'),
    crime_type: () => t('crime_type'),
    status: () => t('status'),
    priority: () => t('priority'),
    incident_date: () => t('incident_date'),
    report_date: () => t('report_date'),
    date_created: () => t('date_created'),
    date_assigned: () => t('date_assigned'),
    assigned_to: () => t('assigned_to'),
    actions: () => t('actions'),
    name: () => t('name'),
    full_name: () => t('full_name'),
    email: () => t('email'),
    phone: () => t('phone'),
    role: () => t('user_role'),
    created_at: () => t('created_at'),
    updated_at: () => t('updated_at')
};

/**
 * Common button labels
 */
window.BUTTON_LABELS = {
    view: () => `<i class="fas fa-eye"></i> ${t('view')}`,
    edit: () => `<i class="fas fa-edit"></i> ${t('edit')}`,
    delete: () => `<i class="fas fa-trash"></i> ${t('delete')}`,
    save: () => `<i class="fas fa-save"></i> ${t('save')}`,
    cancel: () => `<i class="fas fa-times"></i> ${t('cancel')}`,
    submit: () => `<i class="fas fa-paper-plane"></i> ${t('submit')}`,
    approve: () => `<i class="fas fa-check"></i> ${t('approve')}`,
    reject: () => `<i class="fas fa-times"></i> ${t('reject')}`,
    download: () => `<i class="fas fa-download"></i> ${t('download')}`,
    upload: () => `<i class="fas fa-upload"></i> ${t('upload')}`,
    export: () => `<i class="fas fa-file-export"></i> ${t('export')}`,
    print: () => `<i class="fas fa-print"></i> ${t('print')}`,
    add: () => `<i class="fas fa-plus"></i> ${t('add')}`,
    search: () => `<i class="fas fa-search"></i> ${t('search')}`,
    filter: () => `<i class="fas fa-filter"></i> ${t('filter')}`,
    refresh: () => `<i class="fas fa-sync"></i> ${t('refresh')}`
};

/**
 * Empty state message
 */
window.getEmptyStateHTML = function(iconClass, titleKey, messageKey) {
    return `
        <div style="text-align: center; padding: 60px; color: #6b7280;">
            <i class="${iconClass}" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
            <h3 data-i18n="${titleKey}">${t(titleKey)}</h3>
            <p data-i18n="${messageKey}">${t(messageKey)}</p>
        </div>
    `;
};

/**
 * Loading state message
 */
window.getLoadingHTML = function(messageKey = 'loading_data') {
    return `
        <div class="loading" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #667eea; margin-bottom: 15px;"></i>
            <p data-i18n="${messageKey}">${t(messageKey)}</p>
        </div>
    `;
};

/**
 * Page title setter with translation
 */
window.setPageTitle = function(titleKey) {
    $('#pageTitle').attr('data-i18n', titleKey).text(t(titleKey));
    document.title = `${t(titleKey)} - PCMS`;
};

/**
 * Format date with localization
 */
window.formatDate = function(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString(LanguageManager.currentLanguage === 'so' ? 'so-SO' : 'en-US');
};

/**
 * Format datetime with localization
 */
window.formatDateTime = function(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString(LanguageManager.currentLanguage === 'so' ? 'so-SO' : 'en-US');
};

console.log('✅ Translation helper loaded');
