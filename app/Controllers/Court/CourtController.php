<?php

namespace App\Controllers\Court;

use CodeIgniter\RESTful\ResourceController;

class CourtController extends ResourceController
{
    protected $modelName = 'App\Models\CaseModel';
    protected $format = 'json';
    
    /**
     * Get all cases sent to court
     */
    public function index()
    {
        $caseModel = model('App\Models\CaseModel');
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        $cases = $caseModel->select('cases.*, users.full_name as sent_by_name')
                          ->join('users', 'users.id = cases.sent_to_court_by', 'left')
                          ->whereIn('court_status', ['sent_to_court', 'court_review', 'court_assigned_back'])
                          ->orderBy('sent_to_court_date', 'DESC')
                          ->findAll();
        
        return $this->respond([
            'status' => 'success',
            'data' => $cases
        ]);
    }
    
    /**
     * Close a case (from court)
     */
    public function closeCase($caseId = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        
        $closureReason = $input['closure_reason'] ?? 'Closed by court';
        
        try {
            $db = \Config\Database::connect();
            
            // Update case status
            $caseModel->update($caseId, [
                'status' => 'closed',
                'closed_at' => date('Y-m-d H:i:s'),
                'outcome' => 'escalated_to_court',
                'outcome_description' => $closureReason
            ]);
            
            // Log status change
            $db->table('case_status_history')->insert([
                'case_id' => $caseId,
                'previous_status' => $case['status'],
                'new_status' => 'closed',
                'changed_by' => $userId,
                'changed_at' => date('Y-m-d H:i:s'),
                'reason' => 'Closed by court: ' . $closureReason
            ]);
            
            // Close all active case assignments
            $db->table('case_assignments')
                ->where('case_id', $caseId)
                ->where('status', 'active')
                ->update(['status' => 'completed', 'completed_at' => date('Y-m-d H:i:s')]);
            
            // Close all active court assignments
            $db->table('court_assignments')
                ->where('case_id', $caseId)
                ->where('status', 'active')
                ->update(['status' => 'completed']);
            
            // Notify investigators assigned to this case
            $assignments = $db->table('case_assignments')
                ->select('investigator_id')
                ->where('case_id', $caseId)
                ->groupBy('investigator_id')
                ->get()
                ->getResultArray();
            
            if (!empty($assignments)) {
                $notificationModel = model('App\Models\NotificationModel');
                foreach ($assignments as $assignment) {
                    $notificationModel->createNotification([
                        'user_id' => $assignment['investigator_id'],
                        'case_id' => $caseId,
                        'type' => 'case_closed_by_court',
                        'title' => 'Case Closed by Court',
                        'message' => "Case #{$case['case_number']} has been closed by the court.",
                        'link' => "/investigations/view/{$caseId}"
                    ]);
                }
            }
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Case closed successfully'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Case closure failed: ' . $e->getMessage());
            return $this->fail('Failed to close case', 500);
        }
    }
    
    /**
     * Assign case back to investigator with deadline
     */
    public function assignToInvestigator($caseId = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        $rules = [
            'investigator_id' => 'required|integer',
            'deadline' => 'required|valid_date',
            'notes' => 'permit_empty'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        
        try {
            $db = \Config\Database::connect();
            $db->transStart();
            
            // Update case status and court fields
            $caseModel->update($caseId, [
                'status' => 'investigating',
                'court_status' => 'court_assigned_back',
                'court_assigned_date' => date('Y-m-d H:i:s'),
                'court_assigned_by' => $userId,
                'court_deadline' => $input['deadline'],
                'court_notes' => $input['notes'] ?? null
            ]);
            
            // Check if investigator already has an active assignment
            $existingAssignment = $db->table('case_assignments')
                ->where('case_id', $caseId)
                ->where('investigator_id', $input['investigator_id'])
                ->where('status', 'active')
                ->get()
                ->getRowArray();
            
            if ($existingAssignment) {
                // Update existing assignment
                $db->table('case_assignments')
                    ->where('id', $existingAssignment['id'])
                    ->update([
                        'deadline' => $input['deadline'],
                        'notes' => $input['notes'] ?? null
                    ]);
                $assignmentId = $existingAssignment['id'];
            } else {
                // Create new assignment
                $db->table('case_assignments')->insert([
                    'case_id' => $caseId,
                    'investigator_id' => $input['investigator_id'],
                    'assigned_by' => $userId,
                    'assigned_at' => date('Y-m-d H:i:s'),
                    'deadline' => $input['deadline'],
                    'is_lead_investigator' => 1,
                    'status' => 'active',
                    'notes' => $input['notes'] ?? null
                ]);
                $assignmentId = $db->insertID();
            }
            
            // Check if there's already an active court assignment for this case
            $existingCourtAssignment = $db->table('court_assignments')
                ->where('case_id', $caseId)
                ->where('status', 'active')
                ->get()
                ->getRowArray();
            
            if ($existingCourtAssignment) {
                // Update existing court assignment
                $db->table('court_assignments')
                    ->where('id', $existingCourtAssignment['id'])
                    ->update([
                        'assigned_to' => $input['investigator_id'],
                        'assigned_by' => $userId,
                        'assigned_date' => date('Y-m-d H:i:s'),
                        'deadline' => $input['deadline'],
                        'notes' => $input['notes'] ?? null
                    ]);
            } else {
                // Create new court assignment record
                $courtAssignmentData = [
                    'case_id' => $caseId,
                    'assigned_to' => $input['investigator_id'],
                    'assigned_by' => $userId,
                    'assigned_date' => date('Y-m-d H:i:s'),
                    'deadline' => $input['deadline'],
                    'notes' => $input['notes'] ?? null,
                    'status' => 'active'
                ];
                $db->table('court_assignments')->insert($courtAssignmentData);
            }
            
            // Log status change
            $db->table('case_status_history')->insert([
                'case_id' => $caseId,
                'previous_status' => $case['status'],
                'new_status' => 'investigating',
                'changed_by' => $userId,
                'changed_at' => date('Y-m-d H:i:s'),
                'reason' => 'Assigned back to investigator by court with deadline: ' . $input['deadline'] . ($input['notes'] ? '. Notes: ' . $input['notes'] : '')
            ]);
            
            $db->transComplete();
            
            if ($db->transStatus() === false) {
                log_message('error', 'Transaction failed in court assignment');
                return $this->fail('Failed to assign case - transaction error', 500);
            }
            
            // Notify investigator (outside transaction)
            try {
                $notificationModel = model('App\Models\NotificationModel');
                $notificationModel->insert([
                    'user_id' => $input['investigator_id'],
                    'notification_type' => 'case_assigned',
                    'title' => 'Case Assigned by Court',
                    'message' => "You have been assigned case #{$case['case_number']} by the court. Deadline: {$input['deadline']}",
                    'link_entity_type' => 'cases',
                    'link_entity_id' => $caseId,
                    'priority' => 'high'
                ]);
            } catch (\Exception $notifError) {
                log_message('error', 'Notification failed but assignment succeeded: ' . $notifError->getMessage());
            }
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Case assigned to investigator successfully',
                'data' => ['assignment_id' => $assignmentId]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Court assignment failed: ' . $e->getMessage());
            return $this->fail('Failed to assign case: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get court dashboard statistics
     */
    public function dashboard()
    {
        $db = \Config\Database::connect();
        $caseModel = model('App\Models\CaseModel');
        
        // Count cases submitted to court
        $totalCases = $caseModel->where('court_submitted_at IS NOT NULL')->countAllResults(false);
        
        // Count cases currently pending (not closed)
        $pendingReview = $caseModel->where('court_submitted_at IS NOT NULL')
                                   ->where('status !=', 'closed')
                                   ->countAllResults(false);
        
        // Count cases assigned back to investigators (active court assignments)
        $assignedBack = $db->table('court_assignments')
                           ->where('status', 'active')
                           ->countAllResults();
        
        // Count cases closed by court
        $closedByCourt = $caseModel->where('court_submitted_at IS NOT NULL')
                                   ->where('status', 'closed')
                                   ->where('outcome', 'escalated_to_court')
                                   ->countAllResults(false);
        
        $stats = [
            'total_cases' => $totalCases,
            'pending_review' => $pendingReview,
            'assigned_back' => $assignedBack,
            'closed_by_court' => $closedByCourt
        ];
        
        // Get cases approaching deadline
        $upcomingDeadlines = $db->table('court_assignments')
                                ->select('court_assignments.*, cases.case_number, users.full_name as investigator_name')
                                ->join('cases', 'cases.id = court_assignments.case_id')
                                ->join('users', 'users.id = court_assignments.assigned_to')
                                ->where('court_assignments.status', 'active')
                                ->where('court_assignments.deadline >=', date('Y-m-d'))
                                ->where('court_assignments.deadline <=', date('Y-m-d', strtotime('+7 days')))
                                ->orderBy('court_assignments.deadline', 'ASC')
                                ->get()
                                ->getResultArray();
        
        $stats['upcoming_deadlines'] = $upcomingDeadlines;
        
        // Get overdue assignments
        $overdueAssignments = $db->table('court_assignments')
                                 ->select('court_assignments.*, cases.case_number, users.full_name as investigator_name')
                                 ->join('cases', 'cases.id = court_assignments.case_id')
                                 ->join('users', 'users.id = court_assignments.assigned_to')
                                 ->where('court_assignments.status', 'active')
                                 ->where('court_assignments.deadline <', date('Y-m-d'))
                                 ->orderBy('court_assignments.deadline', 'ASC')
                                 ->get()
                                 ->getResultArray();
        
        $stats['overdue'] = $overdueAssignments;
        
        return $this->respond([
            'status' => 'success',
            'data' => $stats
        ]);
    }
    
    /**
     * Get case status history
     */
    public function getCaseHistory($caseId = null)
    {
        $historyModel = model('App\Models\CaseStatusHistoryModel');
        $history = $historyModel->getCaseHistory($caseId);
        
        return $this->respond([
            'status' => 'success',
            'data' => $history
        ]);
    }
    
    /**
     * Get available investigators
     */
    public function getInvestigators()
    {
        $userModel = model('App\Models\UserModel');
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        // Get user's center
        $currentUser = $userModel->find($userId);
        if (!$currentUser) {
            return $this->failUnauthorized('User not found');
        }
        
        $centerId = $currentUser['center_id'];
        
        // Get investigators from the same center
        $investigators = $userModel->getInvestigators($centerId);
        
        // Get case counts for each investigator using case_assignments table
        $db = \Config\Database::connect();
        foreach ($investigators as &$investigator) {
            $investigator['active_cases'] = $db->table('case_assignments')
                ->where('investigator_id', $investigator['id'])
                ->where('status', 'active')
                ->countAllResults();
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $investigators
        ]);
    }
    
    /**
     * Update case to court review status
     */
    public function markAsReview($caseId = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        try {
            $db = \Config\Database::connect();
            
            // No need to update case status, just log the review action
            // Log status change
            $db->table('case_status_history')->insert([
                'case_id' => $caseId,
                'previous_status' => $case['status'],
                'new_status' => $case['status'],
                'changed_by' => $userId,
                'changed_at' => date('Y-m-d H:i:s'),
                'reason' => 'Marked as under court review'
            ]);
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Case marked as under review'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Update to review failed: ' . $e->getMessage());
            return $this->fail('Failed to update status', 500);
        }
    }
}
