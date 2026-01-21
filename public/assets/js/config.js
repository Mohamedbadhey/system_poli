// ============================================
// PCMS Configuration
// ============================================

const API_BASE_URL = 'http://localhost:8080'; // CodeIgniter API base URL
const APP_NAME = 'Police Case Management System';
const VERSION = '1.0.0';

// API Endpoints
const API_ENDPOINTS = {
    // Authentication
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    
    // Admin
    USERS: '/admin/users',
    CENTERS: '/admin/centers',
    AUDIT_LOGS: '/admin/audit-logs',
    ADMIN_DASHBOARD: '/admin/dashboard',
    
    // OB Officer
    OB_CASES: '/ob/cases',
    PERSONS: '/ob/persons',
    FINGERPRINT_SEARCH: '/ob/persons/search-fingerprint',
    CUSTODY: '/ob/custody',
    CUSTODY_ACTIVE: '/ob/custody/active',
    
    // Station Admin
    PENDING_CASES: '/station/cases/pending',
    ASSIGN_CASE: '/station/cases/{id}/assign',
    
    // Investigation
    INVESTIGATOR_CASES: '/investigation/cases',
    EVIDENCE: '/investigation/cases/{id}/evidence',
    REPORTS: '/investigation/cases/{id}/reports',
    
    // Court
    COURT_CASES: '/court/cases',
    COURT_SUBMIT: '/court/cases/{id}/submit',
    
    // Common
    NOTIFICATIONS: '/api/notifications',
    DASHBOARD: '/api/dashboard'
};

// User Roles
const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    OB_OFFICER: 'ob_officer',
    INVESTIGATOR: 'investigator',
    COURT_USER: 'court_user'
};

// Case Status
const CASE_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    RETURNED: 'returned',
    APPROVED: 'approved',
    ASSIGNED: 'assigned',
    INVESTIGATING: 'investigating',
    SOLVED: 'solved',
    ESCALATED: 'escalated',
    COURT_PENDING: 'court_pending',
    CLOSED: 'closed'
};

// Priority Levels
const PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Crime Categories
const CRIME_CATEGORIES = [
    { value: 'violent', label: 'Violent Crime' },
    { value: 'property', label: 'Property Crime' },
    { value: 'drug', label: 'Drug Related' },
    { value: 'cybercrime', label: 'Cybercrime' },
    { value: 'sexual', label: 'Sexual Offense' },
    { value: 'juvenile', label: 'Juvenile Case' },
    { value: 'other', label: 'Other' }
];

// Evidence Types
const EVIDENCE_TYPES = [
    { value: 'photo', label: 'Photograph' },
    { value: 'video', label: 'Video Recording' },
    { value: 'audio', label: 'Audio Recording' },
    { value: 'document', label: 'Document' },
    { value: 'physical', label: 'Physical Evidence' },
    { value: 'digital', label: 'Digital Evidence' }
];

// Date Format
const DATE_FORMAT = 'YYYY-MM-DD';
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Pagination
const DEFAULT_PAGE_SIZE = 20;

// File Upload Limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
