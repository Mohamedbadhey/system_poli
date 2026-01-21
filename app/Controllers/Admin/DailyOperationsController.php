<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class DailyOperationsController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get daily operations dashboard data
     */
    public function index()
    {
        $db = \Config\Database::connect();
        
        // Get date filter parameters
        $date = $this->request->getGet('date') ?? date('Y-m-d');
        $period = $this->request->getGet('period') ?? 'today'; // today, week, month, year
        
        // Get advanced filter parameters
        $centerId = $this->request->getGet('center_id');
        $category = $this->request->getGet('category');
        $priority = $this->request->getGet('priority');
        
        // Build date filters based on period
        $dateFilters = $this->buildDateFilters($period, $date);
        
        try {
            // Build additional filters query builder
            $builder = $db->table('cases')
                ->select('cases.*, police_centers.center_name, users.full_name as created_by_name')
                ->join('police_centers', 'police_centers.id = cases.center_id')
                ->join('users', 'users.id = cases.created_by', 'left')
                ->where($dateFilters['where']);
            
            // Apply advanced filters
            if ($centerId) {
                $builder->where('cases.center_id', $centerId);
            }
            if ($category) {
                $builder->where('cases.crime_category', $category);
            }
            if ($priority) {
                $builder->where('cases.priority', $priority);
            }
            
            // 1. CASES SUBMITTED (New cases created)
            $casesSubmitted = $builder->orderBy('cases.created_at', 'DESC')
                ->get()
                ->getResultArray();
            
            // 2. CASES ASSIGNED (to investigators)
            $assignedBuilder = $db->table('case_assignments')
                ->select('case_assignments.*, cases.case_number, cases.ob_number, cases.crime_type, 
                         cases.crime_category, cases.priority,
                         users.full_name as investigator_name, assigned_by_user.full_name as assigned_by_name,
                         police_centers.center_name')
                ->join('cases', 'cases.id = case_assignments.case_id')
                ->join('users', 'users.id = case_assignments.investigator_id')
                ->join('users as assigned_by_user', 'assigned_by_user.id = case_assignments.assigned_by', 'left')
                ->join('police_centers', 'police_centers.id = cases.center_id')
                ->where(str_replace('cases.created_at', 'case_assignments.assigned_at', $dateFilters['where']));
            
            if ($centerId) {
                $assignedBuilder->where('cases.center_id', $centerId);
            }
            if ($category) {
                $assignedBuilder->where('cases.crime_category', $category);
            }
            if ($priority) {
                $assignedBuilder->where('cases.priority', $priority);
            }
            
            $casesAssigned = $assignedBuilder->orderBy('case_assignments.assigned_at', 'DESC')
                ->get()
                ->getResultArray();
            
            // 3. CASES CLOSED
            $closedBuilder = $db->table('cases')
                ->select('cases.*, police_centers.center_name, users.full_name as closed_by_name')
                ->join('police_centers', 'police_centers.id = cases.center_id')
                ->join('users', 'users.id = cases.closed_by', 'left')
                ->where('cases.status', 'closed')
                ->where(str_replace('cases.created_at', 'cases.closed_at', $dateFilters['where']));
            
            if ($centerId) {
                $closedBuilder->where('cases.center_id', $centerId);
            }
            if ($category) {
                $closedBuilder->where('cases.crime_category', $category);
            }
            if ($priority) {
                $closedBuilder->where('cases.priority', $priority);
            }
            
            $casesClosed = $closedBuilder->orderBy('cases.closed_at', 'DESC')
                ->get()
                ->getResultArray();
            
            // 4. CURRENT CUSTODY (Active custody records)
            $currentCustody = $db->table('custody_records')
                ->select('custody_records.*, persons.first_name, persons.middle_name, persons.last_name,
                         persons.national_id, persons.photo_path, persons.gender, persons.date_of_birth,
                         cases.case_number, cases.ob_number, cases.crime_type,
                         police_centers.center_name, users.full_name as created_by_name')
                ->join('persons', 'persons.id = custody_records.person_id')
                ->join('cases', 'cases.id = custody_records.case_id')
                ->join('police_centers', 'police_centers.id = cases.center_id')
                ->join('users', 'users.id = custody_records.created_by', 'left')
                ->where('custody_records.custody_status', 'in_custody')
                ->orderBy('custody_records.custody_start', 'DESC')
                ->get()
                ->getResultArray();
            
            // Add full name to custody records
            foreach ($currentCustody as &$record) {
                $record['person_full_name'] = trim($record['first_name'] . ' ' . 
                    ($record['middle_name'] ?? '') . ' ' . $record['last_name']);
            }
            
            // 5. NON-CRIMINAL CERTIFICATES ISSUED (Health certificates)
            $certificatesIssued = $db->table('non_criminal_certificates')
                ->select('non_criminal_certificates.*, persons.first_name, persons.middle_name, 
                         persons.last_name, persons.photo_path, persons.gender, persons.date_of_birth,
                         users.full_name as issued_by_name')
                ->join('persons', 'persons.id = non_criminal_certificates.person_id', 'left')
                ->join('users', 'users.id = non_criminal_certificates.issued_by', 'left')
                ->where(str_replace('cases.created_at', 'non_criminal_certificates.created_at', $dateFilters['where']))
                ->orderBy('non_criminal_certificates.created_at', 'DESC')
                ->get()
                ->getResultArray();
            
            // Add full name to certificates
            foreach ($certificatesIssued as &$cert) {
                if ($cert['first_name']) {
                    $cert['person_full_name'] = trim($cert['first_name'] . ' ' . 
                        ($cert['middle_name'] ?? '') . ' ' . $cert['last_name']);
                } else {
                    $cert['person_full_name'] = $cert['person_name'];
                }
            }
            
            // 6. MEDICAL EXAMINATION FORMS ISSUED
            $medicalFormsIssued = [];
            // Check if medical_examination_forms table exists
            if (in_array('medical_examination_forms', $db->listTables())) {
                $medicalFormsIssued = $db->table('medical_examination_forms')
                    ->select('medical_examination_forms.*, persons.first_name, persons.middle_name, 
                             persons.last_name, persons.photo_path, cases.case_number, cases.ob_number,
                             users.full_name as created_by_name')
                    ->join('persons', 'persons.id = medical_examination_forms.person_id', 'left')
                    ->join('cases', 'cases.id = medical_examination_forms.case_id', 'left')
                    ->join('users', 'users.id = medical_examination_forms.created_by', 'left')
                    ->where(str_replace('cases.created_at', 'medical_examination_forms.created_at', $dateFilters['where']))
                    ->orderBy('medical_examination_forms.created_at', 'DESC')
                    ->get()
                    ->getResultArray();
                
                // Add full name to medical forms
                foreach ($medicalFormsIssued as &$form) {
                    if ($form['first_name']) {
                        $form['person_full_name'] = trim($form['first_name'] . ' ' . 
                            ($form['middle_name'] ?? '') . ' ' . $form['last_name']);
                    } else {
                        $form['person_full_name'] = $form['patient_name'];
                    }
                }
            }
            
            // 7. BASIC REPORTS (from saved_full_reports table with "Basic Report" in title)
            $basicReportsIssued = [];
            if (in_array('saved_full_reports', $db->listTables())) {
                $whereClause = str_replace('cases.created_at', 'saved_full_reports.created_at', $dateFilters['where']);
                log_message('debug', '=== BASIC REPORTS DEBUG ===');
                log_message('debug', 'Query WHERE: ' . $whereClause);
                log_message('debug', 'Date Filters: ' . json_encode($dateFilters));
                
                // First, get ALL records to see what exists
                $allReports = $db->table('saved_full_reports')
                    ->select('id, case_id, report_title, created_at')
                    ->get()
                    ->getResultArray();
                log_message('debug', 'Total records in saved_full_reports: ' . count($allReports));
                log_message('debug', 'All reports: ' . json_encode($allReports));
                
                // Now get with our filters
                $basicReportsIssued = $db->table('saved_full_reports')
                    ->select('saved_full_reports.*, cases.case_number, cases.ob_number, 
                             police_centers.center_name, users.full_name as generated_by_name')
                    ->join('cases', 'cases.id = saved_full_reports.case_id', 'left')
                    ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
                    ->join('users', 'users.id = saved_full_reports.generated_by', 'left')
                    ->where($whereClause)
                    ->like('saved_full_reports.report_title', 'Basic', 'both')
                    ->orderBy('saved_full_reports.created_at', 'DESC')
                    ->get()
                    ->getResultArray();
                
                log_message('debug', 'Basic Reports Count (after filter): ' . count($basicReportsIssued));
                log_message('debug', 'Basic Reports Data: ' . json_encode($basicReportsIssued));
                log_message('debug', 'Last SQL Query: ' . $db->getLastQuery());
            } else {
                log_message('debug', 'saved_full_reports table does NOT exist');
            }
            
            // 8. FULL REPORTS (from saved_full_reports table with "Full Report" in title)
            $fullReportsIssued = [];
            if (in_array('saved_full_reports', $db->listTables())) {
                $whereClause = str_replace('cases.created_at', 'saved_full_reports.created_at', $dateFilters['where']);
                log_message('debug', '=== FULL REPORTS DEBUG ===');
                log_message('debug', 'Query WHERE: ' . $whereClause);
                
                $fullReportsIssued = $db->table('saved_full_reports')
                    ->select('saved_full_reports.*, cases.case_number, cases.ob_number,
                             police_centers.center_name, users.full_name as generated_by_name')
                    ->join('cases', 'cases.id = saved_full_reports.case_id', 'left')
                    ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
                    ->join('users', 'users.id = saved_full_reports.generated_by', 'left')
                    ->where($whereClause)
                    ->like('saved_full_reports.report_title', 'Full', 'both')
                    ->orderBy('saved_full_reports.created_at', 'DESC')
                    ->get()
                    ->getResultArray();
                    
                log_message('debug', 'Full Reports Count (after filter): ' . count($fullReportsIssued));
                log_message('debug', 'Full Reports Data: ' . json_encode($fullReportsIssued));
                log_message('debug', 'Last SQL Query: ' . $db->getLastQuery());
            }
            
            // 9. COURT ACKNOWLEDGMENTS (court_acknowledgments)
            $courtAcknowledgmentsIssued = [];
            if (in_array('court_acknowledgments', $db->listTables())) {
                $whereClause = str_replace('cases.created_at', 'court_acknowledgments.uploaded_at', $dateFilters['where']);
                log_message('debug', 'Court Acknowledgments Query WHERE: ' . $whereClause);
                
                $courtAcknowledgmentsIssued = $db->table('court_acknowledgments')
                    ->select('court_acknowledgments.*, cases.case_number, cases.ob_number,
                             police_centers.center_name, users.full_name as uploaded_by_name')
                    ->join('cases', 'cases.id = court_acknowledgments.case_id', 'left')
                    ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
                    ->join('users', 'users.id = court_acknowledgments.uploaded_by', 'left')
                    ->where($whereClause)
                    ->orderBy('court_acknowledgments.uploaded_at', 'DESC')
                    ->get()
                    ->getResultArray();
                    
                log_message('debug', 'Court Acknowledgments Count: ' . count($courtAcknowledgmentsIssued));
            }
            
            // 10. SUMMARY STATISTICS
            // Calculate high priority cases count
            $highPriorityCount = 0;
            foreach ($casesSubmitted as $case) {
                if (in_array($case['priority'], ['high', 'critical'])) {
                    $highPriorityCount++;
                }
            }
            
            $stats = [
                'cases_submitted_count' => count($casesSubmitted),
                'cases_assigned_count' => count($casesAssigned),
                'cases_closed_count' => count($casesClosed),
                'current_custody_count' => count($currentCustody),
                'certificates_issued_count' => count($certificatesIssued),
                'medical_forms_issued_count' => count($medicalFormsIssued),
                'basic_reports_count' => count($basicReportsIssued),
                'full_reports_count' => count($fullReportsIssued),
                'court_acknowledgments_count' => count($courtAcknowledgmentsIssued),
                'high_priority_count' => $highPriorityCount,
            ];
            
            // 11. CASES BY STATUS (for the period)
            $casesByStatus = $db->table('cases')
                ->select('status, COUNT(*) as count')
                ->where($dateFilters['where'])
                ->groupBy('status')
                ->get()
                ->getResultArray();
            
            // 12. CASES BY PRIORITY (for the period)
            $casesByPriority = $db->table('cases')
                ->select('priority, COUNT(*) as count')
                ->where($dateFilters['where'])
                ->groupBy('priority')
                ->get()
                ->getResultArray();
            
            // 13. CASES BY CATEGORY (for the period)
            $casesByCategory = $db->table('cases')
                ->select('crime_category, COUNT(*) as count')
                ->where($dateFilters['where'])
                ->groupBy('crime_category')
                ->get()
                ->getResultArray();
            
            // 14. CUSTODY STATUS BREAKDOWN
            $custodyByStatus = $db->table('custody_records')
                ->select('custody_status, COUNT(*) as count')
                ->groupBy('custody_status')
                ->get()
                ->getResultArray();
            
            return $this->respond([
                'status' => 'success',
                'data' => [
                    'date' => $date,
                    'period' => $period,
                    'stats' => $stats,
                    'cases_submitted' => $casesSubmitted,
                    'cases_assigned' => $casesAssigned,
                    'cases_closed' => $casesClosed,
                    'current_custody' => $currentCustody,
                    'certificates_issued' => $certificatesIssued,
                    'medical_forms_issued' => $medicalFormsIssued,
                    'basic_reports_issued' => $basicReportsIssued,
                    'full_reports_issued' => $fullReportsIssued,
                    'court_acknowledgments_issued' => $courtAcknowledgmentsIssued,
                    'cases_by_status' => $casesByStatus,
                    'cases_by_priority' => $casesByPriority,
                    'cases_by_category' => $casesByCategory,
                    'custody_by_status' => $custodyByStatus,
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Daily operations error: ' . $e->getMessage());
            return $this->fail([
                'message' => 'Failed to load daily operations data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Build date filters based on period
     */
    private function buildDateFilters($period, $date)
    {
        $today = $date ?? date('Y-m-d');
        
        switch ($period) {
            case 'today':
                return [
                    'where' => "DATE(cases.created_at) = '$today'",
                    'label' => 'Today'
                ];
                
            case 'week':
                $weekStart = date('Y-m-d', strtotime('monday this week', strtotime($today)));
                $weekEnd = date('Y-m-d', strtotime('sunday this week', strtotime($today)));
                return [
                    'where' => "DATE(cases.created_at) BETWEEN '$weekStart' AND '$weekEnd'",
                    'label' => 'This Week'
                ];
                
            case 'month':
                $monthStart = date('Y-m-01', strtotime($today));
                $monthEnd = date('Y-m-t', strtotime($today));
                return [
                    'where' => "DATE(cases.created_at) BETWEEN '$monthStart' AND '$monthEnd'",
                    'label' => 'This Month'
                ];
                
            case 'year':
                $yearStart = date('Y-01-01', strtotime($today));
                $yearEnd = date('Y-12-31', strtotime($today));
                return [
                    'where' => "DATE(cases.created_at) BETWEEN '$yearStart' AND '$yearEnd'",
                    'label' => 'This Year'
                ];
                
            default:
                return [
                    'where' => "DATE(cases.created_at) = '$today'",
                    'label' => 'Today'
                ];
        }
    }
    
    /**
     * Export daily operations report as PDF
     */
    public function exportPDF()
    {
        try {
            // Get filter parameters
            $period = $this->request->getGet('period') ?? 'today';
            $date = $this->request->getGet('date') ?? date('Y-m-d');
            $language = $this->request->getGet('language') ?? 'en';
            
            // Get the data (same as index method)
            $db = \Config\Database::connect();
            $dateFilters = $this->buildDateFilters($period, $date);
            
            // Fetch all data
            $data = $this->fetchOperationsData($db, $dateFilters);
            
            // Generate PDF
            $pdfGenerator = new \App\Libraries\DailyOperationsPDFGenerator();
            $result = $pdfGenerator->generateDailyOperationsReport($data, $period, $date, $language);
            
            if ($result['success']) {
                return $this->respond([
                    'status' => 'success',
                    'message' => 'PDF generated successfully',
                    'data' => [
                        'filename' => $result['filename'],
                        'url' => $result['url'],
                        'full_url' => $result['full_url']
                    ]
                ]);
            } else {
                return $this->fail([
                    'message' => 'Failed to generate PDF',
                    'error' => $result['error']
                ], 500);
            }
            
        } catch (\Exception $e) {
            log_message('error', 'PDF Export Error: ' . $e->getMessage());
            return $this->fail([
                'message' => 'Failed to export PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export daily operations report as Excel
     */
    public function exportExcel()
    {
        try {
            // Get filter parameters
            $period = $this->request->getGet('period') ?? 'today';
            $date = $this->request->getGet('date') ?? date('Y-m-d');
            $language = $this->request->getGet('language') ?? 'en';
            
            // Get the data (same as index method)
            $db = \Config\Database::connect();
            $dateFilters = $this->buildDateFilters($period, $date);
            
            // Fetch all data
            $data = $this->fetchOperationsData($db, $dateFilters);
            
            // Generate Excel
            $excelGenerator = new \App\Libraries\DailyOperationsExcelGenerator();
            $result = $excelGenerator->generateDailyOperationsReport($data, $period, $date, $language);
            
            if ($result['success']) {
                return $this->respond([
                    'status' => 'success',
                    'message' => 'Excel generated successfully',
                    'data' => [
                        'filename' => $result['filename'],
                        'url' => $result['url'],
                        'full_url' => $result['full_url']
                    ]
                ]);
            } else {
                return $this->fail([
                    'message' => 'Failed to generate Excel',
                    'error' => $result['error']
                ], 500);
            }
            
        } catch (\Exception $e) {
            log_message('error', 'Excel Export Error: ' . $e->getMessage());
            return $this->fail([
                'message' => 'Failed to export Excel',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Fetch operations data (extracted for reuse)
     */
    private function fetchOperationsData($db, $dateFilters)
    {
        // 1. CASES SUBMITTED
        $casesSubmitted = $db->table('cases')
            ->select('cases.*, police_centers.center_name, users.full_name as created_by_name')
            ->join('police_centers', 'police_centers.id = cases.center_id')
            ->join('users', 'users.id = cases.created_by', 'left')
            ->where($dateFilters['where'])
            ->orderBy('cases.created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        // 2. CASES ASSIGNED
        $casesAssigned = $db->table('case_assignments')
            ->select('case_assignments.*, cases.case_number, cases.ob_number, cases.crime_type, 
                     users.full_name as investigator_name, assigned_by_user.full_name as assigned_by_name,
                     police_centers.center_name')
            ->join('cases', 'cases.id = case_assignments.case_id')
            ->join('users', 'users.id = case_assignments.investigator_id')
            ->join('users as assigned_by_user', 'assigned_by_user.id = case_assignments.assigned_by', 'left')
            ->join('police_centers', 'police_centers.id = cases.center_id')
            ->where(str_replace('cases.created_at', 'case_assignments.assigned_at', $dateFilters['where']))
            ->orderBy('case_assignments.assigned_at', 'DESC')
            ->get()
            ->getResultArray();
        
        // 3. CASES CLOSED
        $casesClosed = $db->table('cases')
            ->select('cases.*, police_centers.center_name, users.full_name as closed_by_name')
            ->join('police_centers', 'police_centers.id = cases.center_id')
            ->join('users', 'users.id = cases.closed_by', 'left')
            ->where('cases.status', 'closed')
            ->where(str_replace('cases.created_at', 'cases.closed_at', $dateFilters['where']))
            ->orderBy('cases.closed_at', 'DESC')
            ->get()
            ->getResultArray();
        
        // 4. CURRENT CUSTODY
        $currentCustody = $db->table('custody_records')
            ->select('custody_records.*, persons.first_name, persons.middle_name, persons.last_name,
                     persons.national_id, persons.photo_path, persons.gender, persons.date_of_birth,
                     cases.case_number, cases.ob_number, cases.crime_type,
                     police_centers.center_name, users.full_name as created_by_name')
            ->join('persons', 'persons.id = custody_records.person_id')
            ->join('cases', 'cases.id = custody_records.case_id')
            ->join('police_centers', 'police_centers.id = cases.center_id')
            ->join('users', 'users.id = custody_records.created_by', 'left')
            ->where('custody_records.custody_status', 'in_custody')
            ->orderBy('custody_records.custody_start', 'DESC')
            ->get()
            ->getResultArray();
        
        foreach ($currentCustody as &$record) {
            $record['person_full_name'] = trim($record['first_name'] . ' ' . 
                ($record['middle_name'] ?? '') . ' ' . $record['last_name']);
        }
        
        // 5. CERTIFICATES
        $certificatesIssued = $db->table('non_criminal_certificates')
            ->select('non_criminal_certificates.*, persons.first_name, persons.middle_name, 
                     persons.last_name, persons.photo_path, persons.gender, persons.date_of_birth,
                     users.full_name as issued_by_name')
            ->join('persons', 'persons.id = non_criminal_certificates.person_id', 'left')
            ->join('users', 'users.id = non_criminal_certificates.issued_by', 'left')
            ->where(str_replace('cases.created_at', 'non_criminal_certificates.created_at', $dateFilters['where']))
            ->orderBy('non_criminal_certificates.created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        foreach ($certificatesIssued as &$cert) {
            if ($cert['first_name']) {
                $cert['person_full_name'] = trim($cert['first_name'] . ' ' . 
                    ($cert['middle_name'] ?? '') . ' ' . $cert['last_name']);
            } else {
                $cert['person_full_name'] = $cert['person_name'];
            }
        }
        
        // 6. MEDICAL FORMS
        $medicalFormsIssued = [];
        if (in_array('medical_examination_forms', $db->listTables())) {
            $medicalFormsIssued = $db->table('medical_examination_forms')
                ->select('medical_examination_forms.*, persons.first_name, persons.middle_name, 
                         persons.last_name, persons.photo_path, cases.case_number, cases.ob_number,
                         users.full_name as created_by_name')
                ->join('persons', 'persons.id = medical_examination_forms.person_id', 'left')
                ->join('cases', 'cases.id = medical_examination_forms.case_id', 'left')
                ->join('users', 'users.id = medical_examination_forms.created_by', 'left')
                ->where(str_replace('cases.created_at', 'medical_examination_forms.created_at', $dateFilters['where']))
                ->orderBy('medical_examination_forms.created_at', 'DESC')
                ->get()
                ->getResultArray();
            
            foreach ($medicalFormsIssued as &$form) {
                if ($form['first_name']) {
                    $form['person_full_name'] = trim($form['first_name'] . ' ' . 
                        ($form['middle_name'] ?? '') . ' ' . $form['last_name']);
                } else {
                    $form['person_full_name'] = $form['patient_name'];
                }
            }
        }
        
        // 7. BASIC REPORTS (from saved_full_reports with "Basic" in title)
        $basicReportsIssued = [];
        if (in_array('saved_full_reports', $db->listTables())) {
            $basicReportsIssued = $db->table('saved_full_reports')
                ->select('saved_full_reports.*, cases.case_number, cases.ob_number, 
                         police_centers.center_name, users.full_name as generated_by_name')
                ->join('cases', 'cases.id = saved_full_reports.case_id', 'left')
                ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
                ->join('users', 'users.id = saved_full_reports.generated_by', 'left')
                ->where(str_replace('cases.created_at', 'saved_full_reports.created_at', $dateFilters['where']))
                ->like('saved_full_reports.report_title', 'Basic', 'both')
                ->orderBy('saved_full_reports.created_at', 'DESC')
                ->get()
                ->getResultArray();
        }
        
        // 8. FULL REPORTS (from saved_full_reports with "Full" in title)
        $fullReportsIssued = [];
        if (in_array('saved_full_reports', $db->listTables())) {
            $fullReportsIssued = $db->table('saved_full_reports')
                ->select('saved_full_reports.*, cases.case_number, cases.ob_number,
                         police_centers.center_name, users.full_name as generated_by_name')
                ->join('cases', 'cases.id = saved_full_reports.case_id', 'left')
                ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
                ->join('users', 'users.id = saved_full_reports.generated_by', 'left')
                ->where(str_replace('cases.created_at', 'saved_full_reports.created_at', $dateFilters['where']))
                ->like('saved_full_reports.report_title', 'Full', 'both')
                ->orderBy('saved_full_reports.created_at', 'DESC')
                ->get()
                ->getResultArray();
        }
        
        // 9. COURT ACKNOWLEDGMENTS
        $courtAcknowledgmentsIssued = [];
        if (in_array('court_acknowledgments', $db->listTables())) {
            $courtAcknowledgmentsIssued = $db->table('court_acknowledgments')
                ->select('court_acknowledgments.*, cases.case_number, cases.ob_number,
                         police_centers.center_name, users.full_name as uploaded_by_name')
                ->join('cases', 'cases.id = court_acknowledgments.case_id', 'left')
                ->join('police_centers', 'police_centers.id = cases.center_id', 'left')
                ->join('users', 'users.id = court_acknowledgments.uploaded_by', 'left')
                ->where(str_replace('cases.created_at', 'court_acknowledgments.uploaded_at', $dateFilters['where']))
                ->orderBy('court_acknowledgments.uploaded_at', 'DESC')
                ->get()
                ->getResultArray();
        }
        
        // Calculate high priority cases count
        $highPriorityCount = 0;
        foreach ($casesSubmitted as $case) {
            if (in_array($case['priority'], ['high', 'critical'])) {
                $highPriorityCount++;
            }
        }
        
        // Statistics
        $stats = [
            'cases_submitted_count' => count($casesSubmitted),
            'cases_assigned_count' => count($casesAssigned),
            'cases_closed_count' => count($casesClosed),
            'current_custody_count' => count($currentCustody),
            'certificates_issued_count' => count($certificatesIssued),
            'medical_forms_issued_count' => count($medicalFormsIssued),
            'basic_reports_count' => count($basicReportsIssued),
            'full_reports_count' => count($fullReportsIssued),
            'court_acknowledgments_count' => count($courtAcknowledgmentsIssued),
            'high_priority_count' => $highPriorityCount,
        ];
        
        return [
            'stats' => $stats,
            'cases_submitted' => $casesSubmitted,
            'cases_assigned' => $casesAssigned,
            'cases_closed' => $casesClosed,
            'current_custody' => $currentCustody,
            'certificates_issued' => $certificatesIssued,
            'medical_forms_issued' => $medicalFormsIssued,
            'basic_reports_issued' => $basicReportsIssued,
            'full_reports_issued' => $fullReportsIssued,
            'court_acknowledgments_issued' => $courtAcknowledgmentsIssued,
        ];
    }
}
