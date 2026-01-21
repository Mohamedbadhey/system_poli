<?php

namespace App\Models;

use CodeIgniter\Model;

class ReportModel extends Model
{
    protected $table = 'investigation_reports';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $protectFields = true;
    protected $allowedFields = [
        'case_id', 'report_type', 'report_subtype', 'report_title', 'report_content',
        'report_file_path', 'is_signed', 'signature_hash', 'signed_by', 'signed_at',
        'period_covered_from', 'period_covered_to', 'court_reference_number',
        'charges_preferred', 'case_strength', 'recommended_action', 'approval_status',
        'approved_by', 'approved_at', 'court_order_reference', 'metadata',
        'created_by', 'created_at', 'updated_at'
    ];

    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $validationRules = [
        'case_id' => 'required|integer',
        'report_type' => 'required|in_list[preliminary,interim,final,court_submission,evidence_analysis,witness_compilation,suspect_investigation,supplementary,case_closure,prosecution_summary,exhibit_list,court_status]',
        'report_title' => 'required|max_length[255]',
        'report_content' => 'required|min_length[50]',
        'created_by' => 'required|integer'
    ];

    protected $validationMessages = [
        'case_id' => [
            'required' => 'Case ID is required',
            'integer' => 'Invalid case ID'
        ],
        'report_type' => [
            'required' => 'Report type is required',
            'in_list' => 'Invalid report type'
        ]
    ];

    /**
     * Get all reports for a case
     */
    public function getCaseReports($caseId, $reportType = null)
    {
        $builder = $this->db->table($this->table)
            ->select($this->table . '.*, users.full_name as created_by_name, 
                     approver.full_name as approved_by_name')
            ->join('users', 'users.id = ' . $this->table . '.created_by', 'left')
            ->join('users as approver', 'approver.id = ' . $this->table . '.approved_by', 'left')
            ->where($this->table . '.case_id', $caseId);
        
        if ($reportType) {
            $builder->where($this->table . '.report_type', $reportType);
        }
        
        return $builder->orderBy($this->table . '.created_at', 'DESC')->get()->getResultArray();
    }

    /**
     * Get report with full details including approvals
     */
    public function getReportWithDetails($reportId)
    {
        $report = $this->db->table($this->table)
            ->select($this->table . '.*, 
                     users.full_name as created_by_name, users.badge_number,
                     approver.full_name as approved_by_name,
                     signer.full_name as signed_by_name,
                     cases.case_number, cases.ob_number, cases.crime_type')
            ->join('users', 'users.id = ' . $this->table . '.created_by', 'left')
            ->join('users as approver', 'approver.id = ' . $this->table . '.approved_by', 'left')
            ->join('users as signer', 'signer.id = ' . $this->table . '.signed_by', 'left')
            ->join('cases', 'cases.id = ' . $this->table . '.case_id', 'left')
            ->where($this->table . '.id', $reportId)
            ->get()
            ->getRowArray();

        if ($report) {
            // Get approval history
            $report['approvals'] = $this->db->table('report_approvals')
                ->select('report_approvals.*, users.full_name as approver_name, users.role')
                ->join('users', 'users.id = report_approvals.approver_id')
                ->where('report_id', $reportId)
                ->orderBy('created_at', 'ASC')
                ->get()
                ->getResultArray();
        }

        return $report;
    }

    /**
     * Create a new report
     */
    public function createReport($data)
    {
        // Set default values
        $data['approval_status'] = $data['approval_status'] ?? 'draft';
        $data['created_at'] = date('Y-m-d H:i:s');
        
        return $this->insert($data);
    }

    /**
     * Update report
     */
    public function updateReport($reportId, $data)
    {
        $data['updated_at'] = date('Y-m-d H:i:s');
        return $this->update($reportId, $data);
    }

    /**
     * Submit report for approval
     */
    public function submitForApproval($reportId, $userId)
    {
        return $this->updateReport($reportId, [
            'approval_status' => 'pending_approval'
        ]);
    }

    /**
     * Approve report
     */
    public function approveReport($reportId, $approverId, $comments = null)
    {
        $this->db->transStart();

        // Update report status
        $this->updateReport($reportId, [
            'approval_status' => 'approved',
            'approved_by' => $approverId,
            'approved_at' => date('Y-m-d H:i:s')
        ]);

        // Add approval record
        $this->db->table('report_approvals')->insert([
            'report_id' => $reportId,
            'approver_id' => $approverId,
            'approval_level' => 'commander',
            'status' => 'approved',
            'comments' => $comments,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $this->db->transComplete();
        return $this->db->transStatus();
    }

    /**
     * Reject report
     */
    public function rejectReport($reportId, $approverId, $comments)
    {
        $this->db->transStart();

        // Update report status
        $this->updateReport($reportId, [
            'approval_status' => 'rejected'
        ]);

        // Add approval record
        $this->db->table('report_approvals')->insert([
            'report_id' => $reportId,
            'approver_id' => $approverId,
            'approval_level' => 'commander',
            'status' => 'rejected',
            'comments' => $comments,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $this->db->transComplete();
        return $this->db->transStatus();
    }

    /**
     * Sign report digitally
     */
    public function signReport($reportId, $userId)
    {
        $report = $this->find($reportId);
        
        if (!$report || $report['is_signed']) {
            return false;
        }

        // Generate digital signature
        $signatureData = $report['report_content'] . $report['case_id'] . $userId . time();
        $signatureHash = hash('sha256', $signatureData);

        $this->db->transStart();

        // Update report
        $this->updateReport($reportId, [
            'is_signed' => 1,
            'signature_hash' => $signatureHash,
            'signed_by' => $userId,
            'signed_at' => date('Y-m-d H:i:s')
        ]);

        // Store in digital signatures registry (if table exists)
        if ($this->db->tableExists('digital_signatures')) {
            $this->db->table('digital_signatures')->insert([
                'entity_type' => 'investigation_reports',
                'entity_id' => $reportId,
                'signature_hash' => $signatureHash,
                'signature_algorithm' => 'SHA256',
                'signature_data' => base64_encode($signatureHash),
                'signed_by' => $userId,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        }

        $this->db->transComplete();
        return $this->db->transStatus();
    }

    /**
     * Get pending approvals for a user
     */
    public function getPendingApprovals($userId)
    {
        return $this->db->table($this->table)
            ->select($this->table . '.*, cases.case_number, users.full_name as created_by_name')
            ->join('cases', 'cases.id = ' . $this->table . '.case_id')
            ->join('users', 'users.id = ' . $this->table . '.created_by')
            ->where($this->table . '.approval_status', 'pending_approval')
            ->orderBy($this->table . '.created_at', 'DESC')
            ->get()
            ->getResultArray();
    }

    /**
     * Get reports by type for statistics
     */
    public function getReportStatistics($centerId = null, $dateFrom = null, $dateTo = null)
    {
        $builder = $this->db->table($this->table)
            ->select('report_type, approval_status, COUNT(*) as count')
            ->groupBy('report_type, approval_status');

        if ($centerId) {
            $builder->join('cases', 'cases.id = ' . $this->table . '.case_id')
                    ->where('cases.center_id', $centerId);
        }

        if ($dateFrom) {
            $builder->where($this->table . '.created_at >=', $dateFrom);
        }

        if ($dateTo) {
            $builder->where($this->table . '.created_at <=', $dateTo);
        }

        return $builder->get()->getResultArray();
    }

    /**
     * Check if case has required report type
     */
    public function caseHasReportType($caseId, $reportType)
    {
        return $this->where('case_id', $caseId)
                    ->where('report_type', $reportType)
                    ->countAllResults() > 0;
    }

    /**
     * Get latest report of type for case
     */
    public function getLatestReportByType($caseId, $reportType)
    {
        return $this->where('case_id', $caseId)
                    ->where('report_type', $reportType)
                    ->orderBy('created_at', 'DESC')
                    ->first();
    }
}
