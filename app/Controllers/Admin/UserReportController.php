<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class UserReportController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get detailed user report
     * GET /admin/users/:id/report
     */
    public function show($userId = null)
    {
        if (!$userId) {
            return $this->failNotFound('User ID required');
        }
        
        $db = \Config\Database::connect();
        
        // Get user details
        $userModel = model('App\Models\UserModel');
        $user = $userModel->select('users.*, police_centers.center_name, police_centers.center_code')
            ->join('police_centers', 'police_centers.id = users.center_id')
            ->find($userId);
        
        if (!$user) {
            return $this->failNotFound('User not found');
        }
        
        unset($user['password_hash']);
        
        // Get activity statistics
        $stats = $this->getUserStats($userId, $db);
        
        // Get recent activity
        $recentActivity = $this->getUserRecentActivity($userId, $db);
        
        // Get cases created by user
        $cases = $this->getUserCases($userId, $db);
        
        // Get login history
        $loginHistory = $this->getLoginHistory($userId, $db);
        
        // Get case status distribution
        $casesByStatus = $this->getCasesByStatus($userId, $db);
        
        // Get monthly activity
        $monthlyActivity = $this->getMonthlyActivity($userId, $db);
        
        return $this->respond([
            'status' => 'success',
            'data' => [
                'user' => $user,
                'stats' => $stats,
                'recent_activity' => $recentActivity,
                'cases' => $cases,
                'login_history' => $loginHistory,
                'cases_by_status' => $casesByStatus,
                'monthly_activity' => $monthlyActivity
            ]
        ]);
    }
    
    /**
     * Get user statistics
     */
    private function getUserStats($userId, $db)
    {
        $role = $db->table('users')->where('id', $userId)->get()->getRow()->role;
        
        $stats = [
            'total_cases' => 0,
            'active_cases' => 0,
            'closed_cases' => 0,
            'total_evidence' => 0,
            'total_persons' => 0,
            'total_investigations' => 0,
            'total_logins' => 0,
            'last_login' => null,
            'account_age_days' => 0
        ];
        
        // Get account age
        $user = $db->table('users')->where('id', $userId)->get()->getRow();
        $createdAt = new \DateTime($user->created_at);
        $now = new \DateTime();
        $stats['account_age_days'] = $createdAt->diff($now)->days;
        $stats['last_login'] = $user->last_login;
        
        if ($role === 'ob_officer') {
            // Cases created by this OB officer
            $stats['total_cases'] = $db->table('cases')->where('created_by', $userId)->countAllResults();
            $stats['active_cases'] = $db->table('cases')
                ->where('created_by', $userId)
                ->whereIn('status', ['draft', 'submitted', 'approved', 'assigned', 'investigating'])
                ->countAllResults();
            $stats['closed_cases'] = $db->table('cases')
                ->where('created_by', $userId)
                ->whereIn('status', ['closed', 'archived'])
                ->countAllResults();
                
            // Persons created
            $stats['total_persons'] = $db->table('persons')->where('created_by', $userId)->countAllResults();
        } elseif ($role === 'investigator') {
            // Cases assigned to investigator
            $stats['total_investigations'] = $db->table('case_assignments')
                ->where('investigator_id', $userId)
                ->countAllResults();
            $stats['active_cases'] = $db->table('case_assignments')
                ->where('investigator_id', $userId)
                ->where('status', 'active')
                ->countAllResults();
            $stats['closed_cases'] = $db->table('case_assignments')
                ->where('investigator_id', $userId)
                ->where('status', 'completed')
                ->countAllResults();
                
            // Evidence collected
            $stats['total_evidence'] = $db->table('evidence')->where('collected_by', $userId)->countAllResults();
            
            // Investigation notes
            $stats['total_notes'] = $db->table('investigation_notes')->where('investigator_id', $userId)->countAllResults();
        }
        
        // Login history
        $stats['total_logins'] = $db->table('user_sessions')->where('user_id', $userId)->countAllResults();
        
        return $stats;
    }
    
    /**
     * Get user's recent activity
     */
    private function getUserRecentActivity($userId, $db)
    {
        $activities = [];
        
        // Recent cases
        $recentCases = $db->table('cases')
            ->where('created_by', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit(5)
            ->get()
            ->getResultArray();
            
        foreach ($recentCases as $case) {
            $activities[] = [
                'type' => 'case_created',
                'description' => "Created case: {$case['case_number']}",
                'timestamp' => $case['created_at'],
                'data' => $case
            ];
        }
        
        // Recent evidence
        $recentEvidence = $db->table('evidence')
            ->where('collected_by', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit(5)
            ->get()
            ->getResultArray();
            
        foreach ($recentEvidence as $evidence) {
            $activities[] = [
                'type' => 'evidence_collected',
                'description' => "Collected evidence: {$evidence['title']}",
                'timestamp' => $evidence['created_at'],
                'data' => $evidence
            ];
        }
        
        // Sort by timestamp
        usort($activities, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        return array_slice($activities, 0, 10);
    }
    
    /**
     * Get user's cases
     */
    private function getUserCases($userId, $db)
    {
        // Get user role
        $user = $db->table('users')->where('id', $userId)->get()->getRow();
        
        if ($user->role === 'investigator') {
            // For investigators, get assigned cases
            return $db->table('cases')
                ->select('cases.*, police_centers.center_name, case_assignments.assigned_at, case_assignments.status as assignment_status')
                ->join('case_assignments', 'case_assignments.case_id = cases.id')
                ->join('police_centers', 'police_centers.id = cases.center_id')
                ->where('case_assignments.investigator_id', $userId)
                ->orderBy('case_assignments.assigned_at', 'DESC')
                ->limit(20)
                ->get()
                ->getResultArray();
        } else {
            // For other roles, get cases created by them
            return $db->table('cases')
                ->select('cases.*, police_centers.center_name')
                ->join('police_centers', 'police_centers.id = cases.center_id')
                ->where('cases.created_by', $userId)
                ->orderBy('cases.created_at', 'DESC')
                ->limit(20)
                ->get()
                ->getResultArray();
        }
    }
    
    /**
     * Get login history
     */
    private function getLoginHistory($userId, $db)
    {
        return $db->table('user_sessions')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit(20)
            ->get()
            ->getResultArray();
    }
    
    /**
     * Get cases by status distribution
     */
    private function getCasesByStatus($userId, $db)
    {
        $statuses = ['draft', 'submitted', 'approved', 'investigating', 'closed', 'archived'];
        $distribution = [];
        
        foreach ($statuses as $status) {
            $count = $db->table('cases')
                ->where('created_by', $userId)
                ->where('status', $status)
                ->countAllResults();
            $distribution[$status] = $count;
        }
        
        return $distribution;
    }
    
    /**
     * Get monthly activity (last 12 months)
     */
    private function getMonthlyActivity($userId, $db)
    {
        $months = [];
        
        for ($i = 11; $i >= 0; $i--) {
            $date = date('Y-m', strtotime("-$i months"));
            $startDate = $date . '-01 00:00:00';
            $endDate = date('Y-m-t 23:59:59', strtotime($startDate));
            
            $casesCreated = $db->table('cases')
                ->where('created_by', $userId)
                ->where('created_at >=', $startDate)
                ->where('created_at <=', $endDate)
                ->countAllResults();
                
            $months[] = [
                'month' => date('M Y', strtotime($startDate)),
                'cases_created' => $casesCreated
            ];
        }
        
        return $months;
    }
}
