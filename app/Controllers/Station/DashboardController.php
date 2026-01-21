<?php

namespace App\Controllers\Station;

use CodeIgniter\RESTful\ResourceController;

class DashboardController extends ResourceController
{
    protected $format = 'json';
    
    public function index()
    {
        $centerId = $this->request->centerId;
        $userId = $this->request->userId;
        $userRole = $this->request->userRole;
        $db = \Config\Database::connect();
        
        // Build case filter for admin role
        $caseFilter = function($builder) use ($userId, $userRole) {
            if ($userRole === 'admin') {
                $builder->join('users', 'users.id = cases.created_by', 'left')
                    ->groupStart()
                        ->where('cases.created_by', $userId)
                        ->orWhere('users.role', 'ob_officer')
                    ->groupEnd();
            }
        };
        
        // Center statistics
        $stats = [
            'total_cases' => $db->table('cases')
                ->where('center_id', $centerId)
                ->countAllResults(),
            
            'pending_approval' => $db->table('cases')
                ->where('center_id', $centerId)
                ->where('status', 'submitted')
                ->countAllResults(),
            
            'active_investigations' => $db->table('cases')
                ->where('center_id', $centerId)
                ->whereIn('status', ['investigating', 'assigned'])
                ->countAllResults(),
            
            'in_custody' => $db->table('custody_records')
                ->where('center_id', $centerId)
                ->where('custody_status', 'in_custody')
                ->countAllResults(),
            
            'court_pending' => $db->table('cases')
                ->where('center_id', $centerId)
                ->where('status', 'court_pending')
                ->countAllResults()
        ];
        
        // Apply admin filter to case statistics if needed
        if ($userRole === 'admin') {
            $stats['total_cases'] = $db->table('cases')
                ->join('users', 'users.id = cases.created_by', 'left')
                ->where('cases.center_id', $centerId)
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('users.role', 'ob_officer')
                ->groupEnd()
                ->countAllResults();
            
            $stats['pending_approval'] = $db->table('cases')
                ->join('users', 'users.id = cases.created_by', 'left')
                ->where('cases.center_id', $centerId)
                ->where('cases.status', 'submitted')
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('users.role', 'ob_officer')
                ->groupEnd()
                ->countAllResults();
            
            $stats['active_investigations'] = $db->table('cases')
                ->join('users', 'users.id = cases.created_by', 'left')
                ->where('cases.center_id', $centerId)
                ->whereIn('cases.status', ['investigating', 'assigned'])
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('users.role', 'ob_officer')
                ->groupEnd()
                ->countAllResults();
            
            $stats['court_pending'] = $db->table('cases')
                ->join('users', 'users.id = cases.created_by', 'left')
                ->where('cases.center_id', $centerId)
                ->where('cases.status', 'court_pending')
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('users.role', 'ob_officer')
                ->groupEnd()
                ->countAllResults();
        }
        
        // Cases by status
        $casesByStatusBuilder = $db->table('cases')
            ->select('cases.status, COUNT(*) as count')
            ->where('cases.center_id', $centerId);
        
        if ($userRole === 'admin') {
            $casesByStatusBuilder->join('users', 'users.id = cases.created_by', 'left')
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('users.role', 'ob_officer')
                ->groupEnd();
        }
        
        $casesByStatus = $casesByStatusBuilder
            ->groupBy('cases.status')
            ->get()
            ->getResultArray();
        
        // Recent cases
        $recentCasesBuilder = $db->table('cases')
            ->select('cases.*, users.full_name as created_by_name, users.role as creator_role')
            ->join('users', 'users.id = cases.created_by')
            ->where('cases.center_id', $centerId);
        
        if ($userRole === 'admin') {
            $recentCasesBuilder->groupStart()
                ->where('cases.created_by', $userId)
                ->orWhere('users.role', 'ob_officer')
                ->groupEnd();
        }
        
        $recentCases = $recentCasesBuilder
            ->orderBy('cases.created_at', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();
        
        // Investigator workload
        $workloadBuilder = $db->table('case_assignments')
            ->select('users.full_name, users.badge_number, COUNT(*) as active_cases')
            ->join('users', 'users.id = case_assignments.investigator_id')
            ->join('cases', 'cases.id = case_assignments.case_id')
            ->where('cases.center_id', $centerId)
            ->where('case_assignments.status', 'active');
        
        if ($userRole === 'admin') {
            $workloadBuilder->join('users as creators', 'creators.id = cases.created_by', 'left')
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('creators.role', 'ob_officer')
                ->groupEnd();
        }
        
        $investigatorWorkload = $workloadBuilder
            ->groupBy('case_assignments.investigator_id')
            ->get()
            ->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => [
                'stats' => $stats,
                'cases_by_status' => $casesByStatus,
                'recent_cases' => $recentCases,
                'investigator_workload' => $investigatorWorkload
            ]
        ]);
    }
}
