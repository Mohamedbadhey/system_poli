<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;

class ConclusionController extends ResourceController
{
    protected $format = 'json';
    protected $modelName = 'App\Models\InvestigatorConclusionModel';

    /**
     * Get conclusion for a specific case
     */
    public function show($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;

        if (!$userId) {
            return $this->failUnauthorized('User not authenticated');
        }

        // Check if user has access to this case
        if (!$this->canAccessCase($caseId, $userId, $role)) {
            return $this->failForbidden('You do not have permission to access this case');
        }

        try {
            $conclusionModel = model('App\Models\InvestigatorConclusionModel');
            
            // If investigator, get their own conclusion
            if ($role === 'investigator') {
                $conclusion = $conclusionModel->getConclusionByCase($caseId, $userId);
            } else {
                // Admin/Station Commander can see all conclusions
                $conclusions = $conclusionModel->getConclusionsWithInvestigator($caseId);
                $conclusion = !empty($conclusions) ? $conclusions[0] : null;
            }

            return $this->respond([
                'status' => 'success',
                'data' => $conclusion
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Failed to fetch conclusion: ' . $e->getMessage());
            return $this->fail('Failed to fetch conclusion', 500);
        }
    }

    /**
     * Create or update conclusion for a case
     */
    public function save($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;

        if (!$userId || $role !== 'investigator') {
            return $this->failForbidden('Only investigators can write conclusions');
        }

        // Check if investigator is assigned to this case
        if (!$this->isAssignedToCase($caseId, $userId)) {
            return $this->failForbidden('You are not assigned to this case');
        }

        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->failValidationErrors('Invalid data provided');
        }

        try {
            $conclusionModel = model('App\Models\InvestigatorConclusionModel');
            
            // Check if conclusion already exists
            $existing = $conclusionModel->getConclusionByCase($caseId, $userId);

            $conclusionData = [
                'case_id' => $caseId,
                'investigator_id' => $userId,
                'conclusion_title' => $data['conclusion_title'] ?? '',
                'findings' => $data['findings'] ?? '',
                'recommendations' => $data['recommendations'] ?? '',
                'conclusion_summary' => $data['conclusion_summary'] ?? '',
                'status' => $data['status'] ?? 'draft'
            ];

            if ($existing) {
                // Update existing conclusion
                $conclusionModel->update($existing['id'], $conclusionData);
                $conclusionId = $existing['id'];
                $message = 'Conclusion updated successfully';
            } else {
                // Create new conclusion
                $conclusionId = $conclusionModel->insert($conclusionData);
                $message = 'Conclusion created successfully';
            }

            // Log the activity
            $this->logActivity($caseId, $existing ? 'conclusion_updated' : 'conclusion_created');

            return $this->respondCreated([
                'status' => 'success',
                'message' => $message,
                'data' => ['id' => $conclusionId]
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Failed to save conclusion: ' . $e->getMessage());
            return $this->fail('Failed to save conclusion: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Submit conclusion for review
     */
    public function submit($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }

        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;

        if (!$userId || $role !== 'investigator') {
            return $this->failForbidden('Only investigators can submit conclusions');
        }

        try {
            $conclusionModel = model('App\Models\InvestigatorConclusionModel');
            $conclusion = $conclusionModel->getConclusionByCase($caseId, $userId);

            if (!$conclusion) {
                return $this->failNotFound('No conclusion found for this case');
            }

            if ($conclusion['status'] === 'submitted') {
                return $this->fail('Conclusion already submitted', 400);
            }

            $conclusionModel->submitConclusion($conclusion['id']);

            // Log the activity
            $this->logActivity($caseId, 'conclusion_submitted');

            return $this->respond([
                'status' => 'success',
                'message' => 'Conclusion submitted for review'
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Failed to submit conclusion: ' . $e->getMessage());
            return $this->fail('Failed to submit conclusion', 500);
        }
    }

    /**
     * Check if user can access case
     */
    private function canAccessCase($caseId, $userId, $role): bool
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);

        if (!$case) {
            return false;
        }

        if (in_array($role, ['super_admin', 'admin', 'station_commander'])) {
            return true;
        }

        if ($role === 'investigator') {
            return $this->isAssignedToCase($caseId, $userId);
        }

        return false;
    }

    /**
     * Check if investigator is assigned to case
     */
    private function isAssignedToCase($caseId, $userId): bool
    {
        $db = \Config\Database::connect();
        $assignment = $db->table('case_assignments')
            ->where('case_id', $caseId)
            ->where('investigator_id', $userId)
            ->countAllResults();
        
        return $assignment > 0;
    }

    /**
     * Log activity
     */
    private function logActivity($caseId, $action)
    {
        try {
            $auditModel = model('App\Models\AuditLogModel');
            $userId = $GLOBALS['current_user']['userId'] ?? null;

            $auditModel->insert([
                'user_id' => $userId,
                'action' => $action,
                'table_name' => 'investigator_conclusions',
                'record_id' => $caseId,
                'description' => "Investigator {$action} for case #{$caseId}"
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Failed to log activity: ' . $e->getMessage());
        }
    }
}
