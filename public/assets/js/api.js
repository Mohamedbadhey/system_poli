// ============================================
// API Helper Functions
// ============================================

class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = this.getToken();
    }
    
    // Get token from localStorage
    getToken() {
        return localStorage.getItem('auth_token');
    }
    
    // Set token
    setToken(token) {
        localStorage.setItem('auth_token', token);
        this.token = token;
    }
    
    // Clear token
    clearToken() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        this.token = null;
    }
    
    // Get headers
    getHeaders(isMultipart = false) {
        const headers = {};
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }
        
        return headers;
    }
    
    // Generic request method
    async request(method, endpoint, data = null, isMultipart = false) {
        const url = this.baseURL + endpoint;
        const options = {
            method: method,
            headers: this.getHeaders(isMultipart)
        };
        
        if (data) {
            if (isMultipart) {
                options.body = data; // FormData
            } else if (method !== 'GET') {
                options.body = JSON.stringify(data);
            }
        }
        
        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                console.error('API Error Response:', result);
                // Return error with structured data for better handling
                const error = new Error(result.message || 'Request failed');
                error.response = result;
                error.status = response.status;
                throw error;
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // GET request
    async get(endpoint, params = null) {
        let url = endpoint;
        if (params && Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url = `${endpoint}?${queryString}`;
        }
        return this.request('GET', url);
    }
    
    // POST request
    async post(endpoint, data, useFormData = false) {
        if (useFormData && !(data instanceof FormData)) {
            // Convert object to form data for login
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                formData.append(key, data[key]);
            });
            return this.request('POST', endpoint, formData, true);
        }
        return this.request('POST', endpoint, data);
    }
    
    // PUT request
    async put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }
    
    // DELETE request
    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
    
    // Upload file
    async upload(endpoint, formData) {
        return this.request('POST', endpoint, formData, true);
    }
}

// Create global API instance
const api = new APIClient();

// Helper function to get the correct categories endpoint based on user role
function getCategoriesEndpoint() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userRole = userData.role;
    
    // Admins and super_admins use /admin/categories (full access)
    // OB officers use /ob/categories (read-only)
    // Investigators use /investigation/categories (read-only)
    if (userRole === 'super_admin' || userRole === 'admin') {
        return '/admin/categories';
    } else if (userRole === 'investigator') {
        return '/investigation/categories';
    } else {
        return '/ob/categories';
    }
}

// Authentication API
const authAPI = {
    login: (credentials) => api.post(API_ENDPOINTS.LOGIN, credentials, true), // Use form data for login
    logout: () => api.post(API_ENDPOINTS.LOGOUT),
    refreshToken: (refreshToken) => api.post(API_ENDPOINTS.REFRESH_TOKEN, { refresh_token: refreshToken }),
    getMe: () => api.get(API_ENDPOINTS.ME),
    changePassword: (passwords) => api.post(API_ENDPOINTS.CHANGE_PASSWORD, passwords)
};

// Admin API
const adminAPI = {
    // Users
    getUsers: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return api.get(API_ENDPOINTS.USERS + (query ? '?' + query : ''));
    },
    createUser: (userData) => api.post(API_ENDPOINTS.USERS, userData),
    getUser: (id) => api.get(`${API_ENDPOINTS.USERS}/${id}`),
    updateUser: (id, userData) => api.put(`${API_ENDPOINTS.USERS}/${id}`, userData),
    deleteUser: (id) => api.delete(`${API_ENDPOINTS.USERS}/${id}`),
    toggleUserStatus: (id) => api.post(`${API_ENDPOINTS.USERS}/${id}/toggle-status`),
    
    // Centers
    getCenters: () => api.get(API_ENDPOINTS.CENTERS),
    createCenter: (centerData) => api.post(API_ENDPOINTS.CENTERS, centerData),
    getCenter: (id) => api.get(`${API_ENDPOINTS.CENTERS}/${id}`),
    updateCenter: (id, centerData) => api.put(`${API_ENDPOINTS.CENTERS}/${id}`, centerData),
    
    // Categories
    getCategories: () => api.get(getCategoriesEndpoint()),
    createCategory: (categoryData) => api.post('/admin/categories', categoryData),
    getCategory: (id) => api.get(`${getCategoriesEndpoint()}/${id}`),
    updateCategory: (id, categoryData) => api.put(`/admin/categories/${id}`, categoryData),
    deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
    getCasesByCategory: (id) => api.get(`${getCategoriesEndpoint()}/${id}/cases`),
    toggleCategoryStatus: (id) => api.post(`/admin/categories/${id}/toggle-status`),
    updateCategoryOrder: (orderData) => api.post('/admin/categories/update-order', { order: orderData }),
    getCategoryWithCases: (id) => api.get(`${getCategoriesEndpoint()}/${id}/cases`),
    
    // Dashboard
    getDashboard: () => api.get(API_ENDPOINTS.ADMIN_DASHBOARD),
    
    // Audit Logs
    getAuditLogs: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return api.get(API_ENDPOINTS.AUDIT_LOGS + (query ? '?' + query : ''));
    }
};

// OB Officer API
const obAPI = {
    // Cases
    getCases: () => api.get(API_ENDPOINTS.OB_CASES),
    createCase: (caseData) => api.post(API_ENDPOINTS.OB_CASES, caseData),
    getCase: (id) => api.get(`${API_ENDPOINTS.OB_CASES}/${id}`),
    updateCase: (id, caseData) => api.put(`${API_ENDPOINTS.OB_CASES}/${id}`, caseData),
    submitCase: (id) => api.post(`${API_ENDPOINTS.OB_CASES}/${id}/submit`),
    addCaseParty: (caseId, partyData) => api.post(`${API_ENDPOINTS.OB_CASES}/${caseId}/parties`, partyData),
    addCaseRelationship: (caseId, relationshipData) => api.post(`${API_ENDPOINTS.OB_CASES}/${caseId}/relationships`, relationshipData),
    getCaseRelationships: (caseId) => api.get(`${API_ENDPOINTS.OB_CASES}/${caseId}/relationships`),
    
    // Persons
    createPerson: (personData) => api.post(API_ENDPOINTS.PERSONS, personData),
    getAllPersons: () => api.get(API_ENDPOINTS.PERSONS),
    getPerson: (id) => api.get(`${API_ENDPOINTS.PERSONS}/${id}`),
    updatePerson: (id, personData) => api.put(`${API_ENDPOINTS.PERSONS}/${id}`, personData),
    getPersonCases: (id) => api.get(`${API_ENDPOINTS.PERSONS}/${id}/cases`),
    getPersonCustody: (id) => api.get(`${API_ENDPOINTS.PERSONS}/${id}/custody`),
    searchByFingerprint: (fingerprintData) => api.post(API_ENDPOINTS.FINGERPRINT_SEARCH, { fingerprint_data: fingerprintData }),
    getCriminalHistory: (id) => api.get(`${API_ENDPOINTS.PERSONS}/${id}/history`),
    
    // Custody
    createCustody: (custodyData) => api.post(API_ENDPOINTS.CUSTODY, custodyData),
    getCustody: (id) => api.get(`${API_ENDPOINTS.CUSTODY}/${id}`),
    getAllCustody: (params = {}) => api.get(API_ENDPOINTS.CUSTODY, params),
    updateCustody: (id, custodyData) => api.put(`${API_ENDPOINTS.CUSTODY}/${id}`, custodyData),
    addDailyLog: (id, logData) => api.post(`${API_ENDPOINTS.CUSTODY}/${id}/daily-log`, logData),
    getActiveCustody: () => api.get(API_ENDPOINTS.CUSTODY_ACTIVE),
    recordMovement: (id, movementData) => api.post(`${API_ENDPOINTS.CUSTODY}/${id}/movement`, movementData),
    
    // Bailers
    getAllBailers: () => api.get('/ob/bailers')
};

// Station Admin API
const stationAPI = {
    getCases: () => api.get('/station/cases'),
    getCase: (id) => api.get(`/station/cases/${id}`),
    getPendingCases: () => api.get(API_ENDPOINTS.PENDING_CASES),
    approveCase: (id) => api.post(`/station/cases/${id}/approve`),
    returnCase: (id, reason) => api.post(`/station/cases/${id}/return`, { reason }),
    assignInvestigator: (assignmentData) => api.post(`/station/assignments`, assignmentData),
    assignInvestigators: (id, assignmentData) => api.post(`/station/cases/${id}/assign`, assignmentData),
    updateDeadline: (id, deadline) => api.put(`/station/cases/${id}/deadline`, { deadline }),
    updatePriority: (id, priority) => api.put(`/station/cases/${id}/priority`, { priority }),
    getDashboard: () => api.get('/station/dashboard'),
    getAvailableInvestigators: () => api.get('/station/investigators/available'),
    getInvestigators: () => api.get('/station/investigators'),
    getInvestigatorWorkload: (id) => api.get(`/station/investigators/${id}/workload`)
};

// Investigation API
const investigationAPI = {
    // Persons in investigator's cases
    getCasePersons: () => api.get('/investigation/persons'),
    getPerson: (id) => api.get(`/investigation/persons/${id}`),
    
    getAssignedCases: () => api.get('/investigation/cases'),
    getCases: () => api.get(API_ENDPOINTS.INVESTIGATOR_CASES),
    getCase: (id) => api.get(`${API_ENDPOINTS.INVESTIGATOR_CASES}/${id}`),
    getCaseEvidence: (caseId) => api.get(`/investigation/cases/${caseId}/evidence`),
    uploadEvidence: (caseId, formData) => api.upload(`/investigation/cases/${caseId}/evidence`, formData),
    getEvidence: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return api.get('/investigation/evidence' + (query ? '?' + query : ''));
    },
    updateEvidence: (id, data) => api.put(`/investigation/evidence/${id}`, data),
    getEvidenceHistory: (id) => api.get(`/investigation/evidence/${id}/history`),
    downloadEvidence: (id) => api.get(`/investigation/evidence/${id}/download`),
    createReport: (caseId, reportData) => api.post(`/investigation/cases/${caseId}/reports`, reportData),
    getCaseReports: (caseId) => api.get(`/investigation/cases/${caseId}/reports`),
    signReport: (reportId) => api.post(`/investigation/reports/${reportId}/sign`),
    addTimelineEntry: (caseId, data) => api.post(`/investigation/cases/${caseId}/timeline`, data),
    getCaseTimeline: (caseId) => api.get(`/investigation/cases/${caseId}/timeline`),
    
    // Court Workflow
    closeCase: (id, closureData) => {
        // Support both old format (string) and new format (object)
        const data = typeof closureData === 'string' 
            ? { closure_reason: closureData, closure_type: 'investigator_closed' }
            : closureData;
        return api.post(`/investigation/cases/${id}/close`, data);
    },
    
    // Solved cases dashboard
    getInvestigatorDashboardStats: () => api.get('/investigation/dashboard/stats'),
    getSolvedCasesStats: () => api.get('/investigation/cases/solved-stats'),
    getAllSolvedCases: (params) => {
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
        return api.get(`/investigation/cases/all-solved${queryString}`);
    },
    sendToCourt: (id, courtNotes) => api.post(`/investigation/cases/${id}/send-to-court`, { court_notes: courtNotes }),
    escalateCase: (id) => api.post(`/investigation/cases/${id}/escalate`),
    
    // Reports
    generateReport: (id) => api.get(`/investigation/cases/${id}/report`),
    generateFullReport: (id) => api.get(`/investigation/cases/${id}/report/full`),
    printReport: (id) => `/investigation/cases/${id}/report/print`,
    
    // Conclusions
    getConclusion: (caseId) => api.get(`/investigation/cases/${caseId}/conclusion`),
    saveConclusion: (caseId, data) => api.post(`/investigation/cases/${caseId}/conclusion`, data),
    
    // Case Reopening
    reopenCase: (id, reopenData) => api.post(`/investigation/cases/${id}/reopen`, reopenData),
    getReopenHistory: (id) => api.get(`/investigation/cases/${id}/reopen-history`),
    canReopenCase: (id) => api.get(`/investigation/cases/${id}/can-reopen`)
};

// Court API
const courtAPI = {
    // Dashboard
    getDashboard: () => api.get('/court/dashboard'),
    
    // Cases
    getCases: () => api.get('/court/cases'),
    getCourtCases: () => api.get('/court/cases'),
    getCase: (id) => api.get(`/court/cases/${id}`),
    
    // Actions
    closeCase: (id, closureReason) => api.post(`/court/cases/${id}/close`, { closure_reason: closureReason }),
    assignToInvestigator: (id, data) => api.post(`/court/cases/${id}/assign-investigator`, data),
    markAsReview: (id) => api.post(`/court/cases/${id}/mark-review`),
    getCaseHistory: (id) => api.get(`/court/cases/${id}/history`),
    
    // Investigators
    getInvestigators: () => api.get('/court/investigators'),
    
    // Reports
    generateReport: (id) => api.get(`/court/cases/${id}/report`),
    printReport: (id) => `/court/cases/${id}/report/print`,
    
    // Legacy
    submitToCourt: (id) => api.post(`/court/cases/${id}/submit`),
    uploadDecision: (id, formData) => api.upload(`/court/cases/${id}/decision`, formData)
};

// Common API
const commonAPI = {
    getNotifications: () => api.get(API_ENDPOINTS.NOTIFICATIONS),
    markNotificationRead: (id) => api.post(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`),
    markAllNotificationsRead: () => api.post(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`),
    getDashboard: () => api.get(API_ENDPOINTS.DASHBOARD),
    searchCases: (keyword) => api.post('/api/search/cases', { keyword }),
    searchPersons: (keyword) => api.post('/api/search/persons', { keyword })
};

// Expose API objects globally for easy access across all pages
window.api = api;
window.authAPI = authAPI;
window.adminAPI = adminAPI;
window.obAPI = obAPI;
window.stationAPI = stationAPI;
window.investigationAPI = investigationAPI;
window.courtAPI = courtAPI;
window.commonAPI = commonAPI;
