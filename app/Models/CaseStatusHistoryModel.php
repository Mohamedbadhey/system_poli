<?php

namespace App\Models;

use CodeIgniter\Model;

class CaseStatusHistoryModel extends Model
{
    protected $table = 'case_status_history';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'case_id', 'previous_status', 'new_status', 
        'old_court_status', 'new_court_status',
        'changed_by', 'reason'
    ];
    
    protected $useTimestamps = true;
    protected $createdField = 'changed_at';
    protected $updatedField = false;
    
    /**
     * Log a status change
     */
    public function logStatusChange(array $data)
    {
        $record = [
            'case_id' => (int)$data['case_id'],
            'previous_status' => isset($data['previous_status']) ? (string)$data['previous_status'] : (isset($data['old_status']) ? (string)$data['old_status'] : null),
            'new_status' => (string)$data['new_status'],
            'old_court_status' => isset($data['old_court_status']) ? (string)$data['old_court_status'] : 'not_sent',
            'new_court_status' => (string)$data['new_court_status'],
            'changed_by' => (int)$data['changed_by'],
            'reason' => isset($data['reason']) ? (string)$data['reason'] : (isset($data['change_reason']) ? (string)$data['change_reason'] : null)
        ];
        
        try {
            // Use direct database query to avoid query builder issues with allowedFields
            $db = \Config\Database::connect();
            
            // Check if court status columns exist
            $columns = $db->getFieldNames('case_status_history');
            $hasCourtStatus = in_array('old_court_status', $columns) && in_array('new_court_status', $columns);
            
            if ($hasCourtStatus) {
                // New table structure with court status columns
                $sql = "INSERT INTO case_status_history 
                        (case_id, previous_status, new_status, old_court_status, new_court_status, changed_by, reason, changed_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                
                $result = $db->query($sql, [
                    $record['case_id'],
                    $record['previous_status'],
                    $record['new_status'],
                    $record['old_court_status'],
                    $record['new_court_status'],
                    $record['changed_by'],
                    $record['reason'],
                    date('Y-m-d H:i:s')
                ]);
            } else {
                // Old table structure without court status columns (backward compatible)
                $sql = "INSERT INTO case_status_history 
                        (case_id, previous_status, new_status, changed_by, reason, changed_at) 
                        VALUES (?, ?, ?, ?, ?, ?)";
                
                $result = $db->query($sql, [
                    $record['case_id'],
                    $record['previous_status'],
                    $record['new_status'],
                    $record['changed_by'],
                    $record['reason'],
                    date('Y-m-d H:i:s')
                ]);
            }
            
            return $result ? $db->insertID() : false;
        } catch (\Exception $e) {
            log_message('error', 'Status history logging failed: ' . $e->getMessage());
            log_message('error', 'Data: ' . json_encode($record));
            return false;
        }
    }
    
    /**
     * Get status history for a case
     */
    public function getCaseHistory(int $caseId)
    {
        return $this->select('case_status_history.*, users.full_name as changed_by_name')
                    ->join('users', 'users.id = case_status_history.changed_by')
                    ->where('case_id', $caseId)
                    ->orderBy('changed_at', 'DESC')
                    ->findAll();
    }
}
