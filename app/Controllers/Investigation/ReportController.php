<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;

class ReportController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Create investigation report
     */
    public function createReport($caseId = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        $rules = [
            'report_type' => 'required|in_list[preliminary,interim,final,court_submission]',
            'report_title' => 'required|max_length[255]',
            'report_content' => 'required|min_length[50]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $reportData = [
            'case_id' => $caseId,
            'report_type' => $this->request->getPost('report_type'),
            'report_title' => $this->request->getPost('report_title'),
            'report_content' => $this->request->getPost('report_content'),
            'created_by' => $this->request->userId
        ];
        
        $db = \Config\Database::connect();
        $reportId = $db->table('investigation_reports')->insert($reportData);
        
        if (!$reportId) {
            return $this->fail('Failed to create report', 500);
        }
        
        // Generate PDF
        $this->generateReportPDF($reportId, $case, $reportData);
        
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Report created successfully',
            'data' => ['id' => $reportId]
        ]);
    }
    
    /**
     * Sign report digitally
     */
    public function signReport($id = null)
    {
        $db = \Config\Database::connect();
        $report = $db->table('investigation_reports')->where('id', $id)->get()->getRowArray();
        
        if (!$report) {
            return $this->failNotFound('Report not found');
        }
        
        if ($report['created_by'] != $this->request->userId) {
            return $this->failForbidden('You can only sign your own reports');
        }
        
        if ($report['is_signed']) {
            return $this->fail('Report is already signed', 400);
        }
        
        // Generate digital signature
        $signatureData = $report['report_content'] . $report['case_id'] . $this->request->userId . time();
        $signatureHash = hash('sha256', $signatureData);
        
        // Update report
        $db->table('investigation_reports')->where('id', $id)->update([
            'is_signed' => 1,
            'signature_hash' => $signatureHash,
            'signed_by' => $this->request->userId,
            'signed_at' => date('Y-m-d H:i:s')
        ]);
        
        // Store in digital signatures registry
        $db->table('digital_signatures')->insert([
            'entity_type' => 'investigation_reports',
            'entity_id' => $id,
            'signature_hash' => $signatureHash,
            'signature_algorithm' => 'SHA256',
            'signature_data' => base64_encode($signatureHash),
            'signed_by' => $this->request->userId
        ]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Report signed successfully'
        ]);
    }
    
    /**
     * Get report details
     */
    public function show($id = null)
    {
        $db = \Config\Database::connect();
        $report = $db->table('investigation_reports')
            ->select('investigation_reports.*, users.full_name as created_by_name, 
                      cases.case_number, cases.ob_number')
            ->join('users', 'users.id = investigation_reports.created_by')
            ->join('cases', 'cases.id = investigation_reports.case_id')
            ->where('investigation_reports.id', $id)
            ->get()
            ->getRowArray();
        
        if (!$report) {
            return $this->failNotFound('Report not found');
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $report
        ]);
    }
    
    /**
     * Generate report PDF
     */
    private function generateReportPDF(int $reportId, array $case, array $reportData)
    {
        // This is a placeholder - in production, use libraries like TCPDF or mPDF
        $year = date('Y');
        $pdfPath = WRITEPATH . "uploads/reports/{$case['id']}/";
        
        if (!is_dir($pdfPath)) {
            mkdir($pdfPath, 0755, true);
        }
        
        $fileName = "report_{$reportId}.pdf";
        
        // For now, just store the path
        $db = \Config\Database::connect();
        $db->table('investigation_reports')
            ->where('id', $reportId)
            ->update(['report_file_path' => "reports/{$case['id']}/{$fileName}"]);
        
        // In production, generate actual PDF here
        return true;
    }

    /**
     * Public report viewing - no authentication required
     * This allows anyone with the verification code to view the report
     * Returns JSON data that the frontend will use to display the report
     */
    public function viewPublic($verificationCode)
    {
        // Set CORS headers to allow public access
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET');
        
        try {
            // Extract case number and code from verification string
            // Format: CASE-2024-0001_a1b2c3d4e5f6
            $parts = explode('_', $verificationCode);
            if (count($parts) !== 2) {
                return $this->response->setJSON([
                    'success' => false,
                    'message' => 'Invalid verification code format'
                ])->setStatusCode(400);
            }

            $caseNumber = $parts[0];
            $code = $parts[1];

            // Get case data
            $caseModel = new \App\Models\CaseModel();
            $case = $caseModel->where('case_number', $caseNumber)->first();

            if (!$case) {
                return $this->response->setJSON([
                    'success' => false,
                    'message' => 'Case not found'
                ])->setStatusCode(404);
            }

            // Verify the code
            $expectedCode = substr(md5($caseNumber . $case['created_at']), 0, 12);
            if ($code !== $expectedCode) {
                return $this->response->setJSON([
                    'success' => false,
                    'message' => 'Invalid verification code'
                ])->setStatusCode(403);
            }

            // Get all report data (same as generateReport method)
            $personModel = new \App\Models\PersonModel();
            $evidenceModel = new \App\Models\EvidenceModel();
            $conclusionModel = new \App\Models\InvestigatorConclusionModel();

            // Get parties
            $parties = $personModel->where('case_id', $case['id'])->findAll();

            // Get evidence
            $evidence = $evidenceModel->where('case_id', $case['id'])->findAll();

            // Get investigator conclusion
            $conclusion = $conclusionModel->where('case_id', $case['id'])->first();

            // Get case assignments
            $db = \Config\Database::connect();
            $assignments = $db->table('case_assignments')
                ->select('case_assignments.*, users.full_name as investigator_name')
                ->join('users', 'users.id = case_assignments.user_id')
                ->where('case_assignments.case_id', $case['id'])
                ->get()
                ->getResultArray();

            // Get case status history
            $history = $db->table('case_status_history')
                ->select('case_status_history.*, users.full_name as changed_by_name')
                ->join('users', 'users.id = case_status_history.changed_by')
                ->where('case_status_history.case_id', $case['id'])
                ->orderBy('changed_at', 'DESC')
                ->get()
                ->getResultArray();

            // Get court assignment if exists
            $courtAssignment = $db->table('court_assignments')
                ->where('case_id', $case['id'])
                ->get()
                ->getRowArray();

            // Get created by user info
            $createdBy = $db->table('users')
                ->where('id', $case['created_by'])
                ->get()
                ->getRowArray();

            return $this->response->setJSON([
                'success' => true,
                'data' => [
                    'case' => $case,
                    'parties' => $parties,
                    'evidence' => $evidence,
                    'conclusion' => $conclusion,
                    'assignments' => $assignments,
                    'history' => $history,
                    'court_assignment' => $courtAssignment,
                    'created_by' => $createdBy
                ]
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Public report view error: ' . $e->getMessage());
            return $this->response->setJSON([
                'success' => false,
                'message' => 'An error occurred while loading the report'
            ])->setStatusCode(500);
        }
    }
}
