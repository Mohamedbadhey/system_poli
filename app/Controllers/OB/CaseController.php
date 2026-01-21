<?php

namespace App\Controllers\OB;

use CodeIgniter\RESTful\ResourceController;

class CaseController extends ResourceController
{
    protected $modelName = 'App\Models\CaseModel';
    protected $format = 'json';
    
    /**
     * Get OB cases (created by current user)
     */
    public function index()
    {
        $caseModel = model('App\Models\CaseModel');
        // Get user data from global (set by AuthFilter)
        $userId = $GLOBALS['current_user']['userId'] ?? $this->request->userId ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? $this->request->userRole ?? null;
        
        // OB officers can only see their own cases
        if ($role === 'ob_officer') {
            $cases = $caseModel->where('created_by', $userId)
                               ->orderBy('created_at', 'DESC')
                               ->findAll();
        } else if ($role === 'admin') {
            // Admin can see cases they created + cases created by OB officers in their center
            $centerId = $GLOBALS['current_user']['centerId'] ?? $this->request->centerId ?? null;
            $db = \Config\Database::connect();
            
            $cases = $db->table('cases')
                ->select('cases.*')
                ->join('users', 'users.id = cases.created_by', 'left')
                ->where('cases.center_id', $centerId)
                ->groupStart()
                    ->where('cases.created_by', $userId) // Cases created by admin themselves
                    ->orWhere('users.role', 'ob_officer') // Cases created by OB officers
                ->groupEnd()
                ->orderBy('cases.created_at', 'DESC')
                ->get()
                ->getResultArray();
        } else {
            // Super admin and other roles can see all cases in their center
            $centerId = $GLOBALS['current_user']['centerId'] ?? $this->request->centerId ?? null;
            $cases = $caseModel->where('center_id', $centerId)
                               ->orderBy('created_at', 'DESC')
                               ->findAll();
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $cases
        ]);
    }
    
    /**
     * Create new OB entry
     */
    public function create()
    {
        $rules = [
            'incident_date' => 'required|valid_date',
            'incident_location' => 'required',
            'incident_description' => 'required|min_length[10]',
            'crime_type' => 'required|max_length[100]',
            'crime_category' => 'required'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $centerId = $GLOBALS['current_user']['centerId'] ?? $this->request->centerId ?? null;
        $userId = $GLOBALS['current_user']['userId'] ?? $this->request->userId ?? null;
        
        // Validate center_id and user_id
        if (!$centerId) {
            log_message('error', 'Case creation failed: center_id is null. User data: ' . json_encode($GLOBALS['current_user'] ?? []));
            return $this->fail('Center ID not found. Please contact administrator.', 500);
        }
        
        if (!$userId) {
            log_message('error', 'Case creation failed: user_id is null');
            return $this->fail('User ID not found. Please re-login.', 500);
        }
        
        // Get input data (works for both JSON and form-data)
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        
        // Convert 'submitted' status to 'approved' (direct submission, no approval needed)
        $status = $input['status'] ?? 'draft';
        if ($status === 'submitted') {
            $status = 'approved';
        }
        
        $data = [
            'center_id' => $centerId,
            'incident_date' => $input['incident_date'] ?? null,
            'incident_location' => $input['incident_location'] ?? null,
            'incident_gps_latitude' => $input['incident_gps_latitude'] ?? null,
            'incident_gps_longitude' => $input['incident_gps_longitude'] ?? null,
            'incident_description' => $input['incident_description'] ?? null,
            'crime_type' => $input['crime_type'] ?? null,
            'crime_category' => $input['crime_category'] ?? null,
            'priority' => $input['priority'] ?? 'medium',
            'is_sensitive' => $input['is_sensitive'] ?? 0,
            'status' => $status,
            'created_by' => $userId
        ];
        
        log_message('info', 'Creating case with data: ' . json_encode($data));
        
        $caseModel = model('App\Models\CaseModel');
        
        try {
            $caseId = $caseModel->insert($data);
            
            if (!$caseId) {
                $errors = $caseModel->errors();
                log_message('error', 'Case insertion failed with validation errors: ' . json_encode($errors));
                return $this->fail(['error' => 'Failed to create case', 'validation_errors' => $errors], 500);
            }
            
            $case = $caseModel->find($caseId);
            
            return $this->respondCreated([
                'status' => 'success',
                'message' => 'OB entry created successfully',
                'data' => $case
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Case creation exception: ' . $e->getMessage());
            return $this->fail(['error' => 'Failed to create case', 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Get case details
     */
    public function show($id = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->getFullCaseDetails($id);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        // Check permissions
        $role = $this->request->userRole;
        if ($role === 'ob_officer' && $case['created_by'] != $this->request->userId) {
            return $this->failForbidden('You do not have permission to view this case');
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $case
        ]);
    }
    
    /**
     * Update case (only if in draft status)
     */
    public function update($id = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($id);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        // Only creator can update
        if ($case['created_by'] != $this->request->userId) {
            return $this->failForbidden('You do not have permission to update this case');
        }
        
        // Can only update if in draft or returned status
        if (!in_array($case['status'], ['draft', 'returned'])) {
            return $this->fail('Cannot update case after submission', 400);
        }
        
        $data = $this->request->getRawInput();
        unset($data['case_number'], $data['ob_number'], $data['status'], $data['center_id']);
        
        $caseModel->update($id, $data);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Case updated successfully'
        ]);
    }
    
    /**
     * Submit case for approval
     */
    public function submit($id = null)
    {
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($id);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        if ($case['created_by'] != $this->request->userId) {
            return $this->failForbidden('You do not have permission to submit this case');
        }
        
        if (!in_array($case['status'], ['draft', 'returned'])) {
            return $this->fail('Case is already submitted', 400);
        }
        
        // Verify required parties exist (not required for incident-only cases)
        $db = \Config\Database::connect();
        $partyCount = $db->table('case_parties')
            ->where('case_id', $id)
            ->countAllResults();
        
        // Allow submission without parties for incident-only cases
        // These will be handled differently in the workflow
        if ($partyCount === 0) {
            // Update status to 'pending_parties' instead of 'submitted'
            $caseModel->update($id, [
                'status' => 'pending_parties',
                'submitted_at' => date('Y-m-d H:i:s')
            ]);
            
            // Notify admin that this is an incident without parties
            $admins = model('App\Models\UserModel')->getUsersByCenter((int)$case['center_id'], 'admin');
            $db = \Config\Database::connect();
            
            foreach ($admins as $admin) {
                $db->table('notifications')->insert([
                    'user_id' => (int)$admin['id'],
                    'notification_type' => 'system_alert',
                    'title' => 'Incident Reported (No Parties)',
                    'message' => "Incident {$case['case_number']} has been reported without party information. Assign to investigator to add parties.",
                    'link_entity_type' => 'cases',
                    'link_entity_id' => (int)$id,
                    'link_url' => '/cases/view/' . $id,
                    'priority' => 'medium',
                    'is_read' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Incident submitted. An admin will assign an investigator to identify involved parties.'
            ]);
        }
        
        $caseModel->updateStatus($id, 'submitted', $this->request->userId);
        
        // Create notification for admin
        $admins = model('App\Models\UserModel')->getUsersByCenter((int)$case['center_id'], 'admin');
        $db = \Config\Database::connect();
        
        foreach ($admins as $admin) {
            $db->table('notifications')->insert([
                'user_id' => (int)$admin['id'],
                'notification_type' => 'approval_required',
                'title' => 'New OB Entry for Approval',
                'message' => "Case {$case['case_number']} has been submitted for approval",
                'link_entity_type' => 'cases',
                'link_entity_id' => (int)$id,
                'link_url' => '/cases/view/' . $id,
                'priority' => 'medium',
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        }
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Case submitted for approval'
        ]);
    }

    public function addRelationship($caseId = null)
    {
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        
        $data = [
            'case_id' => $caseId,
            'related_case_id' => $input['related_case_id'] ?? null,
            'relationship_type' => $input['relationship_type'] ?? 'related',
            'notes' => $input['notes'] ?? null,
            'created_by' => $this->request->userId
        ];
        
        $db = \Config\Database::connect();
        
        try {
            // Insert bidirectional relationship
            $db->table('case_relationships')->insert($data);
            
            // Also create reverse relationship
            $reverseData = [
                'case_id' => $data['related_case_id'],
                'related_case_id' => $caseId,
                'relationship_type' => $data['relationship_type'],
                'notes' => $data['notes'],
                'created_by' => $this->request->userId
            ];
            $db->table('case_relationships')->insert($reverseData);
            
            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Case relationship created successfully'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Case relationship creation failed: ' . $e->getMessage());
            return $this->fail('Failed to create relationship', 500);
        }
    }
    
    public function getRelationships($caseId = null)
    {
        $db = \Config\Database::connect();
        
        try {
            $query = $db->table('case_relationships cr')
                ->select('cr.*, c.case_number, c.crime_type, c.incident_date, c.status')
                ->join('cases c', 'c.id = cr.related_case_id')
                ->where('cr.case_id', $caseId)
                ->get();
            
            $relationships = $query->getResultArray();
            
            return $this->respond([
                'status' => 'success',
                'data' => $relationships
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Failed to get case relationships: ' . $e->getMessage());
            return $this->fail('Failed to get relationships', 500);
        }
    }
    
    /**
     * Create incident-only case (no immediate parties)
     * For natural incidents, public disturbances, lost property, etc.
     */
    public function createIncident()
    {
        $centerId = $GLOBALS['current_user']['centerId'] ?? $this->request->centerId ?? null;
        $userId = $GLOBALS['current_user']['userId'] ?? $this->request->userId ?? null;
        
        if (!$centerId) {
            return $this->fail('Center ID not found. Please contact administrator.', 500);
        }
        
        if (!$userId) {
            return $this->fail('User ID not found. Please re-login.', 500);
        }
        
        $rules = [
            'incident_date' => 'required|valid_date',
            'incident_location' => 'required',
            'incident_description' => 'required|min_length[10]',
            'crime_type' => 'required|max_length[100]',
            'crime_category' => 'required'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        // Get input data (works for both JSON and form-data)
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        
        // Determine initial status based on should_submit flag
        $shouldSubmit = isset($input['should_submit']) && $input['should_submit'] == 1;
        $hasPartyData = isset($input['party']) && is_array($input['party']) && !empty($input['party']);
        
        // Debug logging
        log_message('debug', 'Input should_submit value: ' . json_encode($input['should_submit'] ?? 'NOT SET'));
        log_message('debug', 'shouldSubmit boolean: ' . ($shouldSubmit ? 'true' : 'false'));
        log_message('debug', 'hasPartyData boolean: ' . ($hasPartyData ? 'true' : 'false'));
        
        // Set initial status (default to draft if nothing matches)
        $initialStatus = 'draft';
        
        if ($shouldSubmit) {
            if ($hasPartyData) {
                // OB officers submit directly (no approval needed)
                $initialStatus = 'approved';
            } else {
                // No parties - needs investigator to identify them
                $initialStatus = 'pending_parties';
            }
        }
        
        log_message('debug', 'Final initialStatus: ' . $initialStatus);
        
        $data = [
            'center_id' => (int)$centerId,
            'incident_date' => $input['incident_date'] ?? null,
            'incident_location' => $input['incident_location'] ?? null,
            'incident_description' => $input['incident_description'] ?? null,
            'crime_type' => $input['crime_type'] ?? null,
            'crime_category' => $input['crime_category'] ?? null,
            'priority' => $input['priority'] ?? 'medium',
            'is_sensitive' => (int)($input['is_sensitive'] ?? 0),
            'status' => (string)$initialStatus,
            'created_by' => (int)$userId
        ];
        
        // Set submitted_at if submitting
        if ($shouldSubmit) {
            $data['submitted_at'] = date('Y-m-d H:i:s');
        }
        
        log_message('info', 'Creating incident case - shouldSubmit: ' . ($shouldSubmit ? 'true' : 'false'));
        log_message('info', 'Creating incident case - hasPartyData: ' . ($hasPartyData ? 'true' : 'false'));
        log_message('info', 'Creating incident case - initialStatus: ' . $initialStatus);
        log_message('info', 'Creating incident case - status field value: ' . var_export($data['status'], true));
        log_message('info', 'Creating incident case - status is empty string?: ' . (($data['status'] === '') ? 'YES' : 'NO'));
        log_message('info', 'Creating incident case with data: ' . json_encode($data));
        
        $caseModel = model('App\Models\CaseModel');
        $personModel = model('App\Models\PersonModel');
        
        $db = \Config\Database::connect();
        $db->transStart();
        
        try {
            // CRITICAL FIX: Ensure status is never empty before insert
            if (empty($data['status']) || $data['status'] === '' || $data['status'] === null) {
                log_message('warning', 'Status was empty/null before insert, forcing to draft');
                $data['status'] = 'draft';
            }
            
            // Create the case
            log_message('debug', 'About to call $caseModel->insert() with status: ' . var_export($data['status'], true));
            $caseId = $caseModel->insert($data);
            log_message('debug', 'After insert, caseId: ' . ($caseId ?: 'FALSE'));
            
            if (!$caseId) {
                $errors = $caseModel->errors();
                log_message('error', 'Incident case insertion failed with validation errors: ' . json_encode($errors));
                $db->transRollback();
                return $this->fail(['error' => 'Failed to create incident case', 'validation_errors' => $errors], 500);
            }
            
            // If party data is provided, create person and add to case
            if (isset($input['party']) && is_array($input['party'])) {
                $partyData = $input['party'];
                
                log_message('info', 'Adding party to incident case: ' . json_encode($partyData));
                
                // Handle photo upload if present
                $photoPath = null;
                $photoFile = $this->request->getFile('party_photo');
                
                if ($photoFile && $photoFile->isValid() && !$photoFile->hasMoved()) {
                    try {
                        // Validate file type
                        if (!in_array($photoFile->getMimeType(), ['image/jpeg', 'image/jpg', 'image/png'])) {
                            log_message('error', 'Invalid photo file type: ' . $photoFile->getMimeType());
                        } else {
                            // Generate unique filename
                            $newName = $photoFile->getRandomName();
                            
                            // Move file to uploads/persons directory
                            $uploadPath = WRITEPATH . 'uploads/persons';
                            if (!is_dir($uploadPath)) {
                                mkdir($uploadPath, 0755, true);
                            }
                            
                            if ($photoFile->move($uploadPath, $newName)) {
                                $photoPath = 'writable/uploads/persons/' . $newName;
                                log_message('info', 'Party photo uploaded successfully: ' . $photoPath);
                            }
                        }
                    } catch (\Exception $e) {
                        log_message('error', 'Photo upload failed: ' . $e->getMessage());
                    }
                }
                
                // Create person record
                $personData = [
                    'person_type' => $partyData['role'] ?? 'victim', // victim or accused
                    'first_name' => $partyData['first_name'] ?? null,
                    'middle_name' => $partyData['middle_name'] ?? null,
                    'last_name' => $partyData['last_name'] ?? null,
                    'gender' => $partyData['gender'] ?? null,
                    'phone' => $partyData['phone'] ?? null,
                    'national_id' => $partyData['national_id'] ?? null,
                    'address' => $partyData['address'] ?? null,
                    'photo_path' => $photoPath,
                    'created_by' => $userId
                ];
                
                $personId = $personModel->insert($personData);
                
                if ($personId) {
                    // Link person to case
                    $db->table('case_parties')->insert([
                        'case_id' => $caseId,
                        'person_id' => $personId,
                        'party_role' => $partyData['role'] ?? 'victim',
                        'is_primary' => 1,
                        'created_at' => date('Y-m-d H:i:s')
                    ]);
                    
                    log_message('info', 'Party added successfully to incident case');
                }
            }
            
            $db->transComplete();
            
            if ($db->transStatus() === false) {
                log_message('error', 'Transaction failed for incident case creation');
                return $this->fail('Failed to create incident case', 500);
            }
            
            // Get the created case details
            $case = $caseModel->find($caseId);
            
            // If should submit, notify admin
            if ($shouldSubmit) {
                $hasParties = isset($input['party']) && is_array($input['party']);
                
                if ($hasParties) {
                    $message = 'Incident submitted successfully. Admin can now assign investigator.';
                } else {
                    $message = 'Incident submitted. Admin will assign investigator to identify parties.';
                }
                
                // Notify admin
                try {
                    $admins = model('App\Models\UserModel')->getUsersByCenter((int)$centerId, 'admin');
                    $db = \Config\Database::connect();
                    
                    foreach ($admins as $admin) {
                        $caseNumber = isset($case['case_number']) ? $case['case_number'] : 'N/A';
                        
                        $db->table('notifications')->insert([
                            'user_id' => (int)$admin['id'],
                            'notification_type' => $hasParties ? 'case_submitted' : 'system_alert',
                            'title' => $hasParties ? 'New Incident Case Submitted' : 'Incident Reported (No Parties)',
                            'message' => "Incident case {$caseNumber} has been " . ($hasParties ? 'submitted and is ready for investigator assignment' : 'reported and needs investigator assignment'),
                            'link_entity_type' => 'cases',
                            'link_entity_id' => (int)$caseId,
                            'link_url' => '/cases/view/' . $caseId,
                            'priority' => 'medium',
                            'is_read' => 0,
                            'created_at' => date('Y-m-d H:i:s')
                        ]);
                    }
                } catch (\Exception $e) {
                    log_message('error', 'Notification creation failed: ' . $e->getMessage());
                    // Don't fail the whole request if notification fails
                }
            } else {
                $message = isset($input['party']) 
                    ? 'Incident saved as draft with party information.' 
                    : 'Incident saved as draft. You can add parties and submit later.';
            }
            
            return $this->respondCreated([
                'status' => 'success',
                'message' => $message,
                'data' => $case
            ]);
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', 'Incident case creation exception: ' . $e->getMessage());
            return $this->fail(['error' => 'Failed to create incident case', 'message' => $e->getMessage()], 500);
        }
    }

}
