<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;
use App\Models\NonCriminalCertificateModel;
use App\Models\PersonModel;

class CertificateController extends ResourceController
{
    protected $modelName = 'App\Models\NonCriminalCertificateModel';
    protected $format = 'json';

    /**
     * Create a new non-criminal certificate
     * POST /investigation/certificates
     */
    public function create()
    {
        // Get user ID from request (set by AuthFilter)
        $userId = $this->request->userId ?? $GLOBALS['current_user']['id'] ?? null;
        
        if (!$userId) {
            return $this->fail('User authentication failed', 401);
        }
        
        $data = $this->request->getJSON(true);
        
        // Validation rules
        $rules = [
            'certificate_number' => 'required|max_length[100]',
            'person_name' => 'required|max_length[255]',
            'gender' => 'required|in_list[MALE,FEMALE,male,female]',
            'issue_date' => 'required|valid_date',
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        // Generate unique verification token
        $verificationToken = bin2hex(random_bytes(32));
        
        $certificateData = [
            'certificate_number' => $data['certificate_number'],
            'person_id' => $data['person_id'] ?? null,
            'person_name' => $data['person_name'],
            'mother_name' => $data['mother_name'] ?? null,
            'gender' => strtoupper($data['gender']),
            'birth_date' => $data['birth_date'] ?? null,
            'birth_place' => $data['birth_place'] ?? null,
            'photo_path' => $data['photo_path'] ?? null,
            'purpose' => $data['purpose'] ?? null,
            'validity_period' => $data['validity_period'] ?? '6 months',
            'issue_date' => $data['issue_date'],
            'director_name' => $data['director_name'] ?? null,
            'director_signature' => $data['director_signature'] ?? null,
            'issued_by' => $userId,
            'verification_token' => $verificationToken,
            'notes' => $data['notes'] ?? null,
        ];
        
        try {
            // Detailed error logging
            log_message('info', 'Attempting to create certificate with data: ' . json_encode($certificateData));
            
            $certificateId = $this->model->insert($certificateData);
            
            if (!$certificateId) {
                $errors = $this->model->errors();
                log_message('error', 'Model insert failed. Errors: ' . json_encode($errors));
                return $this->fail([
                    'message' => 'Failed to create certificate',
                    'errors' => $errors
                ], 500);
            }
            
            // Get the created certificate
            $certificate = $this->model->find($certificateId);
            
            // Generate verification URL
            $baseUrl = base_url();
            $verificationUrl = $baseUrl . 'verify-certificate/' . $verificationToken;
            
            log_message('info', 'Certificate created successfully with ID: ' . $certificateId);
            
            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Certificate created successfully',
                'data' => [
                    'certificate' => $certificate,
                    'verification_url' => $verificationUrl,
                    'verification_token' => $verificationToken
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Certificate creation exception: ' . $e->getMessage());
            log_message('error', 'Stack trace: ' . $e->getTraceAsString());
            return $this->fail('Failed to create certificate: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all certificates for the current user
     * GET /investigation/certificates
     */
    public function index()
    {
        // Get user info from request (set by AuthFilter)
        $userId = $this->request->userId ?? $GLOBALS['current_user']['id'] ?? null;
        $userRole = $this->request->userRole ?? $GLOBALS['current_user']['userRole'] ?? null;
        
        if (!$userId) {
            return $this->fail('User authentication failed', 401);
        }
        
        try {
            // Admin and Super Admin can see all certificates
            if (in_array($userRole, ['admin', 'super_admin'])) {
                $certificates = $this->model->orderBy('created_at', 'DESC')->findAll();
            } else {
                // Others see only their own certificates
                $certificates = $this->model->where('issued_by', $userId)
                                           ->orderBy('created_at', 'DESC')
                                           ->findAll();
            }
            
            return $this->respond([
                'status' => 'success',
                'data' => $certificates
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Certificate listing error: ' . $e->getMessage());
            return $this->fail('Failed to retrieve certificates', 500);
        }
    }

    /**
     * Get a single certificate
     * GET /investigation/certificates/{id}
     */
    public function show($id = null)
    {
        try {
            $certificate = $this->model->find($id);
            
            if (!$certificate) {
                return $this->failNotFound('Certificate not found');
            }
            
            return $this->respond([
                'status' => 'success',
                'data' => $certificate
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Certificate retrieval error: ' . $e->getMessage());
            return $this->fail('Failed to retrieve certificate', 500);
        }
    }

    /**
     * Update a certificate
     * PUT /investigation/certificates/{id}
     */
    public function update($id = null)
    {
        log_message('info', 'Certificate UPDATE request for ID: ' . $id);
        
        try {
            $certificate = $this->model->find($id);
            
            if (!$certificate) {
                log_message('error', 'Certificate not found: ' . $id);
                return $this->failNotFound('Certificate not found');
            }
            
            log_message('info', 'Found certificate: ' . $id);
            
            $data = $this->request->getJSON(true);
            log_message('info', 'Update data received: ' . json_encode($data));
            
            $updateData = [];
            $allowedFields = [
                'person_name', 'mother_name', 'gender', 'birth_date', 
                'birth_place', 'photo_path', 'purpose', 'validity_period',
                'director_name', 'director_signature', 'notes', 'is_active'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (empty($updateData)) {
                log_message('warning', 'No valid fields to update');
                return $this->fail('No valid fields to update', 400);
            }
            
            log_message('info', 'Updating with data: ' . json_encode($updateData));
            
            $result = $this->model->update($id, $updateData);
            
            if (!$result) {
                $errors = $this->model->errors();
                log_message('error', 'Model update failed: ' . json_encode($errors));
                return $this->fail([
                    'message' => 'Failed to update certificate',
                    'errors' => $errors
                ], 500);
            }
            
            log_message('info', 'Certificate updated successfully');
            
            $updatedCertificate = $this->model->find($id);
            
            // Generate verification URL
            $baseUrl = base_url();
            $verificationUrl = $baseUrl . 'verify-certificate/' . $updatedCertificate['verification_token'];
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Certificate updated successfully',
                'data' => [
                    'certificate' => $updatedCertificate,
                    'verification_url' => $verificationUrl,
                    'verification_token' => $updatedCertificate['verification_token']
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Certificate update exception: ' . $e->getMessage());
            log_message('error', 'Stack trace: ' . $e->getTraceAsString());
            return $this->fail('Failed to update certificate: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a certificate
     * DELETE /investigation/certificates/{id}
     */
    public function delete($id = null)
    {
        try {
            $certificate = $this->model->find($id);
            
            if (!$certificate) {
                return $this->failNotFound('Certificate not found');
            }
            
            $this->model->delete($id);
            
            return $this->respondDeleted([
                'status' => 'success',
                'message' => 'Certificate deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Certificate deletion error: ' . $e->getMessage());
            return $this->fail('Failed to delete certificate', 500);
        }
    }

    /**
     * Verify a certificate by token (public access)
     * GET /verify-certificate/{token}
     */
    public function verify($token = null)
    {
        if (!$token) {
            return $this->fail('Verification token is required', 400);
        }
        
        // Check if this is a browser request (HTML) or API request (JSON)
        $acceptHeader = $this->request->getHeaderLine('Accept');
        $isBrowserRequest = strpos($acceptHeader, 'text/html') !== false || 
                           strpos($acceptHeader, 'application/xhtml') !== false;
        
        // If browser request, serve the HTML page
        if ($isBrowserRequest) {
            $htmlPath = FCPATH . 'verify-certificate.html';
            if (file_exists($htmlPath)) {
                return $this->response->setBody(file_get_contents($htmlPath))
                                     ->setContentType('text/html');
            }
        }
        
        // Otherwise, return JSON data for API calls
        try {
            $certificate = $this->model->where('verification_token', $token)->first();
            
            if (!$certificate) {
                return $this->respond([
                    'status' => 'error',
                    'message' => 'Certificate not found or invalid token',
                    'valid' => false
                ], 404);
            }
            
            // Update verification count and timestamp
            $this->model->update($certificate['id'], [
                'verification_count' => $certificate['verification_count'] + 1,
                'last_verified_at' => date('Y-m-d H:i:s')
            ]);
            
            // Check if certificate is active
            if (!$certificate['is_active']) {
                return $this->respond([
                    'status' => 'warning',
                    'message' => 'This certificate has been revoked or is no longer active',
                    'valid' => false,
                    'data' => [
                        'certificate_number' => $certificate['certificate_number'],
                        'person_name' => $certificate['person_name'],
                        'issue_date' => $certificate['issue_date']
                    ]
                ]);
            }
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Certificate verified successfully',
                'valid' => true,
                'data' => $certificate
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Certificate verification error: ' . $e->getMessage());
            return $this->fail('Failed to verify certificate', 500);
        }
    }

    /**
     * Get verification URL for a certificate
     * GET /investigation/certificates/{id}/verification-url
     */
    public function getVerificationUrl($id = null)
    {
        try {
            $certificate = $this->model->find($id);
            
            if (!$certificate) {
                return $this->failNotFound('Certificate not found');
            }
            
            $baseUrl = base_url();
            $verificationUrl = $baseUrl . '/verify-certificate/' . $certificate['verification_token'];
            
            return $this->respond([
                'status' => 'success',
                'data' => [
                    'verification_url' => $verificationUrl,
                    'verification_token' => $certificate['verification_token']
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Verification URL retrieval error: ' . $e->getMessage());
            return $this->fail('Failed to retrieve verification URL', 500);
        }
    }
}
