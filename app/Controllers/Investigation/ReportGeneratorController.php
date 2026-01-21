<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ReportModel;
use App\Models\CaseModel;

class ReportGeneratorController extends ResourceController
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
     * Get all reports for a case
     */
    public function index($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $reports = $this->reportModel->getCaseReports($caseId);

        return $this->respond([
            'status' => 'success',
            'data' => $reports
        ]);
    }

    /**
     * Get single report details
     */
    public function show($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        $report = $this->reportModel->getReportWithDetails($reportId);

        if (!$report) {
            return $this->failNotFound('Report not found');
        }

        return $this->respond([
            'status' => 'success',
            'data' => $report
        ]);
    }

    /**
     * Generate Preliminary Investigation Report (PIR)
     */
    public function generatePreliminary($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        // Auto-populate report data
        $db = \Config\Database::connect();
        
        // Get case parties
        $parties = $db->table('case_parties')
            ->select('case_parties.*, persons.first_name, persons.middle_name, persons.last_name')
            ->join('persons', 'persons.id = case_parties.person_id')
            ->where('case_parties.case_id', $caseId)
            ->get()
            ->getResultArray();

        // Get initial evidence
        $evidence = $db->table('evidence')
            ->where('case_id', $caseId)
            ->orderBy('created_at', 'ASC')
            ->limit(10)
            ->get()
            ->getResultArray();

        // Get investigator
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $investigator = $db->table('users')->where('id', $userId)->get()->getRowArray();

        // Build preliminary report content
        $content = $this->buildPreliminaryReportContent($case, $parties, $evidence, $investigator);

        // Prepare metadata
        $metadata = [
            'parties_count' => count($parties),
            'evidence_count' => count($evidence),
            'assessment_date' => date('Y-m-d H:i:s'),
            'priority_assessment' => $case['priority'],
            'resource_requirements' => []
        ];

        return $this->respond([
            'status' => 'success',
            'data' => [
                'case' => $case,
                'parties' => $parties,
                'evidence' => $evidence,
                'investigator' => $investigator,
                'content' => $content,
                'metadata' => $metadata
            ]
        ]);
    }

    /**
     * Generate Final Investigation Report (FIR)
     */
    public function generateFinal($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        $db = \Config\Database::connect();

        // Get comprehensive case data
        $data = $this->getComprehensiveCaseData($caseId);

        // Build final report content
        $content = $this->buildFinalReportContent($case, $data);

        // Calculate case strength
        $caseStrength = $this->calculateCaseStrength($data);

        // Prepare metadata
        $metadata = [
            'investigation_duration_days' => $this->calculateInvestigationDuration($case),
            'total_evidence' => count($data['evidence']),
            'total_witnesses' => count($data['witnesses']),
            'critical_evidence_count' => $this->countCriticalEvidence($data['evidence']),
            'case_strength' => $caseStrength,
            'recommended_charges' => []
        ];

        return $this->respond([
            'status' => 'success',
            'data' => [
                'case' => $case,
                'parties' => $data['parties'],
                'evidence' => $data['evidence'],
                'witnesses' => $data['witnesses'],
                'accused' => $data['accused'],
                'notes' => $data['notes'],
                'conclusions' => $data['conclusions'],
                'content' => $content,
                'metadata' => $metadata,
                'case_strength' => $caseStrength
            ]
        ]);
    }

    /**
     * Generate Court Submission Docket
     */
    public function generateCourtSubmission($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        // Check if final report exists
        $finalReport = $this->reportModel->getLatestReportByType($caseId, 'final');
        if (!$finalReport || !$finalReport['is_signed']) {
            return $this->fail('Signed final investigation report is required before court submission', 400);
        }

        $db = \Config\Database::connect();
        $data = $this->getComprehensiveCaseData($caseId);

        // Get investigator and commander details
        $investigator = $db->table('users')->where('id', $case['created_by'])->get()->getRowArray();
        $commander = $db->table('users')
            ->where('center_id', $case['center_id'])
            ->where('role', 'admin')
            ->get()
            ->getRowArray();

        // Build court submission content
        $content = $this->buildCourtSubmissionContent($case, $data, $investigator, $commander);

        // Prepare charges (this should be filled by investigator)
        $charges = [];

        return $this->respond([
            'status' => 'success',
            'data' => [
                'case' => $case,
                'accused' => $data['accused'],
                'victims' => $data['victims'],
                'witnesses' => $data['witnesses'],
                'evidence' => $data['evidence'],
                'investigator' => $investigator,
                'commander' => $commander,
                'content' => $content,
                'final_report' => $finalReport,
                'suggested_charges' => $charges
            ]
        ]);
    }

    /**
     * Generate Evidence Presentation Report (Exhibit List)
     */
    public function generateExhibitList($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        $db = \Config\Database::connect();

        // Get all evidence with custody chain
        $evidence = $db->table('evidence')
            ->select('evidence.*, users.full_name as collected_by_name, users.badge_number,
                     persons.first_name, persons.last_name')
            ->join('users', 'users.id = evidence.collected_by', 'left')
            ->join('persons', 'persons.id = evidence.collected_from_person_id', 'left')
            ->where('evidence.case_id', $caseId)
            ->orderBy('evidence.evidence_number', 'ASC')
            ->get()
            ->getResultArray();

        // Get custody logs for each evidence
        foreach ($evidence as &$item) {
            $item['custody_chain'] = $db->table('evidence_custody_log')
                ->select('evidence_custody_log.*, users.full_name as performed_by_name')
                ->join('users', 'users.id = evidence_custody_log.performed_by')
                ->where('evidence_id', $item['id'])
                ->orderBy('performed_at', 'ASC')
                ->get()
                ->getResultArray();
        }

        // Build exhibit list content
        $content = $this->buildExhibitListContent($case, $evidence);

        // Categorize evidence
        $evidenceStats = [
            'total' => count($evidence),
            'by_type' => $this->groupEvidenceByType($evidence),
            'critical_count' => count(array_filter($evidence, fn($e) => $e['is_critical'] == 1)),
            'digital_count' => count(array_filter($evidence, fn($e) => in_array($e['evidence_type'], ['digital', 'photo', 'video', 'audio'])))
        ];

        return $this->respond([
            'status' => 'success',
            'data' => [
                'case' => $case,
                'evidence' => $evidence,
                'content' => $content,
                'statistics' => $evidenceStats
            ]
        ]);
    }

    /**
     * Generate Supplementary Investigation Report
     */
    public function generateSupplementary($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        // Check if court has assigned back
        if ($case['court_status'] !== 'court_assigned_back') {
            return $this->fail('Supplementary report is only for cases assigned back by court', 400);
        }

        $db = \Config\Database::connect();

        // Get court assignment details
        $courtAssignment = $db->table('case_status_history')
            ->where('case_id', $caseId)
            ->where('new_status', 'investigating')
            ->orderBy('changed_at', 'DESC')
            ->get()
            ->getRowArray();

        // Get new activities since court assignment
        $assignmentDate = $courtAssignment['changed_at'] ?? $case['court_assigned_date'];
        
        $newEvidence = $db->table('evidence')
            ->where('case_id', $caseId)
            ->where('created_at >=', $assignmentDate)
            ->get()
            ->getResultArray();

        $newNotes = $db->table('investigation_notes')
            ->where('case_id', $caseId)
            ->where('created_at >=', $assignmentDate)
            ->get()
            ->getResultArray();

        // Build supplementary report content
        $content = $this->buildSupplementaryReportContent($case, $courtAssignment, $newEvidence, $newNotes);

        return $this->respond([
            'status' => 'success',
            'data' => [
                'case' => $case,
                'court_directive' => $case['court_notes'],
                'court_deadline' => $case['court_deadline'],
                'assignment_date' => $assignmentDate,
                'new_evidence' => $newEvidence,
                'new_notes' => $newNotes,
                'content' => $content
            ]
        ]);
    }

    /**
     * Generate Interim Progress Report
     */
    public function generateInterim($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $request = $this->request->getJSON(true);
        $periodFrom = $request['period_from'] ?? null;
        $periodTo = $request['period_to'] ?? date('Y-m-d');

        $case = $this->caseModel->find($caseId);
        if (!$case) {
            return $this->failNotFound('Case not found');
        }

        $db = \Config\Database::connect();

        // Get activities in period
        $activities = [];
        
        if ($periodFrom) {
            $evidence = $db->table('evidence')
                ->where('case_id', $caseId)
                ->where('created_at >=', $periodFrom)
                ->where('created_at <=', $periodTo . ' 23:59:59')
                ->get()
                ->getResultArray();

            $notes = $db->table('investigation_notes')
                ->where('case_id', $caseId)
                ->where('created_at >=', $periodFrom)
                ->where('created_at <=', $periodTo . ' 23:59:59')
                ->get()
                ->getResultArray();

            $activities = [
                'evidence_collected' => count($evidence),
                'notes_added' => count($notes),
                'evidence_items' => $evidence,
                'notes_items' => $notes
            ];
        }

        // Build interim report content
        $content = $this->buildInterimReportContent($case, $activities, $periodFrom, $periodTo);

        return $this->respond([
            'status' => 'success',
            'data' => [
                'case' => $case,
                'period_from' => $periodFrom,
                'period_to' => $periodTo,
                'activities' => $activities,
                'content' => $content
            ]
        ]);
    }

    /**
     * Save report
     */
    public function save()
    {
        $data = $this->request->getJSON(true);

        $rules = [
            'case_id' => 'required|integer',
            'report_type' => 'required',
            'report_title' => 'required|max_length[255]',
            'report_content' => 'required|min_length[50]'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $data['created_by'] = $userId;
        $data['created_at'] = date('Y-m-d H:i:s');

        $reportId = $this->reportModel->createReport($data);

        if (!$reportId) {
            return $this->fail('Failed to create report', 500);
        }

        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Report created successfully',
            'data' => ['id' => $reportId]
        ]);
    }

    /**
     * Update report
     */
    public function update($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        $report = $this->reportModel->find($reportId);
        if (!$report) {
            return $this->failNotFound('Report not found');
        }

        // Check if user can edit
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        if ($report['created_by'] != $userId && $report['approval_status'] !== 'draft') {
            return $this->failForbidden('Cannot edit report that is not in draft status');
        }

        $data = $this->request->getJSON(true);
        
        if ($this->reportModel->updateReport($reportId, $data)) {
            return $this->respond([
                'status' => 'success',
                'message' => 'Report updated successfully'
            ]);
        }

        return $this->fail('Failed to update report', 500);
    }

    /**
     * Submit report for approval
     */
    public function submitForApproval($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        if ($this->reportModel->submitForApproval($reportId, $userId)) {
            return $this->respond([
                'status' => 'success',
                'message' => 'Report submitted for approval'
            ]);
        }

        return $this->fail('Failed to submit report', 500);
    }

    /**
     * Sign report
     */
    public function sign($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        if ($this->reportModel->signReport($reportId, $userId)) {
            return $this->respond([
                'status' => 'success',
                'message' => 'Report signed successfully'
            ]);
        }

        return $this->fail('Failed to sign report', 500);
    }

    // ==================== HELPER METHODS ====================

    private function getComprehensiveCaseData($caseId)
    {
        $db = \Config\Database::connect();

        // Get all parties grouped by role
        $parties = $db->table('case_parties')
            ->select('case_parties.*, persons.*')
            ->join('persons', 'persons.id = case_parties.person_id')
            ->where('case_parties.case_id', $caseId)
            ->get()
            ->getResultArray();

        $data = [
            'parties' => $parties,
            'victims' => array_filter($parties, fn($p) => $p['party_role'] === 'accuser'),
            'accused' => array_filter($parties, fn($p) => $p['party_role'] === 'accused'),
            'witnesses' => array_filter($parties, fn($p) => $p['party_role'] === 'witness'),
        ];

        // Get evidence
        $data['evidence'] = $db->table('evidence')->where('case_id', $caseId)->get()->getResultArray();

        // Get investigation notes
        $data['notes'] = $db->table('investigation_notes')->where('case_id', $caseId)->get()->getResultArray();

        // Get conclusions
        $data['conclusions'] = $db->table('investigator_conclusions')->where('case_id', $caseId)->get()->getResultArray();

        return $data;
    }

    private function buildPreliminaryReportContent($case, $parties, $evidence, $investigator)
    {
        // This will be replaced with proper template rendering
        $content = "PRELIMINARY INVESTIGATION REPORT\n\n";
        $content .= "Case Number: {$case['case_number']}\n";
        $content .= "OB Number: {$case['ob_number']}\n";
        $content .= "Report Date: " . date('Y-m-d') . "\n\n";
        $content .= "INVESTIGATOR: {$investigator['full_name']} (Badge: {$investigator['badge_number']})\n\n";
        $content .= "CASE OVERVIEW:\n";
        $content .= "Crime Type: {$case['crime_type']}\n";
        $content .= "Incident Date: {$case['incident_date']}\n";
        $content .= "Location: {$case['incident_location']}\n\n";
        $content .= "INITIAL ASSESSMENT:\n";
        $content .= "Priority: {$case['priority']}\n";
        $content .= "Parties Involved: " . count($parties) . "\n";
        $content .= "Initial Evidence Items: " . count($evidence) . "\n\n";
        $content .= "PRELIMINARY FINDINGS:\n[To be completed by investigator]\n\n";
        $content .= "INVESTIGATIVE PLAN:\n[To be completed by investigator]\n\n";

        return $content;
    }

    private function buildFinalReportContent($case, $data)
    {
        $content = "FINAL INVESTIGATION REPORT\n\n";
        $content .= "Case Number: {$case['case_number']}\n";
        $content .= "OB Number: {$case['ob_number']}\n\n";
        $content .= "Total Evidence: " . count($data['evidence']) . "\n";
        $content .= "Total Witnesses: " . count($data['witnesses']) . "\n";
        $content .= "Total Accused: " . count($data['accused']) . "\n\n";
        // More content would be added here
        return $content;
    }

    private function buildCourtSubmissionContent($case, $data, $investigator, $commander)
    {
        $content = "COURT SUBMISSION DOCKET\n\n";
        $content .= "Case Number: {$case['case_number']}\n";
        $content .= "Crime: {$case['crime_type']}\n";
        // More content would be added here
        return $content;
    }

    private function buildExhibitListContent($case, $evidence)
    {
        $content = "EVIDENCE PRESENTATION REPORT\n\n";
        $content .= "Case Number: {$case['case_number']}\n";
        $content .= "Total Exhibits: " . count($evidence) . "\n\n";
        // More content would be added here
        return $content;
    }

    private function buildSupplementaryReportContent($case, $courtAssignment, $newEvidence, $newNotes)
    {
        $content = "SUPPLEMENTARY INVESTIGATION REPORT\n\n";
        $content .= "Case Number: {$case['case_number']}\n";
        $content .= "Court Directive: {$case['court_notes']}\n";
        // More content would be added here
        return $content;
    }

    private function buildInterimReportContent($case, $activities, $periodFrom, $periodTo)
    {
        $content = "INTERIM PROGRESS REPORT\n\n";
        $content .= "Case Number: {$case['case_number']}\n";
        $content .= "Period: {$periodFrom} to {$periodTo}\n\n";
        // More content would be added here
        return $content;
    }

    private function calculateCaseStrength($data)
    {
        $score = 0;
        
        // Evidence count
        if (count($data['evidence']) > 10) $score += 3;
        elseif (count($data['evidence']) > 5) $score += 2;
        elseif (count($data['evidence']) > 0) $score += 1;

        // Witnesses
        if (count($data['witnesses']) > 3) $score += 3;
        elseif (count($data['witnesses']) > 1) $score += 2;
        elseif (count($data['witnesses']) > 0) $score += 1;

        // Conclusions
        if (count($data['conclusions']) > 0) $score += 2;

        // Map score to strength
        if ($score >= 7) return 'conclusive';
        if ($score >= 5) return 'strong';
        if ($score >= 3) return 'moderate';
        return 'weak';
    }

    private function calculateInvestigationDuration($case)
    {
        $start = strtotime($case['assigned_at'] ?? $case['created_at']);
        $end = strtotime($case['investigation_completed_at'] ?? date('Y-m-d'));
        return floor(($end - $start) / (60 * 60 * 24));
    }

    private function countCriticalEvidence($evidence)
    {
        return count(array_filter($evidence, fn($e) => $e['is_critical'] == 1));
    }

    private function groupEvidenceByType($evidence)
    {
        $grouped = [];
        foreach ($evidence as $item) {
            $type = $item['evidence_type'];
            if (!isset($grouped[$type])) {
                $grouped[$type] = 0;
            }
            $grouped[$type]++;
        }
        return $grouped;
    }
}
