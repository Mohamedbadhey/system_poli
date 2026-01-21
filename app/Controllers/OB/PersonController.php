<?php

namespace App\Controllers\OB;

use CodeIgniter\RESTful\ResourceController;

class PersonController extends ResourceController
{
    protected $modelName = 'App\\Models\\PersonModel';
    protected $format = 'json';
    
    /**
     * Get all persons (with case count and custody status)
     */
    public function index()
    {
        $personModel = model('App\\Models\\PersonModel');
        
        // Get all persons with additional info
        $persons = $personModel->select('persons.*, 
                COUNT(DISTINCT cp.case_id) as case_count,
                cr.custody_status,
                cr.custody_location,
                cr.custody_start')
            ->join('case_parties cp', 'cp.person_id = persons.id', 'left')
            ->join('custody_records cr', 'cr.person_id = persons.id AND cr.custody_status IN ("in_custody", "bailed")', 'left')
            ->groupBy('persons.id')
            ->orderBy('persons.created_at', 'DESC')
            ->findAll();
        
        return $this->respond([
            'status' => 'success',
            'data' => $persons
        ]);
    }
    
    /**
     * Create new person record
     */
    public function create()
    {
        $rules = [
            'person_type' => 'required|in_list[accused,accuser,witness,other]',
            'first_name' => 'required|max_length[100]',
            'last_name' => 'required|max_length[100]',
            'case_id' => 'required|integer'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        // Get input data (works for both JSON and form-data)
        // Check if it's a file upload (multipart/form-data)
        $contentType = $this->request->getHeaderLine('Content-Type');
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $input = $this->request->getPost();
        } else {
            // Try to get JSON, if that fails, get POST
            try {
                $input = $this->request->getJSON(true);
            } catch (\Exception $e) {
                $input = $this->request->getPost();
            }
        }
        
        if (empty($input)) {
            $input = $this->request->getPost();
        }
        
        $personData = [
            'person_type' => $input['person_type'] ?? null,
            'first_name' => $input['first_name'] ?? null,
            'middle_name' => $input['middle_name'] ?? null,
            'last_name' => $input['last_name'] ?? null,
            'date_of_birth' => $input['date_of_birth'] ?? null,
            'gender' => $input['gender'] ?? null,
            'national_id' => $input['national_id'] ?? null,
            'phone' => $input['phone'] ?? null,
            'email' => $input['email'] ?? null,
            'address' => $input['address'] ?? null,
            'gps_latitude' => $input['gps_latitude'] ?? null,
            'gps_longitude' => $input['gps_longitude'] ?? null,
            'created_by' => $this->request->userId
        ];
        
        // Handle photo upload
        $photoFile = $this->request->getFile('photo');
        if ($photoFile && $photoFile->isValid() && !$photoFile->hasMoved()) {
            // Validate file - check if it's an image
            $mimeType = $photoFile->getMimeType();
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            
            if (!in_array($mimeType, $allowedTypes)) {
                return $this->fail('Uploaded file must be an image (JPEG, PNG, GIF, or WebP)', 400);
            }
            
            // Check file size (5MB max)
            if ($photoFile->getSize() > 5 * 1024 * 1024) {
                return $this->fail('Image file size must be less than 5MB', 400);
            }
            
            // Generate unique filename
            $newName = $photoFile->getRandomName();
            
            // Move file to uploads directory
            $uploadPath = WRITEPATH . 'uploads/persons/';
            
            // Create directory if it doesn't exist
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            
            if ($photoFile->move($uploadPath, $newName)) {
                // Copy to public folder so it's web-accessible
                $publicPath = FCPATH . 'uploads/persons/';
                if (!is_dir($publicPath)) {
                    mkdir($publicPath, 0755, true);
                }
                copy($uploadPath . $newName, $publicPath . $newName);
                
                // Store web-accessible path
                $personData['photo_path'] = 'uploads/persons/' . $newName;
                log_message('info', 'Photo uploaded successfully: ' . $personData['photo_path']);
            } else {
                log_message('error', 'Failed to move uploaded photo');
            }
        }
        
        // Handle fingerprint data
        $fingerprintData = $input['fingerprint_data'] ?? null;
        if ($fingerprintData) {
            $fingerprintHash = hash('sha256', $fingerprintData);
            
            // Check if fingerprint already exists
            $personModel = model('App\Models\PersonModel');
            $existingPerson = $personModel->findByFingerprint($fingerprintHash);
            
            if ($existingPerson) {
                // Link existing person to case
                $caseId = $input['case_id'];
                $this->linkPersonToCase($existingPerson['id'], $caseId, $personData['person_type']);
                
                return $this->respond([
                    'status' => 'success',
                    'message' => 'Existing person found and linked to case',
                    'data' => $existingPerson,
                    'existing_person' => true
                ]);
            }
            
            $personData['fingerprint_hash'] = $fingerprintHash;
            $personData['fingerprint_data'] = base64_encode($fingerprintData);
        }
        
        $personModel = model('App\Models\PersonModel');
        
        try {
            $personId = $personModel->insert($personData);
            
            if (!$personId) {
                $errors = $personModel->errors();
                log_message('error', 'Person insertion failed with validation errors: ' . json_encode($errors));
                return $this->fail(['error' => 'Failed to create person record', 'validation_errors' => $errors], 500);
            }
            
            // Link person to case
            $caseId = $input['case_id'];
            $this->linkPersonToCase($personId, $caseId, $personData['person_type']);
        } catch (\Exception $e) {
            log_message('error', 'Person creation exception: ' . $e->getMessage());
            return $this->fail(['error' => 'Failed to create person record', 'message' => $e->getMessage()], 500);
        }
        
        $person = $personModel->find($personId);
        
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Person created and linked to case',
            'data' => $person
        ]);
    }
    
    /**
     * Search by fingerprint
     */
    public function searchByFingerprint()
    {
        $fingerprintData = $this->request->getPost('fingerprint_data');
        
        if (!$fingerprintData) {
            return $this->fail('Fingerprint data is required', 400);
        }
        
        $fingerprintHash = hash('sha256', $fingerprintData);
        
        $personModel = model('App\Models\PersonModel');
        $person = $personModel->findByFingerprint($fingerprintHash);
        
        if (!$person) {
            return $this->respond([
                'status' => 'success',
                'message' => 'No match found',
                'data' => null
            ]);
        }
        
        // Get full profile with criminal history
        $fullProfile = $personModel->getFullProfile($person['id']);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Match found',
            'data' => $fullProfile
        ]);
    }
    
    /**
     * Get person details
     */
    public function show($id = null)
    {
        $personModel = model('App\Models\PersonModel');
        $person = $personModel->getFullProfile($id);
        
        if (!$person) {
            return $this->failNotFound('Person not found');
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $person
        ]);
    }
    
    /**
     * Update person details
     */
    public function update($id = null)
    {
        $personModel = model('App\\Models\\PersonModel');
        $person = $personModel->find($id);
        
        if (!$person) {
            return $this->failNotFound('Person not found');
        }
        
        $input = $this->request->getJSON(true) ?: $this->request->getPost();
        
        $updateData = [
            'first_name' => $input['first_name'] ?? $person['first_name'],
            'middle_name' => $input['middle_name'] ?? $person['middle_name'],
            'last_name' => $input['last_name'] ?? $person['last_name'],
            'national_id' => $input['national_id'] ?? $person['national_id'],
            'phone' => $input['phone'] ?? $person['phone'],
            'email' => $input['email'] ?? $person['email'],
            'gender' => $input['gender'] ?? $person['gender'],
            'date_of_birth' => $input['date_of_birth'] ?? $person['date_of_birth'],
            'address' => $input['address'] ?? $person['address']
        ];
        
        $personModel->update($id, $updateData);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Person updated successfully',
            'data' => $personModel->find($id)
        ]);
    }
    
    /**
     * Get person's connected cases
     */
    public function cases($id = null)
    {
        $db = \Config\Database::connect();
        
        $cases = $db->table('case_parties cp')
            ->select('cp.party_role, c.id as case_id, c.case_number, c.crime_type, c.status, c.created_at')
            ->join('cases c', 'c.id = cp.case_id')
            ->where('cp.person_id', $id)
            ->orderBy('c.created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $cases
        ]);
    }
    
    /**
     * Get person's custody records
     */
    public function custody($id = null)
    {
        $db = \Config\Database::connect();
        
        $custody = $db->table('custody_records cr')
            ->select('cr.*, c.case_number')
            ->join('cases c', 'c.id = cr.case_id')
            ->where('cr.person_id', $id)
            ->orderBy('cr.created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $custody
        ]);
    }
    
    /**
     * Get criminal history
     */
    public function criminalHistory($id = null)
    {
        $personModel = model('App\Models\PersonModel');
        $history = $personModel->getCriminalHistory($id);
        
        return $this->respond([
            'status' => 'success',
            'data' => $history
        ]);
    }
    
    /**
     * Get all bailers (persons with type 'other')
     */
    public function bailers()
    {
        $db = \Config\Database::connect();
        
        $bailers = $db->table('persons p')
            ->select('p.*, COUNT(DISTINCT cp.case_id) as case_count')
            ->join('case_parties cp', 'cp.person_id = p.id', 'left')
            ->where('p.person_type', 'other')
            ->groupBy('p.id')
            ->orderBy('p.created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        // Get bail information for each bailer
        foreach ($bailers as &$bailer) {
            $bailedPersons = $db->table('custody_records cr')
                ->select('cr.id as custody_id, CONCAT(p.first_name, " ", p.last_name) as bailed_person_name, 
                         c.case_number, cr.custody_status, cr.custody_notes')
                ->join('persons p', 'p.id = cr.person_id')
                ->join('cases c', 'c.id = cr.case_id')
                ->where('cr.custody_status', 'released')
                ->like('cr.custody_notes', $bailer['first_name'] . ' ' . $bailer['last_name'])
                ->get()
                ->getResultArray();
            
            $bailer['bailed_persons'] = $bailedPersons;
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $bailers
        ]);
    }
    
    /**
     * Link person to case
     */
    private function linkPersonToCase(int $personId, int $caseId, string $partyRole)
    {
        $db = \Config\Database::connect();
        
        // Check if link already exists
        $existing = $db->table('case_parties')
            ->where('case_id', $caseId)
            ->where('person_id', $personId)
            ->where('party_role', $partyRole)
            ->get()
            ->getRowArray();
        
        if ($existing) {
            return true;
        }
        
        $db->table('case_parties')->insert([
            'case_id' => $caseId,
            'person_id' => $personId,
            'party_role' => $partyRole,
            'is_primary' => 1
        ]);
        
        // Update repeat offender status if accused
        if ($partyRole === 'accused') {
            $personModel = model('App\Models\PersonModel');
            $personModel->updateRepeatOffenderStatus($personId);
        }
        
        return true;
    }
}
