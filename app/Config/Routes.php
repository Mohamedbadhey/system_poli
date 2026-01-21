<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
// Serve static login page directly
$routes->get('/', 'Home::index');

// Public Certificate Verification Route (no auth required)
$routes->get('verify-certificate/(:any)', 'Investigation\CertificateController::verify/$1');

/*
 * --------------------------------------------------------------------
 * POLICE CASE MANAGEMENT SYSTEM - API Routes
 * --------------------------------------------------------------------
 */

// Public routes (no authentication required)
$routes->group('auth', function($routes) {
    $routes->post('login', 'AuthController::login');
    $routes->post('refresh-token', 'AuthController::refreshToken');
});

// Protected API routes (require authentication)
$routes->group('auth', ['filter' => 'auth'], function($routes) {
    $routes->post('logout', 'AuthController::logout');
    $routes->get('me', 'AuthController::me');
    $routes->post('change-password', 'AuthController::changePassword');
});

// Admin Routes (require admin or super_admin role)
$routes->group('admin', ['filter' => ['auth:super_admin,admin']], function($routes) {
    $routes->get('cases', 'Admin\CaseController::index');
    // User Management
    $routes->get('users', 'Admin\\UserController::index');
    $routes->post('users', 'Admin\\UserController::create');
    $routes->get('users/(:num)', 'Admin\\UserController::show/$1');
    $routes->put('users/(:num)', 'Admin\\UserController::update/$1');
    $routes->delete('users/(:num)', 'Admin\\UserController::delete/$1');
    $routes->post('users/(:num)/toggle-status', 'Admin\\UserController::toggleStatus/$1');
    
    // Police Center Management
    $routes->get('centers', 'Admin\\CenterController::index');
    $routes->post('centers', 'Admin\\CenterController::create');
    $routes->get('centers/(:num)', 'Admin\\CenterController::show/$1');
    $routes->put('centers/(:num)', 'Admin\\CenterController::update/$1');
    
    // Category Management
    $routes->get('categories', 'Admin\\CategoryController::index');
    $routes->post('categories', 'Admin\\CategoryController::create');
    $routes->get('categories/(:num)', 'Admin\\CategoryController::show/$1');
    $routes->put('categories/(:num)', 'Admin\\CategoryController::update/$1');
    $routes->delete('categories/(:num)', 'Admin\\CategoryController::delete/$1');
    $routes->post('categories/(:num)/toggle-status', 'Admin\\CategoryController::toggleStatus/$1');
    $routes->post('categories/update-order', 'Admin\\CategoryController::updateOrder');
    $routes->get('categories/(:num)/cases', 'Admin\\CategoryController::getCasesByCategory/$1');
    
    // Dashboard
    $routes->get('dashboard', 'Admin\\DashboardController::index');
    $routes->get('dashboard/stats', 'Admin\\DashboardController::stats');
    
    // Audit Logs
    $routes->get('audit-logs', 'Admin\\AuditController::index');
    $routes->get('audit-logs/(:num)', 'Admin\\AuditController::show/$1');
    $routes->get('audit-logs/export', 'Admin\\AuditController::export');
    
    // Reports and Analytics
    $routes->get('users/(:num)/report', 'Admin\\UserReportController::show/$1');
    $routes->get('centers/(:num)/report', 'Admin\\CenterReportController::show/$1');
    $routes->get('categories/(:num)/report', 'Admin\\CategoryReportController::show/$1');
    $routes->get('categories/summary', 'Admin\\CategoryReportController::summary');
    
    // Admin Case Access (cross-center)
    $routes->get('cases/(:num)', 'Admin\\CaseController::show/$1');
    $routes->get('cases', 'Admin\\CaseController::index');
});

// OB Officer Routes (OB Officers and Admins can create cases)
$routes->group('ob', ['filter' => ['auth:ob_officer,admin,super_admin']], function($routes) {
    // Categories (read-only access for OB officers)
    $routes->get('categories', 'Admin\\CategoryController::index');
    $routes->get('categories/(:num)/cases', 'Admin\\CategoryController::getCasesByCategory/$1');
    
    // Case Management
    $routes->get('cases', 'OB\CaseController::index');
    $routes->post('cases', 'OB\CaseController::create');
    $routes->post('cases/incident', 'OB\CaseController::createIncident');
    $routes->get('cases/(:num)', 'OB\CaseController::show/$1');
    $routes->put('cases/(:num)', 'OB\CaseController::update/$1');
    $routes->delete('cases/(:num)', 'OB\CaseController::delete/$1');
    $routes->post('cases/(:num)/submit', 'OB\CaseController::submit/$1');
    $routes->post('cases/(:num)/parties', 'OB\CaseController::addParty/$1');
    $routes->post('cases/(:num)/relationships', 'OB\CaseController::addRelationship/$1');
    $routes->get('cases/(:num)/relationships', 'OB\CaseController::getRelationships/$1');
    
    // Person Management
    $routes->get('persons', 'OB\PersonController::index');
    $routes->post('persons', 'OB\PersonController::create');
    $routes->get('persons/(:num)', 'OB\PersonController::show/$1');
    $routes->put('persons/(:num)', 'OB\PersonController::update/$1');
    $routes->get('persons/(:num)/cases', 'OB\PersonController::cases/$1');
    $routes->get('persons/(:num)/custody', 'OB\PersonController::custody/$1');
    $routes->get('persons/(:num)/history', 'OB\PersonController::history/$1');
    $routes->post('persons/search', 'OB\PersonController::search');
    $routes->post('persons/search-fingerprint', 'OB\PersonController::searchByFingerprint');
    $routes->get('bailers', 'OB\PersonController::bailers');
    
    // Custody Management
    $routes->get('custody', 'OB\CustodyController::index');
    $routes->post('custody', 'OB\CustodyController::create');
    $routes->get('custody/(:num)', 'OB\CustodyController::show/$1');
    $routes->put('custody/(:num)', 'OB\CustodyController::update/$1');
    $routes->get('custody/active', 'OB\CustodyController::getActiveCustody');
    $routes->post('custody/(:num)/daily-log', 'OB\CustodyController::addDailyLog/$1');
    $routes->post('custody/(:num)/movement', 'OB\CustodyController::recordMovement/$1');
    $routes->get('custody/(:num)/alerts', 'OB\CustodyController::getAlerts/$1');
});

// Station Admin Routes
$routes->group('station', ['filter' => ['auth:admin,super_admin']], function($routes) {
    // Case Review & Assignment
    $routes->get('cases', 'Station\CaseReviewController::index');
    $routes->get('cases/pending', 'Station\CaseReviewController::pending');
    $routes->get('cases/(:num)', 'Station\CaseReviewController::show/$1');
    $routes->post('cases/(:num)/approve', 'Station\CaseReviewController::approve/$1');
    $routes->post('cases/(:num)/return', 'Station\CaseReviewController::returnCase/$1');
    $routes->post('cases/(:num)/assign', 'Station\AssignmentController::assignInvestigators/$1');
    $routes->put('cases/(:num)/deadline', 'Station\AssignmentController::updateDeadline/$1');
    $routes->put('cases/(:num)/priority', 'Station\AssignmentController::updatePriority/$1');
    
    // Investigator Management
    $routes->get('investigators', 'Station\InvestigatorController::index');
    $routes->get('investigators/available', 'Station\InvestigatorController::available');
    $routes->get('investigators/(:num)/workload', 'Station\InvestigatorController::workload/$1');
    
    // Dashboard
    $routes->get('dashboard', 'Station\DashboardController::index');
    $routes->get('dashboard/stats', 'Station\DashboardController::stats');
    
    // Assignments
    $routes->post('assignments', 'Station\AssignmentController::create');
    $routes->get('assignments', 'Station\AssignmentController::index');
    
    // Case Tracking Dashboard
    $routes->get('cases/assigned-tracking', 'Station\CaseTrackingController::getAssignedCases');
    $routes->get('investigators/performance', 'Station\CaseTrackingController::getInvestigatorPerformance');
    $routes->get('cases/(:num)/team', 'Station\CaseTrackingController::getCaseTeam/$1');
    $routes->post('cases/(:num)/deadline', 'Station\CaseTrackingController::updateDeadline/$1');
    $routes->get('investigators/(:num)/cases', 'Station\\CaseTrackingController::getInvestigatorCases/$1');
    $routes->get('investigators/(:num)/profile', 'Station\\CaseTrackingController::getInvestigatorProfile/$1');
});

// Admin Routes (Admin and Super Admin only)
$routes->group('admin', ['filter' => ['auth:admin,super_admin']], function($routes) {
    // Daily Operations Dashboard
    $routes->get('daily-operations', 'Admin\DailyOperationsController::index');
    $routes->get('daily-operations/export-pdf', 'Admin\DailyOperationsController::exportPDF');
    $routes->get('daily-operations/export-excel', 'Admin\DailyOperationsController::exportExcel');
    
    // Dashboard & Statistics
    $routes->get('dashboard', 'Admin\DashboardController::index');
    $routes->get('dashboard/stats', 'Admin\DashboardController::stats');
    
    // User Management
    $routes->get('users', 'Admin\UserController::index');
    $routes->post('users', 'Admin\UserController::create');
    $routes->get('users/(:num)', 'Admin\UserController::show/$1');
    $routes->put('users/(:num)', 'Admin\UserController::update/$1');
    $routes->delete('users/(:num)', 'Admin\UserController::delete/$1');
    
    // Category Management
    $routes->get('categories', 'Admin\CategoryController::index');
    $routes->post('categories', 'Admin\CategoryController::create');
    $routes->get('categories/(:num)', 'Admin\CategoryController::show/$1');
    $routes->put('categories/(:num)', 'Admin\CategoryController::update/$1');
    $routes->delete('categories/(:num)', 'Admin\CategoryController::delete/$1');
    $routes->get('categories/(:num)/cases', 'Admin\CategoryController::getCasesByCategory/$1');
    
    // Case Management
    $routes->get('cases', 'Admin\CaseController::index');
    $routes->get('cases/(:num)', 'Admin\CaseController::show/$1');
    
    // Reports
    $routes->get('reports/users', 'Admin\UserReportController::index');
    $routes->get('reports/categories', 'Admin\CategoryReportController::index');
    $routes->get('reports/centers', 'Admin\CenterReportController::index');
    
    // Report Settings
    $routes->get('report-settings', 'Admin\ReportSettingsController::index');
    $routes->post('report-settings', 'Admin\ReportSettingsController::save');
    $routes->post('report-settings/header', 'Admin\ReportSettingsController::uploadHeader');
});

// Investigation Routes
$routes->group('investigation', ['filter' => ['auth:investigator,admin,super_admin']], function($routes) {
    // Categories (read-only access for investigators)
    $routes->get('categories', 'Admin\\CategoryController::index');
    $routes->get('categories/(:num)/cases', 'Admin\\CategoryController::getCasesByCategory/$1');
    
    // Persons in investigator's cases
    $routes->get('persons', 'Investigation\\PersonController::index');
    $routes->get('persons/(:num)', 'Investigation\\PersonController::show/$1');
    
    // Case Management
    $routes->get('cases', 'Investigation\\CaseController::assignedCases');
    $routes->get('cases/(:num)', 'Investigation\\CaseController::show/$1');
    $routes->post('cases/(:num)/close', 'Investigation\\CaseController::closeCase/$1');
    $routes->post('cases/(:num)/send-to-court', 'Investigation\\CaseController::sendToCourt/$1');
    $routes->post('cases/(:num)/escalate', 'Investigation\\CaseController::escalateToCourtPrep/$1');
    
    // Dashboard Stats
    $routes->get('dashboard/stats', 'Investigation\\CaseController::getInvestigatorDashboardStats');
    
    // Solved Cases
    $routes->get('cases/solved-by-investigator', 'Investigation\\CaseController::solvedByInvestigator');
    $routes->get('cases/solved-by-court', 'Investigation\\CaseController::solvedByCourt');
    $routes->get('cases/all-solved', 'Investigation\\CaseController::getAllSolvedCases');
    $routes->get('cases/solved-stats', 'Investigation\\CaseController::getSolvedCasesStats');
    
    // Case Reopening
    $routes->post('cases/(:num)/reopen', 'Investigation\\CaseController::reopenCase/$1');
    $routes->get('cases/(:num)/reopen-history', 'Investigation\\CaseController::getReopenHistory/$1');
    $routes->get('cases/(:num)/can-reopen', 'Investigation\\CaseController::canReopenCase/$1');
    
    // Court Acknowledgment & Custody Documentation
    $routes->get('cases/(:num)/court-acknowledgment', 'Investigation\\CaseController::getCourtAcknowledgment/$1');
    $routes->post('cases/(:num)/court-acknowledgment', 'Investigation\\CaseController::uploadCourtAcknowledgment/$1');
    $routes->delete('cases/(:num)/court-acknowledgment', 'Investigation\\CaseController::deleteCourtAcknowledgment/$1');
    $routes->get('cases/(:num)/custody-documentation', 'Investigation\\CaseController::getCustodyDocumentation/$1');
    $routes->post('cases/(:num)/custody-documentation', 'Investigation\\CaseController::saveCustodyDocumentation/$1');
    $routes->post('cases/(:num)/custody-documentation/(:num)', 'Investigation\\CaseController::updateCustodyDocumentation/$1/$2');
    
    // Case Reports
    $routes->get('cases/(:num)/report', 'Reports\\CaseReportController::generateReport/$1');
    $routes->get('cases/(:num)/report/print', 'Reports\\CaseReportController::printReport/$1');
    $routes->get('cases/(:num)/report/full', 'Reports\\CaseReportController::generateFullReport/$1');
    
    // Investigator Conclusions
    $routes->get('cases/(:num)/conclusion', 'Investigation\\ConclusionController::show/$1');
    $routes->post('cases/(:num)/conclusion', 'Investigation\\ConclusionController::save/$1');
    $routes->post('cases/(:num)/conclusion/submit', 'Investigation\\ConclusionController::submit/$1');
    
    // Party Management (Add accused/accuser/witness to case)
    $routes->post('cases/(:num)/parties', 'Investigation\\CaseController::addParty/$1');
    $routes->get('cases/(:num)/parties/(:num)', 'Investigation\\CaseController::getParty/$1/$2');
    $routes->put('cases/(:num)/parties/(:num)', 'Investigation\\CaseController::updateParty/$1/$2');
    $routes->post('cases/(:num)/parties/(:num)', 'Investigation\\CaseController::updateParty/$1/$2'); // For FormData
    $routes->post('cases/(:num)/link-person', 'Investigation\\CaseController::linkExistingPerson/$1');
    $routes->get('persons/search', 'Investigation\\CaseController::searchPersons');
    
    // Investigation Notes
    $routes->get('cases/(:num)/notes', 'Investigation\NoteController::getCaseNotes/$1');
    $routes->get('cases/(:num)/persons/(:num)/notes', 'Investigation\NoteController::getPersonNotes/$1/$2');
    $routes->post('cases/(:num)/persons/(:num)/notes', 'Investigation\NoteController::addNote/$1/$2');
    $routes->put('notes/(:num)', 'Investigation\NoteController::editNote/$1');
    $routes->get('notes/(:num)/history', 'Investigation\NoteController::getNoteHistory/$1');
    
    // Evidence Management
    $routes->get('evidence', 'Investigation\\EvidenceController::listAll'); // All evidence
    $routes->get('cases/(:num)/evidence', 'Investigation\\EvidenceController::index/$1');
    $routes->post('cases/(:num)/evidence', 'Investigation\\EvidenceController::create/$1');
    $routes->get('evidence/(:num)', 'Investigation\\EvidenceController::show/$1');
    $routes->put('evidence/(:num)', 'Investigation\\EvidenceController::update/$1');
    $routes->delete('evidence/(:num)', 'Investigation\\EvidenceController::delete/$1');
    $routes->get('evidence/(:num)/history', 'Investigation\\EvidenceController::getEditHistory/$1'); // Edit history
    $routes->post('evidence/(:num)/replace-file', 'Investigation\\EvidenceController::replaceFile/$1'); // Replace file
    $routes->get('evidence/(:num)/download-version/(:num)', 'Investigation\\EvidenceController::downloadVersion/$1/$2'); // Download old version
    $routes->post('evidence/(:num)/custody-log', 'Investigation\\EvidenceController::addCustodyLog/$1');
    $routes->get('evidence/(:num)/download', 'Investigation\\EvidenceController::download/$1');
    
    // Reports
    $routes->get('cases/(:num)/reports', 'Investigation\ReportController::index/$1');
    $routes->post('cases/(:num)/reports', 'Investigation\ReportController::create/$1');
    $routes->get('reports/(:num)', 'Investigation\ReportController::show/$1');
    $routes->put('reports/(:num)', 'Investigation\ReportController::update/$1');
    $routes->post('reports/(:num)/sign', 'Investigation\ReportController::sign/$1');
    $routes->get('reports/(:num)/download', 'Investigation\ReportController::download/$1');
    
    // Timeline
    $routes->post('cases/(:num)/timeline', 'Investigation\CaseController::addTimelineEntry/$1');
    $routes->get('cases/(:num)/timeline', 'Investigation\CaseController::getTimeline/$1');
    
    // Medical Examination Forms
    $routes->get('medical-forms', 'Investigation\MedicalFormController::index');
    $routes->post('medical-forms', 'Investigation\MedicalFormController::save');
    $routes->put('medical-forms/(:num)', 'Investigation\MedicalFormController::save'); // Update form
    $routes->get('medical-forms/my-forms', 'Investigation\MedicalFormController::getMyForms');
    $routes->get('medical-forms/case/(:num)', 'Investigation\MedicalFormController::getByCaseId/$1');
    $routes->get('medical-forms/person/(:num)', 'Investigation\MedicalFormController::getByPersonId/$1');
    $routes->get('medical-forms/(:num)', 'Investigation\MedicalFormController::show/$1');
    $routes->delete('medical-forms/(:num)', 'Investigation\MedicalFormController::delete/$1');
    
    // Saved Full Reports (HTML Files)
    $routes->post('saved-html-report', 'Investigation\SavedHTMLReportController::save');
    $routes->get('saved-html-report/case/(:num)', 'Investigation\SavedHTMLReportController::getByCaseId/$1');
});

// ============================================
// PUBLIC VERIFICATION ROUTES (No Authentication)
// ============================================
$routes->get('verify-medical-form', 'Investigation\MedicalFormController::verify');
$routes->get('medical-forms/public/(:num)', 'Investigation\MedicalFormController::getByIdPublic/$1');
$routes->get('saved-reports/(:num)', 'Investigation\SavedReportController::view/$1');
$routes->get('verify-full-report', 'Investigation\SavedReportController::verify');

// Public report viewing (no authentication required)
$routes->get('public/report/(:segment)', 'Investigation\ReportController::viewPublic/$1');

$routes->group('investigation', ['filter' => ['auth:investigator,admin,super_admin']], function($routes) {
    // Non-Criminal Certificates
    $routes->get('certificates', 'Investigation\CertificateController::index');
    $routes->post('certificates', 'Investigation\CertificateController::create');
    $routes->get('certificates/(:num)', 'Investigation\CertificateController::show/$1');
    $routes->put('certificates/(:num)', 'Investigation\CertificateController::update/$1');
    $routes->delete('certificates/(:num)', 'Investigation\CertificateController::delete/$1');
    $routes->get('certificates/(:num)/verification-url', 'Investigation\CertificateController::getVerificationUrl/$1');
});

// Court Routes
$routes->group('court', ['filter' => ['auth:court_user,admin,super_admin']], function($routes) {
    // Dashboard
    $routes->get('dashboard', 'Court\\CourtController::dashboard');
    
    // Case Management
    $routes->get('cases', 'Court\\CourtController::index');
    $routes->get('cases/(:num)', 'Court\SubmissionController::show/$1');
    $routes->post('cases/(:num)/close', 'Court\\CourtController::closeCase/$1');
    $routes->post('cases/(:num)/assign-investigator', 'Court\\CourtController::assignToInvestigator/$1');
    $routes->post('cases/(:num)/mark-review', 'Court\\CourtController::markAsReview/$1');
    $routes->get('cases/(:num)/history', 'Court\\CourtController::getCaseHistory/$1');
    
    // Investigators
    $routes->get('investigators', 'Court\\CourtController::getInvestigators');
    
    // Case Reports
    $routes->get('cases/(:num)/report', 'Reports\\CaseReportController::generateReport/$1');
    $routes->get('cases/(:num)/report/print', 'Reports\\CaseReportController::printReport/$1');
    
    // Legacy routes
    $routes->post('cases/(:num)/submit', 'Court\SubmissionController::submitToCourt/$1');
    $routes->post('cases/(:num)/decision', 'Court\SubmissionController::uploadDecision/$1');
});

// Common API Routes (accessible to all authenticated users)
$routes->group('api', ['filter' => 'auth'], function($routes) {
    // Notifications
    $routes->get('notifications', 'NotificationController::index');
    $routes->get('notifications/unread', 'NotificationController::unread');
    $routes->post('notifications/(:num)/read', 'NotificationController::markAsRead/$1');
    $routes->post('notifications/read-all', 'NotificationController::markAllAsRead');
    
    // Search
    $routes->post('search/cases', 'SearchController::cases');
    $routes->post('search/persons', 'SearchController::persons');
    
    // Dashboard (role-based)
    $routes->get('dashboard', 'DashboardController::index');
});

// ========================================
// REPORTS SYSTEM ROUTES
// ========================================

// Investigation Reports Routes
$routes->group('api/investigation/reports', ['filter' => 'auth'], function($routes) {
    // Report generation endpoints
    $routes->get('(:num)', 'Investigation\ReportGeneratorController::index/$1');
    $routes->get('show/(:num)', 'Investigation\ReportGeneratorController::show/$1');
    $routes->get('generate/preliminary/(:num)', 'Investigation\ReportGeneratorController::generatePreliminary/$1');
    $routes->get('generate/final/(:num)', 'Investigation\ReportGeneratorController::generateFinal/$1');
    $routes->get('generate/court_submission/(:num)', 'Investigation\ReportGeneratorController::generateCourtSubmission/$1');
    $routes->get('generate/exhibit_list/(:num)', 'Investigation\ReportGeneratorController::generateExhibitList/$1');
    $routes->get('generate/supplementary/(:num)', 'Investigation\ReportGeneratorController::generateSupplementary/$1');
    $routes->get('generate/interim/(:num)', 'Investigation\ReportGeneratorController::generateInterim/$1');
    
    // Save and update operations
    $routes->post('save', 'Investigation\ReportGeneratorController::save');
    $routes->put('(:num)', 'Investigation\ReportGeneratorController::update/$1');
    
    // Workflow operations
    $routes->post('(:num)/submit-approval', 'Investigation\ReportGeneratorController::submitForApproval/$1');
    $routes->post('(:num)/sign', 'Investigation\ReportGeneratorController::sign/$1');
});

// Language Routes
$routes->group('language', function($routes) {
    $routes->get('/', 'LanguageController::index');
    $routes->get('translations/(:segment)', 'LanguageController::getTranslations/$1');
    $routes->get('user/(:num)', 'LanguageController::getUserLanguage/$1', ['filter' => 'auth']);
    $routes->post('user/update', 'LanguageController::updateUserLanguage', ['filter' => 'auth']);
});

// Report Settings Routes (Admin and Investigator) - No auth filter for reading
$routes->group('api/report-settings', function($routes) {
    $routes->get('/', 'Admin\ReportSettingsController::index');
    $routes->get('show/(:segment)', 'Admin\ReportSettingsController::show/$1');
    $routes->get('header-image', 'Admin\ReportSettingsController::getHeaderImage');
    $routes->post('upload-header', 'Admin\ReportSettingsController::updateHeaderImage');
    $routes->post('update-full-sections', 'Admin\ReportSettingsController::updateFullReportSections');
    $routes->post('update-basic-sections', 'Admin\ReportSettingsController::updateBasicReportSections');
    $routes->post('update-statements', 'Admin\ReportSettingsController::updateStatements');
    $routes->put('(:segment)', 'Admin\ReportSettingsController::update/$1');
});

// Report Approvals Routes
$routes->group('api/investigation/reports/approvals', ['filter' => 'auth'], function($routes) {
    $routes->get('pending', 'Investigation\ReportApprovalController::getPendingApprovals');
    $routes->post('(:num)/approve', 'Investigation\ReportApprovalController::approve/$1');
    $routes->post('(:num)/reject', 'Investigation\ReportApprovalController::reject/$1');
    $routes->get('(:num)/history', 'Investigation\ReportApprovalController::getApprovalHistory/$1');
});

// PDF Generation Routes
$routes->group('api/investigation/reports/pdf', ['filter' => 'auth'], function($routes) {
    $routes->post('(:num)/generate', 'Investigation\ReportPDFController::generate/$1');
    $routes->get('download/(:num)', 'Investigation\ReportPDFController::download/$1');
    $routes->get('preview/(:num)', 'Investigation\ReportPDFController::preview/$1');
    $routes->post('batch-generate', 'Investigation\ReportPDFController::batchGenerate');
    $routes->post('preview-data', 'Investigation\ReportPDFController::previewFromData');
});

// Court Reports Routes
$routes->group('api/court/reports', ['filter' => 'auth'], function($routes) {
    $routes->get('case/(:num)', 'Court\CourtReportController::getCaseReports/$1');
    $routes->get('generate/court_status/(:num)', 'Court\CourtReportController::generateCourtStatus/$1');
    $routes->get('generate/case_closure/(:num)', 'Court\CourtReportController::generateCaseClosure/$1');
    $routes->post('communications', 'Court\CourtReportController::recordCommunication');
    $routes->get('communications/(:num)', 'Court\CourtReportController::getCommunications/$1');
});

// Admin Management Routes (Super Admin and Admin only)
$routes->group('admin', ['filter' => 'auth', 'namespace' => 'App\Controllers\Admin'], function($routes) {
    // User Management
    $routes->get('users', 'UserController::index');
    $routes->get('users/(:num)', 'UserController::show/$1');
    $routes->post('users', 'UserController::create');
    $routes->put('users/(:num)', 'UserController::update/$1');
    $routes->delete('users/(:num)', 'UserController::delete/$1');
    
    // Police Centers Management
    $routes->get('centers', 'CenterController::index');
    $routes->get('centers/(:num)', 'CenterController::show/$1');
    $routes->post('centers', 'CenterController::create');
    $routes->put('centers/(:num)', 'CenterController::update/$1');
    $routes->delete('centers/(:num)', 'CenterController::delete/$1');
});
