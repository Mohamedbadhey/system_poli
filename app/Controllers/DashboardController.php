<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class DashboardController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get dashboard data based on user role
     * GET /api/dashboard
     */
    public function index()
    {
        $userId = $this->request->userId;
        $userRole = $this->request->userRole;
        $centerId = $this->request->centerId;
        
        $dashboardData = [
            'stats' => $this->getStatistics($userId, $userRole, $centerId),
            'recent_cases' => $this->getRecentCases($userId, $userRole, $centerId),
            'cases_by_status' => $this->getCasesByStatusFiltered($centerId, $userId, $userRole),
            'pending_tasks' => $this->getPendingTasks($userId, $userRole, $centerId)
        ];
        
        return $this->respond([
            'status' => 'success',
            'data' => $dashboardData
        ]);
    }
    
    /**
     * Get statistics based on role
     */
    private function getStatistics($userId, $role, $centerId)
    {
        $db = \Config\Database::connect();
        $stats = [];
        
        if ($role === 'super_admin') {
            // Super admin sees system-wide stats
            $stats['total_centers'] = $db->table('police_centers')->where('is_active', 1)->countAllResults();
            $stats['total_users'] = $db->table('users')->where('is_active', 1)->countAllResults();
            $stats['total_cases'] = $db->table('cases')->countAllResults();
            $stats['active_investigations'] = $db->table('cases')
                ->whereIn('status', ['assigned', 'investigating'])
                ->countAllResults();
        } elseif ($role === 'admin') {
            // Admin sees center-specific stats for cases they created + OB officer cases
            $stats['total_users'] = $db->table('users')
                ->where('center_id', $centerId)
                ->where('is_active', 1)
                ->countAllResults();
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
                ->whereIn('cases.status', ['assigned', 'investigating'])
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('users.role', 'ob_officer')
                ->groupEnd()
                ->countAllResults();
        } elseif ($role === 'ob_officer') {
            // OB officer sees own cases
            $stats['my_cases'] = $db->table('cases')
                ->where('created_by', $userId)
                ->countAllResults();
            $stats['draft_cases'] = $db->table('cases')
                ->where('created_by', $userId)
                ->where('status', 'draft')
                ->countAllResults();
            $stats['submitted_cases'] = $db->table('cases')
                ->where('created_by', $userId)
                ->where('status', 'submitted')
                ->countAllResults();
            $stats['approved_cases'] = $db->table('cases')
                ->where('created_by', $userId)
                ->whereIn('status', ['approved', 'assigned', 'investigating'])
                ->countAllResults();
        } elseif ($role === 'investigator') {
            // Investigator sees assigned cases
            $stats['assigned_cases'] = $db->table('case_assignments')
                ->where('investigator_id', $userId)
                ->where('status', 'active')
                ->countAllResults();
            $stats['completed_cases'] = $db->table('case_assignments')
                ->where('investigator_id', $userId)
                ->where('status', 'completed')
                ->countAllResults();
            $stats['pending_reports'] = $db->table('cases')
                ->join('case_assignments', 'case_assignments.case_id = cases.id')
                ->where('case_assignments.investigator_id', $userId)
                ->where('cases.status', 'investigating')
                ->countAllResults();
        } elseif ($role === 'court_user') {
            // Court user sees court-ready cases
            $stats['court_pending'] = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('status', 'escalated')
                ->countAllResults();
            $stats['submitted_to_court'] = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('status', 'court_pending')
                ->countAllResults();
        }
        
        return $stats;
    }
    
    /**
     * Get recent cases
     */
    private function getRecentCases($userId, $role, $centerId)
    {
        $db = \Config\Database::connect();
        $builder = $db->table('cases');
        
        if ($role === 'super_admin') {
            // Show all recent cases
            $builder->orderBy('created_at', 'DESC')->limit(10);
        } elseif ($role === 'admin') {
            // Admin can see cases they created + cases created by OB officers in their center
            $builder->select('cases.*')
                ->join('users', 'users.id = cases.created_by', 'left')
                ->where('cases.center_id', $centerId)
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('users.role', 'ob_officer')
                ->groupEnd()
                ->orderBy('cases.created_at', 'DESC')
                ->limit(10);
        } elseif ($role === 'ob_officer') {
            $builder->where('created_by', $userId)
                ->orderBy('created_at', 'DESC')
                ->limit(10);
        } elseif ($role === 'investigator') {
            $builder->join('case_assignments', 'case_assignments.case_id = cases.id')
                ->where('case_assignments.investigator_id', $userId)
                ->where('case_assignments.status', 'active')
                ->orderBy('cases.created_at', 'DESC')
                ->limit(10);
        } elseif ($role === 'court_user') {
            $builder->where('center_id', $centerId)
                ->whereIn('status', ['escalated', 'court_pending'])
                ->orderBy('created_at', 'DESC')
                ->limit(10);
        }
        
        return $builder->get()->getResultArray();
    }
    
    /**
     * Get cases grouped by status
     */
    private function getCasesByStatus($centerId)
    {
        $db = \Config\Database::connect();
        
        $result = $db->table('cases')
            ->select('status, COUNT(*) as count')
            ->where('center_id', $centerId)
            ->groupBy('status')
            ->get()
            ->getResultArray();
        
        $statusData = [];
        foreach ($result as $row) {
            $statusData[$row['status']] = $row['count'];
        }
        
        return $statusData;
    }
    
    /**
     * Get cases grouped by status (filtered for admin role)
     */
    private function getCasesByStatusFiltered($centerId, $userId, $role)
    {
        $db = \Config\Database::connect();
        $builder = $db->table('cases')
            ->select('cases.status, COUNT(*) as count')
            ->where('cases.center_id', $centerId);
        
        // Admin can only see cases they created + cases created by OB officers
        if ($role === 'admin') {
            $builder->join('users', 'users.id = cases.created_by', 'left')
                ->groupStart()
                    ->where('cases.created_by', $userId)
                    ->orWhere('users.role', 'ob_officer')
                ->groupEnd();
        }
        
        $result = $builder->groupBy('cases.status')
            ->get()
            ->getResultArray();
        
        $statusData = [];
        foreach ($result as $row) {
            $statusData[$row['status']] = $row['count'];
        }
        
        return $statusData;
    }
    
    /**
     * Get pending tasks for user
     */
    private function getPendingTasks($userId, $role, $centerId)
    {
        $tasks = [];
        
        if ($role === 'admin') {
            $db = \Config\Database::connect();
            $pendingCount = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('status', 'submitted')
                ->countAllResults();
            
            if ($pendingCount > 0) {
                $tasks[] = [
                    'title' => 'Cases Pending Approval',
                    'count' => $pendingCount,
                    'link' => '/station/cases/pending'
                ];
            }
        }
        
        return $tasks;
    }
}
