<?php

namespace App\Controllers\Court;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ReportModel;
use App\Models\CaseModel;

class CourtReportController extends ResourceController
{
    protected $format = 'json';
    protected $reportModel;
    protected $caseModel;

    public function __construct()
    {
        $this->reportModel = new ReportModel();
        $this->caseModel = new CaseModel();
    }

    /**
     * Get all reports submitted to court for a case
     */
    public function getCaseReports($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        // Get court-related reports
        $reports = $this->reportModel->getCaseReports($caseId);
        
        // Filter for court-relevant reports
        $courtReports = array_filter($reports, function($report) {
            return in_array($report['report_type'], [
                'final', 'court_submission', 'exhibit_list', 
                'supplementary', 'prosecution_summary', 'court_status'
            ]);
        });

        return $this->respond([
            'status' => 'success',
            'data' => array_values($courtReports)
        ]);
    }

    /**
     * Generate Case Status Report for Court
     */
    public function generateCourtStatus($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        $db = \Config\Database::connect();

        // Get court communications
        $communications = $db->table('court_communications')
            ->where('case_id', $caseId)
            ->orderBy('communication_date', 'DESC')
            ->get()
            ->getResultArray();

        // Get hearing information (if exists)
        $hearings = []; // This would come from a hearings table if implemented

        // Get witness examination status
        $witnesses = $db->table('case_parties')
            ->select('case_parties.*, persons.first_name, persons.last_name')
            ->join('persons', 'persons.id = case_parties.person_id')
            ->where('case_parties.case_id', $caseId)
            ->where('case_parties.party_role', 'witness')
            ->get()
            ->getResultArray();

        // Get custody status if accused is in custody
        $custodyStatus = $db->table('custody_records')
            ->select('custody_records.*, persons.first_name, persons.last_name')
            ->join('case_parties', 'case_parties.person_id = custody_records.person_id')
            ->join('persons', 'persons.id = custody_records.person_id')
            ->where('case_parties.case_id', $caseId)
            ->where('case_parties.party_role', 'accused')
            ->where('custody_records.status', 'in_custody')
            ->get()
            ->getResultArray();

        $content = $this->buildCourtStatusContent($case, $communications, $hearings, $witnesses, $custodyStatus);

        return $this->respond([
            'status' => 'success',
            'data' => [
                'case' => $case,
                'communications' => $communications,
                'hearings' => $hearings,
                'witnesses' => $witnesses,
                'custody_status' => $custodyStatus,
                'content' => $content
            ]
        ]);
    }

    /**
     * Generate Case Closure Report
     */
    public function generateCaseClosure($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        // Check if case is closed
        if ($case['status'] !== 'closed' && $case['court_status'] !== 'court_closed') {
            return $this->fail('Case must be closed before generating closure report', 400);
        }

        $db = \Config\Database::connect();

        // Get case verdict information
        $verdict = [
            'outcome' => $case['outcome'],
            'outcome_description' => $case['outcome_description'],
            'closed_date' => $case['closed_date'],
            'closed_by' => $case['closed_by']
        ];

        // Get total investigation duration
        $startDate = strtotime($case['created_at']);
        $endDate = strtotime($case['closed_date']);
        $durationDays = floor(($endDate - $startDate) / (60 * 60 * 24));

        // Get all evidence for disposal tracking
        $evidence = $db->table('evidence')->where('case_id', $caseId)->get()->getResultArray();

        // Get cost tracking (if implemented)
        $costs = [
            'investigation_costs' => 0, // Would come from cost tracking
            'court_costs' => 0
        ];

        $content = $this->buildCaseClosureContent($case, $verdict, $durationDays, $evidence, $costs);

        return $this->respond([
            'status' => 'success',
            'data' => [
                'case' => $case,
                'verdict' => $verdict,
                'duration_days' => $durationDays,
                'evidence_count' => count($evidence),
                'content' => $content
            ]
        ]);
    }

    /**
     * Record court communication
     */
    public function recordCommunication()
    {
        $data = $this->request->getJSON(true);

        $rules = [
            'case_id' => 'required|integer',
            'communication_type' => 'required|in_list[submission,response,hearing_notice,directive,verdict,adjournment,order]',
            'communication_date' => 'required|valid_date',
            'subject' => 'required|max_length[255]'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $data['created_by'] = $userId;
        $data['created_at'] = date('Y-m-d H:i:s');

        $db = \Config\Database::connect();
        $result = $db->table('court_communications')->insert($data);

        if ($result) {
            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Court communication recorded successfully'
            ]);
        }

        return $this->fail('Failed to record communication', 500);
    }

    /**
     * Get court communications for a case
     */
    public function getCommunications($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $db = \Config\Database::connect();
        $communications = $db->table('court_communications')
            ->select('court_communications.*, users.full_name as created_by_name')
            ->join('users', 'users.id = court_communications.created_by', 'left')
            ->where('case_id', $caseId)
            ->orderBy('communication_date', 'DESC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'status' => 'success',
            'data' => $communications
        ]);
    }

    // ==================== HELPER METHODS ====================

    private function buildCourtStatusContent($case, $communications, $hearings, $witnesses, $custodyStatus)
    {
        $content = "CASE STATUS REPORT FOR COURT\n\n";
        $content .= "Case Number: {$case['case_number']}\n";
        $content .= "Current Status: {$case['status']}\n";
        $content .= "Court Status: {$case['court_status']}\n\n";
        $content .= "COMMUNICATIONS: " . count($communications) . "\n";
        $content .= "HEARINGS COMPLETED: " . count($hearings) . "\n";
        $content .= "WITNESSES: " . count($witnesses) . "\n";
        
        if (count($custodyStatus) > 0) {
            $content .= "\nCUSTODY STATUS: " . count($custodyStatus) . " accused in custody\n";
        }
        
        $content .= "\n[Additional details to be completed]\n";
        
        return $content;
    }

    private function buildCaseClosureContent($case, $verdict, $durationDays, $evidence, $costs)
    {
        $content = "CASE CLOSURE REPORT\n\n";
        $content .= "Case Number: {$case['case_number']}\n";
        $content .= "Closure Date: {$case['closed_date']}\n\n";
        $content .= "OUTCOME: {$verdict['outcome']}\n";
        $content .= "Description: {$verdict['outcome_description']}\n\n";
        $content .= "INVESTIGATION DURATION: {$durationDays} days\n";
        $content .= "TOTAL EVIDENCE ITEMS: " . count($evidence) . "\n\n";
        $content .= "LESSONS LEARNED:\n[To be completed]\n\n";
        $content .= "EVIDENCE DISPOSAL PLAN:\n[To be completed]\n\n";
        
        return $content;
    }
}
