<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;

class EvidenceController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get evidence for a specific case
     */
    public function index($caseId = null)
    {
        if (!$caseId) {
            return $this->fail('Case ID is required', 400);
        }
        
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        // Check if user is assigned to this case (for investigators)
        $userId = $this->request->userId;
        $role = $this->request->userRole;
        
        if (!in_array($role, ['admin', 'super_admin'])) {
            $db = \Config\Database::connect();
            $assignment = $db->table('case_assignments')
                ->where('case_id', $caseId)
                ->where('investigator_id', $userId)
                // Allow both active and completed assignments (for closed cases)
                ->whereIn('status', ['active', 'completed'])
                ->get()
                ->getRowArray();
            
            if (!$assignment) {
                return $this->failForbidden('You are not assigned to this case');
            }
        }
        
        // Get all evidence for this case
        $evidenceModel = model('App\Models\EvidenceModel');
        $evidence = $evidenceModel->select('evidence.*, users.full_name as collected_by_name')
            ->join('users', 'users.id = evidence.collected_by', 'left')
            ->where('evidence.case_id', $caseId)
            ->orderBy('evidence.collected_at', 'DESC')
            ->findAll();
        
        return $this->respond([
            'status' => 'success',
            'data' => $evidence
        ]);
    }
    
    /**
     * Get all evidence (for evidence management page)
     */
    public function listAll()
    {
        $evidenceModel = model('App\Models\EvidenceModel');
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;
        
        // Apply filters if provided
        $search = $this->request->getGet('search');
        $type = $this->request->getGet('type');
        
        if ($search) {
            $evidenceModel->groupStart()
                ->like('evidence_number', $search)
                ->orLike('description', $search)
                ->groupEnd();
        }
        
        if ($type) {
            $evidenceModel->where('evidence_type', $type);
        }
        
        // Get evidence with case information
        $evidence = $evidenceModel->select('evidence.*, cases.case_number')
            ->join('cases', 'cases.id = evidence.case_id')
            ->orderBy('evidence.created_at', 'DESC')
            ->findAll();
        
        return $this->respond([
            'status' => 'success',
            'data' => $evidence
        ]);
    }
    
    /**
     * Upload evidence (create)
     */
    public function create($caseId = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        $rules = [
            'evidence_type' => 'required|in_list[photo,video,audio,document,physical,digital]',
            'title' => 'required|max_length[255]',
            'file' => 'uploaded[file]|max_size[file,51200]' // 50MB max
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $file = $this->request->getFile('file');
        
        if (!$file->isValid()) {
            return $this->fail('Invalid file upload', 400);
        }
        
        // Generate secure file path
        $year = date('Y');
        $uploadPath = WRITEPATH . "uploads/evidence/{$year}/{$caseId}/";
        
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        
        // Generate unique filename
        $fileName = $file->getRandomName();
        $filePath = $uploadPath . $fileName;
        
        // Move and encrypt file
        $file->move($uploadPath, $fileName);
        $this->encryptFile($filePath);
        
        // Create evidence record
        $evidenceData = [
            'case_id' => $caseId,
            'evidence_type' => $this->request->getPost('evidence_type'),
            'title' => $this->request->getPost('title'),
            'description' => $this->request->getPost('description'),
            'file_path' => "evidence/{$year}/{$caseId}/{$fileName}.enc",
            'file_name' => $file->getClientName(),
            'file_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'is_encrypted' => 1,
            'collected_by' => $this->request->userId,
            'collected_from' => $this->request->getPost('collected_from'),
            'collected_from_person_id' => $this->request->getPost('collected_from_person_id'),
            'collected_at' => $this->request->getPost('collected_at') ?? date('Y-m-d H:i:s'),
            'location_collected' => $this->request->getPost('location_collected'),
            'is_critical' => $this->request->getPost('is_critical') ?? 0,
            'tags' => $this->request->getPost('tags'),
            'created_by' => $this->request->userId
        ];
        
        $evidenceModel = model('App\Models\EvidenceModel');
        $evidenceId = $evidenceModel->insert($evidenceData);
        
        if (!$evidenceId) {
            return $this->fail('Failed to create evidence record', 500);
        }
        
        // Log chain of custody
        $this->logCustodyAction($evidenceId, 'collected', 'Evidence collected and uploaded to system');
        
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Evidence uploaded successfully',
            'data' => $evidenceModel->find($evidenceId)
        ]);
    }
    
    /**
     * Update evidence metadata with change tracking
     * PUT /investigation/evidence/{id}
     */
    public function update($id = null)
    {
        if (!$id) {
            return $this->fail('Evidence ID is required', 400);
        }
        
        $evidenceModel = model('App\Models\EvidenceModel');
        $evidence = $evidenceModel->find($id);
        
        if (!$evidence) {
            return $this->failNotFound('Evidence not found');
        }
        
        // Verify investigator has access to this case
        $userId = $this->request->userId;
        $role = $this->request->userRole;
        
        if (!in_array($role, ['admin', 'super_admin'])) {
            $db = \Config\Database::connect();
            $assignment = $db->table('case_assignments')
                ->where('case_id', $evidence['case_id'])
                ->where('investigator_id', $userId)
                // Allow both active and completed assignments (for closed cases)
                ->whereIn('status', ['active', 'completed'])
                ->get()
                ->getRowArray();
            
            if (!$assignment) {
                return $this->failForbidden('You are not assigned to this case');
            }
        }
        
        // Get update data
        $json = $this->request->getJSON(true);
        $allowedFields = ['title', 'description', 'evidence_type', 'location_collected', 'is_critical', 'tags'];
        
        $changes = [];
        foreach ($allowedFields as $field) {
            if (isset($json[$field])) {
                $changes[$field] = $json[$field];
            }
        }
        
        if (empty($changes)) {
            return $this->fail('No valid fields to update', 400);
        }
        
        // Edit evidence with tracking
        $success = $evidenceModel->editEvidence($id, $userId, $changes);
        
        if ($success) {
            // Get updated evidence with collector name
            $updatedEvidence = $evidenceModel->select('evidence.*, users.full_name as collected_by_name, 
                                                       editors.full_name as last_editor_name')
                ->join('users', 'users.id = evidence.collected_by', 'left')
                ->join('users as editors', 'editors.id = evidence.last_edited_by', 'left')
                ->find($id);
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Evidence updated successfully',
                'data' => $updatedEvidence
            ]);
        }
        
        return $this->fail('Failed to update evidence', 500);
    }
    
    /**
     * Replace evidence file
     * POST /investigation/evidence/{id}/replace-file
     */
    public function replaceFile($id = null)
    {
        if (!$id) {
            return $this->fail('Evidence ID is required', 400);
        }
        
        $evidenceModel = model('App\Models\EvidenceModel');
        $evidence = $evidenceModel->find($id);
        
        if (!$evidence) {
            return $this->failNotFound('Evidence not found');
        }
        
        // Verify investigator has access to this case
        $userId = $this->request->userId;
        $role = $this->request->userRole;
        
        if (!in_array($role, ['admin', 'super_admin'])) {
            $db = \Config\Database::connect();
            $assignment = $db->table('case_assignments')
                ->where('case_id', $evidence['case_id'])
                ->where('investigator_id', $userId)
                // Allow both active and completed assignments (for closed cases)
                ->whereIn('status', ['active', 'completed'])
                ->get()
                ->getRowArray();
            
            if (!$assignment) {
                return $this->failForbidden('You are not assigned to this case');
            }
        }
        
        // Validate file upload
        $rules = [
            'file' => 'uploaded[file]|max_size[file,51200]' // 50MB max
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $file = $this->request->getFile('file');
        
        if (!$file->isValid()) {
            return $this->fail('Invalid file upload', 400);
        }
        
        // Store old file info for history
        $oldFileName = $evidence['file_name'];
        $oldFilePath = $evidence['file_path'];
        $oldFileType = $evidence['file_type'];
        $oldFileSize = $evidence['file_size'];
        
        // Get next version number
        $db = \Config\Database::connect();
        $lastVersion = $db->table('evidence_file_versions')
            ->where('evidence_id', $id)
            ->orderBy('version_number', 'DESC')
            ->get()
            ->getRowArray();
        
        $versionNumber = $lastVersion ? $lastVersion['version_number'] + 1 : 1;
        
        // Move old file to versions directory instead of deleting
        $versionsPath = WRITEPATH . "uploads/evidence/versions/{$id}/";
        if (!is_dir($versionsPath)) {
            mkdir($versionsPath, 0755, true);
        }
        
        $oldFileFullPath = WRITEPATH . 'uploads/' . $oldFilePath;
        $versionFileName = "v{$versionNumber}_" . basename($oldFilePath);
        $versionFilePath = $versionsPath . $versionFileName;
        
        // Copy old file to versions (don't delete original yet)
        if (file_exists($oldFileFullPath)) {
            copy($oldFileFullPath, $versionFilePath);
            
            // Store version info in database
            $db->table('evidence_file_versions')->insert([
                'evidence_id' => $id,
                'version_number' => $versionNumber,
                'file_name' => $oldFileName,
                'file_path' => "evidence/versions/{$id}/{$versionFileName}",
                'file_type' => $oldFileType,
                'file_size' => $oldFileSize,
                'replaced_by' => $userId,
                'notes' => "Replaced with: {$file->getClientName()}"
            ]);
        }
        
        // Generate new file path
        $year = date('Y');
        $caseId = $evidence['case_id'];
        $uploadPath = WRITEPATH . "uploads/evidence/{$year}/{$caseId}/";
        
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        
        // Generate unique filename
        $fileName = $file->getRandomName();
        $filePath = $uploadPath . $fileName;
        
        // Move and encrypt new file
        $file->move($uploadPath, $fileName);
        $this->encryptFile($filePath);
        
        $newFilePath = "evidence/{$year}/{$caseId}/{$fileName}.enc";
        
        // Track file replacement in edit history with file paths
        $changes = [
            'file_name' => $file->getClientName(),
            'file_path' => $newFilePath,
            'file_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize()
        ];
        
        // Use editEvidence to track the change (will store old_file_path and new_file_path)
        $evidenceModel->editEvidenceWithFilePaths($id, $userId, $changes, $oldFilePath, $newFilePath);
        
        // NOW delete old encrypted file from main location
        if (file_exists($oldFileFullPath)) {
            unlink($oldFileFullPath);
        }
        
        // Log custody action
        $this->logCustodyAction($id, 'analyzed', "File replaced: {$oldFileName} → {$file->getClientName()}");
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Evidence file replaced successfully',
            'data' => $evidenceModel->find($id)
        ]);
    }
    
    /**
     * Get edit history for evidence
     * GET /investigation/evidence/{id}/history
     */
    public function getEditHistory($id = null)
    {
        if (!$id) {
            return $this->fail('Evidence ID is required', 400);
        }
        
        $evidenceModel = model('App\Models\EvidenceModel');
        $evidence = $evidenceModel->find($id);
        
        if (!$evidence) {
            return $this->failNotFound('Evidence not found');
        }
        
        $history = $evidenceModel->getEditHistory($id);
        
        return $this->respond([
            'status' => 'success',
            'data' => $history
        ]);
    }
    
    /**
     * Delete evidence
     */
    public function delete($id = null)
    {
        $evidenceModel = model('App\Models\EvidenceModel');
        $evidence = $evidenceModel->find($id);
        
        if (!$evidence) {
            return $this->failNotFound('Evidence not found');
        }
        
        // Only admin or super_admin can delete evidence
        if (!in_array($this->request->userRole, ['admin', 'super_admin'])) {
            return $this->failForbidden('Only administrators can delete evidence');
        }
        
        // Log custody action before deletion
        $this->logCustodyAction($id, 'disposed', 'Evidence record deleted from system');
        
        // Delete the physical file if it exists
        $filePath = WRITEPATH . 'uploads/' . $evidence['file_path'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        // Delete the record
        $evidenceModel->delete($id);
        
        return $this->respondDeleted([
            'status' => 'success',
            'message' => 'Evidence deleted successfully'
        ]);
    }
    
    /**
     * Get evidence details
     */
    public function show($id = null)
    {
        $evidenceModel = model('App\Models\EvidenceModel');
        
        // Get evidence with collector name
        $evidence = $evidenceModel->select('evidence.*, users.full_name as collected_by_name')
            ->join('users', 'users.id = evidence.collected_by', 'left')
            ->find($id);
        
        if (!$evidence) {
            return $this->failNotFound('Evidence not found');
        }
        
        // Get custody log
        $db = \Config\Database::connect();
        $evidence['custody_log'] = $db->table('evidence_custody_log')
            ->select('evidence_custody_log.*, users.full_name as performed_by_name')
            ->join('users', 'users.id = evidence_custody_log.performed_by')
            ->where('evidence_id', $id)
            ->orderBy('performed_at', 'ASC')
            ->get()
            ->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $evidence
        ]);
    }
    
    /**
     * Download evidence (decrypt and serve)
     */
    public function download($id = null)
    {
        $evidenceModel = model('App\Models\EvidenceModel');
        $evidence = $evidenceModel->find($id);
        
        if (!$evidence) {
            return $this->failNotFound('Evidence not found');
        }
        
        $filePath = WRITEPATH . 'uploads/' . $evidence['file_path'];
        
        if (!file_exists($filePath)) {
            return $this->failNotFound('Evidence file not found');
        }
        
        // Decrypt file
        $decryptedContent = $this->decryptFile($filePath);
        
        // Log custody action
        $this->logCustodyAction($id, 'accessed', 'Evidence file downloaded by user');
        
        // Serve file with properly encoded filename (RFC 2231)
        $filename = $evidence['file_name'];
        $filename = str_replace(['"', "'", "\r", "\n"], '', $filename); // Remove problematic characters
        
        return $this->response
            ->setHeader('Content-Type', $evidence['file_type'])
            ->setHeader('Content-Disposition', 'attachment; filename=' . $filename)
            ->setHeader('Content-Length', strlen($decryptedContent))
            ->setBody($decryptedContent);
    }
    
    /**
     * Download old version of evidence file
     * GET /investigation/evidence/{id}/download-version/{versionId}
     */
    public function downloadVersion($id = null, $versionId = null)
    {
        if (!$id || !$versionId) {
            return $this->fail('Evidence ID and Version ID are required', 400);
        }
        
        $db = \Config\Database::connect();
        $version = $db->table('evidence_file_versions')
            ->where('id', $versionId)
            ->where('evidence_id', $id)
            ->get()
            ->getRowArray();
        
        if (!$version) {
            return $this->failNotFound('File version not found');
        }
        
        $filePath = WRITEPATH . 'uploads/' . $version['file_path'];
        
        log_message('info', "Downloading version {$versionId}: {$filePath}");
        
        if (!file_exists($filePath)) {
            log_message('error', "Version file not found: {$filePath}");
            return $this->failNotFound('Version file not found on disk: ' . $filePath);
        }
        
        // Check file size before decryption
        $encryptedSize = filesize($filePath);
        log_message('info', "Encrypted file size: {$encryptedSize} bytes");
        
        try {
            // Decrypt file
            $decryptedContent = $this->decryptFile($filePath);
            $decryptedSize = strlen($decryptedContent);
            
            log_message('info', "Decryption successful. Decrypted size: {$decryptedSize} bytes");
            
            // Log custody action
            $this->logCustodyAction($id, 'accessed', "Downloaded old version (v{$version['version_number']}): {$version['file_name']}");
            
            // Serve file with properly encoded filename (RFC 2231)
            $filename = $version['file_name'];
            $filename = str_replace(['"', "'", "\r", "\n"], '', $filename); // Remove problematic characters
            $versionedFilename = 'v' . $version['version_number'] . '_' . $filename;
            
            return $this->response
                ->setHeader('Content-Type', $version['file_type'])
                ->setHeader('Content-Disposition', 'attachment; filename=' . $versionedFilename)
                ->setHeader('Content-Length', $decryptedSize)
                ->setBody($decryptedContent);
                
        } catch (\Exception $e) {
            log_message('error', "Decryption failed for version {$versionId}: " . $e->getMessage());
            return $this->fail('Failed to decrypt file: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Add custody log entry
     */
    public function addCustodyLog($id = null)
    {
        $evidenceModel = model('App\Models\EvidenceModel');
        $evidence = $evidenceModel->find($id);
        
        if (!$evidence) {
            return $this->failNotFound('Evidence not found');
        }
        
        $rules = [
            'action' => 'required|in_list[collected,stored,transferred,analyzed,returned,disposed]',
            'location' => 'required'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $this->logCustodyAction(
            $id,
            $this->request->getPost('action'),
            $this->request->getPost('notes'),
            $this->request->getPost('location'),
            $this->request->getPost('witness_id')
        );
        
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Custody log added successfully'
        ]);
    }
    
    /**
     * Encrypt file using AES-256
     */
    private function encryptFile(string $filePath): bool
    {
        $key = getenv('ENCRYPTION_KEY') ?: 'change-this-encryption-key-in-production-32chars!!';
        $iv = openssl_random_pseudo_bytes(16);
        
        $data = file_get_contents($filePath);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        
        // Store IV with encrypted data
        $encryptedData = base64_encode($iv) . '::' . $encrypted;
        
        file_put_contents($filePath . '.enc', $encryptedData);
        unlink($filePath); // Remove original
        
        return true;
    }
    
    /**
     * Decrypt file
     */
    private function decryptFile(string $filePath): string
    {
        $key = getenv('ENCRYPTION_KEY') ?: 'change-this-encryption-key-in-production-32chars!!';
        
        $encryptedData = file_get_contents($filePath);
        
        // Check if file has the IV separator
        if (strpos($encryptedData, '::') === false) {
            log_message('error', "Decryption failed: Invalid encrypted file format for {$filePath}");
            throw new \Exception('Invalid encrypted file format');
        }
        
        list($iv, $encrypted) = explode('::', $encryptedData, 2);
        
        $iv = base64_decode($iv);
        $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
        
        if ($decrypted === false) {
            log_message('error', "Decryption failed for file: {$filePath}");
            throw new \Exception('File decryption failed');
        }
        
        return $decrypted;
    }
    
    /**
     * Log custody action
     */
    private function logCustodyAction(int $evidenceId, string $action, ?string $notes = null, ?string $location = null, ?int $witnessId = null)
    {
        $db = \Config\Database::connect();
        $db->table('evidence_custody_log')->insert([
            'evidence_id' => $evidenceId,
            'action' => $action,
            'performed_by' => $this->request->userId,
            'location' => $location,
            'notes' => $notes,
            'witness_id' => $witnessId
        ]);
    }
}
