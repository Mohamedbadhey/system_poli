<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class DashboardController extends ResourceController
{
    protected $format = 'json';
    
    public function index()
    {
        $db = \Config\Database::connect();
        
        // System-wide statistics
        $stats = [
            'total_centers' => $db->table('police_centers')->where('is_active', 1)->countAllResults(),
            'total_users' => $db->table('users')->where('is_active', 1)->countAllResults(),
            'total_cases' => $db->table('cases')->countAllResults(),
            'active_cases' => $db->table('cases')
                ->whereIn('status', ['investigating', 'assigned', 'approved', 'court_pending'])
                ->countAllResults(),
            'closed_cases' => $db->table('cases')->where('status', 'closed')->countAllResults(),
            'persons_in_custody' => $db->table('custody_records')
                ->where('custody_status', 'in_custody')
                ->countAllResults(),
            'total_evidence' => $db->table('evidence')->countAllResults()
        ];
        
        // Cases by status
        $casesByStatus = $db->table('cases')
            ->select('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->getResultArray();
        
        // Cases by priority
        $casesByPriority = $db->table('cases')
            ->select('priority, COUNT(*) as count')
            ->whereNotIn('status', ['closed'])
            ->groupBy('priority')
            ->get()
            ->getResultArray();
        
        // Cases by crime category
        $casesByCategory = $db->table('cases')
            ->select('crime_category, COUNT(*) as count')
            ->groupBy('crime_category')
            ->orderBy('count', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();
        
        // Recent activity
        $recentActivity = $db->table('audit_logs')
            ->select('audit_logs.*, users.full_name')
            ->join('users', 'users.id = audit_logs.user_id', 'left')
            ->orderBy('audit_logs.created_at', 'DESC')
            ->limit(20)
            ->get()
            ->getResultArray();
        
        // Center performance
        $centerStats = $db->table('cases')
            ->select('police_centers.center_name, COUNT(*) as total_cases, 
                      SUM(CASE WHEN cases.status = "closed" THEN 1 ELSE 0 END) as closed_cases')
            ->join('police_centers', 'police_centers.id = cases.center_id')
            ->groupBy('cases.center_id')
            ->get()
            ->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => [
                'stats' => $stats,
                'cases_by_status' => $casesByStatus,
                'cases_by_priority' => $casesByPriority,
                'cases_by_category' => $casesByCategory,
                'recent_activity' => $recentActivity,
                'center_stats' => $centerStats
            ]
        ]);
    }
    
    /**
     * Get detailed statistics for case reports with date filtering
     */
    public function stats()
    {
        $db = \Config\Database::connect();
        
        // Get filter parameters
        $period = $this->request->getGet('period'); // today, week, month, year
        $startDate = $this->request->getGet('start');
        $endDate = $this->request->getGet('end');
        
        // Build date filter
        $dateFilter = $this->buildDateFilter($period, $startDate, $endDate);
        
        // Total cases with date filter
        $totalCasesQuery = $db->table('cases');
        if ($dateFilter) {
            $totalCasesQuery->where($dateFilter);
        }
        $totalCases = $totalCasesQuery->countAllResults();
        
        // Solved cases
        $solvedCasesQuery = $db->table('cases')->where('status', 'solved');
        if ($dateFilter) {
            $solvedCasesQuery->where($dateFilter);
        }
        $solvedCases = $solvedCasesQuery->countAllResults();
        
        // Active cases
        $activeCasesQuery = $db->table('cases')->whereIn('status', ['investigating', 'assigned', 'approved']);
        if ($dateFilter) {
            $activeCasesQuery->where($dateFilter);
        }
        $activeCases = $activeCasesQuery->countAllResults();
        
        // In custody
        $inCustody = $db->table('custody_records')
            ->where('custody_status', 'in_custody')
            ->countAllResults();
        
        // Cases by status with date filter
        $casesByStatusQuery = $db->table('cases')
            ->select('status, COUNT(*) as count');
        if ($dateFilter) {
            $casesByStatusQuery->where($dateFilter);
        }
        $casesByStatus = $casesByStatusQuery
            ->groupBy('status')
            ->get()
            ->getResultArray();
        
        // Format cases by status for charts
        $statusData = [
            'draft' => 0,
            'submitted' => 0,
            'investigating' => 0,
            'solved' => 0,
            'closed' => 0
        ];
        foreach ($casesByStatus as $status) {
            if (isset($statusData[$status['status']])) {
                $statusData[$status['status']] = (int)$status['count'];
            }
        }
        
        // Cases by priority with date filter
        $casesByPriorityQuery = $db->table('cases')
            ->select('priority, COUNT(*) as count');
        if ($dateFilter) {
            $casesByPriorityQuery->where($dateFilter);
        }
        $casesByPriority = $casesByPriorityQuery
            ->groupBy('priority')
            ->get()
            ->getResultArray();
        
        // Format cases by priority for charts
        $priorityData = [
            'low' => 0,
            'medium' => 0,
            'high' => 0,
            'critical' => 0
        ];
        foreach ($casesByPriority as $priority) {
            $priorityKey = strtolower($priority['priority']);
            if (isset($priorityData[$priorityKey])) {
                $priorityData[$priorityKey] = (int)$priority['count'];
            }
        }
        
        // Get custom categories from categories table
        $customCategories = $db->table('categories')
            ->select('id, name, description, color, icon, is_active')
            ->where('is_active', 1)
            ->orderBy('display_order', 'ASC')
            ->get()
            ->getResultArray();
        
        // Get case counts by crime_category enum
        $casesByCrimeCategoryQuery = $db->table('cases')
            ->select('crime_category, COUNT(*) as count');
        if ($dateFilter) {
            $casesByCrimeCategoryQuery->where($dateFilter);
        }
        $casesByCrimeCategory = $casesByCrimeCategoryQuery
            ->groupBy('crime_category')
            ->get()
            ->getResultArray();
        
        // Create a map of enum to count
        $crimeCategoryMap = [];
        foreach ($casesByCrimeCategory as $crimeCategory) {
            $crimeCategoryMap[strtolower($crimeCategory['crime_category'])] = (int)$crimeCategory['count'];
        }
        
        // Map custom categories to case counts
        // This maps by matching category names with crime_category enum values
        $casesByCategory = [];
        foreach ($customCategories as $category) {
            // Try to match custom category name to crime_category enum
            $enumKey = strtolower(str_replace([' Crimes', ' Related', ' '], ['', '', ''], $category['name']));
            $count = $crimeCategoryMap[$enumKey] ?? 0;
            
            // If no match, try exact lowercase match
            if ($count === 0) {
                $simpleName = strtolower(explode(' ', $category['name'])[0]);
                $count = $crimeCategoryMap[$simpleName] ?? 0;
            }
            
            $casesByCategory[] = [
                'id' => $category['id'],
                'name' => $category['name'],
                'description' => $category['description'],
                'icon' => $category['icon'],
                'color' => $category['color'],
                'count' => $count
            ];
        }
        
        // Add any enum categories not in custom categories
        foreach ($crimeCategoryMap as $enumCategory => $count) {
            $found = false;
            foreach ($casesByCategory as $cat) {
                $simpleName = strtolower(explode(' ', $cat['name'])[0]);
                if ($simpleName === $enumCategory || str_contains(strtolower($cat['name']), $enumCategory)) {
                    $found = true;
                    break;
                }
            }
            
            if (!$found && $count > 0) {
                $casesByCategory[] = [
                    'id' => $enumCategory,
                    'name' => ucfirst($enumCategory),
                    'description' => null,
                    'icon' => $this->getCrimeIcon($enumCategory),
                    'color' => $this->getCrimeColor($enumCategory),
                    'count' => $count
                ];
            }
        }
        
        // Custody statistics - using actual column names from database with date filter
        $custodyStatsActive = $db->table('custody_records')->where('custody_status', 'in_custody');
        $custodyStatsReleased = $db->table('custody_records')->where('custody_status', 'released');
        $custodyStatsBailed = $db->table('custody_records')->where('bail_status', 'bailed');
        $custodyStatsTransferred = $db->table('custody_records')->where('custody_status', 'transferred');
        
        // Apply date filter to custody records if provided
        if ($dateFilter) {
            // Convert date filter for custody_records (uses custody_start instead of created_at)
            $custodyDateFilter = str_replace('created_at', 'custody_start', $dateFilter);
            $custodyStatsActive->where($custodyDateFilter);
            $custodyStatsReleased->where($custodyDateFilter);
            $custodyStatsBailed->where($custodyDateFilter);
            $custodyStatsTransferred->where($custodyDateFilter);
        }
        
        $custodyStats = [
            'active' => $custodyStatsActive->countAllResults(),
            'released' => $custodyStatsReleased->countAllResults(),
            'bailed' => $custodyStatsBailed->countAllResults(),
            'transferred' => $custodyStatsTransferred->countAllResults()
        ];
        
        // Monthly trends for the last 6 months
        $monthlyTrends = $this->getMonthlyTrends($db);
        
        return $this->respond([
            'status' => 'success',
            'data' => [
                'total_cases' => $totalCases,
                'solved_cases' => $solvedCases,
                'active_cases' => $activeCases,
                'in_custody' => $inCustody,
                'cases_by_status' => $statusData,
                'cases_by_priority' => $priorityData,
                'cases_by_category' => $casesByCategory,
                'custody_stats' => $custodyStats,
                'monthly_trends' => $monthlyTrends
            ]
        ]);
    }
    
    /**
     * Build date filter based on period or custom dates
     */
    private function buildDateFilter($period, $startDate, $endDate)
    {
        if ($startDate && $endDate) {
            return "created_at BETWEEN '$startDate 00:00:00' AND '$endDate 23:59:59'";
        }
        
        $today = date('Y-m-d');
        
        switch ($period) {
            case 'today':
                return "DATE(created_at) = '$today'";
            case 'week':
                $weekStart = date('Y-m-d', strtotime('monday this week'));
                return "created_at >= '$weekStart 00:00:00'";
            case 'month':
                $monthStart = date('Y-m-01');
                return "created_at >= '$monthStart 00:00:00'";
            case 'year':
                $yearStart = date('Y-01-01');
                return "created_at >= '$yearStart 00:00:00'";
            default:
                return null; // No filter, return all data
        }
    }
    
    /**
     * Get monthly trends for the last 6 months
     */
    private function getMonthlyTrends($db)
    {
        $trends = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = date('Y-m-01', strtotime("-$i months"));
            $monthEnd = date('Y-m-t', strtotime("-$i months"));
            $monthName = date('M Y', strtotime("-$i months"));
            
            $newCases = $db->table('cases')
                ->where("created_at >= '$monthStart 00:00:00'")
                ->where("created_at <= '$monthEnd 23:59:59'")
                ->countAllResults();
            
            $solvedCases = $db->table('cases')
                ->where('status', 'solved')
                ->where("created_at >= '$monthStart 00:00:00'")
                ->where("created_at <= '$monthEnd 23:59:59'")
                ->countAllResults();
            
            $trends[] = [
                'month' => $monthName,
                'new_cases' => $newCases,
                'solved_cases' => $solvedCases
            ];
        }
        
        return $trends;
    }
    
    /**
     * Get icon for crime category
     */
    private function getCrimeIcon($category)
    {
        $icons = [
            'violent' => 'fa-fist-raised',
            'property' => 'fa-home',
            'drug' => 'fa-pills',
            'cybercrime' => 'fa-laptop',
            'sexual' => 'fa-venus-mars',
            'juvenile' => 'fa-child',
            'other' => 'fa-folder'
        ];
        
        return $icons[$category] ?? 'fa-folder';
    }
    
    /**
     * Get color for crime category
     */
    private function getCrimeColor($category)
    {
        $colors = [
            'violent' => '#ef4444',
            'property' => '#f59e0b',
            'drug' => '#8b5cf6',
            'cybercrime' => '#3b82f6',
            'sexual' => '#ec4899',
            'juvenile' => '#10b981',
            'other' => '#6b7280'
        ];
        
        return $colors[$category] ?? '#6b7280';
    }
}
