<?php

namespace App\Controllers\Investigation;

use App\Controllers\BaseController;
use App\Libraries\ReportPDFGenerator;
use App\Models\SavedFullReportModel;
use CodeIgniter\HTTP\ResponseInterface;

class FullReportPDFController extends BaseController
{
    protected $pdfGenerator;
    protected $model;
    
    public function __construct()
    {
        $this->pdfGenerator = new ReportPDFGenerator();
        $this->model = new SavedFullReportModel();
    }
    
    /**
     * Generate PDF from HTML and save
     * POST /investigation/full-report-pdf
     */
    public function generate()
    {
        try {
            $json = $this->request->getJSON(true);
            
            // Validate required fields
            if (!isset($json['case_id']) || !isset($json['report_html'])) {
                return $this->fail('Missing required fields: case_id and report_html', 400);
            }
            
            $caseId = $json['case_id'];
            $caseNumber = $json['case_number'] ?? 'CASE-' . $caseId;
            $language = $json['report_language'] ?? 'en';
            $html = $json['report_html'];
            
            // Generate PDF (this replaces old PDF if exists)
            $result = $this->pdfGenerator->generateFullCaseReport($html, $caseId, $caseNumber, $language);
            
            if (!$result['success']) {
                return $this->fail('Failed to generate PDF: ' . $result['error'], 500);
            }
            
            // Get current user
            $user = $this->request->user ?? null;
            $userId = $user['id'] ?? null;
            
            // Save metadata to database
            $data = [
                'case_id' => $caseId,
                'case_number' => $caseNumber,
                'report_title' => $json['report_title'] ?? 'Full Case Report',
                'report_language' => $language,
                'report_html' => '', // Don't save HTML, just metadata
                'pdf_filename' => $result['filename'],
                'pdf_url' => $result['url'],
                'generated_by' => $userId
            ];
            
            // Generate verification code
            $timestamp = time();
            $random = strtoupper(substr(md5($timestamp . $caseNumber . uniqid()), 0, 6));
            $data['verification_code'] = 'REPORT-' . str_pad($timestamp, 10, '0', STR_PAD_LEFT) . '-' . $random;
            
            // QR code points directly to PDF
            $data['qr_code'] = $result['full_url'];
            
            // Check if report already exists for this case and language
            $existing = $this->model->where([
                'case_id' => $caseId,
                'report_language' => $language
            ])->first();
            
            if ($existing) {
                // Update existing record
                $reportId = $existing['id'];
                $this->model->update($reportId, $data);
            } else {
                // Insert new record
                $reportId = $this->model->insert($data);
            }
            
            // Return success with PDF URL
            return $this->respond([
                'status' => 'success',
                'message' => 'PDF generated successfully',
                'data' => [
                    'id' => $reportId,
                    'pdf_url' => $result['full_url'],
                    'qr_code' => $result['full_url'],
                    'filename' => $result['filename'],
                    'verification_code' => $data['verification_code']
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'PDF Generation Error: ' . $e->getMessage());
            return $this->fail('Error generating PDF: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get PDF reports by case ID
     * GET /investigation/full-report-pdf/case/:case_id
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
                if (!empty($report['pdf_filename'])) {
                    $report['pdf_full_url'] = base_url($report['pdf_url']);
                }
            }
            
            return $this->respond([
                'status' => 'success',
                'data' => $reports
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Error fetching case PDFs: ' . $e->getMessage());
            return $this->fail('Error fetching PDFs', 500);
        }
    }
}
