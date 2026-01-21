<?php

namespace App\Controllers\Station;

use CodeIgniter\RESTful\ResourceController;

class InvestigatorController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get available investigators for case assignment
     * This endpoint returns investigators in the same center with their workload status
     * GET /station/investigators/available
     */
    public function available()
    {
        $centerId = $this->request->centerId;
        $db = \Config\Database::connect();
        
        // Get all investigators in this center with their active case count
        $investigators = $db->table('users')
            ->select('users.id, users.full_name, users.email, users.badge_number, users.phone, 
                      COUNT(case_assignments.id) as active_cases,
                      CASE 
                        WHEN COUNT(case_assignments.id) = 0 THEN "available"
                        WHEN COUNT(case_assignments.id) < 5 THEN "available"
                        ELSE "busy"
                      END as availability_status')
            ->join('case_assignments', 'case_assignments.investigator_id = users.id AND case_assignments.status = "active"', 'left')
            ->where('users.center_id', $centerId)
            ->where('users.role', 'investigator')
            ->where('users.is_active', 1)
            ->groupBy('users.id')
            ->orderBy('active_cases', 'ASC')
            ->orderBy('users.full_name', 'ASC')
            ->get()
            ->getResultArray();
        
        // Get case details for each investigator (optional - for more detailed info)
        foreach ($investigators as &$investigator) {
            // Convert counts to integers
            $investigator['active_cases'] = (int)$investigator['active_cases'];
            
            // Add status indicator
            $investigator['is_available'] = $investigator['availability_status'] === 'available';
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $investigators
        ]);
    }
    
    /**
     * Get investigator workload details
     * GET /station/investigators/{id}/workload
     */
    public function workload($id = null)
    {
        if (!$id) {
            return $this->fail('Investigator ID is required', 400);
        }
        
        $centerId = $this->request->centerId;
        $db = \Config\Database::connect();
        
        // Verify investigator is in this center
        $investigator = $db->table('users')
            ->where('id', $id)
            ->where('center_id', $centerId)
            ->where('role', 'investigator')
            ->get()
            ->getRowArray();
        
        if (!$investigator) {
            return $this->failNotFound('Investigator not found');
        }
        
        // Get active cases assigned to this investigator
        $activeCases = $db->table('case_assignments')
            ->select('cases.id, cases.case_number, cases.crime_type, cases.status, 
                      case_assignments.assigned_at, case_assignments.deadline, 
                      case_assignments.is_lead_investigator')
            ->join('cases', 'cases.id = case_assignments.case_id')
            ->where('case_assignments.investigator_id', $id)
            ->where('case_assignments.status', 'active')
            ->orderBy('case_assignments.deadline', 'ASC')
            ->get()
            ->getResultArray();
        
        // Calculate workload metrics
        $totalCases = count($activeCases);
        $overdueCases = 0;
        $urgentCases = 0;
        
        foreach ($activeCases as $case) {
            if ($case['deadline'] && strtotime($case['deadline']) < time()) {
                $overdueCases++;
            }
            if ($case['deadline'] && strtotime($case['deadline']) < strtotime('+3 days')) {
                $urgentCases++;
            }
        }
        
        unset($investigator['password_hash']);
        
        return $this->respond([
            'status' => 'success',
            'data' => [
                'investigator' => $investigator,
                'workload' => [
                    'total_cases' => $totalCases,
                    'overdue_cases' => $overdueCases,
                    'urgent_cases' => $urgentCases,
                    'availability_status' => $totalCases < 5 ? 'available' : 'busy'
                ],
                'active_cases' => $activeCases
            ]
        ]);
    }
    
    /**
     * Get all investigators in center
     * GET /station/investigators
     */
    public function index()
    {
        $centerId = $this->request->centerId;
        $db = \Config\Database::connect();
        
        $investigators = $db->table('users')
            ->select('users.*, COUNT(case_assignments.id) as active_cases')
            ->join('case_assignments', 'case_assignments.investigator_id = users.id AND case_assignments.status = "active"', 'left')
            ->where('users.center_id', $centerId)
            ->where('users.role', 'investigator')
            ->groupBy('users.id')
            ->orderBy('users.full_name', 'ASC')
            ->get()
            ->getResultArray();
        
        // Remove password hashes and add availability
        foreach ($investigators as &$investigator) {
            unset($investigator['password_hash']);
            $investigator['active_cases'] = (int)$investigator['active_cases'];
            $investigator['is_available'] = $investigator['active_cases'] < 5;
            $investigator['availability_status'] = $investigator['is_available'] ? 'available' : 'busy';
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $investigators
        ]);
    }
}
