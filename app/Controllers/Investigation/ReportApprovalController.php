<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ReportModel;

class ReportApprovalController extends ResourceController
{
    protected $format = 'json';
    protected $reportModel;

    public function __construct()
    {
        $this->reportModel = new ReportModel();
    }

    /**
     * Get pending approvals for current user
     */
    public function getPendingApprovals()
    {
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;

        // Only admins/commanders can approve
        if (!in_array($role, ['admin', 'super_admin'])) {
            return $this->failForbidden('You do not have permission to approve reports');
        }

        $reports = $this->reportModel->getPendingApprovals($userId);

        return $this->respond([
            'status' => 'success',
            'data' => $reports
        ]);
    }

    /**
     * Approve a report
     */
    public function approve($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;

        // Only admins/commanders can approve
        if (!in_array($role, ['admin', 'super_admin'])) {
            return $this->failForbidden('You do not have permission to approve reports');
        }

        $data = $this->request->getJSON(true);
        $comments = $data['comments'] ?? null;

        if ($this->reportModel->approveReport($reportId, $userId, $comments)) {
            return $this->respond([
                'status' => 'success',
                'message' => 'Report approved successfully'
            ]);
        }

        return $this->fail('Failed to approve report', 500);
    }

    /**
     * Reject a report
     */
    public function reject($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;

        // Only admins/commanders can reject
        if (!in_array($role, ['admin', 'super_admin'])) {
            return $this->failForbidden('You do not have permission to reject reports');
        }

        $data = $this->request->getJSON(true);
        $comments = $data['comments'] ?? null;

        if (!$comments) {
            return $this->fail('Comments are required when rejecting a report', 400);
        }

        if ($this->reportModel->rejectReport($reportId, $userId, $comments)) {
            return $this->respond([
                'status' => 'success',
                'message' => 'Report rejected successfully'
            ]);
        }

        return $this->fail('Failed to reject report', 500);
    }

    /**
     * Get report approval history
     */
    public function getApprovalHistory($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        $report = $this->reportModel->getReportWithDetails($reportId);

        if (!$report) {
            return $this->failNotFound('Report not found');
        }

        return $this->respond([
            'status' => 'success',
            'data' => $report['approvals'] ?? []
        ]);
    }
}
