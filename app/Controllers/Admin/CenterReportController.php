<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class CenterReportController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get detailed center report
     * GET /admin/centers/:id/report
     */
    public function show($centerId = null)
    {
        if (!$centerId) {
            return $this->failNotFound('Center ID required');
        }
        
        $db = \Config\Database::connect();
        
        // Get center details
        $centerModel = model('App\Models\PoliceCenterModel');
        $center = $centerModel->find($centerId);
        
        if (!$center) {
            return $this->failNotFound('Center not found');
        }
        
        // Get comprehensive statistics
        $stats = $this->getCenterStats($centerId, $db);
        
        // Get users in center
        $users = $this->getCenterUsers($centerId, $db);
        
        // Get recent cases
        $recentCases = $this->getRecentCases($centerId, $db);
        
        // Get case distribution
        $casesByStatus = $this->getCasesByStatus($centerId, $db);
        $casesByCategory = $this->getCasesByCategory($centerId, $db);
        $casesByPriority = $this->getCasesByPriority($centerId, $db);
        
        // Get performance metrics
        $performance = $this->getPerformanceMetrics($centerId, $db);
        
        // Get monthly trends
        $monthlyTrends = $this->getMonthlyTrends($centerId, $db);
        
        // Get top performers
        $topPerformers = $this->getTopPerformers($centerId, $db);
        
        return $this->respond([
            'status' => 'success',
            'data' => [
                'center' => $center,
                'stats' => $stats,
                'users' => $users,
                'recent_cases' => $recentCases,
                'cases_by_status' => $casesByStatus,
                'cases_by_category' => $casesByCategory,
                'cases_by_priority' => $casesByPriority,
                'performance' => $performance,
                'monthly_trends' => $monthlyTrends,
                'top_performers' => $topPerformers
            ]
        ]);
    }
    
    /**
     * Get center statistics
     */
    private function getCenterStats($centerId, $db)
    {
        $stats = [
            'total_users' => 0,
            'active_users' => 0,
            'total_cases' => 0,
            'active_cases' => 0,
            'closed_cases' => 0,
            'total_evidence' => 0,
            'total_persons' => 0,
            'cases_this_month' => 0,
            'cases_last_month' => 0,
            'pending_approval' => 0,
            'in_custody' => 0,
            'sent_to_court' => 0
        ];
        
        // Users
        $stats['total_users'] = $db->table('users')->where('center_id', $centerId)->countAllResults();
        $stats['active_users'] = $db->table('users')
            ->where('center_id', $centerId)
            ->where('is_active', 1)
            ->countAllResults();
        
        // Users by role
        $stats['ob_officers'] = $db->table('users')
            ->where('center_id', $centerId)
            ->where('role', 'ob_officer')
            ->countAllResults();
        $stats['investigators'] = $db->table('users')
            ->where('center_id', $centerId)
            ->where('role', 'investigator')
            ->countAllResults();
        $stats['admins'] = $db->table('users')
            ->where('center_id', $centerId)
            ->where('role', 'admin')
            ->countAllResults();
        
        // Cases
        $stats['total_cases'] = $db->table('cases')->where('center_id', $centerId)->countAllResults();
        $stats['active_cases'] = $db->table('cases')
            ->where('center_id', $centerId)
            ->whereIn('status', ['draft', 'submitted', 'approved', 'assigned', 'investigating'])
            ->countAllResults();
        $stats['closed_cases'] = $db->table('cases')
            ->where('center_id', $centerId)
            ->whereIn('status', ['closed', 'archived'])
            ->countAllResults();
        
        // Pending approval
        $stats['pending_approval'] = $db->table('cases')
            ->where('center_id', $centerId)
            ->where('status', 'submitted')
            ->countAllResults();
        
        // Court cases
        $stats['sent_to_court'] = $db->table('cases')
            ->where('center_id', $centerId)
            ->where('court_status !=', 'not_sent')
            ->countAllResults();
        
        // Evidence
        $stats['total_evidence'] = $db->table('evidence')
            ->join('cases', 'cases.id = evidence.case_id')
            ->where('cases.center_id', $centerId)
            ->countAllResults();
        
        // Persons
        $stats['total_persons'] = $db->table('case_parties')
            ->join('cases', 'cases.id = case_parties.case_id')
            ->where('cases.center_id', $centerId)
            ->countAllResults();
        
        // Custody
        $stats['in_custody'] = $db->table('custody_records')
            ->where('custody_records.center_id', $centerId)
            ->where('custody_records.custody_status', 'in_custody')
            ->countAllResults();
        
        // This month vs last month
        $thisMonthStart = date('Y-m-01 00:00:00');
        $lastMonthStart = date('Y-m-01 00:00:00', strtotime('-1 month'));
        $lastMonthEnd = date('Y-m-t 23:59:59', strtotime('-1 month'));
        
        $stats['cases_this_month'] = $db->table('cases')
            ->where('center_id', $centerId)
            ->where('created_at >=', $thisMonthStart)
            ->countAllResults();
        
        $stats['cases_last_month'] = $db->table('cases')
            ->where('center_id', $centerId)
            ->where('created_at >=', $lastMonthStart)
            ->where('created_at <=', $lastMonthEnd)
            ->countAllResults();
        
        return $stats;
    }
    
    /**
     * Get center users with their stats
     */
    private function getCenterUsers($centerId, $db)
    {
        $users = $db->table('users')
            ->select('id, username, full_name, role, badge_number, is_active, last_login, created_at')
            ->where('center_id', $centerId)
            ->orderBy('role', 'ASC')
            ->orderBy('full_name', 'ASC')
            ->get()
            ->getResultArray();
        
        // Add stats for each user
        foreach ($users as &$user) {
            if ($user['role'] === 'ob_officer') {
                $user['cases_created'] = $db->table('cases')
                    ->where('created_by', $user['id'])
                    ->countAllResults();
            } elseif ($user['role'] === 'investigator') {
                $user['cases_assigned'] = $db->table('case_assignments')
                    ->where('investigator_id', $user['id'])
                    ->countAllResults();
                $user['evidence_collected'] = $db->table('evidence')
                    ->where('collected_by', $user['id'])
                    ->countAllResults();
            }
        }
        
        return $users;
    }
    
    /**
     * Get recent cases
     */
    private function getRecentCases($centerId, $db)
    {
        return $db->table('cases')
            ->select('cases.*, users.full_name as created_by_name')
            ->join('users', 'users.id = cases.created_by')
            ->where('cases.center_id', $centerId)
            ->orderBy('cases.created_at', 'DESC')
            ->limit(20)
            ->get()
            ->getResultArray();
    }
    
    /**
     * Get cases by status
     */
    private function getCasesByStatus($centerId, $db)
    {
        $statuses = ['draft', 'submitted', 'approved', 'assigned', 'investigating', 
                     'evidence_collected', 'suspect_identified', 'under_review', 'closed', 'archived'];
        $distribution = [];
        
        foreach ($statuses as $status) {
            $count = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('status', $status)
                ->countAllResults();
            $distribution[$status] = $count;
        }
        
        return $distribution;
    }
    
    /**
     * Get cases by category
     */
    private function getCasesByCategory($centerId, $db)
    {
        $categories = ['violent', 'property', 'drug', 'cybercrime', 'sexual', 'juvenile', 'other'];
        $distribution = [];
        
        foreach ($categories as $category) {
            $count = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('crime_category', $category)
                ->countAllResults();
            $distribution[$category] = $count;
        }
        
        return $distribution;
    }
    
    /**
     * Get cases by priority
     */
    private function getCasesByPriority($centerId, $db)
    {
        $priorities = ['low', 'medium', 'high', 'critical'];
        $distribution = [];
        
        foreach ($priorities as $priority) {
            $count = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('priority', $priority)
                ->countAllResults();
            $distribution[$priority] = $count;
        }
        
        return $distribution;
    }
    
    /**
     * Get performance metrics
     */
    private function getPerformanceMetrics($centerId, $db)
    {
        $metrics = [
            'avg_case_resolution_days' => 0,
            'case_closure_rate' => 0,
            'court_submission_rate' => 0,
            'evidence_collection_rate' => 0
        ];
        
        $totalCases = $db->table('cases')->where('center_id', $centerId)->countAllResults();
        
        if ($totalCases > 0) {
            // Closure rate
            $closedCases = $db->table('cases')
                ->where('center_id', $centerId)
                ->whereIn('status', ['closed', 'archived'])
                ->countAllResults();
            $metrics['case_closure_rate'] = round(($closedCases / $totalCases) * 100, 2);
            
            // Court submission rate
            $courtCases = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('court_status !=', 'not_sent')
                ->countAllResults();
            $metrics['court_submission_rate'] = round(($courtCases / $totalCases) * 100, 2);
            
            // Evidence collection rate
            $casesWithEvidence = $db->table('cases')
                ->select('DISTINCT cases.id')
                ->join('evidence', 'evidence.case_id = cases.id')
                ->where('cases.center_id', $centerId)
                ->countAllResults();
            $metrics['evidence_collection_rate'] = round(($casesWithEvidence / $totalCases) * 100, 2);
            
            // Average resolution time (closed cases only)
            $closedCasesData = $db->table('cases')
                ->select('created_at, closed_at')
                ->where('center_id', $centerId)
                ->whereIn('status', ['closed', 'archived'])
                ->where('closed_at IS NOT NULL', null, false)
                ->get()
                ->getResultArray();
            
            if (count($closedCasesData) > 0) {
                $totalDays = 0;
                foreach ($closedCasesData as $case) {
                    $created = new \DateTime($case['created_at']);
                    $closed = new \DateTime($case['closed_at']);
                    $totalDays += $created->diff($closed)->days;
                }
                $metrics['avg_case_resolution_days'] = round($totalDays / count($closedCasesData), 1);
            }
        }
        
        return $metrics;
    }
    
    /**
     * Get monthly trends (last 12 months)
     */
    private function getMonthlyTrends($centerId, $db)
    {
        $trends = [];
        
        for ($i = 11; $i >= 0; $i--) {
            $date = date('Y-m', strtotime("-$i months"));
            $startDate = $date . '-01 00:00:00';
            $endDate = date('Y-m-t 23:59:59', strtotime($startDate));
            
            $casesCreated = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('created_at >=', $startDate)
                ->where('created_at <=', $endDate)
                ->countAllResults();
            
            $casesClosed = $db->table('cases')
                ->where('center_id', $centerId)
                ->where('closed_at >=', $startDate)
                ->where('closed_at <=', $endDate)
                ->whereIn('status', ['closed', 'archived'])
                ->countAllResults();
            
            $trends[] = [
                'month' => date('M Y', strtotime($startDate)),
                'cases_created' => $casesCreated,
                'cases_closed' => $casesClosed
            ];
        }
        
        return $trends;
    }
    
    /**
     * Get top performers in the center
     */
    private function getTopPerformers($centerId, $db)
    {
        // Top case creators (OB Officers)
        $topCreators = $db->table('users')
            ->select('users.full_name, users.role, COUNT(cases.id) as case_count')
            ->join('cases', 'cases.created_by = users.id', 'left')
            ->where('users.center_id', $centerId)
            ->where('users.role', 'ob_officer')
            ->groupBy('users.id')
            ->orderBy('case_count', 'DESC')
            ->limit(5)
            ->get()
            ->getResultArray();
        
        // Top investigators
        $topInvestigators = $db->table('users')
            ->select('users.full_name, users.role, COUNT(case_assignments.id) as assigned_cases')
            ->join('case_assignments', 'case_assignments.investigator_id = users.id', 'left')
            ->where('users.center_id', $centerId)
            ->where('users.role', 'investigator')
            ->groupBy('users.id')
            ->orderBy('assigned_cases', 'DESC')
            ->limit(5)
            ->get()
            ->getResultArray();
        
        return [
            'top_case_creators' => $topCreators,
            'top_investigators' => $topInvestigators
        ];
    }
}
