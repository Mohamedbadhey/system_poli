<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class UserController extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format = 'json';
    
    /**
     * Get all users
     * GET /admin/users
     */
    public function index()
    {
        $userModel = model('App\Models\UserModel');
        $centerId = $this->request->getGet('center_id');
        $role = $this->request->getGet('role');
        
        $builder = $userModel->select('users.*, police_centers.center_name')
            ->join('police_centers', 'police_centers.id = users.center_id');
        
        if ($centerId) {
            $builder->where('users.center_id', $centerId);
        }
        
        if ($role) {
            $builder->where('users.role', $role);
        }
        
        $users = $builder->findAll();
        
        // Remove password hashes
        foreach ($users as &$user) {
            unset($user['password_hash']);
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $users
        ]);
    }
    
    /**
     * Create new user
     * POST /admin/users
     */
    public function create()
    {
        $rules = [
            'center_id' => 'required|integer',
            'username' => 'required|min_length[3]|max_length[50]|is_unique[users.username]',
            'email' => 'required|valid_email|is_unique[users.email]',
            'password' => 'required|min_length[8]',
            'full_name' => 'required|min_length[3]',
            'role' => 'required|in_list[super_admin,admin,ob_officer,investigator,court_user]',
            'badge_number' => 'permit_empty|max_length[50]',
            'phone' => 'permit_empty|max_length[20]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        // Get input data (works for both JSON and form-data)
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        
        $data = [
            'center_id' => $input['center_id'] ?? null,
            'username' => $input['username'] ?? null,
            'email' => $input['email'] ?? null,
            'password' => $input['password'] ?? null,
            'full_name' => $input['full_name'] ?? null,
            'phone' => $input['phone'] ?? null,
            'role' => $input['role'] ?? null,
            'badge_number' => $input['badge_number'] ?? null,
            'is_active' => 1,
            'created_by' => $this->request->userId
        ];
        
        $userModel = model('App\Models\UserModel');
        $userId = $userModel->insert($data);
        
        if (!$userId) {
            return $this->fail('Failed to create user', 500);
        }
        
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'User created successfully',
            'data' => ['id' => $userId]
        ]);
    }
    
    /**
     * Get user details
     * GET /admin/users/{id}
     */
    public function show($id = null)
    {
        $userModel = model('App\Models\UserModel');
        $user = $userModel->getUserWithCenter($id);
        
        if (!$user) {
            return $this->failNotFound('User not found');
        }
        
        unset($user['password_hash']);
        
        return $this->respond([
            'status' => 'success',
            'data' => $user
        ]);
    }
    
    /**
     * Update user
     * PUT /admin/users/{id}
     */
    public function update($id = null)
    {
        $userModel = model('App\Models\UserModel');
        $user = $userModel->find($id);
        
        if (!$user) {
            return $this->failNotFound('User not found');
        }
        
        $rules = [
            'username' => 'permit_empty|min_length[3]|max_length[50]',
            'email' => 'permit_empty|valid_email',
            'full_name' => 'permit_empty|min_length[3]',
            'phone' => 'permit_empty|max_length[20]',
            'badge_number' => 'permit_empty|max_length[50]',
            'center_id' => 'permit_empty|integer',
            'role' => 'permit_empty|in_list[super_admin,admin,ob_officer,investigator,court_user]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        // Get input data - works for both JSON and form-data
        $json = $this->request->getJSON(true);
        $data = $json ?? $this->request->getRawInput();
        
        // Debug log
        log_message('debug', 'User update data received: ' . json_encode($data));
        
        // Handle password separately (only if provided and not empty)
        if (!empty($data['password'])) {
            // Password will be hashed by the model's beforeUpdate callback
            // Keep it in $data
        } else {
            // Remove empty password field
            unset($data['password']);
        }
        
        // Remove password_confirm if present
        unset($data['password_confirm']);
        
        // Remove rank field if present (doesn't exist in database)
        unset($data['rank']);
        
        if (empty($data)) {
            return $this->fail('No data to update', 400);
        }
        
        try {
            // Skip model validation since we already validated with controller rules
            $result = $userModel->skipValidation(true)->update($id, $data);
            
            if (!$result) {
                log_message('error', 'User update failed - model returned false');
                return $this->fail('Failed to update user', 500);
            }
            
            log_message('debug', 'User updated successfully: ' . $id);
        } catch (\Exception $e) {
            log_message('error', 'User update exception: ' . $e->getMessage());
            return $this->fail(['error' => 'Failed to update user', 'message' => $e->getMessage()], 500);
        }
        
        return $this->respond([
            'status' => 'success',
            'message' => 'User updated successfully'
        ]);
    }
    
    /**
     * Delete user (soft delete)
     * DELETE /admin/users/{id}
     */
    public function delete($id = null)
    {
        $userModel = model('App\Models\UserModel');
        
        // Don't allow deleting yourself
        if ($id == $this->request->userId) {
            return $this->fail('Cannot delete your own account', 400);
        }
        
        $user = $userModel->find($id);
        if (!$user) {
            return $this->failNotFound('User not found');
        }
        
        // Soft delete by deactivating
        $userModel->update($id, ['is_active' => 0]);
        
        return $this->respondDeleted([
            'status' => 'success',
            'message' => 'User deactivated successfully'
        ]);
    }
    
    /**
     * Toggle user status
     * POST /admin/users/{id}/toggle-status
     */
    public function toggleStatus($id = null)
    {
        $userModel = model('App\Models\UserModel');
        $user = $userModel->find($id);
        
        if (!$user) {
            return $this->failNotFound('User not found');
        }
        
        if ($id == $this->request->userId) {
            return $this->fail('Cannot change your own status', 400);
        }
        
        $newStatus = $user['is_active'] ? 0 : 1;
        $userModel->update($id, ['is_active' => $newStatus]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'User status updated',
            'data' => ['is_active' => $newStatus]
        ]);
    }
}
