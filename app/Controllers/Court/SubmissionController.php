<?php

namespace App\Controllers\Court;

use CodeIgniter\RESTful\ResourceController;

class SubmissionController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get a single case details
     */
    public function show($caseId = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        // Get related data
        $db = \Config\Database::connect();
        
        // Get parties (accused, accusers, witnesses)
        $parties = $db->table('case_parties')
            ->select('case_parties.*, persons.*')
            ->join('persons', 'persons.id = case_parties.person_id')
            ->where('case_parties.case_id', $caseId)
            ->get()
            ->getResultArray();
        
        // Get evidence
        $evidence = $db->table('evidence')
            ->where('case_id', $caseId)
            ->get()
            ->getResultArray();
        
        // Get reports
        $reports = $db->table('investigation_reports')
            ->where('case_id', $caseId)
            ->get()
            ->getResultArray();
        
        // Get timeline
        $timeline = $db->table('investigation_timeline')
            ->select('investigation_timeline.*, users.full_name as user_name')
            ->join('users', 'users.id = investigation_timeline.investigator_id', 'left')
            ->where('investigation_timeline.case_id', $caseId)
            ->orderBy('investigation_timeline.created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        // Get lead investigator from case_assignments
        $leadInvestigator = $db->table('case_assignments')
            ->select('users.id as investigator_id, users.full_name as investigator_name')
            ->join('users', 'users.id = case_assignments.investigator_id')
            ->where('case_assignments.case_id', $caseId)
            ->where('case_assignments.is_lead_investigator', 1)
            ->where('case_assignments.status', 'active')
            ->get()
            ->getRowArray();
        
        // If no lead investigator, get any active investigator
        if (!$leadInvestigator) {
            $leadInvestigator = $db->table('case_assignments')
                ->select('users.id as investigator_id, users.full_name as investigator_name')
                ->join('users', 'users.id = case_assignments.investigator_id')
                ->where('case_assignments.case_id', $caseId)
                ->where('case_assignments.status', 'active')
                ->orderBy('case_assignments.assigned_at', 'ASC')
                ->get()
                ->getRowArray();
        }
        
        $case['investigating_officer_id'] = $leadInvestigator ? $leadInvestigator['investigator_id'] : null;
        $case['investigating_officer_name'] = $leadInvestigator ? $leadInvestigator['investigator_name'] : null;
        
        // Get sent by name (from created_by or approved_by)
        $case['sent_by_name'] = null;
        if (!empty($case['approved_by'])) {
            $sentBy = $db->table('users')
                ->select('full_name')
                ->where('id', $case['approved_by'])
                ->get()
                ->getRowArray();
            $case['sent_by_name'] = $sentBy ? $sentBy['full_name'] : null;
        } elseif (!empty($case['created_by'])) {
            $sentBy = $db->table('users')
                ->select('full_name')
                ->where('id', $case['created_by'])
                ->get()
                ->getRowArray();
            $case['sent_by_name'] = $sentBy ? $sentBy['full_name'] : null;
        }
        
        // Get sent to court date (from court_submitted_at)
        $case['sent_to_court_at'] = $case['court_submitted_at'] ?? null;
        
        return $this->respond([
            'status' => 'success',
            'data' => array_merge($case, [
                'parties' => $parties,
                'evidence' => $evidence,
                'reports' => $reports,
                'timeline' => $timeline
            ])
        ]);
    }
    
    /**
     * Submit case to court
     */
    public function submitToCourt($caseId = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        if ($case['status'] != 'escalated') {
            return $this->fail('Case must be in escalated status', 400);
        }
        
        // Verify final report exists
        $db = \Config\Database::connect();
        $finalReport = $db->table('investigation_reports')
            ->where('case_id', $caseId)
            ->where('report_type', 'final')
            ->where('is_signed', 1)
            ->get()
            ->getRowArray();
        
        if (!$finalReport) {
            return $this->fail('Signed final report is required', 400);
        }
        
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        // Update case status
        $caseModel->update($caseId, [
            'status' => 'under_review',
            'court_submitted_at' => date('Y-m-d H:i:s'),
            'approved_by' => $userId
        ]);
        
        // Notify court users
        $courtUsers = model('App\Models\UserModel')
            ->where('role', 'court_user')
            ->where('is_active', 1)
            ->findAll();
        
        $notificationModel = model('App\Models\NotificationModel');
        foreach ($courtUsers as $user) {
            $notificationModel->insert([
                'user_id' => $user['id'],
                'notification_type' => 'case_assigned',
                'title' => 'New Court Submission',
                'message' => "Case {$case['case_number']} has been submitted to court",
                'link_entity_type' => 'cases',
                'link_entity_id' => $caseId,
                'priority' => 'high'
            ]);
        }
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Case submitted to court successfully'
        ]);
    }
    
    /**
     * Upload court decision
     */
    public function uploadCourtDecision($caseId = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        if ($case['status'] == 'closed') {
            return $this->fail('Case is already closed', 400);
        }
        
        if (!$case['court_submitted_at']) {
            return $this->fail('Case has not been submitted to court', 400);
        }
        
        $rules = [
            'court_decision' => 'uploaded[court_decision]|ext_in[court_decision,pdf]|max_size[court_decision,10240]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $file = $this->request->getFile('court_decision');
        
        if (!$file->isValid()) {
            return $this->fail('Invalid file upload', 400);
        }
        
        // Save court decision file
        $uploadPath = WRITEPATH . "uploads/reports/{$caseId}/";
        
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        
        $fileName = 'court_decision_' . time() . '.pdf';
        $file->move($uploadPath, $fileName);
        
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        // Update case
        $caseModel->update($caseId, [
            'status' => 'closed',
            'court_decision_file' => "reports/{$caseId}/{$fileName}",
            'court_decision_received_at' => date('Y-m-d H:i:s'),
            'closed_at' => date('Y-m-d H:i:s'),
            'outcome' => 'court_decision_received',
            'outcome_description' => 'Court decision received'
        ]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Court decision uploaded and case closed'
        ]);
    }
    
    /**
     * Download investigation report
     */
    public function downloadReport($caseId = null)
    {
        $db = \Config\Database::connect();
        $report = $db->table('investigation_reports')
            ->where('case_id', $caseId)
            ->where('report_type', 'final')
            ->get()
            ->getRowArray();
        
        if (!$report) {
            return $this->failNotFound('Report not found');
        }
        
        $filePath = WRITEPATH . 'uploads/' . $report['report_file_path'];
        
        if (!file_exists($filePath)) {
            return $this->failNotFound('Report file not found');
        }
        
        return $this->response->download($filePath, null);
    }
}
