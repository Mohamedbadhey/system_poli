<?php

namespace App\Models;

class EvidenceModel extends BaseModel
{
    protected $table = 'evidence';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'case_id', 'evidence_number', 'evidence_type', 'title', 'description',
        'file_path', 'file_name', 'file_type', 'file_size', 'is_encrypted',
        'encryption_key_hash', 'collected_by', 'collected_from',
        'collected_from_person_id', 'collected_at', 'location_collected',
        'is_critical', 'is_digital_signed', 'signature_hash', 'tags', 'created_by',
        'is_edited', 'last_edited_at', 'last_edited_by'
    ];
    
    // Disable automatic timestamps since table only has created_at
    protected $useTimestamps = false;
    
    /**
     * Edit evidence and track changes
     */
    public function editEvidence(int $evidenceId, int $editorId, array $changes)
    {
        $evidence = $this->find($evidenceId);
        if (!$evidence) {
            return false;
        }
        
        $db = \Config\Database::connect();
        $editableFields = ['title', 'description', 'evidence_type', 'location_collected', 'is_critical', 'tags', 'file_name', 'file_path', 'file_type', 'file_size'];
        
        // Track each changed field
        foreach ($changes as $field => $newValue) {
            if (in_array($field, $editableFields) && isset($evidence[$field])) {
                $oldValue = $evidence[$field];
                
                // Only track if value actually changed
                if ($oldValue != $newValue) {
                    $db->table('evidence_edit_history')->insert([
                        'evidence_id' => $evidenceId,
                        'edited_by' => $editorId,
                        'field_name' => $field,
                        'old_value' => $oldValue,
                        'new_value' => $newValue,
                        'edited_at' => date('Y-m-d H:i:s')
                    ]);
                }
            }
        }
        
        // Update the evidence
        $changes['is_edited'] = 1;
        $changes['last_edited_at'] = date('Y-m-d H:i:s');
        $changes['last_edited_by'] = $editorId;
        
        return $this->update($evidenceId, $changes);
    }
    
    /**
     * Edit evidence with file path tracking
     */
    public function editEvidenceWithFilePaths(int $evidenceId, int $editorId, array $changes, string $oldFilePath = null, string $newFilePath = null)
    {
        $evidence = $this->find($evidenceId);
        if (!$evidence) {
            return false;
        }
        
        $db = \Config\Database::connect();
        $editableFields = ['title', 'description', 'evidence_type', 'location_collected', 'is_critical', 'tags', 'file_name', 'file_path', 'file_type', 'file_size'];
        
        // Track each changed field
        foreach ($changes as $field => $newValue) {
            if (in_array($field, $editableFields) && isset($evidence[$field])) {
                $oldValue = $evidence[$field];
                
                // Only track if value actually changed
                if ($oldValue != $newValue) {
                    $historyData = [
                        'evidence_id' => $evidenceId,
                        'edited_by' => $editorId,
                        'field_name' => $field,
                        'old_value' => $oldValue,
                        'new_value' => $newValue,
                        'edited_at' => date('Y-m-d H:i:s')
                    ];
                    
                    // Add file paths for file-related changes
                    if ($field === 'file_name' || $field === 'file_path') {
                        $historyData['old_file_path'] = $oldFilePath;
                        $historyData['new_file_path'] = $newFilePath;
                    }
                    
                    $db->table('evidence_edit_history')->insert($historyData);
                }
            }
        }
        
        // Update the evidence
        $changes['is_edited'] = 1;
        $changes['last_edited_at'] = date('Y-m-d H:i:s');
        $changes['last_edited_by'] = $editorId;
        
        return $this->update($evidenceId, $changes);
    }
    
    /**
     * Get edit history for evidence with version IDs
     */
    public function getEditHistory(int $evidenceId)
    {
        $db = \Config\Database::connect();
        $history = $db->table('evidence_edit_history')
            ->select('evidence_edit_history.*, users.full_name as editor_name')
            ->join('users', 'users.id = evidence_edit_history.edited_by')
            ->where('evidence_edit_history.evidence_id', $evidenceId)
            ->orderBy('evidence_edit_history.edited_at', 'DESC')
            ->get()
            ->getResultArray();
        
        // For file changes, add version_id by matching old_file_path
        foreach ($history as &$entry) {
            if ($entry['field_name'] === 'file_path' && !empty($entry['old_value'])) {
                // Get version_id for this old file path
                // The old_value contains the path we need to match
                $version = $db->table('evidence_file_versions')
                    ->select('id as version_id, version_number, file_name')
                    ->where('evidence_id', $evidenceId)
                    ->like('file_path', basename($entry['old_value']), 'before')
                    ->get()
                    ->getRowArray();
                
                if ($version) {
                    $entry['version_id'] = $version['version_id'];
                    $entry['version_number'] = $version['version_number'];
                }
            }
        }
        
        return $history;
    }
    
    protected $beforeInsert = ['generateEvidenceNumber'];
    
    protected function generateEvidenceNumber(array $data)
    {
        if (empty($data['data']['evidence_number'])) {
            $caseId = $data['data']['case_id'];
            $lastEvidence = $this->where('case_id', $caseId)
                ->orderBy('id', 'DESC')
                ->first();
            
            $sequence = 1;
            if ($lastEvidence && preg_match('/E(\d+)$/', $lastEvidence['evidence_number'], $matches)) {
                $sequence = (int)$matches[1] + 1;
            }
            
            $caseModel = model('App\Models\CaseModel');
            $case = $caseModel->find($caseId);
            $caseNumber = $case['case_number'] ?? 'UNKNOWN';
            
            $data['data']['evidence_number'] = sprintf('%s-E%03d', $caseNumber, $sequence);
        }
        
        return $data;
    }
    
    public function getCaseEvidence(int $caseId)
    {
        return $this->where('case_id', $caseId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }
}
