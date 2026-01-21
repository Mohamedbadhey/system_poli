<?php

namespace App\Controllers\Investigation;

use App\Controllers\BaseController;
use App\Models\SavedFullReportModel;
use CodeIgniter\HTTP\ResponseInterface;

class SavedReportController extends BaseController
{
    protected $model;
    
    public function __construct()
    {
        $this->model = new SavedFullReportModel();
    }
    
    /**
     * Save full report HTML to database
     * POST /investigation/saved-reports
     */
    public function save()
    {
        try {
            $json = $this->request->getJSON(true);
            
            // Validate required fields
            if (!isset($json['case_id']) || !isset($json['report_html'])) {
                return $this->fail('Missing required fields: case_id and report_html', 400);
            }
            
            // Get current user
            $user = $this->request->user ?? null;
            $userId = $user['id'] ?? null;
            
            // Prepare data
            $data = [
                'case_id' => $json['case_id'],
                'case_number' => $json['case_number'] ?? null,
                'report_title' => $json['report_title'] ?? 'Full Case Report',
                'report_language' => $json['report_language'] ?? 'en',
                'report_html' => $json['report_html'],
                'generated_by' => $userId
            ];
            
            // Generate verification code
            $timestamp = time();
            $random = strtoupper(substr(md5($timestamp . $data['case_number'] . uniqid()), 0, 6));
            $data['verification_code'] = 'REPORT-' . str_pad($timestamp, 10, '0', STR_PAD_LEFT) . '-' . $random;
            
            // Generate QR code URL
            $baseUrl = rtrim(base_url(), '/');
            $qrUrl = $baseUrl . '/assets/pages/full-report.html?view=' . $timestamp; // Will use timestamp as temp ID
            $data['qr_code'] = $qrUrl;
            
            // Save to database
            $reportId = $this->model->insert($data);
            
            if (!$reportId) {
                return $this->fail('Failed to save report', 500);
            }
            
            // Update QR code URL with actual ID
            $actualQrUrl = $baseUrl . '/assets/pages/full-report.html?view=' . $reportId;
            $this->model->update($reportId, ['qr_code' => $actualQrUrl]);
            
            // Get the saved report
            $savedReport = $this->model->find($reportId);
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Report saved successfully',
                'data' => [
                    'id' => $reportId,
                    'verification_code' => $savedReport['verification_code'],
                    'qr_code' => $actualQrUrl,
                    'view_url' => $actualQrUrl
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Error saving report: ' . $e->getMessage());
            return $this->fail('Error saving report: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get saved report by ID
     * GET /saved-reports/:id
     */
    public function view($id = null)
    {
        if (!$id) {
            return $this->fail('Report ID is required', 400);
        }
        
        try {
            $report = $this->model->getById($id);
            
            if (!$report) {
                return $this->fail('Report not found', 404);
            }
            
            return $this->respond([
                'status' => 'success',
                'data' => $report
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Error fetching report: ' . $e->getMessage());
            return $this->fail('Error fetching report', 500);
        }
    }
    
    /**
     * Get saved reports by case ID
     * GET /investigation/saved-reports/case/:case_id
     */
    public function getByCaseId($caseId = null)
    {
        if (!$caseId) {
            return $this->fail('Case ID is required', 400);
        }
        
        try {
            $reports = $this->model->getByCaseId($caseId);
            
            return $this->respond([
                'status' => 'success',
                'data' => $reports
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Error fetching case reports: ' . $e->getMessage());
            return $this->fail('Error fetching reports', 500);
        }
    }
    
    /**
     * Verify and view report (public access)
     * GET /verify-full-report?code=XXX
     */
    public function verify()
    {
        $code = $this->request->getGet('code');
        
        if (!$code) {
            return $this->fail('Verification code is required', 400);
        }
        
        try {
            $report = $this->model->getByVerificationCode($code);
            
            if (!$report) {
                return $this->respond([
                    'status' => 'error',
                    'message' => 'Report not found or invalid verification code',
                    'valid' => false
                ], 404);
            }
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Report verified successfully',
                'valid' => true,
                'data' => $report
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Error verifying report: ' . $e->getMessage());
            return $this->fail('Error verifying report', 500);
        }
    }
}
