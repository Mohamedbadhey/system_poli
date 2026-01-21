<?php

namespace App\Controllers\Station;

use CodeIgniter\RESTful\ResourceController;

class CaseTrackingController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get all assigned cases with tracking information
     */
    public function getAssignedCases()
    {
        $centerId = $this->request->centerId;
        $db = \Config\Database::connect();
        
        // Get all assigned cases with their investigation teams
        $query = $db->query("
            SELECT 
                c.*,
                GROUP_CONCAT(DISTINCT u.full_name ORDER BY ca.is_lead_investigator DESC SEPARATOR ', ') as investigators,
                MAX(CASE WHEN ca.is_lead_investigator = 1 THEN u.full_name END) as lead_investigator_name,
                MAX(CASE WHEN ca.is_lead_investigator = 1 THEN u.id END) as lead_investigator_id,
                COUNT(DISTINCT ca.investigator_id) as team_size,
                MIN(ca.assigned_at) as assigned_at,
                MIN(ca.deadline) as deadline
            FROM cases c
            INNER JOIN case_assignments ca ON ca.case_id = c.id AND ca.status = 'active'
            INNER JOIN users u ON u.id = ca.investigator_id
            WHERE c.center_id = ?
            AND c.status IN ('assigned', 'investigating', 'evidence_collected', 'suspect_identified', 'under_review', 'closed', 'archived')
            GROUP BY c.id
            ORDER BY c.created_at DESC
        ", [$centerId]);
        
        $cases = $query->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $cases
        ]);
    }
    
    /**
     * Get investigator performance metrics
     */
    public function getInvestigatorPerformance()
    {
        $centerId = $this->request->centerId;
        $db = \Config\Database::connect();
        
        // Get all investigators with their performance metrics
        $query = $db->query("
            SELECT 
                u.id,
                u.full_name,
                u.badge_number,
                u.phone,
                
                -- Active cases count
                COUNT(DISTINCT CASE 
                    WHEN ca.status = 'active' 
                    AND c.status IN ('assigned', 'investigating', 'evidence_collected', 'suspect_identified', 'under_review')
                    THEN ca.case_id 
                END) as active_cases,
                
                -- Completed cases count
                COUNT(DISTINCT CASE 
                    WHEN c.status IN ('closed', 'archived')
                    THEN ca.case_id 
                END) as completed_cases,
                
                -- Overdue cases count
                COUNT(DISTINCT CASE 
                    WHEN ca.status = 'active' 
                    AND ca.deadline IS NOT NULL 
                    AND ca.deadline < NOW()
                    AND c.status NOT IN ('closed', 'archived')
                    THEN ca.case_id 
                END) as overdue_cases,
                
                -- Average completion time (in days)
                AVG(CASE 
                    WHEN c.status IN ('closed', 'archived') AND c.closed_date IS NOT NULL
                    THEN DATEDIFF(c.closed_date, ca.assigned_at)
                END) as avg_completion_days,
                
                -- Failed cases (returned or archived without completion)
                COUNT(DISTINCT CASE 
                    WHEN c.status = 'returned'
                    THEN ca.case_id 
                END) as failed_cases
                
            FROM users u
            LEFT JOIN case_assignments ca ON ca.investigator_id = u.id
            LEFT JOIN cases c ON c.id = ca.case_id
            WHERE u.center_id = ?
            AND u.role = 'investigator'
            AND u.is_active = 1
            GROUP BY u.id, u.full_name, u.badge_number, u.phone
            ORDER BY active_cases DESC, completed_cases DESC
        ", [$centerId]);
        
        $investigators = $query->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $investigators
        ]);
    }
    
    /**
     * Get case team members
     */
    public function getCaseTeam($caseId = null)
    {
        $centerId = $this->request->centerId;
        $db = \Config\Database::connect();
        
        // Verify case belongs to center
        $case = $db->table('cases')->where('id', $caseId)->where('center_id', $centerId)->get()->getRowArray();
        
        if (!$case) {
            return $this->failNotFound('Case not found or not in your center');
        }
        
        // Get team members
        $query = $db->query("
            SELECT 
                u.id,
                u.full_name,
                u.badge_number,
                u.phone,
                u.email,
                ca.is_lead_investigator,
                ca.assigned_at,
                ca.deadline
            FROM case_assignments ca
            INNER JOIN users u ON u.id = ca.investigator_id
            WHERE ca.case_id = ?
            AND ca.status = 'active'
            ORDER BY ca.is_lead_investigator DESC, u.full_name ASC
        ", [$caseId]);
        
        $team = $query->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $team
        ]);
    }
    
    /**
     * Update case deadline
     */
    public function updateDeadline($caseId = null)
    {
        $rules = [
            'deadline' => 'required|valid_date'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $centerId = $this->request->centerId;
        $deadline = $this->request->getPost('deadline') ?? $this->request->getJSON(true)['deadline'];
        
        $db = \Config\Database::connect();
        
        // Verify case belongs to center
        $case = $db->table('cases')->where('id', $caseId)->where('center_id', $centerId)->get()->getRowArray();
        
        if (!$case) {
            return $this->failNotFound('Case not found or not in your center');
        }
        
        // Update case deadline
        $caseModel = model('App\Models\CaseModel');
        $caseModel->update($caseId, ['investigation_deadline' => $deadline]);
        
        // Update all active assignments for this case
        $db->table('case_assignments')
            ->where('case_id', $caseId)
            ->where('status', 'active')
            ->update(['deadline' => $deadline]);
        
        // Notify investigators about deadline change
        try {
            $assignments = $db->table('case_assignments')
                ->where('case_id', $caseId)
                ->where('status', 'active')
                ->get()
                ->getResultArray();
            
            foreach ($assignments as $assignment) {
                $db->table('notifications')->insert([
                    'user_id' => (int)$assignment['investigator_id'],
                    'notification_type' => 'deadline_updated',
                    'title' => 'Case Deadline Updated',
                    'message' => "Deadline for case {$case['case_number']} has been updated to " . date('M d, Y', strtotime($deadline)),
                    'link_entity_type' => 'cases',
                    'link_entity_id' => (int)$caseId,
                    'link_url' => '/investigations/' . $caseId,
                    'priority' => 'medium',
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
        } catch (\Exception $e) {
            log_message('error', 'Failed to send deadline update notifications: ' . $e->getMessage());
        }
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Deadline updated successfully'
        ]);
    }
    
    /**
     * Get investigator's assigned cases
     */
    public function getInvestigatorCases($investigatorId = null)
    {
        $centerId = $this->request->centerId;
        $db = \Config\Database::connect();
        
        // Verify investigator belongs to this center
        $investigator = $db->table('users')
            ->where('id', $investigatorId)
            ->where('center_id', $centerId)
            ->where('role', 'investigator')
            ->get()
            ->getRowArray();
        
        if (!$investigator) {
            return $this->failNotFound('Investigator not found or not in your center');
        }
        
        // Get all cases assigned to this investigator
        $query = $db->query("
            SELECT 
                c.id,
                c.case_number,
                c.crime_type,
                c.crime_category,
                c.status,
                c.priority,
                c.incident_date,
                c.created_at,
                ca.assigned_at,
                ca.deadline,
                ca.is_lead_investigator,
                CASE 
                    WHEN ca.deadline IS NOT NULL AND ca.deadline < NOW() AND c.status NOT IN ('closed', 'archived')
                    THEN 1
                    ELSE 0
                END as is_overdue
            FROM case_assignments ca
            INNER JOIN cases c ON c.id = ca.case_id
            WHERE ca.investigator_id = ?
            AND ca.status = 'active'
            AND c.center_id = ?
            ORDER BY ca.is_lead_investigator DESC, c.created_at DESC
        ", [$investigatorId, $centerId]);
        
        $cases = $query->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $cases
        ]);
    }
    
    /**
     * Get investigator profile and performance
     */
    public function getInvestigatorProfile($investigatorId = null)
    {
        $centerId = $this->request->centerId;
        $db = \Config\Database::connect();
        
        // Get investigator details with performance metrics
        $query = $db->query("
            SELECT 
                u.id,
                u.full_name,
                u.badge_number,
                u.email,
                u.phone,
                u.created_at,
                pc.center_name,
                
                -- Performance metrics
                COUNT(DISTINCT CASE 
                    WHEN ca.status = 'active' 
                    AND c.status IN ('assigned', 'investigating', 'evidence_collected', 'suspect_identified', 'under_review')
                    THEN ca.case_id 
                END) as active_cases,
                
                COUNT(DISTINCT CASE 
                    WHEN c.status IN ('closed', 'archived')
                    THEN ca.case_id 
                END) as completed_cases,
                
                COUNT(DISTINCT CASE 
                    WHEN c.status = 'returned'
                    THEN ca.case_id 
                END) as failed_cases,
                
                AVG(CASE 
                    WHEN c.status IN ('closed', 'archived') AND c.closed_date IS NOT NULL
                    THEN DATEDIFF(c.closed_date, ca.assigned_at)
                END) as avg_completion_days,
                
                CASE 
                    WHEN (COUNT(DISTINCT CASE WHEN c.status IN ('closed', 'archived') THEN ca.case_id END) + 
                          COUNT(DISTINCT CASE WHEN c.status = 'returned' THEN ca.case_id END)) > 0
                    THEN ROUND(
                        (COUNT(DISTINCT CASE WHEN c.status IN ('closed', 'archived') THEN ca.case_id END) * 100.0) / 
                        (COUNT(DISTINCT CASE WHEN c.status IN ('closed', 'archived') THEN ca.case_id END) + 
                         COUNT(DISTINCT CASE WHEN c.status = 'returned' THEN ca.case_id END))
                    )
                    ELSE 0
                END as success_rate
                
            FROM users u
            LEFT JOIN police_centers pc ON pc.id = u.center_id
            LEFT JOIN case_assignments ca ON ca.investigator_id = u.id
            LEFT JOIN cases c ON c.id = ca.case_id
            WHERE u.id = ?
            AND u.center_id = ?
            AND u.role = 'investigator'
            GROUP BY u.id, u.full_name, u.badge_number, u.email, u.phone, u.created_at, pc.center_name
        ", [$investigatorId, $centerId]);
        
        $profile = $query->getRowArray();
        
        if (!$profile) {
            return $this->failNotFound('Investigator not found or not in your center');
        }
        
        // Add rank based on performance (this is a simple example, adjust as needed)
        if ($profile['success_rate'] >= 90 && $profile['completed_cases'] >= 20) {
            $profile['rank'] = 'Senior Investigator';
        } elseif ($profile['success_rate'] >= 75 && $profile['completed_cases'] >= 10) {
            $profile['rank'] = 'Investigator';
        } elseif ($profile['completed_cases'] >= 5) {
            $profile['rank'] = 'Junior Investigator';
        } else {
            $profile['rank'] = 'Trainee Investigator';
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $profile
        ]);
    }
}
