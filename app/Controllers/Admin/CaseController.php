<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class CaseController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get case details (admin can access any case from any center)
     * GET /admin/cases/:id
     */
    public function show($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID required');
        }
        
        $db = \Config\Database::connect();
        
        // Get case with all related data
        $case = $db->table('cases')
            ->select('cases.*, police_centers.center_name, users.full_name as created_by_name')
            ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
            ->join('users', 'users.id = cases.created_by', 'left')
            ->where('cases.id', $caseId)
            ->get()
            ->getRow();
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        // Convert to array
        $caseData = (array) $case;
        
        return $this->respond([
            'status' => 'success',
            'data' => $caseData
        ]);
    }
    
    /**
     * Get all cases (admin can see all cases from all centers)
     * GET /admin/cases
     * Query params: crime_category, status, priority, center_id, period, start, end
     */
    public function index()
    {
        $db = \Config\Database::connect();
        
        // Build query
        $builder = $db->table('cases')
            ->select('cases.*, police_centers.center_name, users.full_name as created_by_name')
            ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
            ->join('users', 'users.id = cases.created_by', 'left');
        
        // Apply filters if provided
        if ($crimeCategory = $this->request->getGet('crime_category')) {
            $builder->where('cases.crime_category', $crimeCategory);
        }
        
        if ($status = $this->request->getGet('status')) {
            $builder->where('cases.status', $status);
        }
        
        if ($priority = $this->request->getGet('priority')) {
            $builder->where('cases.priority', $priority);
        }
        
        if ($centerId = $this->request->getGet('center_id')) {
            $builder->where('cases.center_id', $centerId);
        }
        
        // Apply date filters
        $period = $this->request->getGet('period');
        $startDate = $this->request->getGet('start');
        $endDate = $this->request->getGet('end');
        
        if ($startDate && $endDate) {
            $builder->where("cases.created_at >= '$startDate 00:00:00'");
            $builder->where("cases.created_at <= '$endDate 23:59:59'");
        } elseif ($period) {
            $today = date('Y-m-d');
            switch ($period) {
                case 'today':
                    $builder->where("DATE(cases.created_at) = '$today'");
                    break;
                case 'week':
                    $weekStart = date('Y-m-d', strtotime('monday this week'));
                    $builder->where("cases.created_at >= '$weekStart 00:00:00'");
                    break;
                case 'month':
                    $monthStart = date('Y-m-01');
                    $builder->where("cases.created_at >= '$monthStart 00:00:00'");
                    break;
                case 'year':
                    $yearStart = date('Y-01-01');
                    $builder->where("cases.created_at >= '$yearStart 00:00:00'");
                    break;
            }
        }
        
        // Get cases
        $cases = $builder->orderBy('cases.created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $cases
        ]);
    }
}
