<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;
use App\Models\SavedFullReportModel;
use CodeIgniter\HTTP\ResponseInterface;

class SavedHTMLReportController extends ResourceController
{
    protected $model;
    
    public function __construct()
    {
        $this->model = new SavedFullReportModel();
    }
    
    /**
     * Save full report HTML to file and database
     * POST /investigation/saved-html-report
     */
    public function save()
    {
        log_message('debug', '=== SAVE HTML REPORT CALLED ===');
        
        try {
            $json = $this->request->getJSON(true);
            
            log_message('debug', 'Request JSON received: ' . json_encode([
                'has_case_id' => isset($json['case_id']),
                'has_report_html' => isset($json['report_html']),
                'case_id' => $json['case_id'] ?? 'missing',
                'report_type' => $json['report_type'] ?? 'missing',
                'report_title' => $json['report_title'] ?? 'missing'
            ]));
            
            // Validate required fields
            if (!isset($json['case_id']) || !isset($json['report_html'])) {
                log_message('error', 'Missing required fields for HTML report');
                return $this->fail('Missing required fields: case_id and report_html', 400);
            }
            
            $caseId = $json['case_id'];
            $caseNumber = $json['case_number'] ?? 'CASE-' . $caseId;
            $language = $json['report_language'] ?? 'en';
            $reportType = $json['report_type'] ?? 'full';
            $html = $json['report_html'];
            
            log_message('debug', "Processing report: case_id=$caseId, type=$reportType, language=$language");
            
            // Sanitize case number for filename
            $safeCaseNumber = preg_replace('/[^a-zA-Z0-9-_]/', '_', $caseNumber);
            
            // Create filename based on report type: case-001-full-report-en.html, case-001-basic-report-en.html, etc.
            $filename = strtolower($safeCaseNumber) . "-{$reportType}-report-{$language}.html";
            
            // Create directory if doesn't exist
            $basePath = FCPATH . 'uploads/reports/full-reports/';
            if (!is_dir($basePath)) {
                mkdir($basePath, 0755, true);
            }
            
            // Full file path
            $filePath = $basePath . $filename;
            
            // Delete old file if exists (replacement)
            if (file_exists($filePath)) {
                unlink($filePath);
                log_message('info', "Deleted old report: {$filename}");
            }
            
            // Save HTML to file
            if (file_put_contents($filePath, $html) === false) {
                return $this->fail('Failed to save HTML file', 500);
            }
            
            log_message('info', "Saved report to: {$filePath}");
            
            // Get current user
            $user = $this->request->user ?? null;
            $userId = $user['id'] ?? null;
            
            // Generate verification code
            $timestamp = time();
            $random = strtoupper(substr(md5($timestamp . $caseNumber . uniqid()), 0, 6));
            $verificationCode = 'REPORT-' . str_pad($timestamp, 10, '0', STR_PAD_LEFT) . '-' . $random;
            
            // Generate public URLs
            $relativeUrl = '/uploads/reports/full-reports/' . $filename;
            $fullUrl = rtrim(base_url(), '/') . $relativeUrl;
            
            // Prepare data for database
            // IMPORTANT: report_title must include the report type for filtering in daily operations
            $reportTitle = $json['report_title'] ?? ucfirst($reportType) . ' Report - ' . $caseNumber;
            
            $data = [
                'case_id' => $caseId,
                'case_number' => $caseNumber,
                'report_title' => $reportTitle,  // e.g., "Basic Report - CASE/XGD-01/2026/0001"
                'report_language' => $language,
                'report_html' => '', // Don't save HTML in DB, it's in file
                'pdf_filename' => $filename,
                'pdf_url' => $relativeUrl,
                'verification_code' => $verificationCode,
                'qr_code' => $fullUrl,
                'generated_by' => $userId
            ];
            
            log_message('debug', "Report title for DB: $reportTitle");
            
            // Check if report already exists for this case, language and type
            $existing = $this->model->where([
                'case_id' => $caseId,
                'report_language' => $language,
                'report_title' => $data['report_title']
            ])->first();
            
            log_message('debug', 'Checking for existing report: ' . json_encode([
                'case_id' => $caseId,
                'language' => $language,
                'title' => $data['report_title'],
                'existing_found' => !empty($existing)
            ]));
            
            if ($existing) {
                // Update existing record
                $reportId = $existing['id'];
                $updateResult = $this->model->update($reportId, $data);
                log_message('debug', "Updated existing report ID: $reportId, result: " . ($updateResult ? 'success' : 'failed'));
                
                if (!$updateResult) {
                    log_message('error', 'Model errors: ' . json_encode($this->model->errors()));
                }
            } else {
                // Insert new record
                $reportId = $this->model->insert($data);
                log_message('debug', "Inserted new report ID: $reportId");
                
                if (!$reportId) {
                    log_message('error', 'Insert failed. Model errors: ' . json_encode($this->model->errors()));
                }
            }
            
            // Return success with HTML URL
            log_message('debug', "Report saved successfully! ID: $reportId, File: $filename");
            log_message('debug', '=== SAVE HTML REPORT COMPLETE ===');
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Report saved successfully',
                'data' => [
                    'id' => $reportId,
                    'html_url' => $fullUrl,
                    'qr_code' => $fullUrl,
                    'filename' => $filename,
                    'verification_code' => $verificationCode
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', '=== HTML REPORT SAVE EXCEPTION ===');
            log_message('error', 'Exception: ' . $e->getMessage());
            log_message('error', 'Trace: ' . $e->getTraceAsString());
            return $this->fail('Error saving report: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get saved reports by case ID
     * GET /investigation/saved-html-report/case/:case_id
     */
    public function getByCaseId($caseId = null)
    {
        if (!$caseId) {
            return $this->fail('Case ID is required', 400);
        }
        
        try {
            $reports = $this->model->where('case_id', $caseId)
                                   ->orderBy('created_at', 'DESC')
                                   ->findAll();
            
            // Add full URLs
            foreach ($reports as &$report) {
                if (!empty($report['pdf_url'])) {
                    $report['html_full_url'] = base_url($report['pdf_url']);
                }
            }
            
            return $this->respond([
                'status' => 'success',
                'data' => $reports
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Error fetching case reports: ' . $e->getMessage());
            return $this->fail('Error fetching reports', 500);
        }
    }
}
