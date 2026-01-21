<?php

namespace App\Controllers\Station;

use CodeIgniter\RESTful\ResourceController;

class AssignmentController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Assign investigators to case
     */
    public function assignInvestigators($id = null)
    {
        $rules = [
            'investigator_ids' => 'required',
            'lead_investigator_id' => 'required|integer',
            'deadline' => 'permit_empty|valid_date'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($id);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        if ($case['center_id'] != $this->request->centerId) {
            return $this->failForbidden('You do not have permission to assign this case');
        }
        
        // Allow assignment for approved cases or reassignment for assigned/investigating cases
        if (!in_array($case['status'], ['approved', 'assigned', 'investigating'])) {
            return $this->fail('Case must be approved before assignment', 400);
        }
        
        // Get data from JSON body or POST
        $json = $this->request->getJSON(true); // true = return as array
        
        $investigatorIds = $json['investigator_ids'] ?? $this->request->getPost('investigator_ids');
        $leadInvestigatorId = $json['lead_investigator_id'] ?? $this->request->getPost('lead_investigator_id');
        $deadline = $json['deadline'] ?? $this->request->getPost('deadline');
        
        // Convert to array if string
        if (is_string($investigatorIds)) {
            $investigatorIds = explode(',', $investigatorIds);
        }
        
        // Ensure we have an array
        if (!is_array($investigatorIds)) {
            return $this->fail('investigator_ids must be an array', 400);
        }
        
        // Verify lead investigator is in the list
        if (!in_array($leadInvestigatorId, $investigatorIds)) {
            return $this->fail('Lead investigator must be in the investigator list', 400);
        }
        
        $db = \Config\Database::connect();
        
        // Ensure all IDs are integers
        $investigatorIds = array_map('intval', $investigatorIds);
        $leadInvestigatorId = intval($leadInvestigatorId);
        
        // Verify all investigators are from the same center and have investigator role
        $builder = $db->table('users');
        $builder->whereIn('id', $investigatorIds);
        $builder->where('center_id', $case['center_id']);
        $builder->where('role', 'investigator');
        $builder->where('is_active', 1);
        $validInvestigators = $builder->countAllResults();
        
        if ($validInvestigators !== count($investigatorIds)) {
            return $this->fail('All investigators must be from the same center and have investigator role', 400);
        }
        
        // Check if case already has active assignments
        $existingAssignments = $db->query(
            "SELECT COUNT(*) as count FROM case_assignments WHERE case_id = ? AND status = 'active'",
            [$id]
        )->getRow();
        
        $isReassignment = $existingAssignments->count > 0;
        
        if ($isReassignment) {
            // Mark existing assignments as reassigned instead of deleting
            $db->query(
                "UPDATE case_assignments SET status = 'reassigned', completed_at = ? WHERE case_id = ? AND status = 'active'",
                [date('Y-m-d H:i:s'), $id]
            );
        }
        
        // Create new assignments
        foreach ($investigatorIds as $investigatorId) {
            $assignmentData = [
                'case_id' => $id,
                'investigator_id' => $investigatorId,
                'assigned_by' => $this->request->userId,
                'assigned_at' => date('Y-m-d H:i:s'),
                'deadline' => $deadline,
                'is_lead_investigator' => ($investigatorId == $leadInvestigatorId) ? 1 : 0,
                'status' => 'active'
            ];
            
            $db->query(
                "INSERT INTO case_assignments (case_id, investigator_id, assigned_by, assigned_at, deadline, is_lead_investigator, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    $assignmentData['case_id'],
                    $assignmentData['investigator_id'],
                    $assignmentData['assigned_by'],
                    $assignmentData['assigned_at'],
                    $assignmentData['deadline'],
                    $assignmentData['is_lead_investigator'],
                    $assignmentData['status']
                ]
            );
            
            // Notify investigator
            try {
                $db->table('notifications')->insert([
                    'user_id' => (int)$investigatorId,
                    'notification_type' => 'case_assigned',
                    'title' => 'New Case Assigned',
                    'message' => "Case {$case['case_number']} has been assigned to you",
                    'link_entity_type' => 'cases',
                    'link_entity_id' => (int)$id,
                    'link_url' => '/investigations/' . $id,
                    'priority' => 'high',
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            } catch (\Exception $e) {
                log_message('error', 'Failed to create notification: ' . $e->getMessage());
                // Continue anyway - notification failure shouldn't break assignment
            }
        }
        
        // Update case status (only if not already assigned/investigating)
        $updateData = [
            'investigation_deadline' => $deadline
        ];
        
        if ($case['status'] === 'approved') {
            $updateData['status'] = 'assigned';
            $updateData['assigned_at'] = date('Y-m-d H:i:s');
        }
        
        $caseModel->update($id, $updateData);
        
        // Log status change if it's a new assignment
        if ($case['status'] === 'approved') {
            $caseModel->updateStatus($id, 'assigned', $this->request->userId);
        }
        
        $message = $isReassignment ? 'Case reassigned successfully' : 'Investigators assigned successfully';
        
        return $this->respond([
            'status' => 'success',
            'message' => $message
        ]);
    }
    
    /**
     * Reassign case
     */
    public function reassign($id = null)
    {
        $rules = [
            'investigator_ids' => 'required',
            'lead_investigator_id' => 'required|integer',
            'reason' => 'required|min_length[10]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($id);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        if ($case['center_id'] != $this->request->centerId) {
            return $this->failForbidden('You do not have permission to reassign this case');
        }
        
        // Mark old assignments as reassigned
        $db = \Config\Database::connect();
        $db->table('case_assignments')
            ->where('case_id', $id)
            ->where('status', 'active')
            ->update(['status' => 'reassigned']);
        
        // Use the assign logic
        return $this->assignInvestigators($id);
    }
    
    /**
     * Update investigation deadline
     */
    public function updateDeadline($id = null)
    {
        $rules = [
            'deadline' => 'required|valid_date'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($id);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        if ($case['center_id'] != $this->request->centerId) {
            return $this->failForbidden('You do not have permission to update this case');
        }
        
        $deadline = $this->request->getRawInput()['deadline'];
        
        // Update case
        $caseModel->update($id, ['investigation_deadline' => $deadline]);
        
        // Update assignments
        $db = \Config\Database::connect();
        $db->table('case_assignments')
            ->where('case_id', $id)
            ->where('status', 'active')
            ->update(['deadline' => $deadline]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Deadline updated successfully'
        ]);
    }
    
    /**
     * Update case priority
     */
    public function updatePriority($id = null)
    {
        $rules = [
            'priority' => 'required|in_list[low,medium,high,critical]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($id);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        if ($case['center_id'] != $this->request->centerId) {
            return $this->failForbidden('You do not have permission to update this case');
        }
        
        $priority = $this->request->getRawInput()['priority'];
        $caseModel->update($id, ['priority' => $priority]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Priority updated successfully'
        ]);
    }
}
