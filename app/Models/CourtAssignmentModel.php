<?php

namespace App\Models;

use CodeIgniter\Model;

class CourtAssignmentModel extends Model
{
    protected $table = 'court_assignments';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'case_id', 'assigned_to', 'assigned_by', 'assigned_date',
        'deadline', 'notes', 'status', 'completed_date'
    ];
    
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    
    protected $validationRules = [
        'case_id' => 'required|integer',
        'assigned_to' => 'required|integer',
        'assigned_by' => 'required|integer',
        'deadline' => 'permit_empty|valid_date',
        'status' => 'permit_empty|in_list[active,completed,cancelled]'
    ];
    
    /**
     * Get active assignments for an investigator
     */
    public function getActiveAssignmentsForInvestigator(int $investigatorId)
    {
        return $this->select('court_assignments.*, cases.case_number, cases.ob_number, cases.crime_type, cases.status as case_status')
                    ->join('cases', 'cases.id = court_assignments.case_id')
                    ->where('court_assignments.assigned_to', $investigatorId)
                    ->where('court_assignments.status', 'active')
                    ->orderBy('court_assignments.deadline', 'ASC')
                    ->findAll();
    }
    
    /**
     * Get assignments by court user
     */
    public function getAssignmentsByCourtUser(int $courtUserId)
    {
        return $this->select('court_assignments.*, cases.case_number, cases.ob_number, cases.crime_type')
                    ->join('cases', 'cases.id = court_assignments.case_id')
                    ->where('court_assignments.assigned_by', $courtUserId)
                    ->orderBy('court_assignments.created_at', 'DESC')
                    ->findAll();
    }
    
    /**
     * Complete an assignment
     */
    public function completeAssignment(int $assignmentId): bool
    {
        return $this->update($assignmentId, [
            'status' => 'completed',
            'completed_date' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Get overdue assignments
     */
    public function getOverdueAssignments()
    {
        return $this->select('court_assignments.*, cases.case_number, users.full_name as investigator_name')
                    ->join('cases', 'cases.id = court_assignments.case_id')
                    ->join('users', 'users.id = court_assignments.assigned_to')
                    ->where('court_assignments.status', 'active')
                    ->where('court_assignments.deadline <', date('Y-m-d'))
                    ->orderBy('court_assignments.deadline', 'ASC')
                    ->findAll();
    }
}
