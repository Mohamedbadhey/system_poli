<?php

namespace App\Controllers\Investigation;

use App\Controllers\BaseController;
use App\Models\MedicalExaminationFormModel;
use CodeIgniter\HTTP\ResponseInterface;

class MedicalFormController extends BaseController
{
    protected $medicalFormModel;

    public function __construct()
    {
        $this->medicalFormModel = new MedicalExaminationFormModel();
    }

    /**
     * Get all medical forms
     * GET /investigation/medical-forms
     */
    public function index()
    {
        try {
            $user = $this->request->user ?? $GLOBALS['current_user']['user'] ?? null;
            
            if (!$user || !isset($user['id'])) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'User not authenticated'
                ])->setStatusCode(401);
            }
            
            // Admin can see all, others see only their own
            if (in_array($user['role'], ['admin', 'super_admin'])) {
                $forms = $this->medicalFormModel->orderBy('created_at', 'DESC')->findAll();
            } else {
                $forms = $this->medicalFormModel->where('created_by', $user['id'])
                                               ->orderBy('created_at', 'DESC')
                                               ->findAll();
            }
            
            return $this->response->setJSON([
                'status' => 'success',
                'data' => $forms
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Medical forms listing error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve medical forms'
            ])->setStatusCode(500);
        }
    }
    
    /**
     * Get a single medical form by ID
     * GET /investigation/medical-forms/{id}
     */
    public function show($id = null)
    {
        try {
            if (!$id) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Medical form ID is required'
                ])->setStatusCode(400);
            }
            
            $form = $this->medicalFormModel->find($id);
            
            if (!$form) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Medical form not found'
                ])->setStatusCode(404);
            }
            
            return $this->response->setJSON([
                'status' => 'success',
                'data' => $form
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Medical form retrieval error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve medical form'
            ])->setStatusCode(500);
        }
    }

    /**
     * Save medical examination form (create or update)
     */
    public function save()
    {
        try {
            // Get user from request or global variable
            $user = $this->request->user ?? $GLOBALS['current_user']['user'] ?? null;
            
            if (!$user || !isset($user['id'])) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'User not authenticated'
                ])->setStatusCode(401);
            }
            
            $formId = $this->request->getPost('id'); // Check if updating existing form
            
            // Get JSON body for POST requests
            $json = $this->request->getJSON(true);
            
            // Debug logging
            log_message('debug', 'Medical form save - POST data: ' . json_encode($this->request->getPost()));
            log_message('debug', 'Medical form save - JSON data: ' . json_encode($json));
            
            // Try to get data from JSON body first, then fall back to POST
            $data = [
                'case_id' => $json['case_id'] ?? $this->request->getPost('case_id'),
                'person_id' => $json['person_id'] ?? $this->request->getPost('person_id'),
                'case_number' => $json['case_number'] ?? $this->request->getPost('case_number'),
                'patient_name' => $json['patient_name'] ?? $this->request->getPost('patient_name'),
                'party_type' => $json['party_type'] ?? $this->request->getPost('party_type'),
                'form_data' => $json['form_data'] ?? $this->request->getPost('form_data'),
                'report_date' => $json['report_date'] ?? $this->request->getPost('report_date'),
                'hospital_name' => $json['hospital_name'] ?? $this->request->getPost('hospital_name'),
                'examination_date' => $json['examination_date'] ?? $this->request->getPost('examination_date'),
                'created_by' => $user['id']
            ];

            log_message('debug', 'Medical form data after merge: ' . json_encode($data));

            // Validate required fields
            if (empty($data['case_id']) || empty($data['patient_name'])) {
                log_message('error', 'Validation failed - case_id: ' . ($data['case_id'] ?? 'NULL') . ', patient_name: ' . ($data['patient_name'] ?? 'NULL'));
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Case ID and patient name are required',
                    'debug' => [
                        'case_id_received' => $data['case_id'] ?? null,
                        'patient_name_received' => $data['patient_name'] ?? null
                    ]
                ])->setStatusCode(400);
            }

            // Update existing form or create new
            if ($formId) {
                // Check if form exists and user has permission
                $existingForm = $this->medicalFormModel->find($formId);
                if (!$existingForm) {
                    return $this->response->setJSON([
                        'status' => 'error',
                        'message' => 'Medical form not found'
                    ])->setStatusCode(404);
                }

                // Only creator or admin can update
                if ($existingForm['created_by'] !== $user['id'] && !in_array($user['role'], ['admin', 'super_admin'])) {
                    return $this->response->setJSON([
                        'status' => 'error',
                        'message' => 'Unauthorized to update this form'
                    ])->setStatusCode(403);
                }

                $this->medicalFormModel->update($formId, $data);
                $resultId = $formId;
                $message = 'Medical form updated successfully';
            } else {
                $resultId = $this->medicalFormModel->insert($data);
                $message = 'Medical form saved successfully';
            }

            if ($resultId) {
                // Generate QR code and verification code
                $this->generateQRCode($resultId);
                
                // Get the saved form with details
                $savedForm = $this->medicalFormModel->getFormWithDetails($resultId);
                
                return $this->response->setJSON([
                    'status' => 'success',
                    'message' => $message,
                    'data' => $savedForm
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Failed to save medical form'
                ])->setStatusCode(500);
            }

        } catch (\Exception $e) {
            log_message('error', 'Medical form save error: ' . $e->getMessage());
            log_message('error', 'Stack trace: ' . $e->getTraceAsString());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'An error occurred while saving the form',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ])->setStatusCode(500);
        }
    }

    /**
     * Get medical forms by case ID
     */
    public function getByCaseId($caseId)
    {
        try {
            $forms = $this->medicalFormModel
                ->where('case_id', $caseId)
                ->orderBy('created_at', 'DESC')
                ->findAll();

            return $this->response->setJSON([
                'status' => 'success',
                'data' => $forms
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Medical form fetch error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve medical forms'
            ])->setStatusCode(500);
        }
    }

    /**
     * Get medical form by ID
     */
    public function getById($formId)
    {
        try {
            $form = $this->medicalFormModel->find($formId);

            if (!$form) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Medical form not found'
                ])->setStatusCode(404);
            }

            return $this->response->setJSON([
                'status' => 'success',
                'data' => $form
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Medical form fetch error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve medical form'
            ])->setStatusCode(500);
        }
    }

    /**
     * Get medical forms by person ID
     */
    public function getByPersonId($personId)
    {
        try {
            $forms = $this->medicalFormModel
                ->where('person_id', $personId)
                ->orderBy('created_at', 'DESC')
                ->findAll();

            return $this->response->setJSON([
                'status' => 'success',
                'data' => $forms
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Medical form fetch error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve medical forms'
            ])->setStatusCode(500);
        }
    }

    /**
     * Get all medical forms for current user
     */
    public function getMyForms()
    {
        try {
            // Get user from request or global variable
            $user = $this->request->user ?? $GLOBALS['current_user']['user'] ?? null;
            
            if (!$user || !isset($user['id'])) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'User not authenticated'
                ])->setStatusCode(401);
            }
            
            $forms = $this->medicalFormModel
                ->select('medical_examination_forms.*, cases.case_number, cases.incident_description as case_description')
                ->join('cases', 'cases.id = medical_examination_forms.case_id', 'left')
                ->where('medical_examination_forms.created_by', $user['id'])
                ->orderBy('medical_examination_forms.updated_at', 'DESC')
                ->findAll();

            return $this->response->setJSON([
                'status' => 'success',
                'data' => $forms
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Medical form fetch error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve medical forms: ' . $e->getMessage()
            ])->setStatusCode(500);
        }
    }

    /**
     * Delete medical form
     */
    public function delete($formId)
    {
        try {
            // Get user from request or global variable
            $user = $this->request->user ?? $GLOBALS['current_user']['user'] ?? null;
            
            if (!$user || !isset($user['id'])) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'User not authenticated'
                ])->setStatusCode(401);
            }
            
            $form = $this->medicalFormModel->find($formId);
            
            if (!$form) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Medical form not found'
                ])->setStatusCode(404);
            }

            // Only creator or admin can delete
            if ($form['created_by'] !== $user['id'] && !in_array($user['role'], ['admin', 'super_admin'])) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Unauthorized to delete this form'
                ])->setStatusCode(403);
            }

            $this->medicalFormModel->delete($formId);

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'Medical form deleted successfully'
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Medical form delete error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to delete medical form'
            ])->setStatusCode(500);
        }
    }

    /**
     * Generate QR code for medical form
     */
    private function generateQRCode($formId)
    {
        try {
            log_message('info', "=== STARTING QR CODE GENERATION for Form ID: {$formId} ===");
            
            $form = $this->medicalFormModel->find($formId);
            
            if (!$form) {
                log_message('error', "Form not found for QR generation: {$formId}");
                return false;
            }
            
            log_message('info', "Form found. Current verification_code: " . ($form['verification_code'] ?? 'NULL'));
            
            // Generate unique verification code if not exists
            if (empty($form['verification_code'])) {
                $verificationCode = 'MED-' . str_pad($formId, 8, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(md5($formId . $form['case_number'] . $form['created_at']), 0, 6));
                
                log_message('info', "Generated verification code: {$verificationCode}");
                
                // Create QR code URL - Direct link to HTML page with database ID
                $baseUrl = rtrim(base_url(), '/');
                $qrUrl = $baseUrl . '/assets/pages/medical-examination-report.html?view=' . $formId;
                
                log_message('info', "QR URL: {$qrUrl}");
                
                // Generate QR code image using Google Charts API
                $qrCodeUrl = 'https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=' . urlencode($qrUrl) . '&choe=UTF-8';
                
                log_message('info', "QR Code Image URL: {$qrCodeUrl}");
                
                try {
                    // Update form with QR code and verification code
                    $updateResult = $this->medicalFormModel->update($formId, [
                        'qr_code' => $qrCodeUrl,
                        'verification_code' => $verificationCode
                    ]);
                    
                    if ($updateResult) {
                        log_message('info', "✓ QR code successfully saved to database for form ID: {$formId}");
                    } else {
                        log_message('error', "✗ Failed to update form with QR code. Update returned false.");
                    }
                } catch (\Exception $updateEx) {
                    log_message('error', "✗ Database update failed: " . $updateEx->getMessage());
                    log_message('error', "This usually means the qr_code or verification_code columns don't exist!");
                    throw $updateEx;
                }
                
                log_message('info', "QR code generated for medical form ID: {$formId}, Code: {$verificationCode}");
            } else {
                log_message('info', "QR code already exists for form ID: {$formId}");
            }
            
            return true;
            
        } catch (\Exception $e) {
            log_message('error', 'QR code generation error: ' . $e->getMessage());
            log_message('error', 'Stack trace: ' . $e->getTraceAsString());
            return false;
        }
    }

    /**
     * Get form by ID for public viewing (no auth required for QR code verification)
     * GET /medical-forms/public/(:num)
     */
    public function getByIdPublic($formId = null)
    {
        try {
            if (!$formId) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Form ID is required'
                ])->setStatusCode(400);
            }
            
            $form = $this->medicalFormModel->find($formId);
            
            if (!$form) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Medical form not found'
                ])->setStatusCode(404);
            }
            
            // Get case details if available
            if ($form['case_id']) {
                $db = \Config\Database::connect();
                $case = $db->table('cases')
                    ->select('case_number, incident_description, incident_location')
                    ->where('id', $form['case_id'])
                    ->get()
                    ->getRowArray();
                
                if ($case) {
                    $form['case_number'] = $case['case_number'];
                    $form['case_description'] = $case['incident_description'];
                    $form['case_location'] = $case['incident_location'];
                }
            }
            
            // Get person details if available
            if ($form['person_id']) {
                $db = \Config\Database::connect();
                $person = $db->table('persons')
                    ->select('first_name, middle_name, last_name, gender, date_of_birth, national_id')
                    ->where('id', $form['person_id'])
                    ->get()
                    ->getRowArray();
                
                if ($person) {
                    $form['person_full_name'] = trim($person['first_name'] . ' ' . ($person['middle_name'] ?? '') . ' ' . $person['last_name']);
                    $form['person_gender'] = $person['gender'];
                    $form['person_dob'] = $person['date_of_birth'];
                    $form['person_national_id'] = $person['national_id'];
                }
            }
            
            return $this->response->setJSON([
                'status' => 'success',
                'data' => $form
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Medical form public fetch error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve medical form'
            ])->setStatusCode(500);
        }
    }
    
    /**
     * Verify medical form by code (public endpoint)
     */
    public function verify()
    {
        try {
            $verificationCode = $this->request->getGet('code');
            
            if (empty($verificationCode)) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Verification code is required'
                ])->setStatusCode(400);
            }
            
            $form = $this->medicalFormModel->where('verification_code', $verificationCode)->first();
            
            if (!$form) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Medical form not found'
                ])->setStatusCode(404);
            }
            
            // Return form data for public viewing
            return $this->response->setJSON([
                'status' => 'success',
                'data' => [
                    'id' => $form['id'],
                    'case_number' => $form['case_number'],
                    'patient_name' => $form['patient_name'],
                    'hospital_name' => $form['hospital_name'],
                    'examination_date' => $form['examination_date'],
                    'report_date' => $form['report_date'],
                    'verification_code' => $form['verification_code'],
                    'form_data' => $form['form_data'],
                    'created_at' => $form['created_at']
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Medical form verification error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'An error occurred during verification'
            ])->setStatusCode(500);
        }
    }
}
