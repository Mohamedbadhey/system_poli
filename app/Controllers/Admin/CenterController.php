<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class CenterController extends ResourceController
{
    protected $modelName = 'App\Models\PoliceCenterModel';
    protected $format = 'json';
    
    public function index()
    {
        $centerModel = model('App\Models\PoliceCenterModel');
        $centers = $centerModel->findAll();
        
        // Add statistics for each center
        foreach ($centers as &$center) {
            $center['stats'] = $centerModel->getCenterStats($center['id']);
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $centers
        ]);
    }
    
    public function create()
    {
        $rules = [
            'center_code' => 'required|max_length[20]|is_unique[police_centers.center_code]',
            'center_name' => 'required|max_length[200]',
            'location' => 'required|max_length[255]',
            'phone' => 'permit_empty|max_length[20]',
            'email' => 'permit_empty|valid_email'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        // Get input data (works for both JSON and form-data)
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        
        $data = [
            'center_code' => $input['center_code'] ?? null,
            'center_name' => $input['center_name'] ?? null,
            'location' => $input['location'] ?? null,
            'gps_latitude' => $input['gps_latitude'] ?? null,
            'gps_longitude' => $input['gps_longitude'] ?? null,
            'phone' => $input['phone'] ?? null,
            'email' => $input['email'] ?? null,
            'is_active' => 1
        ];
        
        $centerModel = model('App\Models\PoliceCenterModel');
        
        try {
            $centerId = $centerModel->insert($data);
            
            if (!$centerId) {
                $errors = $centerModel->errors();
                log_message('error', 'Center insertion failed: ' . json_encode($errors));
                return $this->fail(['error' => 'Failed to create center', 'validation_errors' => $errors], 500);
            }
            
            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Police center created successfully',
                'data' => ['id' => $centerId, 'center' => $centerModel->find($centerId)]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Center creation exception: ' . $e->getMessage());
            return $this->fail(['error' => 'Failed to create center', 'message' => $e->getMessage()], 500);
        }
    }
    
    public function show($id = null)
    {
        $centerModel = model('App\Models\PoliceCenterModel');
        $center = $centerModel->find($id);
        
        if (!$center) {
            return $this->failNotFound('Center not found');
        }
        
        $center['stats'] = $centerModel->getCenterStats($id);
        
        return $this->respond([
            'status' => 'success',
            'data' => $center
        ]);
    }
    
    public function update($id = null)
    {
        $centerModel = model('App\Models\PoliceCenterModel');
        if (!$centerModel->find($id)) {
            return $this->failNotFound('Center not found');
        }
        
        $data = $this->request->getRawInput();
        unset($data['center_code']); // Prevent changing center code
        
        $centerModel->update($id, $data);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Center updated successfully'
        ]);
    }
    
    public function delete($id = null)
    {
        $centerModel = model('App\Models\PoliceCenterModel');
        
        // Check if center has users or cases
        $db = \Config\Database::connect();
        $userCount = $db->table('users')->where('center_id', $id)->countAllResults();
        $caseCount = $db->table('cases')->where('center_id', $id)->countAllResults();
        
        if ($userCount > 0 || $caseCount > 0) {
            return $this->fail('Cannot delete center with existing users or cases. Deactivate instead.', 400);
        }
        
        $centerModel->delete($id);
        
        return $this->respondDeleted([
            'status' => 'success',
            'message' => 'Center deleted successfully'
        ]);
    }
}
