<?php

namespace App\Models;

class CaseModel extends BaseModel
{
    protected $table = 'cases';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'case_number', 'ob_number', 'center_id', 'incident_date',
        'report_date', 'incident_location', 'incident_gps_latitude',
        'incident_gps_longitude', 'incident_description', 'crime_type',
        'crime_category', 'priority', 'is_sensitive', 'status',
        'status_changed_at', 'submitted_at', 'approved_at', 'assigned_at',
        'closed_at', 'investigation_deadline', 'investigation_started_at',
        'investigation_completed_at', 'outcome', 'outcome_description',
        'court_submitted_at', 'court_decision_received_at',
        'court_decision_file', 'created_by', 'approved_by',
        // Closure fields
        'closed_date', 'closed_by', 'closure_reason', 'closure_type',
        // Court workflow fields
        'court_status', 'sent_to_court_date', 'sent_to_court_by', 'court_notes',
        'court_assigned_date', 'court_assigned_by', 'court_deadline',
        // Court acknowledgment fields
        'court_acknowledgment_number', 'court_acknowledgment_date',
        'court_acknowledgment_deadline', 'court_acknowledgment_document',
        'court_acknowledgment_notes', 'verification_code',
        // Reopen fields
        'reopened_at', 'reopened_by', 'reopened_count', 'reopen_reason',
        'previous_closure_date', 'previous_closure_type', 'previous_closure_reason'
    ];
    
    protected $validationRules = [
        'case_number' => 'permit_empty|max_length[50]|is_unique[cases.case_number,id,{id}]',
        'ob_number' => 'permit_empty|max_length[50]|is_unique[cases.ob_number,id,{id}]',
        'center_id' => 'required|integer',
        'incident_date' => 'required|valid_date',
        'incident_location' => 'required',
        'incident_description' => 'required|min_length[10]',
        'crime_type' => 'required|max_length[100]',
        'crime_category' => 'required|max_length[100]',
        'priority' => 'permit_empty|in_list[low,medium,high,critical]',
        'is_sensitive' => 'permit_empty|in_list[0,1]'
    ];
    
    protected $beforeInsert = ['generateCaseNumbers', 'ensureStatusDefault'];
    
    /**
     * Ensure status has a default value (never empty string)
     */
    protected function ensureStatusDefault(array $data)
    {
        log_message('debug', 'ensureStatusDefault called - status before: ' . json_encode($data['data']['status'] ?? 'NOT SET'));
        
        // If status is not set, empty, or null, default to 'draft'
        if (!isset($data['data']['status']) || $data['data']['status'] === '' || $data['data']['status'] === null) {
            log_message('debug', 'ensureStatusDefault - Setting status to draft');
            $data['data']['status'] = 'draft';
        }
        
        log_message('debug', 'ensureStatusDefault called - status after: ' . json_encode($data['data']['status']));
        
        return $data;
    }
    
    /**
     * Generate unique case and OB numbers
     */
    protected function generateCaseNumbers(array $data)
    {
        if (empty($data['data']['case_number'])) {
            $data['data']['case_number'] = $this->generateCaseNumber($data['data']['center_id']);
        }
        
        if (empty($data['data']['ob_number'])) {
            $data['data']['ob_number'] = $this->generateOBNumber($data['data']['center_id']);
        }
        
        return $data;
    }
    
    /**
     * Generate case number: CASE/{CENTER_CODE}/{YEAR}/{SEQUENCE}
     */
    private function generateCaseNumber(int $centerId): string
    {
        $centerModel = model('App\Models\PoliceCenterModel');
        $center = $centerModel->find($centerId);
        $centerCode = $center['center_code'] ?? 'UNKNOWN';
        $year = date('Y');
        
        // Get last sequence number for this center and year
        $lastCase = $this->where('center_id', $centerId)
            ->where('YEAR(created_at)', $year)
            ->orderBy('id', 'DESC')
            ->first();
        
        $sequence = 1;
        if ($lastCase && preg_match('/\/(\d+)$/', $lastCase['case_number'], $matches)) {
            $sequence = (int)$matches[1] + 1;
        }
        
        return sprintf('CASE/%s/%s/%04d', $centerCode, $year, $sequence);
    }
    
    /**
     * Generate OB number: OB/{CENTER_CODE}/{YEAR}/{SEQUENCE}
     */
    private function generateOBNumber(int $centerId): string
    {
        $centerModel = model('App\Models\PoliceCenterModel');
        $center = $centerModel->find($centerId);
        $centerCode = $center['center_code'] ?? 'UNKNOWN';
        $year = date('Y');
        
        // Get last sequence number for this center and year
        $lastCase = $this->where('center_id', $centerId)
            ->where('YEAR(created_at)', $year)
            ->orderBy('id', 'DESC')
            ->first();
        
        $sequence = 1;
        if ($lastCase && preg_match('/\/(\d+)$/', $lastCase['ob_number'], $matches)) {
            $sequence = (int)$matches[1] + 1;
        }
        
        return sprintf('OB/%s/%s/%04d', $centerCode, $year, $sequence);
    }
    
    /**
     * Update case status with history tracking
     */
    public function updateStatus(int $caseId, string $newStatus, int $userId, ?string $reason = null): bool
    {
        $case = $this->find($caseId);
        if (!$case) {
            return false;
        }
        
        $previousStatus = $case['status'];
        
        // Update case status
        $updateData = [
            'status' => $newStatus,
            'status_changed_at' => date('Y-m-d H:i:s')
        ];
        
        // Update specific timestamp fields
        switch ($newStatus) {
            case 'submitted':
                $updateData['submitted_at'] = date('Y-m-d H:i:s');
                break;
            case 'approved':
                $updateData['approved_at'] = date('Y-m-d H:i:s');
                $updateData['approved_by'] = $userId;
                break;
            case 'assigned':
                $updateData['assigned_at'] = date('Y-m-d H:i:s');
                break;
            case 'investigating':
                $updateData['investigation_started_at'] = date('Y-m-d H:i:s');
                break;
            case 'closed':
                $updateData['closed_at'] = date('Y-m-d H:i:s');
                break;
        }
        
        $this->update($caseId, $updateData);
        
        // Log status change - use direct DB query to avoid model timestamp issues
        $db = \Config\Database::connect();
        $db->table('case_status_history')->insert([
            'case_id' => (int)$caseId,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'changed_by' => (int)$userId,
            'reason' => $reason,
            'changed_at' => date('Y-m-d H:i:s')
        ]);
        
        return true;
    }
    
    /**
     * Get cases by status
     */
    public function getCasesByStatus(int $centerId, string $status, ?int $limit = null)
    {
        $builder = $this->where('center_id', $centerId)
                        ->where('status', $status)
                        ->orderBy('created_at', 'DESC');
        
        if ($limit) {
            $builder->limit($limit);
        }
        
        return $builder->findAll();
    }
    
    /**
     * Get cases assigned to investigator with counts
     * Note: Only returns active cases (excludes closed cases)
     * Note: Using DISTINCT to avoid duplicates when case has multiple assignments
     */
    public function getInvestigatorCases(int $investigatorId)
    {
        $db = \Config\Database::connect();
        
        $cases = $db->table('cases')
            ->distinct()
            ->select('cases.*, 
                     MAX(case_assignments.assigned_at) as assigned_at, 
                     MAX(case_assignments.deadline) as deadline, 
                     MAX(case_assignments.is_lead_investigator) as is_lead_investigator,
                     (SELECT COUNT(*) FROM case_parties WHERE case_parties.case_id = cases.id) as person_count,
                     (SELECT COUNT(*) FROM evidence WHERE evidence.case_id = cases.id) as evidence_count,
                     (SELECT COUNT(*) FROM medical_examination_forms WHERE medical_examination_forms.case_id = cases.id) as medical_forms_count')
            ->join('case_assignments', 'case_assignments.case_id = cases.id')
            ->where('case_assignments.investigator_id', $investigatorId)
            ->where('cases.status !=', 'closed')
            ->groupBy('cases.id')
            ->orderBy('cases.created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        return $cases;
    }
    
    /**
     * Get cases solved by investigator (closed without sending to court)
     */
    public function getCasesSolvedByInvestigator(int $investigatorId, string $role)
    {
        $db = \Config\Database::connect();
        
        $builder = $db->table('cases')
            ->select('cases.*, police_centers.center_name, police_centers.center_code, 
                     users.full_name as closed_by_name, users.badge_number,
                     case_assignments.assigned_at')
            ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
            ->join('users', 'users.id = cases.closed_by', 'left')
            ->join('case_assignments', 'case_assignments.case_id = cases.id', 'left')
            ->where('cases.status', 'closed')
            ->where('cases.court_status', 'not_sent')
            ->orderBy('cases.closed_date', 'DESC');
        
        // If investigator role, only show their solved cases
        if (!in_array($role, ['admin', 'super_admin'])) {
            $builder->where('case_assignments.investigator_id', $investigatorId);
        }
        
        return $builder->get()->getResultArray();
    }
    
    /**
     * Get cases solved by court (sent to court and closed by court)
     */
    public function getCasesSolvedByCourt(int $userId, string $role)
    {
        $db = \Config\Database::connect();
        
        $builder = $db->table('cases')
            ->select('cases.*, police_centers.center_name, police_centers.center_code,
                     sender.full_name as sent_by_name, sender.badge_number as sent_by_badge,
                     case_assignments.investigator_id')
            ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
            ->join('users as sender', 'sender.id = cases.sent_to_court_by', 'left')
            ->join('case_assignments', 'case_assignments.case_id = cases.id', 'left')
            ->where('cases.court_status', 'court_closed')
            ->orderBy('cases.closed_date', 'DESC');
        
        // If investigator role, only show cases they were involved with
        if (!in_array($role, ['admin', 'super_admin', 'court_user'])) {
            $builder->where('case_assignments.investigator_id', $userId);
        }
        
        return $builder->get()->getResultArray();
    }
    
    /**
     * Get full case details with parties
     */
    public function getFullCaseDetails(int $caseId)
    {
        $case = $this->find($caseId);
        if (!$case) {
            return null;
        }
        
        $db = \Config\Database::connect();
        
        // Get center details
        $case['center'] = $db->table('police_centers')
            ->where('id', $case['center_id'])
            ->get()
            ->getRowArray();
        
        // Get case parties
        $case['parties'] = $db->table('case_parties')
            ->select('case_parties.*, persons.*')
            ->join('persons', 'persons.id = case_parties.person_id')
            ->where('case_parties.case_id', $caseId)
            ->get()
            ->getResultArray();
        
        // Get assigned investigators
        $case['investigators'] = $db->table('case_assignments')
            ->select('case_assignments.*, users.full_name, users.badge_number, users.email')
            ->join('users', 'users.id = case_assignments.investigator_id')
            ->where('case_assignments.case_id', $caseId)
            ->where('case_assignments.status', 'active')
            ->get()
            ->getResultArray();
        
        // Get evidence count
        $case['evidence_count'] = $db->table('evidence')
            ->where('case_id', $caseId)
            ->countAllResults();
        
        return $case;
    }
    
    /**
     * Reopen a closed case
     * 
     * @param int $caseId Case ID to reopen
     * @param int $userId User ID who is reopening the case
     * @param string $reopenReason Reason for reopening
     * @param int|null $assignToInvestigator Optional investigator ID to assign
     * @param string|null $assignmentNotes Optional assignment notes
     * @return bool Success status
     */
    public function reopenCase(int $caseId, int $userId, string $reopenReason, ?int $assignToInvestigator = null, ?string $assignmentNotes = null): bool
    {
        $case = $this->find($caseId);
        
        if (!$case) {
            return false;
        }
        
        // Verify case is closed
        if ($case['status'] !== 'closed') {
            log_message('error', "Cannot reopen case {$caseId}: Case is not closed (status: {$case['status']})");
            return false;
        }
        
        $db = \Config\Database::connect();
        
        try {
            $db->transStart();
            
            // Update case record
            $updateData = [
                'status' => 'reopened',
                'reopened_at' => date('Y-m-d H:i:s'),
                'reopened_by' => $userId,
                'reopened_count' => ($case['reopened_count'] ?? 0) + 1,
                'reopen_reason' => $reopenReason,
                'previous_closure_date' => $case['closed_date'],
                'previous_closure_type' => $case['closure_type'],
                'previous_closure_reason' => $case['closure_reason'],
                'status_changed_at' => date('Y-m-d H:i:s')
            ];
            
            $this->update($caseId, $updateData);
            
            // Log reopen history
            $historyData = [
                'case_id' => $caseId,
                'reopened_at' => date('Y-m-d H:i:s'),
                'reopened_by' => $userId,
                'reopen_reason' => $reopenReason,
                'previous_status' => 'closed',
                'previous_closure_date' => $case['closed_date'],
                'previous_closure_type' => $case['closure_type'],
                'previous_closure_reason' => $case['closure_reason'],
                'previous_closed_by' => $case['closed_by']
            ];
            
            // Add assignment info if provided
            if ($assignToInvestigator) {
                $historyData['assigned_to_investigator'] = $assignToInvestigator;
                $historyData['assigned_by'] = $userId;
                $historyData['assignment_notes'] = $assignmentNotes;
            }
            
            $db->table('case_reopen_history')->insert($historyData);
            
            // Log status change
            $db->table('case_status_history')->insert([
                'case_id' => $caseId,
                'previous_status' => 'closed',
                'new_status' => 'reopened',
                'changed_by' => $userId,
                'changed_at' => date('Y-m-d H:i:s'),
                'reason' => 'Case reopened: ' . $reopenReason
            ]);
            
            // If assigning to investigator, create assignment
            if ($assignToInvestigator) {
                // Check if there's an existing completed assignment for this investigator
                $existingAssignment = $db->table('case_assignments')
                    ->where('case_id', $caseId)
                    ->where('investigator_id', $assignToInvestigator)
                    ->orderBy('id', 'DESC')
                    ->get()
                    ->getRowArray();
                
                if ($existingAssignment && $existingAssignment['status'] === 'completed') {
                    // Reactivate the existing assignment
                    $db->table('case_assignments')
                        ->where('id', $existingAssignment['id'])
                        ->update([
                            'status' => 'active',
                            'assigned_at' => date('Y-m-d H:i:s'),
                            'assigned_by' => $userId,
                            'completed_at' => null
                        ]);
                } else {
                    // Create new assignment
                    $db->table('case_assignments')->insert([
                        'case_id' => $caseId,
                        'investigator_id' => $assignToInvestigator,
                        'assigned_by' => $userId,
                        'assigned_at' => date('Y-m-d H:i:s'),
                        'is_lead_investigator' => 1,
                        'status' => 'active'
                    ]);
                }
                
                // Update case status to assigned
                $this->update($caseId, ['status' => 'assigned']);
            }
            
            $db->transComplete();
            
            if ($db->transStatus() === false) {
                log_message('error', "Transaction failed while reopening case {$caseId}");
                return false;
            }
            
            return true;
            
        } catch (\Exception $e) {
            log_message('error', 'Error reopening case: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get reopen history for a case
     * 
     * @param int $caseId Case ID
     * @return array Array of reopen history records
     */
    public function getReopenHistory(int $caseId): array
    {
        $db = \Config\Database::connect();
        
        return $db->table('case_reopen_history')
            ->select('case_reopen_history.*, 
                     reopener.full_name as reopened_by_name,
                     reopener.badge_number as reopened_by_badge,
                     closer.full_name as previous_closed_by_name,
                     closer.badge_number as previous_closed_by_badge,
                     investigator.full_name as assigned_investigator_name,
                     investigator.badge_number as assigned_investigator_badge,
                     assigner.full_name as assigned_by_name')
            ->join('users as reopener', 'reopener.id = case_reopen_history.reopened_by', 'left')
            ->join('users as closer', 'closer.id = case_reopen_history.previous_closed_by', 'left')
            ->join('users as investigator', 'investigator.id = case_reopen_history.assigned_to_investigator', 'left')
            ->join('users as assigner', 'assigner.id = case_reopen_history.assigned_by', 'left')
            ->where('case_id', $caseId)
            ->orderBy('reopened_at', 'DESC')
            ->get()
            ->getResultArray();
    }
    
    /**
     * Check if a case can be reopened
     * 
     * @param int $caseId Case ID
     * @return array ['can_reopen' => bool, 'reason' => string]
     */
    public function canReopen(int $caseId): array
    {
        $case = $this->find($caseId);
        
        if (!$case) {
            return ['can_reopen' => false, 'reason' => 'Case not found'];
        }
        
        // Check if case is closed
        if ($case['status'] !== 'closed') {
            return ['can_reopen' => false, 'reason' => 'Case is not closed'];
        }
        
        // Check if case was sent to court and court closed it
        // These cases might need special permission or workflow
        if ($case['court_status'] === 'court_closed') {
            return ['can_reopen' => false, 'reason' => 'Case was closed by court and requires court approval to reopen'];
        }
        
        // All checks passed
        return ['can_reopen' => true, 'reason' => ''];
    }
}
