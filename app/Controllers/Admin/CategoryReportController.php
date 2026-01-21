<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class CategoryReportController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get detailed category report
     * GET /admin/categories/:id/report
     */
    public function show($categoryId = null)
    {
        if (!$categoryId) {
            return $this->failNotFound('Category ID required');
        }
        
        $db = \Config\Database::connect();
        
        // Get category details
        $categoryModel = model('App\Models\CategoryModel');
        $category = $categoryModel->find($categoryId);
        
        if (!$category) {
            return $this->failNotFound('Category not found');
        }
        
        // Get crime category name from category
        $crimeCategory = $this->getCrimeCategoryFromId($categoryId);
        
        // Get statistics
        $stats = $this->getCategoryStats($crimeCategory, $db);
        
        // Get cases by status
        $casesByStatus = $this->getCasesByStatus($crimeCategory, $db);
        
        // Get cases by priority
        $casesByPriority = $this->getCasesByPriority($crimeCategory, $db);
        
        // Get cases by center
        $casesByCenter = $this->getCasesByCenter($crimeCategory, $db);
        
        // Get monthly trends
        $monthlyTrends = $this->getMonthlyTrends($crimeCategory, $db);
        
        // Get recent cases
        $recentCases = $this->getRecentCases($crimeCategory, $db);
        
        // Get resolution metrics
        $resolutionMetrics = $this->getResolutionMetrics($crimeCategory, $db);
        
        return $this->respond([
            'status' => 'success',
            'data' => [
                'category' => $category,
                'crime_category' => $crimeCategory,
                'stats' => $stats,
                'cases_by_status' => $casesByStatus,
                'cases_by_priority' => $casesByPriority,
                'cases_by_center' => $casesByCenter,
                'monthly_trends' => $monthlyTrends,
                'recent_cases' => $recentCases,
                'resolution_metrics' => $resolutionMetrics
            ]
        ]);
    }
    
    /**
     * Get all categories summary report
     * GET /admin/categories/summary
     */
    public function summary()
    {
        $db = \Config\Database::connect();
        $categoryModel = model('App\Models\CategoryModel');
        
        $categories = $categoryModel->where('is_active', 1)->findAll();
        $summary = [];
        
        foreach ($categories as $category) {
            $crimeCategory = $this->getCrimeCategoryFromName($category['name']);
            
            $caseCount = $db->table('cases')
                ->where('crime_category', $crimeCategory)
                ->countAllResults();
            
            $activeCases = $db->table('cases')
                ->where('crime_category', $crimeCategory)
                ->whereIn('status', ['draft', 'submitted', 'approved', 'assigned', 'investigating'])
                ->countAllResults();
            
            $closedCases = $db->table('cases')
                ->where('crime_category', $crimeCategory)
                ->whereIn('status', ['closed', 'archived'])
                ->countAllResults();
            
            $summary[] = [
                'category' => $category,
                'total_cases' => $caseCount,
                'active_cases' => $activeCases,
                'closed_cases' => $closedCases,
                'closure_rate' => $caseCount > 0 ? round(($closedCases / $caseCount) * 100, 2) : 0
            ];
        }
        
        // Sort by total cases
        usort($summary, function($a, $b) {
            return $b['total_cases'] - $a['total_cases'];
        });
        
        return $this->respond([
            'status' => 'success',
            'data' => $summary
        ]);
    }
    
    /**
     * Get crime category from category ID
     */
    private function getCrimeCategoryFromId($categoryId)
    {
        $mapping = [
            1 => 'violent',
            2 => 'property',
            3 => 'drug',
            4 => 'cybercrime',
            5 => 'sexual',
            6 => 'juvenile',
            7 => 'other'
        ];
        
        return $mapping[$categoryId] ?? 'other';
    }
    
    /**
     * Get crime category from category name
     */
    private function getCrimeCategoryFromName($name)
    {
        $nameLower = strtolower($name);
        
        if (strpos($nameLower, 'violent') !== false) return 'violent';
        if (strpos($nameLower, 'property') !== false) return 'property';
        if (strpos($nameLower, 'drug') !== false) return 'drug';
        if (strpos($nameLower, 'cyber') !== false) return 'cybercrime';
        if (strpos($nameLower, 'sexual') !== false) return 'sexual';
        if (strpos($nameLower, 'juvenile') !== false) return 'juvenile';
        
        return 'other';
    }
    
    /**
     * Get category statistics
     */
    private function getCategoryStats($crimeCategory, $db)
    {
        $stats = [
            'total_cases' => 0,
            'active_cases' => 0,
            'closed_cases' => 0,
            'pending_approval' => 0,
            'sent_to_court' => 0,
            'in_custody' => 0,
            'total_evidence' => 0,
            'total_suspects' => 0,
            'total_victims' => 0,
            'total_witnesses' => 0,
            'cases_this_month' => 0,
            'cases_last_month' => 0
        ];
        
        // Total cases
        $stats['total_cases'] = $db->table('cases')
            ->where('crime_category', $crimeCategory)
            ->countAllResults();
        
        // Active cases
        $stats['active_cases'] = $db->table('cases')
            ->where('crime_category', $crimeCategory)
            ->whereIn('status', ['draft', 'submitted', 'approved', 'assigned', 'investigating'])
            ->countAllResults();
        
        // Closed cases
        $stats['closed_cases'] = $db->table('cases')
            ->where('crime_category', $crimeCategory)
            ->whereIn('status', ['closed', 'archived'])
            ->countAllResults();
        
        // Pending approval
        $stats['pending_approval'] = $db->table('cases')
            ->where('crime_category', $crimeCategory)
            ->where('status', 'submitted')
            ->countAllResults();
        
        // Sent to court
        $stats['sent_to_court'] = $db->table('cases')
            ->where('crime_category', $crimeCategory)
            ->where('court_status !=', 'not_sent')
            ->countAllResults();
        
        // Evidence
        $stats['total_evidence'] = $db->table('evidence')
            ->join('cases', 'cases.id = evidence.case_id')
            ->where('cases.crime_category', $crimeCategory)
            ->countAllResults();
        
        // Parties
        $stats['total_suspects'] = $db->table('case_parties')
            ->join('cases', 'cases.id = case_parties.case_id')
            ->where('cases.crime_category', $crimeCategory)
            ->where('case_parties.party_role', 'suspect')
            ->countAllResults();
        
        $stats['total_victims'] = $db->table('case_parties')
            ->join('cases', 'cases.id = case_parties.case_id')
            ->where('cases.crime_category', $crimeCategory)
            ->where('case_parties.party_role', 'victim')
            ->countAllResults();
        
        $stats['total_witnesses'] = $db->table('case_parties')
            ->join('cases', 'cases.id = case_parties.case_id')
            ->where('cases.crime_category', $crimeCategory)
            ->where('case_parties.party_role', 'witness')
            ->countAllResults();
        
        // Custody
        $stats['in_custody'] = $db->table('custody_records')
            ->join('cases', 'cases.id = custody_records.case_id')
            ->where('cases.crime_category', $crimeCategory)
            ->where('custody_records.custody_status', 'in_custody')
            ->countAllResults();
        
        // This month vs last month
        $thisMonthStart = date('Y-m-01 00:00:00');
        $lastMonthStart = date('Y-m-01 00:00:00', strtotime('-1 month'));
        $lastMonthEnd = date('Y-m-t 23:59:59', strtotime('-1 month'));
        
        $stats['cases_this_month'] = $db->table('cases')
            ->where('crime_category', $crimeCategory)
            ->where('created_at >=', $thisMonthStart)
            ->countAllResults();
        
        $stats['cases_last_month'] = $db->table('cases')
            ->where('crime_category', $crimeCategory)
            ->where('created_at >=', $lastMonthStart)
            ->where('created_at <=', $lastMonthEnd)
            ->countAllResults();
        
        return $stats;
    }
    
    /**
     * Get cases by status
     */
    private function getCasesByStatus($crimeCategory, $db)
    {
        $statuses = ['draft', 'submitted', 'approved', 'assigned', 'investigating', 
                     'evidence_collected', 'suspect_identified', 'under_review', 'closed', 'archived'];
        $distribution = [];
        
        foreach ($statuses as $status) {
            $count = $db->table('cases')
                ->where('crime_category', $crimeCategory)
                ->where('status', $status)
                ->countAllResults();
            $distribution[$status] = $count;
        }
        
        return $distribution;
    }
    
    /**
     * Get cases by priority
     */
    private function getCasesByPriority($crimeCategory, $db)
    {
        $priorities = ['low', 'medium', 'high', 'critical'];
        $distribution = [];
        
        foreach ($priorities as $priority) {
            $count = $db->table('cases')
                ->where('crime_category', $crimeCategory)
                ->where('priority', $priority)
                ->countAllResults();
            $distribution[$priority] = $count;
        }
        
        return $distribution;
    }
    
    /**
     * Get cases by center
     */
    private function getCasesByCenter($crimeCategory, $db)
    {
        return $db->table('cases')
            ->select('police_centers.center_name, police_centers.center_code, COUNT(cases.id) as case_count')
            ->join('police_centers', 'police_centers.id = cases.center_id')
            ->where('cases.crime_category', $crimeCategory)
            ->groupBy('cases.center_id')
            ->orderBy('case_count', 'DESC')
            ->get()
            ->getResultArray();
    }
    
    /**
     * Get monthly trends (last 12 months)
     */
    private function getMonthlyTrends($crimeCategory, $db)
    {
        $trends = [];
        
        for ($i = 11; $i >= 0; $i--) {
            $date = date('Y-m', strtotime("-$i months"));
            $startDate = $date . '-01 00:00:00';
            $endDate = date('Y-m-t 23:59:59', strtotime($startDate));
            
            $casesCreated = $db->table('cases')
                ->where('crime_category', $crimeCategory)
                ->where('created_at >=', $startDate)
                ->where('created_at <=', $endDate)
                ->countAllResults();
            
            $casesClosed = $db->table('cases')
                ->where('crime_category', $crimeCategory)
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
     * Get recent cases
     */
    private function getRecentCases($crimeCategory, $db)
    {
        return $db->table('cases')
            ->select('cases.*, users.full_name as created_by_name, police_centers.center_name')
            ->join('users', 'users.id = cases.created_by')
            ->join('police_centers', 'police_centers.id = cases.center_id')
            ->where('cases.crime_category', $crimeCategory)
            ->orderBy('cases.created_at', 'DESC')
            ->limit(20)
            ->get()
            ->getResultArray();
    }
    
    /**
     * Get resolution metrics
     */
    private function getResolutionMetrics($crimeCategory, $db)
    {
        $metrics = [
            'avg_resolution_days' => 0,
            'closure_rate' => 0,
            'court_submission_rate' => 0,
            'evidence_collection_rate' => 0
        ];
        
        $totalCases = $db->table('cases')
            ->where('crime_category', $crimeCategory)
            ->countAllResults();
        
        if ($totalCases > 0) {
            // Closure rate
            $closedCases = $db->table('cases')
                ->where('crime_category', $crimeCategory)
                ->whereIn('status', ['closed', 'archived'])
                ->countAllResults();
            $metrics['closure_rate'] = round(($closedCases / $totalCases) * 100, 2);
            
            // Court submission rate
            $courtCases = $db->table('cases')
                ->where('crime_category', $crimeCategory)
                ->where('court_status !=', 'not_sent')
                ->countAllResults();
            $metrics['court_submission_rate'] = round(($courtCases / $totalCases) * 100, 2);
            
            // Evidence collection rate
            $casesWithEvidence = $db->table('cases')
                ->select('DISTINCT cases.id')
                ->join('evidence', 'evidence.case_id = cases.id')
                ->where('cases.crime_category', $crimeCategory)
                ->countAllResults();
            $metrics['evidence_collection_rate'] = round(($casesWithEvidence / $totalCases) * 100, 2);
            
            // Average resolution time
            $closedCasesData = $db->table('cases')
                ->select('created_at, closed_at')
                ->where('crime_category', $crimeCategory)
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
                $metrics['avg_resolution_days'] = round($totalDays / count($closedCasesData), 1);
            }
        }
        
        return $metrics;
    }
}
